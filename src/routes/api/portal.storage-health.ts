import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/portal/storage-health")({
  server: {
    handlers: {
      GET: async () => {
        const { storageHealthWithOidc } = await import("@/lib/portal/blob-config");
        return Response.json(await storageHealthWithOidc());
      },
    },
  },
});
