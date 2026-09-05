import { SiteHeader } from "@/components/site-header";
import { SkipToContent } from "@/components/skip-to-content";
import { cn } from "cn";

type PublicShellProps = {
  children: React.ReactNode;
  mainClassName?: string;
};

const mainFocusClassName =
  "outline-none focus-visible:ring-3 focus-visible:ring-edition-hairline-strong/50";

export function PublicShell({ children, mainClassName }: PublicShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-edition-canvas text-edition-ink">
      <SkipToContent />
      <SiteHeader />
      <main
        id="content"
        tabIndex={-1}
        className={cn("flex flex-1 flex-col", mainFocusClassName, mainClassName)}
      >
        {children}
      </main>
    </div>
  );
}
