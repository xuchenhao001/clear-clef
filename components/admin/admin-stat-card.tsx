import { Plate } from "@/components/ui/plate";

type AdminStatCardProps = {
  label: string;
  value: number;
};

/**
 * A ledger tally: a slab-caps label over the count set in the reading serif's
 * old-style figures, in the printed olive that marks extents throughout the
 * catalog. Counts are a catalogue mark, not a technical string, so they are not
 * set in mono.
 */
export function AdminStatCard({ label, value }: AdminStatCardProps) {
  return (
    <Plate>
      <div className="px-5 py-4">
        <p className="type-label">{label}</p>
        <p className="mt-2 font-text text-[2.25rem] leading-none font-medium text-edition-print [font-variant-numeric:oldstyle-nums]">
          {value}
        </p>
      </div>
    </Plate>
  );
}
