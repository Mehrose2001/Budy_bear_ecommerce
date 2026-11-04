import { notFound } from "next/navigation";
import AdminLegalEditor from "@/components/admin/AdminLegalEditor";
import { getDefaultLegalPage } from "@/data/legalPages";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = getDefaultLegalPage(slug);
  return { title: page?.title || "Page" };
}

export default async function AdminLegalPage({ params }) {
  const { slug } = await params;
  const page = getDefaultLegalPage(slug);
  if (!page) notFound();
  return <AdminLegalEditor slug={page.slug} title={page.title} />;
}
