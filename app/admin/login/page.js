"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import BrandLogo from "@/components/layout/BrandLogo";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { DEMO_ADMIN } from "@/data/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isReady } = useAdminAuth();
  const [email, setEmail] = useState(DEMO_ADMIN.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/admin");
    }
  }, [isReady, isAuthenticated, router]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = login(email, password);
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
          Sign in to manage products, orders, and store content.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" size="lg">
            Sign in
          </Button>
        </form>

        <div className="mt-6 rounded-2xl bg-brand-cream px-4 py-3 text-xs text-neutral-600">
          <p className="font-semibold text-brand-primary">Demo access</p>
          <p className="mt-1">{DEMO_ADMIN.email}</p>
          <p>{DEMO_ADMIN.password}</p>
        </div>
      </div>
    </div>
  );
}
