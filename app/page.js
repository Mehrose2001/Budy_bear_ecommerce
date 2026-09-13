import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import ProductSection from "@/components/home/ProductSection";
import CollectionBanner from "@/components/home/CollectionBanner";
import SchoolSection from "@/components/home/SchoolSection";
import PromoBanner from "@/components/home/PromoBanner";
import Newsletter from "@/components/home/Newsletter";
import {
  getBestSellers,
  getNewArrivals,
  getProductsByCategory,
} from "@/lib/catalogStore";

export default function HomePage() {
  const newArrivals = getNewArrivals().slice(0, 8);
  const bestSellers = getBestSellers().slice(0, 8);
  const toys = getProductsByCategory("toys").slice(0, 8);
  const schoolProducts = getProductsByCategory("school").slice(0, 4);

  return (
    <>
      <Hero />
      <CategoryGrid />
      <ProductSection
        title="New Arrivals"
        description="Fresh styles and latest drops for the season."
        products={newArrivals}
        viewAllHref="/products?new=true"
      />
      <CollectionBanner />
      <SchoolSection />
      <ProductSection
        title="School Essentials"
        description="Backpacks, lunch boxes, stationery, and more."
        products={schoolProducts}
        viewAllHref="/category/school"
      />
      <ProductSection
        title="Best Sellers"
        description="Customer favorites loved by parents across Pakistan."
        products={bestSellers}
        viewAllHref="/products?bestSeller=true"
      />
      <ProductSection
        title="Toys Collection"
        description="Fun, educational, and adventure-ready toys for every age."
        products={toys}
        viewAllHref="/category/toys"
      />
      <PromoBanner />
      <Newsletter />
    </>
  );
}
