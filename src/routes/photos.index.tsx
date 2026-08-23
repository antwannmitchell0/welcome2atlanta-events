import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, QrCode, ScanFace, Search, Smartphone } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/photos/")({
  component: PhotosHub,
  head: () => ({
    meta: [
      { title: "Find My Photos · WTAE" },
      { name: "description", content: "Find your photos from WTAE-covered Atlanta events by event, code, or optional on-device face scan." },
    ],
  }),
});

function PhotosHub() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-14">
        <div className="text-center">
          <p className="font-hero text-sm tracking-[0.24em] text-gold">FIND YOURSELF</p>
          <h1 className="mt-3 font-hero text-5xl text-fg md:text-6xl">WHICH EVENT WERE YOU AT?</h1>
          <p className="mt-3 text-muted">
            Event, code, or optional face scan. No account needed.
          </p>
        </div>

        <div className="mt-10 grid gap-3">
          <Method
            to="/photos/event"
            icon={<Search className="size-5" />}
            title="Event or code"
            description="Browse the public list, or type the code from the room"
            primary
          />
          <Method
            to="/photos/qr"
            icon={<QrCode className="size-5" />}
            title="I have a code"
            description="Jump straight in with ATL-404, ATL-BELT, and the rest"
          />
          <Method
            to="/photos/face"
            icon={<ScanFace className="size-5" />}
            title="Scan your face"
            description="Optional. On-device. Find yourself across live galleries"
          />
          <Method
            to="/photos/phone"
            icon={<Smartphone className="size-5" />}
            title="Phone check-in"
            description="Only if you checked in with a number at the event"
          />
        </div>
        <p className="mt-10 text-center text-sm text-subtle">
          Public galleries don’t need an account. Face scan is optional and stays on your device.{" "}
          <Link to="/privacy" className="text-gold hover:text-fg">
            Privacy
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function Method({
  to,
  icon,
  title,
  description,
  primary,
}: {
  to: "/photos/event" | "/photos/phone" | "/photos/face" | "/photos/qr";
  icon: React.ReactNode;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        primary
          ? "flex items-start gap-4 rounded-md border border-gold/30 bg-surface p-5 hover:border-gold/50"
          : "flex items-start gap-4 rounded-md border border-border bg-surface p-5 hover:border-gold/30"
      }
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-elevated text-gold">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-medium text-fg">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
    </Link>
  );
}
