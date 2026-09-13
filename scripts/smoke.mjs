import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Server startup timeout")),
      20000,
    );
    server.stdout.on("data", (d) => {
      if (String(d).includes("Ready")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    server.stderr.on("data", (d) => process.stderr.write(d));
    server.on("exit", (code) => reject(new Error(`Server exited ${code}`)));
  });
  for (const locale of ["tr", "ar"])
    for (const path of [
      "",
      "/shop",
      "/products/gul-kurusu-orgu-canta",
      "/admin",
      "/account",
      "/checkout",
      "/policy",
    ]) {
      const r = await fetch(`http://127.0.0.1:3100/${locale}${path}`);
      assert.equal(r.status, 200, `${locale}${path}`);
      const html = await r.text();
      assert.ok(html.includes(`lang="${locale}"`), `${locale} lang`);
      assert.ok(html.includes(`dir="${locale === "ar" ? "rtl" : "ltr"}"`));
      assert.ok(html.includes("Jawaher"));
      assert.ok(!html.includes("NEXT_HTTP_ERROR_FALLBACK;500"));
      console.log(`PASS /${locale}${path}`);
    }
  const no = await fetch("http://127.0.0.1:3100/tr/products/missing");
  assert.equal(no.status, 404);
  const robots = await (await fetch("http://127.0.0.1:3100/robots.txt")).text();
  assert.ok(robots.includes("/ar/admin"));
  const disabled = await fetch("http://127.0.0.1:3100/api/checkout", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "content-type": "application/json",
    },
    body: "{}",
  });
  assert.equal(disabled.status, 503);
  const hook = await fetch("http://127.0.0.1:3100/api/whop/webhook", {
    method: "POST",
    body: "{}",
  });
  assert.equal(hook.status, 503);
  console.log(
    "PASS missing-product 404, crawler exclusions, disabled unconfigured payments",
  );
} finally {
  server.kill("SIGTERM");
}
