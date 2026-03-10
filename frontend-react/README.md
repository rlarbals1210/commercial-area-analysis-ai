# 서울 상권 분석 AI — 프론트엔드

React + Vite 기반 프론트엔드입니다.

---

## 실행 방법

```bash
npm install
npm run dev
```

---

## 페이지 구성

| 페이지 | 설명 |
|---|---|
| MapPage | 지도 기반 행정동/업종 상권 조회 및 추천 |
| LoginPage | 로그인 |
| SignupPage | 회원가입 |

---

## 연결 API

백엔드 Django 서버 (`http://localhost:8000`)와 통신합니다.

- 행정동 클릭 → 업종 추천 TOP 5
- 업종 선택 → 행정동 추천 TOP N
