import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/contact")({ component: Contact });

function Contact() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-hero text-6xl">LET’S TALK</h1>
        <p className="mt-3 text-muted">Guests find photos. Hosts request a date. Shooters apply.</p>
        <a
          href="mailto:hello@welcome2atlantaevents.com"
          className="mt-10 block rounded-md border border-border bg-surface p-6 hover:border-gold/40"
        >
          <p className="font-medium">Email</p>
          <p className="mt-1 text-sm text-muted">hello@welcome2atlantaevents.com</p>
        </a>
        <Link to="/events" className="mt-4 block rounded-md border border-border bg-surface p-6 hover:border-gold/40">
          <p className="font-medium">Get your event covered</p>
          <p className="mt-1 text-sm text-muted">Request a date. We send a written reply.</p>
        </Link>
        <Link to="/creators" className="mt-4 block rounded-md border border-border bg-surface p-6 hover:border-gold/40">
          <p className="font-medium">Apply as a photographer</p>
          <p className="mt-1 text-sm text-muted">Work that actually gets seen.</p>
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
