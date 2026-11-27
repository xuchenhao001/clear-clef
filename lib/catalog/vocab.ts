import { LICENSE_OPTIONS } from "@/lib/ingest/constants";

export type KeyMode = "major" | "minor";

export type KeyOption = {
  value: string;
  label: string;
  slug: string;
  mode: KeyMode;
  rank: number;
};

const MAJOR_KEYS = [
  "Cb",
  "Gb",
  "Db",
  "Ab",
  "Eb",
  "Bb",
  "F",
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
  "C#",
];

const MINOR_KEYS = [
  "Ab",
  "Eb",
  "Bb",
  "F",
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
  "C#",
  "G#",
  "D#",
  "A#",
];

const NOTE_ALIASES: Record<string, string> = {
  cb: "Cb",
  gb: "Gb",
  db: "Db",
  ab: "Ab",
  eb: "Eb",
  bb: "Bb",
  f: "F",
  c: "C",
  g: "G",
  d: "D",
  a: "A",
  e: "E",
  b: "B",
  "f#": "F#",
  "c#": "C#",
  "g#": "G#",
  "d#": "D#",
  "a#": "A#",
};

const NOTE_LABELS: Record<string, string> = {
  Cb: "C♭",
  Gb: "G♭",
  Db: "D♭",
  Ab: "A♭",
  Eb: "E♭",
  Bb: "B♭",
  F: "F",
  C: "C",
  G: "G",
  D: "D",
  A: "A",
  E: "E",
  B: "B",
  "F#": "F♯",
  "C#": "C♯",
  "G#": "G♯",
  "D#": "D♯",
  "A#": "A♯",
};

function keyEntry(note: string, mode: KeyMode, rank: number): KeyOption {
  const value = `${note} ${mode}`;
  return {
    value,
    label: `${NOTE_LABELS[note] ?? note} ${mode}`,
    slug: keySlug(value),
    mode,
    rank,
  };
}

export const KEY_OPTIONS: KeyOption[] = [
  ...MAJOR_KEYS.map((note, index) => keyEntry(note, "major", index)),
  ...MINOR_KEYS.map((note, index) => keyEntry(note, "minor", index)),
];

export const KEY_BY_VALUE = new Map(KEY_OPTIONS.map((key) => [key.value, key]));
export const KEY_BY_SLUG = new Map(KEY_OPTIONS.map((key) => [key.slug, key]));

export type DifficultyOption = {
  value: string;
  label: string;
  slug: string;
  rank: number;
};

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: "beginner", label: "Beginner", slug: "beginner", rank: 0 },
  { value: "easy", label: "Easy", slug: "easy", rank: 1 },
  {
    value: "intermediate",
    label: "Intermediate",
    slug: "intermediate",
    rank: 2,
  },
  { value: "advanced", label: "Advanced", slug: "advanced", rank: 3 },
];

export const DIFFICULTY_BY_VALUE = new Map(
  DIFFICULTY_OPTIONS.map((option) => [option.value, option]),
);
export const DIFFICULTY_BY_SLUG = new Map(
  DIFFICULTY_OPTIONS.map((option) => [option.slug, option]),
);

export type LicenseOption = {
  value: string;
  label: string;
  slug: string;
  rank: number;
};

export const LICENSE_ITEMS: LicenseOption[] = LICENSE_OPTIONS.map(
  (value, index) => ({
    value,
    label: value,
    slug: licenseSlug(value),
    rank: index,
  }),
);

export const LICENSE_BY_VALUE = new Map(
  LICENSE_ITEMS.map((option) => [option.value, option]),
);
export const LICENSE_BY_SLUG = new Map(
  LICENSE_ITEMS.map((option) => [option.slug, option]),
);

export function normalizeFacetText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[♯#]/g, "#")
    .replace(/[♭]/g, "b")
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, " ")
    .trim();
}

export function canonicalKey(raw: string | null | undefined): string | null {
  if (!raw?.trim()) {
    return null;
  }

  const normalized = normalizeFacetText(raw).replace(/\s+/g, " ");
  if (!normalized) {
    return null;
  }

  const mode = /\bminor\b/.test(normalized)
    ? "minor"
    : /\bmajor\b/.test(normalized)
      ? "major"
      : null;
  if (!mode) {
    return null;
  }

  const notePart = normalized
    .replace(/\b(major|minor)\b/g, "")
    .replace(/\s+/g, "")
    .replace(/sharp/g, "#")
    .replace(/flat/g, "b");

  const note = NOTE_ALIASES[notePart];
  if (!note) {
    return null;
  }

  return `${note} ${mode}`;
}

export function keySlug(value: string): string {
  const [note = "", mode = ""] = value.split(" ");
  const noteSlug = note
    .replace(/#$/, "-sharp")
    .replace(/b$/, "-flat")
    .toLowerCase();
  return `${noteSlug}-${mode}`.replace(/^-+|-+$/g, "");
}

export function keyFromSlug(slug: string): string | null {
  const normalized = normalizeFacetText(slug).replace(/\s+/g, "-");
  const match = /^([a-g])(?:-(sharp|flat))?-(major|minor)$/.exec(normalized);
  if (!match) {
    return null;
  }
  const [, letter, accidental, mode] = match;
  const note = `${letter.toUpperCase()}${accidental === "sharp" ? "#" : accidental === "flat" ? "b" : ""}`;
  return `${note} ${mode}`;
}

export function keyLabel(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const option = KEY_BY_VALUE.get(value);
  if (option) {
    return option.label;
  }
  const canonical = canonicalKey(value);
  return canonical ? (KEY_BY_VALUE.get(canonical)?.label ?? canonical) : value;
}

export function keyRank(value: string | null | undefined): number {
  if (!value) {
    return 999;
  }
  const canonical = canonicalKey(value) ?? value;
  return KEY_BY_VALUE.get(canonical)?.rank ?? 999;
}

export function canonicalDifficulty(raw: string | null | undefined): string | null {
  if (!raw?.trim()) {
    return null;
  }
  const normalized = normalizeFacetText(raw).replace(/\s+/g, "");
  const direct = DIFFICULTY_BY_VALUE.get(normalized);
  if (direct) {
    return direct.value;
  }
  const aliases: Record<string, string> = {
    beginner: "beginner",
    easy: "easy",
    elementary: "easy",
    intermediate: "intermediate",
    medium: "intermediate",
    advanced: "advanced",
    hard: "advanced",
  };
  return aliases[normalized] ?? null;
}

export function difficultySlug(value: string | null | undefined): string {
  const canonical = canonicalDifficulty(value);
  return canonical
    ? (DIFFICULTY_BY_VALUE.get(canonical)?.slug ?? "intermediate")
    : "";
}

export function difficultyFromSlug(slug: string): string | null {
  return DIFFICULTY_BY_SLUG.get(normalizeFacetText(slug).replace(/\s+/g, "-"))
    ?.value ?? null;
}

export function difficultyLabel(value: string | null | undefined): string {
  const canonical = canonicalDifficulty(value);
  return canonical
    ? (DIFFICULTY_BY_VALUE.get(canonical)?.label ?? canonical)
    : "";
}

export function licenseSlug(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (normalized.includes("public domain") || normalized === "pd") {
    return "public-domain";
  }
  if (normalized === "cc0" || normalized.includes("cc-0")) {
    return "cc0";
  }
  if (normalized.includes("share") || normalized.includes("sa")) {
    return "cc-by-sa";
  }
  if (normalized.includes("cc") || normalized.includes("creative commons")) {
    return "cc-by";
  }
  if (normalized.includes("all rights")) {
    return "all-rights-reserved";
  }
  return normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function licenseFromSlug(slug: string): string | null {
  return LICENSE_BY_SLUG.get(normalizeFacetText(slug).replace(/\s+/g, "-"))
    ?.value ?? null;
}

export function canonicalLicense(raw: string | null | undefined): string | null {
  if (!raw?.trim()) {
    return null;
  }
  const direct = LICENSE_BY_VALUE.get(raw.trim());
  if (direct) {
    return direct.value;
  }
  const slug = licenseSlug(raw);
  return LICENSE_BY_SLUG.get(slug)?.value ?? null;
}

export function licenseLabel(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return LICENSE_BY_VALUE.get(value)?.label ?? value;
}
