# 상권 분석 AI — 기능별 데이터 흐름

---

## 1. 보고서

| 구분 | API | DB/파일 | 조회 데이터 | 가공 | AI 처리 |
|------|-----|---------|------------|------|---------|
| 행정동 보고서 | `GET /api/report/` | `CommercialData` | 총매출·유동인구·주거/직장인구·성별/시간대/주중주말 매출비율·Top5 업종 | 전체 행정동 매출 순위 계산 | Gemini → 3섹션 텍스트 |
| 행정동 + 업종 보고서 | `GET /api/report/?category=` | `CommercialData` + `ScoreData` | 위 항목 + 점포수·프랜차이즈비율·개업률·폐업률·경쟁강도·성장확률·등급 | 동일 | Gemini → 6섹션 텍스트 |
| 구 보고서 | `POST /api/gu-report/` | `CommercialData` + `ScoreData` | 구 내 여러 행정동을 Sum/Avg 집계 | 동일 | Gemini → 3 또는 6섹션 |

---

## 2. AI 추천버튼 6가지 기능

| 모드 | API | DB 조회 | 교집합 기준 | 종합점수 공식 | 결과 |
|------|-----|---------|------------|--------------|------|
| ① 업종→행정동 (dong) | `GET /api/recommend/location/?업종=` | `ScoreData` (행정동별 성장확률) + `CommercialData` (매출·유동인구·포화도) + `StoreInfo` (점포수) | ScoreData ∩ CommercialData 행정동 | 성장확률×40% + 소분류경쟁×30% + 유동인구×15% + 포화도×15% | Top 10 행정동 |
| ② 행정동→업종 (industry) | `GET /api/recommend/industry/?dong=` | `ScoreData` (해당 행정동 전 업종) + `CommercialData` (해당 행정동 전 업종) | ScoreData ∩ CommercialData 업종 | 성장확률×40% + 매출×30% + 유동인구×15% + 경쟁×15% | Top 5 업종 |
| ③ 행정동+업종 적합도 (score) | `GET /api/recommend/score/?dong=&category=` | `ScoreData` (단일 행) + `CommercialData` (단일 행 + 전국 동일업종 정규화용) | 단일 조합 | 동일 공식 → breakdown 4항목 + A/B/C/D 등급 | 점수 카드 |
| ④ 구+업종→행정동 (gu, 행정동 탭) | `GET /api/recommend/location/?업종=&gu=` | ①과 동일, 구 코드로 `CommercialData` 필터 | 동일 | 동일 | Top 10 행정동 (구 내) |
| ④ 구+업종→길단위상권 (gu, 상권 탭) | `GET /api/recommend/gu-streets/?gu=&category=` | `street_boundaries.geojson` (구→상권코드 매핑) + `StreetScoreData` + `StreetCommercialData` | StreetScoreData ∩ StreetCommercialData 상권코드 | 성장확률×40% + 매출×30% + 유동인구×15% + 소득×15% | Top 5 길단위 상권 |
| ⑤ 지역 비교 | `GET /api/compare/region/` | `CommercialData` | 두 지역 각각 집계 | 항목별 수치 나란히 비교 | 비교 카드 |
| ⑥ 업종 비교 | `GET /api/compare/industry/` | `CommercialData` | 동일 지역, 두 업종 각각 집계 | 항목별 수치 나란히 비교 | 비교 카드 |

---

## 3. 마커

| 종류 | 트리거 | API | DB/파일 | 가공 | 지도 표현 |
|------|--------|-----|---------|------|----------|
| 상가 마커 | 행정동 선택 + 마커 토글 ON | `GET /api/stores/?dong=&limit=1000` | `StoreInfo` (상호명·위도·경도·통합카테고리·소분류명) | 최대 1000개 fetch → 줌 레벨별 그리드 클러스터링, 업종 필터는 클라이언트 사이드 | 클러스터 버블 or 핀 마커 |
| 위치 추천 마커 | AI 모달 "이 행정동에서 위치 추천" | `GET /api/recommend/spot/?dong=&category=` | `location_scores.csv` (사전 계산 그리드 파일) | 행정동×업종 필터 → 입지점수 Top 5 좌표 (생존율·경쟁밀도·보완밀도·상권활성도 포함) | 번호 SVG 핀 마커 |

---

## 4. 창업비용 계산기

### 데이터 출처

| 데이터 항목 | 출처 | 방식 |
|------------|------|------|
| 업종별 단위비용 (인테리어/㎡, 설비집기, 초기재고, 보증금배수, 원가율 등) | `STARTUP_COSTS` 객체 (`MapPage.jsx` line 18) | 프론트 하드코딩 |
| 구별 임대료 (만원/㎡, 층별) | `GET /api/rental/regions/` → `ai/outputs/gu_rental.json` | 앱 시작 시 1회 fetch, 캐시 |
| 최종 계산 | 프론트엔드에서 공식 계산 | API 없음 |

### 계산 공식

| 항목 | 공식 |
|------|------|
| 월세 | 임대료(만원/㎡) × 효용비율 × 면적(㎡) |
| 보증금 | 월세 × 보증금_임대료배수 |
| 인테리어 | 인테리어_만원per평 × 면적(평) |
| 초기 합계 | 보증금 + 인테리어 + 설비집기 + 초기재고 |
| 월 고정비 | 월세 + 관리비/공과금 + 인건비(250만원 × 직원수) |

---

## 5. 상권 트렌드

| 기능 | API | DB 조회 | 가공 | 표시 |
|------|-----|---------|------|------|
| 전체 서울 업종 트렌드 | `GET /api/trend/categories/` | `CommercialData` 최신 2개 분기 전체 | 업종별 매출·점포수 Sum, 전 분기 대비 증감률 계산 | 업종별 순위 리스트 |
| 구별 인기 업종 | `POST /api/trend/gu-industries/` | `CommercialData` 구 내 행정동, 최신 2분기 | 업종별 매출·점포수 집계 + 증감률 + 최고 매출 행정동 | 구 내 업종 순위 |

---

## 전체 데이터 원천 한눈에

| DB/파일 | 행 수 | 사용 기능 |
|---------|-------|----------|
| `CommercialData` | 408,576 | 보고서, AI추천 전체, 트렌드 |
| `ScoreData` | 15,025 | AI추천①②③④, 보고서 |
| `StreetCommercialData` | 20,816 | AI추천④ (길단위) |
| `StreetScoreData` | 19,890 | AI추천④ (길단위) |
| `StoreInfo` | 534,978 | 상가 마커, AI추천① 경쟁밀도 |
| `location_scores.csv` | — | 위치 추천 마커 |
| `gu_rental.json` | — | 창업비용 계산기 |
| `street_boundaries.geojson` | — | 구→상권코드 매핑 (AI추천④) |
| `STARTUP_COSTS` | 51개 업종 | 창업비용 계산기 |
