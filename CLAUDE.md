# 상권 분석 AI — Claude Code 작업 가이드

## 프로젝트 개요
서울 상권 데이터를 기반으로 창업 입지·업종을 추천하는 웹앱.
- **프론트엔드**: React (Vite), `frontend-react/`
- **백엔드**: Django REST API, `backend/`
- **AI 모델**: LightGBM (성장확률 예측), Gemini API (보고서 텍스트 생성)
- **지도**: Kakao Maps JS SDK

---

## 서버 실행

### 백엔드 (포트 **8000**)
```bash
cd backend
python manage.py runserver 8000
```

### 프론트엔드 (포트 5173)
```bash
cd frontend-react
npm install
npm run dev
```

### 환경변수 (프로젝트 루트 `.env`)
```
SECRET_KEY=...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
DB_PW=...
GEMINI_API_KEY=...   ← Gemini 보고서 생성용 (Free tier)
```
Django는 `backend/config/settings.py` 안에서 `load_dotenv(Path(__file__).resolve().parents[2] / ".env")`로 프로젝트 루트 `.env`를 로드한다.

---

## 핵심 파일 목록

| 파일 | 역할 |
|------|------|
| `frontend-react/src/pages/MapPage.jsx` | 메인 지도 페이지 (모든 UI 포함) |
| `backend/analysis/views.py` | 모든 API 뷰 |
| `backend/config/urls.py` | URL 라우팅 |
| `backend/analysis/models.py` | DB 모델 5개 |

---

## DB 모델 구조

```
CommercialData      — 행정동×업종×분기 매출/유동인구/점포 지표 (408,576행)
ScoreData           — 행정동×업종 AI 성장확률·등급 (15,025행)
StreetCommercialData — 길단위상권×업종 매출/유동인구 지표 (20,816행)
StreetScoreData     — 길단위상권×업종 AI 성장확률·등급 (19,890행)
StoreInfo           — 개별 점포 정보 (소분류명, 통합카테고리 등) (534,978행)
```

**핵심 키 컬럼**: 모든 테이블에서 업종은 `통합카테고리` 컬럼으로 조인.

---

## 업종 카테고리 시스템

### 통합카테고리 (51개) — DB의 실제 값
DB에 존재하는 업종명 목록 (ScoreData, CommercialData 공통):
```
PC방, 가방, 가전제품, 가전제품수리, 골프연습장, 기타 B2B서비스, 네일숍, 노래방,
당구장, 미곡판매, 미용실, 반찬가게, 베이커리/디저트, 분식/간식, 생활용품 소매,
섬유제품, 세탁소, 수산물판매, 숙박, 슈퍼마켓, 스포츠 강습, 스포츠클럽, 신발,
안경, 애완동물, 양식/기타외식, 예술학원, 외국어학원, 육류판매, 의료기기, 의약품,
인테리어, 일반교습학원, 일반의류, 일반의원, 일식, 자동차수리/미용, 주점, 중식,
청과상, 치과의원, 치킨전문점, 카페, 컴퓨터및주변장치판매, 패스트푸드, 편의점,
피부관리실, 한식, 한의원, 핸드폰, 화장품
```

### 프론트엔드 `STARTUP_COSTS` (MapPage.jsx line 18)
- 창업비용 계산기 + 업종 선택 드롭다운에서 사용하는 키
- **반드시 위 DB 통합카테고리 이름과 정확히 일치해야 함**

---

## API 엔드포인트 목록

| URL | 메서드 | 설명 |
|-----|--------|------|
| `GET /api/analysis/` | GET | 행정동 상권 분석 |
| `GET /api/quarters/` | GET | 행정동 분기 목록 |
| `GET /api/gu-analysis/` | GET | 구 상권 분석 |
| `GET /api/score/` | GET | 행정동×업종 점수 |
| `GET /api/recommend/location/` | GET | 업종 → 행정동 추천 (AI 모드 "dong", "gu") |
| `GET /api/recommend/industry/` | GET | 행정동 → 업종 추천 |
| `GET /api/recommend/score/` | GET | 행정동×업종 적합도 점수 |
| `GET /api/recommend/spot/` | GET | 위치 추천 (지도 핀) |
| `GET /api/recommend/gu-streets/` | GET | 구×업종 → 길단위 상권 추천 |
| `POST /api/report/` | POST | 행정동 AI 보고서 생성 |
| `POST /api/gu-report/` | POST | 구 AI 보고서 생성 |
| `GET /api/trend/categories/` | GET | 트렌드 카테고리 |

---

## 주요 기능 흐름

### 구·업종 → 상권 추천 (AI 모달 "gu" 모드)
```
사용자: 구 선택(강남구) + 업종 선택(카페)
    ↓
프론트 handleAiRecommend()
    ↓ 병렬 호출
  ① GET /api/recommend/location/?업종=카페&gu=강남구
       ScoreData[카페] × CommercialData[카페, 강남구 행정동코드 범위]
       → 교집합 행정동 점수 계산 → Top 10 행정동
  ② GET /api/recommend/gu-streets/?gu=강남구&category=카페
       StreetScoreData[카페] × StreetCommercialData[카페, 강남구 상권코드]
       → 교집합 상권 점수 계산 → Top 5 길단위 상권
    ↓
결과: 행정동 탭 + 길단위 상권 탭으로 분리 표시
```

### 보고서 생성
```
행정동 클릭 or 구 클릭 → 사이드바 "보고서 생성하기" 버튼
    ↓
행정동: GET /api/report/?dong=역삼1동[&category=카페]
구:     POST /api/gu-report/ body={gu, dongs, category}
    ↓
백엔드: CommercialData 집계 → Gemini API (REST, requests.post) → AI 텍스트
    ↓
보고서 패널(secondPanelStyle) 표시
```

**Gemini 호출 방식**: `google-generativeai` SDK는 gRPC DNS 문제로 hang이 발생함.
반드시 아래 방식으로만 호출:
```python
import requests as http_requests
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
resp = http_requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=60)
# ⚠️ gemini-2.5-flash는 thinking 모델: parts[]에 thought 파트가 먼저 올 수 있음
# parts[0]으로 읽으면 thought(내부추론) 텍스트를 가져오는 경우 있음 → reversed()로 마지막 non-thought 파트를 읽어야 함
parts = resp.json()["candidates"][0]["content"]["parts"]
text = next((p["text"] for p in reversed(parts) if not p.get("thought", False)), "").strip()
```

**Gemini 재시도 로직** (`views.py` `report()` / `gu_report()` 공통):
- 무료 티어 rate limit(분당 2~10 요청) 때문에 재시도는 **최대 3회**만 수행
- 키 누락 시 5초 대기, 429(rate limit) 시 10초 대기
- 10회 이상 재시도하면 rate limit에 반드시 걸림 — 절대 늘리지 말 것
- 백엔드가 실패해도 프론트에서 최대 10회 재시도(3초 간격)하므로 전체 시도 횟수는 충분

---

## 보고서 패널 주요 구현

### 숫자 표시 포맷
매출·인구 수치는 조/억/만 단위 + 쉼표로 표시. `fmtEok` (매출), `fmtPop` (인구) 함수 사용.
- 1조 이상: `1조 2,345억`
- 1억 이상: `1,234억`
- 그 미만: `5,678만`

### 플로팅 패널 업종 선택기
보고서 생성 버튼 위에 업종 선택 드롭다운이 있음 (`reportCategory` state).
- 업종 선택 후 보고서 생성 → `&category=카페` 파라미터가 API에 자동 전달됨
- 보고서 패널 내부 드롭다운도 이 값으로 pre-populate됨
- 보고서 패널 내 드롭다운은 전체 51개 업종을 선택 가능 (`Object.keys(STARTUP_COSTS)`)

### AI 설명 재시도 로직 (프론트엔드)
보고서 fetch 후 필수 키가 없으면 자동 재시도 (`tryFetch(left)` 재귀 패턴):
- 초기 `left = 9` (최대 10회 시도), 3초 간격
- 재시도 소진 후에도 실패 시 `ai_descriptions.error` 주입 → "AI 설명을 불러오지 못했습니다" 메시지 + **다시 시도** 버튼 표시
- **다시 시도** 버튼:
  - `reportCategory`가 있으면 업종 분석만 재시도 (`setReportCategoryLoading`) — 기본 보고서 데이터 유지
  - `reportCategory`가 없으면 전체 보고서 재시도 (`setReportLoading`)
  - 로딩 중에는 버튼 → 스피너 + "재시도 중..." 으로 교체

### 로딩 단계별 문구 (`reportLoadingStep` state)
로딩 시간이 길어질수록 5초마다 문구 전환:
```
0: AI가 보고서를 작성하는 중입니다...
1: AI가 상권을 분석 중입니다...
2: AI가 데이터를 꼼꼼히 분석하고 있어요...
3: AI가 보고서를 정리 중입니다...
4: 곧 완성됩니다...
```

---

## 알려진 버그 및 미해결 이슈

### 1. 행정동 추천 빈 결과 4케이스 ⚠️ AI 파이프라인 재실행 필요
**원인**: `ScoreData`에 해당 행정동이 누락되어 교집합이 0이 됨.

| 구 | 업종 |
|----|------|
| 종로구 | 기타 B2B서비스 |
| 금천구 | 외국어학원 |
| 금천구 | 컴퓨터및주변장치판매 |
| 강동구 | 가방 |

**수정 방법**: 코드 수정으로 해결 불가. AI 스코어링 파이프라인 재실행 필요.
```bash
cd ai
python enrich_dong_dataset.py
python retrain_scores.py
# 이후 scores.csv를 DB에 다시 임포트
```

### 2. StreetScoreData에만 있는 업종
`전자상거래업`이 StreetScoreData에만 존재하고 STARTUP_COSTS에는 없음. 프론트 UI에서 선택 불가이므로 현재는 무해.

---

## 코드 탐색 팁

### 프론트엔드 주요 위치 (MapPage.jsx)
- `STARTUP_COSTS` 업종 목록: line 18
- `CATEGORY_GROUPS` 드릴다운 그룹: line 74
- State 선언부: line ~130
- `reportCategory` / `reportLoadingStep` state: line ~175
- 보고서 생성 UI + 업종 선택기 (플로팅 패널): line ~1790
- 보고서 생성 버튼 onClick (tryFetch 재시도 포함): line ~1820
- AI 추천 handleAiRecommend(): line ~1435
- 보고서 패널 렌더링 시작: line ~2632
- `retryReport` 함수 (다시 시도 버튼 핸들러): line ~2650
- `AiText` 컴포넌트 + 다시 시도 버튼: line ~2710
- 업종 심화분석 드롭다운 (전체 51개): line ~2850
- AI 모달 업종 선택 UI: line ~2980

### 백엔드 주요 위치 (views.py)
- `recommend_location()` (행정동 추천 핵심): line 560
- `recommend_gu_streets()` (길단위 상권 추천): line 1138
- `report()` (행정동 AI 보고서): line ~1850
- `gu_report()` (구 AI 보고서): line ~2025
- `_GU_CODE_MAP` (구명 ↔ 코드 매핑): line ~60

---

## 삭제된 컴포넌트 복원 코드

### 행정동 보기 / 구 보기 버튼
사이드바 하단에 있던 버튼 2개. 삭제 전 위치: MapPage.jsx 보고서 생성 버튼 바로 위.
복원 시 `{/* 이전 분석 보기 버튼 */}` 블록 바로 위에 삽입할 것.

```jsx
{/* 구 선택 시 행정동 보기 버튼 (행정동 선택 안 된 경우만) */}
{selectedGu && !selectedDong && (
  <button
    style={{ width: "100%", marginTop: 8, padding: "8px 0", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
    onMouseEnter={(e) => e.currentTarget.style.background = "#E5E7EB"}
    onMouseLeave={(e) => e.currentTarget.style.background = "#F3F4F6"}
    onClick={() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const group = guPolygonGroupsRef.current.find((g) => g.guName === selectedGu);
      if (group) smoothZoom(map, 6, () => map.panTo(new window.kakao.maps.LatLng(group.centroid.lat, group.centroid.lng)));
    }}
  >행정동 보기</button>
)}

{/* 구 보기 버튼 (행정동 선택 시만) */}
{selectedDong && (
  <button
    style={{ width: "100%", marginTop: 8, padding: "8px 0", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
    onMouseEnter={(e) => e.currentTarget.style.background = "#E5E7EB"}
    onMouseLeave={(e) => e.currentTarget.style.background = "#F3F4F6"}
    onClick={() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      setSelectedGu(selectedDong.guName);
      const panSeoul = () => map.panTo(new window.kakao.maps.LatLng(37.5665, 126.9780));
      if (map.getLevel() < GU_MODE_LEVEL) smoothZoom(map, 8, panSeoul);
      else panSeoul();
    }}
  >구 보기</button>
)}
```
