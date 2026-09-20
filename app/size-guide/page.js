import Link from "next/link";
import InfoPage from "@/components/layout/InfoPage";

export const metadata = { title: "Size Guide" };

export default function SizeGuidePage() {
  return (
    <InfoPage
      title="Size Guide"
      intro="Sizes are listed in months for babies and years for older kids. If your child is between sizes, we recommend choosing the larger size."
    >
      <h2>Baby (months)</h2>
      <p>0-3M, 3-6M, 6-9M, 9-12M, 12-18M, and 18-24M depending on the style.</p>
      <h2>Kids (years)</h2>
      <p>2-3Y through older year sizes as shown on each product page.</p>
      <h2>How to measure</h2>
      <ul>
        <li>Chest: around the fullest part, tape level</li>
        <li>Waist: around the natural waist</li>
        <li>Height: standing straight, without shoes</li>
      </ul>
      <p>
        Still unsure? Message us from <Link href="/contact">Contact Us</Link> with
        age, height, and the product name — we will suggest a size.
      </p>
    </InfoPage>
  );
}
