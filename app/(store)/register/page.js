"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import BrandLogo from "@/components/layout/BrandLogo";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useCustomerAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");
    const result = await register(form);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.needsConfirm) {
      setMessage("Check your email to confirm the account, then sign in.");
      return;
    }
    router.replace("/account");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <BrandLogo size={64} showWordmark />
      <h1 className="mt-6 text-2xl font-black text-brand-primary">Create account</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Save favourites and track Cash on Delivery orders.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Full name"
          name="fullName"
          value={form.fullName}
          onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
        <Input
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />
        {error && <p className="text-sm text-error">{error}</p>}
        {message && <p className="text-sm text-brand-primary">{message}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
