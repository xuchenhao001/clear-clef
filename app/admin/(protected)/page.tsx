import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Upload scores and manage the public catalog.
        </p>
      </div>
      <Link
        href="/admin/upload"
        className="inline-flex w-fit rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
      >
        Upload a score
      </Link>
    </div>
  );
}
