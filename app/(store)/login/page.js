"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import BrandLogo from "@/components/layout/BrandLogo";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useCustomerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    const result = await login(email, password);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace(result.user?.role === "admin" ? "/admin" : "/account");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <BrandLogo size={64} showWordmark />
      <h1 className="mt-6 text-2xl font-black text-brand-primary">Sign in</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Access your orders, favourites, and delivery details.
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
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-neutral-600">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand-primary">
          Create an account
        </Link>
      </p>
    </div>
  );
}
