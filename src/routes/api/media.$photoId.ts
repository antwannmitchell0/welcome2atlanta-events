import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/media/$photoId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { handleMediaGet } = await import("@/lib/portal/media-http");
        return handleMediaGet(params.photoId);
      },
    },
  },
});
