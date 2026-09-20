import Link from "next/link";
import InfoPage from "@/components/layout/InfoPage";
import { brand } from "@/data/brand";

export const metadata = { title: "Shipping & Delivery" };

export default function ShippingPage() {
  return (
    <InfoPage
      title="Shipping & Delivery"
      intro="We deliver across Pakistan. Timelines below are estimates and start after we confirm your Cash on Delivery order."
    >
      <h2>Delivery charges</h2>
      <ul>
        <li>Free delivery on orders above Rs. 3,000</li>
        <li>A delivery fee may apply below that amount and is shown at checkout</li>
      </ul>

      <h2>Standard delivery</h2>
      <p>
        Most cities receive parcels within a few working days after dispatch.
        Remote areas can take longer.
      </p>

      <h2>Express delivery</h2>
      <p>
        Express is available for Karachi and Sindh when you select it at
        checkout. It is not offered for other provinces.
      </p>

      <h2>What we need from you</h2>
      <p>
        Please share a complete address, landmark, and an active phone number.
        The rider will collect cash on delivery. If a parcel is returned because
        of a wrong number or refused delivery, extra courier charges may apply
        on a reattempt.
      </p>

      <p>
        Questions? <Link href="/contact">Contact us</Link> or WhatsApp{" "}
        {brand.whatsapp}.
      </p>
    </InfoPage>
  );
}
