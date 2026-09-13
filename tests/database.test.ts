import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("Postgres order, inventory, webhook and RLS invariants", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit integer,allowed_mime_types text[]);create table storage.objects(id uuid,bucket_id text);`,
    );
    await db.exec(
      readFileSync(
        new URL("../supabase/migrations/001_store.sql", import.meta.url),
        "utf8",
      ).replace("create extension if not exists pgcrypto;", ""),
    );
    const user = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      product = "11111111-1111-4111-8111-111111111111",
      key = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    await db.query("insert into auth.users values($1),($2)", [user, other]);
    await db.query(
      `insert into products(id,slug,name_tr,name_ar,description_tr,description_ar,category,price,stock,colors,active)values($1,'test','Test','اختبار','Test product','منتج تجريبي','bags',89000,2,ARRAY['rose'],true)`,
      [product],
    );
    await db.exec("update store_settings set shipping_fee=9000");
    const items = JSON.stringify([
      { id: product, quantity: 1, color: "rose", price: 1 },
    ]);
    const create = async (k = key, u = user) => {
      const result = await db.query<{
        id: string;
        total: number;
        items: { price: number }[];
      }>("select * from create_store_order($1,$2,$3,$4)", [u, k, items, "{}"]);
      return result.rows[0];
    };
    const order = await create();
    assert.equal(order.total, 98000);
    assert.equal(order.items[0].price, 89000, "client prices must be ignored");
    assert.equal(
      (await create()).id,
      order.id,
      "retry must not create another order",
    );
    await db.query(
      "update orders set checkout_id='ch_test',plan_id='plan_test' where id=$1",
      [order.id],
    );
    await assert.rejects(() =>
      db.query(
        "select confirm_store_payment('bad',$1,'pay_test',1,'try','plan_test')",
        [order.id],
      ),
    );
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::integer n from webhook_events",
        )
      ).rows[0].n,
      0,
      "failed transaction must not consume the event",
    );
    await db.query(
      "select confirm_store_payment('msg_test',$1,'pay_test',98000,'try','plan_test')",
      [order.id],
    );
    await db.query(
      "select confirm_store_payment('msg_test',$1,'pay_test',98000,'try','plan_test')",
      [order.id],
    );
    assert.equal(
      (await db.query<{ stock: number }>("select stock from products")).rows[0]
        .stock,
      1,
      "duplicate webhook must not deduct inventory twice",
    );
    const reserved = await create(
      "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      other,
    );
    await assert.rejects(() => create("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"));
    await db.query(
      "update orders set created_at=now()-interval '31 minutes',plan_id='plan_late' where id=$1",
      [reserved.id],
    );
    await db.exec("update products set stock=0");
    await db.query(
      "select confirm_store_payment('msg_late',$1,'pay_late',98000,'try','plan_late')",
      [reserved.id],
    );
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select status from orders where id=$1",
          [reserved.id],
        )
      ).rows[0].status,
      "payment_review",
    );
    assert.equal(
      (await db.query<{ stock: number }>("select stock from products")).rows[0]
        .stock,
      0,
    );
    await db.exec(
      "grant usage on schema public,auth to authenticated,anon;grant select,insert,update,delete on all tables in schema public to authenticated;grant select on products,reviews,store_settings to anon;",
    );
    await db.exec(
      `set role authenticated;set request.jwt.claim.sub='${user}';`,
    );
    assert.equal(
      (await db.query("select * from orders")).rows.length,
      1,
      "another customer order must remain private",
    );
    await assert.rejects(() =>
      db.query("insert into admins(user_id) values($1)", [user]),
    );
    await db.query("update orders set status='paid' where id=$1", [
      reserved.id,
    ]);
    await db.query(
      "insert into reviews(product_id,user_id,rating,display_name,body)values($1,$2,5,'Buyer','Lovely handmade product')",
      [product, user],
    );
    await assert.rejects(() =>
      db.query(
        "insert into reviews(product_id,user_id,rating,display_name,body,approved)values($1,$2,5,'Other','Forged approved review',true)",
        [product, other],
      ),
    );
    await db.exec("reset role;");
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select status from orders where id=$1",
          [reserved.id],
        )
      ).rows[0].status,
      "payment_review",
    );
    await db.exec("set role anon;set request.jwt.claim.sub='';");
    assert.equal(
      (await db.query("select * from reviews")).rows.length,
      0,
      "unapproved reviews are private",
    );
  } finally {
    await db.close();
  }
});
