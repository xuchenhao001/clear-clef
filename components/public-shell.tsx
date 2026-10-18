import { SiteHeader } from "@/components/site-header";
import { SkipToContent } from "@/components/skip-to-content";
import { cn } from "cn";

type PublicShellProps = {
  children: React.ReactNode;
  mainClassName?: string;
};

const mainFocusClassName =
  "outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring";

export function PublicShell({ children, mainClassName }: PublicShellProps) {
  return (
    <div className="surface-paper flex min-h-full flex-col text-edition-ink">
      <SkipToContent />
      <SiteHeader />
      <main
        id="content"
        tabIndex={-1}
        className={cn("flex flex-1 flex-col", mainFocusClassName, mainClassName)}
      >
        {children}
      </main>
      <footer className="surface-board on-board border-t border-edition-board-line">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-6 py-6">
          <p className="type-running-head">
            Set in Cormorant Garamond, EB Garamond and Public Sans
          </p>
          <p className="type-running-head">ClearClef, MMXXVI</p>
        </div>
      </footer>
    </div>
  );
}
