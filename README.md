# 서울 상권 분석 AI

서울 행정동 기준 상권 데이터를 분석하여 창업 업종 및 지역을 추천하는 AI 서비스입니다.

---

## 프로젝트 개요

공공데이터(서울시 추정 매출, 유동인구, 상가 정보)를 기반으로 **다음 분기 매출 성장 가능성**을 예측합니다.

- **업종 선택 → 행정동 추천**: 특정 업종 창업에 적합한 행정동 TOP N
- **행정동 선택 → 업종 추천**: 해당 행정동에서 다음 분기 성장 가능성이 높은 업종 TOP 5

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| AI/ML | scikit-learn (RandomForestClassifier), pandas, numpy |
| 백엔드 | Django 5, Django REST Framework |
| 프론트엔드 | React 19, Vite |
| 데이터 | 서울 공공데이터포털, 소상공인시장진흥공단 |

---

## 사전 요구사항

- Python **3.11** (`.python-version` 파일 기준)
- Node.js **18+**
- pip, venv 또는 pyenv
- Jupyter Notebook / JupyterLab (데이터 전처리용)

---

## 프로젝트 구조

```
commercial-area-analysis-ai/
├── ai/                                 # AI/ML 전처리 및 모델 학습
│   ├── build_merged_dataset.ipynb      # 데이터 병합 → final_dataset.csv 생성
│   ├── category_map.ipynb              # 업종 카테고리 매핑 테이블 생성
│   └── retrain_scores.py               # 모델 재학습 및 scores.csv 생성
│
├── backend/                            # Django REST API
│   ├── manage.py
│   ├── config/                         # Django 설정 (settings.py, urls.py)
│   ├── accounts/                       # 회원 관리
│   ├── analysis/                       # 상권 분석 API, DB 임포트 커맨드
│   └── recommendation/                 # 추천 API
│
├── crawling/                           # 네이버 플레이스 크롤러
│   ├── crawl_naver_place.py
│   └── crawl_watch.sh
│
├── scripts/                            # 보조 데이터 빌드 스크립트
│   ├── build_location_scores.py        # location_scores.csv 생성
│   ├── build_rental_data.py            # rental_data.json 생성
│   └── build_gu_rental.py              # gu_rental.json 생성
│
├── frontend-react/                     # React + Vite 프론트엔드
│   ├── package.json
│   └── src/
│       └── pages/
│           ├── MapPage.jsx             # 지도 기반 상권 조회
│           ├── LoginPage.jsx
│           └── SignupPage.jsx
│
├── data/                               # 로컬 전용 — GitHub 미포함 (307MB+)
│   ├── raw_data/                       # 공공데이터 원본 CSV
│   ├── processed_data/                 # 전처리 완료 데이터
│   ├── category_maps/                  # 업종 카테고리 매핑 테이블
│   └── logs/                           # 크롤링 로그
│
├── .env                                # 백엔드 환경변수 (비공개)
├── requirements.txt                    # Python 의존성
└── README.md
```

---

## 환경변수 설정

### 백엔드 — `.env` (루트 디렉토리)

```
NAVER_CLIENT_ID=<네이버 API 클라이언트 ID>
NAVER_CLIENT_SECRET=<네이버 API 클라이언트 시크릿>
DB_PW=<PostgreSQL 비밀번호 (SQLite 사용 시 불필요)>
```

### 프론트엔드 — `frontend-react/.env`

```
VITE_KAKAO_APP_KEY=<카카오 지도 앱 키>
```

> API 키는 팀원에게 별도로 전달받으세요.

---

## 데이터 준비 (필수)

`data/` 폴더는 GitHub에 포함되지 않습니다. 아래 안내에 따라 직접 다운로드 후 **동일한 경로**에 위치시켜야 합니다.

### 폴더 구조 생성

```bash
mkdir -p data/raw_data/BS_info
mkdir -p data/raw_data/sales_info
mkdir -p data/raw_data/population_info
mkdir -p data/raw_data/rent_info
mkdir -p data/raw_data/rental_fee_info
mkdir -p data/raw_data/residential-population_info
mkdir -p data/raw_data/working-population_info
mkdir -p data/raw_data/store_info
mkdir -p data/processed_data
mkdir -p data/category_maps
mkdir -p data/logs
```

---

### 1. 서울시 상권분석서비스 — 점포 (행정동) `data/raw_data/BS_info/`

**출처**: [서울 열린데이터광장](https://data.seoul.go.kr) → 검색: `서울시 상권분석서비스(점포-행정동)`

다운로드 후 아래 파일명으로 저장:

```
data/raw_data/BS_info/
├── 서울시_상권분석서비스(점포-행정동)_2019년.csv
├── 서울시_상권분석서비스(점포-행정동)_2020년.csv
├── 서울시_상권분석서비스(점포-행정동)_2021년.csv
├── 서울시_상권분석서비스(점포-행정동)_2022년.csv
├── 서울시 상권분석서비스(점포-행정동)_2023년.csv
├── 서울시 상권분석서비스(점포-행정동)_2024년.csv
└── 서울시_상권분석서비스(점포-행정동)_2025년.csv
```

---

### 2. 서울시 추정 매출 `data/raw_data/sales_info/`

**출처**: [서울 열린데이터광장](https://data.seoul.go.kr) → 검색: `서울시 상권분석서비스 추정매출`

```
data/raw_data/sales_info/
├── 매출_2019.csv
├── 매출_2020.csv
├── 매출_2021.csv
├── 매출_2022.csv
├── 매출_2023.csv
├── 매출_2024.csv
└── 매출_2025.csv
```

---

### 3. 서울시 유동인구 `data/raw_data/population_info/`

**출처**: [서울 열린데이터광장](https://data.seoul.go.kr) → 검색: `서울시 상권분석서비스 유동인구`

```
data/raw_data/population_info/
└── 유동인구.csv
```

---

### 4. 서울시 부동산 전월세가 `data/raw_data/rent_info/`

**출처**: [서울 열린데이터광장](https://data.seoul.go.kr) → 검색: `서울시 부동산 전월세가 정보`

```
data/raw_data/rent_info/
└── 서울시 부동산 전월세가 정보.csv
```

---

### 5. 임대동향 (층별 임대료) `data/raw_data/rental_fee_info/`

**출처**: [한국부동산원](https://www.reb.or.kr) 또는 공공데이터포털 → 검색: `임대동향 층별임대료`

```
data/raw_data/rental_fee_info/
├── 임대동향_소규모 상가.csv
└── 임대동향_중대형 상가.csv
```

---

### 6. 서울시 주거인구 `data/raw_data/residential-population_info/`

**출처**: [서울 열린데이터광장](https://data.seoul.go.kr) → 검색: `서울시 주민등록인구`

```
data/raw_data/residential-population_info/
├── 서울시_주거인구(19~21).csv
└── 서울시_주거인구(22~25).csv
```

---

### 7. 서울시 직장인구 `data/raw_data/working-population_info/`

**출처**: [서울 열린데이터광장](https://data.seoul.go.kr) → 검색: `서울시 상권분석서비스 직장인구`

```
data/raw_data/working-population_info/
└── 서울시_상권분석서비스(직장인구-행정동).csv
```

---

### 8. 소상공인 상가업소 정보 (분기별) `data/raw_data/store_info/`

**출처**: [공공데이터포털](https://www.data.go.kr) → 검색: `소상공인시장진흥공단_상가(상권)정보`

분기별 폴더(`YYYY-Q`)를 생성하고, 각 폴더에 서울 데이터만 추출하여 저장합니다.

```
data/raw_data/store_info/
├── 2020-1/상가_서울.csv
├── 2020-2/상가_서울.csv
├── 2020-3/상가_서울.csv
├── 2020-4/상가_서울.csv
├── 2021-1/상가_서울.csv
│   ... (2020Q1 ~ 2025Q4, 총 20개 폴더)
└── 2025-4/상가_서울.csv
```

> 원본 파일이 전국 데이터인 경우, 서울(시도명 = '서울특별시') 행만 필터링하여 `상가_서울.csv`로 저장합니다.

---

### 9. 카테고리 매핑 테이블 `data/category_maps/`

이 파일들은 `ai/category_map.ipynb` 실행 시 자동 생성됩니다.
또는 팀원에게 파일을 직접 전달받아 아래 경로에 위치시킵니다.

```
data/category_maps/
├── categories.csv          # 25개 통합 카테고리 목록
├── sales_category_map.csv  # 매출 데이터 업종 → 통합카테고리 매핑
└── store_category_map.csv  # 상가 데이터 업종 → 통합카테고리 매핑
```

---

## 설치 및 실행

### 1. Python 환경 설정

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

---

### 2. 데이터 전처리 (Jupyter)

아래 순서대로 실행합니다.

```bash
# 1) 업종 카테고리 매핑 생성 (data/category_maps/ 생성)
jupyter notebook ai/category_map.ipynb

# 2) 원본 데이터 병합 및 피처 엔지니어링 (data/processed_data/final_dataset.csv 생성)
jupyter notebook ai/build_merged_dataset.ipynb

# 3) 모델 학습 및 추천 점수 생성 (data/processed_data/scores.csv 생성)
python ai/retrain_scores.py
```

```bash
# 4) 위치 점수 및 임대 데이터 빌드
python scripts/build_location_scores.py    # → data/processed_data/location_scores.csv
python scripts/build_rental_data.py        # → data/processed_data/rental_data.json
python scripts/build_gu_rental.py          # → data/processed_data/gu_rental.json
```

> `final_dataset.csv` 생성에는 수십 분이 소요될 수 있습니다 (약 210MB).

---

### 3. 백엔드 설정

```bash
cd backend
python manage.py migrate

# CSV → DB 임포트
python manage.py import_csv
python manage.py import_scores
python manage.py import_store_info

python manage.py runserver
```

백엔드 서버: `http://localhost:8000`

---

### 4. 프론트엔드 설정

```bash
cd frontend-react
npm install
npm run dev
```

프론트엔드: `http://localhost:5173`

---

## 처리된 데이터 파일 설명 (`data/processed_data/`)

| 파일 | 크기 | 설명 |
|---|---|---|
| `final_dataset.csv` | ~210MB | ML 학습용 데이터 (190,089행, 20컬럼) |
| `location_scores.csv` | ~13MB | 행정동×업종 위치 추천 점수 |
| `naver_place_info.csv` | ~15MB | 네이버 플레이스 크롤링 결과 |
| `scores.csv` | ~423KB | 모델 예측 점수 (최신 분기 기준) |
| `rental_data.json` | ~404KB | 행정동별 임대료 정보 |
| `gu_rental.json` | ~16KB | 구별 임대료 집계 |

---

## AI 모델

- **문제 유형**: Binary Classification (다음 분기 매출 성장 여부 예측)
- **모델**: RandomForestClassifier (`n_estimators=300`, `class_weight="balanced"`)
- **학습 기간**: 2020Q1 ~ 2025Q1 (23개 분기, 약 17만 건)
- **AUC-ROC**: 0.657

자세한 내용은 [data/README_DATASET.md](data/README_DATASET.md)를 참고하세요.

---

## 데이터 출처

| 데이터 | 출처 |
|---|---|
| 서울시 추정 매출, 유동인구, 직장인구, 점포 | [서울 열린데이터광장](https://data.seoul.go.kr) |
| 소상공인 상가업소 정보 | [공공데이터포털](https://www.data.go.kr) |
| 부동산 전월세가 | [서울 열린데이터광장](https://data.seoul.go.kr) |
| 임대동향 | [한국부동산원](https://www.reb.or.kr) |
