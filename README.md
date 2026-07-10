# Agent Search Benchmark

Search API / Agent Search benchmark 资料库与前端页面。

线上页面：

- https://agent-search-benchmark.ethan7zhanghx.com

## 当前页面

前端位于 `frontend/`，当前版本包含两个主要视图：

- `benchmark 目录`：检索 benchmark，查看 dataset、评估输入输出、指标、来源和 Tavily / Exa / Brave 等服务商出现情况。
- `leaderboard`：整理公开 score / evaluation 记录，并回链到对应 benchmark。

已删除独立的竞品页面；竞品信息会反向归入 benchmark 和 leaderboard 记录中。

## 数据

核心数据位于 `benchmark-research/`：

- `objective_benchmark_facts_v1.json`：benchmark 主表。
- `excluded_benchmarks_v1.json`：已审阅但不进入主库的 benchmark / evaluation。
- `dataset_samples_v1.json`：dataset 与样例任务。
- `public_result_snapshots_v1.json`：公开结果快照。
- `competitor_visibility_v1.json`：服务商公开 evaluation / benchmark 出现记录。
- `data_model_v1.json`：v1 字段契约，定义字段类型、允许值、来源要求和后续存储位置。
- `refresh_runs_v1.json`：刷新、清洗和校验运行记录。
- `benchmark_registry.json`：早期调研 registry。
- `deep_audit_v1.md`：深度调研记录。

## 数据校验

修改 benchmark research 数据后，先运行：

```bash
node benchmark-research/scripts/validate_data.mjs
```

如需重新标准化 v1 元数据和可派生字段：

```bash
node benchmark-research/scripts/normalize_v1_data.mjs
```

## 后续待办

- `TODO.md`

## 本地运行

```bash
cd frontend
npm install
npm run dev -- --port 5173
```

本地地址：`http://127.0.0.1:5173/`

## 部署

当前部署在 Vercel 项目 `agent-search-benchmark`，自定义域名为：

- https://agent-search-benchmark.ethan7zhanghx.com
