"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Founder Portal · WTAE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "Founder");
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const result = await authClient.signUp.email({ email, password, name, callbackURL: "/portal" });
        if (result.error) throw new Error(result.error.message);
      } else {
        const result = await authClient.signIn.email({ email, password, callbackURL: "/portal" });
        if (result.error) throw new Error(result.error.message);
      }
      window.location.assign("/portal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-5 text-fg">
      <div className="w-full max-w-sm space-y-5">
        <Link to="/" className="font-hero text-3xl">
          WTAE
        </Link>
        <h1 className="font-hero text-4xl">FOUNDER PORTAL</h1>
        <p className="text-sm text-muted">Sign in to run the operation.</p>
        {authEnabled ? (
          <>
            {GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/portal" })}
                className="h-12 w-full rounded-full border border-border text-sm hover:border-gold"
              >
                Continue with {p.label}
              </button>
            ))}
            <p className="text-center text-xs text-subtle">or email</p>
            <form onSubmit={(e) => void onEmail(e)} className="space-y-3">
              {mode === "up" ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-muted">Name</span>
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    className="h-12 w-full rounded-md border border-border bg-elevated px-4 outline-none focus:border-gold"
                  />
                </label>
              ) : null}
              <label className="block">
                <span className="mb-2 block text-sm text-muted">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="h-12 w-full rounded-md border border-border bg-elevated px-4 outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-muted">Password</span>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  className="h-12 w-full rounded-md border border-border bg-elevated px-4 outline-none focus:border-gold"
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
                className="h-12 w-full rounded-full bg-gold font-semibold text-gold-fg disabled:opacity-60"
              >
                {busy ? "Working…" : mode === "up" ? "Create account" : "Sign in"}
              </button>
            </form>
            <button
              type="button"
              className="w-full text-sm text-muted"
              onClick={() => setMode(mode === "up" ? "in" : "up")}
            >
              {mode === "up" ? "Already have an account? Sign in" : "Need an account? Create one"}
            </button>
          </>
        ) : (
          <p className="text-sm text-muted">Sign-in is disabled.</p>
        )}
      </div>
    </main>
  );
}
