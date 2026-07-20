import fs from "fs";
import path from "path";

const isVercel = process.env.VERCEL === "1";

// During Vercel deployment, do not clean server/public.
// Vercel serves the frontend from web/dist.
if (isVercel) {
  console.log("Vercel build detected. Skipping server/public cleanup.");
  process.exit(0);
}

// Legacy EC2 cleanup
const assetsDir = path.resolve("../server/public/assets");
const indexHtml = path.resolve("../server/public/index.html");

if (fs.existsSync(assetsDir)) {
  fs.rmSync(assetsDir, { recursive: true, force: true });
  console.log("Cleaned old assets directory");
}

if (fs.existsSync(indexHtml)) {
  fs.rmSync(indexHtml, { force: true });
  console.log("Cleaned old index.html");
}