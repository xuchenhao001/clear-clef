type AdminStatCardProps = {
  label: string;
  value: number;
};

export function AdminStatCard({ label, value }: AdminStatCardProps) {
  return (
    <div className="rounded-xl border border-edition-hairline bg-edition-surface-card px-5 py-4">
      <p className="type-body-sm text-edition-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl font-medium tabular-nums text-edition-ink">
        {value}
      </p>
    </div>
  );
}
