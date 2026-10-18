import { createFileRoute } from "@tanstack/react-router";
import { getAuthDb } from "@/lib/auth/db";
import { AdminSetupError, createFirstAdmin } from "@/lib/auth/setup";
import { resolveAuthEnv } from "@/lib/env";

type SetupBody = {
  email?: string;
  password?: string;
  name?: string;
};

export const Route = createFileRoute("/api/admin/setup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: SetupBody;

        try {
          body = (await request.json()) as SetupBody;
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const email = body.email?.trim() ?? "";
        const password = body.password ?? "";
        const name = body.name?.trim() ?? "";

        if (!email || !password || !name) {
          return Response.json(
            { error: "Name, email, and password are required" },
            { status: 400 },
          );
        }

        if (password.length < 8) {
          return Response.json(
            { error: "Password must be at least 8 characters" },
            { status: 400 },
          );
        }

        const { db, env } = getAuthDb();

        try {
          const createdUser = await createFirstAdmin(db, resolveAuthEnv(env), {
            email,
            password,
            name,
          });

          return Response.json({
            user: {
              id: createdUser.id,
              email: createdUser.email,
              name: createdUser.name,
            },
          });
        } catch (error) {
          if (error instanceof AdminSetupError) {
            const status = error.code === "ADMIN_EXISTS" ? 409 : 400;
            return Response.json({ error: error.message }, { status });
          }

          throw error;
        }
      },
    },
  },
});
