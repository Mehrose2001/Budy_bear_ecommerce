import { notFound } from "next/navigation";
import ManagedLegalPage from "@/components/layout/ManagedLegalPage";
import { getDefaultLegalPage, LEGAL_PAGE_SLUGS } from "@/data/legalPages";
import { buildMetadata } from "@/data/seo";
import { getLegalPage, getStorefrontSettings } from "@/lib/catalog";

export function generateStaticParams() {
  return LEGAL_PAGE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getLegalPage(slug);
  if (!page) return { title: "Page not found" };
  const settings = await getStorefrontSettings().catch(() => null);
  return buildMetadata({
    seo: settings?.seo,
    entry: settings?.seo?.pages?.[page.slug],
    path: page.href,
    fallbackTitle: page.title,
    fallbackDescription: page.intro,
  });
}

export default async function StoreLegalPage({ params }) {
  const { slug } = await params;
  const page = getDefaultLegalPage(slug);
  if (!page) notFound();
  return <ManagedLegalPage slug={page.slug} />;
}
