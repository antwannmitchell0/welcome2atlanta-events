import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/portal/storage-health")({
  server: {
    handlers: {
      GET: async () => {
        const { storageHealth } = await import("@/lib/portal/blob-config");
        return Response.json(storageHealth());
      },
    },
  },
});
