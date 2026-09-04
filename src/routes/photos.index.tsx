import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Camera, QrCode, ScanFace, Search, Smartphone } from "lucide-react";
import { parseCodeSearch, codeFromSearchString } from "@/lib/code-search";
import { resolvePublicCode } from "@/lib/portal/public-galleries";

export const Route = createFileRoute("/photos/")({
  validateSearch: parseCodeSearch,
  loader: async ({ location }) => {
    const code = codeFromSearchString(location.searchStr);
    if (!code) return { resolved: null as Awaited<ReturnType<typeof resolvePublicCode>> };
    return { resolved: await resolvePublicCode({ data: { code } }) };
  },
  component: PhotosHub,
});

function PhotosHub() {
  const { code } = Route.useSearch();
  const { resolved } = Route.useLoaderData();
  const event = resolved?.event;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <span className="text-sm text-accent">Find My Photos</span>
          <span className="w-12" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-14">
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl bg-surface">
            <Camera className="size-7 text-accent" />
          </div>
          <h1 className="font-display text-4xl text-fg">
            {event ? event.title : "Which event were you at?"}
          </h1>
          <p className="mt-3 text-muted">
            {event
              ? `${event.neighborhood} · ${event.code}`
              : "Pick the night or enter the code from the room. No account needed."}
          </p>
        </div>

        {event ? (
          <div className="mt-8 rounded-xl border border-border bg-surface p-5">
            <p className="text-xs tracking-[0.18em] text-accent">{event.code}</p>
            <p className="mt-2 text-sm text-muted">
              {event.photoCount > 0
                ? "QR landed on the right room. Open the gallery or scan your face."
                : "This code is reserved. Gallery goes live after coverage."}
            </p>
            {event.photoCount > 0 && !event.slug.startsWith("code-") ? (
              <Link
                to="/events/$slug"
                params={{ slug: event.slug }}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg"
              >
                Open gallery
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10 grid gap-3">
          <Method
            to="/photos/event"
            search={code ? { code } : {}}
            icon={<Search className="size-5" />}
            title="Event or code"
            description="Browse the public list, or type the code from the event"
            primary
          />
          <Method
            to="/photos/qr"
            search={code ? { code } : {}}
            icon={<QrCode className="size-5" />}
            title="I have a code"
            description="Jump straight in with ATL-404, ATL-BELT, and the rest"
          />
          <Method
            to="/photos/face"
            search={code ? { code } : {}}
            icon={<ScanFace className="size-5" />}
            title="Scan your face"
            description="Optional. On-device. Find yourself across live galleries"
          />
          <Method
            to="/photos/phone"
            icon={<Smartphone className="size-5" />}
            title="Phone check-in"
            description="Only if you checked in with a number"
          />
        </div>
        <p className="mt-10 text-center text-sm text-subtle">
          Public galleries don’t need an account. Face scan is optional and stays on your device.{" "}
          <Link to="/privacy" className="text-accent hover:text-fg">
            Privacy
          </Link>
        </p>
      </main>
    </div>
  );
}

function Method({
  to,
  icon,
  title,
  description,
  primary,
  search,
}: {
  to: "/photos/event" | "/photos/phone" | "/photos/face" | "/photos/qr";
  icon: React.ReactNode;
  title: string;
  description: string;
  primary?: boolean;
  search?: { code?: string };
}) {
  return (
    <Link
      to={to}
      search={search}
      className={
        primary
          ? "flex items-start gap-4 rounded-xl border border-accent/30 bg-surface p-5 hover:border-accent/50"
          : "flex items-start gap-4 rounded-xl border border-border bg-surface p-5 hover:border-accent/30"
      }
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-elevated text-accent">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-medium text-fg">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
    </Link>
  );
}
