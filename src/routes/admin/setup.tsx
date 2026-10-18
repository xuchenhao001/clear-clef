import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { AdminSetupForm } from "@/components/admin/AdminSetupForm";
import { checkNeedsAdminSetup } from "@/src/server/auth";

export const Route = createFileRoute("/admin/setup")({
  beforeLoad: async () => {
    if (!(await checkNeedsAdminSetup())) {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminSetupPage,
});

function AdminSetupPage() {
  return (
    <AdminAuthShell
      className="max-w-lg"
      title="Create admin account"
      description="This instance has no admin yet. Create the first account to manage the catalog."
    >
      <AdminSetupForm />
    </AdminAuthShell>
  );
}
