import fs from "fs";
import path from "path";
import { arg, loadEnvFiles, reportDir, writeJson } from "./lib/migration-env.mjs";

loadEnvFiles();

function mediaRoot() {
  const configured = String(process.env.MEDIA_ROOT || "").trim();
  if (configured) return path.resolve(configured);
  return path.resolve("storage", "uploads");
}

const root = mediaRoot();
const probeName = ".budybear-persistence-probe.json";
const probePath = path.join(root, probeName);
const checkOnly = arg("--check");

if (!root) {
  console.error("MEDIA_ROOT is not set.");
  process.exit(1);
}

if (!checkOnly) {
  fs.mkdirSync(root, { recursive: true });
  const payload = {
    writtenAt: new Date().toISOString(),
    note: "If this file survives a Hostinger Node.js deploy/rebuild/restart, MEDIA_ROOT is persistent.",
    mediaRoot: root,
  };
  fs.writeFileSync(probePath, JSON.stringify(payload, null, 2));
}

const exists = fs.existsSync(probePath);
const report = {
  generatedAt: new Date().toISOString(),
  mediaRoot: root,
  probePath,
  exists,
  mode: checkOnly ? "check" : "write",
  passed: exists,
  instructions: [
    "1. Run this script once to write the probe file into MEDIA_ROOT.",
    "2. Deploy or rebuild the Hostinger Node.js app.",
    "3. Restart the Node.js application.",
    "4. Run node scripts/verify-media-persistence.mjs --check",
    "5. Declare filesystem migration successful only if exists=true after those steps.",
  ],
};

writeJson(`${reportDir()}/persistence-probe.json`, report);
console.log(JSON.stringify(report, null, 2));
if (!exists) process.exit(1);
