# Initial Runner Specs v1

生成日期：2026-07-09

说明：这份文档只定义可执行闭环，不表达优先级判断。这里选择的三个 runner 都满足以下客观条件：

- 有公开数据入口。
- 有可追踪的官方或准官方评估协议。
- search / retrieval 在评估中实际影响结果。
- 适合先做小样本或 retrieval-only 自动化。

## 1. BrowseComp-Plus Retrieval-Only Runner

### 1.1 目标

在固定 corpus 上评估一个 retriever / search API 对 BrowseComp-Plus query 的文档召回能力。

### 1.2 输入来源

| 类型 | 来源 |
|---|---|
| 代码 | https://github.com/texttron/BrowseComp-Plus |
| Query / answer / qrels | https://huggingface.co/datasets/Tevatron/browsecomp-plus |
| Corpus | https://huggingface.co/datasets/Tevatron/browsecomp-plus-corpus |
| Evidence qrels | `topics-qrels/qrel_evidence.txt` |
| Gold qrels | `topics-qrels/qrel_golds.txt` |

### 1.3 输入字段

| 数据 | 字段 |
|---|---|
| Query | `query_id`, `query_text` |
| Corpus document | `docid`, `text`，实际字段需从 HF corpus schema 自动探测 |
| Qrels | `query_id`, `Q0`, `docid`, `relevance` |

### 1.4 Runner 步骤

1. 拉取 BrowseComp-Plus repo 的 latest commit 或指定 commit。
2. 记录 `topics-qrels/qrel_evidence.txt` 和 `topics-qrels/qrel_golds.txt` 的 hash。
3. 通过官方脚本或 HF dataset 生成/读取 `queries.tsv`。
4. 将 corpus 建到本地或远程 search index。
5. 对每个 query 调用 search API / retriever，取 top K。
6. 输出 TREC run file。
7. 使用 `pyserini.eval.trec_eval` 或等价实现计算指标。

### 1.5 输出格式

TREC run：

```text
query_id Q0 docid rank score run_name
```

数据库 run artifact：

```json
{
  "benchmark_id": "browsecomp_plus",
  "runner_type": "retrieval_only",
  "dataset_version": "source_commit_or_hf_revision",
  "retriever_name": "string",
  "top_k": 1000,
  "run_file_uri": "string",
  "qrel_evidence_hash": "string",
  "qrel_gold_hash": "string"
}
```

### 1.6 指标

| qrel | 指标 |
|---|---|
| Evidence docs | `recall@5`, `recall@100`, `recall@1000`, `nDCG@10` |
| Gold docs | `recall@5`, `recall@100`, `recall@1000`, `nDCG@10` |

### 1.7 Credentials

| Credential | 是否必需 | 说明 |
|---|---|---|
| Hugging Face token | 可能需要 | README 提到下载 obfuscated dataset 可能需要 login |
| Search API key | 取决于被测系统 | 如果 retriever 是内部 API，则需要 |
| LLM API key | 不需要 | retrieval-only 不需要 judge |

### 1.8 数据库存储

需要写入：

- `benchmarks`
- `benchmark_sources`
- `datasets`
- `dataset_splits`
- `search_protocols`
- `evaluation_methods`
- `metrics`
- `automation_checks`
- `runs`
- `run_metrics`
- `run_artifacts`

### 1.9 已知限制

- 完整 corpus 较大，第一次构建 index 成本较高。
- Query 解密流程可能依赖 HF token。
- retrieval-only 不评估最终 answer generation。

## 2. LiveNewsBench Smoke Runner

### 2.1 目标

在 `human_verified_test` split 上运行一个小样本 web search agent，记录答案准确性、搜索次数、点击次数和轨迹。

### 2.2 输入来源

| 类型 | 来源 |
|---|---|
| 代码/数据 | https://github.com/LiveNewsBench/LiveNewsBench |
| 论文 | https://arxiv.org/abs/2602.13543 |
| 官网 | https://livenewsbench.com/ |

### 2.3 输入字段

LiveNewsBench README 指定核心字段：

| 字段 | 含义 |
|---|---|
| `link` | QA pair 来源文章；评估时应排除该域名 |
| `event_date` | 新闻事件日期 |
| `question` | agent 需要回答的问题 |
| `answer` | 标准答案 |

2026-01 release 的本地核验结果：

| split | record count |
|---|---:|
| `train` | 612 |
| `val` | 171 |
| `test` | 346 |
| `human_verified_test` | 200 |

### 2.4 Runner 步骤

1. 拉取 LiveNewsBench repo 的指定 commit。
2. 选择 release，例如 `jan_2026_release_2`。
3. 读取 `datasets/{release}/human_verified_test.jsonl`。
4. 抽样或全量运行，每条样本给 agent 输入 `question`。
5. Search tool 必须排除：
   - 原始 `link` 的域名。
   - Internet archive 域名，例如 Wayback Machine、archive.is。
6. Agent 最多使用配置内的 search/click budget。
7. 产出 JSONL，保留原字段并追加官方要求字段。
8. 使用 `evals/grade_answers.py` 或等价 judge 计算准确率。

### 2.5 输出字段

官方要求追加字段：

| 字段 | 类型 | 含义 |
|---|---|---|
| `search_final_answer` | string | agent 最终答案 |
| `task_history` | string/json | 搜索轨迹与中间步骤 |
| `used_searches` | integer | distinct search query 数 |
| `used_clicks` | integer | 点击/全文访问数 |

建议内部额外字段：

| 字段 | 类型 | 含义 |
|---|---|---|
| `search_provider` | string | 被测 search API |
| `content_mode` | enum | `snippet_only`, `raw_content`, `processed_content` |
| `blocked_domains` | array | 实际屏蔽域名 |
| `finish_reason` | string | agent 结束原因 |
| `latency_ms` | integer/null | 单题耗时 |
| `cost_estimate` | number/null | API 成本估算 |

### 2.6 指标

| 指标 | 来源 |
|---|---|
| `accuracy` | judge 输出 |
| `used_searches_mean` | 输出字段聚合 |
| `used_clicks_mean` | 输出字段聚合 |
| `finish_reason_distribution` | 输出字段聚合 |
| `search_budget_exceeded_rate` | 输出字段聚合 |
| `click_budget_exceeded_rate` | 输出字段聚合 |

### 2.7 Credentials

| Credential | 是否必需 | 说明 |
|---|---|---|
| Search API key | 必需 | 被测 search API |
| Model API key | 必需 | agent LLM |
| Judge model API key | 必需 | 官方脚本默认 GPT-4.1 或兼容模型 |

### 2.8 数据库存储

需要写入：

- `benchmark_versions`
- `dataset_splits`
- `search_protocols`
- `evaluation_methods`
- `automation_checks`
- `runs`
- `run_metrics`
- `sample_outputs`
- `run_artifacts`

### 2.9 已知限制

- 题目依赖 live web，结果会受新闻网页可访问性和搜索索引变化影响。
- LLM judge 会引入模型版本影响，需要记录 judge model 和 prompt hash。
- 官方输出中的 `task_history` 可能包含大量文本，需要单独存 artifact，不建议全部塞进主表。

## 3. MIRACL Retrieval Baseline Runner

### 3.1 目标

在多语言固定 corpus 上评估 search / retrieval 系统。第一版建议先接 MIRACL 的一个语言子集，再扩展到 18 语言。

### 3.2 输入来源

| 类型 | 来源 |
|---|---|
| Project | https://project-miracl.github.io/ |
| Dataset | https://huggingface.co/datasets/miracl/miracl |
| Paper | https://aclanthology.org/2023.tacl-1.63/ |

已核验的英文 dev 文件路径：

| 文件 | 路径 |
|---|---|
| topics | `miracl-v1.0-en/topics/topics.miracl-v1.0-en-dev.tsv` |
| qrels | `miracl-v1.0-en/qrels/qrels.miracl-v1.0-en-dev.tsv` |

### 3.3 输入字段

Topic TSV：

```text
query_id<TAB>query_text
```

Qrels TSV：

```text
query_id Q0 docid relevance
```

Corpus schema 需从 HF dataset 自动探测并写入 `dataset_splits.schema_json`。

### 3.4 Runner 步骤

1. 选择语言列表，例如先用 `en` 做 smoke run。
2. 拉取对应 topics、qrels、corpus。
3. 构建或调用 search index。
4. 对每个 query 输出 top K docids。
5. 生成 TREC run file。
6. 使用 pyserini/trec_eval 或等价实现计算 retrieval metrics。
7. 扩展到多语言时，按 language 维度分别保存 run metrics。

### 3.5 输出格式

TREC run：

```text
query_id Q0 docid rank score run_name
```

数据库 run artifact：

```json
{
  "benchmark_id": "miracl",
  "language": "en",
  "split": "dev",
  "runner_type": "retrieval_only",
  "retriever_name": "string",
  "top_k": 1000,
  "run_file_uri": "string"
}
```

### 3.6 指标

| 指标 | 说明 |
|---|---|
| `nDCG@10` | MIRACL 常用主指标之一 |
| `Recall@100` | 多语言 retrieval 召回 |
| `MRR@10` | 可选 |
| `MAP` | 可选 |

最终采用哪些指标应与官方 eval scripts 对齐。

### 3.7 Credentials

| Credential | 是否必需 | 说明 |
|---|---|---|
| Hugging Face token | 通常不需要 | 公开数据可直接访问，实际以下载结果为准 |
| Search API key | 取决于被测系统 | 内部 search API 需要 |
| LLM API key | 不需要 | retrieval-only 不需要 judge |

### 3.8 数据库存储

需要写入：

- `datasets`
- `dataset_splits`
- `task_designs`
- `search_protocols`
- `metrics`
- `runs`
- `run_metrics`

### 3.9 已知限制

- MIRACL 是固定 corpus retrieval，不评估 live web freshness。
- 不评估 agent planning、网页点击或答案生成。
- 不同语言的 tokenizer、segmentation、normalization 会影响结果，需要记录 indexing config。

## 4. Runner 元数据统一要求

所有 runner 都应保存：

| 字段 | 说明 |
|---|---|
| `benchmark_id` | benchmark ID |
| `dataset_version_id` | 数据版本 |
| `runner_type` | `metadata_refresh`, `retrieval_only`, `agent_end_to_end`, `leaderboard_sync` |
| `runner_version` | runner 代码版本 |
| `config_hash` | 配置 hash |
| `input_hash` | 输入数据 hash |
| `started_at` / `finished_at` | 运行时间 |
| `status` | `ok`, `failed`, `blocked`, `requires_review` |
| `artifacts` | run file、logs、sample outputs、judge outputs |

## 5. 不进入 runner 的内容

以下内容不写入 runner spec，只能作为 annotation：

- 这个 benchmark 是否“重要”
- 是否“推荐先做”
- 是否“最适合我们”
- 团队对产品路线的策略判断

runner spec 只描述：输入、步骤、输出、指标、credentials、限制。
