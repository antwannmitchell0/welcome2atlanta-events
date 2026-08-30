"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/forgot-password")({
  component: ForgotPassword,
  head: () => ({
    meta: [{ title: "Reset password · WTAE" }, { name: "robots", content: "noindex" }],
  }),
});

function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setBusy(true);
    try {
      await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo: "/portal/reset-password" }),
      });
    } catch {
      /* generic response */
    }
    setSent(true);
    setBusy(false);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-5 text-fg">
      <div className="w-full max-w-sm space-y-5">
        <h1 className="font-display text-4xl">Forgot password</h1>
        <p className="text-sm text-muted">
          Reset mail needs Resend. Regular owner sign-in does not.
        </p>
        {sent ? (
          <p className="text-muted">
            If that account exists and mail is configured, a reset link is on the way.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm text-muted">
              Email
              <input
                name="email"
                type="email"
                required
                className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-4 outline-none focus:border-accent"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="h-12 w-full rounded-full bg-accent font-semibold text-accent-fg"
            >
              Send reset link
            </button>
          </form>
        )}
        <Link to="/portal/login" search={{ next: "/portal" }} className="text-sm text-accent">
          Back to login
        </Link>
      </div>
    </main>
  );
}
