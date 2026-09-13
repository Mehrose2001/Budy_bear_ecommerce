"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import {
  BANK_DETAILS,
  DELIVERY_METHODS,
  PAKISTAN_PROVINCES,
  PAYMENT_METHODS,
} from "@/data/checkout";
import { getShippingCost } from "@/lib/orders";
import { saveLocalOrder } from "@/lib/storage";
import { cn } from "@/lib/utils";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "Punjab",
  postalCode: "",
  deliveryMethod: "standard",
  paymentMethod: "cod",
  notes: "",
};

function validate(form) {
  const errors = {};

  if (!form.fullName.trim()) errors.fullName = "Full name is required.";
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!/^0?3\d{9}$/.test(form.phone.replace(/\s|-/g, ""))) {
    errors.phone = "Enter a valid Pakistani mobile number.";
  }
  if (!form.address.trim()) errors.address = "Street address is required.";
  if (!form.city.trim()) errors.city = "City is required.";
  if (!form.province) errors.province = "Select a province.";
  if (!form.postalCode.trim()) errors.postalCode = "Postal code is required.";
  if (form.paymentMethod === "online") {
    errors.paymentMethod = "Online payment is not available yet.";
  }

  return errors;
}

export function useCheckoutForm(totals) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { showToast } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const selectedPayment = PAYMENT_METHODS.find(
    (method) => method.id === form.paymentMethod
  );

  const liveTotals = useMemo(() => {
    const shipping = getShippingCost(
      totals.subtotal - totals.discount,
      form.deliveryMethod
    );
    return {
      ...totals,
      shipping,
      total: totals.subtotal - totals.discount + shipping,
    };
  }, [form.deliveryMethod, totals]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          subtotal: liveTotals.subtotal,
          discount: liveTotals.discount,
          shipping: liveTotals.shipping,
          total: liveTotals.total,
          deliveryMethod: form.deliveryMethod,
          paymentMethod: form.paymentMethod,
          customer: {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
          },
          shippingAddress: {
            fullName: form.fullName.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            province: form.province,
            postalCode: form.postalCode.trim(),
            phone: form.phone.trim(),
          },
          notes: form.notes.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not place order.");
      }

      saveLocalOrder(data.order);
      clearCart();
      showToast("Your order has been placed.");
      router.push(`/order/${data.order.id}`);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { form, liveTotals, errors, isSubmitting, updateField, handleSubmit, selectedPayment };
}

export function CheckoutFields({
  form,
  errors,
  updateField,
  handleSubmit,
  isSubmitting,
  selectedPayment,
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <section className="rounded-3xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-black text-neutral-900">Contact details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input
            label="Full Name"
            name="fullName"
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            error={errors.fullName}
            autoComplete="name"
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            error={errors.email}
            autoComplete="email"
            required
          />
          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            error={errors.phone}
            placeholder="03XXXXXXXXX"
            autoComplete="tel"
            className="sm:col-span-2"
            required
          />
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-black text-neutral-900">Delivery address</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input
            label="Address"
            name="address"
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
            error={errors.address}
            className="sm:col-span-2"
            autoComplete="street-address"
            required
          />
          <Input
            label="City"
            name="city"
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
            error={errors.city}
            autoComplete="address-level2"
            required
          />
          <div>
            <label htmlFor="province" className="mb-2 block text-sm font-medium text-neutral-700">
              Province
            </label>
            <select
              id="province"
              name="province"
              value={form.province}
              onChange={(event) => updateField("province", event.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            >
              {PAKISTAN_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Postal Code"
            name="postalCode"
            value={form.postalCode}
            onChange={(event) => updateField("postalCode", event.target.value)}
            error={errors.postalCode}
            autoComplete="postal-code"
            required
          />
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-black text-neutral-900">Delivery method</h2>
        <div className="mt-5 grid gap-3">
          {DELIVERY_METHODS.map((method) => (
            <label
              key={method.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-4",
                form.deliveryMethod === method.id
                  ? "border-brand-primary bg-brand-cream"
                  : "border-neutral-200"
              )}
            >
              <input
                type="radio"
                name="deliveryMethod"
                value={method.id}
                checked={form.deliveryMethod === method.id}
                onChange={() => updateField("deliveryMethod", method.id)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-neutral-900">
                  {method.label}
                </span>
                <span className="text-sm text-neutral-500">{method.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-black text-neutral-900">Payment method</h2>
        <div className="mt-5 grid gap-3">
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4",
                !method.enabled && "cursor-not-allowed opacity-60",
                method.enabled && "cursor-pointer",
                form.paymentMethod === method.id
                  ? "border-brand-primary bg-brand-cream"
                  : "border-neutral-200"
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={form.paymentMethod === method.id}
                disabled={!method.enabled}
                onChange={() => updateField("paymentMethod", method.id)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-neutral-900">
                  {method.label}
                </span>
                <span className="text-sm text-neutral-500">{method.detail}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.paymentMethod && (
          <p className="mt-2 text-sm text-error">{errors.paymentMethod}</p>
        )}

        {form.paymentMethod === "cod" && (
          <p className="mt-4 rounded-xl bg-brand-cream px-4 py-3 text-sm text-neutral-700">
            Cash on Delivery is confirmed instantly. Please keep the exact amount
            ready for the rider.
          </p>
        )}

        {form.paymentMethod === "bank-transfer" && (
          <div className="mt-4 rounded-xl bg-brand-cream px-4 py-3 text-sm text-neutral-700">
            <p className="font-semibold">Transfer to:</p>
            <p className="mt-2">{BANK_DETAILS.accountTitle}</p>
            <p>{BANK_DETAILS.bank}</p>
            <p>Account: {BANK_DETAILS.accountNumber}</p>
            <p>IBAN: {BANK_DETAILS.iban}</p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6">
        <label htmlFor="notes" className="text-lg font-black text-neutral-900">
          Order notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="Apartment, landmark, or delivery instructions (optional)"
          className="mt-4 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
      </section>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? "Placing order..."
          : selectedPayment?.id === "cod"
            ? "Place COD order"
            : "Place order"}
      </Button>
    </form>
  );
}
