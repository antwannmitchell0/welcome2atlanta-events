"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/creators")({ component: Creators });

function Creators() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-16">
        <p className="text-xs tracking-[0.2em] text-accent">FOR PHOTOGRAPHERS</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl tracking-tight md:text-6xl">
          Your eye.
          <br />
          <span className="text-accent">Atlanta’s nights.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          Independent shooters covering the rooms that make the city. Keep your own clients. Take the work that fits. We reply with the next step — not a schedule dump.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Card title="You choose the night" body="Offers come with the event, call time, and fee. Accept or pass." />
          <Card title="Clear pay" body="You know the number before you show up. No chasing the invoice." />
          <Card title="The work gets seen" body="Released galleries live here. Organizers booking next can see the room you shot." />
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <h2 className="font-display text-3xl">Apply in five minutes</h2>
            <p className="mt-3 text-muted">
              Name, city, Instagram, when you’re free. That’s enough to start. Insurance and assignments come after we talk.
            </p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-elevated text-accent">
                <Check className="size-6" />
              </div>
              <h3 className="mt-4 font-display text-2xl">You’re in the pile.</h3>
              <p className="mt-2 text-muted">
                We’ll look at the work and reply from hello@welcome2atlantaevents.com.
              </p>
              <button type="button" onClick={() => setSent(false)} className="mt-6 text-sm text-accent">
                Submit another
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-6">
              <label className="block">
                <span className="mb-2 block text-sm text-muted">Name</span>
                <input
                  name="name"
                  required
                  className="h-12 w-full rounded-xl border border-border bg-bg px-4 text-fg outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-muted">City</span>
                <input
                  name="city"
                  required
                  defaultValue="Atlanta"
                  className="h-12 w-full rounded-xl border border-border bg-bg px-4 text-fg outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-muted">Instagram</span>
                <input
                  name="instagram"
                  required
                  placeholder="@yourwork"
                  className="h-12 w-full rounded-xl border border-border bg-bg px-4 text-fg placeholder:text-subtle outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-muted">Availability</span>
                <select
                  name="availability"
                  required
                  className="h-12 w-full rounded-xl border border-border bg-bg px-4 text-fg outline-none focus:border-accent"
                >
                  <option value="weekends">Weekends</option>
                  <option value="weeknights">Weeknights</option>
                  <option value="both">Weekends and weeknights</option>
                  <option value="festivals">Festivals and large rooms</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-muted">Anything else</span>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Optional."
                  className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-fg placeholder:text-subtle outline-none focus:border-accent"
                />
              </label>
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-fg"
              >
                Apply
                <ArrowRight className="size-4" />
              </button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
