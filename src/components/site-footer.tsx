import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg text-fg">Atlanta Events</p>
          <p className="mt-1 text-sm text-muted">From the 404. For the 404.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <Link to="/photos" className="hover:text-fg">
            Find Photos
          </Link>
          <Link to="/events" className="hover:text-fg">
            Bring WTAE
          </Link>
          <Link to="/creators" className="hover:text-fg">
            For Creators
          </Link>
          <Link to="/explore" className="hover:text-fg">
            Explore
          </Link>
          <Link to="/contact" className="hover:text-fg">
            Contact
          </Link>
          <Link to="/privacy" className="hover:text-fg">
            Privacy
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-5 text-xs text-subtle">
        © {new Date().getFullYear()} Welcome to Atlanta Events
      </p>
    </footer>
  );
}
