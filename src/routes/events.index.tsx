"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, Check, Share2 } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { submitCoverageRequest, type BookingSuccess } from "@/lib/portal/coverage-requests";
import { bookingNeighborhoods } from "@/lib/reel";
import { GUEST_PHOTOS_LINE, organizerSkus } from "@/lib/skus";

export const Route = createFileRoute("/events/")({ component: ForEvents });

function ForEvents() {
  const [result, setResult] = useState<BookingSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    setPending(true);
    try {
      const booked = await submitCoverageRequest({
        data: {
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          date: String(data.get("date") ?? ""),
          neighborhood: String(data.get("neighborhood") ?? ""),
          sku: String(data.get("sku") ?? ""),
          venue: String(data.get("venue") ?? ""),
          notes: String(data.get("notes") ?? ""),
        },
      });
      setResult(booked);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that request.");
    } finally {
      setPending(false);
    }
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
          We shoot the room, release an approved guest gallery, and give Atlanta somewhere to find themselves after the lights go out. Pick a SKU. You leave with a code.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {organizerSkus.map((sku) => (
            <article key={sku.id} className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs tracking-[0.2em] text-accent">{sku.name}</p>
              <h2 className="mt-2 font-display text-3xl">{sku.priceLabel}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{sku.summary}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">{GUEST_PHOTOS_LINE}</p>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <h2 className="font-display text-3xl">Request a date</h2>
            <p className="mt-3 text-muted">
              One form. You get a unique ATL code and the gallery URL on submit. We reply from hello@welcome2atlantaevents.com.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              <li className="flex gap-2">
                <Camera className="mt-0.5 size-4 shrink-0 text-accent" />
                Guest gallery with event code — no account required
              </li>
              <li className="flex gap-2">
                <Share2 className="mt-0.5 size-4 shrink-0 text-accent" />
                Printable QR card for the door. Face scan stays on-device.
              </li>
            </ul>
            <Link to="/explore" className="mt-8 inline-flex items-center gap-1 text-sm text-accent">
              See live galleries
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {result ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-elevated text-accent">
                <Check className="size-6" />
              </div>
              <h3 className="mt-4 font-display text-2xl">You’re on the book.</h3>
              <p className="mt-2 text-muted">
                {result.skuName} {result.skuPrice} · {result.neighborhood}
              </p>
              <p className="mt-6 font-display text-4xl tracking-[0.12em] text-accent">{result.code}</p>
              <p className="mt-3 text-sm text-muted">
                Gallery URL will be{" "}
                <Link to="/photos" search={{ code: result.code }} className="text-accent">
                  {result.galleryPath}
                </Link>
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  to="/print/code/$code"
                  params={{ code: result.code }}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-accent font-semibold text-accent-fg"
                >
                  Print door card
                </Link>
                <button type="button" onClick={() => setResult(null)} className="h-11 text-sm text-accent">
                  Book another date
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-xl border border-border bg-surface p-6">
              <Field label="Your name" name="name" required placeholder="Who’s booking" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" name="email" type="email" required placeholder="you@theevent.com" />
                <Field label="Phone" name="phone" type="tel" required placeholder="404…" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date" name="date" type="date" required />
                <label className="block">
                  <span className="mb-2 block text-sm text-muted">Neighborhood</span>
                  <select
                    name="neighborhood"
                    required
                    defaultValue=""
                    className="h-12 w-full rounded-xl border border-border bg-bg px-4 text-fg outline-none focus:border-accent"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {bookingNeighborhoods.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm text-muted">SKU</span>
                <select
                  name="sku"
                  required
                  defaultValue="room"
                  className="h-12 w-full rounded-xl border border-border bg-bg px-4 text-fg outline-none focus:border-accent"
                >
                  {organizerSkus.map((sku) => (
                    <option key={sku.id} value={sku.id}>
                      {sku.name} {sku.priceLabel}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Venue / room name" name="venue" required placeholder="The room on Peachtree" />
              <label className="block">
                <span className="mb-2 block text-sm text-muted">Notes</span>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Guest count, vibe, anything we should know."
                  className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-fg placeholder:text-subtle outline-none focus:border-accent"
                />
              </label>
              {error ? <p className="text-sm text-live">{error}</p> : null}
              <button
                type="submit"
                disabled={pending}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-fg disabled:opacity-40"
              >
                {pending ? "Booking…" : "Request a date"}
                <ArrowRight className="size-4" />
              </button>
              <p className="text-center text-xs text-subtle">{GUEST_PHOTOS_LINE} Starts a conversation. Not a charge tonight.</p>
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
