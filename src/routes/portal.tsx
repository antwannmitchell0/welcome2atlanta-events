import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { PortalChrome } from "@/lib/portal/chrome";
import { PUBLIC_PORTAL_PATHS, portalBeforeLoad } from "@/lib/portal/guard";
import { getPortalMe } from "@/lib/portal/me";

export const Route = createFileRoute("/portal")({
  beforeLoad: async ({ location }) => {
    if (PUBLIC_PORTAL_PATHS.has(location.pathname)) return {};
    const me = await getPortalMe();
    const decision = portalBeforeLoad(location.pathname, location.search, me);
    if (decision.kind === "login") {
      throw redirect({
        to: "/portal/login",
        search: { next: decision.next },
      });
    }
    if (decision.kind === "allow") return { actor: decision.actor };
    return {};
  },
  component: PortalFrame,
  head: () => ({
    meta: [{ title: "WTAE Mission Control" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function PortalFrame() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (PUBLIC_PORTAL_PATHS.has(pathname)) return <Outlet />;
  const context = Route.useRouteContext() as {
    actor?: { displayName: string; email: string | null };
  };
  return (
    <div className="min-h-screen bg-bg text-fg">
      <PortalChrome displayName={context.actor?.displayName} email={context.actor?.email} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </div>
    </div>
  );
}
