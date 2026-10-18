
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AdminField, AdminInput } from "@/components/admin/admin-field";
import { adminFormErrorClassName } from "@/components/admin/admin-form-styles";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

type AdminLoginFormProps = {
  nextPath: string;
};

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await authClient.signIn.email({
      email,
      password,
    });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Sign in failed");
      return;
    }

    await router.invalidate();
    navigate({ href: nextPath });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AdminField label="Email" htmlFor="email">
        <AdminInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </AdminField>

      <AdminField label="Password" htmlFor="password">
        <AdminInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </AdminField>

      {error ? (
        <p className={adminFormErrorClassName} role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
