import Link from "next/link";

export default function ScoreNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Score not found</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        This score is private, unlisted, or does not exist.
      </p>
      <Link href="/" className="text-sm font-medium text-primary hover:underline">
        Back to catalog
      </Link>
    </div>
  );
}
