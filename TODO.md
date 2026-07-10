# TODO

更新日期：2026-07-10

本文记录 Agent Search benchmark 资料库后续待办。优先级仅用于推进顺序，不代表价值判断。

## P0 数据模型与数据清洗

- [x] 明确主库只收 `search_api` 和 `agent_plus_search` 两类 benchmark。
- [x] 将 `provided_context_only`、`no_search_dependency`、`out_of_scope` 条目移出主库并保留排除记录。
- [x] 固化 v1 数据模型，覆盖 benchmark、dataset、sample task、source、leaderboard result、provider appearance、refresh run。
- [x] 明确定义每个字段的类型、允许值、是否必填、来源要求和更新时间字段。
- [x] 把现有 JSON 数据按 v1 模型清洗一遍，消除同义字段、临时字段和展示层字段。
- [x] 为 `benchmark-research/objective_benchmark_facts_v1.json` 增加字段完整性检查。
- [x] 为 `benchmark-research/dataset_samples_v1.json` 增加样例结构检查。
- [x] 为 `benchmark-research/public_result_snapshots_v1.json` 增加 leaderboard 结果结构检查。
- [x] 为 `benchmark-research/competitor_visibility_v1.json` 增加服务商出现记录结构检查。
- [x] 明确哪些字段后续应迁移到数据库，哪些字段保留为来源快照或调研备注。

## P0 benchmark 与 dataset 补齐

- [ ] 为每个 benchmark 补齐真实 dataset 样例，避免前端展示推测性任务。
- [ ] 记录每个 dataset 的来源 URL、source type、文件格式、字段、split、记录数和可下载状态。
- [ ] 记录每个 dataset 是否需要 token、账号、Kaggle/HF 登录或额外授权。
- [ ] 记录每个 benchmark 的评估输入、输出、主要指标、是否需要实时搜索、是否允许替换检索器。
- [ ] 为每个 benchmark 补齐官方论文、GitHub、官网、dataset、leaderboard、blog 等来源。
- [ ] 给来源加更新时间和最后验证时间，支持后续过期检查。
- [ ] 区分公开事实、未确认事实、已失效事实，不在前端展示未确认事实为确定结论。

## P0 竞品与 leaderboard 反向归档

- [ ] 系统补齐 Tavily 出现过的 benchmark、evaluation、score 页面和官方/第三方对比。
- [ ] 系统补齐 Exa 出现过的 benchmark、evaluation、score 页面和官方/第三方对比。
- [ ] 系统补齐 Brave 出现过的 benchmark、evaluation、score 页面和官方/第三方对比。
- [ ] 将服务商出现记录反向关联到对应 benchmark。
- [ ] 无法关联到现有 benchmark 的 evaluation，需要补成新的 benchmark/evaluation 条目，而不是空挂。
- [ ] 为 leaderboard 记录补齐 score、metric、provider、排名/对比对象、发布时间、来源链接。
- [ ] 区分官方发布、厂商发布、第三方报告、社区复现等结果来源类型。
- [ ] 对每条公开结果保留原文来源和抓取/录入时间。

## P1 自动刷新机制

- [ ] 设计每周自动刷新流程，包含抓取、解析、diff、校验、人工确认和发布。
- [ ] 为 GitHub 来源实现抓取脚本。
- [ ] 为 Hugging Face dataset 来源实现抓取脚本。
- [ ] 为 Kaggle dataset 来源实现抓取脚本。
- [ ] 为官方网页/论文/博客来源实现抓取脚本。
- [ ] 为 vendor evaluation 页面实现抓取脚本。
- [ ] 记录每次刷新 run 的开始时间、结束时间、成功/失败、失败原因和影响的数据条目。
- [ ] 生成每周数据变更摘要，包括新增 benchmark、新增 dataset、新增 leaderboard、失效链接和字段变化。
- [ ] 建立人工确认队列，避免自动抓取结果直接污染前端事实数据。

## P1 前端产品化

- [ ] 把 benchmark 详情打磨成更稳定的资料库阅读体验，而不是单纯表格展开。
- [ ] 优化 dataset 样例展示，包括字段、样例任务、split、记录数和来源的层级。
- [ ] 优化 leaderboard 页面，提升不同 provider / metric / source type 的可读性。
- [ ] 将 source/evidence 作为每个页面的附属信息自然展示，不做独立来源页面。
- [ ] 继续检查移动端、小屏和宽屏布局，确保文本不溢出、不重叠。
- [ ] 增加空状态、加载状态、筛选无结果状态。
- [ ] 增加数据版本展示，但避免出现开发过程残留文案。
- [ ] 保持界面为中文；benchmark、leaderboard 等行业通用词可保留英文。

## P1 部署、访问与监控

- [x] 公开 GitHub 仓库。
- [x] 部署到 Vercel。
- [x] 绑定自定义域名 `agent-search-benchmark.ethan7zhanghx.com`。
- [x] 接入 Vercel Web Analytics。
- [ ] 决定页面长期公开访问还是加团队访问控制。
- [ ] 如果转内部使用，评估简单密码、Vercel protection 或团队登录方案。
- [ ] 定期查看 Vercel Analytics，判断是否有团队外访问。
- [ ] 明确是否需要 Speed Insights 或错误监控。

## P2 团队协作流程

- [ ] 定义新 benchmark 收录标准。
- [ ] 新增 benchmark 时必须先确认 `inclusion_status`、`evaluation_target` 和 `search_component_role`。
- [ ] 定义 benchmark 信息从 pending 到 confirmed 的确认规则。
- [ ] 定义数据来源优先级：官方、论文、代码、dataset、leaderboard、第三方报告、厂商页面。
- [ ] 定义谁负责 review 新增数据和每周自动刷新 diff。
- [ ] 定义每周更新如何通知团队。
- [ ] 建立 issue/PR 模板，方便团队补充 benchmark、dataset 和 leaderboard 信息。
- [ ] 为前端展示内容建立“客观事实优先”的内容规范，避免主观结论污染页面。

## P2 数据库与长期演进

- [ ] 评估从 JSON 迁移到数据库的时机。
- [ ] 设计数据库 schema，确保能支持前端筛选、详情页、source 追溯和自动刷新历史。
- [ ] 设计数据版本机制，支持查看历史快照和每周 diff。
- [ ] 设计数据导出能力，方便团队下载 CSV/JSON。
- [ ] 设计后续 agent search 产品相关评测数据的接入方式。
