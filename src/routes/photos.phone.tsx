"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Smartphone } from "lucide-react";
import { PhotosHeader } from "@/components/photos-header";

export const Route = createFileRoute("/photos/phone")({ component: SearchByPhone });

function SearchByPhone() {
  const [phone, setPhone] = useState("");
  const [lookedUp, setLookedUp] = useState(false);
  const ready = phone.replace(/\D/g, "").length >= 10;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <PhotosHeader title="Phone check-in" />
      <main className="mx-auto max-w-md px-5 py-16">
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-md bg-surface">
            <Smartphone className="size-7 text-gold" />
          </div>
          <h1 className="font-hero text-4xl text-fg">ENTER YOUR NUMBER</h1>
          <p className="mt-3 text-muted">Use the same number you checked in with at a WTAE night.</p>
        </div>
        <label htmlFor="phone-lookup" className="sr-only">
          Phone number
        </label>
        <input
          id="phone-lookup"
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setLookedUp(false);
          }}
          placeholder="(404) 555-0123"
          className="mt-8 h-12 w-full rounded-md border border-border bg-elevated px-4 text-center text-lg tracking-wide text-fg placeholder:text-subtle outline-none focus:border-gold"
        />
        <button
          type="button"
          disabled={!ready}
          onClick={() => setLookedUp(true)}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold font-semibold text-gold-fg disabled:opacity-40"
        >
          Find my photos
        </button>
        {lookedUp ? (
          <div className="mt-8 rounded-md border border-border bg-surface p-5 text-center">
            <p className="text-fg">No check-in found for that number.</p>
            <p className="mt-2 text-sm text-muted">
              Phone lookup only works if you checked in at a WTAE-covered event. Use the event code or face scan instead.
            </p>
            <Link
              to="/photos/event"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-medium text-gold-fg"
            >
              Search by event or code
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : null}
        <p className="mt-8 text-center text-sm text-subtle">Used only to locate your photos. We do not invent matches.</p>
      </main>
    </div>
  );
}
