import { createFileRoute } from "@tanstack/react-router";

void process.env.DATABASE_URL;
void process.env.WTAE_OWNER_EMAIL;

export const Route = createFileRoute("/api/portal/claim-owner")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let email = "";
        let password = "";
        try {
          const body = (await request.json()) as { email?: unknown; password?: unknown };
          email = typeof body.email === "string" ? body.email : "";
          password = typeof body.password === "string" ? body.password : "";
        } catch {
          return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
        }
        const { claimFirstOwner } = await import("@/lib/portal/claim-owner-db");
        try {
          const result = await claimFirstOwner(email, password);
          return Response.json(result, { status: result.ok ? 200 : 400 });
        } catch {
          return Response.json(
            { ok: false, error: "Sign-in is temporarily unavailable. Try again in a moment." },
            { status: 503 },
          );
        }
      },
    },
  },
});
