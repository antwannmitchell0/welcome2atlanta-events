import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/contact")({ component: Contact });

function Contact() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-surface">
          <Mail className="size-7 text-accent" />
        </div>
        <h1 className="font-display text-4xl">Let’s talk</h1>
        <p className="mt-3 text-muted">Guests find photos. Hosts request a date. Shooters apply.</p>
        <a
          href="mailto:hello@welcome2atlantaevents.com"
          className="mt-10 block rounded-xl border border-border bg-surface p-6 text-left hover:border-accent/40"
        >
          <p className="font-medium">Email</p>
          <p className="mt-1 text-sm text-muted">hello@welcome2atlantaevents.com</p>
        </a>
        <Link
          to="/events"
          className="mt-4 block rounded-xl border border-border bg-surface p-6 text-left hover:border-accent/40"
        >
          <p className="font-medium">Bring WTAE to your event</p>
          <p className="mt-1 text-sm text-muted">Request a date. We send a written reply.</p>
        </Link>
        <Link
          to="/creators"
          className="mt-4 block rounded-xl border border-border bg-surface p-6 text-left hover:border-accent/40"
        >
          <p className="font-medium">Apply as a photographer</p>
          <p className="mt-1 text-sm text-muted">Name, city, Instagram, availability.</p>
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
