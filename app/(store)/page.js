import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import ProductSection from "@/components/home/ProductSection";
import CollectionBanner from "@/components/home/CollectionBanner";
import Testimonials from "@/components/home/Testimonials";
import Newsletter from "@/components/home/Newsletter";
import {
  getBestSellers,
  getNewArrivals,
  listCategories,
} from "@/lib/catalog";

export default async function HomePage() {
  const [newArrivals, bestSellers, categories] = await Promise.all([
    getNewArrivals(),
    getBestSellers(),
    listCategories(),
  ]);

  return (
    <>
      <Hero />
      <CategoryGrid categories={categories} />
      <ProductSection
        title="New Arrivals"
        description="Fresh styles and latest drops for the season."
        products={newArrivals.slice(0, 8)}
        viewAllHref="/products?new=true"
      />
      <CollectionBanner />
      <ProductSection
        title="Best Sellers"
        description="Customer favorites loved by parents across Pakistan."
        products={bestSellers.slice(0, 8)}
        viewAllHref="/products?bestSeller=true"
      />
      <Testimonials />
      <Newsletter />
    </>
  );
}
