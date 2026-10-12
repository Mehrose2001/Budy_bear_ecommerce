import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const localPath = path.join(root, ".env.local");
const backendPath = path.join(root, "backend", ".env");

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const map = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    map[line.slice(0, index).trim()] = line.slice(index + 1);
  }
  return map;
}

function writeEnv(filePath, updates) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8").split(/\r?\n/) : [];
  const seen = new Set();
  const next = existing.map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)=/);
    if (!match || !(match[1] in updates)) return line;
    seen.add(match[1]);
    return `${match[1]}=${updates[match[1]]}`;
  });
  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) next.push(`${key}=${value}`);
  }
  const text = next.join("\n").replace(/\n*$/, "\n");
  fs.writeFileSync(filePath, text, "utf8");
}

const backend = parseEnv(backendPath);
const local = parseEnv(localPath);
const email = process.env.ADMIN_BOOTSTRAP_EMAIL || "BudyBear2026@gmail.com";
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
if (!password) {
  console.error("Set ADMIN_BOOTSTRAP_PASSWORD before running this script.");
  process.exit(1);
}

writeEnv(backendPath, {
  ADMIN_BOOTSTRAP_EMAIL: email,
  ADMIN_BOOTSTRAP_PASSWORD: password,
});

writeEnv(localPath, {
  SUPABASE_URL: local.SUPABASE_URL || local.NEXT_PUBLIC_SUPABASE_URL || backend.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: local.SUPABASE_ANON_KEY || local.NEXT_PUBLIC_SUPABASE_ANON_KEY || backend.SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: local.SUPABASE_SERVICE_ROLE_KEY || backend.SUPABASE_SERVICE_ROLE_KEY || "",
  ADMIN_BOOTSTRAP_EMAIL: email,
  ADMIN_BOOTSTRAP_PASSWORD: password,
});

console.log("Admin env updated (email only):", email);
console.log("Next service role present:", Boolean(parseEnv(localPath).SUPABASE_SERVICE_ROLE_KEY));
