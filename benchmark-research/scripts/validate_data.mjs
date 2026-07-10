import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const DATA_DIR = path.join(ROOT, "benchmark-research");
const MODEL_VERSION = "1.0.0";

const failures = [];
const warnings = [];

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, fileName), "utf8"));
}

function fail(pathLabel, message) {
  failures.push(`${pathLabel}: ${message}`);
}

function warn(pathLabel, message) {
  warnings.push(`${pathLabel}: ${message}`);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isUrl(value) {
  if (!hasText(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isDateTime(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function requireField(object, field, pathLabel) {
  if (object[field] === undefined || object[field] === null || object[field] === "") {
    fail(pathLabel, `missing required field "${field}"`);
    return false;
  }
  return true;
}

function requireEnum(value, allowedValues, pathLabel, field) {
  if (!allowedValues.includes(value)) {
    fail(pathLabel, `"${field}" must be one of ${allowedValues.join(", ")}; got ${JSON.stringify(value)}`);
    return false;
  }
  return true;
}

function requireArray(value, pathLabel, field, { nonEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    fail(pathLabel, `"${field}" must be an array`);
    return false;
  }
  if (nonEmpty && value.length === 0) {
    fail(pathLabel, `"${field}" must not be empty`);
    return false;
  }
  return true;
}

function checkV1Meta(meta, fileName, entityType) {
  if (!isObject(meta)) {
    fail(fileName, "missing meta object");
    return;
  }
  if (meta.schema_version !== MODEL_VERSION) fail(`${fileName}.meta`, `schema_version must be ${MODEL_VERSION}`);
  if (meta.data_model_version !== MODEL_VERSION) fail(`${fileName}.meta`, `data_model_version must be ${MODEL_VERSION}`);
  if (meta.entity_type !== entityType) fail(`${fileName}.meta`, `entity_type must be ${entityType}`);
  if (!isDate(meta.generated_at)) fail(`${fileName}.meta`, "generated_at must be YYYY-MM-DD");
  if (!isDate(meta.last_updated_at)) fail(`${fileName}.meta`, "last_updated_at must be YYYY-MM-DD");
  if (meta.canonical_model !== "benchmark-research/data_model_v1.json") {
    fail(`${fileName}.meta`, "canonical_model must point to benchmark-research/data_model_v1.json");
  }
}

function checkNoFrontendFields(value, pathLabel) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkNoFrontendFields(item, `${pathLabel}[${index}]`));
    return;
  }
  if (!isObject(value)) return;
  Object.entries(value).forEach(([key, nested]) => {
    if (key.startsWith("frontend_")) fail(pathLabel, `frontend-only field "${key}" must not be stored in research data`);
    checkNoFrontendFields(nested, `${pathLabel}.${key}`);
  });
}

function uniqueCheck(values, pathLabel) {
  const seen = new Set();
  values.forEach((value) => {
    if (seen.has(value)) fail(pathLabel, `duplicate id "${value}"`);
    seen.add(value);
  });
}

const model = readJson("data_model_v1.json");
const facts = readJson("objective_benchmark_facts_v1.json");
const excluded = readJson("excluded_benchmarks_v1.json");
const datasetSamples = readJson("dataset_samples_v1.json");
const publicResults = readJson("public_result_snapshots_v1.json");
const competitorVisibility = readJson("competitor_visibility_v1.json");
const refreshRuns = readJson("refresh_runs_v1.json");

const allowed = {
  benchmarkFamily: model.entities.benchmark.fields.benchmark_family.allowed_values,
  evaluationTarget: model.entities.benchmark.fields.evaluation_target.allowed_values,
  searchComponentRole: model.entities.benchmark.fields.search_component_role.allowed_values,
  recordType: model.entities.benchmark.fields.record_type.allowed_values,
  sourceType: model.entities.source.fields.source_type.allowed_values,
  sourceAccessMode: model.entities.source.fields.access_mode.allowed_values,
  datasetStatus: model.entities.dataset.fields.status.allowed_values,
  datasetSourceType: model.entities.dataset.fields.source_type.allowed_values,
  leaderboardSourceType: model.entities.leaderboard_result.fields.source_type.allowed_values,
  provider: model.entities.provider_appearance.fields.provider.allowed_values,
  appearanceType: model.entities.provider_appearance.fields.appearance_type.allowed_values,
  sourceIndependence: model.entities.provider_appearance.fields.source_independence.allowed_values,
  inclusionStatus: model.entities.provider_appearance.fields.inclusion_status.allowed_values,
  refreshRunType: model.entities.refresh_run.fields.run_type.allowed_values,
  refreshStatus: model.entities.refresh_run.fields.status.allowed_values,
};

const searchModes = [
  "agent_pool",
  "fixed_corpus",
  "live_web",
  "search_api_eval_framework",
  "state_gated_site",
  "third_party_report",
  "vendor_comparison",
];
const searchProviderPolicies = [
  "fixed_provider",
  "user_provided",
  "provider_selectable",
  "compared_providers",
  "vendor_published_comparison",
  "not_applicable",
  "unknown",
  "benchmark_defined",
];
const inputFields = [
  "problem",
  "question",
  "query",
  "task",
  "instruction",
  "turn",
  "text",
  "metadata",
  "task_id",
  "example_id",
  "query_id",
  "instance_id",
];

function checkSource(source, pathLabel) {
  if (!isObject(source)) {
    fail(pathLabel, "source must be an object");
    return;
  }
  requireEnum(source.source_type, allowed.sourceType, pathLabel, "source_type");
  if (!isUrl(source.url)) fail(pathLabel, "url must be http(s)");
  requireEnum(source.access_mode, allowed.sourceAccessMode, pathLabel, "access_mode");
  if (!isDate(source.last_checked_at)) fail(pathLabel, "last_checked_at must be YYYY-MM-DD");
}

function checkBenchmark(benchmark, pathLabel, { excludedRecord = false } = {}) {
  if (!isObject(benchmark)) {
    fail(pathLabel, "benchmark must be an object");
    return;
  }
  ["id", "canonical_name", "benchmark_family", "maintainer_org", "inclusion_status", "updated_at", "last_checked_at"].forEach((field) =>
    requireField(benchmark, field, pathLabel),
  );
  if (!/^[a-z0-9_]+$/.test(benchmark.id ?? "")) fail(pathLabel, "id must be stable snake_case");
  requireEnum(benchmark.benchmark_family, allowed.benchmarkFamily, pathLabel, "benchmark_family");
  if (!isDate(benchmark.updated_at)) fail(pathLabel, "updated_at must be YYYY-MM-DD");
  if (!isDate(benchmark.last_checked_at)) fail(pathLabel, "last_checked_at must be YYYY-MM-DD");
  requireArray(benchmark.sources, pathLabel, "sources", { nonEmpty: true });
  (benchmark.sources ?? []).forEach((source, index) => checkSource(source, `${pathLabel}.sources[${index}]`));

  if (excludedRecord) {
    if (benchmark.inclusion_status !== "excluded") fail(pathLabel, "excluded registry entries must have inclusion_status=excluded");
    requireEnum(benchmark.exclusion_reason, ["provided_context_only", "no_search_dependency", "out_of_scope"], pathLabel, "exclusion_reason");
    if (!hasText(benchmark.exclusion_notes)) fail(pathLabel, "excluded entries need exclusion_notes");
    return;
  }

  if (benchmark.inclusion_status !== "included") fail(pathLabel, "main registry entries must have inclusion_status=included");
  requireEnum(benchmark.evaluation_target, allowed.evaluationTarget, pathLabel, "evaluation_target");
  requireEnum(benchmark.search_component_role, allowed.searchComponentRole, pathLabel, "search_component_role");
  if (benchmark.record_type !== undefined) requireEnum(benchmark.record_type, allowed.recordType, pathLabel, "record_type");
  if (!hasText(benchmark.evaluation_target_rationale)) fail(pathLabel, "evaluation_target_rationale is required");

  if (!isObject(benchmark.dataset_facts)) fail(pathLabel, "dataset_facts must be an object");
  if (!isObject(benchmark.task_design)) {
    fail(pathLabel, "task_design must be an object");
  } else {
    ["task_input_type", "expected_output_type", "gold_type"].forEach((field) => requireField(benchmark.task_design, field, `${pathLabel}.task_design`));
  }
  if (!isObject(benchmark.search_protocol)) {
    fail(pathLabel, "search_protocol must be an object");
  } else {
    requireEnum(benchmark.search_protocol.mode, searchModes, `${pathLabel}.search_protocol`, "mode");
    requireEnum(benchmark.search_protocol.search_provider_policy, searchProviderPolicies, `${pathLabel}.search_protocol`, "search_provider_policy");
    if (typeof benchmark.search_protocol.search_required_for_evaluation !== "boolean") {
      fail(`${pathLabel}.search_protocol`, "search_required_for_evaluation must be boolean");
    }
  }
  if (!isObject(benchmark.evaluation)) {
    fail(pathLabel, "evaluation must be an object");
  } else {
    if (!requireArray(benchmark.evaluation.metrics, `${pathLabel}.evaluation`, "metrics", { nonEmpty: true })) return;
    requireField(benchmark.evaluation, "judge_type", `${pathLabel}.evaluation`);
  }
}

checkV1Meta(model, "data_model_v1.json", undefined);
if (model.schema_version !== MODEL_VERSION || model.data_model_version !== MODEL_VERSION) {
  fail("data_model_v1.json", "schema_version and data_model_version must be 1.0.0");
}
if (!isObject(model.entities)) fail("data_model_v1.json", "entities object is required");

checkV1Meta(facts.meta, "objective_benchmark_facts_v1.json", "benchmark_registry");
checkNoFrontendFields(facts, "objective_benchmark_facts_v1.json");
requireArray(facts.benchmarks, "objective_benchmark_facts_v1.json", "benchmarks", { nonEmpty: true });
uniqueCheck((facts.benchmarks ?? []).map((benchmark) => benchmark.id), "objective_benchmark_facts_v1.json.benchmarks");
(facts.benchmarks ?? []).forEach((benchmark, index) => checkBenchmark(benchmark, `objective_benchmark_facts_v1.json.benchmarks[${index}]`));

checkV1Meta(excluded.meta, "excluded_benchmarks_v1.json", "excluded_benchmark_registry");
checkNoFrontendFields(excluded, "excluded_benchmarks_v1.json");
requireArray(excluded.benchmarks, "excluded_benchmarks_v1.json", "benchmarks");
uniqueCheck((excluded.benchmarks ?? []).map((benchmark) => benchmark.id), "excluded_benchmarks_v1.json.benchmarks");
(excluded.benchmarks ?? []).forEach((benchmark, index) => checkBenchmark(benchmark, `excluded_benchmarks_v1.json.benchmarks[${index}]`, { excludedRecord: true }));

const includedIds = new Set((facts.benchmarks ?? []).map((benchmark) => benchmark.id));
const excludedIds = new Set((excluded.benchmarks ?? []).map((benchmark) => benchmark.id));
const allKnownIds = new Set([...includedIds, ...excludedIds]);

checkV1Meta(datasetSamples.meta, "dataset_samples_v1.json", "dataset_sample_registry");
checkNoFrontendFields(datasetSamples, "dataset_samples_v1.json");
if (!isObject(datasetSamples.datasets)) fail("dataset_samples_v1.json", "datasets must be an object keyed by benchmark_id");
Object.entries(datasetSamples.datasets ?? {}).forEach(([benchmarkId, dataset]) => {
  const pathLabel = `dataset_samples_v1.json.datasets.${benchmarkId}`;
  if (!isObject(dataset)) {
    fail(pathLabel, "dataset entry must be an object");
    return;
  }
  if (dataset.benchmark_id !== benchmarkId) fail(pathLabel, "benchmark_id must match object key");
  if (!allKnownIds.has(benchmarkId)) fail(pathLabel, "benchmark_id must exist in included or excluded benchmark registries");
  requireEnum(dataset.status, allowed.datasetStatus, pathLabel, "status");
  requireEnum(dataset.source_type, allowed.datasetSourceType, pathLabel, "source_type");
  if (!isUrl(dataset.source_url)) fail(pathLabel, "source_url must be http(s)");
  if (!isDate(dataset.last_checked_at)) fail(pathLabel, "last_checked_at must be YYYY-MM-DD");
  if (dataset.record_count_observed !== undefined && dataset.record_count_observed !== null && !Number.isInteger(dataset.record_count_observed)) {
    fail(pathLabel, "record_count_observed must be integer or null");
  }
  if (dataset.fields !== undefined) requireArray(dataset.fields, pathLabel, "fields");
  const metadataOnlyStatuses = new Set(["no_independent_dataset", "fetch_error", "viewer_error", "viewer_unsupported"]);
  if (metadataOnlyStatuses.has(dataset.status) && !hasText(dataset.notes)) {
    fail(pathLabel, `${dataset.status} entries require notes`);
  }
  if (!metadataOnlyStatuses.has(dataset.status)) {
    requireArray(dataset.rows, pathLabel, "rows", { nonEmpty: true });
    (dataset.rows ?? []).forEach((row, rowIndex) => {
      const rowPath = `${pathLabel}.rows[${rowIndex}]`;
      if (!isObject(row)) {
        fail(rowPath, "sample task row must be an object");
        return;
      }
      if (!Number.isInteger(row.row_idx)) fail(rowPath, "row_idx must be an integer");
      if (row.row_source_url !== undefined && !isUrl(row.row_source_url)) fail(rowPath, "row_source_url must be http(s)");
      if (row.truncated !== undefined && typeof row.truncated !== "boolean") fail(rowPath, "truncated must be boolean when present");
      if (!inputFields.some((field) => row[field] !== undefined)) {
        warn(rowPath, "sample row has no recognized task/query/content field; check source-native payload");
      }
    });
  }
  (dataset.related_samples ?? []).forEach((sample, sampleIndex) => {
    const samplePath = `${pathLabel}.related_samples[${sampleIndex}]`;
    if (!isObject(sample)) fail(samplePath, "related sample must be an object");
    if (sample.source_url !== undefined && !isUrl(sample.source_url)) fail(samplePath, "source_url must be http(s)");
    requireArray(sample.rows, samplePath, "rows", { nonEmpty: true });
  });
});

checkV1Meta(publicResults.meta, "public_result_snapshots_v1.json", "leaderboard_result_registry");
checkNoFrontendFields(publicResults, "public_result_snapshots_v1.json");
requireArray(publicResults.snapshots, "public_result_snapshots_v1.json", "snapshots", { nonEmpty: true });
uniqueCheck((publicResults.snapshots ?? []).map((snapshot) => snapshot.id), "public_result_snapshots_v1.json.snapshots");
(publicResults.snapshots ?? []).forEach((snapshot, index) => {
  const pathLabel = `public_result_snapshots_v1.json.snapshots[${index}]`;
  ["id", "benchmark_id", "title", "source_type", "source_url", "last_checked_at"].forEach((field) => requireField(snapshot, field, pathLabel));
  if (!includedIds.has(snapshot.benchmark_id)) fail(pathLabel, "benchmark_id must refer to an included benchmark");
  requireEnum(snapshot.source_type, allowed.leaderboardSourceType, pathLabel, "source_type");
  if (!isUrl(snapshot.source_url)) fail(pathLabel, "source_url must be http(s)");
  if (!isDate(snapshot.last_checked_at)) fail(pathLabel, "last_checked_at must be YYYY-MM-DD");
  const metrics = snapshot.metrics ?? [...new Set((snapshot.tables ?? []).flatMap((table) => table.metrics ?? []))];
  requireArray(metrics, pathLabel, "metrics", { nonEmpty: true });
  if (!Array.isArray(snapshot.rows) && !Array.isArray(snapshot.tables)) fail(pathLabel, "must include rows or tables");
  (snapshot.rows ?? []).forEach((row, rowIndex) => {
    const rowPath = `${pathLabel}.rows[${rowIndex}]`;
    if (!isObject(row)) fail(rowPath, "leaderboard row must be an object");
    if (!["model", "llm", "retriever"].some((field) => row[field] !== undefined)) {
      fail(rowPath, "row must identify model, llm, or retriever");
    }
  });
  (snapshot.tables ?? []).forEach((table, tableIndex) => {
    const tablePath = `${pathLabel}.tables[${tableIndex}]`;
    requireField(table, "name", tablePath);
    requireArray(table.metrics, tablePath, "metrics", { nonEmpty: true });
    requireArray(table.rows, tablePath, "rows", { nonEmpty: true });
  });
});

checkV1Meta(competitorVisibility.meta, "competitor_visibility_v1.json", "provider_appearance_registry");
checkNoFrontendFields(competitorVisibility, "competitor_visibility_v1.json");
requireArray(competitorVisibility.appearances, "competitor_visibility_v1.json", "appearances", { nonEmpty: true });
(competitorVisibility.appearances ?? []).forEach((appearance, index) => {
  const pathLabel = `competitor_visibility_v1.json.appearances[${index}]`;
  ["provider", "benchmark_id", "benchmark_or_eval", "appearance_type", "source_independence", "source_url", "details", "inclusion_status", "last_checked_at"].forEach((field) =>
    requireField(appearance, field, pathLabel),
  );
  requireEnum(appearance.provider, allowed.provider, pathLabel, "provider");
  requireEnum(appearance.appearance_type, allowed.appearanceType, pathLabel, "appearance_type");
  requireEnum(appearance.source_independence, allowed.sourceIndependence, pathLabel, "source_independence");
  requireEnum(appearance.inclusion_status, allowed.inclusionStatus, pathLabel, "inclusion_status");
  if (!isUrl(appearance.source_url)) fail(pathLabel, "source_url must be http(s)");
  if (!isDate(appearance.last_checked_at)) fail(pathLabel, "last_checked_at must be YYYY-MM-DD");
  if (!allKnownIds.has(appearance.benchmark_id)) fail(pathLabel, "benchmark_id must refer to included or excluded benchmark registry");
  if (appearance.inclusion_status === "included" && !includedIds.has(appearance.benchmark_id)) {
    fail(pathLabel, "included provider appearance must point to an included benchmark_id");
  }
  if (appearance.inclusion_status === "excluded" && !excludedIds.has(appearance.benchmark_id)) {
    fail(pathLabel, "excluded provider appearance must point to an excluded benchmark_id");
  }
  if (appearance.inclusion_status === "excluded" && !hasText(appearance.exclusion_reason)) {
    fail(pathLabel, "excluded provider appearance requires exclusion_reason");
  }
  if (appearance.score_or_metric !== null && appearance.score_or_metric !== undefined) {
    if (!isObject(appearance.score_or_metric)) fail(pathLabel, "score_or_metric must be object or null");
    if (isObject(appearance.score_or_metric)) {
      requireField(appearance.score_or_metric, "metric", `${pathLabel}.score_or_metric`);
      requireField(appearance.score_or_metric, "value", `${pathLabel}.score_or_metric`);
    }
  }
});

checkV1Meta(refreshRuns.meta, "refresh_runs_v1.json", "refresh_run_registry");
checkNoFrontendFields(refreshRuns, "refresh_runs_v1.json");
requireArray(refreshRuns.runs, "refresh_runs_v1.json", "runs", { nonEmpty: true });
uniqueCheck((refreshRuns.runs ?? []).map((run) => run.id), "refresh_runs_v1.json.runs");
(refreshRuns.runs ?? []).forEach((run, index) => {
  const pathLabel = `refresh_runs_v1.json.runs[${index}]`;
  ["id", "run_type", "status", "started_at", "input_files", "output_files", "summary"].forEach((field) => requireField(run, field, pathLabel));
  requireEnum(run.run_type, allowed.refreshRunType, pathLabel, "run_type");
  requireEnum(run.status, allowed.refreshStatus, pathLabel, "status");
  if (!isDateTime(run.started_at)) fail(pathLabel, "started_at must be ISO datetime with timezone");
  if (run.finished_at !== null && run.finished_at !== undefined && !isDateTime(run.finished_at)) {
    fail(pathLabel, "finished_at must be ISO datetime with timezone or null");
  }
  requireArray(run.input_files, pathLabel, "input_files", { nonEmpty: true });
  requireArray(run.output_files, pathLabel, "output_files", { nonEmpty: true });
});

if (warnings.length) {
  console.log("Warnings:");
  warnings.forEach((message) => console.log(`- ${message}`));
}

if (failures.length) {
  console.error("Validation failed:");
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Validation passed: v1 benchmark research data is structurally consistent.");
