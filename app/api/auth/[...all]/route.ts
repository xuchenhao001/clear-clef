import { getAuth } from "@/lib/auth";

async function handleAuth(request: Request) {
  const auth = await getAuth();
  return auth.handler(request);
}

export const GET = handleAuth;
export const POST = handleAuth;
