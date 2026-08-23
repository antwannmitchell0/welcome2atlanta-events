"use client";

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/requests")({
  component: RequestsLayout,
});

function RequestsLayout() {
  return <Outlet />;
}
