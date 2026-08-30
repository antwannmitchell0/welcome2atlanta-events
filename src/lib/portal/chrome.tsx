"use client";

import { Link } from "@tanstack/react-router";
import { signOut } from "@/lib/auth/client";

export function PortalChrome({
  displayName,
  email,
}: {
  displayName?: string;
  email?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-5">
          <Link to="/portal" className="font-display text-xl">
            WTAE Mission Control
          </Link>
          <Link to="/portal/events/new" className="hidden text-sm text-muted hover:text-fg sm:inline">
            Create event
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted sm:inline">{displayName || email || "Owner"}</span>
          <Link to="/" className="text-muted hover:text-fg">
            Public site
          </Link>
          <button
            type="button"
            className="min-h-11 rounded-full border border-border px-4 text-muted hover:text-fg"
            onClick={() => void signOut("/portal/login")}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
