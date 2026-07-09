# Benchmark Portal 前端范围 v1

生成日期：2026-07-09

## 1. 纠正上一版说法

“数据模型验证”这个说法不适合放到团队内部前端规划里。它只是开发侧含义：用现有 JSON 作为样例数据，确认列表页、详情页、筛选项需要的字段是否足够。对最终前端读者不需要出现这个概念。

“Runner 规划页”也不进入前端。Runner spec 是后台开发材料，不适合给普通团队读者看。

## 2. 当前可以开始做什么

现在可以做一个面向团队读者的 v0 前端，目标是：

- 查 benchmark。
- 看 benchmark 的客观数据结构。
- 看 search / retrieval / browsing / agent search 在 benchmark 中的作用。
- 看公开 leaderboard / score 快照。
- 看 Tavily、Exa、Brave 等竞品出现在哪些 benchmark、结果页或比较文章中。
- 看每条信息的来源和来源类型。

这不是自动化监控平台，也不是我们自己 API 的跑分平台。

## 3. v0 页面范围

### 3.1 Benchmark Catalog

列表页，展示所有 benchmark 的客观信息。

主要字段：

- 名称
- family
- search protocol：live web、fixed corpus、browser navigation、state-gated site、agent pool、trace dataset
- 数据访问方式
- 语言
- gold type：answer key、qrels、structured table、human vote、execution-grounded label
- 是否有公开 labels
- 是否有 qrels
- 是否有 search traces
- 是否有公开 leaderboard
- 来源数量

筛选项：

- benchmark family
- search protocol
- language
- gold type
- has qrels
- has public labels
- has traces
- has public leaderboard
- source host：GitHub、HF、Kaggle、arXiv、NIST、官网

### 3.2 Benchmark Detail

详情页只放事实。

模块：

- Overview：名称、维护方、简介、来源。
- Dataset：split、记录数、字段、语言、label/qrel/trace 状态。
- Task Design：输入类型、输出类型、gold 类型、是否多跳、是否要求找全、是否结构化。
- Search Protocol：search 是否在评估时参与、是否固定 provider、是否可替换 retriever、是否记录搜索/点击/工具调用。
- Evaluation：指标、judge 类型、评估脚本、leaderboard。
- Sources：所有来源链接、来源类型、最近检查状态。

### 3.3 Public Leaderboard / Score Snapshots

展示公开结果，不展示我们自己的 API。

当前可以收录的结果源：

- LiveNewsBench：GitHub/官网中的模型结果，包含 accuracy、used searches、used clicks、是否 official search API。
- BrowseComp-Plus：HF Space 的 `data/leaderboard.json`，包含 LLM、Retriever、Accuracy、Recall、Search Calls、Calibration Error。
- AgentSearchBench：README / project page 中的 retrieval/reranking leaderboard 表。
- FACTS Search：Kaggle leaderboard 页面可作为来源入口，但结构化抓取方式待确认。
- SimpleQA 相关搜索 API 对比：Tavily、Exa、Brave 等厂商或第三方公开结果，需标注来源独立性。
- Agentic Search API 对比：AIMultiple 等第三方页面中 Tavily、Exa、Brave 的公开结果。

这个页面的名称建议叫：

- `公开结果`
- `Public Results`
- `Leaderboard Snapshots`

暂时不要叫“趋势”。只有做了多期自动抓取后，才展示趋势。

### 3.4 Competitor Visibility

这是一个单独页面或 tab，重点跟踪 Tavily、Exa、Brave 等竞品在 benchmark 生态中的出现方式。

核心字段：

- provider：Tavily / Exa / Brave / Parallel / Perplexity / etc.
- benchmark_or_eval：SimpleQA、FACTS Search、AIMultiple Agentic Search、BrowseComp-Plus、LiveNewsBench 等。
- role：
  - `fixed_search_provider`
  - `evaluated_provider`
  - `supported_provider_in_eval_framework`
  - `official_search_api_baseline`
  - `vendor_claim`
  - `third_party_comparison`
- score_metric
- score_value
- result_context
- source_url
- source_type：official benchmark、vendor-published、third-party article、GitHub repo。
- independent_verification：yes/no/unknown。

前端要明确区分：

- 官方 benchmark leaderboard。
- 第三方比较文章。
- 竞品自己发布的 benchmark。
- 只是在代码/框架中支持该 provider。

### 3.5 Attached Sources / Evidence

来源不作为一级页面，而是作为每个页面中的附加信息出现。

展示位置：

- Benchmark detail 页：挂在 benchmark、dataset、evaluation、search protocol 各模块下。
- Public Results 页：挂在每张公开结果表或每条 score snapshot 下。
- Competitor Visibility 页：挂在每条 competitor appearance 下。

展示字段：

- source URL
- source type
- host
- access mode
- 是否结构化可抓
- 是否需要 token
- source independence：official benchmark、third-party、vendor-published、code repository
- 最近检查时间

## 4. 暂时不做

### 4.1 Runner 规划页

不做。普通读者不需要知道怎么开发 runner。

### 4.2 我们自己的 API 跑分趋势页

暂时不做。等内部 API 有稳定 run results 后再加。

### 4.3 自动化监控 dashboard

后续再说。现在 runner 方案还没有落地，不需要提前做 dashboard。

### 4.4 团队结论页

不做。前端优先呈现客观事实，不做“团队判断总结”页面。

## 5. 推荐的信息架构

左侧导航：

1. Benchmarks
2. Public Results
3. Competitor Visibility

每个 Benchmark Detail 中再嵌入：

- Dataset
- Task Design
- Search Protocol
- Evaluation
- Related Public Results
- Related Competitor Mentions
- Sources

Public Results 和 Competitor Visibility 页面也需要在每张表、每条记录的局部区域展示 Sources，不做单独 Sources 页面。

## 6. UI 风格参考

参考 Querit 公开产品页的方向：

- 偏开发者工具和 API 产品。
- 信息密度高，但排版清晰。
- 不做营销型长 landing page。
- 重点用表格、筛选器、详情 panel、source link、指标 badge。
- 颜色可参考 Querit 的深色/高对比、技术感风格，但实际前端应优先保证可读性。

来源参考：https://www.querit.ai/
