export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (String(process.env.USE_HOSTINGER_BACKEND || "").toLowerCase() !== "true") return;
  try {
    const { importMissingSupabaseOrders } = await import(
      "@/services/hostinger/importSupabaseOrders"
    );
    const result = await importMissingSupabaseOrders({ force: true });
    if (result?.imported || result?.reason) {
      console.info("Hostinger order import:", result);
    }
  } catch (error) {
    console.warn("Hostinger order import skipped:", error?.message || error);
  }
}
