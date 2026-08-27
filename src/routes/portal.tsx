import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { PortalChrome } from "@/lib/portal/chrome";
import { getPortalMe } from "@/lib/portal/me";
import { safePortalNext } from "@/lib/portal/redirect";

const PUBLIC_PORTAL_PATHS = new Set([
  "/portal/login",
  "/portal/forgot-password",
  "/portal/reset-password",
]);

export const Route = createFileRoute("/portal")({
  beforeLoad: async ({ location }) => {
    if (PUBLIC_PORTAL_PATHS.has(location.pathname)) return {};
    const me = await getPortalMe();
    if (!me.ok) {
      throw redirect({
        to: "/portal/login",
        search: { next: safePortalNext(`${location.pathname}${location.search}`) },
      });
    }
    return { actor: me.actor };
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
