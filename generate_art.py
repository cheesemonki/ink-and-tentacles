#!/usr/bin/env python3
"""
《墨水与触手 · 深海牌局》360 张海洋博物学手绘卡图一键批量生成脚本 (OpenAI API)
纯 Python 标准库实现，无需安装任何第三方依赖。

用法示例：
  export OPENAI_API_KEY="sk-你的密钥"
  # 1) 先试跑 5 张看效果：
  python3 generate_art.py --limit 5
  # 2) 先生成全部 36 张传说卡：
  python3 generate_art.py --rarity l
  # 3) 只生成某个流派（如水压 pressure）：
  python3 generate_art.py --archetype pressure
  # 4) 生成全部 360 张（支持断点续传，已生成的文件自动跳过）：
  python3 generate_art.py --workers 3

可选环境变量：
  OPENAI_BASE_URL  自定义中转地址，默认 https://api.openai.com/v1
"""

import argparse
import base64
import concurrent.futures
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROMPTS_FILE = ROOT / "prompts_360.json"
OUT_DIR = ROOT / "img" / "art"


def call_openai_image(api_key: str, base_url: str, model: str, prompt: str, quality: str, size: str) -> bytes:
    url = base_url.rstrip("/") + "/images/generations"
    payload = {
        "model": model,
        "prompt": prompt,
        "size": size,
        "n": 1,
    }
    if model.startswith("gpt-image"):
        payload["quality"] = quality
        payload["output_format"] = "jpeg"
        payload["output_compression"] = 85
    else:
        payload["response_format"] = "b64_json"
        if quality in ("standard", "hd"):
            payload["quality"] = quality

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    item = data["data"][0]
    if "b64_json" in item:
        return base64.b64decode(item["b64_json"])
    if "url" in item:
        with urllib.request.urlopen(item["url"], timeout=120) as img_resp:
            return img_resp.read()
    raise RuntimeError(f"Unexpected response payload: {list(item.keys())}")


def generate_one(card: dict, args, api_key: str, base_url: str) -> tuple[str, str]:
    out_path = OUT_DIR / f"{card['id']}.jpg"
    if out_path.exists() and not args.overwrite:
        return card["id"], "skipped"

    last_err = None
    for attempt in range(1, args.retries + 1):
        try:
            img_bytes = call_openai_image(
                api_key=api_key,
                base_url=base_url,
                model=args.model,
                prompt=card["prompt"],
                quality=args.quality,
                size=args.size,
            )
            out_path.write_bytes(img_bytes)
            return card["id"], "ok"
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="ignore")[:300]
            last_err = f"HTTP {e.code}: {body}"
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(min(30, 3 * attempt))
            else:
                break
        except Exception as e:
            last_err = str(e)
            time.sleep(min(20, 2 * attempt))

    return card["id"], f"error: {last_err}"


def main():
    parser = argparse.ArgumentParser(description="批量生成 360 张海洋博物学手绘卡图 (OpenAI API)")
    parser.add_argument("--model", default="gpt-image-1", help="OpenAI 生图模型（默认 gpt-image-1）")
    parser.add_argument("--quality", default="medium", choices=["low", "medium", "high", "standard", "hd"], help="画质档位（默认 medium）")
    parser.add_argument("--size", default="1024x1536", help="尺寸（默认 1024x1536 竖版卡图比例）")
    parser.add_argument("--workers", type=int, default=3, help="并发数（默认 3，建议 2-5）")
    parser.add_argument("--retries", type=int, default=3, help="失败重试次数（默认 3）")
    parser.add_argument("--limit", type=int, default=0, help="仅生成前 N 张用于试跑（0 表示不限制）")
    parser.add_argument("--archetype", default="", help="仅生成指定流派（如 pressure / mutate / omen）")
    parser.add_argument("--rarity", default="", choices=["", "c", "u", "r", "l"], help="仅生成指定稀有度（c/u/r/l）")
    parser.add_argument("--overwrite", action="store_true", help="覆盖已存在的图片（默认断点续传跳过）")
    parser.add_argument("--dry-run", action="store_true", help="只打印待生成清单，不调用 API")
    args = parser.parse_args()

    if not PROMPTS_FILE.exists():
        sys.exit(f"找不到 {PROMPTS_FILE}")

    cards = json.loads(PROMPTS_FILE.read_text(encoding="utf-8"))
    if args.archetype:
        cards = [c for c in cards if c["archetype"] == args.archetype]
    if args.rarity:
        cards = [c for c in cards if c["rarity"] == args.rarity]
    if not args.overwrite:
        cards = [c for c in cards if not (OUT_DIR / f"{c['id']}.jpg").exists()]
    if args.limit > 0:
        cards = cards[: args.limit]

    print(f"待生成卡图：{len(cards)} 张 | 模型：{args.model} | 画质：{args.quality} | 输出目录：{OUT_DIR}")
    if not cards:
        print("全部目标卡图已存在，无需重复生成（如需重画请加 --overwrite）。")
        return

    if args.dry_run:
        for c in cards[:10]:
            print(f"  - {c['id']} ({c['name']} / {c['species']})")
        if len(cards) > 10:
            print(f"  ... 共 {len(cards)} 张")
        return

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        sys.exit("请先设置环境变量：export OPENAI_API_KEY='sk-...'")
    base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").strip()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ok = fail = 0
    start = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futs = {pool.submit(generate_one, c, args, api_key, base_url): c for c in cards}
        for i, fut in enumerate(concurrent.futures.as_completed(futs), 1):
            card = futs[fut]
            cid, status = fut.result()
            if status == "ok":
                ok += 1
                print(f"[{i}/{len(cards)}] ✓ {cid} · {card['name']} ({card['species']})")
            elif status == "skipped":
                print(f"[{i}/{len(cards)}] - {cid} 已存在跳过")
            else:
                fail += 1
                print(f"[{i}/{len(cards)}] ✗ {cid} · {card['name']} -> {status}")

    elapsed = time.time() - start
    print(f"\n完成！成功 {ok} 张，失败 {fail} 张，耗时 {elapsed:.1f}s。打开 index.html 即可自动生效。")


if __name__ == "__main__":
    main()
