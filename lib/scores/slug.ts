import { slugifyTitle } from "@/lib/catalog/normalize";

export async function createUniqueSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>,
  fallbackId?: string,
): Promise<string> {
  const base = slugifyTitle(title, fallbackId);
  if (!(await exists(base))) {
    return base;
  }

  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}-${index}`;
    if (!(await exists(candidate))) {
      return candidate;
    }
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export { slugifyTitle };
