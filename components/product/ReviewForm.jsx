"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useToast } from "@/context/ToastContext";

export default function ReviewForm({ productId }) {
  const { user, authHeaders } = useCustomerAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    author: user?.name || "",
    rating: 5,
    title: "",
    comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      showToast("Thank you. Your review was submitted for approval.");
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
        <label htmlFor="rating" className="mb-2 block text-sm font-medium text-neutral-700">
          Rating
        </label>
        <select
          id="rating"
          value={form.rating}
          onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })}
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-brand-primary"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} star{value === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </div>
      <Input
        label="Title"
        name="title"
        value={form.title}
        onChange={(event) => setForm({ ...form, title: event.target.value })}
      />
      <div>
        <label htmlFor="comment" className="mb-2 block text-sm font-medium text-neutral-700">
          Review
        </label>
        <textarea
          id="comment"
          required
          rows={4}
          value={form.comment}
          onChange={(event) => setForm({ ...form, comment: event.target.value })}
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-brand-primary"
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Submit review"}
      </Button>
    </form>
  );
}
