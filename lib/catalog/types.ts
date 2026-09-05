export type CatalogFilterField = {
  name: string;
  label: string;
  values: string[];
  current?: string;
  labels?: { slug: string; label: string }[];
};
