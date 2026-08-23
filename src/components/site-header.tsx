"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";

const links = [
  { to: "/photos", label: "Find Photos" },
  { to: "/events", label: "Bring WTAE" },
  { to: "/creators", label: "For Creators" },
  { to: "/explore", label: "Explore" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-50 border-b border-border">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-baseline gap-1.5" onClick={() => setOpen(false)}>
          <span className="text-[10px] font-medium tracking-[0.22em] text-accent">WELCOME TO</span>
          <span className="font-display text-lg tracking-tight text-fg">ATLANTA</span>
          <span className="text-[10px] font-medium tracking-[0.18em] text-muted">EVENTS</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="transition-colors hover:text-fg">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/photos"
            className="hidden h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 sm:inline-flex"
          >
            Find My Photos
            <ArrowRight className="size-4" />
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border text-fg md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-bg px-5 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg px-3 py-3 text-fg/90"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/photos"
              className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-fg"
              onClick={() => setOpen(false)}
            >
              Find My Photos
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
