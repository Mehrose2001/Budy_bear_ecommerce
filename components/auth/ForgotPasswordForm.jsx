"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import BrandLogo from "@/components/layout/BrandLogo";

export default function ForgotPasswordForm({ audience = "customer" }) {
  const isAdmin = audience === "admin";
  const loginHref = isAdmin ? "/admin/login" : "/login";
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, audience }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Unable to send a reset email.");
        return;
      }
      setMessage(data.message || "Check your email for a reset link.");
    } catch {
      setError("Unable to send a reset email. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={isAdmin ? "" : "mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12"}>
      <BrandLogo size={64} showWordmark />
      <h1 className="mt-6 text-2xl font-black text-brand-primary">Forgot password</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Enter the email you use to sign in. We will send a link to set a new password.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {error ? <p className="text-sm text-error">{error}</p> : null}
        {message ? <p className="text-sm text-brand-primary">{message}</p> : null}
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-neutral-600">
        Remember it?{" "}
        <Link href={loginHref} className="font-semibold text-brand-primary">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
