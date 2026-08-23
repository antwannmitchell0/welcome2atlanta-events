"use client";

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/photographers")({
  component: PhotographersLayout,
});

function PhotographersLayout() {
  return <Outlet />;
}
