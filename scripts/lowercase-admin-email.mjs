import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(import.meta.dirname, "..");
const wanted = "budybear2026@gmail.com";

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const map = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    map[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }
  return map;
}

const env = {
  ...parseEnv(path.join(root, "backend", ".env")),
  ...parseEnv(path.join(root, ".env")),
  ...parseEnv(path.join(root, ".env.local")),
};

const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (error) {
  console.error(error.message);
  process.exit(1);
}

const matches = (data?.users || []).filter(
  (user) => String(user.email || "").trim().toLowerCase() === wanted
);
if (!matches.length) {
  console.error("No admin auth user found for that email.");
  process.exit(1);
}

for (const user of matches) {
  if (String(user.email) !== wanted) {
    const updated = await supabase.auth.admin.updateUserById(user.id, {
      email: wanted,
      email_confirm: true,
    });
    if (updated.error) {
      console.error(updated.error.message);
      process.exit(1);
    }
  }
  const profile = await supabase
    .from("profiles")
    .update({ email: wanted })
    .eq("id", user.id);
  if (profile.error) {
    console.error(profile.error.message);
    process.exit(1);
  }
}

const settings = await supabase
  .from("store_settings")
  .update({ support_email: "support@budybear.com" })
  .eq("id", 1);
if (settings.error) {
  console.error(settings.error.message);
  process.exit(1);
}

console.log("Admin login email is now lowercase in Auth and profile.");
