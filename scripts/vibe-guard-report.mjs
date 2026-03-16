import fs from "node:fs";
import path from "node:path";

const reportPath = process.argv[2] || "reports/vibe-guard-report.json";
const resolved = path.resolve(reportPath);

if (!fs.existsSync(resolved)) {
  console.error(`[vibe-guard] Report not found: ${resolved}`);
  process.exit(1);
}

const raw = fs.readFileSync(resolved, "utf8");
let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error("[vibe-guard] Invalid JSON report.");
  console.error(err);
  process.exit(1);
}

const buckets = { critical: 0, high: 0, medium: 0, low: 0, info: 0, unknown: 0 };
const candidates = [];

if (Array.isArray(data)) candidates.push(...data);
if (Array.isArray(data?.findings)) candidates.push(...data.findings);
if (Array.isArray(data?.issues)) candidates.push(...data.issues);
if (Array.isArray(data?.results)) candidates.push(...data.results);
if (Array.isArray(data?.vulnerabilities)) candidates.push(...data.vulnerabilities);

for (const item of candidates) {
  const sev = String(item?.severity || item?.level || "unknown").toLowerCase();
  if (buckets[sev] !== undefined) buckets[sev] += 1;
  else buckets.unknown += 1;
}

const total = Object.values(buckets).reduce((a, b) => a + b, 0);
console.log("[vibe-guard] Security scan summary");
console.log(`- report: ${resolved}`);
console.log(`- total findings: ${total}`);
for (const [k, v] of Object.entries(buckets)) {
  if (v > 0) console.log(`- ${k}: ${v}`);
}

if (total === 0 && typeof data?.summary === "object") {
  console.log("- raw summary:", JSON.stringify(data.summary));
}
