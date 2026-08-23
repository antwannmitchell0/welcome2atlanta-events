import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-hero text-3xl text-fg">WTAE</p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Welcome To Atlanta Events. Discover the city. Find the moment. Be part of Atlanta.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <Link to="/explore" className="hover:text-fg">
            Explore
          </Link>
          <Link to="/photos" className="hover:text-fg">
            Find Photos
          </Link>
          <Link to="/events" className="hover:text-fg">
            Get Covered
          </Link>
          <Link to="/creators" className="hover:text-fg">
            Photographers
          </Link>
          <Link to="/contact" className="hover:text-fg">
            Contact
          </Link>
          <Link to="/privacy" className="hover:text-fg">
            Privacy
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-5 text-xs text-subtle">
        © {new Date().getFullYear()} Welcome To Atlanta Events · From the 404
      </p>
    </footer>
  );
}
