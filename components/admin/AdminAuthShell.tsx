import Link from "next/link";

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
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 shadow-sm">
        <div className="mb-8 space-y-2">
          <Link href="/" className="text-sm font-medium text-zinc-500">
            ClearClef
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
