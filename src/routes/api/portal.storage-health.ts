import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/portal/storage-health")({
  server: {
    handlers: {
      GET: async () => {
        const { storageHealthResponse } = await import("@/lib/portal/upload-http");
        return storageHealthResponse();
      },
    },
  },
});
