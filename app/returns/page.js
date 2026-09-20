import Link from "next/link";
import InfoPage from "@/components/layout/InfoPage";
import { brand } from "@/data/brand";

export const metadata = { title: "Returns & Exchanges" };

export default function ReturnsPage() {
  return (
    <InfoPage
      title="Returns & Exchanges"
      intro="We want your little one to be comfortable. If something is not right, we will help within 7 days of delivery."
    >
      <h2>Return window</h2>
      <p>
        You can request a return or exchange within 7 days of receiving your
        parcel. After 7 days we may not be able to accept the item.
      </p>

      <h2>What we can accept</h2>
      <ul>
        <li>Unworn, unwashed items with tags attached</li>
        <li>Original packaging where possible</li>
        <li>Wrong size, wrong item, or a manufacturing fault</li>
      </ul>

      <h2>What we cannot accept</h2>
      <ul>
        <li>Items washed, worn, stained, or damaged after delivery</li>
        <li>Baby innerwear, socks, or hygiene-sensitive products once opened</li>
        <li>Sale items marked as final sale, unless they arrived faulty</li>
      </ul>

      <h2>How to start a return</h2>
      <p>
        WhatsApp {brand.whatsapp} or email{" "}
        <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a> with
        your order ID, photos of the item, and whether you want a size exchange
        or a refund. Our team will share the next step.
      </p>

      <h2>Refunds</h2>
      <p>
        Because most orders are Cash on Delivery, approved refunds are processed
        by bank transfer or another method we confirm with you. Courier charges
        are non-refundable unless the item was faulty or we sent the wrong
        product.
      </p>

      <p>
        For delivery questions see <Link href="/shipping">Shipping & Delivery</Link>.
      </p>
    </InfoPage>
  );
}
