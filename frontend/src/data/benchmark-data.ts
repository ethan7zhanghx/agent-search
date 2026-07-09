import fs from "node:fs";
import path from "node:path";

export type BenchmarkData = {
  facts: {
    meta?: Record<string, unknown>;
    benchmarks: Record<string, unknown>[];
  };
  results: {
    meta?: Record<string, unknown>;
    snapshots: Record<string, unknown>[];
  };
  competitors: {
    meta?: Record<string, unknown>;
    appearances: Record<string, unknown>[];
  };
  datasets: {
    meta?: Record<string, unknown>;
    datasets: Record<string, Record<string, unknown>>;
  };
};

function readJson<T>(fileName: string): T {
  const filePath = path.join(process.cwd(), "..", "benchmark-research", fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function getBenchmarkData(): BenchmarkData {
  return {
    facts: readJson<BenchmarkData["facts"]>("objective_benchmark_facts_v1.json"),
    results: readJson<BenchmarkData["results"]>("public_result_snapshots_v1.json"),
    competitors: readJson<BenchmarkData["competitors"]>("competitor_visibility_v1.json"),
    datasets: readJson<BenchmarkData["datasets"]>("dataset_samples_v1.json"),
  };
}
