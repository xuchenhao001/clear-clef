import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { checkNeedsAdminSetup } from "@/src/server/auth";

type LoginSearch = {
  next?: string;
};

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search): LoginSearch => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  beforeLoad: async () => {
    if (await checkNeedsAdminSetup()) {
      throw redirect({ to: "/admin/setup" });
    }
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { next } = Route.useSearch();

  return (
    <AdminAuthShell
      title="Admin sign in"
      description="Sign in with your admin account to manage the catalog."
    >
      <Suspense
        fallback={<p className="type-body-sm text-edition-muted">Loading…</p>}
      >
        <AdminLoginForm nextPath={next ?? "/admin"} />
      </Suspense>
    </AdminAuthShell>
  );
}
