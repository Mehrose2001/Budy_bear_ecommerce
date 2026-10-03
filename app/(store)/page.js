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
  listStoreBanners,
  listStoreTestimonials,
} from "@/lib/catalog";

export default async function HomePage() {
  const [newArrivals, bestSellers, categories, banners, testimonialReviews] = await Promise.all([
    getNewArrivals().catch(() => []),
    getBestSellers().catch(() => []),
    listCategories().catch(() => []),
    listStoreBanners().catch(() => []),
    listStoreTestimonials().catch(() => []),
  ]);

  const testimonials = (testimonialReviews || []).map((review) => ({
    name: review.author,
    city: review.productName || "Verified buyer",
    rating: review.rating,
    quote: review.comment,
  }));

  return (
    <>
      <Hero banners={banners} />
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
      <Testimonials items={testimonials} />
      <Newsletter />
    </>
  );
}
