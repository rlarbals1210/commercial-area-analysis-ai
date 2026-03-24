"""
네이버 플레이스 크롤러 — 백그라운드 실행용 스크립트
실행: python ai/scripts/crawl_naver_place.py
이어받기: 이미 수집된 상가업소번호는 자동으로 스킵합니다.
"""

import re
import sys
import asyncio
import logging
import urllib.parse
from pathlib import Path

import pandas as pd
from playwright.async_api import async_playwright

# ── 경로 설정 ──────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parents[1]
STORE_DIR    = PROJECT_ROOT / "data" / "raw_data" / "store_info"
OUT_PATH     = PROJECT_ROOT / "data" / "processed_data" / "naver_place_info.csv"
LOG_PATH     = PROJECT_ROOT / "data" / "logs" / "crawl_naver_place.log"

OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

# ── 로깅 ──────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_PATH, encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# ── 상수 ──────────────────────────────────────────────────────────
FOOD_CATS = [
    '한식', '분식', '중식', '일식', '양식', '경양식',
    '패밀리레스토랑', '비알코올', '주점', '카페', '기타 간이', '호프/통닭',
]

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

PLACE_ID_RE = re.compile(r'map\.naver\.com/p/(?:search/[^/"]+/place|entry/place)/(\d+)')
PRICE_RE    = re.compile(r'([\d,]{3,8})(?=원)')

VISIT_KEYWORDS = [
    "혼밥", "혼술", "혼자",
    "데이트", "커플", "기념일",
    "가족", "아이", "어린이",
    "회식", "단체", "접대",
    "친구", "모임", "브런치",
]

PURPOSE_MAP = {
    "1인":      ["혼밥", "혼술", "혼자"],
    "커플":     ["데이트", "커플", "기념일"],
    "가족":     ["가족", "아이", "어린이"],
    "회식/접대": ["회식", "단체", "접대"],
    "친목":     ["친구", "모임", "브런치"],
}

BATCH_SIZE  = 100
DELAY_SEC   = 1.2
EMPTY_WARN  = 50   # 연속 매칭 실패 임계값
BLOCK_EXIT  = 42   # 차단 감지 시 종료 코드 (래퍼 스크립트가 감지해 재시작)


def _trim_failed_tail(path: Path) -> None:
    """CSV 말미의 연속 매칭 실패 행(place_id=NaN)을 제거합니다."""
    if not path.exists():
        return
    df = pd.read_csv(path, encoding="utf-8-sig")
    last_valid = df["place_id"].last_valid_index()
    if last_valid is None:
        return
    trimmed = df.iloc[: last_valid + 1]
    trimmed.to_csv(path, index=False, encoding="utf-8-sig")
    log.info(f"  → CSV 정리: {len(df)-len(trimmed):,}행 제거 ({len(trimmed):,}행 유지)")


# ── 분류 함수 ─────────────────────────────────────────────────────
def classify_price_tier(avg) -> str:
    if avg is None:  return "알수없음"
    if avg < 10_000: return "저가"
    if avg < 30_000: return "중가"
    return "고가"


def classify_visit_purpose(tags_str: str) -> str:
    purposes = [p for p, kws in PURPOSE_MAP.items() if any(k in tags_str for k in kws)]
    return "|".join(purposes) if purposes else "기타"


# ── Playwright 함수 ───────────────────────────────────────────────
async def find_place_id(page, store_name: str, address: str, dong: str = "") -> str | None:
    parts     = (address or "").split()
    addr_full = " ".join(parts[1:3])   # "양천구 신정로"
    gu        = parts[1] if len(parts) > 1 else ""

    queries = [
        f"{store_name} {addr_full}".strip(),   # 1차: 가게명 + 구 + 로/동
        f"{store_name} {dong}".strip(),         # 2차: 가게명 + 행정동명
        f"{store_name} {gu}".strip(),           # 3차: 가게명 + 구
    ]

    for query in queries:
        if not query.strip():
            continue
        try:
            enc = urllib.parse.quote(query)
            await page.goto(
                f"https://search.naver.com/search.naver?query={enc}&where=place",
                wait_until="domcontentloaded", timeout=15000,
            )
            await page.wait_for_timeout(800)
            html = await page.content()
            ids  = PLACE_ID_RE.findall(html)
            if ids:
                return ids[0]
        except Exception:
            continue
    return None


async def scrape_place(page, place_id: str) -> dict:
    out = {
        "avg_price": None, "price_min": None,
        "price_max": None, "menu_count": 0, "visitor_tags": "",
    }

    # 메뉴 가격
    try:
        await page.goto(
            f"https://pcmap.place.naver.com/restaurant/{place_id}/menu",
            wait_until="domcontentloaded", timeout=12000,
        )
        await page.wait_for_timeout(1500)
        html   = await page.content()
        prices = [
            int(m.replace(",", ""))
            for m in PRICE_RE.findall(html)
            if 1_000 <= int(m.replace(",", "")) <= 500_000
        ]
        if prices:
            out.update({
                "avg_price":  round(sum(prices) / len(prices)),
                "price_min":  min(prices),
                "price_max":  max(prices),
                "menu_count": len(prices),
            })
    except Exception:
        pass

    # 방문자 태그 (실제 선택된 태그만 추출)
    try:
        await page.goto(
            f"https://pcmap.place.naver.com/restaurant/{place_id}/review/visitor",
            wait_until="domcontentloaded", timeout=12000,
        )
        await page.wait_for_timeout(1500)
        text = await page.inner_text("body")
        out["visitor_tags"] = "|".join(kw for kw in VISIT_KEYWORDS if kw in text)
    except Exception:
        pass

    return out


# ── 메인 크롤링 루프 ──────────────────────────────────────────────
async def main():
    # 최신 분기 데이터 로드
    latest_dir = sorted(STORE_DIR.iterdir())[-1]
    log.info(f"최신 분기: {latest_dir.name}")

    df_store = pd.read_csv(latest_dir / "상가_서울.csv", encoding="utf-8-sig", low_memory=False)
    df_store = df_store[df_store["상권업종중분류명"].isin(FOOD_CATS)].copy()
    df_store = df_store[
        ["상가업소번호", "상호명", "상권업종중분류명", "행정동명", "도로명주소", "경도", "위도"]
    ].reset_index(drop=True)

    # 이어받기: 이미 수집된 항목 스킵
    if OUT_PATH.exists():
        done = set(pd.read_csv(OUT_PATH, encoding="utf-8-sig")["상가업소번호"].tolist())
        df_store = df_store[~df_store["상가업소번호"].isin(done)]
        log.info(f"이미 수집: {len(done):,}개 / 남은 대상: {len(df_store):,}개")
    else:
        log.info(f"수집 대상: {len(df_store):,}개")

    if df_store.empty:
        log.info("모든 데이터 수집 완료.")
        return

    results       = []
    errors        = 0
    total         = len(df_store)
    total_matched = 0
    total_priced  = 0
    empty_streak  = 0

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page    = await browser.new_page(user_agent=UA)
        page.set_default_timeout(15000)

        for seq, (_, row) in enumerate(df_store.iterrows(), 1):
            try:
                pid  = await find_place_id(page, row["상호명"], row["도로명주소"], row["행정동명"])
                info = await scrape_place(page, pid) if pid else {
                    "avg_price": None, "price_min": None,
                    "price_max": None, "menu_count": 0, "visitor_tags": "",
                }
                if pid:
                    total_matched += 1
                    empty_streak = 0
                else:
                    empty_streak += 1
                if info["avg_price"] is not None:
                    total_priced += 1
                results.append({
                    "상가업소번호":     row["상가업소번호"],
                    "상호명":          row["상호명"],
                    "상권업종중분류명": row["상권업종중분류명"],
                    "행정동명":         row["행정동명"],
                    "도로명주소":       row["도로명주소"],
                    "경도":            row["경도"],
                    "위도":            row["위도"],
                    "place_id":        pid,
                    "avg_price":       info["avg_price"],
                    "price_min":       info["price_min"],
                    "price_max":       info["price_max"],
                    "menu_count":      info["menu_count"],
                    "visitor_tags":    info["visitor_tags"],
                    "price_tier":      classify_price_tier(info["avg_price"]),
                    "visit_purpose":   classify_visit_purpose(info["visitor_tags"]),
                })
            except Exception as e:
                errors += 1
                empty_streak += 1
                results.append({
                    "상가업소번호": row["상가업소번호"],
                    "상호명":      row["상호명"],
                    "price_tier":  "오류",
                    "visit_purpose": "오류",
                })

            # 차단 감지: try 블록 바깥에서 처리하기 위해 break
            if empty_streak >= EMPTY_WARN:
                log.warning(f"  ⚠ 연속 {EMPTY_WARN}개 매칭 실패 — 차단 감지, 자동 재시작 준비...")
                break

            # 10개마다 진행률 출력 (누적 기준)
            if seq % 10 == 0:
                log.info(
                    f"[{seq:,}/{total:,}] "
                    f"매칭:{total_matched/seq:.0%} 가격:{total_priced/seq:.0%} 오류:{errors}"
                )

            # BATCH_SIZE마다 CSV에 저장 (이어받기 가능)
            if seq % BATCH_SIZE == 0:
                _df = pd.DataFrame(results)
                mode, header = ("a", False) if OUT_PATH.exists() else ("w", True)
                _df.to_csv(OUT_PATH, mode=mode, header=header, index=False, encoding="utf-8-sig")
                results = []
                log.info(f"  → {seq:,}개 저장 ({OUT_PATH.name})")

            await asyncio.sleep(DELAY_SEC)

        await browser.close()

    # 나머지 저장
    if results:
        _df = pd.DataFrame(results)
        mode, header = ("a", False) if OUT_PATH.exists() else ("w", True)
        _df.to_csv(OUT_PATH, mode=mode, header=header, index=False, encoding="utf-8-sig")

    # 차단으로 중단된 경우 CSV 정리 후 exit 42 (래퍼가 재시작)
    if empty_streak >= EMPTY_WARN:
        _trim_failed_tail(OUT_PATH)
        sys.exit(BLOCK_EXIT)

    log.info(f"\n완료! → {OUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
