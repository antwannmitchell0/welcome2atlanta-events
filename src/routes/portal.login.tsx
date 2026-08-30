"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth/client";
import { INVALID_LOGIN_MESSAGE } from "@/lib/portal/guard";
import { safePortalNext } from "@/lib/portal/redirect";

export const Route = createFileRoute("/portal/login")({
  component: PortalLogin,
  validateSearch: (search: Record<string, unknown>) => ({
    next: safePortalNext(search.next),
  }),
  head: () => ({
    meta: [
      { title: "Owner login · WTAE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function PortalLogin() {
  const { next } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setError(null);
    try {
      const result = await authClient.signIn.email({ email, password, callbackURL: next });
      if (result.error) {
        setError(INVALID_LOGIN_MESSAGE);
        setBusy(false);
        return;
      }
      window.location.assign(next);
    } catch {
      setError(INVALID_LOGIN_MESSAGE);
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-5 text-fg">
      <div className="w-full max-w-sm space-y-5">
        <Link to="/" className="font-display text-3xl">
          WTAE
        </Link>
        <h1 className="font-display text-4xl">Owner login</h1>
        <p className="text-sm text-muted">Email and password. No public registration.</p>
        <form onSubmit={onSubmit} className="space-y-4" method="post">
          <label className="block text-sm text-muted">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-4 outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm text-muted">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={10}
              autoComplete="current-password"
              className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-4 outline-none focus:border-accent"
            />
          </label>
          {error ? (
            <p className="text-sm text-live" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-full bg-accent font-semibold text-accent-fg disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <Link to="/portal/forgot-password" className="block text-sm text-accent">
          Forgot password
        </Link>
      </div>
    </main>
  );
}
