import { env } from "cloudflare:workers";

export function getScoresBucket() {
  return env.SCORES_BUCKET;
}
