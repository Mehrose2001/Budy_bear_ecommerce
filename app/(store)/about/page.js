import Link from "next/link";
import InfoPage from "@/components/layout/InfoPage";
import { brand } from "@/data/brand";

export const metadata = { title: "About Budy Bear" };

export default function AboutPage() {
  return (
    <InfoPage
      title="About Budy Bear"
      intro={brand.slogan}
    >
      <p>
        {brand.name} is a kidswear brand from {brand.companyAddress}. We design
        clothing and accessories that feel soft, look cheerful, and keep up with
        everyday play — from first rompers to school-run outfits.
      </p>
      <h2>What we stand for</h2>
      <ul>
        <li>Comfort first: breathable fabrics and easy movement</li>
        <li>Honest sizing in months and years so parents can shop with confidence</li>
        <li>Cash on Delivery and support on WhatsApp across Pakistan</li>
      </ul>
      <p>
        {brand.description} Explore Boys, Girls, Baby, Accessories, and Gifts on
        our <Link href="/products">shop</Link>, or say hello on{" "}
        <Link href="/contact">Contact Us</Link>.
      </p>
    </InfoPage>
  );
}
