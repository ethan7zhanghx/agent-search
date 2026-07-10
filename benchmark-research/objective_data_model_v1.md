# Agent Search Benchmark 数据模型 v1

更新日期：2026-07-10

本文件是团队阅读版说明；机器可读字段契约见 `benchmark-research/data_model_v1.json`。后续前端、数据库迁移、自动刷新脚本和 PR 校验都应以该 JSON 为准。

## 1. v1 覆盖范围

v1 明确覆盖七类实体：

| 实体 | 当前 JSON 位置 | 后续数据库表 | 说明 |
|---|---|---|---|
| `benchmark` | `objective_benchmark_facts_v1.json` | `benchmarks` | 主库 benchmark / evaluation 条目 |
| `dataset` | `dataset_samples_v1.json` | `datasets` | dataset 元信息、来源、记录数、字段 |
| `sample_task` | `dataset_samples_v1.json` 的 `rows` | `sample_tasks` | 公开样例任务或样例行；原始字段保持 source-native |
| `source` | 嵌入各 JSON 的 source URL | `sources` | 论文、GitHub、dataset、leaderboard、博客等证据来源 |
| `leaderboard_result` | `public_result_snapshots_v1.json` | `leaderboard_results` | 官方或公开 score / leaderboard 快照 |
| `provider_appearance` | `competitor_visibility_v1.json` | `provider_appearances` | Tavily / Exa / Brave 在公开 evaluation 中出现的记录 |
| `refresh_run` | `refresh_runs_v1.json` | `refresh_runs` | 手工或自动刷新、校验、同步运行记录 |

## 2. 主库收录规则

`objective_benchmark_facts_v1.json` 只保留两类：

| `evaluation_target` | 含义 | 收录条件 |
|---|---|---|
| `search_api` | Search API、search engine、retriever 或 provider 本身是被测对象 | 搜索结果质量、排序、召回、相关性、覆盖度、延迟或 provider score 会直接影响评分 |
| `agent_plus_search` | Agent / LLM 使用 search 作为工具完成任务 | Search 工具调用、搜索结果质量或搜索策略会真实影响最终任务评分 |

不进入主库的条目放入 `excluded_benchmarks_v1.json`：

| `exclusion_reason` | 含义 |
|---|---|
| `provided_context_only` | benchmark 已提供搜索后的材料、trace 或 evidence，评估时不需要 search API 参与 |
| `no_search_dependency` | 静态 QA、阅读理解或模型能力评估，search 不是协议要求 |
| `out_of_scope` | 文章、观点、产品对比或无法形成独立 benchmark/evaluation 条目的材料 |

## 3. 字段要求

每个字段必须在 `data_model_v1.json` 中定义以下信息：

| 属性 | 含义 |
|---|---|
| `type` | 字段类型，例如 `string`、`enum`、`url`、`date`、`object[]` |
| `required` | 当前 v1 数据是否必填 |
| `allowed_values` | enum 的允许值；非 enum 为 `null` |
| `source_requirement` | 来源要求：URL、公开来源、从来源派生、人工调研备注或系统生成 |
| `updated_by` | 更新时间由人工、刷新脚本、校验脚本或系统生成 |
| `storage_class` | 后续存储位置：数据库、来源快照或调研备注 |

所有 v1 数据文件都应有：

| 字段 | 要求 |
|---|---|
| `schema_version` | 固定为 `1.0.0` |
| `data_model_version` | 固定为 `1.0.0` |
| `generated_at` | 生成或最初录入日期 |
| `last_updated_at` | 本文件最近一次结构或事实更新日期 |

## 4. 数据库存储边界

应迁移到数据库的字段：

- 稳定身份：`id`、`canonical_name`、`benchmark_id`、`provider`。
- 分类与筛选：`evaluation_target`、`search_component_role`、`benchmark_family`、`source_type`、`source_independence`、`appearance_type`。
- 客观协议：`task_design`、`search_protocol`、`evaluation`、`metrics`。
- dataset metadata：`status`、`record_count_observed`、`fields`、`file_format`、`split`、`source_url`。
- leaderboard metadata：`benchmark_id`、`metrics`、`source_url`、`source_type`、`result_date_or_release`。
- 自动化字段：`last_checked_at`、`updated_at`、refresh run 的 `started_at`、`finished_at`、`status`。

保留为来源快照的字段：

- dataset sample row 的 source-native payload，例如 `problem`、`answer`、`query`、`metadata`、`rubric`。
- leaderboard 原始行，例如模型名、retriever、公开 score、rank、correct / total。
- provider appearance 的 `score_or_metric` 原始结构，尤其是厂商页面只给出文本型 score 时。
- source 文件列表、split count、文件大小、row group 信息等可由刷新脚本重新生成的抓取结果。

保留为调研备注的字段：

- `evaluation_target_rationale`
- `details`
- `notes`
- `exclusion_notes`
- refresh run 的 `summary`

调研备注可以进入数据库，但不应和核心事实字段混在同一语义层。前端展示时也应区分“公开事实”和“调研说明”。

## 5. 展示层字段规则

数据文件不保存前端专用字段，例如：

- `frontend_display_group`
- `frontend_notes`
- 只为当前页面排版服务的 label、颜色、排序文案

如果页面需要分组，应由客观字段派生，例如用 `source_independence`、`appearance_type`、`provider` 或 `benchmark_id` 计算。

## 6. 校验入口

运行：

```bash
node benchmark-research/scripts/validate_data.mjs
```

校验覆盖：

- `objective_benchmark_facts_v1.json` 字段完整性与主库收录规则。
- `dataset_samples_v1.json` dataset 和 sample task 结构。
- `public_result_snapshots_v1.json` leaderboard 结果结构。
- `competitor_visibility_v1.json` provider appearance 结构。
- `refresh_runs_v1.json` refresh run 结构。
- 跨文件外键关系和 URL 格式。

新增 benchmark、dataset、leaderboard 或 provider appearance 时，应先通过该校验，再进入前端和 PR review。
