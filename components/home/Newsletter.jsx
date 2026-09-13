"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] bg-neutral-900 px-8 py-12 text-center sm:px-12">
        <h2 className="text-3xl font-black tracking-tight text-white">
          Join the Budy Bear Family
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-neutral-400">
          Get exclusive offers, new arrival alerts, and parenting tips delivered
          to your inbox.
        </p>

        {submitted ? (
          <p className="mt-8 text-sm font-medium text-brand-accent">
            Thank you for subscribing! Welcome to the Budy Bear family.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <Input
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              inputClassName="rounded-full"
              aria-label="Email address"
              required
            />
            <Button type="submit" size="lg" className="shrink-0">
              Subscribe
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
