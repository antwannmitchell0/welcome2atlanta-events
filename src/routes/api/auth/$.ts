import { createFileRoute } from "@tanstack/react-router";

void process.env.DATABASE_URL;
void process.env.VERCEL;

function vercelWithoutDatabase(): boolean {
  return Boolean(process.env.VERCEL?.trim()) && !process.env.DATABASE_URL?.trim();
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (vercelWithoutDatabase()) {
          return Response.json(
            { message: "Owner login isn't ready.", code: "DATABASE_NOT_CONFIGURED" },
            { status: 503 },
          );
        }
        const { auth } = await import("@/lib/auth/server");
        return auth.handler(request);
      },
      POST: async ({ request }) => {
        if (vercelWithoutDatabase()) {
          return Response.json(
            { message: "Owner login isn't ready.", code: "DATABASE_NOT_CONFIGURED" },
            { status: 503 },
          );
        }
        const { auth } = await import("@/lib/auth/server");
        return auth.handler(request);
      },
    },
  },
});
