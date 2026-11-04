import Link from "next/link";
import { brand } from "@/data/brand";
import { buildMetadata } from "@/data/seo";
import { getStorefrontSettings } from "@/lib/catalog";
import { getWhatsAppChatUrl } from "@/lib/orderNotifications";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";

export async function generateMetadata() {
  const settings = await getStorefrontSettings().catch(() => null);
  return buildMetadata({
    seo: settings?.seo,
    entry: settings?.seo?.pages?.contact,
    path: "/contact",
    fallbackTitle: "Contact Us",
    fallbackDescription: "Questions about an order, size, or delivery? Message Budy Bear on WhatsApp, call, or email.",
  });
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Contact Us" },
        ]}
      />
      <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-primary">
        Contact Budy Bear
      </h1>
      <p className="mt-3 text-neutral-600">
        Questions about an order, size, or delivery? Message us on WhatsApp,
        call, or email. We usually reply on working days.
      </p>
      <div className="mt-8 space-y-3 rounded-3xl border border-border bg-white p-6 text-neutral-700">
        <p>
          <span className="font-semibold text-brand-primary">WhatsApp / Phone:</span>{" "}
          {brand.whatsapp}
        </p>
        <p>
          <span className="font-semibold text-brand-primary">Email:</span>{" "}
          <a href={`mailto:${brand.supportEmail}`} className="font-medium text-brand-primary underline">
            {brand.supportEmail}
          </a>
        </p>
        <p>
          <span className="font-semibold text-brand-primary">Location:</span>{" "}
          {brand.companyAddress}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button href={getWhatsAppChatUrl("Hi Budy Bear, I would like to get in touch.")}>
          Chat on WhatsApp
        </Button>
        <Button href={`mailto:${brand.supportEmail}`} variant="outline">
          Email us
        </Button>
      </div>
      <p className="mt-8 text-sm text-neutral-500">
        You can also read our <Link href="/faqs" className="font-semibold text-brand-primary">FAQs</Link>,{" "}
        <Link href="/shipping" className="font-semibold text-brand-primary">Shipping</Link>, and{" "}
        <Link href="/returns" className="font-semibold text-brand-primary">Returns</Link> pages.
      </p>
    </div>
  );
}
