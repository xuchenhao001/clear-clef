import { betterAuthUrlForMode } from "@/lib/worker-bindings";
import {
  catalogSearchToQuery,
  hasCatalogRefinements,
  isDefaultBrowse,
  type CatalogSearch,
} from "@/lib/catalog/url-state";

export function siteOrigin(): string {
  const mode =
    typeof import.meta !== "undefined" ? import.meta.env?.MODE : undefined;
  return betterAuthUrlForMode(mode);
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteOrigin()).toString();
}

function canonicalPath(search: CatalogSearch, page: number): string {
  const params = {
    ...search,
    page: page > 1 ? page : undefined,
  };
  const query = catalogSearchToQuery(params);
  return query ? `/?${query}` : "/";
}

export function catalogHead(input: {
  search: CatalogSearch;
  totalPublic: number;
  page: number;
  pageCount: number;
}) {
  const { search, totalPublic, page, pageCount } = input;
  const filtered = hasCatalogRefinements(search);
  const defaultBrowse = isDefaultBrowse(search);
  const queryLabel = search.q ? `“${search.q}”` : "";
  const title = search.q
    ? `${queryLabel} — score search · ClearClef`
    : defaultBrowse
      ? page > 1
        ? `Score catalogue — page ${page} · ClearClef`
        : "Score catalogue · ClearClef"
      : "Filtered score catalogue · ClearClef";
  const description = search.q
    ? `Search results for ${queryLabel} in the ClearClef score catalogue.`
    : `${totalPublic} licensed piano ${totalPublic === 1 ? "work" : "works"} engraved from MusicXML. Browse by composer, key, difficulty, license or tag.`;

  const canonical = absoluteUrl(canonicalPath(search, page));
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    {
      name: "robots",
      content: filtered || !defaultBrowse ? "noindex, follow" : "index, follow",
    },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonical },
    { property: "og:image", content: absoluteUrl("/og-default.png") },
    { property: "og:image:alt", content: "ClearClef score catalogue" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: absoluteUrl("/og-default.png") },
  ];

  const links: Array<Record<string, string>> = [];
  if (defaultBrowse) {
    links.push({ rel: "canonical", href: canonical });
  }
  if (defaultBrowse && page > 1) {
    links.push({
      rel: "prev",
      href: absoluteUrl(canonicalPath(search, page - 1)),
    });
  }
  if (defaultBrowse && page < pageCount) {
    links.push({
      rel: "next",
      href: absoluteUrl(canonicalPath(search, page + 1)),
    });
  }

  return { meta, links };
}

export function escapeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function scoreHead(input: {
  title: string;
  composer: string | null;
  license: string;
  key: string | null;
  keyLabel: string;
  catalogNumber: string | null;
  difficulty: string | null;
  slug: string;
  previewUrl: string | null;
}) {
  const title = `${input.title}${input.composer ? ` — ${input.composer}` : ""} · ClearClef`;
  const facts = [
    input.catalogNumber,
    input.keyLabel,
    input.difficulty
      ? `${input.difficulty.charAt(0).toUpperCase()}${input.difficulty.slice(1)} level`
      : null,
    `License: ${input.license}`,
  ].filter(Boolean);
  const description = `${input.title}${input.composer ? ` by ${input.composer}` : ""}. ${facts.join(". ")}. Read or practice the engraved score.`;
  const canonical = absoluteUrl(`/scores/${input.slug}`);
  const image = absoluteUrl("/og-default.png");
  const artwork = input.previewUrl
    ? absoluteUrl(input.previewUrl)
    : image;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicComposition",
    name: input.title,
    url: canonical,
    ...(input.composer
      ? { composer: { "@type": "Person", name: input.composer } }
      : {}),
    ...(input.catalogNumber ? { identifier: input.catalogNumber } : {}),
    ...(input.keyLabel ? { musicalKey: input.keyLabel } : {}),
    license: input.license,
    image: artwork,
  };

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "music.song" },
      { property: "og:url", content: canonical },
      { property: "og:image", content: image },
      { property: "og:image:alt", content: `${input.title} score page` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [
      { rel: "canonical", href: canonical },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: escapeJsonLd(jsonLd),
      },
    ],
  };
}
