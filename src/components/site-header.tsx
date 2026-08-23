"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/explore", label: "Explore" },
  { to: "/photos", label: "Find Photos" },
  { to: "/events", label: "Get Covered" },
  { to: "/creators", label: "Photographers" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="font-hero text-2xl text-fg">WTAE</span>
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-gold sm:inline">
            Welcome To Atlanta Events
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-muted transition-colors hover:text-fg"
              activeProps={{ className: "text-gold" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/explore"
            className="hidden h-10 items-center rounded-full bg-gold px-4 text-sm font-semibold text-gold-fg transition-transform duration-150 active:scale-95 sm:inline-flex"
          >
            Explore Events
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border text-fg md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
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
                className="rounded-md px-3 py-3 text-fg"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/explore"
              className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-gold px-4 text-sm font-semibold text-gold-fg"
              onClick={() => setOpen(false)}
            >
              Explore Events
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
