import { NextResponse } from "next/server";
import { getAuthDb } from "@/lib/auth/db";
import { AdminSetupError, createFirstAdmin } from "@/lib/auth/setup";
import { resolveAuthEnv } from "@/lib/env";

type SetupBody = {
  email?: string;
  password?: string;
  name?: string;
};

export async function POST(request: Request) {
  let body: SetupBody;

  try {
    body = (await request.json()) as SetupBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const name = body.name?.trim() ?? "";

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const { db, env } = await getAuthDb();

  try {
    const createdUser = await createFirstAdmin(db, resolveAuthEnv(env), {
      email,
      password,
      name,
    });

    return NextResponse.json({
      user: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
      },
    });
  } catch (error) {
    if (error instanceof AdminSetupError) {
      const status = error.code === "ADMIN_EXISTS" ? 409 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    throw error;
  }
}
