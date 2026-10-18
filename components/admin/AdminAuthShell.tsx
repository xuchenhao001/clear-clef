import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SkipToContent } from "@/components/skip-to-content";
import { cn } from "cn";

type AdminAuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * The sign-in and first-run screens wear the public portal's own chrome: the
 * same hide header (wordmark, Catalog / Admin with the vermilion current tab,
 * appearance menu) and the same board colophon. With no score to show, the body
 * is the marbled endpaper with the plate pasted on — the same treatment as the
 * public 404 — so the gate reads as part of the binding, not a detached card.
 */
export function AdminAuthShell({
  title,
  description,
  children,
  className,
}: AdminAuthShellProps) {
  return (
    <div className="surface-ground flex min-h-dvh flex-col text-edition-ink">
      <SkipToContent />
      <SiteHeader />
      <main
        id="content"
        tabIndex={-1}
        className="flex flex-1 items-center justify-center px-6 py-12 outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
      >
        <div className={cn("w-full max-w-md", className)}>
            <div className="surface-board on-board border border-edition-hairline px-6 py-8 sm:px-8 sm:py-9">
              <p className="type-imprint">ClearClef · Admin</p>
              <h1 className="type-page-h1 mt-2 text-balance">{title}</h1>
              <p className="mt-2 type-body-sm text-edition-muted text-pretty">
                {description}
              </p>
              <div className="mt-8">{children}</div>
            </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
