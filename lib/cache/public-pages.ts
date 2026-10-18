/**
 * Shared ISR window for anonymous catalog and score detail pages.
 *
 * Score detail (`/scores/[slug]`) can be statically regenerated on this interval.
 * The catalog index uses `searchParams` for filters, so filtered requests stay
 * fully dynamic per visit; this TTL still applies to the unfiltered catalog shell
 * and pairs with `revalidatePath` after admin ingest (`lib/scores/revalidate.ts`).
 *
 * The page files export `revalidate = 60` as a literal. Next.js rejects an
 * imported value in a segment config, so change those literals with this constant.
 */
export const PUBLIC_PAGE_REVALIDATE_SECONDS = 60;
