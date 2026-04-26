# 상권 분석 AI — Claude Code 작업 가이드

## 프로젝트 개요
서울 상권 데이터를 기반으로 창업 입지·업종을 추천하는 웹앱.
- **프론트엔드**: React 19 (Vite), `frontend-react/`
- **백엔드**: Django 5 REST API, `backend/`
- **AI 모델**: LightGBM (성장확률 예측), Gemini 2.5 Flash API (보고서 텍스트 생성)
- **지도**: Kakao Maps JS SDK (CDN)
- **DB**: PostgreSQL

---

## 서버 실행

### 백엔드 (포트 8000)
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
GEMINI_API_KEY=...
KAKAO_CLIENT_SECRET=...
KAKAO_REST_API_KEY=...
```
Django는 `backend/config/settings.py`에서 `load_dotenv(Path(__file__).resolve().parents[2] / ".env")`로 루트 `.env`를 로드한다.

### 프론트엔드 환경변수 (`frontend-react/.env`)
```
VITE_KAKAO_APP_KEY=...     ← Kakao Maps JS SDK 키
VITE_API_BASE=http://localhost:8000
```

---

## 전체 디렉토리 구조

```
commercial-area-analysis-ai/
├── .env                              # 환경변수
├── requirements.txt                  # Python 패키지
├── CLAUDE.md                         # 이 파일
│
├── backend/                          # Django REST API (포트 8000)
│   ├── manage.py
│   ├── config/
│   │   ├── settings.py               # DB, CORS, 앱 등록
│   │   ├── urls.py                   # URL 라우팅 (40개 엔드포인트)
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── analysis/                     # 상권 분석 핵심 앱
│   │   ├── models.py                 # 5개 DB 모델
│   │   ├── views.py                  # 40개 API 뷰 (~3,200줄)
│   │   ├── admin.py
│   │   └── management/commands/
│   │       ├── import_csv.py         # final_dataset.csv → CommercialData
│   │       ├── import_scores.py      # scores.csv → ScoreData
│   │       ├── import_store_info.py  # 상가정보 → StoreInfo
│   │       └── import_street_scores.py
│   │
│   ├── accounts/                     # 회원 인증 (JWT)
│   │   ├── models.py                 # User 커스텀 모델
│   │   ├── views.py                  # signup, login, me, logout 등
│   │   └── urls.py
│   │
│   ├── community/                    # 커뮤니티 게시판
│   │   ├── models.py                 # Post, Comment, Like
│   │   ├── views.py
│   │   └── urls.py
│   │
│   └── recommendation/               # 향후 확장용 (현재 미사용)
│
├── frontend-react/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env                          # VITE_KAKAO_APP_KEY, VITE_API_BASE
│   │
│   ├── public/                       # GeoJSON (지도 경계 데이터)
│   │   ├── seoul_gu.geojson          # 25개 구 경계
│   │   ├── seoul_hangjeongdong.geojson # 전체 행정동 경계
│   │   └── street_boundaries.geojson # 길단위 상권 경계
│   │
│   └── src/
│       ├── main.jsx                  # 앱 진입점 (React 19, BrowserRouter)
│       ├── App.jsx                   # 라우팅 레이아웃
│       ├── index.css
│       └── pages/
│           ├── MapPage.jsx           # 핵심 페이지 (~7,700줄)
│           ├── LoginPage.jsx         # 로그인 (JWT, 527줄)
│           ├── SignupPage.jsx        # 회원가입 (479줄)
│           ├── ProfilePage.jsx       # 프로필 (917줄)
│           ├── CommunityPage.jsx     # 게시판 (705줄)
│           ├── TrendPage.jsx         # 트렌드 분석 (지역별 필터 통합)
│           └── SocialCallbackPage.jsx # 카카오/네이버 소셜 로그인 콜백
│
├── ai/                               # AI/ML 파이프라인
│   ├── retrain_scores.py             # LightGBM 모델 재학습
│   ├── enrich_dong_dataset.py        # 행정동 데이터 보강
│   ├── enrich_street_dataset.py      # 상권 데이터 보강
│   ├── build_merged_dataset.py/.ipynb # 데이터 병합 + 피처 엔지니어링
│   ├── build_street_geojson.py       # 상권 경계 GeoJSON 생성
│   ├── category_map.ipynb            # 업종 카테고리 매핑
│   └── street_scores.py              # 상권별 AI 점수 계산
│
├── scripts/
│   ├── build_location_scores.py      # 위치 추천 점수 CSV 생성
│   ├── build_rental_data.py          # 임대료 JSON 생성 (행정동별)
│   └── build_gu_rental.py            # 임대료 JSON 생성 (구별)
│
├── crawling/
│   └── crawl_naver_place.py          # 네이버 플레이스 메뉴/가격 크롤링
│
└── data/
    ├── raw_data/                     # 공공데이터 원본 (GitHub 미포함)
    │   ├── BS_info/                  # 점포 정보 (연도별 CSV)
    │   ├── sales_info/               # 추정 매출
    │   ├── population_info/          # 유동인구
    │   ├── rent_info/                # 부동산 전월세가
    │   ├── rental_fee_info/          # 임대동향 (층별)
    │   ├── residential-population_info/
    │   ├── working-population_info/
    │   └── store_info/               # 소상공인 상가정보 (분기별)
    │
    ├── processed_data/
    │   ├── final_dataset.csv         # ML 학습 데이터 (210MB, 190K행)
    │   ├── scores.csv                # AI 예측 점수 (ScoreData 임포트용)
    │   ├── location_scores.csv       # 위치 추천 점수
    │   ├── rental_data.json          # 임대료 (행정동별)
    │   └── gu_rental.json            # 임대료 (구별)
    │
    └── category_maps/
        ├── categories.csv
        ├── sales_category_map.csv
        └── store_category_map.csv
```

---

## 핵심 파일 목록

| 파일 | 역할 |
|------|------|
| `frontend-react/src/pages/MapPage.jsx` | 메인 지도 페이지 (모든 핵심 UI) |
| `backend/analysis/views.py` | 40개 API 뷰 함수 (~3,200줄) |
| `backend/config/urls.py` | URL 라우팅 |
| `backend/analysis/models.py` | DB 모델 5개 |
| `backend/accounts/models.py` | 커스텀 User 모델 |
| `backend/community/models.py` | Post, Comment, Like |

---

## DB 모델 구조

### CommercialData (408,576행)
**행정동×업종×분기 상권 지표**

```python
기준_년분기_코드       # 20251 (2025년 1분기)
행정동코드             # 11680
행정동명               # "강남1동"
통합카테고리           # "카페" (51개 중 1개, 핵심 조인 키)

# 매출
당월매출합, 행정동_전체매출
매출_20대합 / 30대합 / ... / 60대이상합
남성매출합, 여성매출합, 매출_남성비율, 매출_여성비율

# 요일별 (월~일)
월요일매출합 ... 일요일매출합
월요일유동 ... 일요일유동

# 시간대별 (6개 구간: 00~06, 06~11, 11~14, 14~17, 17~21, 21~24)
시간대_00_06_매출, 시간대_00_06_유동, ...

# 인구
총_직장_인구_수, 직장_20대_인구, 주거인구
유동_10대 / 20대 / ... / 60대이상

# 점포
점포수, 행정동_전체점포수
개업_율_평균, 폐업_률_평균, 프랜차이즈_점포수

# 파생 지표 (계산됨)
업종_점포당매출        # 당월매출 / 점포수
업종_매출점유율        # 이 업종 매출 / 행정동 전체 매출
업종_포화도            # 점포수 / 유동인구
경쟁강도               # (다른 업종 점포) / 이 업종 점포
MZ_차이                # (20대 - 30대) 지표
유동대비매출, 점포대비유동

# Index: 행정동명, 행정동명+분기코드, 행정동명+통합카테고리
```

### ScoreData (15,025행)
**행정동×업종 AI 성장확률 점수 (최신 분기)**

```python
행정동명               # "강남1동"
통합카테고리           # "카페"
기준_년분기_코드
성장확률               # 0~100 (%)
업종내_순위
업종내_전체동수        # 이 업종이 존재하는 전체 행정동 수
상위_퍼센트            # 낮을수록 좋음 (0~100)
등급                   # "A" / "B" / "C" / "D"
```

### StreetScoreData (19,890행)
**길단위 상권×업종 AI 성장확률 점수**

```python
상권_코드              # 길단위상권 코드 (street_boundaries.geojson과 매핑)
상권_코드_명           # "강남로37길"
통합카테고리
기준_년분기_코드
성장확률               # 0~100
업종내_순위
업종내_전체상권수
상위_퍼센트
등급                   # A/B/C/D
```

### StreetCommercialData (20,816행)
**길단위 상권×업종 상권 지표 (최신 분기)**

```python
기준_년분기_코드
상권_코드, 상권_코드_명
통합카테고리
당월_매출_금액, 당월_매출_건수, 객단가
매출_증감률, 매출_주말비율, 매출_저녁비율
총_유동인구_수, 유동_증감률
월_평균_소득_금액, 지출_총금액
```

### StoreInfo (534,978행)
**개별 점포 정보 (소상공인 상가정보 원본)**

```python
상가업소번호           # unique per 분기
상호명
통합카테고리
상권업종소분류명       # 원본 분류명 (예: "전문커피점")
행정동명
도로명주소
위도, 경도
기준_년분기_코드
# unique_together: (상가업소번호, 기준_년분기_코드)
```

**핵심**: 모든 테이블에서 업종은 `통합카테고리` 컬럼으로 조인.

---

## 업종 카테고리 시스템

### 통합카테고리 (51개) — DB의 실제 값
```
PC방, 가방, 가전제품, 가전제품수리, 골프연습장, 기타 B2B서비스, 네일숍, 노래방,
당구장, 미곡판매, 미용실, 반찬가게, 베이커리/디저트, 분식/간식, 생활용품 소매,
섬유제품, 세탁소, 수산물판매, 숙박, 슈퍼마켓, 스포츠 강습, 스포츠클럽, 신발,
안경, 애완동물, 양식/기타외식, 예술학원, 외국어학원, 육류판매, 의료기기, 의약품,
인테리어, 일반교습학원, 일반의류, 일반의원, 일식, 자동차수리/미용, 주점, 중식,
청과상, 치과의원, 치킨전문점, 카페, 컴퓨터및주변장치판매, 패스트푸드, 편의점,
피부관리실, 한식, 한의원, 핸드폰, 화장품
```

### 프론트엔드 STARTUP_COSTS (MapPage.jsx line ~144)
- 51개 업종별 창업비용 정보 (인테리어_만원per평, 설비_집기_만원, 초기재고_만원, 보증금_배수, 관리비_만원per월, 원가율, 특이사항)
- 창업비용 계산기 + 업종 선택 드롭다운 모두 이 키를 사용
- **반드시 위 DB 통합카테고리 이름과 정확히 일치해야 함**

---

## API 엔드포인트 목록

### 상권 분석
| URL | 메서드 | 파라미터 | 설명 |
|-----|--------|----------|------|
| `/api/analysis/` | GET | `dong`, `quarter` | 행정동 상권 분석 (매출, 인구, 점포) |
| `/api/quarters/` | GET | `dong` | 행정동의 가용 분기 목록 |
| `/api/gu-analysis/` | GET | `gu`, `quarter` | 구 단위 상권 분석 |
| `/api/gu-quarters/` | GET | `gu` | 구의 가용 분기 |
| `/api/score/` | GET | `dong`, `category` | 행정동×업종 AI 점수 |
| `/api/score-all/` | GET | 필터 가능 | 전체 점수 조회 |

### AI 추천
| URL | 메서드 | 파라미터 | 설명 |
|-----|--------|----------|------|
| `/api/recommend/location/` | GET | `category`, `gu` | 업종+구 → Top 10 행정동 추천 |
| `/api/recommend/gu/` | GET | `gu` | 구 입력 → 추천 |
| `/api/recommend/industry/` | GET | `dong` | 행정동 → Top 5 업종 추천 |
| `/api/recommend/score/` | GET | `dong`, `category` | 행정동×업종 적합도 점수 |
| `/api/recommend/spot/` | GET | `dong`, `category` | 위치 추천 (지도 마커용) |
| `/api/recommend/gu-streets/` | GET | `gu`, `category` | 구+업종 → Top 5 길단위 상권 추천 |

### 보고서 생성
| URL | 메서드 | body | 설명 |
|-----|--------|------|------|
| `/api/report/` | POST | `dong`, `category` | 행정동 AI 보고서 (Gemini) |
| `/api/gu-report/` | POST | `gu`, `dongs[]`, `category` | 구 AI 보고서 (Gemini) |

### 트렌드
| URL | 메서드 | 파라미터 | 설명 |
|-----|--------|----------|------|
| `/api/trend/categories/` | GET | - | 전체 업종별 매출 증감률 (캐러셀용) |
| `/api/trend/gu-industries/` | POST | `gu`, `dongs[]` | 지역 인기 업종 순위. dongs에 구 전체 동 목록 → 구 단위, 동 1개 → 행정동 단위 |
| `/api/trend/weekday-industries/` | GET | `dongs` (선택, comma-separated) | 주중 매출 비율 높은 업종 순위. dongs 없으면 전국 |
| `/api/trend/weekend-industries/` | GET | `dongs` (선택, comma-separated) | 주말 매출 비율 높은 업종 순위. dongs 없으면 전국 |
| `/api/trend/age-breakdown/` | GET | `category` (선택), `dongs` (선택, comma-separated) | 연령대별 매출 비율. 둘 다 없으면 전국 전업종 |

### 비교 및 기타
| URL | 설명 |
|-----|------|
| `/api/compare/region/` | 행정동 비교 |
| `/api/compare/industry/` | 업종 비교 |
| `/api/suggest/industries/` | 전체 업종 목록 |
| `/api/suggest/industries-with-category/` | 창업비용 계산기용 업종 |
| `/api/rental/regions/` | 임대료 데이터 조회 |
| `/api/rental/calculate/` | 임대료 계산 |

### 회원 인증 (accounts/)
| URL | 메서드 | 설명 |
|-----|--------|------|
| `/api/accounts/signup/` | POST | 회원가입 |
| `/api/accounts/login/` | POST | 로그인 (JWT 발급) |
| `/api/accounts/token/refresh/` | POST | access 토큰 갱신 |
| `/api/accounts/me/` | GET | 내 정보 조회 |
| `/api/accounts/logout/` | POST | 로그아웃 |

---

## 프론트엔드 라우팅 (main.jsx)

```
/ → MapPage.jsx (메인, 지도 + 모든 기능)
/login → LoginPage.jsx
/signup → SignupPage.jsx
/profile → ProfilePage.jsx
/community → CommunityPage.jsx
/trend → TrendPage.jsx
/social-callback → SocialCallbackPage.jsx (카카오/네이버 소셜 로그인 콜백)
```

---

## MapPage.jsx 상세 (핵심 파일)

### 주요 상수/객체

| 상수 | 위치 | 설명 |
|------|------|------|
| `STARTUP_COSTS` | line ~144 | 51개 업종별 창업비용 정보 |
| `CALC_CAT_ICON` | line ~15 | 업종 → lucide-react 아이콘 매핑 |
| `CALC_CAT_COLOR` | line ~33 | 업종 → 색상 코드 매핑 |
| `DRILL_GROUPS` / `DRILL_GROUP_META` | - | 카테고리 드릴다운: 음식/소매/서비스 |
| `REGIONS` | - | 25개 서울 구 목록 |

### 주요 State 변수

```javascript
// 지도
mapReady              // Kakao Maps 로드 완료 여부
selectedGu            // 선택된 구 (예: "강남구")
selectedDong          // 선택된 행정동 객체 (dong_name, guName, centroid 등)
selectedCategory      // 선택된 업종 (예: "카페")

// 분석 결과
analysisData          // GET /api/analysis/ 결과
scoreList             // GET /api/score/ 결과 (업종별 점수 리스트)

// AI 추천
aiRecommendDongs      // 추천 행정동 리스트
aiRecommendStreets    // 추천 상권 리스트
aiScoreTab            // "종합" | "세부" | "개선" — score 패널 탭 상태
aiScoreSuggestions    // { regions: [], industries: [] } — score 패널 하단 추천 데이터

// 보고서
reportData            // 보고서 데이터 (Gemini 결과 포함)
reportLoading         // 보고서 로딩 중 여부
reportLoadingStep     // 0~4: 로딩 단계별 문구 전환 (5초마다)
reportCategory        // 심화분석용 업종 선택 (보고서 패널 내 드롭다운)
reportCategoryLoading // 업종 심화분석 재시도 로딩

// 기타
tooltipPos            // 지도 마우스오버 툴팁 위치
```

### 주요 함수

| 함수 | 위치 | 설명 |
|------|------|------|
| `handleAiRecommend()` | line ~1435 | 구+업종 → AI 추천 (병렬 호출) |
| `tryFetch(left)` | line ~1820 | 보고서 재시도 (재귀, left=9) |
| `retryReport()` | line ~2650 | "다시 시도" 버튼 핸들러 |
| `fmtEok()` | line ~250 | 매출 숫자 포맷 (조/억/만) |
| `fmtPop()` | line ~260 | 인구 숫자 포맷 |
| `smoothZoom()` | - | 카카오맵 부드러운 줌 |
| `_get_dong_centroids()` (백엔드) | views.py ~101 | 행정동 centroid 계산 |

### UI 구성

1. **Kakao Maps 지도** (메인 영역)
   - 구 폴리곤: `seoul_gu.geojson`
   - 행정동 폴리곤: `seoul_hangjeongdong.geojson`
   - 상권 폴리곤: `street_boundaries.geojson`
   - 마커: 추천 위치 (카카오 키워드 검색)

2. **사이드바 (좌측)**
   - 구/행정동 선택 드롭다운
   - 업종 선택 드롭다운
   - 보고서 생성 버튼 + 업종 선택기 (`reportCategory`)
   - 트렌드, 비교 분석 탭

3. **AI 추천 모달**
   - "gu" 모드: 구+업종 → 행정동+상권 추천
   - "dong" 모드: 행정동+업종 → 추천
   - "score" 모드: 행정동×업종 → 적합도 상세 분석 (3탭 + 하단 추천 스트립)
   - 결과: 행정동 탭 + 길단위 상권 탭

4. **보고서 패널 (우측 플로팅)**
   - 기본 정보: 행정동, 업종, 매출, 인구
   - AI 설명 (Gemini)
   - 업종 심화분석 드롭다운 (전체 51개)
   - "다시 시도" 버튼 (실패 시 표시)

### 보고서 패널 코드 위치

| 항목 | 위치 |
|------|------|
| 보고서 생성 UI + 업종 선택기 | line ~1790 |
| 보고서 생성 버튼 onClick (tryFetch) | line ~1820 |
| 보고서 패널 렌더링 시작 | line ~2632 |
| `retryReport` 함수 | line ~2650 |
| `AiText` 컴포넌트 + 다시 시도 버튼 | line ~2710 |
| 업종 심화분석 드롭다운 | line ~2850 |
| AI 모달 업종 선택 UI | line ~2980 |

---

## TrendPage.jsx 상세

### 공유 지역 State
TrendPage의 세 섹션(인기 업종 / 업종별 매출 순위 / 연령대별 매출 비율)은 아래 3개 state를 공유한다.
지역 선택 UI는 **"인기 업종" 섹션 헤더에만** 있고, 아래 두 섹션은 자동으로 연동된다.

| state | 타입 | 설명 |
|-------|------|------|
| `regionMode` | `"구"` \| `"동"` | 구 단위 / 행정동 단위 토글 |
| `regionGu` | string | 선택된 구 (예: "강남구") |
| `regionDong` | string | 선택된 행정동. `regionMode="동"`일 때만 유효 |

### 주요 컴포넌트 (TrendPage 내부)
| 컴포넌트 | 설명 |
|----------|------|
| `GuDropdown` | 25개 서울 구 드롭다운 |
| `DongDropdown` | 선택된 구의 행정동 드롭다운. `regionMode="동"`일 때만 표시 |
| `AgeCategoryDropdown` | 51개 업종 드롭다운 (연령대별 섹션 업종 필터용) |

### 섹션 구성 및 데이터 흐름
```
1. 업종별 트렌드 캐러셀        → /api/trend/categories/  (전국 고정, 지역 무관)
2. 인기 업종                   → /api/trend/gu-industries/ (POST, dongs[] 전송)
   ← 지역 선택 UI (regionMode/regionGu/regionDong) — 이 3개 state가 아래 섹션에도 공유됨
3. 업종별 매출 순위 (주중/주말) → /api/trend/weekday|weekend-industries/?dongs=...
4. 연령대별 매출 비율           → /api/trend/age-breakdown/?dongs=...&category=...
```

### 지역 필터 API 호출 패턴
```javascript
// 구 모드: 해당 구의 모든 동 목록을 comma-separated로 전송
const dongs = regionMode === "구" ? guToDongs[regionGu] : [regionDong];
const dongsParam = dongs.join(",");

// gu-industries: POST body
{ gu: regionGu, dongs }

// weekday/weekend/age-breakdown: GET query
`?dongs=${encodeURIComponent(dongsParam)}`
```

### 섹션별 타이틀 패턴
- 인기 업종: `${regionGu}의 인기 업종` / `${regionDong}의 인기 업종`
- 업종별 매출 순위: `${regionGu}의 업종별 매출 순위` / `${regionDong}의 업종별 매출 순위`
- 연령대별 매출 비율: `${regionGu}의 연령대별 매출 비율` / `${regionDong}의 연령대별 매출 비율`

---

## 주요 기능 흐름

### 구·업종 → 상권 추천 (AI 모달 "gu" 모드)
```
사용자: 구 선택(강남구) + 업종 선택(카페)
    ↓
프론트 handleAiRecommend()
    ↓ 병렬 호출
  ① GET /api/recommend/location/?category=카페&gu=강남구
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
행정동: POST /api/report/  body={dong, category(선택)}
구:     POST /api/gu-report/  body={gu, dongs[], category(선택)}
    ↓
백엔드: CommercialData 집계 → Gemini API (HTTP REST) → AI 텍스트 생성
    ↓
보고서 패널 표시 (secondPanelStyle)
```

---

## Gemini API 호출 방식

**중요**: `google-generativeai` SDK는 gRPC DNS 문제로 hang 발생. 반드시 HTTP REST로만 호출.

```python
import requests as http_requests

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
resp = http_requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=60)

# ⚠️ gemini-2.5-flash는 thinking 모델
# parts[]에 thought 파트가 먼저 올 수 있음
# parts[0]으로 읽으면 내부추론 텍스트를 가져오는 경우 있음
# 반드시 reversed()로 마지막 non-thought 파트를 읽어야 함
parts = resp.json()["candidates"][0]["content"]["parts"]
text = next((p["text"] for p in reversed(parts) if not p.get("thought", False)), "").strip()
```

### Gemini 재시도 로직 (views.py `report()` / `gu_report()` 공통)
- 무료 tier rate limit (분당 2~10 요청)
- **백엔드**: 최대 3회 재시도 (키 누락 시 5초 대기, 429 시 10초 대기)
- **프론트**: 최대 10회 재시도 (3초 간격, `tryFetch(left=9)` 재귀 패턴)
- 10회 이상 백엔드 재시도하면 rate limit에 반드시 걸림 — 절대 늘리지 말 것

---

## 보고서 패널 주요 구현 세부사항

### 숫자 표시 포맷
`fmtEok` (매출), `fmtPop` (인구) 함수 사용.
- 1조 이상: `1조 2,345억`
- 1억 이상: `1,234억`
- 그 미만: `5,678만`

### AI 설명 재시도 로직 (프론트엔드)
보고서 fetch 후 필수 키가 없으면 자동 재시도:
- 초기 `left = 9` (최대 10회 시도), 3초 간격
- 모든 재시도 소진 시 `ai_descriptions.error` 주입 → "AI 설명을 불러오지 못했습니다" + **다시 시도** 버튼
- **다시 시도** 버튼:
  - `reportCategory` 있으면 업종 분석만 재시도 (`setReportCategoryLoading`) — 기본 보고서 데이터 유지
  - `reportCategory` 없으면 전체 보고서 재시도 (`setReportLoading`)
  - 로딩 중: 버튼 → 스피너 + "재시도 중..."

### 로딩 단계별 문구 (`reportLoadingStep` state)
5초마다 전환:
```
0: AI가 보고서를 작성하는 중입니다...
1: AI가 상권을 분석 중입니다...
2: AI가 데이터를 꼼꼼히 분석하고 있어요...
3: AI가 보고서를 정리 중입니다...
4: 곧 완성됩니다...
```

---

## 회원 시스템 (accounts/)

### User 커스텀 모델 (AbstractUser 확장)
```python
email           # unique, 선택
nickname        # max 50자
profile_image   # URLField
kakao_id        # 카카오 소셜 로그인 ID
naver_id        # 네이버 소셜 로그인 ID
login_type      # 'local' / 'kakao' / 'naver'
birth_date      # DateField, 선택
created_at      # 자동 생성
```

### 인증 방식
- JWT (djangorestframework-simplejwt)
- 토큰 블랙리스트 사용 (로그아웃 시 access 토큰 무효화)
- localStorage에 `access` / `refresh` 토큰 저장

---

## 커뮤니티 게시판 (community/)

### 모델
```python
# Post
board       # 'free'(자유) / 'info'(정보) / 'notice'(공지)
title       # max 100자
content     # TextField
image       # TextField (Base64 인코딩)
author      # ForeignKey(User)
view_count  # 조회수

# Comment
post, author, content, created_at

# Like
post, user
# unique_together: (post, user)
```

---

## 백엔드 views.py 주요 함수 위치

| 함수 | 위치 | 설명 |
|------|------|------|
| `_GU_CODE_MAP` | line ~60 | 구명 ↔ 행정동코드 범위 매핑 |
| `_get_street_centroids()` | line ~64 | 상권코드 → centroid 매핑 |
| `_get_dong_centroids()` | line ~101 | 행정동명 → centroid + bbox |
| `normalize_dong()` | line ~251 | 행정동명 정규화 (가운뎃점 처리) |
| `_get_location_df()` | line ~226 | location_scores.csv 메모리 캐시 |
| `analysis()` | line ~275 | 행정동 상권 분석 |
| `score()` | line ~600 | 행정동×업종 AI 점수 |
| `recommend_location()` | line ~560 | 업종+구 → Top 10 행정동 추천 |
| `recommend_gu_streets()` | line ~1138 | 구+업종 → Top 5 상권 추천 |
| `report()` | line ~1850 | 행정동 AI 보고서 생성 |
| `gu_report()` | line ~2025 | 구 AI 보고서 생성 |

---

## AI/ML 파이프라인

### 모델 사양 (retrain_scores.py)
- **모델**: LightGBM (500 estimators, balanced class weight)
- **문제 유형**: 이진 분류 (다음 분기 매출 성장 여부)
- **학습 기간**: 2020Q1 ~ 2025Q1 (23개 분기, ~170K 샘플)
- **피처 수**: 41개 (유동인구 변화율, 나이별 매출, 시간대별 비율, 개업률 등)
- **AUC-ROC**: 0.657 (현재)
- **출력**: `scores.csv` → DB `import_scores` 커맨드로 임포트

### 재학습 절차
```bash
cd ai
python enrich_dong_dataset.py      # 행정동 데이터 보강
python retrain_scores.py           # LightGBM 재학습 → scores.csv 생성
cd ../backend
python manage.py import_scores     # DB에 임포트
```

### 관리 커맨드 (analysis/management/commands/)
```bash
python manage.py import_csv              # final_dataset.csv → CommercialData
python manage.py import_scores           # scores.csv → ScoreData
python manage.py import_store_info       # 상가정보 → StoreInfo
python manage.py import_street_scores    # 상권 점수 → StreetScoreData/StreetCommercialData
```

---

## GeoJSON 파일 (frontend-react/public/)

### seoul_gu.geojson
- 25개 서울 구 경계 (Polygon/MultiPolygon)
- 속성: `시군구명` (구 이름)
- 용도: 구 단위 지도 폴리곤 표시

### seoul_hangjeongdong.geojson
- 전체 행정동 경계
- 속성: `dong_name` (행정동명)
- 용도: 행정동 폴리곤 표시 + centroid 계산 (`_get_dong_centroids()`)

### street_boundaries.geojson
- 길단위 상권 경계
- 속성: `상권_코드`, `상권_코드_명`, `시군구명`, `행정동명`
- 용도: 상권 폴리곤 표시, 구→상권 코드 매핑 (`_get_gu_street_map()`, `_get_street_centroids()`)

---

## 프리미엄 AI 추천 — 추가 구현 기능

### 생존율 추정 카드 (왼쪽 패널)
- 상수: `SURVIVAL_RATES` (MapPage.jsx line ~210) — 51개 업종별 1년/3년/5년 생존율 (소상공인진흥공단 통계 기반)
- AI 등급(A/B/C/D)에 따라 전국 평균 대비 ±%p 보정 표시 (A: +8, B: +3, C: 0, D: -5)
- 표시 위치: 프리미엄 결과 "gu" 타입 왼쪽 패널, 예산 카드 아래

### 재무 추정 카드 (왼쪽 패널) — TOP 1위 행정동 기준
- 상수: `KEY_MONEY_MONTHS` (MapPage.jsx line ~265) — 업종별 권리금 배수 (월매출 기준 개월 수)
- `calcRightFee(category, totalSales, storeCount)` — 권리금 = (당월매출합/점포수) × 업종별_배수
- `calcROI(category, totalSales, storeCount)` — 월순익 = 점포당매출 - 원가 - 임대료(10%) - 인건비(최저임금 1명) - 관리비
- 손익분기점 = 총창업비용 / 월순익 (개월)
- 데이터: `당월매출합`, `점포수`는 기존 `/api/recommend/location/` 응답에 포함 (백엔드 수정 없음)

### 권리금/ROI 뱃지 (오른쪽 행정동 카드)
- 각 행정동 카드 하단에 "권리금 약 X만원 · 월순익 +X만원" 인라인 표시

### Q4 상권 선호도 (프리미엄 모달 4번째 질문)
- 상수: `PREFERENCE_WEIGHTS` (MapPage.jsx) — 5가지 선호도별 가중치 테이블
- State: `premiumPreference` — `{ key, icon, title, desc }` 구조
- 위저드 흐름: q1 → q2 → q3 → **q4** → result (fetch는 q4 "분석 시작" 버튼에서 실행)
- 선호도 5종:
  | key | 성장 | 경쟁 | 유동 | 포화 |
  |-----|------|------|------|------|
  | 안정 | 30% | 40% | 15% | 15% |
  | 수익 | 25% | 15% | 40% | 20% |
  | 성장 | 65% | 15% | 10% | 10% |
  | 블루오션 | 20% | 45% | 10% | 25% |
  | 균형(상관없음) | 40% | 30% | 15% | 15% |
- 결과 헤더에 선택한 선호도 뱃지 표시
- **재점수 방식** (`gu` 타입, 클라이언트사이드):
  - "균형" 선택 시: `limit=10`으로 백엔드 기본 결과 그대로 사용
  - 나머지 선택 시: `limit=30`으로 30개 후보를 받아 선호도 가중치로 재점수·재정렬 후 상위 10개 표시
  - 재점수 공식: `w.성장 × 성장확률 + w.경쟁 × (1-경쟁강도) × 100 + w.유동 × (유동/maxPop) × 100 + w.포화 × (1-포화도/maxSat) × 100`
- **백엔드**: `recommend_location()`에 `limit` 파라미터 추가 (기본 10, 최대 50)

### 배달·오프라인 비중 카드 (왼쪽 패널)
- 상수: `DELIVERY_RATIO` (MapPage.jsx) — 51개 업종별 배달 매출 비중 (%)
- 세그먼트 바 + 라벨 (배달 중심 / 혼합 / 오프라인 중심 / 오프라인 전용) 표시
- gu/dong 타입 모두 적용

### 네이버 검색 트렌드 카드 (왼쪽 패널)
- 백엔드: `GET /api/trend/naver/?category=카페` → 네이버 데이터랩 검색어 트렌드 API 호출
- `_NAVER_TREND_KEYWORDS` (views.py) — 업종별 검색 키워드 매핑 (27개 업종)
- 프론트: `premiumNaverTrend` state, useEffect로 result 단계 진입 시 자동 fetch
- SVG 스파크라인 차트 + 상승/하락/유지 트렌드 레이블
- gu/dong 타입 모두 적용 (gu: `trendGrad`, dong: `trendGradDong` gradient ID 구분)
- 키워드 미등록 업종이나 API 오류 시 카드 미노출 (graceful hide)

### 프리미엄 결과 왼쪽 패널 3탭 구조 (결과 화면 정리)
결과 화면 좌측 패널이 카드 10개로 난잡해져 3탭으로 분리함.

- **State**: `premiumLeftTab` — `"기본"` | `"수익"` | `"트렌드"` (기본값 `"기본"`)
- **리셋**: `setPremiumStep("result")` 직후 `setPremiumLeftTab("기본")` 호출
- **탭 스트립**: 3버튼 underline 스타일, 선택된 탭 파란 텍스트 + 하단 2px 파란 border

| 탭 key | 표시 레이블 | 포함 카드 |
|--------|------------|-----------|
| 기본 | 종합 점수 | 종합 AI 점수 게이지, 핵심지표 2×2, 등급 분포, 예산, 소분류 안내 |
| 수익 | 수익 예측 | 생존율 추정, 재무 추정 (권리금·ROI·손익분기) |
| 트렌드 | 트렌드 | 배달·오프라인 비중, 네이버 검색 트렌드 |

- **gu 타입**: 3탭 구조 완전 구현 + 하단 "이런 지역은 어때요?" 스크롤 스트립
- **dong 타입**: 3탭 구조 완전 구현 + 하단 "이런 상권은 어때요?" 스크롤 스트립
- 각 탭에서 데이터 없을 시 fallback 메시지 표시 ("데이터가 없습니다")
- gu 타입 우측 행정동 카드: 권리금 뱃지 제거, 월순익만 stats 행에 인라인 통합 (더 깔끔)

### `aiMode === "score"` 패널 3탭 구조 (행정동×업종 적합도 상세)
- **State**: `aiScoreTab` — `"종합"` | `"세부"` | `"개선"` (기본값 `"종합"`)
- **탭 스트립**: underline 스타일 (프리미엄과 동일)

| 탭 key | 표시 레이블 | 내용 |
|--------|------------|------|
| 종합 | 종합 점수 | 136px SVG 링 게이지 + AI 등급 + summary + 2×2 지표 그리드 |
| 세부 | 세부 지표 | breakdown 항목별 바 + 수치 + 양호/보통/미흡 뱃지 + **부가설명** |
| 개선 | 개선·주의사항 | 강점(✓ 초록) / 주의점(! 주황) 태그 목록 |

- **세부 지표 부가설명**: `BREAKDOWN_DESC` 정적 객체로 각 지표에 회색 설명 텍스트 표시
  - 성장 추세: "AI가 예측한 다음 분기 매출 성장 가능성입니다."
  - 매출 잠재력: "해당 행정동 업종의 월평균 매출 수준입니다."
  - 유동인구: "상권 내 유동인구 밀도 및 규모입니다."
  - 경쟁 우위: "주변 경쟁 점포 대비 유리한 환경인지 나타냅니다."
  - 소득 수준: "상권 내 직장인·주거 인구의 소득 수준입니다."
- **하단 스트립**: 결과 도착 후 백그라운드로 2개 API 병렬 fetch
  - `이런 지역은 어때요?` — `/api/recommend/location/?업종=...&gu=...` (polygonGroupsRef로 구명 조회)
  - `이런 업종은 어때요?` — `/api/recommend/industry/?dong=...`
  - 두 스트립 모두 클릭 시 해당 항목으로 score 분석 재실행

### 기타 버그 수정
- **지도에서 선택하기 모드 중 왼쪽 보고서 카드 숨김**: `!reportOpen && !premiumMapPickMode` 조건으로 카드 전체 숨김 (MapPage.jsx)

---

## 알려진 버그 및 미해결 이슈

### 1. 행정동 추천 빈 결과 4케이스 (AI 파이프라인 재실행 필요)
**원인**: `ScoreData`에 해당 행정동×업종 조합이 없어 교집합이 0이 됨.

| 구 | 업종 |
|----|------|
| 종로구 | 기타 B2B서비스 |
| 금천구 | 외국어학원 |
| 금천구 | 컴퓨터및주변장치판매 |
| 강동구 | 가방 |

**해결**: 코드 수정으로 해결 불가. AI 파이프라인 재실행 필요.
```bash
cd ai
python enrich_dong_dataset.py
python retrain_scores.py
cd ../backend
python manage.py import_scores
```

### 2. StreetScoreData에만 있는 업종
`전자상거래업`이 StreetScoreData에만 존재하고 STARTUP_COSTS에는 없음. UI에서 선택 불가이므로 현재 무해.

---

## 기술 스택

| 분야 | 기술 |
|------|------|
| 프론트엔드 | React 19, Vite, React Router 7 |
| UI 라이브러리 | Lucide React (아이콘), Framer Motion (애니메이션), canvas-confetti |
| 지도 | Kakao Maps JS SDK (CDN) |
| 백엔드 | Django 5, Django REST Framework |
| 인증 | djangorestframework-simplejwt (JWT + 블랙리스트) |
| DB | PostgreSQL |
| AI/ML | LightGBM, scikit-learn |
| 데이터 처리 | Pandas, NumPy, SciPy |
| GIS | Shapely, GeoJSON |
| 외부 API | Gemini 2.5 Flash (AI 텍스트), Kakao REST API (소셜 로그인), Naver API (소셜 로그인) |

---

## 삭제된 컴포넌트 복원 코드

### 행정동 보기 / 구 보기 버튼
사이드바 하단에 있던 버튼 2개. 복원 시 `{/* 이전 분석 보기 버튼 */}` 블록 바로 위에 삽입.

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
