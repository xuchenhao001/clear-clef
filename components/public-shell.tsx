import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SkipToContent } from "@/components/skip-to-content";
import { cn } from "cn";

type PublicShellProps = {
  children: React.ReactNode;
  mainClassName?: string;
};

const mainFocusClassName =
  "outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring";

/**
 * The public shell: the grained near-black ground, a rail of a header, and the
 * colophon rail at the foot. There is no page background other than the floor —
 * the menus have no cards to hold the content, so the content is the page.
 */
export function PublicShell({ children, mainClassName }: PublicShellProps) {
  return (
    <div className="surface-ground flex min-h-dvh flex-col text-edition-ink">
      <SkipToContent />
      <SiteHeader />
      <main
        id="content"
        tabIndex={-1}
        className={cn("flex flex-1 flex-col", mainFocusClassName, mainClassName)}
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
