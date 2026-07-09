# Search / Agent Search Benchmark 调研 v0

生成日期：2026-07-09  
状态：v0 initial scan，不是最终深度审计版

## 0. 先把边界说清楚

这个主题确实不适合“很快调研完”。当前版本只完成了三件事：

1. 建立一个面向数据库和前端的 registry 结构。
2. 初筛一批与 search / agent search 相关的 benchmark。
3. 按 search 在评估中的介入方式做第一轮分类。

它还没有完成这些深度动作：

1. 逐篇论文精读。
2. 下载并检查每个数据集字段。
3. 跑通每个 benchmark 的最小样例。
4. 核查 license、leaderboard 提交流程、数据是否仍可访问。
5. 对 search API 可替换性做代码级验证。

因此，当前产物应该被团队当作 **调研地图和后续工作底座**，而不是可以直接对外引用的最终结论。

配套结构化文件：[benchmark_registry.json](/Users/zhanghaoxin/Documents/agent-search/benchmark-research/benchmark_registry.json)

## 1. 核心判断

你前面指出的问题是对的：很多所谓 search-augmented LLM / RAG benchmark，并不真的评估 search API。它们可能已经提供了 evidence，或者只在固定语料上评估生成能力。对我们来说，真正关键的问题是：

> search、retrieval、browsing、agent/tool discovery 是否在 benchmark 过程中真实影响最终分数？

如果 search 只是数据构造阶段用过，或者 evidence 已经直接给模型，那它对 search API 产品只能算间接参考。

当前建议采用这几个 search 介入模式：

| 模式 | 含义 | 对产品的价值 |
|---|---|---|
| `live_web_tool_required` | 模型/agent 评估时必须调用搜索或浏览真实网页 | 最接近 search API / agent search 的未来形态 |
| `fixed_corpus_search_required` | 不搜开放网页，但必须在固定 corpus 里检索 | 适合自动跑和稳定复现，可隔离 retriever/search 质量 |
| `browser_navigation_required` | agent 需要网页导航、点击、站内搜索、跨页面读取 | 更偏 agent 产品，但 search+content 能力也很重要 |
| `agent_or_tool_retrieval_required` | 检索目标不是网页，而是 agent/tool/API | 直接对应未来 agent search |
| `search_trace_or_preference_dataset` | 已收集 search-augmented 交互轨迹和偏好 | 不适合直接评估 API，但适合理解用户需求和 citation 行为 |
| `indirect_retrieval_component` | RAG/QA 中 retrieval 会影响结果，但不是开放 web search | 适合学习评估模式，不宜直接当 search API benchmark |

## 2. 当前优先级最高的 benchmark

这些是第一批建议深入审计的对象，因为 search 参与度高，且对产品路线有直接参考。

| Benchmark | 为什么重要 | 相关产品线 | 下一步核验重点 |
|---|---|---|---|
| [FACTS Search](https://www.kaggle.com/benchmarks/google/facts-search) | 明确测试模型使用 Search API 检索并综合事实的能力 | search API, search+content | 官方协议、搜索工具是否固定、1842 题数据结构、Kaggle 提交流程 |
| [BrowseComp](https://openai.com/index/browsecomp/) | 典型 agentic web search，1266 个难找短答案问题 | search API, search+content, agent search | simple-evals 实现、污染风险、搜索调用轨迹如何记录 |
| [LiveNewsBench](https://livenewsbench.com/) | 用新鲜新闻构造问题，专门测试 live web search 能力 | search API, search+content | 数据 release 机制、更新频率、human-verified split |
| [BrowseComp-Plus](https://github.com/texttron/BrowseComp-Plus) | 用固定 corpus 隔离 retriever 和 agent，适合自动跑 | search API, search+content, agent search | 100K 文档 corpus、830 queries、retriever 接口、证据召回指标 |
| [WideSearch](https://widesearch-seed.github.io/) | 测“大范围找全信息”，不是 top result 准不准 | search API, search+content, agent search | gold table、atomic fact 验证、中文/英文任务差异 |
| [DeepSearchQA](https://www.kaggle.com/benchmarks/google/dsqa) | 900 个复杂多步搜索任务，强调 comprehensive answer lists | search API, search+content, agent search | Kaggle benchmark 权限、HF 数据、评分函数 |
| [AgentSearchBench](https://bingo-w.github.io/AgentSearchBench/) | 直接定义 agent search：任务到 agent 的 retrieval/reranking | agent search | 近 10000 agents、execution-grounded labels、reranking 指标 |
| [SGR-Bench](https://arxiv.org/abs/2605.22219) | 专门测 state-gated retrieval：找到网站后还要设对 filter/view/scope | search+content, agent search | 数据集 release、MCP/网站配置、row-level F1 |
| [MIRACL](https://project-miracl.github.io/) / [NeuCLIR](https://neuclir.github.io/) | 多语言/跨语言 retrieval 的基础 benchmark | search API | 语言覆盖、指标、是否适合内部 multilingual baseline |

## 3. 当前 registry 收录类别

### 3.1 直接 live web / search tool

这类最接近未来 AI/Agent search API 的真实使用方式。

- FACTS Search
- BrowseComp
- BrowseComp-ZH
- LiveNewsBench
- AssistantBench
- WideSearch
- DeepSearchQA

重点能力：

- query formulation
- multi-hop search
- freshness
- source discovery
- evidence verification
- citation support
- broad recall / completeness

### 3.2 固定 corpus 但 search 仍是关键组件

这类不是开放 web，但非常适合未来自动跑，因为可复现、可控、成本低。

- BrowseComp-Plus
- XBCP / Cross-lingual BrowseComp-Plus
- FutureSearch Deep Research Bench / RetroSearch
- BEIR
- MTEB Retrieval
- MS MARCO
- TREC Deep Learning Track
- MIRACL
- NeuCLIR
- Mr. TyDi
- MultiHop-RAG

重点能力：

- retriever / reranker 质量
- evidence recall
- cross-lingual retrieval
- fixed corpus reproducibility
- search call efficiency
- retrieval 与 agent reasoning 的拆分

### 3.3 Agentic browsing / web navigation

这类更偏 agent 产品，但对 search+content 也有启发，因为 agent 不只需要 SERP，还需要网页正文、子页面、状态和操作结果。

- GAIA
- WebArena
- WebWalkerQA
- AssistantBench
- SGR-Bench

重点能力：

- source discovery
- site navigation
- in-site search
- link traversal
- filter/scope setting
- structured extraction

### 3.4 Deep / wide search agent

这类更接近“agent search 产品”而不是单纯 API。

- DeepResearch Bench
- Deep Research Bench / RetroSearch
- DeepSearchQA
- WideSearch
- AutoResearchBench

重点能力：

- long-horizon search planning
- source collection
- comprehensive coverage
- citation trustworthiness
- report / table generation
- trace-level failure analysis

### 3.5 Agent / tool discovery

这类直接对应未来的 agent search。

- AgentSearchBench
- AgentSelect

重点能力：

- task-to-agent retrieval
- capability matching
- reranking
- execution-grounded relevance
- long-tail agent/tool discovery
- marketplace transfer

### 3.6 行为数据 / 偏好数据

这类不一定适合评估 search API，但适合理解产品需求。

- Search Arena

重点能力：

- 用户真实 query intent
- citation 数量和质量如何影响偏好
- source credibility
- search-augmented response style
- multilingual usage分布

### 3.7 Vendor / analyst benchmark

这类可收录，但必须打 tag，不应和学术 benchmark 混为一谈。

- AIMultiple Agentic Search API Benchmark
- Parallel Quality Benchmarks / SealQA references
- Brave / Firecrawl / Exa / Tavily 等厂商比较文章后续可继续补充

使用方式：

- 适合做市场情报。
- 适合观察厂商怎么包装指标。
- 不适合未经审计就作为技术结论。

## 4. 数据库和前端设计建议

后续要做成前端，建议不要只存一张大 markdown 或一个大 JSON。可以先用 JSON 启动，但数据库最好按这些实体拆：

### 4.1 `benchmarks`

存 benchmark 主体。

建议字段：

- `id`
- `name`
- `year`
- `maintaining_org`
- `summary_zh`
- `research_stage`
- `verification_state`
- `benchmark_families`
- `product_relevance`
- `source_type_tags`
- `homepage_url`
- `paper_url`
- `github_url`
- `dataset_url`
- `leaderboard_url`
- `created_at`
- `updated_at`

### 4.2 `benchmark_datasets`

存数据集情况，方便前端筛选。

建议字段：

- `benchmark_id`
- `size_text`
- `num_tasks`
- `num_documents`
- `languages`
- `corpus_type`
- `live_web`
- `public_data_status`
- `license`
- `split_info`
- `update_pattern`

### 4.3 `search_dependencies`

这是最关键的表，不要埋在描述里。

建议字段：

- `benchmark_id`
- `dependency_mode`
- `search_must_affect_score`
- `replaceable_search_api`
- `search_output_expected`
- `where_search_enters_pipeline`
- `known_search_provider`
- `notes`

### 4.4 `task_designs`

存 benchmark 的任务模式。

建议字段：

- `benchmark_id`
- `input_format`
- `process_description`
- `output_format`
- `search_pattern`
- `requires_browsing`
- `requires_content_extraction`
- `requires_structured_output`
- `requires_citation`

### 4.5 `evaluation_methods`

存指标和评分方式。

建议字段：

- `benchmark_id`
- `metrics`
- `judge_type`
- `uses_llm_judge`
- `uses_human_judgment`
- `has_hidden_split`
- `has_leaderboard`
- `reproducibility_notes`

### 4.6 `sources`

存所有来源链接，方便每周刷新。

建议字段：

- `benchmark_id`
- `source_type`
- `url`
- `title`
- `last_checked_at`
- `last_changed_at`
- `http_status`
- `content_hash`

### 4.7 `update_events`

存每周自动更新的 diff。

建议字段：

- `benchmark_id`
- `checked_at`
- `change_type`
- `field_changed`
- `old_value`
- `new_value`
- `requires_human_review`

### 4.8 `candidate_benchmarks`

自动发现的新 benchmark 先进入候选池。

建议字段：

- `name`
- `discovered_from`
- `candidate_url`
- `matched_keywords`
- `reason_for_candidate`
- `triage_status`
- `reviewer_notes`

## 5. 每周自动更新机制草案

### 5.1 自动发现

数据源：

- arXiv 搜索：`web search benchmark`, `agentic search`, `deep search agent`, `retrieval agent`, `agent search benchmark`, `multilingual retrieval benchmark`
- Hugging Face datasets / papers
- GitHub repositories
- Kaggle Benchmarks
- OpenReview
- Papers with Code / leaderboards
- 厂商 blog：Parallel, Exa, Tavily, Brave, Firecrawl, You.com, Perplexity, Valyu 等

自动发现输出：

- 新 candidate
- 已知 benchmark 的新论文版本
- 新 leaderboard
- 新 dataset release
- 新代码仓库

### 5.2 自动刷新

每周对 tracked benchmarks 做：

- URL 是否可访问。
- GitHub stars / latest commit / release 是否变化。
- Hugging Face dataset card 是否变化。
- Kaggle leaderboard 是否有新条目。
- arXiv 是否有新 version。
- 论文是否被 ACL/OpenReview/会议正式接收。
- 是否出现扩展版，例如 BrowseComp-Plus -> XBCP。

### 5.3 人工审核

自动发现不能直接进入正式库。建议状态流：

`candidate -> triaged -> needs_deep_audit -> verified -> tracked`

如果只是市场文章：

`candidate -> vendor_watchlist`

如果 search 其实不影响评分：

`candidate -> rejected_not_search_dependent`

### 5.4 自动跑 benchmark

后续可以分三层做：

1. **Retrieval-only**：BEIR、MTEB、MIRACL、MS MARCO、BrowseComp-Plus。
2. **Search+answer**：FACTS Search、LiveNewsBench、FRAMES、MultiHop-RAG。
3. **Agentic workflow**：BrowseComp、WideSearch、DeepSearchQA、AgentSearchBench、SGR-Bench。

建议先自动跑第 1 层，因为稳定、便宜、可复现。第 2 层需要统一 answer judge。第 3 层需要 agent harness、预算控制、trace logging。

## 6. 第一阶段深度审计建议

不要一次深挖 30 个。建议第一阶段只审 8 个：

1. FACTS Search
2. BrowseComp
3. LiveNewsBench
4. BrowseComp-Plus
5. WideSearch
6. DeepSearchQA
7. AgentSearchBench
8. MIRACL 或 NeuCLIR

每个 benchmark 审计模板：

- 论文精读摘要
- 数据集字段
- 数据规模
- 语言覆盖
- search 介入点
- 是否能替换为自家 search API
- 是否能自动跑
- 评分指标
- judge 机制
- 复现成本
- license / 使用限制
- 对三个产品线的启发
- 需要团队进一步验证的问题

## 7. 当前版本的主要风险

1. 有些 2026 benchmark 很新，数据/代码可能尚未完全释放。
2. Kaggle Benchmarks 的完整评测协议可能需要账号和提交流程确认。
3. 厂商 benchmark 可能有营销偏差，不能与学术 benchmark 等权。
4. Live web benchmark 存在网页漂移和污染风险。
5. 固定 corpus benchmark 虽然可复现，但可能不能代表真实开放 web search。
6. Search Arena 这类数据更偏行为分析，不是直接的 search API 评测。

## 8. 当前文件和下一步

当前文件：

- [benchmark_registry.json](/Users/zhanghaoxin/Documents/agent-search/benchmark-research/benchmark_registry.json)
- [benchmark_report.md](/Users/zhanghaoxin/Documents/agent-search/benchmark-research/benchmark_report.md)

下一步建议：

1. 先把 registry 导入一个简单前端或表格视图，验证字段是否好筛选。
2. 选 8 个高优先级 benchmark 做 deep audit。
3. 为每个 benchmark 增加 `verification_state` 和 `audit_notes`。
4. 再开始设计每周自动抓取任务。
5. 最后接自动跑 benchmark 的 eval harness。

## 9. 关键来源索引

- FACTS Search: https://www.kaggle.com/benchmarks/google/facts-search
- FACTS paper: https://arxiv.org/abs/2512.10791
- BrowseComp: https://openai.com/index/browsecomp/
- BrowseComp paper: https://arxiv.org/abs/2504.12516
- BrowseComp-ZH: https://arxiv.org/abs/2504.19314
- LiveNewsBench: https://livenewsbench.com/
- Search Arena: https://github.com/lmarena/search-arena
- BrowseComp-Plus: https://github.com/texttron/BrowseComp-Plus
- XBCP: https://arxiv.org/abs/2606.15345
- AssistantBench: https://assistantbench.github.io/
- GAIA: https://arxiv.org/abs/2311.12983
- WebArena: https://webarena.dev/
- WebWalkerQA: https://arxiv.org/abs/2501.07572
- WideSearch: https://widesearch-seed.github.io/
- SGR-Bench: https://arxiv.org/abs/2605.22219
- DeepSearchQA: https://www.kaggle.com/benchmarks/google/dsqa
- DeepResearch Bench: https://deepresearch-bench.github.io/
- FutureSearch Deep Research Bench: https://futuresearch.ai/deep-research-bench/
- AgentSearchBench: https://bingo-w.github.io/AgentSearchBench/
- AgentSelect: https://arxiv.org/abs/2603.03761
- AutoResearchBench: https://github.com/CherYou/AutoResearchBench
- BEIR: https://github.com/beir-cellar/beir
- MTEB: https://huggingface.co/spaces/mteb/leaderboard
- MS MARCO: https://microsoft.github.io/msmarco/
- TREC Deep Learning Track: https://microsoft.github.io/msmarco/TREC-Deep-Learning.html
- MIRACL: https://project-miracl.github.io/
- NeuCLIR: https://neuclir.github.io/
- Mr. TyDi: https://github.com/castorini/mr.tydi
- FRAMES: https://huggingface.co/datasets/google/frames-benchmark
- MultiHop-RAG: https://github.com/yixuantt/MultiHop-RAG/
