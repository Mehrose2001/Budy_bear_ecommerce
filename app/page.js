import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import ProductSection from "@/components/home/ProductSection";
import CollectionBanner from "@/components/home/CollectionBanner";
import Testimonials from "@/components/home/Testimonials";
import Newsletter from "@/components/home/Newsletter";
import {
  getBestSellers,
  getNewArrivals,
} from "@/lib/catalogStore";

export default function HomePage() {
  const newArrivals = getNewArrivals().slice(0, 8);
  const bestSellers = getBestSellers().slice(0, 8);

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
      <ProductSection
        title="Best Sellers"
        description="Customer favorites loved by parents across Pakistan."
        products={bestSellers}
        viewAllHref="/products?bestSeller=true"
      />
      <Testimonials />
      <Newsletter />
    </>
  );
}
