import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { needsAdminSetup } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await needsAdminSetup()) {
    redirect("/admin/setup");
  }

  return (
    <AdminAuthShell
      title="Admin sign in"
      description="Sign in with your admin account to manage uploads."
    >
      <Suspense fallback={<p className="type-body-sm text-edition-muted">Loading…</p>}>
        <AdminLoginForm />
      </Suspense>
    </AdminAuthShell>
  );
}
