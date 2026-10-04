import { Suspense } from "react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import TrackOrderForm from "@/components/order/TrackOrderForm";

export const metadata = { title: "Track your order" };

export default function TrackOrderPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Track your order" },
        ]}
      />
      <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-primary">
        Track your order
      </h1>
      <p className="mt-3 text-neutral-600">
        Enter the order ID from your receipt and the phone number used at checkout.
        Status follows the same steps as our orders desk: Pending, Confirmed, then Dispatch or Canceled.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-neutral-100" />}>
          <TrackOrderForm />
        </Suspense>
      </div>
    </div>
  );
}
