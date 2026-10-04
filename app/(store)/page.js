import Hero from "@/components/home/Hero";
import CategoryGrid, { CategoryCircles } from "@/components/home/CategoryGrid";
import ProductSection from "@/components/home/ProductSection";
import CollectionBanner from "@/components/home/CollectionBanner";
import Testimonials from "@/components/home/Testimonials";
import Newsletter from "@/components/home/Newsletter";
import {
  getBestSellers,
  getNewArrivals,
  getStorefrontSettings,
  listCategories,
  listStoreBanners,
  listStoreTestimonials,
} from "@/lib/catalog";
import { getSeasonalCollection } from "@/lib/seasonalCollection";

export default async function HomePage() {
  const [newArrivals, bestSellers, categories, banners, testimonialReviews, settings] = await Promise.all([
    getNewArrivals().catch(() => []),
    getBestSellers().catch(() => []),
    listCategories().catch(() => []),
    listStoreBanners().catch(() => []),
    listStoreTestimonials().catch(() => []),
    getStorefrontSettings().catch(() => ({ seasonalCollection: "winter" })),
  ]);
  const collection = getSeasonalCollection(settings?.seasonalCollection);

  const testimonials = (testimonialReviews || []).map((review) => ({
    name: review.author,
    city: review.productName || "Verified buyer",
    rating: review.rating,
    quote: review.comment,
  }));

  return (
    <>
      <Hero banners={banners} />
      <CategoryCircles categories={categories} />
      <CategoryGrid categories={categories} />
      <ProductSection
        title="Best Sellers"
        description="Customer favorites loved by parents across Pakistan."
        products={bestSellers.slice(0, 8)}
        viewAllHref="/products?bestSeller=true"
      />
      <CollectionBanner season={collection.id} />
      <ProductSection
        title={collection.label}
        description={collection.description}
        products={newArrivals.slice(0, 8)}
        viewAllHref="/products?new=true"
      />
      <Testimonials items={testimonials} />
      <Newsletter />
    </>
  );
}
