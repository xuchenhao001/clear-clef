"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminField, AdminInput } from "@/components/admin/admin-field";
import { adminFormErrorClassName } from "@/components/admin/admin-form-styles";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AdminSetupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setPending(false);
      return;
    }

    const setupResponse = await fetch("/api/admin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!setupResponse.ok) {
      const payload = (await setupResponse.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(payload?.error ?? "Failed to create admin account");
      setPending(false);
      return;
    }

    const signInResult = await authClient.signIn.email({
      email,
      password,
    });

    setPending(false);

    if (signInResult.error) {
      setError(signInResult.error.message ?? "Account created but sign-in failed");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AdminField label="Name" htmlFor="name">
        <AdminInput
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </AdminField>

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
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </AdminField>

      <AdminField label="Confirm password" htmlFor="confirmPassword">
        <AdminInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </AdminField>

      {error ? (
        <p className={adminFormErrorClassName} role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating admin…" : "Create admin account"}
      </Button>
    </form>
  );
}
