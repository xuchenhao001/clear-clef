export type RuntimeEnvSource = {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
};

export type AuthEnvConfig = {
  secret: string;
  baseURL: string;
};

export function getRuntimeEnv(source?: RuntimeEnvSource): RuntimeEnvSource {
  return {
    BETTER_AUTH_SECRET:
      source?.BETTER_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: source?.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL,
  };
}

export function resolveAuthEnv(source?: RuntimeEnvSource): AuthEnvConfig {
  const runtime = getRuntimeEnv(source);
  const secret = runtime.BETTER_AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters");
  }

  return {
    secret,
    baseURL: runtime.BETTER_AUTH_URL ?? "http://localhost:3000",
  };
}
