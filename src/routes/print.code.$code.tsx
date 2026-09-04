import { createFileRoute, Link } from "@tanstack/react-router";
import { getPrintCard } from "@/lib/portal/coverage-requests";
import { qrSvg } from "@/lib/qr";

export const Route = createFileRoute("/print/code/$code")({
  loader: async ({ params }) => {
    const code = String(params.code ?? "").toUpperCase();
    const card = await getPrintCard({ data: { code } });
    return { card, code };
  },
  component: PrintCodeCard,
  head: () => ({
    meta: [{ title: "WTAE code card" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function PrintCodeCard() {
  const { card, code } = Route.useLoaderData();
  const name = card?.name || "Welcome to Atlanta Events";
  const galleryUrl = card?.galleryUrl || `https://www.welcome2atlantaevents.com/photos?code=${encodeURIComponent(code)}`;
  const svg = qrSvg(galleryUrl, { moduleSize: 6, color: "#cfc6b0", background: "#0a0a0b" });

  return (
    <div className="print-sheet min-h-screen bg-bg text-fg">
      <div className="print-actions mx-auto flex max-w-md items-center justify-between px-5 py-4">
        <Link to="/" className="text-sm text-muted hover:text-fg">
          Back to WTAE
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-fg"
        >
          Print card
        </button>
      </div>
      <article className="mx-auto my-6 w-[min(100%,420px)] rounded-xl border border-accent/40 bg-bg px-8 py-10 text-center">
        <p className="text-[10px] tracking-[0.32em] text-accent">WELCOME TO ATLANTA EVENTS</p>
        <h1 className="mt-5 font-display text-3xl leading-tight text-fg">{name}</h1>
        {card?.neighborhood ? (
          <p className="mt-2 text-sm tracking-[0.16em] text-muted">{card.neighborhood}</p>
        ) : null}
        <p className="mt-8 font-display text-4xl tracking-[0.18em] text-accent">{card?.code || code}</p>
        <div className="mx-auto mt-8 w-56" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-4 break-all text-[11px] text-muted">{galleryUrl}</p>
        <p className="mt-8 text-sm tracking-[0.08em] text-fg">Find your face. On-device. Not stored.</p>
        <p className="mt-3 text-xs text-subtle">If you were in the room, you belong in the reel.</p>
      </article>
    </div>
  );
}
