"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AdminSignOutButton() {
  const router = useRouter();

  async function onSignOut() {
    await authClient.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      className="type-hint hover:text-edition-gilt focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
    >
      Sign out
    </button>
  );
}
