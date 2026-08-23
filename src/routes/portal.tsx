"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { claimFounder, getFounderAccess } from "@/lib/wtae-data";

type AccessStatus = "granted" | "claim-required" | "denied";

export const Route = createFileRoute("/portal")({
  component: PortalShell,
  head: () => ({
    meta: [
      { title: "Portal · WTAE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const nav = [
  { to: "/portal", label: "Overview", exact: true },
  { to: "/portal/events", label: "Events", exact: false },
  { to: "/portal/requests", label: "Requests", exact: false },
  { to: "/portal/photographers", label: "Photographers", exact: false },
] as const;

function PortalShell() {
  const { user, isPending } = useCurrentUserState();
  const [access, setAccess] = useState<AccessStatus | "loading">("loading");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!user) return;
    getFounderAccess()
      .then((result) => setAccess(result.status))
      .catch(() => setAccess("denied"));
  }, [user]);

  async function onClaim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const secret = String(form.get("secret") ?? "");
    setClaiming(true);
    setClaimError(null);
    try {
      await claimFounder({ data: { secret } });
      setAccess("granted");
    } catch {
      setClaimError("That claim code is not valid, or founder setup is already closed.");
    } finally {
      setClaiming(false);
    }
  }

  if (isPending) {
    return <div className="min-h-screen bg-bg p-8 text-muted">Loading the control room…</div>;
  }
  if (!user) return <RedirectToSignIn />;

  if (access === "loading") {
    return <div className="min-h-screen bg-bg p-8 text-muted">Checking founder access…</div>;
  }

  if (access !== "granted") {
    return (
      <div className="min-h-screen bg-bg text-fg">
        <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
            <Link to="/" className="font-hero text-2xl">
              WTAE
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm text-muted hover:text-fg">
                Public site
              </Link>
              <UserButton />
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-lg px-5 py-16">
          {access === "claim-required" ? (
            <>
              <h1 className="font-hero text-5xl">FOUNDER CLAIM</h1>
              <p className="mt-3 text-muted">
                This portal is closed to the public. Enter the one-time founder claim code to take
                ownership. After this, bootstrap closes permanently.
              </p>
              <form onSubmit={(e) => void onClaim(e)} className="mt-8 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm text-muted">Claim code</span>
                  <input
                    name="secret"
                    type="password"
                    required
                    minLength={24}
                    autoComplete="off"
                    className="h-12 w-full rounded-md border border-border bg-elevated px-4 outline-none focus:border-gold"
                  />
                </label>
                {claimError ? (
                  <p className="text-sm text-live" role="alert">
                    {claimError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={claiming}
                  className="h-12 rounded-full bg-gold px-6 font-semibold text-gold-fg disabled:opacity-60"
                >
                  {claiming ? "Claiming…" : "Claim founder access"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-hero text-5xl">ACCESS</h1>
              <p className="mt-3 text-muted">This portal is for WTAE founders only.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/portal" className="font-hero text-2xl">
              WTAE
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.exact }}
                  className="text-muted hover:text-fg"
                  activeProps={{ className: "text-gold" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-muted hover:text-fg">
              Public site
            </Link>
            <UserButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <Outlet />
      </div>
    </div>
  );
}
