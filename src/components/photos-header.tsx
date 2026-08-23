import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function PhotosHeader({ title }: { title: string }) {
  return (
    <header className="border-b border-border bg-bg/90">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5">
        <Link to="/photos" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" />
          Find Photos
        </Link>
        <span className="font-hero text-sm tracking-[0.18em] text-gold">{title}</span>
        <Link to="/" className="text-sm text-muted hover:text-fg">
          WTAE
        </Link>
      </div>
    </header>
  );
}
