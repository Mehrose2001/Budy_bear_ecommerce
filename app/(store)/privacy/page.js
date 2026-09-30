import Link from "next/link";
import InfoPage from "@/components/layout/InfoPage";
import { brand } from "@/data/brand";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro={`This policy explains how ${brand.name} collects and uses your information when you shop with us.`}
    >
      <h2>Information we collect</h2>
      <p>When you place an order or message us, we may collect:</p>
      <ul>
        <li>Name, phone number, email, and delivery address</li>
        <li>Order details, sizes, and product preferences</li>
        <li>Messages you send on WhatsApp or email</li>
        <li>Basic website usage such as pages visited (via cookies or analytics)</li>
      </ul>

      <h2>How we use it</h2>
      <p>We use this information to:</p>
      <ul>
        <li>Process and deliver your orders</li>
        <li>Share shipping slips and order updates</li>
        <li>Answer questions and handle returns</li>
        <li>Improve our website, products, and service</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We share details only with delivery partners and tools needed to run the
        store (for example, hosting). We do not sell your personal information.
      </p>

      <h2>WhatsApp and email</h2>
      <p>
        Order confirmations and support may be sent on WhatsApp ({brand.whatsapp})
        or email ({brand.supportEmail}). You can ask us to stop promotional
        messages at any time. Transactional order messages may still be required
        to complete a purchase.
      </p>

      <h2>Data security and retention</h2>
      <p>
        We keep order records as long as needed for delivery, returns, and legal
        accounting. Please use a secure device when checking out.
      </p>

      <h2>Your choices</h2>
      <p>
        You may request a copy, correction, or deletion of personal data we hold,
        subject to records we must keep for completed orders. Contact{" "}
        <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>.
      </p>

      <h2>Children</h2>
      <p>
        Our products are for children, but accounts and checkouts are for parents
        or guardians. We do not knowingly collect data directly from children.
      </p>

      <p>
        See also our <Link href="/terms">Terms & Conditions</Link>.
      </p>
    </InfoPage>
  );
}
