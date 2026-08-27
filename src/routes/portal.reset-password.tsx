"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/portal/reset-password")({
  component: ResetPassword,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [{ title: "Choose a new password · WTAE" }, { name: "robots", content: "noindex" }],
  }),
});

function ResetPassword() {
  const { token } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    if (!token) {
      setError("This reset link is missing or expired.");
      return;
    }
    const result = await authClient.resetPassword({ newPassword: password, token });
    if (result.error) {
      setError("This reset link is missing or expired.");
      return;
    }
    setDone(true);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-5 text-fg">
      <div className="w-full max-w-sm space-y-5">
        <h1 className="font-display text-4xl">New password</h1>
        {done ? (
          <p className="text-muted">
            Password updated.{" "}
            <Link to="/portal/login" search={{ next: "/portal" }} className="text-accent">
              Sign in
            </Link>
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm text-muted">
              New password
              <input
                name="password"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-4 outline-none focus:border-accent"
              />
            </label>
            {error ? (
              <p className="text-sm text-live" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="h-12 w-full rounded-full bg-accent font-semibold text-accent-fg">
              Update password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
