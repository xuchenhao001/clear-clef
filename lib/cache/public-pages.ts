/**
 * Shared ISR window for anonymous catalog and score detail pages.
 *
 * Score detail (`/scores/[slug]`) can be statically regenerated on this interval.
 * The catalog index uses `searchParams` for filters, so filtered requests stay
 * fully dynamic per visit; this TTL still applies to the unfiltered catalog shell
 * and pairs with `revalidatePath` after admin ingest (`lib/scores/revalidate.ts`).
 */
export const PUBLIC_PAGE_REVALIDATE_SECONDS = 60;
