#!/usr/bin/env python3
import csv
import io
import json
import time
import zipfile
from pathlib import Path

import fsspec
import pandas as pd
import pyarrow.parquet as pq
import requests
from huggingface_hub import hf_hub_download


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dataset_samples_v1.json"

UA = "agent-search-benchmark-dataset-refresh/0.1"


def get(url, *, params=None, timeout=30, retries=2):
    last_error = None
    for attempt in range(retries + 1):
        try:
            response = requests.get(url, params=params, timeout=timeout, headers={"User-Agent": UA})
            response.raise_for_status()
            return response
        except Exception as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(1 + attempt)
    raise last_error


def head(url, *, timeout=30):
    response = requests.head(url, allow_redirects=True, timeout=timeout, headers={"User-Agent": UA})
    response.raise_for_status()
    return response


def truncate_value(value, limit=420):
    if isinstance(value, str):
        if len(value) > limit:
            return value[:limit] + "...", True
        return value, False
    if isinstance(value, list):
        out = []
        changed = False
        for item in value[:5]:
            item_out, item_changed = truncate_value(item, limit=limit)
            out.append(item_out)
            changed = changed or item_changed
        return out, changed or len(value) > 5
    if isinstance(value, dict):
        out = {}
        changed = False
        for key, item in list(value.items())[:12]:
            item_out, item_changed = truncate_value(item, limit=limit)
            out[key] = item_out
            changed = changed or item_changed
        return out, changed or len(value) > 12
    return value, False


def make_row(row_idx, row, keys=None, limit=420, extra=None):
    selected = row if keys is None else {key: row.get(key) for key in keys if key in row}
    out = {"row_idx": row_idx}
    truncated = False
    for key, value in selected.items():
        value_out, value_changed = truncate_value(value, limit=limit)
        out[key] = value_out
        truncated = truncated or value_changed
    if extra:
        out.update(extra)
    if truncated:
        out["truncated"] = True
    return out


def count_csv_rows(text):
    return sum(1 for _ in csv.DictReader(io.StringIO(text)))


def first_lines(url, limit):
    response = requests.get(url, stream=True, timeout=30, headers={"User-Agent": UA})
    response.raise_for_status()
    lines = []
    for raw_line in response.iter_lines(decode_unicode=True):
        if raw_line:
            lines.append(raw_line)
        if len(lines) >= limit:
            break
    response.close()
    return lines


def kaggle_facts_search():
    url = "https://www.kaggle.com/api/v1/datasets/download/deepmind/facts-search-public"
    response = get(url, timeout=60)
    archive = zipfile.ZipFile(io.BytesIO(response.content))
    filename = archive.namelist()[0]
    text = archive.read(filename).decode("utf-8")
    rows = list(csv.DictReader(io.StringIO(text)))
    fields = rows[0].keys() if rows else []
    return {
        "status": "sampled",
        "source_url": "https://www.kaggle.com/datasets/deepmind/facts-search-public",
        "source_type": "kaggle_dataset",
        "file_format": "csv",
        "source_files": [filename],
        "record_count_observed": len(rows),
        "fields": list(fields),
        "rows": [make_row(i, row, limit=520) for i, row in enumerate(rows[:3])],
    }


def browsecomp():
    url = "https://openaipublic.blob.core.windows.net/simple-evals/browse_comp_test_set.csv"
    text = get(url, timeout=60).text
    rows = list(csv.DictReader(io.StringIO(text)))
    return {
        "status": "encrypted_sampled",
        "source_url": url,
        "source_type": "csv",
        "file_format": "csv",
        "record_count_observed": len(rows),
        "fields": list(rows[0].keys()) if rows else [],
        "notes": "Public rows are encrypted/obfuscated by the benchmark publisher.",
        "rows": [make_row(i, row, limit=360) for i, row in enumerate(rows[:3])],
    }


def simpleqa():
    url = "https://openaipublic.blob.core.windows.net/simple-evals/simple_qa_test_set.csv"
    text = get(url, timeout=60).text
    rows = list(csv.DictReader(io.StringIO(text)))
    return {
        "status": "sampled",
        "source_url": url,
        "source_type": "csv",
        "file_format": "csv",
        "record_count_observed": len(rows),
        "fields": list(rows[0].keys()) if rows else [],
        "rows": [make_row(i, row, limit=520) for i, row in enumerate(rows[:3])],
    }


def tavily_search_evals():
    simpleqa_url = "https://raw.githubusercontent.com/tavily-ai/tavily-search-evals/main/datasets/simple_qa_test_set.csv"
    docrel_url = "https://raw.githubusercontent.com/tavily-ai/tavily-search-evals/main/datasets/document_relevance_dynamic_test_set.json"
    simpleqa_rows = list(csv.DictReader(io.StringIO(get(simpleqa_url, timeout=60).text)))
    docrel_payload = get(docrel_url, timeout=60).json()
    docrel_rows = docrel_payload.get("dataset", [])
    return {
        "status": "sampled",
        "source_url": "https://github.com/tavily-ai/tavily-search-evals",
        "source_type": "github_dataset",
        "file_format": "csv/json",
        "record_count_observed": len(simpleqa_rows) + len(docrel_rows),
        "split_counts_observed": {
            "simple_qa_test_set.csv": len(simpleqa_rows),
            "document_relevance_dynamic_test_set.json": len(docrel_rows),
        },
        "fields": ["metadata", "problem", "answer", "question", "answer_context", "citations", "provider", "subject"],
        "source_files": [simpleqa_url, docrel_url],
        "rows": [
            *[make_row(i, row, limit=420, extra={"row_source_url": simpleqa_url}) for i, row in enumerate(simpleqa_rows[:2])],
            *[make_row(i + 2, row, limit=420, extra={"row_source_url": docrel_url}) for i, row in enumerate(docrel_rows[:1])],
        ],
    }


def no_independent_dataset(source_url, note):
    return {
        "status": "no_independent_dataset",
        "source_url": source_url,
        "source_type": "article_or_blog",
        "fields": [],
        "rows": [],
        "notes": note,
    }


def livenewsbench():
    base = "https://raw.githubusercontent.com/YunfanZhang42/LiveNewsBench/main/datasets/jan_2026_release_2"
    split_counts = {
        "train": 612,
        "val": 171,
        "test": 346,
        "human_verified_test": 200,
    }
    split_urls = {split: f"{base}/{split}.jsonl" for split in split_counts}

    raw_rows = [json.loads(line) for line in first_lines(split_urls["human_verified_test"], 3)]
    rows = []
    for idx, row in enumerate(raw_rows):
        article_titles = [article.get("title") for article in row.get("articles", [])[:3]]
        selected = {
            "date": row.get("date"),
            "category": row.get("category"),
            "question": row.get("question"),
            "answer": row.get("answer"),
            "temporal_stability": row.get("temporal_stability"),
            "human_review_status": row.get("human_review_status"),
            "article_titles": article_titles,
            "stripped_markdown": row.get("stripped_markdown"),
        }
        rows.append(make_row(idx, selected, limit=520, extra={"row_source_url": split_urls["human_verified_test"]}))

    return {
        "status": "sampled",
        "source_url": "https://github.com/LiveNewsBench/LiveNewsBench",
        "source_type": "github_dataset",
        "release": "jan_2026_release_2",
        "file_format": "jsonl",
        "split_counts_observed": split_counts,
        "fields": list(raw_rows[0].keys()) if raw_rows else [],
        "source_files": list(split_urls.values()),
        "rows": rows,
    }


def hf_first_rows(dataset, config, split, *, limit=3, source_url=None, status="sampled", notes=None):
    response = get(
        "https://datasets-server.huggingface.co/first-rows",
        params={"dataset": dataset, "config": config, "split": split},
        timeout=40,
    )
    payload = response.json()
    fields = [feature["name"] for feature in payload.get("features", [])]
    rows = []
    for item in payload.get("rows", [])[:limit]:
        row = make_row(item.get("row_idx", len(rows)), item.get("row", {}), limit=520)
        if item.get("truncated_cells"):
            row["truncated"] = True
            row["truncated_cells"] = item["truncated_cells"]
        rows.append(row)
    out = {
        "status": status,
        "source_url": source_url or f"https://huggingface.co/datasets/{dataset}",
        "source_type": "huggingface_dataset",
        "config": config,
        "split": split,
        "fields": fields,
        "rows": rows,
    }
    parquet_meta = hf_parquet_metadata(dataset, config, split)
    if parquet_meta:
        out.update(parquet_meta)
        if not out.get("fields") and parquet_meta.get("fields"):
            out["fields"] = parquet_meta["fields"]
    if notes:
        out["notes"] = notes
    return out


def hf_parquet_metadata(dataset, config, split, max_total_size=50_000_000):
    try:
        payload = get("https://datasets-server.huggingface.co/parquet", params={"dataset": dataset}, timeout=30).json()
        files = [
            item for item in payload.get("parquet_files", [])
            if item.get("config") == config and item.get("split") == split
        ]
        if not files:
            return None
        total_size = sum(item.get("size") or 0 for item in files)
        meta = {
            "source_files": [item["url"] for item in files],
            "file_size_bytes_observed": total_size,
        }
        if total_size > max_total_size:
            return meta
        total_rows = 0
        fields = None
        for item in files:
            final_url = head(item["url"]).url
            with fsspec.filesystem("https").open(final_url, "rb") as handle:
                parquet_file = pq.ParquetFile(handle)
                total_rows += parquet_file.metadata.num_rows
                fields = fields or parquet_file.schema_arrow.names
        meta["record_count_observed"] = total_rows
        if fields:
            meta["fields"] = fields
        return meta
    except Exception:
        return None


def browsecomp_plus():
    dataset = "Tevatron/browsecomp-plus"
    parquet_info = get("https://datasets-server.huggingface.co/parquet", params={"dataset": dataset}, timeout=30).json()
    parquet_files = parquet_info.get("parquet_files", [])
    total_rows = 0
    row_group_count = 0
    row_group_0_size = None
    for item in parquet_files:
        final_url = head(item["url"]).url
        with fsspec.filesystem("https").open(final_url, "rb") as handle:
            parquet_file = pq.ParquetFile(handle)
            total_rows += parquet_file.metadata.num_rows
            row_group_count += parquet_file.num_row_groups
            if row_group_0_size is None:
                row_group_0_size = parquet_file.metadata.row_group(0).total_byte_size

    first_url = parquet_files[0]["url"]
    final_url = head(first_url).url
    with fsspec.filesystem("https").open(final_url, "rb") as handle:
        parquet_file = pq.ParquetFile(handle)
        table = parquet_file.read_row_group(0, columns=["query_id", "query", "answer"], use_threads=False)
        raw_rows = table.slice(0, 3).to_pandas().to_dict("records")
        fields = parquet_file.schema_arrow.names

    corpus = hf_first_rows(
        "Tevatron/browsecomp-plus-corpus",
        "default",
        "train",
        limit=2,
        source_url="https://huggingface.co/datasets/Tevatron/browsecomp-plus-corpus",
    )
    return {
        "status": "encrypted_sampled",
        "source_url": "https://huggingface.co/datasets/Tevatron/browsecomp-plus",
        "source_type": "huggingface_dataset",
        "config": "default",
        "split": "test",
        "file_format": "parquet",
        "record_count_observed": total_rows,
        "row_group_count_observed": row_group_count,
        "row_group_0_total_byte_size": row_group_0_size,
        "fields": fields,
        "source_files": [item["url"] for item in parquet_files],
        "notes": "Query and answer fields are encrypted/obfuscated in the public parquet. Large nested doc columns are not read into the frontend seed.",
        "rows": [make_row(i, row, limit=520) for i, row in enumerate(raw_rows)],
        "related_samples": [
            {
                "label": "corpus",
                "source_url": corpus["source_url"],
                "fields": corpus["fields"],
                "rows": corpus["rows"],
            }
        ],
    }


def miracl():
    files = [
        ("en", "miracl-v1.0-en/topics/topics.miracl-v1.0-en-dev.tsv", "miracl-v1.0-en/qrels/qrels.miracl-v1.0-en-dev.tsv"),
        ("ja", "miracl-v1.0-ja/topics/topics.miracl-v1.0-ja-dev.tsv", "miracl-v1.0-ja/qrels/qrels.miracl-v1.0-ja-dev.tsv"),
        ("sw", "miracl-v1.0-sw/topics/topics.miracl-v1.0-sw-dev.tsv", "miracl-v1.0-sw/qrels/qrels.miracl-v1.0-sw-dev.tsv"),
    ]
    rows = []
    source_files = []
    for idx, (language, topics_file, qrels_file) in enumerate(files):
        topics_path = hf_hub_download("miracl/miracl", topics_file, repo_type="dataset")
        qrels_path = hf_hub_download("miracl/miracl", qrels_file, repo_type="dataset")
        source_files.extend([
            f"https://huggingface.co/datasets/miracl/miracl/blob/main/{topics_file}",
            f"https://huggingface.co/datasets/miracl/miracl/blob/main/{qrels_file}",
        ])
        with open(topics_path, "r", encoding="utf-8") as handle:
            topic_line = handle.readline().rstrip("\n")
        topic_parts = topic_line.split("\t", 1)
        query_id = topic_parts[0]
        query = topic_parts[1] if len(topic_parts) > 1 else ""
        qrel_docid = None
        qrel_relevance = None
        with open(qrels_path, "r", encoding="utf-8") as handle:
            for line in handle:
                parts = line.rstrip("\n").split()
                if parts and parts[0] == query_id:
                    qrel_docid = parts[2] if len(parts) > 2 else None
                    qrel_relevance = parts[3] if len(parts) > 3 else None
                    break
        rows.append(
            make_row(
                idx,
                {
                    "language": language,
                    "query_id": query_id,
                    "query": query,
                    "qrel_docid": qrel_docid,
                    "qrel_relevance": qrel_relevance,
                },
                limit=520,
                extra={"row_source_url": source_files[-2]},
            )
        )
    return {
        "status": "sampled",
        "source_url": "https://huggingface.co/datasets/miracl/miracl",
        "source_type": "huggingface_dataset",
        "file_format": "tsv",
        "fields": ["language", "query_id", "query", "qrel_docid", "qrel_relevance"],
        "source_files": source_files,
        "rows": rows,
    }


def search_arena():
    dataset = "lmarena-ai/search-arena-24k"
    parquet_info = get("https://datasets-server.huggingface.co/parquet", params={"dataset": dataset}, timeout=30).json()
    file_info = parquet_info["parquet_files"][0]
    final_url = head(file_info["url"]).url
    with fsspec.filesystem("https").open(final_url, "rb") as handle:
        parquet_file = pq.ParquetFile(handle)
        columns = ["model_a", "model_b", "winner", "judge", "turn", "timestamp", "primary_intent", "secondary_intent"]
        table = parquet_file.read_row_group(0, columns=columns, use_threads=False)
        raw_rows = table.slice(0, 3).to_pandas().to_dict("records")
        fields = parquet_file.schema_arrow.names
        observed_rows = parquet_file.metadata.num_rows
        row_group_count = parquet_file.num_row_groups
    rows = []
    for idx, row in enumerate(raw_rows):
        row["timestamp"] = str(row.get("timestamp"))
        rows.append(make_row(idx, row, limit=520))
    return {
        "status": "sampled",
        "source_url": "https://huggingface.co/datasets/lmarena-ai/search-arena-24k",
        "source_type": "huggingface_dataset",
        "config": "default",
        "split": "test",
        "file_format": "parquet",
        "record_count_observed": observed_rows,
        "row_group_count_observed": row_group_count,
        "fields": fields,
        "source_files": [file_info["url"]],
        "notes": "Frontend seed reads scalar metadata columns only. Full conversation/search trace columns are large nested parquet columns and should be loaded on demand.",
        "rows": rows,
    }


def build():
    datasets = {
        "facts_search": kaggle_facts_search,
        "browsecomp": browsecomp,
        "tavily_search_evals": tavily_search_evals,
        "simpleqa": simpleqa,
        "exa_api_evals": lambda: no_independent_dataset(
            "https://exa.ai/blog/api-evals",
            "Vendor-published evaluation context. No standalone public dataset file was identified in the current snapshot."
        ),
        "brave_simpleqa_comparison": lambda: no_independent_dataset(
            "https://brave.com/blog/ai-grounding/",
            "Vendor-published SimpleQA comparison. It references SimpleQA rather than publishing a separate dataset."
        ),
        "aimultiple_agentic_search_benchmark": lambda: no_independent_dataset(
            "https://aimultiple.com/agentic-search",
            "Third-party article reports benchmark scores; no standalone public task dataset was identified in the current snapshot."
        ),
        "wiser_search": lambda: no_independent_dataset(
            "https://parallel.ai/blog/search-api-benchmark",
            "Vendor-published comparison. No standalone public dataset file was identified in the current snapshot."
        ),
        "parallel_comparison_article": lambda: no_independent_dataset(
            "https://parallel.ai/articles/openai-web-search-vs-parallel-vs-exa-vs-tavily-how-to-choose",
            "Vendor comparison article. This is not a standalone benchmark dataset."
        ),
        "livenewsbench": livenewsbench,
        "browsecomp_plus": browsecomp_plus,
        "widesearch": lambda: hf_first_rows("ByteDance-Seed/WideSearch", "default", "full", limit=3),
        "deepsearchqa": lambda: hf_first_rows("google/deepsearchqa", "deepsearchqa", "eval", limit=3),
        "sgr_bench": lambda: hf_first_rows("PKUAIWeb/SGR-BENCH", "default", "goal", limit=3),
        "agentsearchbench": lambda: hf_first_rows("AgentSearch/AgentSearchBench-Tasks", "single-agent_task_query", "validation", limit=3),
        "miracl": miracl,
        "search_arena": search_arena,
    }
    output = {
        "meta": {
            "schema_version": "0.2.0",
            "generated_at": "2026-07-09",
            "purpose": "Frontend dataset previews from public source artifacts. Rows are fetched from official CSV, JSONL, TSV, or parquet sources; long cells are truncated and marked.",
            "sampling_policy": "Small first-row previews only. Public encrypted rows remain encrypted; large nested columns are summarized by fields and scalar samples.",
        },
        "datasets": {},
    }
    for dataset_id, loader in datasets.items():
        print(f"refreshing {dataset_id}...", flush=True)
        try:
            output["datasets"][dataset_id] = loader()
            print(f"done {dataset_id}", flush=True)
        except Exception as exc:
            print(f"failed {dataset_id}: {type(exc).__name__}: {exc}", flush=True)
            output["datasets"][dataset_id] = {
                "status": "fetch_error",
                "fields": [],
                "rows": [],
                "notes": f"{type(exc).__name__}: {exc}",
            }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    build()
