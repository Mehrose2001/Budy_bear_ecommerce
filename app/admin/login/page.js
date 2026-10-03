"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import BrandLogo from "@/components/layout/BrandLogo";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isReady } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/admin");
    }
  }, [isReady, isAuthenticated, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace("/admin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-white p-8 shadow-lg">
        <BrandLogo size={64} showWordmark />
        <h1 className="mt-6 text-2xl font-black text-brand-primary">
          Admin login
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Sign in with your admin email and password. The session ends on page
          reload, after 15 minutes idle, or after 30 minutes, and when the
          login token expires.
        </p>

        <form onSubmit={handleSubmit} autoComplete="off" className="mt-8 space-y-4">
          <Input
            label="Email"
            type="email"
            name="admin-email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            name="admin-password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
