"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Area, Field, Honeypot, SelectField } from "@/components/field";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { submitPhotographerApplication } from "@/lib/wtae-data";

export const Route = createFileRoute("/creators")({
  component: Creators,
  head: () => ({
    meta: [
      { title: "Photographers · WTAE" },
      { name: "description", content: "Apply to shoot Atlanta nights with Welcome To Atlanta Events." },
    ],
  }),
});

function Creators() {
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
      await submitPhotographerApplication({
        data: {
          full_name: String(data.full_name ?? ""),
          email: String(data.email ?? ""),
          phone: String(data.phone ?? ""),
          city: String(data.city ?? ""),
          instagram: String(data.instagram ?? ""),
          portfolio_url: String(data.portfolio_url ?? ""),
          years_experience: String(data.years_experience ?? ""),
          camera_equipment: String(data.camera_equipment ?? ""),
          event_experience: String(data.event_experience ?? ""),
          transportation: String(data.transportation ?? ""),
          availability: String(data.availability ?? ""),
          why_wtae: String(data.why_wtae ?? ""),
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
        <p className="font-hero text-sm tracking-[0.24em] text-gold">PHOTOGRAPHERS</p>
        <h1 className="mt-3 font-hero text-5xl md:text-7xl">
          YOUR EYE.
          <br />
          <span className="text-gold">ATLANTA’S NIGHTS.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Keep your clients. Take the work that fits. We look at the work and reply.
        </p>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <h2 className="font-hero text-4xl">APPLY</h2>
            <p className="mt-3 text-muted">Name, city, Instagram, the nights you can shoot. That’s enough to start.</p>
          </div>
          {status === "success" ? (
            <div className="rounded-md border border-border bg-surface p-8" role="status">
              <p className="font-hero text-4xl">YOU’RE IN THE PILE.</p>
              <p className="mt-3 text-muted">We’ll look at the work and reply from hello@welcome2atlantaevents.com.</p>
              <button type="button" className="mt-6 text-sm text-gold" onClick={() => setStatus("idle")}>
                Submit another
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => void onSubmit(e)}
              className="relative space-y-4 rounded-md border border-border bg-surface p-6"
              data-track="photographer-form-started"
            >
              <Honeypot />
              <Field label="Full name" name="full_name" required autoComplete="name" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" name="email" type="email" required autoComplete="email" />
                <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
              </div>
              <Field label="City" name="city" defaultValue="Atlanta" autoComplete="address-level2" />
              <Field label="Instagram" name="instagram" required placeholder="@yourwork" />
              <Field label="Portfolio URL" name="portfolio_url" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Years shooting" name="years_experience" />
                <Field label="Transportation" name="transportation" placeholder="Car, MARTA…" />
              </div>
              <Field label="Camera / kit" name="camera_equipment" />
              <SelectField label="Availability" name="availability" defaultValue="weekends">
                <option value="weekends">Weekends</option>
                <option value="weeknights">Weeknights</option>
                <option value="both">Weekends and weeknights</option>
                <option value="festivals">Festivals and large rooms</option>
              </SelectField>
              <Area label="Event experience" name="event_experience" />
              <Area label="Why WTAE" name="why_wtae" />
              {status === "error" ? (
                <p className="text-sm text-live" role="alert">
                  {message}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex h-12 w-full items-center justify-center rounded-full bg-gold font-semibold text-gold-fg disabled:opacity-60"
                data-track="photographer-form-submitted"
              >
                {status === "loading" ? "Sending…" : "Apply"}
              </button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
