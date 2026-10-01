"use client";

import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import StarRating from "@/components/ui/StarRating";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useToast } from "@/context/ToastContext";

export default function ReviewForm({ productId, onCreated }) {
  const { user, authHeaders } = useCustomerAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    author: user?.name || "",
    rating: 5,
    title: "",
    comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setForm((current) => ({ ...current, author: current.author || user.name }));
    }
  }, [user?.name]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ ...form, productId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to save review.");
      showToast("Thank you. Your review is now on this product.");
      onCreated?.(data.review);
      setForm({ author: user?.name || form.author, rating: 5, title: "", comment: "" });
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-4 rounded-2xl border border-neutral-200 bg-white p-5"
    >
      <h3 className="text-lg font-black text-neutral-900">Write a review</h3>
      <Input
        label="Name"
        name="author"
        value={form.author}
        onChange={(event) => setForm({ ...form, author: event.target.value })}
        required
      />
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">Your rating</p>
        <StarRating rating={form.rating} size="lg" onChange={(rating) => setForm({ ...form, rating })} />
      </div>
      <Input
        label="Title"
        name="title"
        value={form.title}
        onChange={(event) => setForm({ ...form, title: event.target.value })}
        placeholder="What did you like?"
      />
      <div>
        <label htmlFor="comment" className="mb-2 block text-sm font-medium text-neutral-700">
          Review
        </label>
        <textarea
          id="comment"
          required
          minLength={8}
          rows={4}
          value={form.comment}
          onChange={(event) => setForm({ ...form, comment: event.target.value })}
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-brand-primary"
          placeholder="Share fit, fabric, and how your child liked it."
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Submit review"}
      </Button>
    </form>
  );
}
