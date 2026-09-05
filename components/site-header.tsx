import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            ClearClef
          </Link>
          <p className="hidden text-sm text-zinc-500 sm:block">
            Public MusicXML catalog
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-zinc-600 hover:text-foreground dark:text-zinc-400"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}
