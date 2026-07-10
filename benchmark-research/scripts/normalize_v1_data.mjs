import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const TODAY = "2026-07-10";
const RUN_TIMESTAMP = "2026-07-10T15:24:20+08:00";
const MODEL_VERSION = "1.0.0";
const MODEL_FILE = "benchmark-research/data_model_v1.json";

function filePath(fileName) {
  return path.join(ROOT, "benchmark-research", fileName);
}

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(filePath(fileName), "utf8"));
}

function writeJson(fileName, value) {
  fs.writeFileSync(filePath(fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function v1Meta(meta, entityType, purpose) {
  return {
    ...meta,
    schema_version: MODEL_VERSION,
    data_model_version: MODEL_VERSION,
    generated_at: meta.generated_at ?? TODAY,
    last_updated_at: TODAY,
    entity_type: entityType,
    canonical_model: MODEL_FILE,
    purpose: purpose ?? meta.purpose,
  };
}

function withSourceChecked(source, fallbackDate) {
  return {
    ...source,
    last_checked_at: source.last_checked_at ?? fallbackDate ?? TODAY,
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeObjectiveFacts() {
  const data = readJson("objective_benchmark_facts_v1.json");
  const checkedAt = data.meta?.generated_at ?? TODAY;
  const relatedDocs = unique([
    ...(data.meta?.related_docs ?? []),
    "benchmark-research/data_model_v1.json",
    "benchmark-research/objective_data_model_v1.md",
  ]);

  const benchmarks = data.benchmarks.map((benchmark) => ({
    ...benchmark,
    inclusion_status: "included",
    updated_at: benchmark.updated_at ?? TODAY,
    last_checked_at: benchmark.last_checked_at ?? checkedAt,
    sources: (benchmark.sources ?? []).map((source) => withSourceChecked(source, checkedAt)),
  }));

  writeJson("objective_benchmark_facts_v1.json", {
    meta: {
      ...v1Meta(data.meta, "benchmark_registry", "Objective v1 benchmark facts for frontend and future database import. Main entries include only search_api or agent_plus_search evaluations."),
      related_docs: relatedDocs,
      inclusion_policy: "Only benchmarks where search result quality, search API behavior, or agent use of search materially affects scoring are included in the main registry.",
      evaluation_target_values: ["search_api", "agent_plus_search"],
    },
    benchmarks,
  });
}

function normalizeExcludedBenchmarks() {
  const data = readJson("excluded_benchmarks_v1.json");
  const checkedAt = data.meta?.generated_at ?? TODAY;
  const benchmarks = (data.benchmarks ?? []).map((benchmark) => ({
    ...benchmark,
    inclusion_status: "excluded",
    updated_at: benchmark.updated_at ?? TODAY,
    last_checked_at: benchmark.last_checked_at ?? checkedAt,
    sources: (benchmark.sources ?? []).map((source) => withSourceChecked(source, checkedAt)),
  }));

  writeJson("excluded_benchmarks_v1.json", {
    meta: {
      ...v1Meta(data.meta, "excluded_benchmark_registry", "Reviewed benchmark/evaluation records excluded from the main Agent Search benchmark registry."),
      exclusion_reason_values: ["provided_context_only", "no_search_dependency", "out_of_scope"],
    },
    benchmarks,
  });
}

function normalizeDatasetSamples() {
  const data = readJson("dataset_samples_v1.json");
  const checkedAt = data.meta?.generated_at ?? TODAY;
  const datasets = Object.fromEntries(
    Object.entries(data.datasets ?? {}).map(([benchmarkId, dataset]) => [
      benchmarkId,
      {
        benchmark_id: dataset.benchmark_id ?? benchmarkId,
        ...dataset,
        sample_type: dataset.sample_type ?? (Array.isArray(dataset.rows) && dataset.rows.length ? "dataset_rows" : "metadata_only"),
        last_checked_at: dataset.last_checked_at ?? checkedAt,
      },
    ]),
  );

  writeJson("dataset_samples_v1.json", {
    meta: v1Meta(data.meta, "dataset_sample_registry", "Dataset metadata and public sample task previews from source artifacts."),
    datasets,
  });
}

function normalizePublicResults() {
  const data = readJson("public_result_snapshots_v1.json");
  const checkedAt = data.meta?.generated_at ?? TODAY;
  const snapshots = (data.snapshots ?? []).map((snapshot) => ({
    ...snapshot,
    last_checked_at: snapshot.last_checked_at ?? snapshot.fetched_at ?? checkedAt,
  }));

  writeJson("public_result_snapshots_v1.json", {
    meta: v1Meta(data.meta, "leaderboard_result_registry", "Public benchmark and leaderboard result snapshots. These are external/public results, not Querit internal API runs."),
    snapshots,
  });
}

function normalizeProviderAppearances() {
  const data = readJson("competitor_visibility_v1.json");
  const checkedAt = data.meta?.generated_at ?? TODAY;
  const includedBenchmarks = readJson("objective_benchmark_facts_v1.json").benchmarks ?? [];
  const excludedBenchmarks = readJson("excluded_benchmarks_v1.json").benchmarks ?? [];
  const nameToId = new Map(
    [...includedBenchmarks, ...excludedBenchmarks].flatMap((benchmark) => [
      [benchmark.id, benchmark.id],
      [benchmark.canonical_name, benchmark.id],
    ]),
  );

  const appearances = (data.appearances ?? []).map((appearance) => {
    const { frontend_display_group: _frontendDisplayGroup, ...cleanAppearance } = appearance;
    return {
      ...cleanAppearance,
      benchmark_id: appearance.benchmark_id ?? nameToId.get(appearance.benchmark_or_eval) ?? null,
      last_checked_at: appearance.last_checked_at ?? checkedAt,
    };
  });

  writeJson("competitor_visibility_v1.json", {
    meta: {
      ...v1Meta(data.meta, "provider_appearance_registry", "Track where competitor search APIs/providers appear in public benchmark, score, and evaluation contexts."),
      tracked_competitors: ["Tavily", "Exa", "Brave"],
      source_independence_values: ["official_benchmark", "third_party", "vendor_published", "code_repository"],
    },
    appearances,
  });
}

function writeRefreshRuns() {
  writeJson("refresh_runs_v1.json", {
    meta: {
      schema_version: MODEL_VERSION,
      data_model_version: MODEL_VERSION,
      generated_at: TODAY,
      last_updated_at: TODAY,
      entity_type: "refresh_run_registry",
      canonical_model: MODEL_FILE,
      language: "zh-CN",
      purpose: "Manual and automated data refresh, normalization, and validation run history.",
    },
    runs: [
      {
        id: "manual_data_model_update_2026_07_10",
        run_type: "manual_data_model_update",
        status: "completed",
        started_at: RUN_TIMESTAMP,
        finished_at: RUN_TIMESTAMP,
        input_files: [
          "benchmark-research/objective_benchmark_facts_v1.json",
          "benchmark-research/excluded_benchmarks_v1.json",
          "benchmark-research/dataset_samples_v1.json",
          "benchmark-research/public_result_snapshots_v1.json",
          "benchmark-research/competitor_visibility_v1.json"
        ],
        output_files: [
          "benchmark-research/data_model_v1.json",
          "benchmark-research/objective_data_model_v1.md",
          "benchmark-research/objective_benchmark_facts_v1.json",
          "benchmark-research/excluded_benchmarks_v1.json",
          "benchmark-research/dataset_samples_v1.json",
          "benchmark-research/public_result_snapshots_v1.json",
          "benchmark-research/competitor_visibility_v1.json",
          "benchmark-research/refresh_runs_v1.json"
        ],
        summary: "Established v1 data model contract, normalized JSON metadata, removed frontend-only provider appearance fields, and added validation coverage."
      }
    ]
  });
}

normalizeObjectiveFacts();
normalizeExcludedBenchmarks();
normalizeDatasetSamples();
normalizePublicResults();
normalizeProviderAppearances();
writeRefreshRuns();

console.log("Normalized benchmark research data to data_model_version 1.0.0");
