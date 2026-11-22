import { getProductPage } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const runtime = "nodejs";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params;
    const page = await getProductPage(slug);
    return { title: page?.product?.name || "Product" };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  let name = "";
  let message = "";
  try {
    const page = await getProductPage(slug);
    if (!page?.product) {
      return (
        <div className="mx-auto max-w-xl px-4 py-16">
          <h1 className="text-2xl font-black">Product not found</h1>
          <p className="mt-2 text-sm text-neutral-600">{slug}</p>
        </div>
      );
    }
    name = page.product.name;
  } catch (error) {
    message = error?.message || String(error);
  }

  if (message) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-black">Product lookup failed</h1>
        <p className="mt-2 text-sm text-neutral-600">{message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-black">{name}</h1>
      <p className="mt-2 text-sm text-neutral-600">Product page data loaded.</p>
    </div>
  );
}
