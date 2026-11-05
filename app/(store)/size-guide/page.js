import ManagedLegalPage from "@/components/layout/ManagedLegalPage";
import { buildMetadata } from "@/data/seo";
import { getStorefrontSettings } from "@/lib/catalog";

export async function generateMetadata() {
  const settings = await getStorefrontSettings().catch(() => null);
  return buildMetadata({
    seo: settings?.seo,
    entry: settings?.seo?.pages?.["size-guide"],
    path: "/size-guide",
    fallbackTitle: "Size Guide",
    fallbackDescription:
      "Baby and kids sizing in months and years, plus how to measure chest, waist, and height.",
  });
}

export default function SizeGuidePage() {
  return <ManagedLegalPage slug="size-guide" />;
}
