import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNavLinks } from "@/components/admin/admin-nav-links";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { SkipToContent } from "@/components/skip-to-content";
import { ThemeMenu } from "@/components/theme-menu";
import { requireAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-full flex-col bg-edition-canvas text-edition-ink">
      <SkipToContent />
      <header className="border-b border-edition-hairline bg-edition-canvas">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-lg font-medium tracking-tight text-edition-ink"
            >
              ClearClef
            </Link>
            <AdminNavLinks />
          </div>
          <div className="flex items-center gap-3">
            <ThemeMenu />
            <p className="hidden type-body-sm text-edition-muted sm:block">
              {session.user.email}
            </p>
            <AdminSignOutButton />
          </div>
        </div>
      </header>
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8 outline-none focus-visible:ring-3 focus-visible:ring-edition-hairline-strong/50"
      >
        {children}
      </main>
    </div>
  );
}
