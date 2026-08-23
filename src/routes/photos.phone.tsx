"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Smartphone } from "lucide-react";

export const Route = createFileRoute("/photos/phone")({ component: SearchByPhone });

function SearchByPhone() {
  const [phone, setPhone] = useState("");
  const [found, setFound] = useState(false);
  const ready = phone.replace(/\D/g, "").length >= 10;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between px-5">
          <Link to="/photos" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <span className="text-sm text-accent">Search by Phone</span>
          <span className="w-12" />
        </div>
      </header>
      <main className="mx-auto max-w-md px-5 py-16">
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-surface">
            <Smartphone className="size-7 text-accent" />
          </div>
          <h1 className="font-display text-3xl text-fg">Enter your number</h1>
          <p className="mt-3 text-muted">Use the same number you checked in with.</p>
        </div>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setFound(false);
          }}
          placeholder="(404) 555-0123"
          className="mt-8 h-12 w-full rounded-xl border border-border bg-surface px-4 text-center text-lg tracking-wide text-fg placeholder:text-subtle outline-none focus:border-accent"
        />
        <button
          type="button"
          disabled={!ready}
          onClick={() => setFound(true)}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-fg disabled:opacity-40"
        >
          Find My Photos
          <ArrowRight className="size-4" />
        </button>
        {found ? (
          <div className="mt-8 rounded-xl border border-border bg-surface p-5 text-center">
            <p className="text-fg">We found 24 photos from Invest Fest Atlanta.</p>
            <Link
              to="/events/$slug"
              params={{ slug: "invest-fest" }}
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-fg"
            >
              Open gallery
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : null}
        <p className="mt-8 text-center text-sm text-subtle">Used only to locate your photos.</p>
      </main>
    </div>
  );
}
