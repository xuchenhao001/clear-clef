import { AdminEmptyState } from "@/components/admin/admin-empty-state";

export default function AdminNotFound() {
  return (
    <AdminEmptyState
      title="Page not found"
      description="This admin page does not exist, or the score may have been removed."
      primaryHref="/admin/scores"
      primaryLabel="Back to scores"
      secondaryHref="/admin"
      secondaryLabel="Overview"
    />
  );
}
