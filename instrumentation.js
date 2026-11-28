export async function register() {
  // Order import runs from the Hostinger health/admin paths, not at boot,
  // so local webpack does not bundle Node-only crypto modules.
}
