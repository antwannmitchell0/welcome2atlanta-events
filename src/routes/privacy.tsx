import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-hero text-6xl">PRIVACY</h1>
        <p className="mt-3 text-sm text-subtle">Last updated: August 2026</p>
        <section className="mt-10 space-y-8 text-muted leading-relaxed">
          <div>
            <h2 className="font-hero text-3xl text-fg">Your photos</h2>
            <p className="mt-3">
              Event photos are available to attendees through this gallery. You can find, view, and share photos you appear in. We do not sell your photos.
            </p>
          </div>
          <div>
            <h2 className="font-hero text-3xl text-fg">Face scan</h2>
            <p className="mt-3">
              Face scan is optional. Matching runs on your device in the browser. Your camera image is used only to search live galleries during that session. We do not store biometric templates.
            </p>
          </div>
          <div>
            <h2 className="font-hero text-3xl text-fg">Event and photographer forms</h2>
            <p className="mt-3">
              Coverage requests and photographer applications are stored so we can reply. We do not sell that information. Founder notes on those records are internal and never shown publicly.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
