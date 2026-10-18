import { Plate, PlateHead } from "@/components/ui/plate";

type AdminSectionProps = {
  legend: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * A section of an admin form: a hide panel with a slab-caps running head
 * (the legend) and the field body beneath it.
 */
export function AdminSection({
  legend,
  description,
  children,
  className,
}: AdminSectionProps) {
  return (
    <section>
      <Plate className={className}>
        <PlateHead label={legend} description={description} labelAs="h2" />
        <div className="flex flex-col gap-5 p-4 sm:p-6">{children}</div>
      </Plate>
    </section>
  );
}
