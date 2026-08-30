import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/portal/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handlePortalUploadPost } = await import("@/lib/portal/upload-http");
        return handlePortalUploadPost(request);
      },
    },
  },
});
