import { seedCatalog } from "../src/services/seed.js";

const result = await seedCatalog();
console.log("Catalog seeded:", result);
