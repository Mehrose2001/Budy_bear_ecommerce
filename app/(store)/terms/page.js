import Link from "next/link";
import InfoPage from "@/components/layout/InfoPage";
import { brand } from "@/data/brand";

export const metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms & Conditions"
      intro={`Please read these terms before shopping with ${brand.name}. By placing an order on our website you agree to them.`}
    >
      <h2>1. Who we are</h2>
      <p>
        {brand.name} is a kidswear brand based in {brand.companyAddress}. These
        terms apply to every order placed through our website.
      </p>

      <h2>2. Orders and acceptance</h2>
      <p>
        An order is an offer to buy. We may accept or decline an order if an item
        is out of stock, priced incorrectly, or we cannot deliver to your area.
        You will receive confirmation by WhatsApp or email after checkout.
      </p>

      <h2>3. Pricing and payment</h2>
      <p>
        All prices are in Pakistani Rupees (PKR) and include applicable taxes
        unless we say otherwise. We currently accept Cash on Delivery. Please
        keep the exact amount ready when the parcel arrives.
      </p>

      <h2>4. Product information</h2>
      <p>
        We try to show colours, fabrics, and sizes as accurately as possible.
        Small differences can happen because of screen settings or handmade
        details. Measurements are a guide — please check our{" "}
        <Link href="/size-guide">size guide</Link> before you buy.
      </p>

      <h2>5. Delivery</h2>
      <p>
        Delivery timelines are estimates. Delays can happen due to courier
        operations, weather, or incomplete addresses. See{" "}
        <Link href="/shipping">Shipping & Delivery</Link> for current options,
        including express service in Karachi and Sindh.
      </p>

      <h2>6. Returns</h2>
      <p>
        Unused items in original condition may be returned within 7 days. Baby
        innerwear and hygiene-sensitive pieces may not be returnable. Full
        details are on our <Link href="/returns">Returns & Exchanges</Link> page.
      </p>

      <h2>7. Use of the website</h2>
      <p>
        You agree not to misuse the site, copy our product images or content
        without permission, or attempt to interfere with checkout or accounts.
      </p>

      <h2>8. Liability</h2>
      <p>
        {brand.name} is not responsible for indirect losses such as delay in a
        gift occasion, or issues caused by an incorrect address you provided.
        Nothing in these terms limits rights you have under Pakistani consumer
        law.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these terms from time to time. The version on this page
        applies to new orders placed after the update.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions? Email{" "}
        <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a> or
        WhatsApp {brand.whatsapp}. You can also use our{" "}
        <Link href="/contact">contact page</Link>.
      </p>
    </InfoPage>
  );
}
