# 서울 상권 분석 AI

서울 행정동 기준 상권 데이터를 분석하여 창업 업종 및 지역을 추천하는 AI 서비스입니다.

---

## 프로젝트 개요

공공데이터(서울시 추정 매출, 유동인구, 상가 정보)를 기반으로 **다음 분기 매출 성장 가능성**을 예측합니다.

두 가지 방향의 추천을 제공합니다.

- **업종 선택 → 행정동 추천**: 특정 업종 창업에 적합한 행정동 TOP N
- **행정동 선택 → 업종 추천**: 해당 행정동에서 다음 분기 성장 가능성이 높은 업종 TOP 5

---

## 프로젝트 구조

```
commercial-area-analysis-ai/
├── ai/
│   ├── scripts/
│   │   ├── build_merged_dataset.ipynb   # 데이터 전처리 및 병합
│   │   └── SungKwang2Gg.ipynb           # 모델 학습 및 추천 함수
│   └── outputs/
│       ├── final_dataset.csv            # 전처리 완료 데이터셋
│       └── README_DATASET.md            # 데이터셋 상세 설명
├── backend/                             # Django REST API
│   ├── accounts/                        # 회원 관리
│   ├── analysis/                        # 상권 분석 API
│   ├── recommendation/                  # 추천 API
│   └── manage.py
├── frontend-react/                      # React + Vite 프론트엔드
│   └── src/
│       └── pages/
│           ├── MapPage.jsx              # 지도 기반 상권 조회
│           ├── LoginPage.jsx
│           └── SignupPage.jsx
├── data/
│   └── raw_data/
│       ├── sales_info/                  # 서울시 추정 매출 (매출_YYYY.csv)
│       ├── population_info/             # 서울시 유동인구 (유동인구.csv)
│       └── store_info/                  # 서울 상가 정보 (YYYY-Q 폴더)
└── requirements.txt
```

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| AI/ML | scikit-learn (RandomForestClassifier), pandas, numpy |
| 백엔드 | Django 5, Django REST Framework |
| 프론트엔드 | React, Vite |
| 데이터 | 서울 공공데이터포털 |

---

## AI 모델

- **문제 유형**: Binary Classification (다음 분기 매출 성장 여부 예측)
- **모델**: RandomForestClassifier (n_estimators=300, class_weight="balanced")
- **학습 데이터**: 2020Q1 ~ 2025Q1 (23개 분기, 약 17만 건)
- **AUC-ROC**: 0.657 (랜덤 예측 0.5 대비 실질적 예측력 보유)

자세한 내용은 [ai/outputs/README_DATASET.md](ai/outputs/README_DATASET.md)를 참고하세요.

---

## 실행 방법

### 데이터 전처리

```bash
# Jupyter에서 순서대로 실행
ai/scripts/build_merged_dataset.ipynb   # → final_dataset.csv 생성
ai/scripts/SungKwang2Gg.ipynb           # → 모델 학습 및 추천
```

### 백엔드

```bash
pip install -r requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```

### 프론트엔드

```bash
cd frontend-react
npm install
npm run dev
```

---

## 데이터 출처

- [서울 열린데이터광장 — 서울시 상권분석 추정매출](https://data.seoul.go.kr)
- [서울 열린데이터광장 — 서울시 상권분석 유동인구](https://data.seoul.go.kr)
- [공공데이터포털 — 소상공인 상가업소 정보](https://www.data.go.kr)
