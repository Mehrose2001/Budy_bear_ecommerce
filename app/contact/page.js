import { brand } from "@/data/brand";
import { getWhatsAppChatUrl } from "@/lib/orderNotifications";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Contact Us",
};

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
        Questions about an order, size, or delivery? Message us on WhatsApp or call.
      </p>
      <div className="mt-8 space-y-3 rounded-3xl border border-border bg-white p-6 text-neutral-700">
        <p>
          <span className="font-semibold text-brand-primary">WhatsApp / Phone:</span>{" "}
          {brand.whatsapp}
        </p>
        <p>
          <span className="font-semibold text-brand-primary">Email:</span>{" "}
          {brand.supportEmail}
        </p>
        <p>
          <span className="font-semibold text-brand-primary">Location:</span>{" "}
          {brand.companyAddress}
        </p>
      </div>
      <Button
        href={getWhatsAppChatUrl("Hi Budy Bear, I would like to get in touch.")}
        className="mt-6"
      >
        Chat on WhatsApp
      </Button>
    </div>
  );
}
