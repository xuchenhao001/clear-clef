import Link from "next/link";
import { ThemeMenu } from "@/components/theme-menu";

type AdminAuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AdminAuthShell({
  title,
  description,
  children,
}: AdminAuthShellProps) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center bg-edition-canvas px-6 py-16 text-edition-ink">
      <div className="absolute top-6 right-6">
        <ThemeMenu />
      </div>
      <div className="w-full max-w-md rounded-xl border border-edition-hairline bg-edition-surface-card p-8">
        <div className="mb-8 space-y-2">
          <Link href="/" className="type-nav-link hover:text-edition-ink">
            ClearClef
          </Link>
          <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
          <p className="type-body-sm text-edition-muted">{description}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
