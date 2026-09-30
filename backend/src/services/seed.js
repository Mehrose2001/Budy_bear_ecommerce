import { requireSupabase } from "../supabase.js";
import { productToRow } from "../lib/map.js";
import {
  seedBanners,
  seedCategories,
  seedCoupons,
  seedProducts,
  seedReviewsFor,
} from "../data/catalogSeed.js";

export async function seedCatalog() {
  const supabase = await requireSupabase();

  const { error: categoryError } = await supabase.from("categories").upsert(
    seedCategories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      subcategories: category.subcategories,
    }))
  );
  if (categoryError) throw categoryError;

  const { error: productError } = await supabase.from("products").upsert(
    seedProducts.map((product) => ({
      id: product.id,
      ...productToRow(product),
    }))
  );
  if (productError) throw productError;

  const { error: seqError } = await supabase.rpc("sync_product_id_seq");
  if (seqError) throw seqError;

  const reviews = seedProducts.flatMap(seedReviewsFor).map((review) => ({
    id: review.id,
    product_id: review.productId,
    product_name: review.productName,
    author: review.author,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    status: review.status,
    created_at: `${review.created_at}T12:00:00.000Z`,
  }));
  const { error: reviewError } = await supabase.from("reviews").upsert(reviews);
  if (reviewError) throw reviewError;

  const { error: couponError } = await supabase.from("coupons").upsert(
    seedCoupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      label: coupon.label,
      discount_percent: coupon.discountPercent,
      min_order: coupon.minOrder,
      active: coupon.active,
    }))
  );
  if (couponError) throw couponError;

  const { error: bannerError } = await supabase.from("banners").upsert(seedBanners);
  if (bannerError) throw bannerError;

  return {
    products: seedProducts.length,
    categories: seedCategories.length,
    reviews: reviews.length,
    coupons: seedCoupons.length,
    banners: seedBanners.length,
  };
}
