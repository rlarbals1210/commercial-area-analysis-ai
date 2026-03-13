"""
네이버 플레이스 크롤러 — 백그라운드 실행용 스크립트
실행: python ai/scripts/crawl_naver_place.py
이어받기: 이미 수집된 상가업소번호는 자동으로 스킵합니다.
"""

import re
import asyncio
import logging
import urllib.parse
from pathlib import Path

import pandas as pd
from playwright.async_api import async_playwright

# ── 경로 설정 ──────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parents[2]
STORE_DIR    = PROJECT_ROOT / "data" / "raw_data" / "store_info"
OUT_DIR      = PROJECT_ROOT / "ai" / "outputs"
OUT_PATH     = OUT_DIR / "naver_place_info.csv"
LOG_PATH     = OUT_DIR / "crawl_naver_place.log"

OUT_DIR.mkdir(parents=True, exist_ok=True)

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

BATCH_SIZE = 100
DELAY_SEC  = 1.2


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
async def find_place_id(page, store_name: str, address: str) -> str | None:
    addr_short = " ".join((address or "").split()[1:3])
    query = f"{store_name} {addr_short}".strip()
    enc   = urllib.parse.quote(query)
    try:
        await page.goto(
            f"https://search.naver.com/search.naver?query={enc}&where=place",
            wait_until="networkidle", timeout=15000,
        )
        await page.wait_for_timeout(800)
        html = await page.content()
        ids  = PLACE_ID_RE.findall(html)
        return ids[0] if ids else None
    except Exception:
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

    results        = []
    errors         = 0
    total          = len(df_store)
    total_matched  = 0
    total_priced   = 0
    empty_streak   = 0  # 연속으로 매칭 실패한 횟수
    EMPTY_WARN     = 50  # 연속 실패 경고 임계값

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page    = await browser.new_page(user_agent=UA)

        for seq, (_, row) in enumerate(df_store.iterrows(), 1):
            try:
                pid  = await find_place_id(page, row["상호명"], row["도로명주소"])
                info = await scrape_place(page, pid) if pid else {
                    "avg_price": None, "price_min": None,
                    "price_max": None, "menu_count": 0, "visitor_tags": "",
                }
                if pid:
                    total_matched += 1
                    empty_streak = 0
                else:
                    empty_streak += 1
                    if empty_streak == EMPTY_WARN:
                        log.warning(f"  ⚠ 연속 {EMPTY_WARN}개 매칭 실패 — 네이버 차단 가능성, 잠시 대기 중...")
                        await asyncio.sleep(30)
                        empty_streak = 0
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

    log.info(f"\n완료! → {OUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
