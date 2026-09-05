export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-16">
      <main className="flex w-full max-w-xl flex-col gap-6">
        <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
          Public score catalog
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">ClearClef</h1>
        <p className="text-lg leading-7 text-zinc-600 dark:text-zinc-400">
          MusicXML is the canonical format. Catalog pages will read D1 metadata;
          engraving stays in the browser with Verovio.
        </p>
        <p className="text-sm text-zinc-500">
          Phase 1 scaffold is in place. Catalog list and upload come next.
        </p>
      </main>
    </div>
  );
}
