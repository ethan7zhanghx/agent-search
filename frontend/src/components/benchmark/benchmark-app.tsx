"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  BookOpenCheck,
  Database,
  ExternalLink,
  FileSearch,
  Filter,
  Gauge,
  Globe2,
  Layers3,
  LibraryBig,
  Link2,
  ListFilter,
  Network,
  Search,
  Sparkles,
  Table2,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BenchmarkData } from "@/data/benchmark-data";
import { cn } from "@/lib/utils";

type AnyRecord = Record<string, any>;

const familyLabels: Record<string, string> = {
  live_web_search: "实时网页搜索",
  agentic_browsing: "智能体浏览",
  fixed_corpus_retrieval: "固定语料检索",
  wide_information_seeking: "宽域信息搜索",
  deep_search_agent: "深度搜索智能体",
  state_gated_retrieval: "状态门控检索",
  agent_discovery: "智能体发现",
  multilingual_retrieval: "多语言检索",
  search_augmented_llm_behavior: "搜索增强模型行为",
  search_api_eval_framework: "search API eval framework",
  short_form_factual_qa: "短事实问答",
  vendor_published_comparison: "厂商发布对比",
  third_party_agentic_search_eval: "第三方 agentic search eval",
};

const modeLabels: Record<string, string> = {
  live_web: "实时网页",
  fixed_corpus: "固定语料",
  state_gated_site: "状态门控站点",
  agent_pool: "智能体池",
  trace_dataset: "轨迹数据集",
  search_api_eval_framework: "search API eval",
  static_qa: "静态 QA",
  vendor_comparison: "厂商对比",
  third_party_report: "第三方报告",
};

const sourceLabels: Record<string, string> = {
  paper: "论文",
  leaderboard: "leaderboard",
  dataset: "数据集",
  website: "官网",
  github: "GitHub",
  official_benchmark_github: "官方 GitHub",
  official_benchmark_hf_space: "官方 HF Space",
  official_benchmark: "官方 benchmark",
  vendor_published: "厂商发布",
  third_party: "第三方",
  code_repository: "代码仓库",
  blog: "博客",
  article: "文章",
  reported_scores: "公开 score",
};

const independenceLabels: Record<string, string> = {
  official_benchmark: "官方 benchmark",
  third_party: "第三方",
  vendor_published: "厂商发布",
  code_repository: "代码仓库",
};

const metricLabels: Record<string, string> = {
  accuracy: "准确率",
  f1: "F1",
  recall: "召回率",
  precision: "精确率",
  attempted_accuracy: "尝试作答准确率",
  hedging_rate: "回避率",
  average_searches: "平均搜索次数",
  calibration_error: "校准误差",
  used_searches: "使用搜索次数",
  used_clicks: "使用访问次数",
  "Accuracy Given Attempted": "尝试作答准确率",
  "F1 / Accuracy / Accuracy Given Attempted": "F1 / 准确率 / 尝试作答准确率",
  "Agent Score": "智能体得分",
  "claimed benchmark values": "引用的基准值",
  accuracy_pct: "准确率",
  recall_pct: "召回率",
  searches_avg: "平均搜索次数",
  clicks_avg: "平均访问次数",
  search_calls: "搜索调用数",
  ndcg_at_5: "NDCG@5",
  ndcg_at_20: "NDCG@20",
  precision_at_20: "精确率@20",
  recall_at_20: "召回率@20",
  completeness_at_5: "完整度@5",
  completeness_at_20: "完整度@20",
  document_relevance: "文档相关性",
  relevance_quality_score: "相关性/质量分",
  latency_ms: "延迟",
  relevance: "相关性",
  quality: "质量",
  noise: "噪声",
  "recall@5": "召回率@5",
  "recall@100": "召回率@100",
  "recall@1000": "召回率@1000",
  "nDCG@10": "nDCG@10",
  strict_table_score: "严格表格得分",
  row_precision: "行精确率",
  row_recall: "行召回率",
  row_f1: "行 F1",
  item_level_f1: "条目级 F1",
  row_level_f1: "行级 F1",
  pairwise_order_accuracy: "成对顺序准确率",
  preference_win_rate: "偏好胜率",
  bradley_terry_score: "Bradley-Terry 分数",
  citation_features: "引用特征",
};

const columnLabels: Record<string, string> = {
  rank: "排名",
  model: "模型",
  llm: "大模型",
  retriever: "检索器",
  submitted_by: "提交方",
  evaluation_date: "评测日期",
  accuracy_pct: "准确率",
  recall_pct: "召回率",
  calibration_error_pct: "校准误差",
  searches_avg: "平均搜索次数",
  clicks_avg: "平均访问次数",
  search_calls: "搜索调用数",
  correct: "正确数",
  total: "总数",
  official_search_api: "官方搜索 API",
};

const taskInputLabels: Record<string, string> = {
  question: "问题",
  query: "查询",
  question_or_query: "问题 / 查询",
  not_applicable_article: "不适用",
};

const outputTypeLabels: Record<string, string> = {
  short_answer: "短答案",
  answer_or_search_results: "答案 / 搜索结果",
  answer: "答案",
  search_results: "搜索结果",
  reported_comparison: "报道对比",
};

const goldTypeLabels: Record<string, string> = {
  answer_key: "答案键",
  answer_key_and_qrels: "答案键 + 相关性标注",
  answer_key_or_llm_judge: "答案键 / LLM judge",
  llm_judge_or_answer_key: "LLM judge / 答案键",
  judge_score: "judge 分数",
  not_applicable_article: "不适用",
};

const basisLabels: Record<string, string> = {
  paper_slice_sum: "论文切片求和",
  computed_from_public_csv: "根据公开 CSV 计算",
  computed_from_repo_files: "根据仓库文件计算",
  official_readme_claim: "官方 README 声明",
  computed_from_hf_jsonl: "根据 Hugging Face JSONL 计算",
  computed_from_hf_csv: "根据 Hugging Face CSV 计算",
  computed_from_hf_files: "根据 Hugging Face 文件计算",
  not_reported_in_current_snapshot: "本次收集未报告",
  "uses_simpleqa; independent_dataset_not_published_in_current_snapshot": "使用 SimpleQA；本次收集未发现独立 dataset",
  article_claim: "文章声明",
  not_applicable_comparison_article: "对比文章，不适用",
};

const datasetNoteLabels: Record<string, string> = {
  "Public rows are encrypted/obfuscated by the benchmark publisher.": "公开样例行由 benchmark 发布方加密/混淆。",
  "Vendor-published evaluation context. No standalone public dataset file was identified in the current snapshot.": "厂商发布的 evaluation 上下文；本次收集未发现独立公开 dataset 文件。",
  "Vendor-published SimpleQA comparison. It references SimpleQA rather than publishing a separate dataset.": "厂商发布的 SimpleQA 对比；引用 SimpleQA，而不是发布独立 dataset。",
  "Third-party article reports benchmark scores; no standalone public task dataset was identified in the current snapshot.": "第三方文章报告 benchmark 分数；本次收集未发现独立公开任务 dataset。",
  "Vendor-published comparison. No standalone public dataset file was identified in the current snapshot.": "厂商发布的对比；本次收集未发现独立公开 dataset 文件。",
  "Vendor comparison article. This is not a standalone benchmark dataset.": "厂商对比文章；不是独立 benchmark dataset。",
  "Query and answer fields are encrypted/obfuscated in the public parquet. Large nested doc columns are not read into the frontend seed.": "公开 parquet 中的 query 和 answer 字段已加密/混淆；大型嵌套文档列未写入当前预览。",
  "Frontend seed reads scalar metadata columns only. Full conversation/search trace columns are large nested parquet columns and should be loaded on demand.": "当前预览只读取标量元数据列；完整对话/search trace 是大型嵌套 parquet 列，后续应按需加载。",
};

const tableNameLabels: Record<string, string> = {
  "Task Description Reranking": "任务描述重排",
  "Task Query Reranking": "任务查询重排",
  "Task Query Retrieval": "任务查询检索",
};

const snapshotTitleLabels: Record<string, string> = {
  livenewsbench_jan_2026_release_2_5_searches: "LiveNewsBench 2026 年 1 月第 2 版 - 5 次搜索 / 5 次访问",
  browsecomp_plus_leaderboard_2026_07_09: "BrowseComp-Plus HF Space leaderboard 快照",
  agentsearchbench_readme_leaderboard_2026_07_09: "AgentSearchBench README leaderboard 快照",
};

const appearanceTypeLabels: Record<string, string> = {
  fixed_search_provider: "固定搜索服务商",
  supported_provider_in_eval_framework: "评测框架支持",
  vendor_claim: "厂商声明",
  compared_provider: "被对比服务商",
  third_party_comparison: "第三方对比",
  vendor_comparison: "厂商对比",
};

const detailTranslations: Record<string, string> = {
  "Brave|FACTS Search|fixed_search_provider": "FACTS Search 官方 leaderboard 将 Brave Search API 作为所有模型评估的固定搜索工具。",
  "Tavily|Tavily Search Evals|supported_provider_in_eval_framework": "Tavily 的公开评测框架支持 Tavily、Exa、Brave、Google via Serper、Perplexity Search、Perplexity 和 GPTR，并包含 SimpleQA 与文档相关性评测。",
  "Exa|Tavily Search Evals|supported_provider_in_eval_framework": "Exa 是 Tavily 公开搜索 API 评测框架内置支持的服务商之一。",
  "Brave|Tavily Search Evals|supported_provider_in_eval_framework": "Brave 是 Tavily 公开搜索 API 评测框架内置支持的服务商之一。",
  "Tavily|SimpleQA|vendor_claim": "Tavily 声称在 OpenAI SimpleQA 上达到 93.33% 准确率，流程使用 Tavily 实时搜索和 GPT-4.1 生成答案。",
  "Exa|SimpleQA / MSMARCO-style API eval|vendor_claim": "Exa 发布了 SimpleQA 和类 MSMARCO 搜索结果相关性评测。可访问文本更清楚展示了方法，具体表格数值暴露不完整。",
  "Brave|SimpleQA|vendor_claim": "Brave 在 SimpleQA 风格指标上，将 Brave AI Grounding 与 Perplexity、Tavily、Exa 做了对比。",
  "Tavily|Brave SimpleQA Comparison|compared_provider": "Brave 发布的对比表列出 Tavily + GPT-4.1 的尝试作答准确率为 93.3%。该结果标记为厂商发布对比。",
  "Exa|Brave SimpleQA Comparison|compared_provider": "Brave 发布的对比表列出多个 Exa 相关 SimpleQA 数值。该结果标记为厂商发布对比。",
  "Brave|AIMultiple Agentic Search Benchmark|third_party_comparison": "AIMultiple 在 2026 agentic search benchmark 中报告 Brave Search 的 Agent Score 最高，并报告 669ms 延迟。",
  "Exa|AIMultiple Agentic Search Benchmark|third_party_comparison": "AIMultiple 报告 Exa 总排名第三，Agent Score 为 14.39，延迟约 1.2 秒。",
  "Tavily|AIMultiple Agentic Search Benchmark|third_party_comparison": "AIMultiple 报告 Tavily 总排名第五，Agent Score 为 13.67，延迟约 998ms。",
  "Exa|WISER-Search|vendor_comparison": "Parallel 的 WISER-Search 对比包含 Exa Search MCP / tool calling，并与 Parallel MCP 和原生搜索在多个模型上对比。",
  "Tavily|Parallel comparison article|vendor_comparison": "Parallel 文章从架构、成本、新鲜度和 benchmark 声明角度对比 OpenAI web search、Parallel、Exa 和 Tavily。Tavily 是被对比服务商，不是独立 leaderboard 行。",
  "Exa|Parallel comparison article|vendor_comparison": "Parallel 文章引用 Exa 在 SimpleQA 和 FreshQA 上的表现声明。",
};

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function unique<T>(values: T[]) {
  return [...new Set(values.filter(Boolean))];
}

function slugify(value: unknown) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function compactNumber(value: unknown): string {
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
  }
  if (value === null || value === undefined) return "未记录";
  return String(value);
}

function boolText(value: unknown) {
  if (value === true) return "是";
  if (value === false) return "否";
  return "未记录";
}

function languageText(languages: unknown) {
  const labels: Record<string, string> = { en: "英语", zh: "中文" };
  const list = Array.isArray(languages) ? languages : [];
  return list.map((language) => labels[String(language)] ?? String(language)).join(", ") || "未记录";
}

function metricNameText(metric: unknown) {
  const key = String(metric ?? "");
  return metricLabels[key] ?? key;
}

function metricListText(metrics: unknown) {
  const list = Array.isArray(metrics) ? metrics : [];
  return list.map(metricNameText).join(", ");
}

function localizeMetricValue(value: string) {
  return value
    .replaceAll("Accuracy Given Attempted", "尝试作答准确率")
    .replaceAll("Accuracy", "准确率")
    .replaceAll("Agent Score", "智能体得分");
}

function valueText(value: unknown, key = ""): string {
  if (value === null || value === undefined) return "未记录";
  if (typeof value === "boolean") return value ? "是" : "否";
  if (typeof value === "number") {
    const formatted = String(compactNumber(value));
    return key.endsWith("_pct") ? `${formatted}%` : formatted;
  }
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function truncateCell(value: unknown, length = 240) {
  const text = valueText(value);
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function datasetStatusText(status: unknown) {
  const labels: Record<string, string> = {
    sampled: "已有样例",
    encrypted_sampled: "公开行加密",
    partial_sampled: "部分样例",
    not_ingested: "待接入",
    viewer_unsupported: "暂不支持预览",
    viewer_error: "读取失败",
    fetch_error: "抓取失败",
    no_independent_dataset: "无独立 dataset",
    missing: "未记录",
  };
  const key = String(status ?? "missing");
  return labels[key] ?? key;
}

function providerVariant(provider: unknown): "cyan" | "purple" | "default" {
  const value = normalize(provider);
  if (value === "tavily") return "cyan";
  if (value === "exa") return "purple";
  return "default";
}

function metricValue(metric: unknown) {
  if (!metric) return null;
  if (typeof metric === "number") return String(compactNumber(metric));
  if (typeof metric === "string") return truncateCell(localizeMetricValue(metric), 90);
  const item = metric as AnyRecord;
  const unit = item.unit === "percent" ? "%" : item.unit ? ` ${item.unit}` : "";
  const value = typeof item.value === "string" ? truncateCell(localizeMetricValue(item.value), 90) : compactNumber(item.value);
  return `${value}${unit}`;
}

function metricNameFromRecord(metric: unknown) {
  if (!metric) return "score";
  if (typeof metric === "string" || typeof metric === "number") return "score";
  const item = metric as AnyRecord;
  return metricLabels[item.metric] ?? item.metric ?? "score";
}

function metricText(metric: unknown) {
  if (!metric) return "未记录";
  if (typeof metric === "string" || typeof metric === "number") return valueText(metric);
  return `${metricNameFromRecord(metric)}: ${metricValue(metric)}`;
}

function scoreNumber(value: unknown) {
  const text = String(value ?? "");
  const percentMatches = [...text.matchAll(/-?\d+(?:\.\d+)?(?=%)/g)];
  if (percentMatches.length) return Number(percentMatches.at(-1)?.[0]);
  const matches = [...text.matchAll(/-?\d+(?:\.\d+)?/g)];
  return matches.length ? Number(matches.at(-1)?.[0]) : null;
}

function splitMetricValue(metric: unknown) {
  if (!metric) return [];
  const name = metricNameFromRecord(metric);
  if (typeof metric === "string" || typeof metric === "number") {
    return [{ metric_name: name, score_value: valueText(metric), sort_value: scoreNumber(metric) }];
  }
  const item = metric as AnyRecord;
  if (typeof item.value === "string") {
    return localizeMetricValue(item.value)
      .split(/;\s*/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => ({ metric_name: name, score_value: entry, sort_value: scoreNumber(entry) }));
  }
  return [{ metric_name: name, score_value: String(metricValue(item)), sort_value: Number(item.value) }];
}

function sourceFileName(file: string) {
  try {
    const url = new URL(file);
    return decodeURIComponent(url.pathname.split("/").pop() || file);
  } catch {
    return file;
  }
}

function dataFor(data: BenchmarkData) {
  return {
    benchmarks: (data.facts.benchmarks ?? []) as AnyRecord[],
    snapshots: (data.results.snapshots ?? []) as AnyRecord[],
    appearances: (data.competitors.appearances ?? []) as AnyRecord[],
    trackedProviders: ((data.competitors.meta?.tracked_competitors as string[]) ?? ["Tavily", "Exa", "Brave"]) as string[],
    datasetPreviewById: (data.datasets.datasets ?? {}) as Record<string, AnyRecord>,
  };
}

function datasetPreview(previews: Record<string, AnyRecord>, id: string) {
  return previews[id] ?? { status: "missing", fields: [], rows: [] };
}

function splitTotal(counts: unknown) {
  if (!counts || typeof counts !== "object") return undefined;
  return Object.values(counts as Record<string, unknown>).reduce<number>((sum, value) => sum + (Number(value) || 0), 0);
}

function datasetRecordText(benchmark: AnyRecord, preview: AnyRecord) {
  const dataset = benchmark.dataset_facts ?? {};
  const value =
    preview.record_count_observed ??
    splitTotal(preview.split_counts_observed) ??
    dataset.record_count ??
    dataset.query_count_claim ??
    dataset.aligned_task_records ??
    dataset.validation_total ??
    dataset.conversation_count ??
    dataset.corpus_size_claim ??
    dataset.language_count_claim;
  return compactNumber(value);
}

function benchmarkAppearances(benchmark: AnyRecord, appearances: AnyRecord[]) {
  const names = [benchmark.id, benchmark.canonical_name].map(normalize);
  return appearances.filter((item) => names.includes(normalize(item.benchmark_or_eval)));
}

function competitorNamesForBenchmark(benchmark: AnyRecord, appearances: AnyRecord[]) {
  return unique(benchmarkAppearances(benchmark, appearances).map((item) => item.provider as string));
}

function appearanceDetailText(item: AnyRecord) {
  const key = `${item.provider}|${item.benchmark_or_eval}|${item.appearance_type}`;
  return detailTranslations[key] ?? item.details;
}

function benchmarkForEvaluationName(name: string, benchmarks: AnyRecord[]) {
  const normalized = normalize(name);
  return benchmarks.find((benchmark) => normalize(benchmark.canonical_name) === normalized);
}

function scoredLeaderboardRows(rows: AnyRecord[]): AnyRecord[] {
  return rows
    .filter((row) => row.score_or_metric)
    .flatMap((row) =>
      splitMetricValue(row.score_or_metric).map((score, index) => ({
        ...row,
        ...score,
        score_row_id: `${row.provider}-${row.benchmark_or_eval}-${row.appearance_type}-${index}`,
      }) as AnyRecord),
    )
    .sort((a, b) => {
      if (a.sort_value === null && b.sort_value === null) return String(a.provider).localeCompare(String(b.provider));
      if (a.sort_value === null) return 1;
      if (b.sort_value === null) return -1;
      return Number(b.sort_value) - Number(a.sort_value);
    });
}

function buildLeaderboardItems(benchmarks: AnyRecord[], snapshots: AnyRecord[], appearances: AnyRecord[]) {
  const snapshotItems = snapshots.map((snapshot) => ({
    kind: "snapshot",
    id: snapshot.id,
    title: snapshotTitleLabels[snapshot.id] ?? snapshot.title,
    benchmark_id: snapshot.benchmark_id,
    source_type: snapshot.source_type,
    source_url: snapshot.source_url,
    date: snapshot.result_date_or_release ?? snapshot.fetched_at,
    metrics: snapshot.metrics ?? unique((snapshot.tables ?? []).flatMap((table: AnyRecord) => table.metrics ?? [])),
    competitors: competitorNamesForBenchmark(benchmarks.find((item) => item.id === snapshot.benchmark_id) ?? {}, appearances),
    rows: snapshot.rows ?? [],
    tables: snapshot.tables ?? null,
  }));

  const grouped = appearances
    .filter((item) => item.score_or_metric)
    .reduce<Record<string, AnyRecord[]>>((acc, item) => {
      const key = item.benchmark_or_eval;
      acc[key] = acc[key] ?? [];
      acc[key].push(item);
      return acc;
    }, {});

  const competitorItems = Object.entries(grouped).map(([title, rows]) => {
    const scoreRows = scoredLeaderboardRows(rows);
    return {
      kind: "competitor",
      id: `competitor-${slugify(title)}`,
      title,
      benchmark_id: benchmarkForEvaluationName(title, benchmarks)?.id ?? null,
      source_type: "reported_scores",
      source_url: rows[0]?.source_url,
      date: null,
      metrics: unique(scoreRows.map((row) => row.metric_name)),
      competitors: unique(rows.map((row) => row.provider)),
      rows,
      score_rows: scoreRows,
      tables: null,
    };
  });

  return [...snapshotItems, ...competitorItems];
}

function leaderboardRows(item: AnyRecord) {
  return item.kind === "competitor" ? item.score_rows ?? scoredLeaderboardRows(item.rows ?? []) : item.rows ?? [];
}

function leaderboardRowCount(item: AnyRecord) {
  if (item.kind === "competitor") return leaderboardRows(item).length;
  return item.rows?.length ?? item.tables?.reduce((sum: number, table: AnyRecord) => sum + (table.rows?.length ?? 0), 0) ?? 0;
}

function sourcePoliciesForLeaderboard(item: AnyRecord): string[] {
  if (item.kind === "snapshot") return ["official_benchmark"];
  return unique(leaderboardRows(item).map((row: AnyRecord) => row.source_independence as string));
}

function matchesBenchmark(benchmark: AnyRecord, query: string) {
  const target = [
    benchmark.canonical_name,
    benchmark.maintainer_org,
    benchmark.benchmark_family,
    benchmark.search_protocol?.mode,
    benchmark.search_protocol?.fixed_provider_name,
    ...(benchmark.evaluation?.metrics ?? []),
  ].map(normalize).join(" ");
  return target.includes(normalize(query));
}

function StatCard({ icon: Icon, label, value, caption }: { icon: typeof Layers3; label: string; value: unknown; caption: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[12px] border border-[var(--querit-line)] bg-white px-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--querit-ink)] text-[var(--querit-cyan)]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-[var(--querit-muted)]">{label}</p>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <strong className="font-head text-xl font-extrabold leading-none text-[var(--querit-ink)]">{String(value)}</strong>
          <span className="truncate text-xs text-[var(--querit-muted)]">{caption}</span>
        </div>
      </div>
    </div>
  );
}

function ProviderBadges({ providers }: { providers?: string[] }) {
  if (!providers?.length) return <span className="text-sm text-[var(--querit-muted)]">未记录</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {providers.map((provider) => (
        <Badge key={provider} variant={providerVariant(provider)}>
          {provider}
        </Badge>
      ))}
    </div>
  );
}

function SourceList({ sources }: { sources?: AnyRecord[] }) {
  if (!sources?.length) return <p className="text-sm text-[var(--querit-muted)]">未记录来源</p>;
  return (
    <div className="grid gap-2">
      {sources.map((source, index) => (
        <a
          className="group flex items-center justify-between gap-3 rounded-[10px] border border-[var(--querit-line)] bg-white px-3 py-2.5 text-sm transition hover:border-[var(--querit-line-strong)] hover:bg-cyan-50/40"
          href={source.url}
          target="_blank"
          rel="noreferrer"
          key={`${source.url}-${index}`}
        >
          <span className="flex min-w-0 items-center gap-2 font-medium text-[var(--querit-soft-ink)]">
            <Link2 className="h-4 w-4 shrink-0 text-[var(--querit-muted)]" />
            <span className="truncate">{sourceLabels[source.source_type] ?? source.source_type ?? "来源"}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2 text-xs text-[var(--querit-muted)]">
            {source.access_mode === "public_or_token_required" ? "公开或需 Token" : "公开"}
            <ExternalLink className="h-3.5 w-3.5 transition group-hover:text-[var(--querit-ink)]" />
          </span>
        </a>
      ))}
    </div>
  );
}

function FactGrid({ rows }: { rows: { label: string; value: unknown }[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-[var(--querit-line)] bg-[var(--querit-line)] md:grid-cols-3">
      {rows.map((row) => (
        <div className="min-h-20 bg-white p-3" key={row.label}>
          <p className="text-xs text-[var(--querit-muted)]">{row.label}</p>
          <strong className="mt-1 block break-words text-sm font-semibold text-[var(--querit-ink)]">{String(row.value ?? "未记录")}</strong>
        </div>
      ))}
    </div>
  );
}

function DatasetPreview({ benchmark, preview }: { benchmark: AnyRecord; preview: AnyRecord }) {
  const dataset = benchmark.dataset_facts ?? {};
  const fields = preview.fields?.length ? preview.fields : dataset.fields ?? dataset.observed_files ?? [];
  const rows = Array.isArray(preview.rows) ? preview.rows : [];
  const files = Array.isArray(preview.source_files) ? preview.source_files : [];

  return (
    <section className="rounded-[14px] border border-[var(--querit-line)] bg-[var(--querit-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[var(--querit-muted)]">dataset 预览</p>
          <h3 className="mt-1 text-lg font-bold text-[var(--querit-ink)]">{datasetStatusText(preview.status)}</h3>
        </div>
        {preview.source_url ? (
          <Button asChild variant="outline" size="sm">
            <a href={preview.source_url} target="_blank" rel="noreferrer">
              来源 <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        ) : null}
      </div>

      {preview.notes ? <p className="mt-3 text-sm leading-6 text-[var(--querit-soft-ink)]">{datasetNoteLabels[preview.notes] ?? preview.notes}</p> : null}

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
        <div className="rounded-[10px] bg-white p-3">
          <span className="text-xs text-[var(--querit-muted)]">格式</span>
          <strong className="mt-1 block">{preview.file_format ?? "未记录"}</strong>
        </div>
        <div className="rounded-[10px] bg-white p-3">
          <span className="text-xs text-[var(--querit-muted)]">记录数</span>
          <strong className="mt-1 block">{datasetRecordText(benchmark, preview)}</strong>
        </div>
        <div className="rounded-[10px] bg-white p-3">
          <span className="text-xs text-[var(--querit-muted)]">字段数</span>
          <strong className="mt-1 block">{fields.length || "未记录"}</strong>
        </div>
        <div className="rounded-[10px] bg-white p-3">
          <span className="text-xs text-[var(--querit-muted)]">样例行</span>
          <strong className="mt-1 block">{rows.length || "未记录"}</strong>
        </div>
      </div>

      {files.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.slice(0, 5).map((file: string) => (
            <Badge key={file} variant="muted">
              {sourceFileName(file)}
            </Badge>
          ))}
          {files.length > 5 ? <Badge variant="muted">+{files.length - 5}</Badge> : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {fields.length ? fields.slice(0, 12).map((field: string) => <Badge key={field}>{field}</Badge>) : <Badge>未记录字段</Badge>}
        {fields.length > 12 ? <Badge>+{fields.length - 12}</Badge> : null}
      </div>

      <div className="mt-4 grid gap-3">
        {rows.length ? rows.slice(0, 3).map((row: AnyRecord, index: number) => (
          <div className="rounded-[12px] border border-[var(--querit-line)] bg-white p-3" key={row.row_idx ?? index}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <strong className="text-sm">样例 {row.row_idx ?? index}</strong>
              {row.truncated ? <Badge variant="warning">已截断</Badge> : null}
            </div>
            <dl className="grid gap-2">
              {Object.entries(row)
                .filter(([key]) => !["row_idx", "truncated", "row_source_url"].includes(key))
                .slice(0, 5)
                .map(([key, value]) => (
                  <div className="grid gap-1 md:grid-cols-[140px_minmax(0,1fr)]" key={key}>
                    <dt className="text-xs font-medium text-[var(--querit-muted)]">{key}</dt>
                    <dd className="break-words text-sm leading-6 text-[var(--querit-soft-ink)]">{truncateCell(value)}</dd>
                  </div>
                ))}
            </dl>
          </div>
        )) : <p className="rounded-[12px] bg-white p-4 text-sm text-[var(--querit-muted)]">暂无可展示样例</p>}
      </div>
    </section>
  );
}

function BenchmarkDetail({
  benchmark,
  preview,
  appearances,
}: {
  benchmark?: AnyRecord;
  preview?: AnyRecord;
  appearances: AnyRecord[];
}) {
  if (!benchmark) {
    return (
      <Card className="shadow-none">
        <CardContent>
          <p className="text-sm text-[var(--querit-muted)]">没有匹配的 benchmark</p>
        </CardContent>
      </Card>
    );
  }

  const dataset = benchmark.dataset_facts ?? {};
  const protocol = benchmark.search_protocol ?? {};
  const evaluation = benchmark.evaluation ?? {};
  const task = benchmark.task_design ?? {};
  const providerRows = benchmarkAppearances(benchmark, appearances);

  return (
    <Card className="sticky top-24 self-start overflow-hidden shadow-[0_24px_80px_rgba(0,3,17,0.08)]">
      <CardHeader className="bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--querit-muted)]">benchmark 详情</p>
            <h2 className="mt-1 break-words font-head text-2xl font-extrabold leading-tight">{benchmark.canonical_name}</h2>
            <p className="mt-1 text-sm text-[var(--querit-muted)]">{benchmark.maintainer_org ?? "维护方未记录"}</p>
          </div>
          <Badge variant={protocol.mode === "live_web" ? "success" : "blue"}>{modeLabels[protocol.mode] ?? protocol.mode}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <DatasetPreview benchmark={benchmark} preview={preview ?? {}} />

        <FactGrid
          rows={[
            { label: "类别", value: familyLabels[benchmark.benchmark_family] ?? benchmark.benchmark_family },
            { label: "搜索是否必需", value: boolText(protocol.search_required_for_evaluation) },
            { label: "检索器可替换", value: boolText(protocol.retriever_replaceable) },
            { label: "固定服务商", value: protocol.fixed_provider_name ?? "无" },
            { label: "语言", value: languageText(dataset.languages) },
            { label: "leaderboard 公开", value: boolText(evaluation.leaderboard_public ?? evaluation.evaluation_script_public) },
          ]}
        />

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Network className="h-4 w-4 text-[var(--querit-muted)]" />
            <h3 className="font-semibold">服务商记录</h3>
          </div>
          <div className="grid gap-2">
            {providerRows.length ? providerRows.map((item) => (
              <a
                className="grid gap-2 rounded-[12px] border border-[var(--querit-line)] bg-white p-3 transition hover:border-[var(--querit-line-strong)] hover:bg-cyan-50/30 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                href={item.source_url}
                target="_blank"
                rel="noreferrer"
                key={`${item.provider}-${item.benchmark_or_eval}-${item.appearance_type}`}
              >
                <Badge variant={providerVariant(item.provider)}>{item.provider}</Badge>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm">{appearanceTypeLabels[item.appearance_type] ?? item.appearance_type}</strong>
                    <span className="text-xs text-[var(--querit-muted)]">{independenceLabels[item.source_independence] ?? item.source_independence}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--querit-soft-ink)]">{appearanceDetailText(item)}</p>
                </div>
                <div className="text-left md:text-right">
                  <strong className="block text-sm text-[var(--querit-ink)]">{metricValue(item.score_or_metric) ?? "无分数"}</strong>
                  <span className="text-xs text-[var(--querit-muted)]">{metricNameFromRecord(item.score_or_metric)}</span>
                </div>
              </a>
            )) : <p className="rounded-[12px] bg-[var(--querit-surface)] p-4 text-sm text-[var(--querit-muted)]">未记录 Tavily / Exa / Brave</p>}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[var(--querit-muted)]" />
              <h3 className="font-semibold">评估指标</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(evaluation.metrics ?? []).length ? (evaluation.metrics ?? []).map((metric: string) => <Badge key={metric}>{metricNameText(metric)}</Badge>) : <Badge>未记录</Badge>}
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-[var(--querit-muted)]" />
              <h3 className="font-semibold">评估输入输出</h3>
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-[var(--querit-muted)]">输入</dt><dd>{taskInputLabels[task.task_input_type] ?? task.task_input_type ?? "未记录"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--querit-muted)]">输出</dt><dd>{outputTypeLabels[task.expected_output_type] ?? task.expected_output_type ?? "未记录"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--querit-muted)]">标准答案</dt><dd>{goldTypeLabels[task.gold_type] ?? task.gold_type ?? "未记录"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--querit-muted)]">时效信息</dt><dd>{boolText(task.requires_fresh_information)}</dd></div>
            </dl>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-[var(--querit-muted)]" />
              <h3 className="font-semibold">dataset 信息</h3>
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-[var(--querit-muted)]">计数依据</dt><dd className="text-right">{basisLabels[dataset.record_count_basis] ?? dataset.record_count_basis ?? "未记录"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--querit-muted)]">公开标签</dt><dd>{boolText(dataset.contains_public_labels ?? dataset.contains_public_examples)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--querit-muted)]">Qrels 标注</dt><dd>{boolText(dataset.contains_qrels)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[var(--querit-muted)]">运行轨迹</dt><dd>{boolText(dataset.contains_run_trajectories)}</dd></div>
            </dl>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <BookOpenCheck className="h-4 w-4 text-[var(--querit-muted)]" />
              <h3 className="font-semibold">来源</h3>
            </div>
            <SourceList sources={benchmark.sources} />
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function BenchmarkDirectory({
  data,
  query,
}: {
  data: ReturnType<typeof dataFor>;
  query: string;
}) {
  const { benchmarks, appearances, datasetPreviewById } = data;
  const [mode, setMode] = useState("all");
  const [retriever, setRetriever] = useState("all");
  const [selectedId, setSelectedId] = useState(String(benchmarks[0]?.id ?? ""));
  const modes = unique(benchmarks.map((item) => item.search_protocol?.mode as string));

  const filtered = benchmarks.filter((item) => {
    const replaceable = item.search_protocol?.retriever_replaceable;
    const modeOk = mode === "all" || item.search_protocol?.mode === mode;
    const retrieverOk =
      retriever === "all" ||
      (retriever === "replaceable" && replaceable === true) ||
      (retriever === "fixed" && replaceable === false) ||
      (retriever === "unknown" && replaceable !== true && replaceable !== false);
    return modeOk && retrieverOk && matchesBenchmark(item, query);
  });

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];
  const selectedPreview = selected ? datasetPreview(datasetPreviewById, selected.id) : undefined;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px] 2xl:grid-cols-[260px_minmax(0,1fr)_420px]">
      <Card className="hidden self-start overflow-hidden shadow-none 2xl:block">
        <CardHeader className="px-4 py-4">
          <p className="text-xs font-semibold text-[var(--querit-muted)]">筛选</p>
          <h2 className="mt-1 font-head text-xl font-extrabold">benchmark 目录</h2>
        </CardHeader>
        <CardContent className="grid gap-4 p-4">
          <label className="grid gap-2 text-sm font-medium text-[var(--querit-soft-ink)]">
            <span className="flex items-center gap-2 text-xs text-[var(--querit-muted)]">
              <ListFilter className="h-4 w-4" />
              搜索模式
            </span>
            <Select value={mode} onChange={(event) => setMode(event.target.value)} className="w-full">
              <option value="all">全部模式</option>
              {modes.map((item) => (
                <option value={item} key={item}>{modeLabels[item] ?? item}</option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--querit-soft-ink)]">
            <span className="flex items-center gap-2 text-xs text-[var(--querit-muted)]">
              <Filter className="h-4 w-4" />
              检索器状态
            </span>
            <Select value={retriever} onChange={(event) => setRetriever(event.target.value)} className="w-full">
              <option value="all">全部检索器状态</option>
              <option value="replaceable">可替换</option>
              <option value="fixed">不可替换</option>
              <option value="unknown">不适用/未记录</option>
            </Select>
          </label>
          <div className="rounded-[12px] bg-[var(--querit-surface)] p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[var(--querit-muted)]">当前结果</span>
              <strong className="font-head text-2xl font-extrabold">{filtered.length}</strong>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-[var(--querit-soft-ink)]">
              {modes.slice(0, 6).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={cn(
                    "flex items-center justify-between rounded-[9px] px-2.5 py-2 text-left transition hover:bg-white",
                    mode === item && "bg-white shadow-[inset_3px_0_0_var(--querit-cyan)]",
                  )}
                >
                  <span>{modeLabels[item] ?? item}</span>
                  <span>{benchmarks.filter((benchmark) => benchmark.search_protocol?.mode === item).length}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden shadow-[0_20px_70px_rgba(0,3,17,0.07)]">
        <CardHeader className="px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--querit-muted)]">records</p>
              <h2 className="mt-1 font-head text-xl font-extrabold">benchmark records</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row 2xl:hidden">
              <Select value={mode} onChange={(event) => setMode(event.target.value)}>
                <option value="all">全部模式</option>
                {modes.map((item) => (
                  <option value={item} key={item}>{modeLabels[item] ?? item}</option>
                ))}
              </Select>
              <Select value={retriever} onChange={(event) => setRetriever(event.target.value)}>
                <option value="all">全部检索器状态</option>
                <option value="replaceable">可替换</option>
                <option value="fixed">不可替换</option>
                <option value="unknown">不适用/未记录</option>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--querit-line)] pt-3">
            <span className="text-sm text-[var(--querit-muted)]">当前结果</span>
            <Badge variant="dark">{filtered.length} 条</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[var(--querit-line)]">
            {filtered.map((item) => {
              const preview = datasetPreview(datasetPreviewById, item.id);
              const providers = competitorNamesForBenchmark(item, appearances);
              const isActive = selected?.id === item.id;
              return (
                <button
                  type="button"
                  className={cn(
                    "grid w-full gap-3 px-5 py-4 text-left transition hover:bg-cyan-50/40",
                    isActive && "bg-cyan-50 shadow-[inset_4px_0_0_var(--querit-cyan)]",
                  )}
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px] lg:items-start">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <strong className="text-base font-bold text-[var(--querit-ink)]">{item.canonical_name}</strong>
                        <Badge variant={item.search_protocol?.mode === "live_web" ? "success" : "muted"}>
                          {modeLabels[item.search_protocol?.mode] ?? item.search_protocol?.mode}
                        </Badge>
                      </span>
                      <small className="mt-1 block text-sm text-[var(--querit-muted)]">{item.maintainer_org}</small>
                      <span className="mt-2 line-clamp-1 block text-sm text-[var(--querit-soft-ink)]">
                        {metricListText(item.evaluation?.metrics) || "指标未记录"}
                      </span>
                    </span>
                    <span className="rounded-[12px] border border-[var(--querit-line)] bg-white px-3 py-2">
                      <span className="block text-xs text-[var(--querit-muted)]">dataset</span>
                      <strong className="mt-1 block text-[var(--querit-ink)]">{datasetRecordText(item, preview)}</strong>
                      <small className="text-xs text-[var(--querit-muted)]">{datasetStatusText(preview.status)}</small>
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge>
                      检索器：
                      {item.search_protocol?.retriever_replaceable === true ? "可替换" : item.search_protocol?.retriever_replaceable === false ? "不可替换" : "不适用"}
                    </Badge>
                    {item.search_protocol?.fixed_provider_name ? <Badge variant="muted">{item.search_protocol.fixed_provider_name}</Badge> : null}
                    <ProviderBadges providers={providers} />
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <BenchmarkDetail benchmark={selected} preview={selectedPreview} appearances={appearances} />
    </div>
  );
}

function SnapshotRowsTable({ rows, metrics = [] }: { rows: AnyRecord[]; metrics?: string[] }) {
  if (!rows?.length) return <p className="rounded-[12px] bg-[var(--querit-surface)] p-4 text-sm text-[var(--querit-muted)]">暂无记录</p>;
  const primaryMetric = metrics.find((metric) => rows.some((row) => row[metric] !== undefined)) ?? metrics[0];

  return (
    <div className="overflow-x-auto rounded-[12px] border border-[var(--querit-line)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">#</TableHead>
            <TableHead>对象</TableHead>
            <TableHead>search / retriever</TableHead>
            <TableHead>{metricNameText(primaryMetric)}</TableHead>
            <TableHead>其他指标</TableHead>
            <TableHead>提交 / 日期</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const subject = row.model ?? row.llm ?? row.retriever ?? `记录 ${index + 1}`;
            const retriever = row.retriever ?? (row.official_search_api === true ? "官方 search API" : "未记录");
            const otherMetrics = metrics
              .filter((metric) => metric !== primaryMetric)
              .filter((metric) => row[metric] !== undefined)
              .map((metric) => `${metricNameText(metric)} ${valueText(row[metric], metric)}`)
              .join(" / ");

            return (
              <TableRow key={`${subject}-${index}`}>
                <TableCell className="font-mono text-xs text-[var(--querit-muted)]">{row.rank ?? index + 1}</TableCell>
                <TableCell>
                  <strong className="block text-[var(--querit-ink)]">{subject}</strong>
                  {row.submitted_by ? <small className="text-[var(--querit-muted)]">{row.submitted_by}</small> : null}
                </TableCell>
                <TableCell>{retriever}</TableCell>
                <TableCell><span className="font-head text-lg font-extrabold text-[var(--querit-blue)]">{valueText(row[primaryMetric], primaryMetric)}</span></TableCell>
                <TableCell className="max-w-md leading-6">{otherMetrics || "未记录"}</TableCell>
                <TableCell>{row.evaluation_date ?? row.submitted_by ?? "未记录"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function CompetitorRowsTable({ rows }: { rows: AnyRecord[] }) {
  if (!rows?.length) return <p className="rounded-[12px] bg-[var(--querit-surface)] p-4 text-sm text-[var(--querit-muted)]">暂无记录</p>;

  return (
    <div className="overflow-x-auto rounded-[12px] border border-[var(--querit-line)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">#</TableHead>
            <TableHead>服务商</TableHead>
            <TableHead>evaluation</TableHead>
            <TableHead>指标</TableHead>
            <TableHead>score / metric</TableHead>
            <TableHead>来源属性</TableHead>
            <TableHead>来源</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.score_row_id ?? `${row.provider}-${row.appearance_type}-${index}`}>
              <TableCell className="font-mono text-xs text-[var(--querit-muted)]">{index + 1}</TableCell>
              <TableCell><Badge variant={providerVariant(row.provider)}>{row.provider}</Badge></TableCell>
              <TableCell>
                <strong className="block text-[var(--querit-ink)]">{appearanceTypeLabels[row.appearance_type] ?? row.appearance_type}</strong>
                <small className="text-[var(--querit-muted)]">{row.benchmark_or_eval}</small>
              </TableCell>
              <TableCell>{row.metric_name ?? metricNameFromRecord(row.score_or_metric)}</TableCell>
              <TableCell><span className="font-head text-lg font-extrabold text-[var(--querit-purple)]">{row.score_value ?? metricValue(row.score_or_metric)}</span></TableCell>
              <TableCell>{independenceLabels[row.source_independence] ?? row.source_independence}</TableCell>
              <TableCell>
                <a className="inline-flex items-center gap-1 font-medium text-[var(--querit-blue)] hover:underline" href={row.source_url} target="_blank" rel="noreferrer">
                  打开 <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LeaderboardTables({ item }: { item: AnyRecord }) {
  if (item.kind === "competitor") {
    return <CompetitorRowsTable rows={leaderboardRows(item)} />;
  }
  if (item.tables?.length) {
    return (
      <div className="grid gap-5">
        {item.tables.map((table: AnyRecord) => (
          <section className="grid gap-3" key={table.name}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <h4 className="font-semibold">{tableNameLabels[table.name] ?? table.name}</h4>
              <span className="text-sm text-[var(--querit-muted)]">{metricListText(table.metrics)}</span>
            </div>
            <SnapshotRowsTable rows={table.rows ?? []} metrics={table.metrics ?? []} />
          </section>
        ))}
      </div>
    );
  }
  return <SnapshotRowsTable rows={item.rows ?? []} metrics={item.metrics ?? []} />;
}

function LeaderboardView({
  data,
  query,
}: {
  data: ReturnType<typeof dataFor>;
  query: string;
}) {
  const { benchmarks, snapshots, appearances, trackedProviders } = data;
  const leaderboards = useMemo(() => buildLeaderboardItems(benchmarks, snapshots, appearances), [benchmarks, snapshots, appearances]);
  const [provider, setProvider] = useState("all");
  const [policy, setPolicy] = useState("all");
  const [selectedId, setSelectedId] = useState(String(leaderboards[0]?.id ?? ""));
  const policies = unique(leaderboards.flatMap(sourcePoliciesForLeaderboard));

  const filtered = leaderboards.filter((item) => {
    const searchable = [item.title, item.benchmark_id, item.source_type, item.source_url, ...(item.competitors ?? []), ...(item.metrics ?? [])].map(normalize).join(" ");
    const providerOk = provider === "all" || item.competitors?.includes(provider);
    const policyOk = policy === "all" || sourcePoliciesForLeaderboard(item).includes(policy);
    return providerOk && policyOk && searchable.includes(normalize(query));
  });
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Card className="overflow-hidden shadow-[0_24px_80px_rgba(0,3,17,0.08)]">
        <CardHeader>
          <div>
            <p className="text-xs font-semibold text-[var(--querit-muted)]">leaderboard</p>
            <h2 className="mt-1 font-head text-2xl font-extrabold">leaderboard 与公开 score</h2>
          </div>
          <div className="mt-4 grid gap-2">
            <Select value={provider} onChange={(event) => setProvider(event.target.value)}>
              <option value="all">全部服务商</option>
              {trackedProviders.map((item) => <option value={item} key={item}>{item}</option>)}
            </Select>
            <Select value={policy} onChange={(event) => setPolicy(event.target.value)}>
              <option value="all">全部来源属性</option>
              {policies.map((item) => <option value={item} key={item}>{independenceLabels[item] ?? item}</option>)}
            </Select>
          </div>
        </CardHeader>
        <div className="max-h-[760px] overflow-y-auto">
          {filtered.map((item) => {
            const isActive = selected?.id === item.id;
            return (
              <button
                className={cn(
                  "w-full border-b border-[var(--querit-line)] px-5 py-4 text-left transition hover:bg-cyan-50/40",
                  isActive && "bg-cyan-50 shadow-[inset_4px_0_0_var(--querit-cyan)]",
                )}
                type="button"
                onClick={() => setSelectedId(item.id)}
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="line-clamp-2 text-sm font-bold text-[var(--querit-ink)]">{item.title}</strong>
                    <p className="mt-1 text-xs text-[var(--querit-muted)]">{item.kind === "competitor" ? "公开 score 汇总" : "官方 leaderboard"} · {leaderboardRowCount(item)} 行</p>
                    <p className="mt-1 line-clamp-1 text-xs text-[var(--querit-muted)]">{metricListText(item.metrics) || "指标未记录"}</p>
                  </div>
                  <Badge variant={item.kind === "competitor" ? "purple" : "dark"}>{item.kind === "competitor" ? "score" : "official"}</Badge>
                </div>
                <div className="mt-3">
                  <ProviderBadges providers={item.competitors} />
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="overflow-hidden shadow-[0_24px_80px_rgba(0,3,17,0.08)]">
        {selected ? (
          <>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--querit-muted)]">{selected.kind === "competitor" ? "公开 score 汇总" : "官方 leaderboard"}</p>
                  <h2 className="mt-1 break-words font-head text-2xl font-extrabold leading-tight">{selected.title}</h2>
                </div>
                <ProviderBadges providers={selected.competitors} />
              </div>
            </CardHeader>
            <CardContent className="grid gap-5">
              <FactGrid
                rows={[
                  { label: "benchmark / evaluation", value: selected.benchmark_id ?? selected.title },
                  { label: "来源属性", value: sourcePoliciesForLeaderboard(selected).map((value) => independenceLabels[value] ?? value).join(" / ") },
                  { label: "指标", value: metricListText(selected.metrics) || "未记录" },
                  { label: "行数", value: leaderboardRowCount(selected) },
                  { label: "来源类型", value: sourceLabels[selected.source_type] ?? selected.source_type },
                  { label: "日期 / release", value: selected.date ?? "未记录" },
                ]}
              />
              <section className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-[var(--querit-muted)]" />
                  <h3 className="font-semibold">leaderboard 表</h3>
                </div>
                <LeaderboardTables item={selected} />
              </section>
              <section className="grid gap-3">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4 text-[var(--querit-muted)]" />
                  <h3 className="font-semibold">来源</h3>
                </div>
                <SourceList
                  sources={
                    selected.kind === "competitor"
                      ? unique(leaderboardRows(selected).map((row: AnyRecord) => row.source_url)).map((url) => ({ source_type: "reported_scores", url, access_mode: "public" }))
                      : [{ source_type: selected.source_type, url: selected.source_url, access_mode: "public" }]
                  }
                />
              </section>
            </CardContent>
          </>
        ) : (
          <CardContent>
            <p className="text-sm text-[var(--querit-muted)]">没有匹配的 leaderboard</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function BenchmarkApp({ data }: { data: BenchmarkData }) {
  const viewData = useMemo(() => dataFor(data), [data]);
  const { benchmarks, snapshots, appearances, datasetPreviewById } = viewData;
  const [activeView, setActiveView] = useState<"benchmarks" | "leaderboard">("benchmarks");
  const [query, setQuery] = useState("");

  const leaderboardCount = useMemo(() => buildLeaderboardItems(benchmarks, snapshots, appearances).length, [benchmarks, snapshots, appearances]);
  const liveWeb = benchmarks.filter((item) => item.search_protocol?.mode === "live_web").length;
  const sampledDatasets = benchmarks.filter((item) => datasetPreview(datasetPreviewById, item.id).status === "sampled").length;
  const sourceCount = benchmarks.reduce((sum, item) => sum + (item.sources?.length ?? 0), 0) + snapshots.length + appearances.length;
  const updatedAt = String(data.facts.meta?.generated_at ?? "2026-07-09");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--querit-line)] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-5 md:px-9">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[var(--querit-ink)] text-[var(--querit-cyan)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <strong className="block font-head text-lg font-extrabold leading-none">Agent Search</strong>
              <span className="mt-1 block text-xs text-[var(--querit-muted)]">benchmark 资料库</span>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex" aria-label="主导航">
            <Button variant={activeView === "benchmarks" ? "active" : "ghost"} onClick={() => setActiveView("benchmarks")}>
              <LibraryBig className="h-4 w-4" />
              benchmark 目录
            </Button>
            <Button variant={activeView === "leaderboard" ? "active" : "ghost"} onClick={() => setActiveView("leaderboard")}>
              <Trophy className="h-4 w-4" />
              leaderboard
            </Button>
          </nav>

          <div className="hidden rounded-[12px] border border-[var(--querit-line)] bg-[var(--querit-surface)] px-4 py-2 text-right sm:block">
            <span className="block text-xs text-[var(--querit-muted)]">更新日期</span>
            <strong className="font-mono text-sm">{updatedAt}</strong>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1440px] gap-4 px-5 py-5 md:px-9 md:py-6">
        <section className="rounded-[18px] border border-[var(--querit-line)] bg-white p-4 shadow-[0_18px_70px_rgba(0,3,17,0.06)] md:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div>
              <p className="text-xs font-semibold text-[var(--querit-muted)]">Search API / Agent Search</p>
              <h1 className="mt-1 font-head text-2xl font-extrabold leading-tight text-[var(--querit-ink)] md:text-3xl">
                benchmark 资料库
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--querit-soft-ink)]">
                benchmark、dataset 样例、服务商记录与公开 leaderboard 的可检索目录。
              </p>
            </div>
            <div className="grid gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--querit-muted)]" />
                <Input
                  className="h-12 pl-10"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索 benchmark / 服务商 / 指标"
                  aria-label="搜索"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 md:hidden">
                <Button variant={activeView === "benchmarks" ? "active" : "outline"} onClick={() => setActiveView("benchmarks")}>benchmark</Button>
                <Button variant={activeView === "leaderboard" ? "active" : "outline"} onClick={() => setActiveView("leaderboard")}>leaderboard</Button>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Layers3} label="benchmark" value={benchmarks.length} caption="已收录" />
            <StatCard icon={Globe2} label="实时网页" value={liveWeb} caption="模式" />
            <StatCard icon={Database} label="dataset 样例" value={sampledDatasets} caption="已接入" />
            <StatCard icon={BarChart3} label="leaderboard" value={leaderboardCount} caption={`来源 ${sourceCount}`} />
          </div>
        </section>

        {activeView === "benchmarks" ? <BenchmarkDirectory data={viewData} query={query} /> : <LeaderboardView data={viewData} query={query} />}
      </main>
    </div>
  );
}
