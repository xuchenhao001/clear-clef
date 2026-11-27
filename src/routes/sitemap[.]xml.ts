import { createFileRoute } from "@tanstack/react-router";
import { listPublicSlugs, searchPublicCatalog } from "@/lib/scores/queries";
import { absoluteUrl } from "@/lib/seo/site";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [scores, catalog] = await Promise.all([
          listPublicSlugs(),
          searchPublicCatalog({ page: 1 }),
        ]);

        const urls: Array<{ loc: string; lastmod?: string }> = [];
        for (let page = 1; page <= catalog.pageCount; page += 1) {
          urls.push({ loc: absoluteUrl(page === 1 ? "/" : `/?page=${page}`) });
        }
        for (const score of scores) {
          urls.push({
            loc: absoluteUrl(`/scores/${score.slug}`),
            lastmod: score.updatedAt?.toISOString().slice(0, 10),
          });
        }

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) =>
      `  <url><loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : "<changefreq>weekly</changefreq>"}</url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
