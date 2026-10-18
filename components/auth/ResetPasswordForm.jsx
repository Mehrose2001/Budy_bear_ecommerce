"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import BrandLogo from "@/components/layout/BrandLogo";

function readRecoveryFromUrl() {
  if (typeof window === "undefined") {
    return { accessToken: "", tokenHash: "", code: "", token: "", email: "" };
  }
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    accessToken: hash.get("access_token") || search.get("access_token") || "",
    tokenHash: search.get("token_hash") || hash.get("token_hash") || "",
    code: search.get("code") || hash.get("code") || "",
    token: search.get("token") || hash.get("token") || "",
    email: search.get("email") || hash.get("email") || "",
  };
}

export default function ResetPasswordForm({ audience = "customer" }) {
  const isAdmin = audience === "admin";
  const loginHref = isAdmin ? "/admin/login" : "/login";
  const forgotHref = isAdmin ? "/admin/forgot-password" : "/forgot-password";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recovery, setRecovery] = useState({
    accessToken: "",
    tokenHash: "",
    code: "",
    token: "",
    email: "",
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecovery(readRecoveryFromUrl());
    setReady(true);
  }, []);

  const hasLink = Boolean(
    recovery.accessToken || recovery.tokenHash || recovery.code || (recovery.token && recovery.email)
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          accessToken: recovery.accessToken,
          tokenHash: recovery.tokenHash,
          code: recovery.code,
          token: recovery.token,
          email: recovery.email,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Unable to update password.");
        return;
      }
      setMessage(data.message || "Your password has been updated. You can sign in now.");
    } catch {
      setError("Unable to update password. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={isAdmin ? "" : "mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12"}>
      <BrandLogo size={64} showWordmark />
      <h1 className="mt-6 text-2xl font-black text-brand-primary">Set a new password</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Choose a new password for your {isAdmin ? "admin" : "Budy Bear"} account.
      </p>

      {!ready ? (
        <p className="mt-8 text-sm text-neutral-500">Checking your reset link...</p>
      ) : !hasLink ? (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-error">
            This reset link is missing or has expired. Request a new one and open it from your email.
          </p>
          <Link href={forgotHref} className="inline-block text-sm font-semibold text-brand-primary">
            Request a new reset link
          </Link>
        </div>
      ) : message ? (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-brand-primary">{message}</p>
          <Button href={loginHref} className="w-full" size="lg">
            Sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input
            label="New password"
            type="password"
            name="new-password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
          />
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Update password"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-neutral-600">
        <Link href={loginHref} className="font-semibold text-brand-primary">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
