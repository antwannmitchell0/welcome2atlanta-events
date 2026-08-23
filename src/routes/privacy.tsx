import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-4xl">Privacy</h1>
        <p className="mt-3 text-sm text-subtle">Last updated: August 2026</p>
        <section className="mt-10 space-y-8 text-muted leading-relaxed">
          <div>
            <h2 className="text-xl font-medium text-fg">Your photos</h2>
            <p className="mt-3">
              Event photos are available to attendees through this gallery. You can find, view, and share photos you appear in. We do not sell your photos.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-medium text-fg">Face scan</h2>
            <p className="mt-3">
              Face scan is optional. Matching runs on your device in the browser. Your camera image or uploaded
              selfie is used only to search live event galleries during that session. We do not upload your face
              to our servers, do not store biometric templates, do not sell face data, and do not use it to train
              models. Camera access can be denied at any time. You can find photos by event, phone, or event code
              instead.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-medium text-fg">Contact information</h2>
            <p className="mt-3">
              Phone numbers used to locate photos are used solely for that purpose.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
