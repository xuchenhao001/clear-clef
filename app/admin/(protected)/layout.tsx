import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
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
      <header className="border-b border-edition-hairline bg-edition-canvas">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-medium tracking-tight">
              ClearClef
            </Link>
            <nav className="flex items-center gap-4 type-nav-link">
              <Link href="/admin" className="hover:text-edition-ink">
                Dashboard
              </Link>
              <Link href="/admin/upload" className="hover:text-edition-ink">
                Upload
              </Link>
            </nav>
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
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
