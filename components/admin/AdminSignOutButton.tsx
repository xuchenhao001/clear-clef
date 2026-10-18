
import { useNavigate, useRouter } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export function AdminSignOutButton() {
  const navigate = useNavigate();
  const router = useRouter();

  async function onSignOut() {
    await authClient.signOut();
    navigate({ to: "/admin/login" });
    await router.invalidate();
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
