import Link from "next/link";
import { ThemeMenu } from "@/components/theme-menu";
import { SkipToContent } from "@/components/skip-to-content";

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
      <SkipToContent />
      <div className="absolute top-6 right-6">
        <ThemeMenu />
      </div>
      <main
        id="content"
        tabIndex={-1}
        className="w-full max-w-md outline-none focus-visible:ring-3 focus-visible:ring-edition-hairline-strong/50"
      >
        <div className="rounded-xl border border-edition-hairline bg-edition-surface-card p-8">
          <div className="mb-8 space-y-2">
            <Link
              href="/"
              className="text-lg font-medium tracking-tight text-edition-ink"
            >
              ClearClef
            </Link>
            <h1 className="type-page-h1">{title}</h1>
            <p className="type-body-sm text-edition-muted">{description}</p>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
