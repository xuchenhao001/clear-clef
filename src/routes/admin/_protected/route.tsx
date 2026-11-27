import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { loadAdminSession } from "@/src/server/auth";

export const Route = createFileRoute("/admin/_protected")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  loader: async ({ location }) => {
    const session = await loadAdminSession();
    if (!session) {
      throw redirect({
        to: "/admin/login",
        search: { next: location.pathname },
      });
    }
    return { session };
  },
  component: ProtectedAdminLayout,
});

function ProtectedAdminLayout() {
  const { session } = Route.useLoaderData();
  return (
    <AdminShell email={session.user.email}>
      <Outlet />
    </AdminShell>
  );
}
