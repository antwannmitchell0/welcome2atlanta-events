"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Area, Field, Honeypot, SelectField } from "@/components/field";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { submitEventRequest } from "@/lib/wtae-data";

export const Route = createFileRoute("/events/")({
  component: ForEvents,
  head: () => ({
    meta: [
      { title: "Get Your Event Covered · WTAE" },
      { name: "description", content: "Request WTAE photography coverage for your Atlanta event." },
    ],
  }),
});

function ForEvents() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("loading");
    setMessage("");
    try {
      await submitEventRequest({
        data: {
          requester_name: String(data.requester_name ?? ""),
          email: String(data.email ?? ""),
          phone: String(data.phone ?? ""),
          event_name: String(data.event_name ?? ""),
          event_type: String(data.event_type ?? ""),
          event_date: String(data.event_date ?? ""),
          event_time: String(data.event_time ?? ""),
          venue_name: String(data.venue_name ?? ""),
          venue_address: String(data.venue_address ?? ""),
          expected_attendance: String(data.expected_attendance ?? ""),
          website_or_event_link: String(data.website_or_event_link ?? ""),
          instagram: String(data.instagram ?? ""),
          coverage_requested: String(data.coverage_requested ?? ""),
          message: String(data.message ?? ""),
          website: String(data.website ?? ""),
        },
      });
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not send. Try again.");
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-16">
        <p className="font-hero text-sm tracking-[0.24em] text-gold">GET YOUR EVENT COVERED</p>
        <h1 className="mt-3 font-hero text-5xl md:text-7xl">
          COVERAGE FOR THE NIGHT.
          <br />
          <span className="text-gold">A GALLERY FOR THE CITY.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Tell us the date. We reply with fit and a number — no surprise contract.
        </p>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <h2 className="font-hero text-4xl">HOW IT WORKS</h2>
            <ol className="mt-6 space-y-4 text-muted">
              <li><span className="text-gold">01</span> Scope the room, the moments, the rights.</li>
              <li><span className="text-gold">02</span> Independent shooters on a clear assignment.</li>
              <li><span className="text-gold">03</span> Guests find photos with an event code.</li>
            </ol>
          </div>

          {status === "success" ? (
            <div className="rounded-md border border-border bg-surface p-8" role="status">
              <p className="font-hero text-4xl">WE GOT IT.</p>
              <p className="mt-3 text-muted">We’ll reply from hello@welcome2atlantaevents.com.</p>
              <button type="button" className="mt-6 text-sm text-gold" onClick={() => setStatus("idle")}>
                Send another
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => void onSubmit(e)}
              className="relative space-y-4 rounded-md border border-border bg-surface p-6"
              data-track="coverage-form-started"
            >
              <Honeypot />
              <Field label="Your name" name="requester_name" required autoComplete="name" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" name="email" type="email" required autoComplete="email" />
                <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
              </div>
              <Field label="Event name" name="event_name" required />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Event type" name="event_type">
                  <option value="">Select</option>
                  <option>Nightlife</option>
                  <option>Music</option>
                  <option>Festival</option>
                  <option>Business</option>
                  <option>Community</option>
                  <option>Private</option>
                </SelectField>
                <Field label="Expected attendance" name="expected_attendance" placeholder="e.g. 400" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date" name="event_date" type="date" />
                <Field label="Time" name="event_time" placeholder="9:00 PM" />
              </div>
              <Field label="Venue" name="venue_name" />
              <Field label="Address" name="venue_address" />
              <Field label="Event link" name="website_or_event_link" />
              <Field label="Instagram" name="instagram" placeholder="@theevent" />
              <Field label="Coverage needed" name="coverage_requested" placeholder="Full night, recap, guest gallery…" />
              <Area label="Anything else" name="message" />
              {status === "error" ? (
                <p className="text-sm text-live" role="alert">
                  {message}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex h-12 w-full items-center justify-center rounded-full bg-gold font-semibold text-gold-fg disabled:opacity-60"
                data-track="coverage-form-submitted"
              >
                {status === "loading" ? "Sending…" : "Request coverage"}
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
