import Link from "next/link";

type WordmarkProps = {
  href?: string;
};

/** Bone slab and one vermilion bar. The same mark on every rail. */
export function Wordmark({ href = "/" }: WordmarkProps) {
  return (
    <Link href={href} className="flex items-center gap-1.5">
      <span className="type-wordmark">ClearClef</span>
      <span aria-hidden className="block h-[0.9rem] w-[0.2rem] bg-edition-vermilion" />
    </Link>
  );
}
