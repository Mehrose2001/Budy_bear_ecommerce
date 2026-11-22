import fs from "fs";
import path from "path";

export function loadEnvFiles() {
  for (const file of [".env.local", ".env", "backend/.env"]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

export function arg(name) {
  return process.argv.includes(name);
}

export function reportDir() {
  const dir = path.join("scripts", "migration-reports");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

export function clean(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}
