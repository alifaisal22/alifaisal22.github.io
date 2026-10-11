import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

async function readText(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  return readFile(fullPath, "utf8");
}

async function validateFeatureFlags() {
  const content = await readText("platform/config/feature-flags.json");
  const data = JSON.parse(content);
  assert(!!data.features, "feature-flags.json: missing features object");
  assert(!!data.rollout, "feature-flags.json: missing rollout object");

  const requiredFeatures = [
    "unifiedAuth",
    "resumeTailorV2",
    "jobTrackerUnified",
    "mockInterviewUnified",
    "codingSandboxUnified",
    "proctoringLiveSignals",
    "proctoringScorePenalty",
  ];

  for (const key of requiredFeatures) {
    assert(typeof data.features[key] === "boolean", `feature-flags.json: ${key} must be boolean`);
  }

  for (const key of ["internalUsersPercent", "betaUsersPercent", "generalUsersPercent"]) {
    const value = data.rollout[key];
    assert(Number.isInteger(value), `feature-flags.json: ${key} must be an integer`);
    assert(value >= 0 && value <= 100, `feature-flags.json: ${key} must be between 0 and 100`);
  }
}

async function validateReliabilityGates() {
  const content = await readText("platform/testing/reliability-gates.json");
  const data = JSON.parse(content);
  assert(Array.isArray(data.qualityGates), "reliability-gates.json: qualityGates must be an array");
  assert(Array.isArray(data.releasePhases), "reliability-gates.json: releasePhases must be an array");

  for (const gate of data.qualityGates || []) {
    assert(typeof gate.name === "string" && gate.name.length > 0, "quality gate name must be non-empty string");
    assert(typeof gate.required === "boolean", `quality gate '${gate.name}': required must be boolean`);
    assert(typeof gate.target === "string" && gate.target.length > 0, `quality gate '${gate.name}': target required`);
    assert(
      ["pending", "pass", "fail"].includes(gate.status),
      `quality gate '${gate.name}': status must be pending|pass|fail`
    );
  }
}

async function validateOpenApiContract() {
  const content = await readText("platform/contracts/openapi.yaml");
  const requiredMarkers = [
    "openapi: 3.0.3",
    "/api/auth/login:",
    "/api/resume/tailor:",
    "/api/jobs/track:",
    "/api/interview/session/start:",
    "/api/interview/session/{sessionId}/sandbox:",
    "/api/interview/session/{sessionId}/proctoring:",
  ];

  for (const marker of requiredMarkers) {
    assert(content.includes(marker), `openapi.yaml: missing '${marker}'`);
  }
}

async function validateAiProvider() {
  const content = await readText("platform/services/aiProvider.ts");
  for (const marker of [
    "export type AiTaskType",
    "export interface AiProvider",
    "export function resolveProvider(",
    "export async function runUnifiedAiTask(",
  ]) {
    assert(content.includes(marker), `aiProvider.ts: missing '${marker}'`);
  }
}

async function validateSqlMigration() {
  const content = await readText("platform/data/migrations/001_unified_schema.sql");
  assert(content.includes("BEGIN;"), "001_unified_schema.sql: missing BEGIN");
  assert(content.includes("COMMIT;"), "001_unified_schema.sql: missing COMMIT");

  const tables = ["users", "interview_sessions", "sandbox_events", "proctoring_events", "job_applications", "legacy_mappings"];
  for (const table of tables) {
    assert(content.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `001_unified_schema.sql: missing table '${table}'`);
  }
}

async function main() {
  await validateFeatureFlags();
  await validateReliabilityGates();
  await validateOpenApiContract();
  await validateAiProvider();
  await validateSqlMigration();

  if (failures.length > 0) {
    console.error("Asset validation failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("All integration assets validated successfully.");
}

main().catch((error) => {
  console.error("Validation execution failed:", error);
  process.exit(1);
});
