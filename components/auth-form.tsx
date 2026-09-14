"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserDb } from "@/lib/browser-db";
import { messages } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
export function AuthForm({
  locale,
  enabled,
}: {
  locale: Locale;
  enabled: boolean;
}) {
  const t = messages[locale];
  const router = useRouter();
  const [signup, setSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="panel form auth-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        try {
          const db = browserDb();
          const email = String(f.get("email"));
          const password = String(f.get("password"));
          const { error } = signup
            ? await db.auth.signUp({
                email,
                password,
                options: {
                  emailRedirectTo: `${location.origin}/auth/callback?locale=${locale}`,
                },
              })
            : await db.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (signup) setMessage(t.authCheck);
          else router.refresh();
        } catch {
          setMessage(t.error);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Image
        src="/brand/logo.svg"
        width={60}
        height={60}
        alt="Jawaher Crochet"
      />
      <p className="eyebrow">JAWAHER CROCHET</p>
      <h2>{signup ? t.signup : t.login}</h2>
      <p>{enabled ? t.continueAccount : t.demo}</p>
      <label>
        {t.email}
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        {t.password}
        <input
          name="password"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={8}
          required
        />
      </label>
      <button className="button" disabled={!enabled || busy}>
        {busy ? t.loading : signup ? t.signup : t.login}
      </button>
      <button
        className="text-link"
        type="button"
        onClick={() => {
          setSignup(!signup);
          setMessage("");
        }}
      >
        {signup ? t.login : t.signup}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
export function Logout({ locale }: { locale: Locale }) {
  const router = useRouter();
  return (
    <button
      className="button secondary"
      onClick={async () => {
        await browserDb().auth.signOut();
        router.refresh();
      }}
    >
      {messages[locale].logout}
    </button>
  );
}
