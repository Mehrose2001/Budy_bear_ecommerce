import { notFound } from "next/navigation";
import ManagedLegalPage from "@/components/layout/ManagedLegalPage";
import { getDefaultLegalPage, LEGAL_PAGE_SLUGS } from "@/data/legalPages";

export function generateStaticParams() {
  return LEGAL_PAGE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = getDefaultLegalPage(slug);
  if (!page) return { title: "Page not found" };
  return { title: page.title, description: page.intro };
}

export default async function StoreLegalPage({ params }) {
  const { slug } = await params;
  const page = getDefaultLegalPage(slug);
  if (!page) notFound();
  return <ManagedLegalPage slug={page.slug} />;
}
