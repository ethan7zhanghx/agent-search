# Search / Agent Search Benchmark 深度审计 v1

生成日期：2026-07-09  
语言：中文报告，字段设计保留英文 key  
定位：第一版深度审计，不是最终全集；重点验证 benchmark 是否真的让 search / retrieval / browsing / agent discovery 影响得分。

配套文件：

- 初始 registry：[benchmark_registry.json](benchmark-research/benchmark_registry.json)
- 初始地图报告：[benchmark_report.md](benchmark-research/benchmark_report.md)

## 1. 先给结论

这次深度审计后，我建议团队不要把所有 “RAG / QA / Deep Research” benchmark 混在一起看。对我们的产品路线，最关键的是把 benchmark 按 **search 在评估中的真实介入方式** 拆开：

| 类型 | 代表 benchmark | 对我们的意义 |
|---|---|---|
| live web search / browsing | FACTS Search, BrowseComp, LiveNewsBench, DeepSearchQA | 最接近真实 Search API + agent 调用，但 attribution 比较难：模型、搜索器、浏览策略会混在一起 |
| fixed corpus search | BrowseComp-Plus, MIRACL, NeuCLIR, Mr.TyDi, BEIR/MS MARCO | 最适合自动化和可复现；可以更干净地评估 retriever/search API 的价值 |
| broad information seeking | WideSearch | 测“找全并结构化”，不是只测 top result；对 search+content 和 agent search 很重要 |
| state-gated retrieval | SGR-Bench | 测 agent 是否能进入正确网站状态、筛选条件、时间窗口和表格范围 |
| agent discovery / agent search | AgentSearchBench | 不是搜网页，而是“任务 -> 合适 agent”的检索/重排，直接对应未来 agent search |
| preference / trace dataset | Search Arena | 不适合直接评估我们的 API，但对用户意图、引用行为、多语言 search-LLM 体验很有价值 |

一个重要边界：很多 search-augmented LLM benchmark 只是在数据构造阶段用了搜索，或者把 evidence 直接给了模型。这类不能算直接评估 search API。它们可以作为评估设计参考，但不应该进入我们的核心榜单。

## 2. 推荐优先级

如果团队后续要把这件事做成可持续系统，我建议第一批深挖和自动化围绕这几类：

| 优先级 | Benchmark | 适合产品线 | 为什么先做 |
|---|---|---|---|
| P0 | BrowseComp-Plus | search API, search+content, agent search | 固定 corpus + qrels + 可替换 retriever，最适合隔离 search/retrieval 贡献 |
| P0 | LiveNewsBench | search API, search+content, agent search | 明确记录 search/click/trajectory，新鲜新闻，官方支持持续 release |
| P0 | MIRACL / NeuCLIR | search API | 多语言/跨语言检索的基础盘，适合建立 multilingual search baseline |
| P1 | BrowseComp | search+content, agent search | 高难开放网页搜索题，影响力大，但需要自己封装 agent 和搜索工具 |
| P1 | WideSearch | search+content, agent search | 测大范围信息收集、表格完整性、中文/英文各半 |
| P1 | SGR-Bench | search+content, agent search | 专门覆盖 stateful website retrieval，和普通 SERP 评测互补 |
| P1 | AgentSearchBench | agent search | 直接定义 agent search 检索/重排，但 test labels 隐藏，自动复现要谨慎 |
| P2 | FACTS Search | search API, search+content | 官方 leaderboard 固定 Brave Search API；对内部协议设计很有价值 |
| P2 | DeepSearchQA | search+content, agent search | 题目质量好，强调 exhaustive answer set；但 outcome-only，难拆 search API 贡献 |
| P2 | Search Arena | product research | 大规模真实 search-LLM traces 和偏好票，但不是可直接跑分的 API benchmark |

## 3. 深度卡片

### 3.1 FACTS Search

来源：

- 论文：[The FACTS Leaderboard](https://arxiv.org/html/2512.10791v1)
- Leaderboard：[Kaggle FACTS Search](https://www.kaggle.com/benchmarks/google/facts-search)
- Public examples：[Kaggle FACTS Search Public](https://www.kaggle.com/datasets/deepmind/facts-search-public)

已核验事实：

- 目标是评估模型 **使用搜索工具回答事实问题** 的能力，而不是只评估 parametric knowledge。
- 官方 leaderboard 为所有模型固定同一个搜索工具：Brave Search API。模型触发 tool call 后，搜索结果会追加到上下文。
- 数据构造包含 Hard Tail、Wiki Two-Hop、Wiki Multi-Doc、KG Hops 四类；论文给出的 final dataset size 分别是 328、932、268、356，总计 1884。
- 题目经过正确性、唯一性、五年内答案稳定性的人类核验；还过滤掉无搜索模型能答对的问题。
- 指标包括 F1、Accuracy、Attempted accuracy、Hedging rate、Average searches；回答正确性由自动 judge 判定。

Search 介入点：

- 这是强 search benchmark。搜索 API 在评估时真实参与，且 average searches 是显式指标。
- 官方榜单不能直接替换成我们的搜索 API，因为它为公平性固定 Brave。我们的可行方式是复刻协议，内部替换 search provider。

适合我们的用法：

- 作为 `search_api` 的内部 factual QA eval：同一批题、同一 agent policy，替换不同 search provider，比较 accuracy、attempt rate、search count。
- 作为 `search+content` 的内容抽取 eval：让 API 返回结果 + snippets / processed content，再看 agent 是否更少搜索、更高准确。

自动化可行性：

- Leaderboard 追踪：中等，Kaggle 页面可能需要专门抓取或人工 token。
- 内部跑分：中等，需要拿到题目访问权限、实现 Brave-like tool schema、接入 judge。

风险：

- 官方评价绑定 Brave，不能把官方排名直接解释为“某搜索 API 更好”。
- 自动 judge 会把模型表达、hedging、答案抽取一起混进分数。

### 3.2 BrowseComp

来源：

- OpenAI 介绍：[BrowseComp](https://openai.com/index/browsecomp/)
- 论文：[BrowseComp: A Simple Yet Challenging Benchmark for Browsing Agents](https://arxiv.org/html/2504.12516v1)
- 代码：[openai/simple-evals](https://github.com/openai/simple-evals)
- 数据 CSV：[browse_comp_test_set.csv](https://openaipublic.blob.core.windows.net/simple-evals/browse_comp_test_set.csv)

已核验事实：

- public CSV 有 1266 行，字段为 `problem`, `answer`, `problem_topic`, `canary`。
- 题目与答案在 CSV 中经过 canary-based 加密，simple-evals 代码会在运行时解密。
- 官方评估要求模型输出 explanation、exact answer、confidence，再用 grader 比较 final answer 和 gold answer。
- 主题分布中，TV/movies、science/technology、history、sports、music 等占比较高。
- 论文明确 BrowseComp 是给有互联网访问能力的模型/agent 设计的，关注 hard-to-find、deeply entangled web information。

Search 介入点：

- 搜索/浏览对得分高度重要，但 simple-evals 本身不规定搜索 API，也不记录搜索轨迹。
- 这意味着它非常适合评估 agent 整体能力，但不适合原样评估 search API 的独立贡献。

适合我们的用法：

- 作为 `agent_search` 或 `search+content` 的高难开放网页搜索套件。
- 内部跑的时候必须封装统一 agent harness，记录 query、SERP、click、page content、答案。
- 如果只换 search API，不固定 agent 策略，结论会不稳定。

自动化可行性：

- 数据下载和 simple eval 读取：高。
- 公平自动跑：中等，需要自建 browsing/search harness。
- 完整跑分成本：中到高，因为题目需要多轮搜索，且可能受网页漂移影响。

样本形态：

- 样本通常不是普通问答，而是多约束 clue chain，例如“某人物/作品/事件满足若干间接条件，问一个短答案”。报告中不展开 public CSV 的完整解密题目，避免把 benchmark 题目内容不必要地扩散。

### 3.3 LiveNewsBench

来源：

- 论文：[LiveNewsBench](https://arxiv.org/abs/2602.13543)
- 代码和数据：[GitHub LiveNewsBench](https://github.com/LiveNewsBench/LiveNewsBench)
- 官网：[livenewsbench.com](https://livenewsbench.com/)

已核验事实：

- 数据按 release 存放，当前仓库中有 2025-09 release 和 2026-01 release。
- README 承诺未来两年按季度更新，用新鲜新闻保持题目领先于模型训练截止时间。
- 每个 release 拆成 `train.jsonl`, `val.jsonl`, `test.jsonl`, `human_verified_test.jsonl`。
- JSONL 核心字段包括 `link`, `event_date`, `question`, `answer`；评估输出要求追加 `search_final_answer`, `task_history`, `used_searches`, `used_clicks`。
- 默认限制为最多 5 次搜索和 5 次点击/全文访问；需要屏蔽原始 `link` 域名和 Internet archive，避免数据泄露。
- 官方提供无搜索 baseline、Anthropic/Perplexity/xAI 官方搜索 API eval、以及默认 deep research single agent。
- 评分脚本采用类似 SimpleQA 的 prompt，用 GPT-4.1 判断回答是否正确。

数据抽样：

- 2026-01 release：train 612、val 171、test 346、human_verified_test 200。
- human verified 测试集样本覆盖政治选举、武装冲突、法律犯罪、国际关系、商业经济等新闻类目。

Search 介入点：

- 非常强。它不仅要求最终答案，还要求搜索次数、点击次数和完整 task history。
- 它能直接观察 search API 是否帮助 agent 更少搜索、更少点击、更高准确率。

适合我们的用法：

- `search_api`：替换默认 search tool，比较同一 agent 下的 accuracy / search count / click count。
- `search+content`：比较只给 snippet、给 raw content、给 processed content 的差异。
- `agent_search`：比较不同 agent planning policy 在同一 search API 下的表现。

自动化可行性：

- Metadata 周更：高，GitHub 文件结构清晰。
- 内部 smoke run：高，200 条 human verified split 比较适合先跑。
- 全量持续跑：中等，依赖模型和搜索 API 成本。

### 3.4 BrowseComp-Plus

来源：

- 代码：[texttron/BrowseComp-Plus](https://github.com/texttron/BrowseComp-Plus)
- Dataset：[Tevatron/browsecomp-plus](https://huggingface.co/datasets/Tevatron/browsecomp-plus)
- Corpus：[Tevatron/browsecomp-plus-corpus](https://huggingface.co/datasets/Tevatron/browsecomp-plus-corpus)
- Paper：[arXiv 2508.06600](https://arxiv.org/pdf/2508.06600)

已核验事实：

- 它从 BrowseComp 引入 reasoning-intensive queries，但不搜 live web，而是在约 100K human-verified fixed corpus 上评估。
- 数据下载后可生成 decrypted JSONL 和 `topics-qrels/queries.tsv`；corpus 不加密。
- Agent 输出格式要求包含 `query_id`, `tool_call_counts`, `status`, `retrieved_docids`, `result`。
- 评估脚本使用 Qwen3-32B 作为 judge，输出 Accuracy、Recall、avg tool stats、Calibration Error、per-query metrics。
- 同时支持 retrieval-only 评估：用 TREC run file 对 `qrel_evidence` 和 `qrel_golds` 计算 recall@5/100/1000、nDCG@10。
- 工具层有 `search(query)` 和 `get_document(docid)`，可自定义 retriever。

Search 介入点：

- 这是目前最适合隔离 search/retriever 价值的 benchmark 之一。
- 固定 corpus 去掉了 live web 漂移，qrels 可以直接评估检索召回，agent answer 可以评估最终任务完成。

适合我们的用法：

- 第一阶段只跑 retrieval-only：把我们的 index / retriever 接成 TREC run，快速得到 recall/nDCG。
- 第二阶段跑 agent：同一 LLM agent + 不同 retriever，比较最终 Accuracy、Recall、search tool calls。
- 第三阶段加入 content processing：比较 `snippet_max_tokens`、全文、摘要、结构化抽取对最终答案的影响。

自动化可行性：

- Retrieval-only：高。
- Agent run：中等到高，取决于 GPU/judge 和 LLM API 成本。
- Leaderboard 同步：中等，HF Space / README / 手工提交流程都要跟踪。

### 3.5 WideSearch

来源：

- 论文：[WideSearch](https://arxiv.org/html/2508.07999v1)
- 代码：[ByteDance-Seed/WideSearch](https://github.com/ByteDance-Seed/WideSearch)
- Dataset：[ByteDance-Seed/WideSearch](https://huggingface.co/datasets/ByteDance-Seed/WideSearch)

已核验事实：

- 数据集 200 题，英文 100、中文 100。
- 任务要求系统性收集大量原子信息，并组织成结构化表格。
- GitHub README 要求在 `src/agent/tools.py` 中实现 custom search tools。
- 官方评估代码会解析 agent 输出表格，检查 required columns、unique columns、重复行，并计算 strict table-level score、row-level precision/recall/F1、item-level precision/recall/F1。
- 支持 exact match、URL match、number/date near、LLM judge 等列级 metric。

样本形态：

- `ws_en_001` 要求收集 2025 QS 学科榜相关大学及排名、官网、申请截止、费用等字段，答案是多行表格。
- `ws_en_002` 要求收集酒类品牌的核心产品组合，输出品牌、产品、类别、包装、ABV 等字段。
- `ws_en_003` 要求整理运动员在指定时间范围内的官方比赛成绩。

Search 介入点：

- 非常强，但它测试的是 “wide recall + structure fidelity”，不是单条答案。
- search API 的召回广度、去重、网页内容抽取、表格/列表处理都会影响最终得分。

适合我们的用法：

- `search_api`：测试大规模 broad query 分解、覆盖率和去重。
- `search+content`：测试网页正文抽取、结构化字段抽取、表格合并。
- `agent_search`：测试多 agent 分治和任务拆解。

自动化可行性：

- 数据和 gold CSV 可直接下载：高。
- 完整跑分：中等，需要 agent 输出稳定表格。
- 中文/英文对比：高价值，特别适合我们多语言产品线。

### 3.6 DeepSearchQA

来源：

- Paper：[DeepSearchQA: Bridging the Comprehensiveness Gap](https://arxiv.org/html/2601.20975v1)
- Dataset：[google/deepsearchqa](https://huggingface.co/datasets/google/deepsearchqa)
- Leaderboard：[Kaggle DSQA](https://www.kaggle.com/benchmarks/google/dsqa)

已核验事实：

- 900 个 prompt，覆盖 17 个领域。
- 数据字段为 `problem`, `problem_category`, `answer`, `answer_type`。
- 抽样统计：584 个 Set Answer，316 个 Single Answer。
- 领域分布中 Politics & Government、Finance & Economics、Geography、Education、Health、Science 占比较高。
- 题目强调 causal chain、long-horizon planning、fragmented information collation、dedup/entity resolution、stopping criteria。
- 论文主要用 outcome-based evaluation，核心指标强调 F1、precision、recall；这有利于比较最终结果，但不利于定位 agent 搜索过程错误。

样本形态：

- 样本可能要求先筛选国家/组织/人物集合，再根据第二个数据源过滤，最后输出一个或多个实体。
- 有些答案是单一实体，有些是完整集合，集合题会暴露 under-retrieval 和 over-retrieval。

Search 介入点：

- 强，因为题目设计就是 open-web multi-step search。
- 但官方数据没有强制记录 search trace，因此对 search API 的独立归因弱于 LiveNewsBench 和 BrowseComp-Plus。

适合我们的用法：

- 作为 `agent_search` / `search+content` 的 comprehensiveness eval。
- 如果用于比较 search API，必须使用统一 agent harness，记录搜索轨迹、候选集合扩展、停止条件。

自动化可行性：

- 数据抓取：高。
- 跑分：中等，需要 judge 或 Kaggle benchmark。
- Attribution：中低，需要自建日志。

### 3.7 SGR-Bench

来源：

- Paper：[SGR-Bench](https://arxiv.org/html/2605.22219v1)
- Dataset：[PKUAIWeb/SGR-BENCH](https://huggingface.co/datasets/PKUAIWeb/SGR-BENCH)

已核验事实：

- 目标是评估 State-Gated Retrieval：答案证据不在网站默认状态下出现，agent 必须配置站内筛选、视图、层级、范围、时间窗口或结果页。
- 数据包含 100 个 aligned task records，分成 `goal` 与 `constraint` 两种表述；两个 split 按 `task_id` 对齐。
- HF 上有英文和中文 per-task JSON 文件：`data_en/goal`, `data_en/constraint`, `data_zh/goal`, `data_zh/constraint`。
- 当前 loadable JSONL split：`goal_hf.jsonl` 50 行、`constraint_hf.jsonl` 50 行。
- 输出统一为 ordered-table style structured outputs。
- 论文指标包括 item-level F1、row-level F1、pairwise order accuracy。
- 论文指出主要错误不是找不到源，而是 retrieval-scope drift 和 criterion mismatch。

样本形态：

- `census_001` 要求在 Census 数据站点中选择正确 ACS 五年估计、州/县级范围、多张表和全州 baseline，再筛选符合条件的县并输出结构化结果。
- 中文文件与英文文件对齐，适合做同一任务的跨语言 prompt 对比。

Search 介入点：

- 这是 agentic retrieval 的强 benchmark。它不只测 search query，而是测“进入正确网站状态并保持约束”。
- 对传统搜索 API 来说，它会暴露 content API、browser/session、表格解析、站内检索能力的缺口。

适合我们的用法：

- `search+content`：测试页面读取、表格抽取、过滤条件保持。
- `agent_search`：测试 browser agent 操作策略。
- 不建议作为纯 search API 第一优先级，因为它需要网页状态和交互。

自动化可行性：

- Metadata 和样本抓取：高。
- 单 case runner：中等，需配置网页访问和操作协议。
- 全量跑分：中等到高，取决于 browser/MCP 环境稳定性。

### 3.8 AgentSearchBench

来源：

- Project：[AgentSearchBench](https://bingo-w.github.io/AgentSearchBench/)
- Paper：[arXiv 2604.22436](https://arxiv.org/html/2604.22436v1)
- Code：[Bingo-W/AgentSearchBench](https://github.com/Bingo-W/AgentSearchBench)
- Datasets：[AgentSearchBench-Tasks](https://huggingface.co/datasets/AgentSearch/AgentSearchBench-Tasks), [Agents](https://huggingface.co/datasets/AgentSearch/AgentSearchBench-Agents), [Responses](https://huggingface.co/datasets/AgentSearch/AgentSearchBench-Responses)

已核验事实：

- 这是目前最直接命中 “agent search” 命题的 benchmark：给定任务，检索/重排合适的 AI agent。
- 数据来自 GPT Store、Google Cloud Marketplace、AgentAI Platform，约 9759 个 real-world agents。
- 官方 README 写明运行了 66K+ agent executions，生成 3.6K+ Task Query 和 324 Task Description。
- 数据 split：
  - Validation：3211，总计 2452 single-agent task query、500 multi-agent task query、259 task description。
  - Test：798，总计 633 single-agent、100 multi-agent、65 task description。
- test split 中 `labels` 和 `ranking_labels` 被 `?` 隐藏；validation split 可看到 ref agents 和 label/ranking label。
- Leaderboard 指标包括 NDCG@5/@20、Precision@20、Recall@20、Completeness@5/@20。
- Probing 支持 GPT Store 和 AgentAI 可执行候选 agent。

样本形态：

- single-agent task query 可能是“为某企业场景生成合规 PIP 和 termination checklist”，标签是哪些 agent 真能完成这类任务。
- task description 更抽象，例如“加强法律与合规结果”，对应一组子任务和多个 reference agents。

Search 介入点：

- 不是 web search，而是 agent retrieval / agent reranking。
- 价值在于它把相关性定义为 execution-grounded performance，而不是 agent 描述文本相似度。

适合我们的用法：

- 未来 `agent_search` 产品的核心参考：query understanding、candidate generation、reranking、execution probing、completeness。
- 可以作为 agent marketplace / tool discovery 的 benchmark schema 模板。

自动化可行性：

- Retrieval/rerank 本地评估：中等，test labels 隐藏会限制完整复现。
- Validation experiments：高，可直接读 parquet。
- Probing：中等到高，依赖外部 agent 平台可访问性和 API keys。

### 3.9 MIRACL / NeuCLIR / Mr.TyDi

来源：

- MIRACL project：[project-miracl.github.io](https://project-miracl.github.io/)
- MIRACL paper：[TACL paper](https://aclanthology.org/2023.tacl-1.63/)
- MIRACL data：[miracl/miracl](https://huggingface.co/datasets/miracl/miracl)
- NeuCLIR：[neuclir.github.io](https://neuclir.github.io/)
- NeuCLIR 2024 data：[NIST TREC Browser](https://pages.nist.gov/trec-browser/trec33/neuclir/data/)
- Mr.TyDi：[castorini/mr.tydi](https://github.com/castorini/mr.tydi)

已核验事实：

- MIRACL 是 18 语言的 ad hoc retrieval 数据集，目标是同语言检索：query 和 corpus 使用同一语言。
- MIRACL 论文/官网描述其包含 78K queries、726K relevance judgments，基于 Wikipedia，native speaker annotation。
- HF 上可直接看到如 `miracl-v1.0-en/topics/topics.miracl-v1.0-en-dev.tsv` 和 `qrels/qrels.miracl-v1.0-en-dev.tsv`。
- NeuCLIR 2024 包含 CLIR、technical document retrieval、MLIR 和 report generation pilot；CLIR 是英文 query 检索中文/波斯语/俄语新闻，MLIR 是英文 query 在多语言文档池中排序。
- Mr.TyDi 覆盖 11 种语言，是基于 TyDi 的 monolingual dense retrieval benchmark。

样本形态：

- MIRACL 英文 dev topic 包括普通自然语言信息需求，例如“Is Creole a pidgin of French?”，qrels 给出相关 passage id 和相关性标签。
- NeuCLIR 的典型任务是英文 query 搜非英文 news corpus，特别适合测试跨语言 query understanding 和 multilingual ranking。

Search 介入点：

- 这是纯 retrieval benchmark，search/retrieval 本身就是被评估对象。
- 它不评估 live web、不评估 agent planning，但非常适合建立多语言 search API 基准。

适合我们的用法：

- `search_api` 的 multilingual baseline：BM25、dense、hybrid、reranker、query translation、cross-lingual retrieval。
- 为后续 agent benchmark 提供底层 retrieval regression suite。

自动化可行性：

- MIRACL / Mr.TyDi：高，数据结构成熟。
- NeuCLIR：中等，NIST/TREC 数据和 qrels 需要按任务下载和整理。

### 3.10 Search Arena

来源：

- Paper：[Search Arena](https://arxiv.org/html/2506.05334v1)
- Code：[lmarena/search-arena](https://github.com/lmarena/search-arena)
- Dataset：[lmarena-ai/search-arena-24k](https://huggingface.co/datasets/lmarena-ai/search-arena-24k)

已核验事实：

- 数据集包含 24,069 个真实 search-LLM 多轮 conversation，12,652 个 human preference votes。
- HF dataset card 写明数据覆盖约 11,000 用户、136 个国家、13 个公开模型、约 90 种语言，并包含 LLM + web search trace。
- 每条数据包含两侧模型 response、human vote、timestamp、system metadata、search trace、语言和用户意图标注。
- 论文强调 citation count、source type、reasoning、larger search context window、response length 等因素会影响用户偏好。

Search 介入点：

- 它不是可直接替换 search API 的 benchmark，而是 search-augmented LLM 真实交互和偏好数据集。
- 对我们最有价值的是产品洞察、citation 行为、用户意图、多语言 query 分布、偏好指标设计。

适合我们的用法：

- 训练/验证我们自己的 benchmark 分类器：什么用户需求真的需要 search。
- 设计前端 benchmark portal 的 “search behavior insights” 页面。
- 作为 citation quality / source attribution 研究的样本池。

自动化可行性：

- Metadata 周更：高。
- 跑分：不适合，因为它不是 gold-answer benchmark。

## 4. 真实样本摘要

这里记录样本形态，不把大段 benchmark 原题铺开。

| Benchmark | 样本来源 | 样本摘要 | 说明 |
|---|---|---|---|
| FACTS Search | 论文公开例子 | 多跳事实问题，要求通过人物、药物 ID 或 KG 路径定位唯一短答案 | 用于确认它不是 provided-evidence QA，而是 search-tool QA |
| BrowseComp | public CSV + simple-evals | 多约束线索链，答案是短字符串；CSV 加密，运行时解密 | 适合 agentic browsing，但原样不记录 search trace |
| LiveNewsBench | 2026-01 human_verified_test | 新闻事件事实组合题，例如选举席位、冲突事件、贸易关税 | 自带 `used_searches`, `used_clicks`, `task_history` 评估协议 |
| BrowseComp-Plus | qrels + README | query 对应 evidence docs 和 gold docs；agent 需返回 retrieved docids 和最终答案 | 同时支持 retrieval-only 和 agent end-to-end |
| WideSearch | `widesearch.jsonl` + gold CSV | 大规模表格收集，例如高校排名/申请信息、品牌产品组合、运动成绩 | 检验 wide recall、去重、结构化输出 |
| DeepSearchQA | `DSQA-full.csv` | 多步筛选题，答案可能是单一实体或集合 | outcome-only，适合综合能力，不利于过程归因 |
| SGR-Bench | HF per-task JSON | Census/Arxiv/NVD 等站点的状态化检索，要求固定输出 schema | 直接测 filter/view/scope 等站内状态 |
| AgentSearchBench | HF parquet validation | task -> candidate agents -> execution-grounded labels/ranking labels | 直接服务未来 agent search |
| MIRACL | HF topics/qrels | query + passage relevance labels | 适合 multilingual retrieval baseline |

## 5. 对数据库和前端的影响

不要只做一个 `benchmarks` 大 JSON。后续前端如果要可持续更新，至少要拆成这些实体：

| 表/集合 | 作用 | 关键字段 |
|---|---|---|
| `benchmarks` | benchmark 主体 | `id`, `name`, `family`, `status`, `product_tags`, `language_tags`, `official_url`, `primary_owner` |
| `benchmark_versions` | 数据/论文/leaderboard 版本 | `benchmark_id`, `version_label`, `release_date`, `source_commit`, `notes` |
| `sources` | 所有可追踪来源 | `benchmark_id`, `source_type`, `url`, `access_mode`, `last_checked_at`, `checksum`, `license` |
| `datasets` | 数据集级 metadata | `benchmark_id`, `host`, `path`, `row_count`, `file_size`, `schema_json`, `sample_policy` |
| `task_designs` | 题目设计模式 | `benchmark_id`, `task_type`, `answer_type`, `requires_live_web`, `requires_fixed_corpus`, `requires_browser_state`, `requires_agent_pool` |
| `search_dependencies` | search 介入方式 | `benchmark_id`, `mode`, `tool_schema`, `provider_fixed`, `retriever_replaceable`, `trace_required` |
| `evaluation_methods` | 评分协议 | `benchmark_id`, `metrics`, `judge_type`, `gold_type`, `supports_retrieval_only`, `supports_end_to_end` |
| `automation_jobs` | 周更/跑分任务 | `benchmark_id`, `job_type`, `cadence`, `runner_status`, `credential_requirements`, `last_run_status` |
| `runs` | 内部实验结果 | `benchmark_id`, `version_id`, `product_variant`, `agent_config`, `search_config`, `run_started_at`, `run_artifact_uri` |
| `run_metrics` | 指标明细 | `run_id`, `metric_name`, `metric_value`, `split`, `aggregation`, `notes` |
| `update_events` | 变更历史 | `benchmark_id`, `event_type`, `old_value`, `new_value`, `detected_at`, `human_review_status` |
| `candidate_benchmarks` | 新发现候选 | `name`, `url`, `discovery_query`, `reason`, `triage_status` |

几个字段必须从第一天保留：

- `search_dependency_mode`：不要以后靠文本描述猜。
- `retriever_replaceable`：能不能替换成我们的 API。
- `provider_fixed`：官方是否固定了搜索 provider，例如 FACTS Search 固定 Brave。
- `trace_required`：是否能/是否必须记录搜索轨迹。
- `gold_type`：short answer、set answer、qrels、table、preference vote、execution-grounded label。
- `automation_level`：`metadata_only`, `schema_sample`, `smoke_eval`, `full_eval`。
- `credential_requirements`：无、HF token、Kaggle token、OpenAI-compatible model、search API key、browser/session。
- `data_stability`：fixed corpus、quarterly release、live web drift、hidden test。

前端建议不要只有榜单。至少需要这些视图：

- Benchmark 列表：按 family、产品线、语言、是否 live web、是否可替换 retriever、是否可自动跑过滤。
- Benchmark 详情页：任务设计、数据结构、search 介入点、指标、来源、更新历史。
- Product fit matrix：一眼看出哪个 benchmark 服务 `search_api`、`search+content`、`agent_search`。
- Automation dashboard：哪些源本周变了，哪些 runner 失败，哪些需要人工复核。
- Evidence/sample view：只展示摘要样本，不默认泄露完整题目或隐藏测试信息。

## 6. 每周自动更新模式

建议把“每周自动刷新”拆成三层，避免把高成本 benchmark 全量跑死：

1. Metadata refresh，每周跑：
   - GitHub：README、commit、release、文件树。
   - Hugging Face：dataset card、tree API、文件 size、last modified、row count 抽样。
   - arXiv/OpenReview/ACL：paper version、标题、摘要、链接。
   - Kaggle/leaderboard：能抓则抓，不能稳定抓就进入人工 review queue。
   - 官网：页面 hash、leaderboard 更新时间、release note。

2. Schema/sample refresh，每周或双周跑：
   - 下载小文件或抽样 parquet/jsonl/csv。
   - 记录字段、row count、语言分布、answer type、split 变化。
   - 对大文件只抓 metadata 和前几行，不默认下载全量。

3. Evaluation runs，分层跑：
   - Smoke eval：小样本，每周或每两周，用来检查我们的 API 和 runner 是否坏。
   - Regression eval：固定 subset，每月跑，比较产品版本。
   - Full eval：季度或 release-triggered 跑，尤其是 LiveNewsBench 新 release、BrowseComp-Plus 新版本、内部重大 API 版本变更。

这意味着“每周更新”主要是更新数据库和状态，不等于每周全量 benchmark。

## 7. 当前不建议直接纳入核心榜的类型

| 类型 | 原因 | 仍然有什么价值 |
|---|---|---|
| provided-evidence QA | 搜索结果已经给模型，search API 不参与得分 | 学 judge、answer extraction、citation scoring |
| 普通 RAG QA | 常评估 reader/generator，不一定评估 retrieval | 可学习 retrieval+generation 分离指标 |
| web navigation sandbox | 常是封闭网站操作，不是搜索 | 对 browser agent 和 state handling 有启发 |
| deep research report 质量榜 | 常测长报告写作和专家评分 | 对 `agent_search` 高阶产品有启发，但 attribution 更难 |
| analyst/vendor benchmark | 来源不透明、数据不可复现 | 用作市场情报，不作为内部 eval 主轴 |

## 8. 下一步建议

我建议下一轮不要继续横向扩名字，而是进入“可跑通最小闭环”：

1. 选 3 个 P0：
   - BrowseComp-Plus retrieval-only
   - LiveNewsBench human_verified_test smoke run
   - MIRACL 或 Mr.TyDi multilingual retrieval baseline

2. 为每个 P0 建一个 runner spec：
   - 输入数据如何取
   - 搜索 API 如何接入
   - 输出格式如何规范化
   - 指标如何计算
   - 需要什么 credentials
   - 预计成本和耗时

3. 把 registry schema 固化成数据库 migration：
   - 先支持 metadata + benchmark cards + update events。
   - 之后再加 run / metrics / artifacts。

4. 为前端先做 internal benchmark portal：
   - 先展示 benchmark research，不急着展示跑分。
   - 跑分接入后再展示趋势、版本对比和错误样本。

## 9. 本轮仍未完成

- 没有完整跑任何 benchmark，只做了官方来源、数据文件、代码路径和样本结构审计。
- 没有核查所有 license 的商业使用边界。
- Kaggle benchmark 的 API/提交流程还需要专项确认。
- BrowseComp-Plus 的完整 corpus 没有下载，只核验了 README、qrels、评估脚本和 HF 文件结构。
- Search Arena 的 400MB parquet 没有下载，只核验了 dataset card 和文件 metadata。
- NeuCLIR 没有下载完整 NIST corpus，只核验了官方任务定义和数据入口。

这个状态适合团队讨论“哪些 benchmark 值得进入自动化路线”，还不适合作为最终 benchmark catalog 发布。
