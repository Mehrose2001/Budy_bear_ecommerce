import Link from "next/link";
import ManagedLegalPage from "@/components/layout/ManagedLegalPage";
import Button from "@/components/ui/Button";
import { brand } from "@/data/brand";
import { buildMetadata } from "@/data/seo";
import { getStorefrontSettings } from "@/lib/catalog";
import { getWhatsAppChatUrl } from "@/lib/orderNotifications";

export async function generateMetadata() {
  const settings = await getStorefrontSettings().catch(() => null);
  return buildMetadata({
    seo: settings?.seo,
    entry: settings?.seo?.pages?.contact,
    path: "/contact",
    fallbackTitle: "Contact Us",
    fallbackDescription:
      "Questions about an order, size, or delivery? Message Budy Bear on WhatsApp, call, or email.",
  });
}

export default function ContactPage() {
  return (
    <div>
      <ManagedLegalPage slug="contact" />
      <div className="-mt-6 mx-auto max-w-3xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-3">
          <Button href={getWhatsAppChatUrl("Hi Budy Bear, I would like to get in touch.")}>
            Chat on WhatsApp
          </Button>
          <Button href={`mailto:${brand.supportEmail}`} variant="outline">
            Email us
          </Button>
        </div>
        <p className="mt-6 text-sm text-neutral-500">
          You can also read our <Link href="/faqs" className="font-semibold text-brand-primary">FAQs</Link>,{" "}
          <Link href="/shipping" className="font-semibold text-brand-primary">Shipping</Link>, and{" "}
          <Link href="/returns" className="font-semibold text-brand-primary">Returns</Link> pages.
        </p>
      </div>
    </div>
  );
}
