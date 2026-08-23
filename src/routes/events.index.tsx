"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, Check, Share2 } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/events/")({ component: ForEvents });

function ForEvents() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-16">
        <p className="text-xs tracking-[0.2em] text-accent">BRING WTAE</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl tracking-tight md:text-6xl">
          Coverage for the night.
          <br />
          <span className="text-accent">A gallery for the city.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          We shoot the room, release an approved guest gallery, and give Atlanta somewhere to find themselves after the lights go out. Tell us the date. We’ll send a written reply — no surprise contract.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Benefit
            title="Before doors"
            body="We scope the venue, the moments that matter, and who needs the photos."
          />
          <Benefit
            title="While Atlanta shows up"
            body="Independent shooters on a clear assignment. The room gets covered, not posed to death."
          />
          <Benefit
            title="After it clears"
            body="Guests find photos with an event code. You get a recap you can actually use."
          />
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <h2 className="font-display text-3xl">Request a date</h2>
            <p className="mt-3 text-muted">
              One form. We reply from hello@welcome2atlantaevents.com with fit, coverage, and a number.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              <li className="flex gap-2">
                <Camera className="mt-0.5 size-4 shrink-0 text-accent" />
                Guest gallery with event code — no account required
              </li>
              <li className="flex gap-2">
                <Share2 className="mt-0.5 size-4 shrink-0 text-accent" />
                Approved photos only. Human review before anything goes live
              </li>
            </ul>
            <Link to="/explore" className="mt-8 inline-flex items-center gap-1 text-sm text-accent">
              See live galleries
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {sent ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-elevated text-accent">
                <Check className="size-6" />
              </div>
              <h3 className="mt-4 font-display text-2xl">We got it.</h3>
              <p className="mt-2 text-muted">
                We’ll reply from hello@welcome2atlantaevents.com. Peak weekends book out — if the date’s tight, say so.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-6 text-sm text-accent"
              >
                Send another
              </button>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="space-y-4 rounded-xl border border-border bg-surface p-6"
            >
              <Field label="Event name" name="event" required placeholder="404 After Dark" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date" name="date" type="date" required />
                <Field label="Neighborhood / venue" name="venue" required placeholder="Midtown, The BeltLine…" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" name="name" required />
                <Field label="Email" name="email" type="email" required placeholder="you@theevent.com" />
              </div>
              <Field label="Phone" name="phone" type="tel" placeholder="Optional" />
              <label className="block">
                <span className="mb-2 block text-sm text-muted">What you need</span>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Guest count, vibe, anything we should know."
                  className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-fg placeholder:text-subtle outline-none focus:border-accent"
                />
              </label>
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-fg"
              >
                Request a date
                <ArrowRight className="size-4" />
              </button>
              <p className="text-center text-xs text-subtle">Starts a conversation. Not a charge.</p>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-border bg-bg px-4 text-fg placeholder:text-subtle outline-none focus:border-accent"
      />
    </label>
  );
}

function Benefit({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="font-medium text-fg">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
