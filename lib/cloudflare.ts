import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getCloudflareEnv() {
  const { env } = await getCloudflareContext({ async: true });
  return env;
}

export async function getScoresBucket() {
  const env = await getCloudflareEnv();
  return env.SCORES_BUCKET;
}
