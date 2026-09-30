import Link from "next/link";
import InfoPage from "@/components/layout/InfoPage";
import { brand } from "@/data/brand";

export const metadata = { title: "FAQs" };

const faqs = [
  {
    q: "Do you offer Cash on Delivery?",
    a: "Yes. Cash on Delivery is available across Pakistan. Please keep the order total ready for the rider.",
  },
  {
    q: "When is delivery free?",
    a: "Delivery is free on orders above Rs. 3,000. Smaller orders may include a delivery fee shown at checkout.",
  },
  {
    q: "How long does delivery take?",
    a: "Most cities receive orders within a few working days. Express delivery is available for Karachi and Sindh where shown at checkout.",
  },
  {
    q: "How do I choose the right size?",
    a: "Use our size guide and the month/year labels on each product. If you are between sizes, we usually recommend sizing up for growing kids.",
  },
  {
    q: "Can I return or exchange an item?",
    a: "Unused items in original condition can be returned or exchanged within 7 days. Please see Returns & Exchanges for hygiene exceptions.",
  },
  {
    q: "How do I track or change an order?",
    a: `Message us on WhatsApp at ${brand.whatsapp} with your order ID. We will confirm status or help with an address update if the parcel has not shipped.`,
  },
];

export default function FaqsPage() {
  return (
    <InfoPage
      title="FAQs"
      intro="Quick answers about ordering, delivery, sizes, and returns."
    >
      <div className="space-y-3">
        {faqs.map((item) => (
          <details
            key={item.q}
            className="rounded-2xl border border-border bg-white px-5 py-4"
          >
            <summary className="cursor-pointer list-none font-bold text-brand-primary">
              {item.q}
            </summary>
            <p className="mt-2 text-neutral-600">{item.a}</p>
          </details>
        ))}
      </div>
      <p>
        Still need help? Visit <Link href="/contact">Contact Us</Link> or email{" "}
        <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>.
      </p>
    </InfoPage>
  );
}
