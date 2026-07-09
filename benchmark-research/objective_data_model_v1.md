# Benchmark 前端与数据库客观数据模型 v1

生成日期：2026-07-09

## 1. 设计原则

后续前端和数据库应尽量作为事实库，而不是观点库。核心表只记录可追溯事实：

- benchmark 官方名称、来源、论文、代码、数据集、license。
- 数据集 split、文件路径、字段、样本数量、语言、更新时间。
- 任务输入/输出格式、gold 类型、是否包含 qrels、是否包含 hidden test。
- search / retrieval / browsing / agent pool 在评估协议中的位置。
- 官方指标、judge 类型、评估脚本、leaderboard 提交方式。
- 自动化抓取状态、credentials 需求、最近一次检查结果。

以下内容不要放进核心事实表，最多放到 annotation 层：

- “优先级高/低”
- “很适合我们”
- “推荐先做”
- “价值很大”
- “效果好/不好”

如果确实需要展示判断，建议做成独立表 `annotations`，并保存作者、时间、依据和适用场景。

## 2. 核心实体

### 2.1 `benchmarks`

一条 benchmark 的稳定身份。

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | text | 内部稳定 ID |
| `canonical_name` | text | 官方或最常用名称 |
| `short_name` | text | 简称 |
| `description` | text | 客观简介，避免评价性词汇 |
| `benchmark_family` | enum/text | 如 `live_web_search`, `fixed_corpus_retrieval`, `agent_discovery` |
| `first_released_year` | integer/null | 首次发布年份 |
| `maintainer_org` | text/null | 维护方 |
| `status` | enum | `active`, `archived`, `unknown` |
| `created_at` | datetime | 入库时间 |
| `updated_at` | datetime | 最近更新 |

### 2.2 `benchmark_sources`

所有可追踪来源。一个 benchmark 可有多个 source。

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | text | source ID |
| `benchmark_id` | text | 外键 |
| `source_type` | enum | `paper`, `github`, `dataset`, `leaderboard`, `website`, `blog`, `docs` |
| `url` | text | 来源 URL |
| `title` | text/null | 来源标题 |
| `host` | text/null | `github`, `huggingface`, `kaggle`, `arxiv`, `nist` 等 |
| `access_mode` | enum | `public`, `token_required`, `unknown`, `restricted` |
| `license_text` | text/null | 来源声明的 license |
| `last_checked_at` | datetime/null | 最近检查时间 |
| `content_hash` | text/null | 页面/文件 hash |
| `check_status` | enum | `ok`, `failed`, `changed`, `requires_review` |

### 2.3 `benchmark_versions`

论文版本、数据 release、leaderboard 版本都应能单独记录。

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | text | version ID |
| `benchmark_id` | text | 外键 |
| `version_type` | enum | `paper`, `dataset_release`, `leaderboard_snapshot`, `code_commit` |
| `version_label` | text | 如 `jan_2026_release_2`, `v1.0`, `arXiv v1` |
| `release_date` | date/null | 发布日期 |
| `source_id` | text/null | 对应 source |
| `source_ref` | text/null | commit hash、arXiv id、HF revision 等 |
| `notes` | text/null | 客观说明 |

### 2.4 `datasets`

数据集层级的 metadata。

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | text | dataset ID |
| `benchmark_id` | text | 外键 |
| `version_id` | text/null | 对应 release |
| `host` | text | `huggingface`, `github`, `kaggle`, `openai_blob`, `nist`, `other` |
| `dataset_name` | text | 数据集名称或路径 |
| `download_url` | text/null | 可下载入口 |
| `access_mode` | enum | `public`, `token_required`, `unknown`, `restricted` |
| `license_text` | text/null | license |
| `total_records` | integer/null | 总记录数 |
| `record_count_basis` | enum | `official_claim`, `computed`, `sampled`, `unknown` |
| `contains_hidden_test` | boolean/null | 是否存在隐藏测试集 |
| `contains_public_labels` | boolean/null | labels 是否公开 |
| `contains_qrels` | boolean/null | 是否包含 qrels |
| `contains_traces` | boolean/null | 是否包含 search/agent traces |

### 2.5 `dataset_splits`

split 是前端和自动化最常用的筛选维度。

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | text | split ID |
| `dataset_id` | text | 外键 |
| `split_name` | text | `train`, `validation`, `test`, `human_verified_test` 等 |
| `record_count` | integer/null | 记录数 |
| `record_count_basis` | enum | `computed`, `official_claim`, `unknown` |
| `file_path` | text/null | 文件路径 |
| `file_format` | enum | `jsonl`, `csv`, `parquet`, `tsv`, `json`, `other` |
| `file_size_bytes` | integer/null | 文件大小 |
| `schema_json` | json/null | 字段 schema |

### 2.6 `task_designs`

任务设计只记录客观结构。

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | text | task design ID |
| `benchmark_id` | text | 外键 |
| `task_input_type` | enum | `question`, `query`, `instruction`, `task_description`, `website_state_task` |
| `expected_output_type` | enum | `short_answer`, `set_answer`, `table`, `ranked_list`, `report`, `preference_pair` |
| `gold_type` | enum | `answer_key`, `qrels`, `structured_table`, `human_vote`, `execution_grounded_label`, `judge_rubric` |
| `requires_fresh_information` | boolean/null | 是否要求新鲜信息 |
| `requires_multihop` | boolean/null | 是否多跳 |
| `requires_exhaustive_collection` | boolean/null | 是否要求找全 |
| `requires_structured_output` | boolean/null | 是否结构化输出 |
| `languages` | json | 语言列表 |

### 2.7 `search_protocols`

这是区分“真 search benchmark”和“只是 RAG/QA”的关键表。

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | text | protocol ID |
| `benchmark_id` | text | 外键 |
| `mode` | enum | `live_web`, `fixed_corpus`, `browser_navigation`, `state_gated_site`, `agent_pool`, `trace_dataset`, `provided_evidence` |
| `search_required_for_evaluation` | boolean | 评估时 search 是否参与 |
| `search_provider_policy` | enum | `fixed_provider`, `user_provided`, `not_applicable`, `unknown` |
| `fixed_provider_name` | text/null | 如 Brave、Tavily |
| `retriever_replaceable` | boolean/null | 协议是否允许替换 retriever |
| `tool_schema_public` | boolean/null | 工具 schema 是否公开 |
| `records_tool_calls` | boolean/null | 是否记录 tool calls |
| `records_search_count` | boolean/null | 是否记录搜索次数 |
| `records_click_count` | boolean/null | 是否记录点击次数 |
| `requires_click_or_full_page` | boolean/null | 是否需要点击/全文访问 |
| `requires_site_state` | boolean/null | 是否需要站内筛选/视图/状态 |

### 2.8 `evaluation_methods`

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | text | method ID |
| `benchmark_id` | text | 外键 |
| `supports_retrieval_only` | boolean | 是否支持只评估 retrieval |
| `supports_end_to_end_agent` | boolean | 是否支持 agent 端到端 |
| `judge_type` | enum | `exact_match`, `qrels_metric`, `llm_judge`, `human_vote`, `hybrid`, `unknown` |
| `judge_model` | text/null | 如 GPT-4.1、Qwen3-32B |
| `evaluation_script_public` | boolean/null | 评分脚本是否公开 |
| `leaderboard_public` | boolean/null | 是否有公开 leaderboard |
| `submission_mode` | enum | `local`, `hosted_leaderboard`, `email`, `unknown`, `not_applicable` |
| `notes` | text/null | 客观说明 |

### 2.9 `metrics`

每个指标单独入库，便于前端筛选和 run metrics 对齐。

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | text | metric ID |
| `benchmark_id` | text | 外键 |
| `metric_name` | text | 如 `accuracy`, `recall@100`, `nDCG@10` |
| `metric_family` | enum | `accuracy`, `ranking`, `retrieval`, `calibration`, `cost`, `trace`, `preference`, `structured_output` |
| `higher_is_better` | boolean/null | 是否越高越好 |
| `definition` | text/null | 官方定义或简短说明 |
| `source_id` | text/null | 来源 |

### 2.10 `automation_checks`

自动化状态也要记录事实，不写“优先级”。

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | text | check ID |
| `benchmark_id` | text | 外键 |
| `check_type` | enum | `metadata_refresh`, `schema_sample`, `smoke_eval`, `full_eval`, `leaderboard_sync` |
| `cadence` | enum | `weekly`, `monthly`, `release_triggered`, `manual` |
| `credential_requirements` | json | 如 `hf_token`, `kaggle_token`, `search_api_key`, `model_api_key` |
| `runner_available` | boolean | 是否已有 runner |
| `last_run_at` | datetime/null | 最近一次运行 |
| `last_run_status` | enum | `not_run`, `ok`, `failed`, `blocked`, `requires_review` |
| `last_error` | text/null | 错误摘要 |

### 2.11 `annotations`

团队判断、产品映射、优先级都放这里，不进入核心事实表。

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | text | annotation ID |
| `entity_type` | enum | `benchmark`, `dataset`, `source`, `runner`, `metric` |
| `entity_id` | text | 被标注实体 |
| `annotation_type` | enum | `product_mapping`, `priority`, `owner_note`, `risk`, `decision` |
| `content` | text/json | 标注内容 |
| `basis` | text/null | 依据来源或理由 |
| `author` | text/null | 作者 |
| `created_at` | datetime | 创建时间 |
| `valid_until` | datetime/null | 失效时间 |

## 3. 前端信息架构

前端默认展示客观信息：

- Overview：名称、维护方、来源、发布日期、数据访问方式。
- Dataset：split、行数、字段、语言、labels/qrels/traces 是否公开。
- Search Protocol：live web / fixed corpus / browser navigation / agent pool，搜索提供方是否固定，是否记录 tool calls。
- Evaluation：gold 类型、指标、judge 类型、是否有公开脚本和 leaderboard。
- Automation：最近检查时间、抓取状态、需要的 credentials、runner 是否存在。
- Sources：所有 source 的 URL、检查状态、hash/更新时间。

可选展示团队标注，但要视觉上区别于事实：

- Product mapping
- Internal priority
- Implementation notes
- Risk notes

## 4. 字段命名建议

稳定枚举尽量用英文 snake_case；前端显示中文即可。

避免把复杂事实写成自然语言 blob。比如：

- 不要只存 `适合自动跑`
- 应存 `evaluation_script_public=true`, `contains_public_labels=true`, `requires_model_api_key=true`, `runner_available=false`

避免把团队判断混到事实字段。比如：

- 不要在 `benchmarks` 表存 `priority=P0`
- 可在 `annotations` 表存 `{annotation_type: "priority", content: "P0", basis: "..."}`

## 5. 后续迁移顺序

第一阶段只建事实库：

1. `benchmarks`
2. `benchmark_sources`
3. `datasets`
4. `dataset_splits`
5. `task_designs`
6. `search_protocols`
7. `evaluation_methods`
8. `metrics`
9. `automation_checks`

第二阶段加运行结果：

1. `runs`
2. `run_metrics`
3. `run_artifacts`
4. `sample_outputs`

第三阶段加团队判断：

1. `annotations`
2. `watchlist_items`
3. `decision_log`
