import { redirect } from "next/navigation";
import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { AdminSetupForm } from "@/components/admin/AdminSetupForm";
import { needsAdminSetup } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  if (!(await needsAdminSetup())) {
    redirect("/admin/login");
  }

  return (
    <AdminAuthShell
      title="Create admin account"
      description="This instance has no admin yet. Create the first account to manage the catalog."
    >
      <AdminSetupForm />
    </AdminAuthShell>
  );
}
