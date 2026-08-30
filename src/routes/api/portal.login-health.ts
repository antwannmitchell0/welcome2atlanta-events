import { createFileRoute } from "@tanstack/react-router";

void process.env.DATABASE_URL;
void process.env.WTAE_OWNER_EMAIL;
void process.env.BETTER_AUTH_SECRET;
void process.env.RESEND_API_KEY;
void process.env.VERCEL;

export const Route = createFileRoute("/api/portal/login-health")({
  server: {
    handlers: {
      GET: async () => {
        const { loginHealthFromEnv } = await import("@/lib/portal/login-health");
        let ownerExists = false;
        if (process.env.DATABASE_URL?.trim()) {
          try {
            const { countOwners } = await import("@/lib/portal/claim-owner-db");
            ownerExists = (await countOwners()) > 0;
          } catch {
            ownerExists = false;
          }
        }
        return Response.json(loginHealthFromEnv(process.env, ownerExists));
      },
    },
  },
});
