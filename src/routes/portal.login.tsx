"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth/client";
import {
  INVALID_LOGIN_MESSAGE,
  LOGIN_NOT_READY_MESSAGE,
  LOGIN_UNAVAILABLE_MESSAGE,
} from "@/lib/portal/guard";
import { loginCopy, type LoginHealth } from "@/lib/portal/login-health";
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
  const [health, setHealth] = useState<LoginHealth | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/portal/login-health")
      .then(async (response) => {
        if (!response.ok) throw new Error("health");
        return (await response.json()) as LoginHealth;
      })
      .then((payload) => {
        if (!cancelled) setHealth(payload);
      })
      .catch(() => {
        if (!cancelled) {
          setHealth({
            database: false,
            ownerEmailConfigured: false,
            ownerExists: false,
            authSecret: false,
            resendConfigured: false,
            canSignIn: false,
            canClaim: false,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const copy = health ? loginCopy(health) : null;
  const showForm = copy?.mode === "signin" || copy?.mode === "claim";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setError(null);
    try {
      if (copy?.mode === "claim") {
        const claimed = await fetch("/api/portal/claim-owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const payload = (await claimed.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null;
        if (!claimed.ok || !payload?.ok) {
          setError(payload?.error || LOGIN_UNAVAILABLE_MESSAGE);
          setBusy(false);
          return;
        }
      }
      const result = await authClient.signIn.email({ email, password, callbackURL: next });
      if (result.error) {
        const status = "status" in result.error ? Number(result.error.status) : 0;
        if (status === 503) setError(LOGIN_NOT_READY_MESSAGE);
        else setError(INVALID_LOGIN_MESSAGE);
        setBusy(false);
        return;
      }
      window.location.assign(next);
    } catch {
      setError(LOGIN_UNAVAILABLE_MESSAGE);
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-5 text-fg">
      <div className="w-full max-w-sm space-y-5">
        <Link to="/" className="font-display text-3xl">
          WTAE
        </Link>
        <h1 className="font-display text-4xl">
          {copy?.mode === "claim" ? "Create owner login" : "Owner login"}
        </h1>
        <p className="text-sm text-muted">
          {copy?.detail ?? "Checking owner login…"}
        </p>
        {showForm ? (
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
                autoComplete={copy?.mode === "claim" ? "new-password" : "current-password"}
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
              {busy
                ? copy?.mode === "claim"
                  ? "Creating login…"
                  : "Signing in…"
                : copy?.mode === "claim"
                  ? "Create owner login"
                  : "Sign in"}
            </button>
          </form>
        ) : error ? (
          <p className="text-sm text-live" role="alert">
            {error}
          </p>
        ) : null}
        {copy?.mode === "signin" ? (
          <Link to="/portal/forgot-password" className="block text-sm text-accent">
            Forgot password
          </Link>
        ) : null}
      </div>
    </main>
  );
}
