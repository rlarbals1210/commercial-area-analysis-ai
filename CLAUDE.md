# 상권 분석 AI — Claude Code 작업 가이드

## 프로젝트 개요
서울 상권 데이터를 기반으로 창업 입지·업종을 추천하는 웹앱.
- **프론트엔드**: React (Vite), `frontend-react/`
- **백엔드**: Django REST API, `backend/`
- **AI 모델**: LightGBM (성장확률 예측), Gemini API (보고서 텍스트 생성)
- **지도**: Kakao Maps JS SDK

---

## 서버 실행

### 백엔드 (포트 **8001**)
```bash
cd backend
python manage.py runserver 8001
```
> **주의**: 포트는 반드시 8001. 8000으로 실행 시 AI 추천 기능 중 일부만 작동함.
> 프론트에서 8000을 쓰는 엔드포인트가 일부 남아있음 (아래 미해결 이슈 참고).

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
| `frontend-react/src/pages/MapPage.jsx` | 메인 지도 페이지 (약 4600줄, 모든 UI 포함) |
| `backend/analysis/views.py` | 모든 API 뷰 (약 2100줄) |
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

### 프론트엔드 `STARTUP_COSTS` (MapPage.jsx 18번째 줄)
- 창업비용 계산기 + 업종 선택 드롭다운에서 사용하는 키
- **반드시 위 DB 통합카테고리 이름과 정확히 일치해야 함**
- 이전에 `일반학원`이 잘못 들어가 있었고 제거 완료 (`일반교습학원`이 정확한 이름)

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
| `POST /api/report/` | GET | 행정동 AI 보고서 생성 |
| `POST /api/gu-report/` | POST | 구 AI 보고서 생성 |
| `GET /api/trend/categories/` | GET | 트렌드 카테고리 |

---

## 주요 기능 흐름

### 구·업종 → 상권 추천 (AI 모달 "gu" 모드)
```
사용자: 구 선택(강남구) + 업종 선택(카페)
    ↓
프론트 handleAiRecommend() — MapPage.jsx:1498
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
resp = http_requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=30)
text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
```

---

## 알려진 버그 및 미해결 이슈

### 1. 행정동 추천 빈 결과 4케이스 ⚠️ AI 파이프라인 재실행 필요
**현상**: "구·업종 → 상권 추천"에서 아래 4가지 조합을 선택하면 행정동 탭에 결과가 없고 길단위 상권 탭에만 결과가 뜸.

**원인**: `ScoreData`(AI 성장확률 테이블)에 해당 행정동이 누락되어 있음.
`recommend_location()` 내부에서 `ScoreData × CommercialData` 교집합을 구하는데, ScoreData에 행정동이 없으면 교집합이 0이 됨.

| 구 | 업종 | CommercialData | ScoreData |
|----|------|----------------|-----------|
| 종로구 | 기타 B2B서비스 | `숭인2동` 1건 있음 | `숭인2동` 없음 |
| 금천구 | 외국어학원 | 1건 있음 | 해당 행정동 없음 |
| 금천구 | 컴퓨터및주변장치판매 | 1건 있음 | 해당 행정동 없음 |
| 강동구 | 가방 | 1건 있음 | 해당 행정동 없음 |

**수정 방법**: 코드 수정으로 해결 불가. AI 스코어링 파이프라인을 재실행해서 ScoreData를 재생성해야 함.
```bash
# 행정동 데이터 재보강 후 점수 재계산
cd ai
python enrich_dong_dataset.py   # CommercialData 기반으로 피처 재생성
python retrain_scores.py        # LightGBM 재학습 → scores.csv 생성
# 이후 scores.csv를 DB에 다시 임포트
```
> 재실행 전 `ai/` 폴더의 README 및 스크립트 상단 주석 확인 필요.

현재는 빈 결과 대신 안내 메시지가 표시되도록 프론트 처리는 되어 있음 (`aiGuDongError` state, MapPage.jsx:180).

---

### 2. 포트 불일치 (행정동 추천 empty 문제와 무관한 별개 버그)
`MapPage.jsx`에서 일부 API 호출이 8000, 일부가 8001을 사용 중. 행정동 추천 empty 문제와는 **완전히 별개**의 오래된 버그임.
```
8000 사용 (잘못됨):
  - recommend/location/ (line ~1502)
  - recommend/gu-streets/ (line ~1503)
  - suggest/industries-with-category/ (line ~2937)
  - 기타 여러 곳

8001 사용 (올바름):
  - report/ API
  - gu-report/ API
```
**수정 방법**: `MapPage.jsx` 전체에서 `http://localhost:8000/` → `http://localhost:8001/`로 일괄 치환.
```bash
# 확인
grep -n "localhost:8000" frontend-react/src/pages/MapPage.jsx | wc -l
# 치환
sed -i '' 's|http://localhost:8000/|http://localhost:8001/|g' frontend-react/src/pages/MapPage.jsx
```

### 3. StreetScoreData에만 있는 업종
`전자상거래업`이 StreetScoreData에만 존재하고 STARTUP_COSTS에는 없음. 프론트 UI에서 선택 불가이므로 현재는 무해.

---

## 최근 완료된 작업 (인계 전)

1. **보고서 생성 기능 추가** (`/api/report/`, `/api/gu-report/`)
   - 사이드바를 차트 UI 대신 "보고서 생성하기" 인터페이스로 교체
   - Gemini 2.5 Flash API로 AI 텍스트 생성
   - 행정동/구 모두 지원, 업종 선택 시 심화 분석(6섹션) 포함

2. **구 단위 업종 선택 지원**
   - 보고서와 구 추천 모두 업종 선택 가능하게 수정
   - `gu-report` API에 `category` 파라미터 추가

3. **`일반학원` 카테고리 오류 수정**
   - `STARTUP_COSTS`에 DB에 없는 `일반학원`이 있었음 → 제거
   - `일반교습학원`(DB 실제 이름)이 이미 있었으므로 중복 제거로 해결

4. **에러 처리 개선**
   - 행정동 추천 실패 시 조용히 빈 탭 표시하던 문제 → 안내 메시지 표시로 변경
   - `aiGuDongError` state 추가 (MapPage.jsx:180)

---

## 코드 탐색 팁

### 프론트엔드 주요 위치 (MapPage.jsx)
- `STARTUP_COSTS` 업종 목록: line 18
- `CATEGORY_GROUPS` 드릴다운 그룹: line 74
- State 선언부: line 130~230
- 보고서 생성 UI (사이드바): line 1769
- AI 추천 handleAiRecommend(): line 1435
- AI 모달 gu 모드 실행 로직: line 1498
- 보고서 패널 렌더링: line 2597
- AI 모달 업종 선택 UI: line 2917
- 행정동 추천 결과 탭: line 3190

### 백엔드 주요 위치 (views.py)
- `recommend_location()` (행정동 추천 핵심): line 560
- `recommend_gu_streets()` (길단위 상권 추천): line 1138
- `report()` (행정동 AI 보고서): line 1865
- `gu_report()` (구 AI 보고서): line 2011
- `_GU_CODE_MAP` (구명 ↔ 코드 매핑): line ~60 근처
- `STORE_TO_COMMERCIAL_CAT` (빈 dict, 현재 미사용): line 107
