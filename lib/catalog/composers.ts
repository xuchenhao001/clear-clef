export type CanonicalComposer = {
  displayName: string;
  sortName: string;
  birthYear: number | null;
  deathYear: number | null;
  aliases: string[];
};

const COMPOSER_ALIASES: Record<string, string> = {
  "l v beethoven": "Ludwig van Beethoven",
  "l.v.beethoven": "Ludwig van Beethoven",
  "ludwig van beethoven": "Ludwig van Beethoven",
  "ludwig van beethoven 1770 1827": "Ludwig van Beethoven",
  "beethoven": "Ludwig van Beethoven",
  "chopin": "Frédéric Chopin",
  "frederic chopin": "Frédéric Chopin",
  "fredrik chopin": "Frédéric Chopin",
  "frederic francois chopin": "Frédéric Chopin",
  "frederic francois chopin 1810 1849": "Frédéric Chopin",
  "j s bach": "Johann Sebastian Bach",
  "j.s. bach": "Johann Sebastian Bach",
  "johann sebastian bach": "Johann Sebastian Bach",
  "bach": "Johann Sebastian Bach",
  "claude debussy": "Claude Debussy",
  "claude achille debussy": "Claude Debussy",
  "claude achille debussy 1862 1918": "Claude Debussy",
  "debussy": "Claude Debussy",
  "erik satie": "Erik Satie",
  "erik satie 1866 1925": "Erik Satie",
  "satie": "Erik Satie",
  "franz liszt": "Franz Liszt",
  "franz liszt 1811 1886": "Franz Liszt",
  "liszt": "Franz Liszt",
  "mozart": "Wolfgang Amadeus Mozart",
  "wolfgang amadeus mozart": "Wolfgang Amadeus Mozart",
  "tchaikovsky": "Pyotr Ilyich Tchaikovsky",
  "pyotr ilyich tchaikovsky": "Pyotr Ilyich Tchaikovsky",
  "pachelbel": "Johann Pachelbel",
  "johann pachelbel": "Johann Pachelbel",
  "johannes brahms": "Johannes Brahms",
  "schubert": "Franz Schubert",
  "franz schubert": "Franz Schubert",
  "scott joplin": "Scott Joplin",
  "lyo ni": "Lyo Ni",
  "jj lin": "JJ Lin",
  "paul de senneville": "Paul de Senneville",
  "richard clayderman": "Richard Clayderman",
  "murilo pedroza": "Murilo Pedroza",
  "will ross": "Will Ross",
  "traditional": "Traditional",
  "unknown": "Uncredited",
  "uncredited": "Uncredited",
};

const COMPOSER_DATES: Record<string, { birthYear: number | null; deathYear: number | null }> = {
  "Ludwig van Beethoven": { birthYear: 1770, deathYear: 1827 },
  "Frédéric Chopin": { birthYear: 1810, deathYear: 1849 },
  "Johann Sebastian Bach": { birthYear: 1685, deathYear: 1750 },
  "Claude Debussy": { birthYear: 1862, deathYear: 1918 },
  "Erik Satie": { birthYear: 1866, deathYear: 1925 },
  "Franz Liszt": { birthYear: 1811, deathYear: 1886 },
  "Wolfgang Amadeus Mozart": { birthYear: 1756, deathYear: 1791 },
  "Pyotr Ilyich Tchaikovsky": { birthYear: 1840, deathYear: 1893 },
  "Johann Pachelbel": { birthYear: 1653, deathYear: 1706 },
  "Johannes Brahms": { birthYear: 1833, deathYear: 1897 },
  "Franz Schubert": { birthYear: 1797, deathYear: 1828 },
  "Scott Joplin": { birthYear: 1868, deathYear: 1917 },
};

const ARRANGER_PATTERN =
  /^(.*?)\s*(?:,|\s)\s*(?:arr\.?|arranged by)\s+(.+)$/i;

function normalizedComposerKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripComposerDates(value: string): string {
  return value
    .replace(/\s*\(\s*\d{3,4}\s*[–—-]\s*\d{3,4}\s*\)\s*/g, " ")
    .replace(/\s+\d{3,4}\s*[–—-]\s*\d{3,4}\s*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitComposerAndArranger(raw: string | null | undefined): {
  composer: string | null;
  arranger: string | null;
} {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return { composer: null, arranger: null };
  }

  const withoutDates = stripComposerDates(trimmed);
  const arrangedBy = /^arranged\s+by\s+(.+)$/i.exec(withoutDates);
  if (arrangedBy) {
    return { composer: null, arranger: arrangedBy[1]?.trim() ?? null };
  }

  const leadingArranger = /^arr\.?\s+(.+)$/i.exec(withoutDates);
  if (leadingArranger) {
    return { composer: null, arranger: leadingArranger[1]?.trim() ?? null };
  }

  const match = ARRANGER_PATTERN.exec(withoutDates);
  if (match?.[1] && match[2]) {
    return {
      composer: match[1].trim() || null,
      arranger: match[2].trim() || null,
    };
  }

  return { composer: withoutDates, arranger: null };
}

export function canonicalComposer(raw: string | null | undefined): CanonicalComposer | null {
  const { composer } = splitComposerAndArranger(raw);
  if (!composer?.trim()) {
    return null;
  }

  const stripped = stripComposerDates(composer);
  const normalized = normalizedComposerKey(stripped);
  const displayName = COMPOSER_ALIASES[normalized] ?? stripped;
  const dates = COMPOSER_DATES[displayName] ?? {
    birthYear: null,
    deathYear: null,
  };

  return {
    displayName,
    sortName: composerSortName(displayName),
    birthYear: dates.birthYear,
    deathYear: dates.deathYear,
    aliases: [...new Set([raw?.trim(), stripped, normalized].filter(Boolean) as string[])],
  };
}

export function composerSortName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length < 2) {
    return displayName.trim();
  }

  const surname = parts[parts.length - 1]!;
  const given = parts.slice(0, -1).join(" ");
  return `${surname}, ${given}`;
}

export function composerSlug(displayName: string): string {
  const base = displayName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  if (base) {
    return base;
  }

  return `composer-${displayName
    .split("")
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7)
    .toString(36)
    .slice(0, 8)}`;
}
