import { revalidatePath } from "next/cache";

export function revalidateScorePaths(slug: string) {
  revalidatePath("/");
  revalidatePath(`/scores/${slug}`);
}
