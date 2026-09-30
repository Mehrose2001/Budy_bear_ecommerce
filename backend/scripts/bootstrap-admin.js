import { bootstrapAdmin } from "../src/services/auth.js";

const admin = await bootstrapAdmin();
console.log("Admin ready:", admin.email);
