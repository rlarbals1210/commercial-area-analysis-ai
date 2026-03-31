import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const DRILL_GROUPS = ["음식", "소매", "서비스"];
const DRILL_GROUP_META = {
  "음식":   { emoji: "🍽️" },
  "소매":   { emoji: "🛍️" },
  "서비스": { emoji: "⚙️" },
};
const REGIONS = [
  "강남구", "강동구", "강북구", "강서구", "관악구",
  "광진구", "구로구", "금천구", "노원구", "도봉구",
  "동대문구", "동작구", "마포구", "서대문구", "서초구",
  "성동구", "성북구", "송파구", "양천구", "영등포구",
  "용산구", "은평구", "종로구", "중구", "중랑구",
];

const STARTUP_COSTS = {
  "한식":          { "인테리어_만원per평": 80,  "설비_집기_만원": 1500, "초기재고_만원": 300,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 30, "원가율_%": 38, "특이사항": "주방 설비 비중 높음" },
  "분식/간식":     { "인테리어_만원per평": 60,  "설비_집기_만원": 800,  "초기재고_만원": 150,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 20, "원가율_%": 35, "특이사항": "" },
  "베이커리/디저트": { "인테리어_만원per평": 90,  "설비_집기_만원": 2000, "초기재고_만원": 300,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 20, "원가율_%": 32, "특이사항": "오븐·제과 설비 비중 높음" },
  "중식":          { "인테리어_만원per평": 80,  "설비_집기_만원": 1800, "초기재고_만원": 300,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 30, "원가율_%": 38, "특이사항": "대형 화구 등 주방 설비 비중 높음" },
  "일식":          { "인테리어_만원per평": 100, "설비_집기_만원": 2000, "초기재고_만원": 500,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 30, "원가율_%": 40, "특이사항": "식재료 단가 높음" },
  "양식/기타외식": { "인테리어_만원per평": 100, "설비_집기_만원": 2000, "초기재고_만원": 400,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 30, "원가율_%": 38, "특이사항": "" },
  "치킨전문점":    { "인테리어_만원per평": 60,  "설비_집기_만원": 1500, "초기재고_만원": 200,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 25, "원가율_%": 42, "특이사항": "프랜차이즈 가맹비 별도 (1000~3000만원), 튀김 설비 포함" },
  "패스트푸드":    { "인테리어_만원per평": 70,  "설비_집기_만원": 1500, "초기재고_만원": 200,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 25, "원가율_%": 40, "특이사항": "프랜차이즈 가맹비 별도 (1000~3000만원)" },
  "카페":          { "인테리어_만원per평": 120, "설비_집기_만원": 2500, "초기재고_만원": 200,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 25, "원가율_%": 30, "특이사항": "에스프레소 머신 등 고가 설비 포함" },
  "주점":          { "인테리어_만원per평": 90,  "설비_집기_만원": 1200, "초기재고_만원": 400,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 20, "원가율_%": 35, "특이사항": "주류 면허 비용 별도" },
  "편의점":                 { "인테리어_만원per평": 50,  "설비_집기_만원": 3000, "초기재고_만원": 2000, "보증금_임대료배수": 12, "관리비_공과금_만원per월": 50, "원가율_%": 72, "특이사항": "가맹비·냉장설비 비중 높음, 원가율 높음" },
  "슈퍼마켓":               { "인테리어_만원per평": 40,  "설비_집기_만원": 1000, "초기재고_만원": 1500, "보증금_임대료배수": 10, "관리비_공과금_만원per월": 25, "원가율_%": 65, "특이사항": "냉장·진열 설비 필요" },
  "미곡판매":               { "인테리어_만원per평": 30,  "설비_집기_만원": 400,  "초기재고_만원": 500,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 60, "특이사항": "쌀·곡물 전문 소매" },
  "수산물판매":             { "인테리어_만원per평": 30,  "설비_집기_만원": 600,  "초기재고_만원": 800,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 65, "특이사항": "냉장·냉동 설비 필요" },
  "육류판매":               { "인테리어_만원per평": 30,  "설비_집기_만원": 600,  "초기재고_만원": 800,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 65, "특이사항": "냉장·냉동 설비 필요" },
  "청과상":                 { "인테리어_만원per평": 30,  "설비_집기_만원": 300,  "초기재고_만원": 600,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 10, "원가율_%": 60, "특이사항": "신선도 관리 중요" },
  "반찬가게":               { "인테리어_만원per평": 40,  "설비_집기_만원": 500,  "초기재고_만원": 300,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 50, "특이사항": "조리 설비 필요" },
  "일반의류":               { "인테리어_만원per평": 80,  "설비_집기_만원": 500,  "초기재고_만원": 1500, "보증금_임대료배수": 12, "관리비_공과금_만원per월": 20, "원가율_%": 45, "특이사항": "초기재고 비중 높음" },
  "신발":                   { "인테리어_만원per평": 70,  "설비_집기_만원": 400,  "초기재고_만원": 1200, "보증금_임대료배수": 12, "관리비_공과금_만원per월": 15, "원가율_%": 48, "특이사항": "초기재고 비중 높음" },
  "가방":                   { "인테리어_만원per평": 70,  "설비_집기_만원": 300,  "초기재고_만원": 1000, "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 45, "특이사항": "초기재고 비중 높음" },
  "섬유제품":               { "인테리어_만원per평": 60,  "설비_집기_만원": 400,  "초기재고_만원": 800,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 50, "특이사항": "" },
  "화장품":                 { "인테리어_만원per평": 80,  "설비_집기_만원": 500,  "초기재고_만원": 800,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 40, "특이사항": "" },
  "네일숍":                 { "인테리어_만원per평": 90,  "설비_집기_만원": 1500, "초기재고_만원": 200,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 20, "특이사항": "네일 장비·재료 비중 높음" },
  "피부관리실":             { "인테리어_만원per평": 100, "설비_집기_만원": 2000, "초기재고_만원": 200,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 20, "원가율_%": 20, "특이사항": "피부 관리 기기 비중 높음" },
  "미용실":                 { "인테리어_만원per평": 90,  "설비_집기_만원": 2000, "초기재고_만원": 200,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 20, "특이사항": "미용 기구·의자 등 설비 비중 높음" },
  "일반의원":               { "인테리어_만원per평": 150, "설비_집기_만원": 5000, "초기재고_만원": 500,  "보증금_임대료배수": 12, "관리비_공과금_만원per월": 50, "원가율_%": 25, "특이사항": "의료기기·인테리어 비중 매우 높음, 의사면허 필요" },
  "치과의원":               { "인테리어_만원per평": 150, "설비_집기_만원": 8000, "초기재고_만원": 300,  "보증금_임대료배수": 12, "관리비_공과금_만원per월": 50, "원가율_%": 20, "특이사항": "치과 장비 비중 매우 높음, 면허 필요" },
  "한의원":                 { "인테리어_만원per평": 120, "설비_집기_만원": 3000, "초기재고_만원": 300,  "보증금_임대료배수": 12, "관리비_공과금_만원per월": 40, "원가율_%": 20, "특이사항": "한방 설비, 면허 필요" },
  "의료기기":               { "인테리어_만원per평": 60,  "설비_집기_만원": 500,  "초기재고_만원": 1500, "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 45, "특이사항": "전문 재고 비중 높음" },
  "의약품":                 { "인테리어_만원per평": 50,  "설비_집기_만원": 500,  "초기재고_만원": 2000, "보증금_임대료배수": 10, "관리비_공과금_만원per월": 20, "원가율_%": 50, "특이사항": "약사 면허 필요, 초기재고 비중 높음" },
  "안경":                   { "인테리어_만원per평": 80,  "설비_집기_만원": 1000, "초기재고_만원": 1000, "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 40, "특이사항": "검안 장비·재고 비중 높음" },
  "외국어학원":             { "인테리어_만원per평": 50,  "설비_집기_만원": 600,  "초기재고_만원": 100,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 20, "원가율_%": 15, "특이사항": "강사 인건비 비중 높음" },
  "일반교습학원":           { "인테리어_만원per평": 50,  "설비_집기_만원": 800,  "초기재고_만원": 100,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 20, "원가율_%": 15, "특이사항": "강사 인건비 비중 높음" },
  "가전제품":               { "인테리어_만원per평": 60,  "설비_집기_만원": 500,  "초기재고_만원": 2000, "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 55, "특이사항": "초기재고 비중 높음" },
  "핸드폰":                 { "인테리어_만원per평": 70,  "설비_집기_만원": 500,  "초기재고_만원": 3000, "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 50, "특이사항": "재고·통신사 수수료 비중 높음" },
  "컴퓨터및주변장치판매":   { "인테리어_만원per평": 50,  "설비_집기_만원": 400,  "초기재고_만원": 2000, "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 55, "특이사항": "" },
  "생활용품 소매": { "인테리어_만원per평": 40,  "설비_집기_만원": 400,  "초기재고_만원": 800,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 50, "특이사항": "" },
  "스포츠 강습":            { "인테리어_만원per평": 60,  "설비_집기_만원": 1500, "초기재고_만원": 100,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 20, "원가율_%": 20, "특이사항": "강사 인건비·운동기구 비중 높음" },
  "골프연습장":             { "인테리어_만원per평": 80,  "설비_집기_만원": 5000, "초기재고_만원": 100,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 50, "원가율_%": 15, "특이사항": "타석·시뮬레이터 등 설비 매우 큼" },
  "스포츠클럽":             { "인테리어_만원per평": 80,  "설비_집기_만원": 3000, "초기재고_만원": 100,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 40, "원가율_%": 20, "특이사항": "운동기구·샤워시설 비중 높음" },
  "예술학원":      { "인테리어_만원per평": 60,  "설비_집기_만원": 1200, "초기재고_만원": 100,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 20, "원가율_%": 15, "특이사항": "악기·미술 도구 등 설비 비중 높음" },
  "애완동물":      { "인테리어_만원per평": 80,  "설비_집기_만원": 1500, "초기재고_만원": 500,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 25, "원가율_%": 35, "특이사항": "동물 관련 위생 설비 포함" },
  "숙박":          { "인테리어_만원per평": 100, "설비_집기_만원": 3000, "초기재고_만원": 200,  "보증금_임대료배수": 12, "관리비_공과금_만원per월": 60, "원가율_%": 25, "특이사항": "초기 투자 규모 매우 큼" },
  "PC방":                   { "인테리어_만원per평": 100, "설비_집기_만원": 5000, "초기재고_만원": 100,  "보증금_임대료배수": 12, "관리비_공과금_만원per월": 60, "원가율_%": 20, "특이사항": "PC·모니터 등 설비 비중 매우 높음, 전기료 높음" },
  "노래방":                 { "인테리어_만원per평": 120, "설비_집기_만원": 3000, "초기재고_만원": 100,  "보증금_임대료배수": 12, "관리비_공과금_만원per월": 30, "원가율_%": 25, "특이사항": "방음·음향 설비 비중 높음" },
  "당구장":                 { "인테리어_만원per평": 80,  "설비_집기_만원": 3000, "초기재고_만원": 50,   "보증금_임대료배수": 10, "관리비_공과금_만원per월": 20, "원가율_%": 10, "특이사항": "당구대 비용 높음 (대당 200~500만원)" },
  "가전제품수리":           { "인테리어_만원per평": 30,  "설비_집기_만원": 800,  "초기재고_만원": 200,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 25, "특이사항": "기술 인건비 비중 높음" },
  "세탁소":                 { "인테리어_만원per평": 50,  "설비_집기_만원": 2000, "초기재고_만원": 100,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 30, "원가율_%": 20, "특이사항": "세탁기·드라이클리닝 설비 비중 높음" },
  "인테리어":               { "인테리어_만원per평": 30,  "설비_집기_만원": 500,  "초기재고_만원": 300,  "보증금_임대료배수": 8,  "관리비_공과금_만원per월": 15, "원가율_%": 35, "특이사항": "시공 외주 비중 높음, 영업용 차량 필요" },
  "자동차수리/미용":         { "인테리어_만원per평": 40,  "설비_집기_만원": 2000, "초기재고_만원": 300,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 25, "원가율_%": 30, "특이사항": "리프트·도장부스 등 설비 비중 높음" },
  "기타 B2B서비스":         { "인테리어_만원per평": 30,  "설비_집기_만원": 300,  "초기재고_만원": 0,    "보증금_임대료배수": 10, "관리비_공과금_만원per월": 10, "원가율_%": 10, "특이사항": "재고 없음, 인건비 비중 높음" },
};

const CATEGORY_GROUPS = {
  "전체": Object.keys(STARTUP_COSTS),
  "음식": ["한식", "분식/간식", "베이커리/디저트", "중식", "일식", "양식/기타외식", "치킨전문점", "패스트푸드", "카페", "주점"],
  "소매": ["편의점", "슈퍼마켓", "미곡판매", "수산물판매", "육류판매", "청과상", "반찬가게", "일반의류", "신발", "가방", "섬유제품", "화장품", "네일숍", "피부관리실", "가전제품", "핸드폰", "컴퓨터및주변장치판매", "생활용품 소매"],
  "서비스": ["미용실", "일반의원", "치과의원", "한의원", "의료기기", "의약품", "안경", "스포츠 강습", "골프연습장", "스포츠클럽", "외국어학원", "일반교습학원", "예술학원", "애완동물", "숙박", "PC방", "노래방", "당구장", "가전제품수리", "세탁소", "인테리어", "자동차수리/미용", "기타 B2B서비스"],
};

// GeoJSON은 중점(·) 사용, 데이터셋은 마침표(.) 사용 → API 호출 시 정규화
const normalizeDongName = (name) => name.replace(/·/g, ".");

const POLYGON_DEFAULT    = { fillColor: "#9EC8F0", fillOpacity: 0.01, strokeColor: "#9CA3AF", strokeOpacity: 0.8, strokeWeight: 2 };
const POLYGON_HOVER      = { fillColor: "#60A5FA", fillOpacity: 0.35, strokeColor: "#3B82F6", strokeOpacity: 1,  strokeWeight: 1 };
const POLYGON_SELECTED   = { fillColor: "#3B82F6", fillOpacity: 0.6,  strokeColor: "#1D4ED8", strokeOpacity: 1,  strokeWeight: 1 };
// 선택 시 나머지 폴리곤에 적용할 회색 딤처리
const POLYGON_DIMMED     = { fillColor: "#1E3A8A", fillOpacity: 0.18, strokeColor: "#3B82F6", strokeOpacity: 0.2, strokeWeight: 1 };
// 선택된 구 경계: 투명(원래 지도 색) + 스카이블루 테두리
const POLYGON_GU_SELECTED  = { fillColor: "#000000", fillOpacity: 0, strokeColor: "#38BDF8", strokeOpacity: 1, strokeWeight: 3 };
// 선택된 행정동 경계: 투명(원래 지도 색) + 에메랄드 테두리
const POLYGON_DONG_SELECTED = { fillColor: "#000000", fillOpacity: 0.01, strokeColor: "#7DD3FC", strokeOpacity: 0.8, strokeWeight: 2 };
// 선택된 구 내 행정동: 투명 fill + 얇은 경계선만
const POLYGON_DONG_IN_GU  = { fillColor: "#000000", fillOpacity: 0.01, strokeColor: "#6B9FD4", strokeOpacity: 0.5, strokeWeight: 1 };
// 길단위 상권 폴리곤
const POLYGON_STREET_DEFAULT  = { fillColor: "#F59E0B", fillOpacity: 0.12, strokeColor: "#D97706", strokeOpacity: 0.7, strokeWeight: 1 };
const POLYGON_STREET_HOVER    = { fillColor: "#F59E0B", fillOpacity: 0.40, strokeColor: "#B45309", strokeOpacity: 1,   strokeWeight: 2 };
const POLYGON_STREET_SELECTED = { fillColor: "#EF4444", fillOpacity: 0.45, strokeColor: "#DC2626", strokeOpacity: 1,   strokeWeight: 2 };


function GuRankTicker({ items }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % items.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, [items.length]);

  const item = items[idx];
  const fmtEok = (v) => v >= 100_000_000 ? `${(v / 100_000_000).toFixed(0)}억` : `${Math.round(v / 10_000)}만`;

  return (
    <div style={{
      fontSize: 13, fontWeight: 500, color: "#374151",
      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      transition: "opacity 0.3s, transform 0.3s",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(-6px)",
    }}>
      <span style={{ color: "#6B9FE4", fontWeight: 700, marginRight: 4 }}>{idx + 1}위</span>
      {item.gu}
      <span style={{ color: "#9CA3AF", fontSize: 12, marginLeft: 6 }}>{fmtEok(item.총매출)}원</span>
    </div>
  );
}

export default function MapPage() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonGroupsRef = useRef([]);    // 행정동 폴리곤
  const guPolygonGroupsRef = useRef([]);  // 구 폴리곤
  const dongLabelsRef = useRef([]);       // 행정동 라벨
  const guLabelsRef = useRef([]);         // 구 라벨
  const selectedGroupRef = useRef(null);
  const selectedGuGroupRef = useRef(null);  // 선택된 구 폴리곤
  const hoveredDongGroupRef = useRef(null); // 현재 호버 중인 동 (mouseout 누락 방지용)
  const hoveredGuGroupRef = useRef(null);   // 현재 호버 중인 구 (mouseout 누락 방지용)
  const guToDongsRef = useRef({});         // { 구이름: [행정동이름, ...] }
  const storeMarkersRef = useRef([]);         // 개별 상가 마커 (CustomOverlay)
  const allStoresRef = useRef([]);            // fetch된 전체 상가 (클라이언트 필터링용)
  const storeCategoryFilterRef = useRef([]); // 필터 최신값 (zoom 핸들러 클로저용)
  const storeZoomListenerRef = useRef(null);  // 줌 변경 이벤트 핸들러
  const storeInfoWindowRef = useRef(null);    // 현재 열린 상가 팝업
  const guBadgeOverlayRef = useRef(null);   // 구 선택 시 지도 위 매출 뱃지
  const dongBadgeOverlayRef = useRef(null); // 행정동 선택 시 지도 위 매출 뱃지
  const myLocationOverlayRef = useRef(null); // 현재위치 마커
  const GU_MODE_LEVEL = 7;        // 이 레벨 이상이면 구 단위 표시
  const DONG_BADGE_HIDE_LEVEL = 6; // 이 레벨 미만이면 행정동 뱃지 숨김

  const [mapLoaded, setMapLoaded] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredDong, setHoveredDong] = useState(null);   // { dongName, guName }
  const [selectedDong, setSelectedDong] = useState(null); // { dongName, guName } — 팝업용
  const [selectedGu, setSelectedGu] = useState(null);     // guName — 구 팝업용
  const [dongData, setDongData] = useState(null);          // API 응답 전체
  const [dongLoading, setDongLoading] = useState(false);  // 로딩 상태
  const [rankModalOpen, setRankModalOpen] = useState(false); // 전체 보기 모달
  const [dongStatsOpen, setDongStatsOpen] = useState(false); // 상세 통계 패널
  const [reportOpen, setReportOpen] = useState(false);        // 보고서 패널
  const [reportData, setReportData] = useState(null);         // 보고서 데이터
  const [reportLoading, setReportLoading] = useState(false);  // 보고서 로딩
  const [reportCategoryLoading, setReportCategoryLoading] = useState(false); // 업종 심화 분석 로딩
  const [reportCategory, setReportCategory] = useState("");   // 선택된 업종
  const [reportRegion, setReportRegion] = useState(null);     // 보고서 생성 시점의 지역 { name, subName }
  const reportMapStateRef = useRef(null);                      // 보고서 생성 시점의 지도 상태 { lat, lng, level }
  const restoringReportRef = useRef(false);                    // 이전 분석 복원 중 플래그
  const returnToReportRef = useRef(false);                     // 창업비용/AI모달 닫힐 때 보고서 복원 플래그
  const [rankType, setRankType] = useState(null); // "revenue" | "stores"
  const [availableQuarters, setAvailableQuarters] = useState([]); // 선택 가능한 분기 목록
  const [selectedQuarter, setSelectedQuarter] = useState(null);   // 선택된 분기 코드 (null=최신)
  const [guData, setGuData] = useState(null);
  const [guLoading, setGuLoading] = useState(false);
  const [guRankModalOpen, setGuRankModalOpen] = useState(false);
  const [guRankType, setGuRankType] = useState(null); // "revenue" | "stores"
  const [guAvailableQuarters, setGuAvailableQuarters] = useState([]);
  const [guSelectedQuarter, setGuSelectedQuarter] = useState(null);
  const [quarterPopupOpen, setQuarterPopupOpen] = useState(false);
  const [guQuarterPopupOpen, setGuQuarterPopupOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(8);
  const [guAllRanking, setGuAllRanking] = useState([]);

  // ── 상가 마커 상태 ──
  const [showStoreMarkers, setShowStoreMarkers] = useState(false);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeCategoryFilter, setStoreCategoryFilter] = useState([]);

  // ── 창업 적합도 상태 ──
  const [scoreData, setScoreData] = useState(null);       // 전체 업종 점수 목록
  const [selectedScoreCat, setSelectedScoreCat] = useState(null); // 선택된 업종

  const [markerToast, setMarkerToast] = useState(false);
  const [markerPanelOpen, setMarkerPanelOpen] = useState(false);

  // ── AI 추천 상태 ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiStep, setAiStep] = useState("mode"); // "mode" | "form" | "loading" | "result" | "spot_loading" | "spot"
  const [aiMode, setAiMode] = useState(null);   // "dong" | "industry" | "score" | "gu" | "compare_region" | "compare_industry"
  // 지역 비교 모드 state
  const [cmpRegionType, setCmpRegionType] = useState("dong"); // "dong" | "gu"
  const [cmpRegionAQuery, setCmpRegionAQuery] = useState("");
  const [cmpRegionBQuery, setCmpRegionBQuery] = useState("");
  const [cmpRegionASugg, setCmpRegionASugg] = useState([]);
  const [cmpRegionBSugg, setCmpRegionBSugg] = useState([]);
  const [cmpRegionASelected, setCmpRegionASelected] = useState(null);
  const [cmpRegionBSelected, setCmpRegionBSelected] = useState(null);
  const cmpRegionATimer = useRef(null);
  const cmpRegionBTimer = useRef(null);
  const [cmpRegionCat, setCmpRegionCat] = useState(null);
  const [cmpRegionDrillGroup, setCmpRegionDrillGroup] = useState(null);
  const [cmpRegionPickerOpen, setCmpRegionPickerOpen] = useState(false);
  // 업종 비교 모드 state
  const [cmpIndRegionType, setCmpIndRegionType] = useState("dong");
  const [cmpIndRegionQuery, setCmpIndRegionQuery] = useState("");
  const [cmpIndRegionSugg, setCmpIndRegionSugg] = useState([]);
  const [cmpIndRegionSelected, setCmpIndRegionSelected] = useState(null);
  const cmpIndRegionTimer = useRef(null);
  const [cmpIndCatA, setCmpIndCatA] = useState(null);
  const [cmpIndCatB, setCmpIndCatB] = useState(null);
  const [cmpIndPickerTarget, setCmpIndPickerTarget] = useState(null); // "a" | "b"
  const [cmpIndDrillGroup, setCmpIndDrillGroup] = useState(null);
  const [aiIndustry, setAiIndustry] = useState(null);
  const [aiRegion, setAiRegion] = useState(null);
  const [aiDong, setAiDong] = useState("");
  const [aiGu, setAiGu] = useState("");            // gu 모드: 선택한 구
  const [aiGuResultTab, setAiGuResultTab] = useState("dong"); // "dong" | "street"
  const [aiGuStreetResults, setAiGuStreetResults] = useState(null); // 길단위 상권 결과
  const [aiGuDongError, setAiGuDongError] = useState(null); // 행정동 추천 실패 메시지
  const [aiResults, setAiResults] = useState(null);
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);
  const [aiSubIndustry, setAiSubIndustry] = useState("");       // dong 모드: 소분류 입력값
  const [aiIndustrySearchQuery, setAiIndustrySearchQuery] = useState("");    // AI 업종 선택 검색어
  const [aiIndustryDrillGroup, setAiIndustryDrillGroup] = useState(null);   // AI 드릴다운 선택 그룹 (null=top)
  const [aiIndustrySuggestions, setAiIndustrySuggestions] = useState([]);    // AI 업종 자동완성
  const [aiIndustrySuggestOpen, setAiIndustrySuggestOpen] = useState(false); // 드롭다운 표시 여부
  const aiIndustrySuggestTimer = useRef(null);                               // 디바운스 타이머
  // 검색바 업종 필터 드릴다운
  const [searchIndustryDrillGroup, setSearchIndustryDrillGroup] = useState(null);
  const [searchIndustrySearchQuery, setSearchIndustrySearchQuery] = useState("");
  const searchIndustrySuggestTimer = useRef(null);
  // 지도 상가 필터 드릴다운
  const [storeDrillGroup, setStoreDrillGroup] = useState(null);
  // AI 결과 패널 드릴다운
  const [pickerDrillGroup, setPickerDrillGroup] = useState(null);
  // 창업비용 계산기 드릴다운 (calcActiveTab → drillGroup으로 전환)
  const [calcDrillGroup, setCalcDrillGroup] = useState(null);
  const [startupCalcOpen, setStartupCalcOpen] = useState(false); // 창업 비용 계산기
  const [toolMenuOpen, setToolMenuOpen] = useState(false); // 상권 분석 도구 드롭다운
  const [calcIndustry, setCalcIndustry] = useState(null);       // 계산기 선택 업종
  const [calcArea, setCalcArea] = useState(33);                  // 면적(㎡)
  const [calcFloor, setCalcFloor] = useState("1층");             // 층수
  const [calcWorkers, setCalcWorkers] = useState(1);             // 직원수
  const [calcResult, setCalcResult] = useState(null);            // 계산 결과
  const [calcSelectedGu, setCalcSelectedGu] = useState("");     // 구 선택 (지도 선택 없을 때)
  const [calcGuRental, setCalcGuRental] = useState(null);        // 구별 임대료 캐시
  const [calcSearchQuery, setCalcSearchQuery] = useState("");         // 업종 검색어 (입력창 표시용)
  const [calcSuggestions, setCalcSuggestions] = useState([]);         // API 자동완성 결과 목록
  const [calcSuggestOpen, setCalcSuggestOpen] = useState(false);      // 자동완성 드롭다운 표시 여부
  const calcSuggestTimer = useRef(null);                              // 디바운스용 타이머 ref
  const [spotDong, setSpotDong] = useState(null);               // 위치추천 선택된 행정동
  const [spotCategory, setSpotCategory] = useState(null);       // 위치추천 통합카테고리
  const [spotResults, setSpotResults] = useState(null);         // 위치추천 결과
  const [selectedStreet, setSelectedStreet] = useState(null);   // { 상권코드, 상권명 }
  const [streetResults, setStreetResults] = useState(null);     // 상권 업종 추천 결과
  const [streetLoading, setStreetLoading] = useState(false);
  const [streetCount, setStreetCount] = useState(0);            // 현재 동의 상권 수
  const [streetSpotResults, setStreetSpotResults] = useState(null);   // 상권 내 입지 추천 결과
  const [streetSpotLoading, setStreetSpotLoading] = useState(false);  // 입지 추천 로딩
  const [streetSpotCategory, setStreetSpotCategory] = useState(null); // 선택된 업종
  const streetSpotMarkersRef = useRef([]);                             // 상권 입지 마커
  const spotMarkersRef = useRef([]);                             // 지도 위 위치추천 마커
  const streetPolygonGroupsRef = useRef([]);                     // 길단위 상권 폴리곤
  const streetGeoJsonRef = useRef(null);                         // GeoJSON 캐시 (lazy load)
  const selectedStreetRef = useRef(null);                        // 현재 선택된 상권

  // ── 상권 직접 그리기 ──
  const [drawingMode, setDrawingMode] = useState(false);
  const [customPolygonDone, setCustomPolygonDone] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [customResults, setCustomResults] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [customDrillGroup, setCustomDrillGroup] = useState(null);
  const [customSearchQuery, setCustomSearchQuery] = useState("");
  const drawingModeRef = useRef(false);
  const drawingPointsRef = useRef([]);
  const drawingPolylineRef = useRef(null);
  const drawingPreviewRef = useRef(null);
  const customPolygonRef = useRef(null);
  const customMarkersRef = useRef([]);
  const drawingDotsRef = useRef([]);
  const drawingClickListenerRef = useRef(null);
  const drawingMousemoveListenerRef = useRef(null);

  // 사이드바 안 검색 input에 포커스를 주기 위한 ref
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null); // 검색 드롭다운 스크롤용

  // ── 행정동/구 선택 시 사이드바 자동 열기 ──
  useEffect(() => {
    if (selectedDong || selectedGu) setSidebarCollapsed(false);
    if (!selectedDong) clearStreetPolygons();
  }, [selectedDong, selectedGu]);

  // ── 구/동 변경 시 보고서 패널 닫기 (복원 중엔 스킵) ──
  useEffect(() => {
    if (restoringReportRef.current) { restoringReportRef.current = false; return; }
    if (reportOpen) setReportOpen(false);
  }, [selectedDong, selectedGu]);

  // ── 창업비용/AI모달 닫힐 때 보고서 복원 ──
  useEffect(() => {
    if (!startupCalcOpen && returnToReportRef.current) {
      returnToReportRef.current = false;
      setReportOpen(true);
    }
  }, [startupCalcOpen]);

  useEffect(() => {
    if (!aiModalOpen && returnToReportRef.current) {
      returnToReportRef.current = false;
      setReportOpen(true);
    }
  }, [aiModalOpen]);

  // ── 줌 레벨 또는 구 선택 변경 시 구 딤처리 재적용 ──
  // applyMode의 폴리곤 옵션이 호버 등으로 덮어써질 수 있으므로 React effect에서 확실히 유지
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !guPolygonGroupsRef.current.length) return;
    if (zoomLevel < GU_MODE_LEVEL) return; // gu 모드에서만 재적용
    const selGuName = selectedGuGroupRef.current?.guName;
    if (!selGuName) return;
    guPolygonGroupsRef.current.forEach(({ guName: gn, polygons }) => {
      polygons.forEach(p => {
        p.setMap(map);
        p.setOptions(gn === selGuName ? POLYGON_GU_SELECTED : POLYGON_DIMMED);
      });
    });
  }, [selectedGu, zoomLevel]);

  // ── 창업비용 계산기 열릴 때 임대료 데이터 로드 ──
  useEffect(() => {
    if (startupCalcOpen && !calcGuRental) {
      fetch("http://localhost:8000/api/rental/regions/")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setCalcGuRental(data); })
        .catch(() => {});
    }
  }, [startupCalcOpen]);



  // ── 카카오 맵 animate:true를 220ms 간격으로 겹쳐 체이닝 → 부드러운 연속 줌 ──
  function smoothZoom(map, targetLevel, onDone) {
    const currentLevel = map.getLevel();
    if (currentLevel === targetLevel) {
      // 마지막 레벨 애니메이션 완료 대기 후 콜백
      setTimeout(() => onDone?.(), 280);
      return;
    }
    const next = currentLevel < targetLevel ? currentLevel + 1 : currentLevel - 1;
    map.setLevel(next, { animate: true });
    setTimeout(() => smoothZoom(map, targetLevel, onDone), 220);
  }

  // ── 페이드인 오버레이 ──
  useEffect(() => {
    const t = setTimeout(() => setFadeOut(true), 50);
    return () => clearTimeout(t);
  }, []);

  // ── 카카오 지도 스크립트 로드 ──
  useEffect(() => {
    const kakaoKey = import.meta.env.VITE_KAKAO_APP_KEY;
    if (!kakaoKey) {
      console.error("카카오 API 키가 없습니다. .env 파일 확인하세요.");
      return;
    }
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => setMapLoaded(true));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => setMapLoaded(true));
    document.head.appendChild(script);
  }, []);

  // ── 지도 생성 + GeoJSON 폴리곤 그리기 ──
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const { kakao } = window;

    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 8,
    });
    mapInstanceRef.current = map;

    Promise.all([
      fetch("/seoul_hangjeongdong.geojson").then((r) => r.json()),
      fetch("/seoul_gu.geojson").then((r) => r.json()),
    ]).then(([dongGeoJson, guGeoJson]) => {
      drawDongPolygons(map, dongGeoJson, kakao);
      drawGuPolygons(map, guGeoJson, kakao);
      applyMode(map, map.getLevel());
    });

    // 줌 변경 시 모드 전환
    kakao.maps.event.addListener(map, "zoom_changed", () => {
      const lv = map.getLevel();
      applyMode(map, lv);
      setZoomLevel(lv);
    });
  }, [mapLoaded]);

  // ── 줌 레벨에 따라 구/행정동 표시 전환 ──
  function applyMode(map, level) {
    const guMode = level >= GU_MODE_LEVEL;
    const selDongName = selectedGroupRef.current?.dongName;
    const selGuName   = selectedGuGroupRef.current?.guName;
    // 행정동 폴리곤: show/hide + 딤처리 적용
    polygonGroupsRef.current.forEach(({ dongName: dn, polygons }) => {
      polygons.forEach((p) => p.setMap(guMode ? null : map));
    });
    if (!guMode) {
      polygonGroupsRef.current.forEach(({ dongName: dn, guName: dnGu, polygons }) => {
        let style;
        if (selDongName) {
          style = dn === selDongName ? POLYGON_DONG_SELECTED : POLYGON_DIMMED;
        } else if (selGuName) {
          // 선택된 구 내 행정동은 투명(원래 지도 색), 나머지는 딤처리
          style = dnGu === selGuName ? POLYGON_DONG_IN_GU : POLYGON_DIMMED;
        } else {
          style = POLYGON_DEFAULT;
        }
        polygons.forEach(p => p.setOptions(style));
      });
    }
    // 구 폴리곤: show/hide + 딤처리 적용
    const selDongGuName = selectedGroupRef.current?.guName; // 선택된 행정동의 구
    guPolygonGroupsRef.current.forEach(({ guName, polygons }) => {
      const isSelected = selGuName === guName;
      const isDongGu   = selDongGuName === guName; // 행정동 선택 시 해당 구
      polygons.forEach((p) => {
        p.setMap(guMode || isSelected || isDongGu ? map : null);
        if (guMode) {
          if (isSelected || isDongGu) p.setOptions(POLYGON_GU_SELECTED);
          else if (selGuName || selDongGuName) p.setOptions(POLYGON_DIMMED);
          else p.setOptions(POLYGON_DEFAULT);
        } else {
          if (isSelected || isDongGu) p.setOptions(POLYGON_GU_SELECTED);
        }
      });
    });
    dongLabelsRef.current.forEach((label) => label.setMap(guMode ? null : map));
    guLabelsRef.current.forEach((label) => label.setMap(guMode ? map : null));
    setHoveredDong(null);
  }

  // ── 행정동 폴리곤 ──
  function drawDongPolygons(map, geojson, kakao) {
    polygonGroupsRef.current = [];
    dongLabelsRef.current = [];

    geojson.features.forEach((feature) => {
      const { geometry, properties } = feature;
      const dongName = properties.dong_name;
      const guName = properties.gu_name;

      const polygons = geometry.coordinates.map((rings) => {
        const path = rings[0].map(([lng, lat]) => new kakao.maps.LatLng(lat, lng));
        return new kakao.maps.Polygon({ path, strokeWeight: 1, zIndex: 2, ...POLYGON_DEFAULT });
      });

      polygons.forEach((polygon) => {
        kakao.maps.event.addListener(polygon, "mouseover", () => {
          if (drawingModeRef.current) return;
          // 이전 호버 동이 mouseout 없이 남아있으면 강제 리셋
          const prev = hoveredDongGroupRef.current;
          if (prev && prev.dongName !== dongName) {
            const wasSelected = selectedGroupRef.current?.dongName === prev.dongName;
            const selGuNm = selectedGuGroupRef.current?.guName;
            const prevOutsideGu = selGuNm && prev.guName !== selGuNm;
            prev.polygons.forEach((p) => p.setOptions(
              wasSelected ? POLYGON_GU_SELECTED
                : (selectedGroupRef.current || prevOutsideGu) ? POLYGON_DIMMED
                : POLYGON_DEFAULT
            ));
          }
          hoveredDongGroupRef.current = { dongName, guName, polygons };
          const selGuName = selectedGuGroupRef.current?.guName;
          const canHover = !selGuName || guName === selGuName;
          if (selectedGroupRef.current?.dongName !== dongName && canHover)
            polygons.forEach((p) => p.setOptions(POLYGON_HOVER));
          setHoveredDong({ dongName, guName });
        });
        kakao.maps.event.addListener(polygon, "mouseout", () => {
          if (drawingModeRef.current) return;
          hoveredDongGroupRef.current = null;
          if (selectedGroupRef.current?.dongName !== dongName) {
            const selGuNm = selectedGuGroupRef.current?.guName;
            const outsideGu = selGuNm && guName !== selGuNm;
            const style = (selectedGroupRef.current || outsideGu) ? POLYGON_DIMMED : POLYGON_DEFAULT;
            polygons.forEach((p) => p.setOptions(style));
          }
          setHoveredDong(null);
        });
        kakao.maps.event.addListener(polygon, "click", () => {
          if (drawingModeRef.current) return;
          // 모든 행정동 딤처리, 선택된 것만 강조
          polygonGroupsRef.current.forEach(({ dongName: dn, polygons: ps }) => {
            ps.forEach(p => p.setOptions(dn === dongName ? POLYGON_DONG_SELECTED : POLYGON_DIMMED));
          });
          selectedGroupRef.current = { dongName, guName, polygons };
          // 구 선택 해제 후 해당 동의 구 테두리 표시
          if (selectedGuGroupRef.current) {
            selectedGuGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
            selectedGuGroupRef.current = null;
          }
          const dongGuGroup = guPolygonGroupsRef.current.find((g) => g.guName === guName);
          if (dongGuGroup) dongGuGroup.polygons.forEach((p) => {
            p.setMap(map);
            p.setOptions(POLYGON_GU_SELECTED);
          });
          if (map.getLevel() > 5) {
            const bounds = new kakao.maps.LatLngBounds();
            geometry.coordinates.forEach((rings) =>
              rings[0].forEach(([lng, lat]) => bounds.extend(new kakao.maps.LatLng(lat, lng)))
            );
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const center = new kakao.maps.LatLng(
              (ne.getLat() + sw.getLat()) / 2,
              (ne.getLng() + sw.getLng()) / 2
            );
            map.panTo(center);
          }
          setSelectedGu(null);
          setSidebarCollapsed(false);
          setSelectedDong({ dongName, guName });
        });
      });

      // 행정동 이름 라벨
      const [cLng, cLat] = getLargestRingCentroid(geometry.coordinates);
      const center = new kakao.maps.LatLng(cLat, cLng);
      const dongLabel = new kakao.maps.CustomOverlay({
        position: center,
        content: `<div class="map-label map-label--dong">${dongName}</div>`,
        map: null,
        zIndex: 1,
        xAnchor: 0.5,
        yAnchor: 0.5,
      });
      dongLabelsRef.current.push(dongLabel);

      polygonGroupsRef.current.push({ dongName, guName, polygons, centroid: { lat: cLat, lng: cLng } });

      // guToDongsRef 구축
      if (!guToDongsRef.current[guName]) guToDongsRef.current[guName] = [];
      guToDongsRef.current[guName].push(dongName);
    });
  }

  // ── 구 폴리곤 ──
  function drawGuPolygons(map, geojson, kakao) {
    guPolygonGroupsRef.current = [];
    guLabelsRef.current = [];

    geojson.features.forEach((feature) => {
      const { geometry, properties } = feature;
      const guName = properties.gu_name;

      // Polygon 타입 (행정동과 달리 MultiPolygon 아님)
      const coords = geometry.type === "MultiPolygon"
        ? geometry.coordinates.map((rings) => rings[0])
        : [geometry.coordinates[0]];

      const polygons = coords.map((ring) => {
        const path = ring.map(([lng, lat]) => new kakao.maps.LatLng(lat, lng));
        return new kakao.maps.Polygon({ path, strokeWeight: 1.5, zIndex: 1, ...POLYGON_DEFAULT });
      });

      polygons.forEach((polygon) => {
        kakao.maps.event.addListener(polygon, "mouseover", () => {
          if (drawingModeRef.current) return;
          // 이전 호버 구가 mouseout 없이 남아있으면 강제 리셋
          const prev = hoveredGuGroupRef.current;
          if (prev && prev.guName !== guName) {
            const wasSelected = selectedGuGroupRef.current?.guName === prev.guName;
            const prevIsDongGu = selectedGroupRef.current?.guName === prev.guName;
            const hasSel = selectedGuGroupRef.current || selectedGroupRef.current;
            prev.polygons.forEach((p) => p.setOptions(
              (wasSelected || prevIsDongGu) ? POLYGON_GU_SELECTED : hasSel ? POLYGON_DIMMED : POLYGON_DEFAULT
            ));
          }
          hoveredGuGroupRef.current = { guName, polygons };
          const isSelectedGu = selectedGuGroupRef.current?.guName === guName;
          const isDongGu = selectedGroupRef.current?.guName === guName;
          if (!isSelectedGu && !isDongGu) polygons.forEach((p) => p.setOptions(POLYGON_HOVER));
          setHoveredDong({ dongName: null, guName });
        });
        kakao.maps.event.addListener(polygon, "mouseout", () => {
          if (drawingModeRef.current) return;
          hoveredGuGroupRef.current = null;
          const isSelected = selectedGuGroupRef.current?.guName === guName;
          const isDongGu   = selectedGroupRef.current?.guName === guName;
          const hasSel     = selectedGuGroupRef.current || selectedGroupRef.current;
          let style;
          if (isSelected || isDongGu) style = POLYGON_GU_SELECTED;
          else if (hasSel) style = POLYGON_DIMMED;
          else style = POLYGON_DEFAULT;
          polygons.forEach((p) => p.setOptions(style));
          setHoveredDong(null);
        });
        kakao.maps.event.addListener(polygon, "click", () => {
          if (drawingModeRef.current) return;
          // 모든 구 딤처리, 선택된 구만 투명(원래 지도 색)
          guPolygonGroupsRef.current.forEach(({ guName: gn, polygons: ps }) => {
            ps.forEach(p => p.setOptions(gn === guName ? POLYGON_GU_SELECTED : POLYGON_DIMMED));
          });
          selectedGuGroupRef.current = { guName, polygons };
          selectedGroupRef.current = null; // 이전 행정동 선택 초기화
          setSidebarCollapsed(false);
          setSelectedGu(guName);
          setSelectedDong(null); // 행정동 패널 닫기
          // 선택한 구 중심으로 이동 + 구 모드 유지하면서 줌인
          const map = mapInstanceRef.current;
          if (map) {
            smoothZoom(map, GU_MODE_LEVEL, () => map.panTo(new kakao.maps.LatLng(guCLat, guCLng)));
          }
        });
      });

      // 구 이름 라벨
      const guCoords = geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [geometry.coordinates];
      const [guCLng, guCLat] = getLargestRingCentroid(guCoords);
      const guCenter = new kakao.maps.LatLng(guCLat, guCLng);
      const guLabel = new kakao.maps.CustomOverlay({
        position: guCenter,
        content: `<div class="map-label map-label--gu">${guName}</div>`,
        map,
        zIndex: 1,
        xAnchor: 0.5,
        yAnchor: 0.5,
      });
      guLabelsRef.current.push(guLabel);

      guPolygonGroupsRef.current.push({ guName, polygons, centroid: { lat: guCLat, lng: guCLng } });
    });
  }


  // ── 상가 마커 관련 ──
  function clearStoreMarkers() {
    storeMarkersRef.current.forEach((m) => m.setMap(null));
    storeMarkersRef.current = [];
    if (storeInfoWindowRef.current) {
      storeInfoWindowRef.current.setMap(null);
      storeInfoWindowRef.current = null;
    }
    const map = mapInstanceRef.current;
    if (map && storeZoomListenerRef.current && window.kakao) {
      window.kakao.maps.event.removeListener(map, "zoom_changed", storeZoomListenerRef.current);
      storeZoomListenerRef.current = null;
    }
  }

  // 줌 레벨별 그리드 셀 크기 (도 단위) — 클수록 더 많이 묶임
  const CLUSTER_CELL = { 1:0, 2:0, 3:0.001, 4:0.002, 5:0.004, 6:0.008, 7:0.016, 8:0.03, 9:0.06, 10:0.12 };

  function clusterStores(stores, zoom) {
    const cellSize = CLUSTER_CELL[zoom] ?? 0.001;
    if (cellSize === 0) return stores.map((s) => ({ single: s }));
    const cells = {};
    stores.forEach((s) => {
      const key = `${Math.floor(s.경도 / cellSize)},${Math.floor(s.위도 / cellSize)}`;
      if (!cells[key]) cells[key] = [];
      cells[key].push(s);
    });
    return Object.values(cells).map((group) =>
      group.length === 1
        ? { single: group[0] }
        : {
            count: group.length,
            category: group[0].통합카테고리,
            lat: group.reduce((a, s) => a + s.위도, 0) / group.length,
            lng: group.reduce((a, s) => a + s.경도, 0) / group.length,
          }
    );
  }

  function renderStoreMarkers(map, stores) {
    clearStoreMarkers();
    const { kakao } = window;
    const zoom = map.getLevel();
    clusterStores(stores, zoom).forEach((item) => {
      if (item.single) {
        addPinMarker(map, item.single);
      } else {
        addClusterMarker(map, item);
      }
    });
    // 줌 변경 시 재렌더
    const handler = () => {
      const filtered = storeCategoryFilterRef.current.length === 0
        ? allStoresRef.current
        : allStoresRef.current.filter((s) => storeCategoryFilterRef.current.includes(s.통합카테고리));
      renderStoreMarkers(map, filtered);
    };
    storeZoomListenerRef.current = handler;
    kakao.maps.event.addListener(map, "zoom_changed", handler);
  }

  function addClusterMarker(map, { count, lat, lng }) {
    const { kakao } = window;
    const color = "#3B82F6";
    const size = Math.min(28 + Math.floor(Math.log2(count) * 5), 52);
    const el = document.createElement("div");
    el.style.cssText = `
      width:${size}px; height:${size}px;
      background: ${color};
      border: 2.5px solid #fff;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      box-shadow: 0 0 10px ${color}, 0 1px 4px rgba(0,0,0,0.4);
      font-family: 'Pretendard', sans-serif;
      font-size: ${size < 36 ? 11 : 13}px;
      font-weight: 700; color: #fff;
      transition: transform 0.2s;
    `;
    el.textContent = count > 999 ? "999+" : count;
    el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.15)"; });
    el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
    el.addEventListener("click", () => {
      map.setCenter(new kakao.maps.LatLng(lat, lng));
      map.setLevel(Math.max(1, map.getLevel() - 2));
    });
    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(lat, lng),
      content: el, xAnchor: 0.5, yAnchor: 0.5, zIndex: 6,
    });
    overlay.setMap(map);
    storeMarkersRef.current.push(overlay);
  }

  function addPinMarker(map, store) {
    const { kakao } = window;
    const color = STORE_CATEGORY_COLORS[store.통합카테고리] || "#9E9E9E";

      // 핀 마커 DOM
      const el = document.createElement("div");
      el.title = store.상호명;
      el.style.cssText = `
        display: flex; align-items: flex-end; justify-content: center;
        cursor: pointer;
        filter: none;
        transition: transform 0.2s cubic-bezier(0.34, 1.7, 0.64, 1);
        transform-origin: bottom center;
      `;
      el.innerHTML = `
        <svg width="22" height="30" viewBox="0 0 22 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 0C4.925 0 0 4.925 0 11c0 8.25 11 19 11 19s11-10.75 11-19C22 4.925 17.075 0 11 0z" fill="${color}"/>
          <circle cx="11" cy="11" r="4.5" fill="white" fill-opacity="0.85"/>
        </svg>
      `;
      el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.5)"; });
      el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
      el.addEventListener("click", () => {
        // 기존 팝업 닫기
        if (storeInfoWindowRef.current) {
          storeInfoWindowRef.current.setMap(null);
          storeInfoWindowRef.current = null;
        }
        const popup = document.createElement("div");
        popup.style.cssText = `
          background: rgba(20,20,30,0.95);
          border: 1.5px solid ${color};
          border-radius: 10px;
          padding: 8px 12px;
          font-family: 'Pretendard', sans-serif;
          min-width: 140px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.6);
          pointer-events: auto;
          position: relative;
        `;
        popup.innerHTML = `
          <div style="font-size:11px;color:${color};font-weight:700;margin-bottom:3px;">${store.통합카테고리}</div>
          <div style="font-size:13px;font-weight:700;color:#E8E8E8;margin-bottom:2px;">${store.상호명}</div>
          <div style="font-size:10px;color:#9E9E9E;">${store.상권업종소분류명}</div>
          ${store.도로명주소 ? `<div style="font-size:10px;color:#777;margin-top:4px;border-top:1px solid #333;padding-top:4px;">${store.도로명주소}</div>` : ""}
        `;
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "✕";
        closeBtn.style.cssText = `
          position:absolute; top:6px; right:8px;
          border:none; background:none; color:#9E9E9E;
          cursor:pointer; font-size:12px; padding:0; line-height:1;
        `;
        closeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (storeInfoWindowRef.current) {
            storeInfoWindowRef.current.setMap(null);
            storeInfoWindowRef.current = null;
          }
        });
        popup.appendChild(closeBtn);

        const infoOverlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(store.위도, store.경도),
          content: popup,
          xAnchor: 0.5,
          yAnchor: 1.6,
          zIndex: 10,
        });
        infoOverlay.setMap(map);
        storeInfoWindowRef.current = infoOverlay;
      });

      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(store.위도, store.경도),
        content: el,
        xAnchor: 0.5,
        yAnchor: 1.0,
        zIndex: 5,
      });
      overlay.setMap(map);
      storeMarkersRef.current.push(overlay);
  }

  function getFilteredStores() {
    return storeCategoryFilterRef.current.length === 0
      ? allStoresRef.current
      : allStoresRef.current.filter((s) => storeCategoryFilterRef.current.includes(s.통합카테고리));
  }

  function clearStreetPolygons() {
    streetPolygonGroupsRef.current.forEach(({ polygons }) =>
      polygons.forEach((p) => p.setMap(null))
    );
    streetPolygonGroupsRef.current = [];
    selectedStreetRef.current = null;
    setSelectedStreet(null);
    setStreetResults(null);
    setStreetCount(0);
  }

  function drawStreetPolygons(map, kakao, dongName) {
    clearStreetPolygons();
    const load = (geoJson) => {
      const features = geoJson.features.filter(
        (f) => f.properties.행정동명 === dongName
      );
      if (!features.length) return;

      features.forEach((feature) => {
        const { 상권_코드, 상권_코드_명 } = feature.properties;
        const geom = feature.geometry;
        const rings = geom.type === "MultiPolygon"
          ? geom.coordinates.flat()
          : geom.coordinates;

        const polygons = rings.map((ring) => {
          const path = ring.map(([lng, lat]) => new kakao.maps.LatLng(lat, lng));
          const polygon = new kakao.maps.Polygon({
            map,
            path,
            ...POLYGON_STREET_DEFAULT,
          });
          polygon.setZIndex(10);

          kakao.maps.event.addListener(polygon, "click", () => {
            if (drawingModeRef.current) return;
            // 이전 선택 해제
            if (selectedStreetRef.current) {
              streetPolygonGroupsRef.current
                .find((g) => g.상권코드 === selectedStreetRef.current.상권코드)
                ?.polygons.forEach((p) => p.setOptions(POLYGON_STREET_DEFAULT));
            }
            // 현재 선택
            streetPolygonGroupsRef.current
              .find((g) => g.상권코드 === 상권_코드)
              ?.polygons.forEach((p) => p.setOptions(POLYGON_STREET_SELECTED));

            selectedStreetRef.current = { 상권코드: 상권_코드, 상권명: 상권_코드_명 };
            setSelectedStreet({ 상권코드: 상권_코드, 상권명: 상권_코드_명 });

            setStreetLoading(true);
            setStreetResults(null);
            setStreetSpotResults(null);
            setStreetSpotCategory(null);
            clearStreetSpotMarkers();
            fetch(`http://localhost:8000/api/recommend/street-industry/?상권코드=${상권_코드}`)
              .then((r) => r.json())
              .then((data) => { setStreetResults(data); setStreetLoading(false); })
              .catch(() => setStreetLoading(false));
          });

          return polygon;
        });

        streetPolygonGroupsRef.current.push({ 상권코드: 상권_코드, 상권명: 상권_코드_명, polygons });
      });
      setStreetCount(streetPolygonGroupsRef.current.length);
    };

    if (streetGeoJsonRef.current) {
      load(streetGeoJsonRef.current);
    } else {
      fetch("/street_boundaries.geojson")
        .then((r) => r.json())
        .then((geoJson) => {
          streetGeoJsonRef.current = geoJson;
          load(geoJson);
        });
    }
  }

  // ── 행정동 선택 + 마커 토글 변경 시: 상가 마커 fetch ──
  useEffect(() => {
    clearStoreMarkers();
    allStoresRef.current = [];
    const map = mapInstanceRef.current;
    if (!showStoreMarkers || !selectedDong || !map || !window.kakao) return;

    let cancelled = false;
    setStoreLoading(true);
    const params = new URLSearchParams({ dong: normalizeDongName(selectedDong.dongName), limit: 1000 });

    fetch(`http://localhost:8000/api/stores/?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        allStoresRef.current = data.stores || [];
        renderStoreMarkers(map, getFilteredStores());
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setStoreLoading(false); });

    return () => { cancelled = true; };
  }, [showStoreMarkers, selectedDong]);

  // ── 필터 변경 시: ref 동기화 + 마커 재렌더 ──
  useEffect(() => {
    storeCategoryFilterRef.current = storeCategoryFilter;
    const map = mapInstanceRef.current;
    if (!showStoreMarkers || !map || !window.kakao || !allStoresRef.current.length) return;
    renderStoreMarkers(map, getFilteredStores());
  }, [storeCategoryFilter]);

  // 업종 필터 선택 시 상가 마커 자동 표시
  useEffect(() => {
    if (selectedIndustry && selectedDong) {
      setStoreCategoryFilter([selectedIndustry]);
      setShowStoreMarkers(true);
    }
  }, [selectedIndustry]);

  // 행정동 패널 닫힐 때 마커 + 점수 초기화
  useEffect(() => {
    if (!selectedDong) {
      clearStoreMarkers();
      setShowStoreMarkers(false);
      setMarkerPanelOpen(false);
      setStoreCategoryFilter([]);
      setStoreDrillGroup(null);
      setScoreData(null);
      setSelectedScoreCat(null);
    }
  }, [selectedDong]);

  // 행정동 선택 시 전체 업종 점수 fetch
  useEffect(() => {
    if (!selectedDong) return;
    fetch(`http://localhost:8000/api/score-all/?dong=${encodeURIComponent(normalizeDongName(selectedDong.dongName))}`)
      .then((r) => r.json())
      .then((data) => setScoreData(data.scores || []))
      .catch(() => setScoreData([]));
  }, [selectedDong]);

  // ── 행정동 변경 시: 분기 목록 fetch + 선택 분기 초기화 ──
  useEffect(() => {
    if (!selectedDong) {
      setAvailableQuarters([]);
      setSelectedQuarter(null);
      return;
    }
    setAvailableQuarters([]);
    setSelectedQuarter(null);
    fetch(`http://localhost:8000/api/quarters/?dong=${encodeURIComponent(normalizeDongName(selectedDong.dongName))}`)
      .then((r) => r.json())
      .then((data) => setAvailableQuarters(data.quarters || []))
      .catch(() => setAvailableQuarters([]));
  }, [selectedDong]);

  // ── 행정동 또는 선택 분기 변경 시: 분석 데이터 fetch ──
  useEffect(() => {
    if (!selectedDong) return;
    setDongData(null);
    setDongStatsOpen(false);
    setReportOpen(false);
    setReportData(null);
    setReportCategory("");
    setDongLoading(true);
    const url = selectedQuarter
      ? `http://localhost:8000/api/analysis/?dong=${encodeURIComponent(normalizeDongName(selectedDong.dongName))}&quarter=${selectedQuarter}`
      : `http://localhost:8000/api/analysis/?dong=${encodeURIComponent(normalizeDongName(selectedDong.dongName))}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setDongData(data))
      .catch(() => setDongData(null))
      .finally(() => setDongLoading(false));
  }, [selectedDong, selectedQuarter]);

  // ── 검색창 열림/닫힘 시 사이드바 토글 ──
  useEffect(() => {
    if (searchExpanded) {
      setSidebarCollapsed(true);
    } else {
      if (selectedDong || selectedGu) setSidebarCollapsed(false);
    }
  }, [searchExpanded]);

  // ── 구 변경 시: 분기 목록 fetch ──
  useEffect(() => {
    if (!selectedGu) {
      setGuAvailableQuarters([]);
      setGuSelectedQuarter(null);
      return;
    }
    setGuAvailableQuarters([]);
    setGuSelectedQuarter(null);
    const dongs = guToDongsRef.current[selectedGu] || [];
    if (!dongs.length) return;
    fetch(`http://localhost:8000/api/gu-quarters/?dongs=${encodeURIComponent(dongs.join(","))}`)
      .then((r) => r.json())
      .then((data) => setGuAvailableQuarters(data.quarters || []))
      .catch(() => setGuAvailableQuarters([]));
  }, [selectedGu]);

  // ── 구 또는 구 선택 분기 변경 시: 분석 데이터 fetch ──
  useEffect(() => {
    if (!selectedGu) return;
    const dongs = guToDongsRef.current[selectedGu] || [];
    if (!dongs.length) return;
    setGuData(null);
    setGuLoading(true);
    fetch("http://localhost:8000/api/gu-analysis/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gu: selectedGu,
        dongs,
        gu_dongs_map: guToDongsRef.current,
        quarter: guSelectedQuarter || null,
      }),
    })
      .then((r) => r.json())
      .then((data) => setGuData(data))
      .catch(() => setGuData(null))
      .finally(() => setGuLoading(false));
  }, [selectedGu, guSelectedQuarter]);

  // ── 위치추천 마커 제거 ──
  function clearSpotMarkers() {
    spotMarkersRef.current.forEach((m) => m.setMap(null));
    spotMarkersRef.current = [];
  }

  // ── 상권 입지추천 마커 제거 ──
  function clearStreetSpotMarkers() {
    streetSpotMarkersRef.current.forEach((m) => m.setMap(null));
    streetSpotMarkersRef.current = [];
  }

  // ── 상권 직접 그리기 ──
  function hideAllPolygons() {
    polygonGroupsRef.current.forEach(({ polygons }) => polygons.forEach(p => p.setMap(null)));
    guPolygonGroupsRef.current.forEach(({ polygons }) => polygons.forEach(p => p.setMap(null)));
    streetPolygonGroupsRef.current.forEach(({ polygons }) => polygons.forEach(p => p.setMap(null)));
    dongLabelsRef.current.forEach(l => l.setMap(null));
    guLabelsRef.current.forEach(l => l.setMap(null));
  }

  function restoreAllPolygons() {
    const map = mapInstanceRef.current;
    if (!map) return;
    applyMode(map, map.getLevel());
    streetPolygonGroupsRef.current.forEach(({ 상권코드, polygons }) => {
      const isSelected = selectedStreetRef.current?.상권코드 === 상권코드;
      polygons.forEach(p => {
        p.setMap(map);
        p.setOptions(isSelected ? POLYGON_STREET_SELECTED : POLYGON_STREET_DEFAULT);
      });
    });
  }

  function clearCustomDrawing() {
    const map = mapInstanceRef.current;
    const kakao = window.kakao;
    if (map && kakao) {
      if (drawingClickListenerRef.current) {
        kakao.maps.event.removeListener(map, "click", drawingClickListenerRef.current);
        drawingClickListenerRef.current = null;
      }
      if (drawingMousemoveListenerRef.current) {
        kakao.maps.event.removeListener(map, "mousemove", drawingMousemoveListenerRef.current);
        drawingMousemoveListenerRef.current = null;
      }
      map.setZoomable(true);
      restoreAllPolygons();
    }
    drawingPointsRef.current = [];
    if (drawingPolylineRef.current) { drawingPolylineRef.current.setMap(null); drawingPolylineRef.current = null; }
    if (drawingPreviewRef.current) { drawingPreviewRef.current.setMap(null); drawingPreviewRef.current = null; }
    if (customPolygonRef.current) { customPolygonRef.current.setMap(null); customPolygonRef.current = null; }
    drawingDotsRef.current.forEach((d) => d.setMap(null));
    drawingDotsRef.current = [];
    customMarkersRef.current.forEach((m) => m.setMap(null));
    customMarkersRef.current = [];
    setCustomResults(null);
    setCustomCategory("");
    setCustomPolygonDone(false);
  }

  function startDrawing() {
    const map = mapInstanceRef.current;
    const kakao = window.kakao;
    if (!map || !kakao) return;

    // 기존 리스너 먼저 제거
    if (drawingClickListenerRef.current) {
      kakao.maps.event.removeListener(map, "click", drawingClickListenerRef.current);
      drawingClickListenerRef.current = null;
    }
    if (drawingMousemoveListenerRef.current) {
      kakao.maps.event.removeListener(map, "mousemove", drawingMousemoveListenerRef.current);
      drawingMousemoveListenerRef.current = null;
    }

    clearCustomDrawing();
    drawingModeRef.current = true;
    setDrawingMode(true);
    setCustomPolygonDone(false);
    map.setZoomable(false);
    hideAllPolygons();

    // 버튼 클릭 이벤트가 지도로 전파되는 것을 방지하기 위해 딜레이 후 리스너 등록
    setTimeout(() => {
      if (!drawingModeRef.current) return; // 딜레이 중 취소된 경우 등록 안 함

      const clickHandler = (e) => {
        if (!drawingModeRef.current) return;
        const latlng = e.latLng;
        const points = drawingPointsRef.current;

        // 첫 번째 점 근처 클릭 시 폴리곤 닫기
        if (points.length >= 3) {
          const first = points[0];
          const dist = Math.abs(latlng.getLat() - first.getLat()) + Math.abs(latlng.getLng() - first.getLng());
          if (dist < 0.0005) {
            finishPolygon(map, kakao);
            return;
          }
        }

        points.push(latlng);

        // 꼭짓점 점 표시
        const dotContent = `<div style="width:10px;height:10px;background:#F59E0B;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></div>`;
        const dot = new kakao.maps.CustomOverlay({ position: latlng, content: dotContent, xAnchor: 0.5, yAnchor: 0.5, zIndex: 20 });
        dot.setMap(map);
        drawingDotsRef.current.push(dot);

        // 폴리라인 업데이트
        if (drawingPolylineRef.current) drawingPolylineRef.current.setMap(null);
        if (points.length >= 2) {
          drawingPolylineRef.current = new kakao.maps.Polyline({
            map, path: points,
            strokeWeight: 2, strokeColor: "#F59E0B", strokeOpacity: 0.9, strokeStyle: "solid",
          });
        }
      };
      drawingClickListenerRef.current = clickHandler;
      kakao.maps.event.addListener(map, "click", clickHandler);

      const mousemoveHandler = (e) => {
        if (!drawingModeRef.current || drawingPointsRef.current.length === 0) return;
        const points = drawingPointsRef.current;
        if (drawingPreviewRef.current) drawingPreviewRef.current.setMap(null);
        drawingPreviewRef.current = new kakao.maps.Polyline({
          map, path: [points[points.length - 1], e.latLng],
          strokeWeight: 2, strokeColor: "#F59E0B", strokeOpacity: 0.5, strokeStyle: "dashed",
        });
      };
      drawingMousemoveListenerRef.current = mousemoveHandler;
      kakao.maps.event.addListener(map, "mousemove", mousemoveHandler);
    }, 200);
  }

  function finishPolygon(map, kakao) {
    const points = drawingPointsRef.current;
    if (points.length < 3) return;

    drawingModeRef.current = false;
    setDrawingMode(false);
    map.setZoomable(true);
    restoreAllPolygons();
    if (drawingClickListenerRef.current) {
      kakao.maps.event.removeListener(map, "click", drawingClickListenerRef.current);
      drawingClickListenerRef.current = null;
    }
    if (drawingMousemoveListenerRef.current) {
      kakao.maps.event.removeListener(map, "mousemove", drawingMousemoveListenerRef.current);
      drawingMousemoveListenerRef.current = null;
    }

    if (drawingPolylineRef.current) { drawingPolylineRef.current.setMap(null); drawingPolylineRef.current = null; }
    if (drawingPreviewRef.current) { drawingPreviewRef.current.setMap(null); drawingPreviewRef.current = null; }

    customPolygonRef.current = new kakao.maps.Polygon({
      map, path: points,
      strokeWeight: 2, strokeColor: "#F59E0B", strokeOpacity: 1,
      fillColor: "#F59E0B", fillOpacity: 0.15,
    });

    setCustomPolygonDone(true);
  }

  function fetchCustomSpot(category) {
    const points = drawingPointsRef.current;
    if (points.length < 3) return;

    customMarkersRef.current.forEach((m) => m.setMap(null));
    customMarkersRef.current = [];
    setCustomResults(null);
    setCustomLoading(true);

    const coordinates = points.map((p) => [p.getLat(), p.getLng()]);

    fetch("http://localhost:8000/api/recommend/custom-spot/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates, category }),
    })
      .then((r) => r.json())
      .then((data) => {
        setCustomLoading(false);
        if (data.error) { alert(data.error); return; }
        setCustomResults(data.results);

        const map = mapInstanceRef.current;
        const kakao = window.kakao;
        if (!map || !data.results.length) return;

        const colors = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6"];
        data.results.forEach((r, idx) => {
          const pos = new kakao.maps.LatLng(r.lat, r.lng);
          const content = `<div style="background:${colors[idx]};color:#fff;font-size:12px;font-weight:700;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.4);border:2px solid #fff;">${idx + 1}</div>`;
          const overlay = new kakao.maps.CustomOverlay({ position: pos, content, zIndex: 15 });
          overlay.setMap(map);
          customMarkersRef.current.push(overlay);
        });

        const bounds = new kakao.maps.LatLngBounds();
        data.results.forEach((r) => bounds.extend(new kakao.maps.LatLng(r.lat, r.lng)));
        map.setBounds(bounds, 80);
      })
      .catch(() => { setCustomLoading(false); alert("요청에 실패했습니다."); });
  }

  // ── 상권 클릭 → 업종 선택 → 입지 추천 요청 ──
  function handleStreetSpotRecommend(상권코드, category) {
    clearStreetSpotMarkers();
    setStreetSpotCategory(category);
    setStreetSpotResults(null);
    setStreetSpotLoading(true);

    fetch(`http://localhost:8000/api/recommend/street-spot/?상권코드=${encodeURIComponent(상권코드)}&category=${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((data) => {
        setStreetSpotLoading(false);
        if (data.error) { alert(data.error); return; }
        setStreetSpotResults(data.results);

        const map = mapInstanceRef.current;
        if (!map || !data.results.length) return;

        const positions = data.results.map((r) => new window.kakao.maps.LatLng(r.lat, r.lng));
        data.results.forEach((r, idx) => {
          const pos = new window.kakao.maps.LatLng(r.lat, r.lng);
          const colors = ["#1D4ED8", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD"];
          const color = colors[idx] || "#6B7280";
          const sizes = [38, 32, 28, 24, 22];
          const w = sizes[idx] || 22;
          const h = Math.round(w * 30 / 22);
          const fontSize = [11, 10, 9, 8, 8][idx] || 8;
          const el = document.createElement("div");
          el.style.cssText = "display:flex;align-items:flex-end;justify-content:center;cursor:pointer;";
          el.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 22 30" fill="none"><path d="M11 0C4.925 0 0 4.925 0 11c0 8.25 11 19 11 19s11-10.75 11-19C22 4.925 17.075 0 11 0z" fill="${color}"/><text x="11" y="15" text-anchor="middle" fill="white" font-size="${fontSize}" font-weight="700" font-family="sans-serif">${idx + 1}</text></svg>`;
          el.addEventListener("click", () => {
            map.panTo(pos);
            const cur = map.getLevel();
            let level = cur;
            const step = () => {
              if (level <= 1) return;
              level -= 1;
              map.setLevel(level, { animate: true });
              setTimeout(step, 400);
            };
            setTimeout(step, 500);
          });
          const overlay = new window.kakao.maps.CustomOverlay({ position: pos, content: el, zIndex: 15 });
          overlay.setMap(map);
          streetSpotMarkersRef.current.push(overlay);
        });

        const bounds = new window.kakao.maps.LatLngBounds();
        positions.forEach((p) => bounds.extend(p));
        map.setBounds(bounds, 80);
      })
      .catch(() => { setStreetSpotLoading(false); alert("입지 추천 요청에 실패했습니다."); });
  }

  // ── 행정동 클릭 → 위치 추천 요청 (dong 모드 결과에서) ──
  function handleSpotRecommend(dongName, category) {
    clearSpotMarkers();
    setSpotDong(dongName);
    setSpotCategory(category);
    setAiStep("spot_loading");

    fetch(`http://localhost:8000/api/recommend/spot/?dong=${encodeURIComponent(dongName)}&category=${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { alert(data.error); setAiStep("result"); return; }
        setSpotResults(data.results);
        setAiStep("spot");

        const map = mapInstanceRef.current;
        if (!map) return;

        // 행정동으로 지도 이동 후 마커 표시
        const positions = data.results.map((r) => new window.kakao.maps.LatLng(r.lat, r.lng));

        data.results.forEach((r, idx) => {
          const pos = new window.kakao.maps.LatLng(r.lat, r.lng);
          const colors = ["#1D4ED8", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD"];
          const color = colors[idx] || "#6B7280";
          const sizes = [38, 32, 28, 24, 22];
          const w = sizes[idx] || 22;
          const h = Math.round(w * 30 / 22);
          const fontSize = [11, 10, 9, 8, 8][idx] || 8;
          const el = document.createElement("div");
          el.style.cssText = "display:flex;align-items:flex-end;justify-content:center;cursor:pointer;";
          el.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 22 30" fill="none"><path d="M11 0C4.925 0 0 4.925 0 11c0 8.25 11 19 11 19s11-10.75 11-19C22 4.925 17.075 0 11 0z" fill="${color}"/><text x="11" y="15" text-anchor="middle" fill="white" font-size="${fontSize}" font-weight="700" font-family="sans-serif">${idx + 1}</text></svg>`;
          el.addEventListener("click", () => {
            map.panTo(pos);
            const cur = map.getLevel();
            let level = cur;
            const step = () => {
              if (level <= 1) return;
              level -= 1;
              map.setLevel(level, { animate: true });
              setTimeout(step, 400);
            };
            setTimeout(step, 500);
          });
          const overlay = new window.kakao.maps.CustomOverlay({ position: pos, content: el, zIndex: 10 });
          overlay.setMap(map);
          spotMarkersRef.current.push(overlay);
        });

        // 마커들 중심으로 지도 이동
        if (positions.length > 0) {
          const bounds = new window.kakao.maps.LatLngBounds();
          positions.forEach((p) => bounds.extend(p));
          map.setBounds(bounds, 80);
        }
      })
      .catch(() => { alert("위치 추천 요청에 실패했습니다."); setAiStep("result"); });
  }

  // ── 지역 자동완성 검색 헬퍼 ──
  function searchRegionSuggest(query, type, setSugg) {
    if (!query.trim()) { setSugg([]); return; }
    fetch(`http://localhost:8000/api/search/regions/?q=${encodeURIComponent(query)}&type=${type}`)
      .then(r => r.json())
      .then(d => setSugg(d.results || []))
      .catch(() => setSugg([]));
  }

  // ── 지역 비교 요청 ──
  function handleCompareRegion() {
    const nameA = cmpRegionType === "dong" ? cmpRegionASelected?.dong : cmpRegionASelected;
    const nameB = cmpRegionType === "dong" ? cmpRegionBSelected?.dong : cmpRegionBSelected;
    if (!nameA || !nameB || !cmpRegionCat) return;
    setAiStep("loading");
    fetch(`http://localhost:8000/api/compare/region/?type=${cmpRegionType}&a=${encodeURIComponent(nameA)}&b=${encodeURIComponent(nameB)}&category=${encodeURIComponent(cmpRegionCat)}`)
      .then(r => r.json())
      .then(data => { setAiResults(data); setAiStep("result"); })
      .catch(() => setAiStep("form"));
  }

  // ── 업종 비교 요청 ──
  function handleCompareIndustry() {
    const regionName = cmpIndRegionType === "dong" ? cmpIndRegionSelected?.dong : cmpIndRegionSelected;
    if (!regionName || !cmpIndCatA || !cmpIndCatB) return;
    setAiStep("loading");
    fetch(`http://localhost:8000/api/compare/industry/?region=${encodeURIComponent(regionName)}&region_type=${cmpIndRegionType}&cat_a=${encodeURIComponent(cmpIndCatA)}&cat_b=${encodeURIComponent(cmpIndCatB)}`)
      .then(r => r.json())
      .then(data => { setAiResults(data); setAiStep("result"); })
      .catch(() => setAiStep("form"));
  }

  // ── AI 추천 요청 ──
  function handleAiRecommend() {
    if (aiMode === "dong" && !aiIndustry) return;
    if (aiMode === "industry" && !aiDong.trim()) return;
    if (aiMode === "score" && (!aiDong.trim() || !aiIndustry)) return;
    if (aiMode === "gu" && (!aiGu || !aiIndustry)) return;
    setAiStep("loading");
    setAiIndustrySuggestions([]);

    const MIN_LOADING_MS = 1200;
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    if (aiMode === "dong") {
      Promise.all([
        fetch(`http://localhost:8000/api/recommend/location/?업종=${encodeURIComponent(aiIndustry.trim())}`).then((r) => r.json()),
        delay(MIN_LOADING_MS),
      ])
        .then(([data]) => {
          if (data.error) { alert(data.error); setAiStep("form"); return; }
          const enriched = data.results.map((r) => ({
            ...r,
            guName: polygonGroupsRef.current.find((g) => g.dongName === r.dongName)?.guName ?? "",
            revenue: r.당월매출합,
            stores: r.소분류_점포수,
            통합카테고리: data.통합카테고리,
          }));
          setAiResults(enriched);
          setAiStep("result");
        })
        .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("form"); });
      return;
    }

    if (aiMode === "industry") {
      Promise.all([
        fetch(`http://localhost:8000/api/recommend/industry/?dong=${encodeURIComponent(aiDong.trim())}`).then((r) => r.json()),
        delay(MIN_LOADING_MS),
      ])
        .then(([data]) => {
          if (data.error) { alert(data.error); setAiStep("form"); return; }
          setAiResults(data.results);
          setAiStep("result");
        })
        .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("form"); });
      return;
    }

    if (aiMode === "score") {
      Promise.all([
        fetch(`http://localhost:8000/api/recommend/score/?dong=${encodeURIComponent(aiDong.trim())}&category=${encodeURIComponent(aiIndustry)}`).then((r) => r.json()),
        delay(MIN_LOADING_MS),
      ])
        .then(([data]) => {
          if (data.error) { alert(data.error); setAiStep("form"); return; }
          setAiResults(data);
          setAiStep("result");
        })
        .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("form"); });
      return;
    }

    if (aiMode === "gu") {
      setAiGuResultTab("dong");
      setAiGuStreetResults(null);
      setAiGuDongError(null);
      Promise.all([
        fetch(`http://localhost:8000/api/recommend/location/?업종=${encodeURIComponent(aiIndustry)}&gu=${encodeURIComponent(aiGu)}`).then((r) => r.json()),
        fetch(`http://localhost:8000/api/recommend/gu-streets/?gu=${encodeURIComponent(aiGu)}&category=${encodeURIComponent(aiIndustry)}`).then((r) => r.json()),
        delay(MIN_LOADING_MS),
      ])
        .then(([dongData, streetData]) => {
          if (dongData.error && streetData.error) {
            alert(dongData.error);
            setAiStep("form");
            return;
          }
          if (dongData.error) {
            setAiGuDongError(dongData.error);
            setAiResults([]);
          } else {
            setAiResults((dongData.results || []).map((r) => ({
              ...r,
              revenue: r.당월매출합,
              stores: r.소분류_점포수,
              통합카테고리: dongData.통합카테고리,
            })));
          }
          setAiGuStreetResults(streetData.results || []);
          setAiStep("result");
        })
        .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("form"); });
      return;
    }
  }

  // ── 구 매출 순위 1회 fetch (데이터 없을 때만) ──
  useEffect(() => {
    if (guAllRanking.length > 0) return;
    const guDongsMap = guToDongsRef.current;
    if (!guDongsMap || Object.keys(guDongsMap).length === 0) return;
    fetch("http://localhost:8000/api/gu-all-ranking/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gu_dongs_map: guDongsMap }),
    })
      .then((r) => r.json())
      .then((d) => setGuAllRanking(d.rankings || []))
      .catch(() => {});
  }, [zoomLevel, guAllRanking.length]);

  // ── 구 패널에서 행정동 선택 → 줌인 + 선택 ──
  function handleSelectDongFromGu(dongName) {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao) return;

    const group = polygonGroupsRef.current.find(
      (g) => g.dongName === dongName && g.guName === selectedGu
    );
    if (!group) return;

    // 구 폴리곤 초기화
    if (selectedGuGroupRef.current) {
      selectedGuGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
      selectedGuGroupRef.current = null;
    }
    // 모든 행정동 딤처리, 선택된 것만 강조
    polygonGroupsRef.current.forEach(({ dongName: dn, polygons: ps }) => {
      ps.forEach(p => p.setOptions(dn === group.dongName ? POLYGON_GU_SELECTED : POLYGON_DIMMED));
    });
    selectedGroupRef.current = group;

    smoothZoom(map, 4, () => {
      map.panTo(new window.kakao.maps.LatLng(group.centroid.lat, group.centroid.lng));
    });

    setSelectedGu(null);
    setSelectedDong({ dongName, guName: group.guName });
  }

  function openAiModal({ region = null, industry = null, dong = "" } = {}) {
    setAiModalOpen(true);
    setAiStep("mode");
    setAiMode(null);
    setAiIndustry(industry);
    setAiRegion(region);
    setAiDong(dong);
    setAiResults(null);
    setAiSubIndustry("");
    setAiIndustrySuggestions([]);
    setAiIndustrySearchQuery("");
    setAiIndustryDrillGroup(null);
    setAiIndustrySuggestions([]);
    setAiIndustrySuggestOpen(false);
    setMenuOpen(false);
    setSearchExpanded(false);
  }

  function openAiDongRecommend(dongName, guName) {
    setAiModalOpen(true);
    setAiMode("industry");
    setAiDong(dongName);
    setAiRegion(guName);
    setAiIndustry(null);
    setAiResults(null);
    setShowIndustryPicker(false);
    setMenuOpen(false);
    setSearchExpanded(false);
    setAiStep("loading");
    Promise.all([
      fetch(`http://localhost:8000/api/recommend/industry/?dong=${encodeURIComponent(dongName.trim())}`).then((r) => r.json()),
      new Promise((res) => setTimeout(res, 1200)),
    ])
      .then(([data]) => {
        if (data.error) { alert(data.error); setAiStep("form"); return; }
        setAiResults(data.results);
        setAiStep("result");
      })
      .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("form"); });
  }

  // ── 검색어 변경 시 결과 필터링 ──
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) { setSearchResults([]); return; }
    const results = [];
    // 구 이름 매칭 (우선)
    guPolygonGroupsRef.current.forEach(({ guName, centroid }) => {
      if (guName.includes(q)) results.push({ type: "gu", guName, dongName: null, centroid });
    });
    // 행정동 이름 매칭
    polygonGroupsRef.current.forEach(({ dongName, guName, centroid }) => {
      if (dongName.includes(q)) results.push({ type: "dong", guName, dongName, centroid });
    });
    setSearchResults(results.slice(0, 10));
  }, [searchQuery]);

  // ── 검색 결과 선택 → 지도 이동 + 폴리곤 선택 ──
  function handleSelectResult({ type, guName, dongName, centroid }) {
    const map = mapInstanceRef.current;
    if (!map || !centroid) return;
    setSearchQuery("");
    setSearchResults([]);

    if (type === "gu") {
      // 구 선택 시 구 모드 유지하면서 줌인
      const doPan = () => map.panTo(new window.kakao.maps.LatLng(centroid.lat, centroid.lng));
      smoothZoom(map, GU_MODE_LEVEL, doPan);
      const group = guPolygonGroupsRef.current.find((g) => g.guName === guName);
      if (group) {
        guPolygonGroupsRef.current.forEach(({ guName: gn, polygons: ps }) => {
          ps.forEach(p => p.setOptions(gn === guName ? POLYGON_GU_SELECTED : POLYGON_DIMMED));
        });
        selectedGuGroupRef.current = group;
      }
      if (selectedGroupRef.current) {
        selectedGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
        selectedGroupRef.current = null;
      }
      setSelectedDong(null);
      setSelectedGu(guName);
    } else {
      // 행정동 모드로 줌인 후 선택 (레벨 5 이하면 이미 충분히 확대 → 이동 안 함)
      const currentLevel = map.getLevel();
      const doPan = () => map.panTo(new window.kakao.maps.LatLng(centroid.lat, centroid.lng));
      if (currentLevel >= GU_MODE_LEVEL) smoothZoom(map, 5, doPan);
      else if (currentLevel > 5) doPan();
      const group = polygonGroupsRef.current.find((g) => g.dongName === dongName && g.guName === guName);
      if (group) {
        polygonGroupsRef.current.forEach(({ dongName: dn, polygons: ps }) => {
          ps.forEach(p => p.setOptions(dn === dongName ? POLYGON_DONG_SELECTED : POLYGON_DIMMED));
        });
        selectedGroupRef.current = group;
      }
      if (selectedGuGroupRef.current) {
        selectedGuGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
        selectedGuGroupRef.current = null;
      }
      setSelectedGu(null);
      setSelectedDong({ dongName, guName });
    }
  }

  // ── 팝업 외부 클릭 시 닫기 ──
  // selectedDong/Gu/Industry를 의존성에 포함해 stale closure 방지
  useEffect(() => {
    const handleClickOutside = (e) => {
      // data-popup 영역과 data-sidebar 영역 밖을 클릭한 경우
      if (!e.target.closest("[data-popup]") && !e.target.closest("[data-sidebar]")) {
        setMenuOpen(false);
        setSearchExpanded(false);
        setQuarterPopupOpen(false);
        setGuQuarterPopupOpen(false);
        // 선택된 항목이 없으면 사이드바도 자동으로 닫기
        if (!selectedDong && !selectedGu && !selectedIndustry) {
          setSidebarCollapsed(true);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedDong, selectedGu, selectedIndustry]); // 선택 상태 바뀔 때마다 핸들러 갱신

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", fontFamily: "'Pretendard', sans-serif" }}>

      {/* 지도 영역 */}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* 페이드인 오버레이 */}
      <div style={{
        position: "fixed", inset: 0, background: "#fff",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.7s ease",
        pointerEvents: "none",
        zIndex: 9999,
      }} />


      {/* ── 플로팅 보고서 카드 (항상 표시, 보고서 열리면 숨김) ── */}
      {!reportOpen && (
        <div
          className="anim-pop-in"
          style={{
            position: "absolute",
            top: NAV_HEIGHT + 16,
            left: 16,
            width: 300,
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            border: "1px solid #E5E7EB",
            zIndex: 14,
            overflow: "hidden",
          }}
        >
          {/* 카드 헤더 */}
          <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #F3F4F6" }}>
            {(selectedDong || selectedGu) ? (
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3 }}>
                    {selectedDong ? `서울특별시 ${selectedDong.guName}` : "서울특별시"}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
                    {selectedDong?.dongName || selectedGu}
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>전체 상권 분석</div>
                </div>
                {(() => {
                  const data = selectedDong ? dongData : guData;
                  if (!data?.총매출) return null;
                  const 변동률 = data.매출변동률;
                  const 매출 = data.총매출;
                  const 매출텍스트 = 매출 >= 100_000_000 ? `${(매출 / 100_000_000).toFixed(0)}억` : `${Math.round(매출 / 10_000)}만`;
                  return (
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#2563EB" }}>{매출텍스트}</div>
                      {변동률 != null && (
                        <div style={{ fontSize: 15, fontWeight: 700, color: 변동률 >= 0 ? "#10B981" : "#F87171", marginTop: 2 }}>
                          {변동률 >= 0 ? "+" : ""}{변동률}%
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>전년 동분기 대비</div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>상권분석</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>지도에서 구 또는 행정동을 선택하세요</div>
              </div>
            )}
          </div>

          {/* 보고서 생성 버튼 */}
          <div style={{ padding: "12px 18px 16px" }}>
            <button
              disabled={!selectedDong && !selectedGu}
              onClick={() => {
                setReportOpen(true);
                setReportData(null);
                setReportLoading(true);
                setReportCategory("");
                if (selectedDong) {
                  setReportRegion({ name: selectedDong.dongName, subName: `서울특별시 ${selectedDong.guName}` });
                } else if (selectedGu) {
                  setReportRegion({ name: selectedGu, subName: "서울특별시" });
                }
                const map = mapInstanceRef.current;
                if (map) {
                  const c = map.getCenter();
                  reportMapStateRef.current = {
                    lat: c.getLat(), lng: c.getLng(), level: map.getLevel(),
                    selectedGu: selectedGu || null,
                    selectedDong: selectedDong || null,
                    dongGroup: selectedGroupRef.current || null,
                    guGroup: selectedGuGroupRef.current || null,
                  };
                }
                if (selectedDong) {
                  const url = `http://localhost:8000/api/report/?dong=${encodeURIComponent(normalizeDongName(selectedDong.dongName))}`;
                  fetch(url)
                    .then((r) => r.json())
                    .then((d) => { setReportData({ ...d, _dong: normalizeDongName(selectedDong.dongName) }); setReportLoading(false); })
                    .catch(() => setReportLoading(false));
                } else if (selectedGu) {
                  const dongs = guToDongsRef.current[selectedGu] || [];
                  fetch("http://localhost:8000/api/gu-report/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ gu: selectedGu, dongs, category: reportCategory }),
                  })
                    .then((r) => r.json())
                    .then((d) => { setReportData({ ...d, _gu: selectedGu }); setReportLoading(false); })
                    .catch(() => setReportLoading(false));
                }
              }}
              style={{
                width: "100%", padding: "11px 0",
                background: (selectedDong || selectedGu) ? "#111827" : "#E5E7EB",
                color: (selectedDong || selectedGu) ? "#fff" : "#9CA3AF",
                border: "none", borderRadius: 9,
                fontSize: 14, fontWeight: 700,
                cursor: (selectedDong || selectedGu) ? "pointer" : "default",
              }}
              onMouseEnter={(e) => { if (selectedDong || selectedGu) e.currentTarget.style.background = "#374151"; }}
              onMouseLeave={(e) => { if (selectedDong || selectedGu) e.currentTarget.style.background = "#111827"; }}
            >
              상권분석 하기
            </button>

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

            {/* 이전 분석 보기 버튼 (reportData가 있을 때만) */}
            {reportData && (
              <button
                style={{ width: "100%", marginTop: 8, padding: "8px 0", background: "none", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                onClick={() => {
                  const s = reportMapStateRef.current;
                  if (!s) { setReportOpen(true); return; }
                  // 선택 상태 복원 (effect가 reportOpen 닫지 않도록 플래그)
                  restoringReportRef.current = true;
                  setSelectedGu(s.selectedGu);
                  setSelectedDong(s.selectedDong);
                  selectedGroupRef.current = s.dongGroup;
                  selectedGuGroupRef.current = s.guGroup;
                  setReportOpen(true);
                  const map = mapInstanceRef.current;
                  if (map) {
                    smoothZoom(map, s.level, () => map.panTo(new window.kakao.maps.LatLng(s.lat, s.lng)));
                  }
                }}
              >← 이전 분석 보기</button>
            )}
          </div>
        </div>
      )}

      {/* ── 구 매출 순위 패널 (플로팅) ── */}

      {/* ── 현재위치 버튼 ── */}
      {/* ── 상가 마커 토스트 ── */}
      {markerToast && (
        <div style={{
          position: "absolute",
          bottom: 144,
          right: aiModalOpen ? 480 : 82,
          zIndex: 20,
          background: "rgba(30,30,40,0.95)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          padding: "10px 16px",
          fontSize: 14,
          color: "#E8E8E8",
          boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
          whiteSpace: "nowrap",
          transition: "right 0.22s ease-out",
          animation: "anim-slide-up 0.2s ease-out",
        }}>
          행정동을 선택해주세요
        </div>
      )}

      {/* ── 상가 마커 업종 패널 ── */}
      {markerPanelOpen && selectedDong && (
        <div data-popup className="anim-slide-up" style={{
          position: "absolute",
          bottom: 134,
          right: aiModalOpen ? 480 : 82,
          zIndex: 20,
          width: 240,
          background: "rgba(28,28,38,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          padding: "14px 14px 12px",
          boxShadow: "0 8px 28px rgba(0,0,0,0.55)",
          backdropFilter: "blur(12px)",
          transition: "right 0.22s ease-out",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#E8E8E8" }}>업종 필터</span>
            {storeCategoryFilter.length > 0 && (
              <button onClick={() => { setStoreCategoryFilter([]); setStoreDrillGroup(null); }}
                style={{ fontSize: 11, color: "#9E9E9E", background: "none", border: "none", cursor: "pointer" }}>
                전체 해제
              </button>
            )}
          </div>

          {storeDrillGroup ? (
            <>
              <button onClick={() => setStoreDrillGroup(null)}
                style={{ fontSize: 12, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, marginBottom: 8, padding: 0 }}>
                ← {storeDrillGroup}
              </button>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {(storeDrillGroup === "store-only"
                  ? Object.keys(STORE_CATEGORY_COLORS).filter(c => !Object.keys(STARTUP_COSTS).includes(c))
                  : CATEGORY_GROUPS[storeDrillGroup]
                ).map((cat) => {
                  const active = storeCategoryFilter.includes(cat);
                  return (
                    <button key={cat}
                      onClick={() => setStoreCategoryFilter(active ? storeCategoryFilter.filter(c => c !== cat) : [...storeCategoryFilter, cat])}
                      style={{ ...storeFilterChipStyle(active), borderColor: active ? STORE_CATEGORY_COLORS[cat] : undefined, color: active ? STORE_CATEGORY_COLORS[cat] : undefined }}>
                      <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: STORE_CATEGORY_COLORS[cat] ?? "#9E9E9E", flexShrink: 0 }} />{cat}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {DRILL_GROUPS.map(group => {
                const groupCats = CATEGORY_GROUPS[group];
                const selectedCount = groupCats.filter(c => storeCategoryFilter.includes(c)).length;
                return (
                  <button key={group} onClick={() => setStoreDrillGroup(group)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: selectedCount > 0 ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)", background: selectedCount > 0 ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.04)", color: selectedCount > 0 ? "#93B8EE" : "#C8C8C8" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = selectedCount > 0 ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.04)"; }}
                  >
                    <span>{DRILL_GROUP_META[group].emoji} {group}</span>
                    <span style={{ fontSize: 11, color: selectedCount > 0 ? "#93B8EE" : "#6B7280" }}>
                      {selectedCount > 0 ? `${selectedCount}개 선택 →` : `${groupCats.length}개 →`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 상가 마커 토글 버튼 (우하단, 줌 버튼 위) ── */}
      {(
        <button
          onClick={() => {
            if (!selectedDong) {
              setMarkerToast(true);
              setTimeout(() => setMarkerToast(false), 2000);
              return;
            }
            const next = !markerPanelOpen;
            setMarkerPanelOpen(next);
            setShowStoreMarkers(next);
            if (!next) { setStoreCategoryFilter([]); setStoreDrillGroup(null); }
          }}
          title="상가 마커 보기"
          style={{
            position: "absolute",
            bottom: 134,
            right: aiModalOpen ? 400 : 20,
            zIndex: 10,
            width: 52,
            height: 52,
            borderRadius: 12,
            background: showStoreMarkers ? "rgba(59,130,246,0.25)" : "rgba(35,35,35,0.97)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
            boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
            transition: "right 0.22s ease-out, background 0.2s",
          }}
        >
          {storeLoading ? (
            <span style={{ fontSize: 13, color: "#9E9E9E", fontWeight: 700 }}>...</span>
          ) : (
            <svg style={{ width: 36, height: 36 }} viewBox="0 0 20 27" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0C4.477 0 0 4.477 0 10c0 7.5 10 17 10 17s10-9.5 10-17C20 4.477 15.523 0 10 0z"
                fill={showStoreMarkers ? "#3B82F6" : "#6B7280"} />
              <circle cx="10" cy="10" r="4" fill="white" fillOpacity="0.9"/>
            </svg>
          )}
        </button>
      )}

      {/* ── 줌 버튼 (우하단) ── */}
      <div style={{ ...zoomBtnGroupStyle, right: aiModalOpen ? 400 : 20, transition: "right 0.22s ease-out" }}>
        <button
          style={zoomBtnStyle}
          onClick={() => {
            const map = mapInstanceRef.current;
            if (map) map.setLevel(map.getLevel() - 1, { animate: true });
          }}
        >
          +
        </button>
        <div style={{ width: "100%", height: 1, background: "#4A4A4A" }} />
        <button
          style={zoomBtnStyle}
          onClick={() => {
            const map = mapInstanceRef.current;
            if (map) map.setLevel(map.getLevel() + 1, { animate: true });
          }}
        >
          −
        </button>
      </div>

      {/* ── 하단 중앙 검색창 + 마커 버튼 ── */}
      <div style={{
        position: "absolute",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        transition: "transform 0.22s ease-out",
        zIndex: 20,
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
      }}>

      {/* 검색창 */}
      <div style={{
        width: 480,
        maxWidth: "calc(100vw - 120px)",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* 드롭다운 (아래로 열림) */}
        {searchExpanded && (
          <div data-popup className="anim-slide-down" style={{
            order: 2,
            background: "#2A2A2A",
            borderRadius: "0 0 14px 14px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderTop: "none",
            maxHeight: 420,
            overflowY: "auto",
          }} ref={searchDropdownRef}>
            {/* 지역 검색 결과 */}
            {searchResults.length > 0 && (
              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ padding: "8px 14px 4px", fontSize: 13, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em" }}>지역 검색 결과</div>
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => { handleSelectResult(r); setSearchExpanded(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "9px 14px", border: "none",
                      background: "none", cursor: "pointer", textAlign: "left",
                      borderBottom: i < searchResults.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: r.type === "gu" ? "#FBBF24" : "#93B8EE",
                      background: r.type === "gu" ? "rgba(251,191,36,0.12)" : "rgba(59,130,246,0.12)",
                      borderRadius: 4, padding: "2px 6px", flexShrink: 0,
                    }}>
                      {r.type === "gu" ? "구" : "행정동"}
                    </span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#E8E8E8" }}>{r.type === "gu" ? r.guName : r.dongName}</div>
                      {r.type === "dong" && <div style={{ fontSize: 14, color: "#9E9E9E" }}>{r.guName}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {/* 업종 필터 */}
            <div style={{ padding: "12px 14px" }}>
              <p style={{ ...popupSectionLabel, marginBottom: 8, fontSize: 14 }}>업종 필터</p>
              <input
                type="text" placeholder="업종 검색..."
                value={searchIndustrySearchQuery}
                onChange={(e) => {
                  setSearchIndustrySearchQuery(e.target.value);
                  if (e.target.value) setSearchIndustryDrillGroup("__search__");
                  else setSearchIndustryDrillGroup(null);
                }}
                style={{ width: "100%", padding: "6px 10px", fontSize: 13, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)", color: "#E8E8E8", outline: "none", boxSizing: "border-box", marginBottom: 8 }}
              />
              {searchIndustrySearchQuery ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {Object.keys(STARTUP_COSTS).filter(c => c.includes(searchIndustrySearchQuery)).map(cat => (
                    <button key={cat} onClick={() => { setSelectedIndustry(selectedIndustry === cat ? null : cat); setSearchIndustrySearchQuery(""); setSearchIndustryDrillGroup(null); }}
                      style={{ padding: "4px 9px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: selectedIndustry === cat ? "1.5px solid #3B82F6" : "1.5px solid rgba(255,255,255,0.15)", background: selectedIndustry === cat ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.05)", color: selectedIndustry === cat ? "#93B8EE" : "#C8C8C8" }}>
                      {CATEGORY_EMOJI[cat] ?? "🏪"} {cat}
                    </button>
                  ))}
                </div>
              ) : searchIndustryDrillGroup ? (
                <>
                  <button onClick={() => setSearchIndustryDrillGroup(null)} style={{ fontSize: 12, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "0 0 8px 0" }}>
                    ← {searchIndustryDrillGroup}
                  </button>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {CATEGORY_GROUPS[searchIndustryDrillGroup].map(cat => (
                      <button key={cat} onClick={() => { setSelectedIndustry(selectedIndustry === cat ? null : cat); setSearchIndustryDrillGroup(null); }}
                        style={{ padding: "4px 9px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: selectedIndustry === cat ? "1.5px solid #3B82F6" : "1.5px solid rgba(255,255,255,0.15)", background: selectedIndustry === cat ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.05)", color: selectedIndustry === cat ? "#93B8EE" : "#C8C8C8" }}>
                        {CATEGORY_EMOJI[cat] ?? "🏪"} {cat}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {selectedIndustry && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", marginBottom: 2 }}>
                      <span style={{ fontSize: 12, color: "#93B8EE" }}>{CATEGORY_EMOJI[selectedIndustry] ?? "🏪"} {selectedIndustry}</span>
                      <button onClick={() => setSelectedIndustry(null)} style={{ fontSize: 11, color: "#9E9E9E", background: "none", border: "none", cursor: "pointer" }}>✕ 해제</button>
                    </div>
                  )}
                  {DRILL_GROUPS.map(group => (
                    <button key={group} onClick={() => setSearchIndustryDrillGroup(group)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#C8C8C8" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.1)"; e.currentTarget.style.color = "#93B8EE"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#C8C8C8"; }}
                    >
                      <span>{DRILL_GROUP_META[group].emoji} {group}</span>
                      <span style={{ color: "#6B7280", fontSize: 11 }}>{CATEGORY_GROUPS[group].length}개 →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* 지역 필터 */}
            <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ ...popupSectionLabel, margin: "12px 0 8px", fontSize: 14 }}>지역 필터</p>
              <div style={chipGrid}>
                {REGIONS.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      const group = guPolygonGroupsRef.current.find((g) => g.guName === item);
                      if (group) handleSelectResult({ type: "gu", guName: item, dongName: null, centroid: group.centroid });
                      setSelectedRegion(selectedRegion === item ? null : item);
                      if (selectedRegion !== item) {
                        setTimeout(() => {
                          if (searchDropdownRef.current) {
                            searchDropdownRef.current.scrollTo({ top: searchDropdownRef.current.scrollHeight, behavior: "smooth" });
                          }
                        }, 50);
                      }
                    }}
                    style={chipStyle(selectedRegion === item)}
                  >{item}</button>
                ))}
              </div>
            </div>
            {/* 선택된 구의 행정동 목록 */}
            {selectedRegion && (
              <div data-popup className="anim-slide-down" style={{ background: "rgba(24,24,34,0.97)", borderTop: "1px solid rgba(59,130,246,0.25)", padding: "12px 14px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#FBBF24", background: "rgba(251,191,36,0.12)", borderRadius: 4, padding: "2px 6px" }}>구</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#E8E8E8" }}>{selectedRegion}</span>
                  <span style={{ fontSize: 14, color: "#555" }}>({(guToDongsRef.current[selectedRegion] || []).length}개 행정동)</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {(guToDongsRef.current[selectedRegion] || []).map((dong) => (
                    <button
                      key={dong}
                      onClick={() => {
                        const group = polygonGroupsRef.current.find((g) => g.dongName === dong && g.guName === selectedRegion);
                        if (group) handleSelectResult({ type: "dong", guName: selectedRegion, dongName: dong, centroid: group.centroid });
                        setSearchExpanded(false);
                        setSelectedRegion(null);
                      }}
                      style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#C8C8C8", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 0.1s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.2)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)"; e.currentTarget.style.color = "#93B8EE"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#C8C8C8"; }}
                    >{dong}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 선택된 업종 뱃지 */}
        {selectedIndustry && !searchExpanded && (
          <div style={{ marginBottom: 6, paddingLeft: 4 }}>
            <span style={badgeStyle}>
              {selectedIndustry}
              <button onClick={() => setSelectedIndustry(null)} style={badgeClose}>✕</button>
            </span>
          </div>
        )}

        {/* 검색 입력창 */}
        <div
          style={{ ...searchBoxStyle, order: 1, borderRadius: searchExpanded ? "14px 14px 0 0" : 14, borderBottom: searchExpanded ? "1px solid rgba(255,255,255,0.06)" : "none" }}
          onClick={() => { setSearchExpanded(true); setRankModalOpen(false); setGuRankModalOpen(false); setDongStatsOpen(false); }}
        >
          <span style={{ fontSize: 19, marginRight: 8, color: searchExpanded ? "#3B82F6" : "#777", transition: "color 0.15s" }}>🔍</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { setSearchExpanded(true); setRankModalOpen(false); setGuRankModalOpen(false); setDongStatsOpen(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchResults.length > 0) { handleSelectResult(searchResults[0]); setSearchExpanded(false); }
              if (e.key === "Escape") { setSearchQuery(""); setSearchResults([]); setSearchExpanded(false); }
            }}
            ref={searchInputRef}
            placeholder="지역명 · 업종 검색"
            style={{ border: "none", outline: "none", fontSize: 17, width: "100%", background: "transparent", color: "#E8E8E8" }}
          />
          {searchExpanded && (
            <button
              onClick={(e) => { e.stopPropagation(); setSearchQuery(""); setSearchResults([]); setSearchExpanded(false); }}
              style={{ border: "none", background: "none", cursor: "pointer", color: "#777", fontSize: 18, padding: 0, flexShrink: 0 }}
            >✕</button>
          )}
        </div>
      </div>

      </div>

      {/* ── 호버 툴팁 (사이드바 오른쪽 하단) ── */}
      {hoveredDong && (
        <div className="anim-slide-up" style={{ ...tooltipStyle, left: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: hoveredDong.dongName ? 6 : 0 }}>
            <span style={tooltipLabel}>구</span>
            <span style={{ fontWeight: 700, color: "#E8E8E8", fontSize: 17 }}>{hoveredDong.guName}</span>
          </div>
          {hoveredDong.dongName && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={tooltipLabel}>행정동</span>
              <span style={{ fontWeight: 700, color: "#93B8EE", fontSize: 17 }}>{hoveredDong.dongName}</span>
            </div>
          )}
          <div style={{ color: "#9E9E9E", fontSize: 14, marginTop: 8, borderTop: "1px solid #3A3A3A", paddingTop: 6 }}>
            클릭하면 상세 정보
          </div>
        </div>
      )}


      {/* ── 구 전체 보기 — 두 번째 사이드 패널 ── */}
      {guRankModalOpen && guData && (() => {
        const industries = guData.industries || [];
        const maxRevenue = Math.max(...industries.map((d) => d["당월매출합"]), 1);
        const storesSorted = [...industries].sort((a, b) => b["점포수"] - a["점포수"]);
        const maxStores = Math.max(...storesSorted.map((d) => d["점포수"]), 1);
        return (
          <div
            className="anim-panel-slide-in"
            style={{ ...secondPanelStyle, left: 0 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 2 }}>서울특별시</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#E8E8E8" }}>{selectedGu} {guRankType === "revenue" ? "업종별 매출" : "업종별 상가 수"} 전체</div>
              </div>
              <button onClick={() => setGuRankModalOpen(false)} style={closeBtnStyle}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {guLoading ? (
                <p style={{ color: "#9E9E9E", fontSize: 15, textAlign: "center", padding: "24px 0" }}>불러오는 중...</p>
              ) : guRankType === "revenue" ? (
                <>
                  <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 10 }}>업종별 매출 (전체 {industries.length}개)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {industries.map((item) => (
                      <div key={item["통합카테고리"]}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 14, color: "#C8C8C8" }}>{item["통합카테고리"]}</span>
                          <span style={{ fontSize: 14, color: "#9E9E9E" }}>{fmtRevenue(item["당월매출합"])}</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 3, height: 5, overflow: "hidden" }}>
                          <div style={{ width: `${(item["당월매출합"] / maxRevenue) * 100}%`, height: "100%", background: "linear-gradient(90deg, #3B82F6, #60A5FA)", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 10 }}>업종별 상가 수 (전체 {industries.length}개)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {storesSorted.map((item) => (
                      <div key={item["통합카테고리"]}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 14, color: "#C8C8C8" }}>{item["통합카테고리"]}</span>
                          <span style={{ fontSize: 14, color: "#9E9E9E" }}>{item["점포수"]}개</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 3, height: 5, overflow: "hidden" }}>
                          <div style={{ width: `${(item["점포수"] / maxStores) * 100}%`, height: "100%", background: "linear-gradient(90deg, #10B981, #34D399)", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── 전체 보기 — 두 번째 사이드 패널 ── */}
      {rankModalOpen && dongData && (() => {
        const industries = dongData.industries || [];
        const maxRevenue = Math.max(...industries.map((d) => d["당월매출합"]), 1);
        const storesSorted = [...industries].sort((a, b) => b["점포수"] - a["점포수"]);
        const maxStores = Math.max(...storesSorted.map((d) => d["점포수"]), 1);
        return (
          <div
            className="anim-panel-slide-in"
            style={{ ...secondPanelStyle, left: 0 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 2 }}>{selectedDong?.guName}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#E8E8E8" }}>{selectedDong?.dongName} {rankType === "revenue" ? "업종별 매출" : "업종별 상가 수"} 전체</div>
              </div>
              <button onClick={() => setRankModalOpen(false)} style={closeBtnStyle}>✕</button>
            </div>

            {/* ── 연도/분기 선택 ── */}
            {availableQuarters.length > 0 && (() => {
              const years = [...new Set(availableQuarters.map((q) => Math.floor(q / 10)))];
              const activeYear = selectedQuarter ? Math.floor(selectedQuarter / 10) : Math.floor(availableQuarters[0] / 10);
              const quartersOfYear = availableQuarters.filter((q) => Math.floor(q / 10) === activeYear);
              return (
                <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 8, overflowX: "auto", paddingBottom: 2 }}>
                    {years.map((y) => (
                      <button
                        key={y}
                        onClick={() => {
                          const first = availableQuarters.find((q) => Math.floor(q / 10) === y);
                          setSelectedQuarter(first === availableQuarters[0] ? null : first);
                        }}
                        style={{ flexShrink: 0, padding: "4px 12px", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none", background: activeYear === y ? "#3B82F6" : "rgba(255,255,255,0.07)", color: activeYear === y ? "#fff" : "#9E9E9E", transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s, color 0.15s" }}
                      >{y}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {quartersOfYear.map((q) => {
                      const isLatest = q === availableQuarters[0];
                      const isActive = selectedQuarter === q || (!selectedQuarter && isLatest);
                      return (
                        <button
                          key={q}
                          onClick={() => setSelectedQuarter(isLatest ? null : q)}
                          style={{ flexShrink: 0, padding: "4px 14px", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer", border: isActive ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.1)", background: isActive ? "rgba(59,130,246,0.18)" : "transparent", color: isActive ? "#93B8EE" : "#9E9E9E", transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s, border-color 0.15s, color 0.15s" }}
                        >{q % 10}분기</button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div style={{ flex: 1, overflowY: "auto" }}>
              {dongLoading ? (
                <p style={{ color: "#9E9E9E", fontSize: 15, textAlign: "center", padding: "24px 0" }}>불러오는 중...</p>
              ) : rankType === "revenue" ? (
                <>
                  <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 10 }}>업종별 매출 (전체 {industries.length}개)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {industries.map((item) => (
                      <div key={item["통합카테고리"]}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 14, color: "#C8C8C8" }}>{item["통합카테고리"]}</span>
                          <span style={{ fontSize: 14, color: "#9E9E9E" }}>{fmtRevenue(item["당월매출합"])}</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 3, height: 5, overflow: "hidden" }}>
                          <div style={{ width: `${(item["당월매출합"] / maxRevenue) * 100}%`, height: "100%", background: "linear-gradient(90deg, #3B82F6, #60A5FA)", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 10 }}>업종별 상가 수 (전체 {industries.length}개)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {storesSorted.map((item) => (
                      <div key={item["통합카테고리"]}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 14, color: "#C8C8C8" }}>{item["통합카테고리"]}</span>
                          <span style={{ fontSize: 14, color: "#9E9E9E" }}>{item["점포수"]}개</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 3, height: 5, overflow: "hidden" }}>
                          <div style={{ width: `${(item["점포수"] / maxStores) * 100}%`, height: "100%", background: "linear-gradient(90deg, #10B981, #34D399)", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── 상세 통계 패널 ── */}
      {dongStatsOpen && dongData && (() => {
        const 성별 = dongData.성별 || {};
        const 주중주말 = dongData.주중주말 || {};
        const 시간대 = dongData.시간대 || {};

        const 성별합 = (성별.남성 || 0) + (성별.여성 || 0);
        const 남성비율 = 성별합 > 0 ? Math.round((성별.남성 / 성별합) * 100) : 50;
        const 여성비율 = 100 - 남성비율;


        const 시간대목록 = [
          { label: "새벽\n00~06", value: 시간대["00~06"] || 0 },
          { label: "아침\n06~11", value: 시간대["06~11"] || 0 },
          { label: "점심\n11~14", value: 시간대["11~14"] || 0 },
          { label: "오후\n14~17", value: 시간대["14~17"] || 0 },
          { label: "저녁\n17~21", value: 시간대["17~21"] || 0 },
          { label: "심야\n21~24", value: 시간대["21~24"] || 0 },
        ];
        const 시간대최대 = Math.max(...시간대목록.map((t) => t.value), 1);
        const fmtEok = (v) => v >= 100_000_000 ? `${(v / 100_000_000).toFixed(0)}억` : v >= 10_000 ? `${Math.round(v / 10_000)}만` : `${v}`;

        return (
          <div
            className="anim-panel-slide-in"
            style={{ ...secondPanelStyle, left: 0, overflowY: "auto" }}
          >
            {/* 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 2 }}>{selectedDong?.guName}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#E8E8E8" }}>{selectedDong?.dongName} 상세 통계</div>
              </div>
              <button onClick={() => setDongStatsOpen(false)} style={closeBtnStyle}>✕</button>
            </div>

            {/* 성별 매출 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 10 }}>성별 매출 비율</div>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 28 }}>
                <div style={{ width: `${남성비율}%`, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", transition: "width 0.4s" }}>
                  {남성비율 > 10 ? `남 ${남성비율}%` : ""}
                </div>
                <div style={{ width: `${여성비율}%`, background: "#EC4899", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", transition: "width 0.4s" }}>
                  {여성비율 > 10 ? `여 ${여성비율}%` : ""}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 12, color: "#6B9FE4" }}>남성 {fmtEok(성별.남성 || 0)}</span>
                <span style={{ fontSize: 12, color: "#EC4899" }}>여성 {fmtEok(성별.여성 || 0)}</span>
              </div>
            </div>

            {/* 주중/주말 매출 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 10 }}>주중 / 주말 매출</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "주중 (월~금)", value: 주중주말.주중 || 0, color: "#3B82F6" },
                  { label: "주말 (토~일)", value: 주중주말.주말 || 0, color: "#F59E0B" },
                ].map(({ label, value, color }) => {
                  const max = Math.max(주중주말.주중 || 0, 주중주말.주말 || 0, 1);
                  const ratio = Math.round((value / max) * 100);
                  return (
                    <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: "#C0C0C0" }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color }}>{fmtEok(value)}</span>
                      </div>
                      <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${ratio}%`, background: color, borderRadius: 4, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 시간대별 매출 */}
            <div>
              <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 12 }}>시간대별 매출</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
                {시간대목록.map(({ label, value }) => {
                  const heightPct = Math.round((value / 시간대최대) * 100);
                  const isTop = value === 시간대최대;
                  return (
                    <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 10, color: isTop ? "#38BDF8" : "#9E9E9E", fontWeight: isTop ? 700 : 400 }}>{fmtEok(value)}</div>
                      <div style={{ width: "100%", height: 80, display: "flex", alignItems: "flex-end" }}>
                        <div style={{ width: "100%", height: `${heightPct}%`, background: isTop ? "#38BDF8" : "rgba(59,130,246,0.45)", borderRadius: "4px 4px 0 0", transition: "height 0.4s" }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#9E9E9E", textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.3 }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 상권 보고서 패널 (왼쪽, 카드 확장 느낌) ── */}
      {reportOpen && (
        <div
          className="anim-panel-slide-in no-scrollbar"
          style={{
            position: "absolute",
            top: NAV_HEIGHT,
            left: 0,
            width: 400,
            height: `calc(100vh - ${NAV_HEIGHT}px)`,
            background: "#F8F9FA",
            borderRight: "1px solid #E5E7EB",
            boxShadow: "4px 0 24px rgba(0,0,0,0.10)",
            overflowY: "auto",
            zIndex: 14,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* 문서 헤더 */}
          <div style={{
            padding: "20px 28px 16px",
            borderBottom: "2px solid #111827",
            background: "#fff",
            flexShrink: 0,
          }}>
            {/* 뒤로가기 */}
            <button
              onClick={() => setReportOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                color: "#6B7280", fontSize: 12, fontWeight: 600,
                padding: 0, marginBottom: 12,
              }}
            >
              ← 돌아가기
            </button>
            <div style={{ fontSize: 11, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              상권분석 결과
              {reportData?.quarter && (
                <span style={{ marginLeft: 10, color: "#9CA3AF" }}>
                  {String(reportData.quarter).slice(0, 4)}년 {String(reportData.quarter).slice(4)}분기
                </span>
              )}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
              {reportRegion?.name}
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{reportRegion?.subName}</div>
          </div>

          {/* 본문 */}
          <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "24px 28px 48px" }}>
            {reportLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  border: "3px solid #E5E7EB",
                  borderTop: "3px solid #111827",
                  animation: "spin 0.8s linear infinite",
                }} />
                <div style={{ fontSize: 14, color: "#6B7280" }}>AI가 보고서를 작성하는 중입니다...</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : reportData ? (() => {
              const ai = reportData.ai_descriptions || {};
              const d = reportData.data || {};
              const cat = d.category_data;
              const fmtEok = (v) => !v ? "0" : v >= 100_000_000 ? `${(v / 100_000_000).toFixed(0)}억` : `${Math.round(v / 10_000)}만`;
              const fmtNum = (v) => v ? v.toLocaleString() : "0";
              const fmtPop = (v) => !v ? "0" : v >= 100_000_000 ? `${(v / 100_000_000).toFixed(1)}억명` : v >= 10_000 ? `${Math.round(v / 10_000)}만명` : `${v.toLocaleString()}명`;

              const SectionLabel = ({ num, title }) => (
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.05em", minWidth: 24 }}>{num}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</span>
                </div>
              );

              const AiText = ({ text }) => text ? (
                <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.85, margin: "0 0 20px 36px", wordBreak: "keep-all" }}>
                  {text}
                </p>
              ) : null;

              const KeyFigure = ({ label, value, sub, accent, exact }) => (
                <div style={{ marginBottom: 0, minWidth: 0 }} title={exact ? `${label}: ${exact}` : undefined}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: accent || "#111827", lineHeight: 1.2, wordBreak: "break-all" }}>{value}</div>
                  {sub && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{sub}</div>}
                </div>
              );

              const InlineBar = ({ label, ratio, color, valueLabel }) => (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#6B7280", width: 64, flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${ratio}%`, background: color, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", width: 36, textAlign: "right" }}>{valueLabel}</span>
                </div>
              );

              const Divider = () => (
                <div style={{ borderTop: "1px solid #E5E7EB", margin: "28px 0" }} />
              );

              return (
                <div>
                  {/* 섹션 01: 상권 개요 */}
                  <SectionLabel num="01" title="상권 개요 및 입지 특성" />
                  <AiText text={ai["상권_개요"]} />

                  {/* 핵심 지표 그리드 */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", marginLeft: 24, marginBottom: 20, padding: "20px 20px", background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB" }}>
                    <KeyFigure label="총매출" value={fmtEok(d.총매출)} sub={d.순위 ? `서울 ${d.전체동수}개 동 중 ${d.순위}위` : undefined} accent="#111827" />
                    <KeyFigure label="총유동인구" value={fmtPop(d.총유동인구)} exact={d.총유동인구?.toLocaleString()} />
                    <KeyFigure label="주거인구" value={fmtPop(d.주거인구)} exact={d.주거인구?.toLocaleString()} />
                    <KeyFigure label="직장인구" value={fmtPop(d.직장인구)} exact={d.직장인구?.toLocaleString()} />
                  </div>

                  <Divider />

                  {/* 섹션 02: 인기 업종 */}
                  <SectionLabel num="02" title="인기 업종 현황" />
                  <AiText text={ai["인기_업종"]} />
                  <div style={{ marginLeft: 24, marginBottom: 20 }}>
                    {(d.top_업종 || []).map((item, i) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 0",
                        borderBottom: i < (d.top_업종.length - 1) ? "1px solid #F3F4F6" : "none",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, minWidth: 22, height: 22,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: "50%",
                            background: i === 0 ? "#111827" : i === 1 ? "#6B7280" : i === 2 ? "#D1A05C" : "#F3F4F6",
                            color: i < 3 ? "#fff" : "#9CA3AF",
                          }}>{i + 1}</span>
                          <span style={{ fontSize: 14, color: "#111827", fontWeight: 500 }}>{item.업종}</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{fmtEok(item.매출)}</div>
                          {item.점포수 > 0 && <div style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtNum(item.점포수)}개 점포</div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Divider />

                  {/* 섹션 03: 유동인구·소비 분석 */}
                  <SectionLabel num="03" title="유동인구 · 소비 분석" />
                  <AiText text={ai["유동인구_분석"]} />
                  <div style={{ marginLeft: 24, marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 10 }}>결제 고객 성별</div>
                    <InlineBar label="남성" ratio={d.성별?.남성비율 || 0} color="#3B82F6" valueLabel={`${d.성별?.남성비율 || 0}%`} />
                    <InlineBar label="여성" ratio={d.성별?.여성비율 || 0} color="#EC4899" valueLabel={`${d.성별?.여성비율 || 0}%`} />
                    <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginTop: 16, marginBottom: 10 }}>주중 / 주말 매출</div>
                    <InlineBar label="주중 (월~금)" ratio={d.주중주말?.주중비율 || 0} color="#6366F1" valueLabel={`${d.주중주말?.주중비율 || 0}%`} />
                    <InlineBar label="주말 (토~일)" ratio={d.주중주말?.주말비율 || 0} color="#0EA5E9" valueLabel={`${d.주중주말?.주말비율 || 0}%`} />
                  </div>

                  {/* 업종 심화 분석 선택 */}
                  {!cat && (
                    <>
                      <Divider />
                      <SectionLabel num="04" title="업종별 심화 분석" />
                      <p style={{ fontSize: 13, color: "#6B7280", marginLeft: 24, marginBottom: 14 }}>
                        업종을 선택하면 소비 패턴, 비용·수익 통계, AI 등급을 확인할 수 있습니다.
                      </p>
                      {reportCategoryLoading ? (
                        <div style={{ marginLeft: 24, textAlign: "center", padding: "20px 0", color: "#9CA3AF", fontSize: 13 }}>업종 심화 분석 중...</div>
                      ) : (
                      <select
                        value={reportCategory}
                        onChange={(e) => {
                          const cat = e.target.value;
                          if (!cat) return;
                          setReportCategory(cat);
                          setReportCategoryLoading(true);
                          if (selectedDong) {
                            fetch(`http://localhost:8000/api/report/?dong=${encodeURIComponent(normalizeDongName(selectedDong.dongName))}&category=${encodeURIComponent(cat)}`)
                              .then((r) => r.json())
                              .then((data) => { setReportData({ ...data, _dong: normalizeDongName(selectedDong.dongName) }); setReportCategoryLoading(false); })
                              .catch(() => setReportCategoryLoading(false));
                          } else if (selectedGu) {
                            const dongs = guToDongsRef.current[selectedGu] || [];
                            fetch("http://localhost:8000/api/gu-report/", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ gu: selectedGu, dongs, category: cat }),
                            })
                              .then((r) => r.json())
                              .then((data) => { setReportData({ ...data, _gu: selectedGu }); setReportCategoryLoading(false); })
                              .catch(() => setReportCategoryLoading(false));
                          }
                        }}
                        style={{ marginLeft: 24, width: "calc(100% - 24px)", padding: "10px 12px", background: "#fff", border: "1px solid #D1D5DB", borderRadius: 8, color: "#374151", fontSize: 13, cursor: "pointer", outline: "none" }}
                      >
                        <option value="">업종 선택...</option>
                        {(d.top_업종 || []).map((item) => (
                          <option key={item.업종} value={item.업종}>{item.업종}</option>
                        ))}
                      </select>
                      )}
                    </>
                  )}

                  {/* 심화 분석 섹션 */}
                  {cat && (
                    <>
                      <Divider />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <SectionLabel num="04" title={`${cat.category} 심화 분석`} />
                        <button onClick={() => {
                          setReportCategory("");
                          setReportLoading(true);
                          if (selectedDong) {
                            fetch(`http://localhost:8000/api/report/?dong=${encodeURIComponent(normalizeDongName(selectedDong.dongName))}`)
                              .then((r) => r.json())
                              .then((data) => { setReportData({ ...data, _dong: normalizeDongName(selectedDong.dongName) }); setReportLoading(false); })
                              .catch(() => setReportLoading(false));
                          } else if (selectedGu) {
                            const dongs = guToDongsRef.current[selectedGu] || [];
                            fetch("http://localhost:8000/api/gu-report/", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ gu: selectedGu, dongs }),
                            })
                              .then((r) => r.json())
                              .then((data) => { setReportData({ ...data, _gu: selectedGu }); setReportLoading(false); })
                              .catch(() => setReportLoading(false));
                          }
                        }} style={{ fontSize: 11, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", marginBottom: 14, flexShrink: 0 }}>업종 초기화</button>
                      </div>
                      <AiText text={ai["소비_패턴"]} />

                      {/* 시간대 바 차트 */}
                      {(() => {
                        const 시간대 = d.시간대 || {};
                        const items = [
                          { label: "새벽", key: "새벽(0~6시)" },
                          { label: "오전", key: "오전(6~11시)" },
                          { label: "점심", key: "점심(11~14시)" },
                          { label: "오후", key: "오후(14~17시)" },
                          { label: "저녁", key: "저녁(17~21시)" },
                          { label: "심야", key: "심야(21~24시)" },
                        ];
                        const max = Math.max(...items.map((t) => 시간대[t.key] || 0), 1);
                        return (
                          <div style={{ marginLeft: 24, marginBottom: 24 }}>
                            <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 12 }}>시간대별 매출</div>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90 }}>
                              {items.map(({ label, key }) => {
                                const v = 시간대[key] || 0;
                                const h = Math.round((v / max) * 100);
                                const isTop = v === max;
                                return (
                                  <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                    <div style={{ width: "100%", height: 68, display: "flex", alignItems: "flex-end" }}>
                                      <div style={{ width: "100%", height: `${h}%`, background: isTop ? "#111827" : "#D1D5DB", borderRadius: "3px 3px 0 0", transition: "height 0.4s" }} />
                                    </div>
                                    <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center" }}>{label}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                    </>
                  )}
                  <Divider />
                  <SectionLabel num="05" title="창업비용 계산기" />
                  <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.85, margin: "0 0 12px 36px", wordBreak: "keep-all" }}>
                    업종·면적·층수·직원 수를 입력하면 초기 창업비용과 월 운영비용을 자동으로 계산해드립니다.
                  </p>
                  <div style={{ marginLeft: 24, marginBottom: 20 }}>
                    <button
                      onClick={() => { returnToReportRef.current = true; setReportOpen(false); setStartupCalcOpen(true); }}
                      style={{ width: "100%", padding: "10px 0", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                    >창업비용 계산하러가기 →</button>
                  </div>

                  <Divider />
                  <SectionLabel num="06" title="AI 입지 추천" />
                  <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.85, margin: "0 0 12px 36px", wordBreak: "keep-all" }}>
                    AI가 서울 전체 상권 데이터를 분석해 최적의 창업 위치와 업종을 추천해드립니다.
                  </p>
                  <div style={{ marginLeft: 24, marginBottom: 20 }}>
                    <button
                      onClick={() => { returnToReportRef.current = true; setReportOpen(false); setAiModalOpen(true); }}
                      style={{ width: "100%", padding: "10px 0", background: "#6B9FE4", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                    >AI 추천 받기 →</button>
                  </div>
                  <div style={{ height: 40 }} />
                </div>
              );
            })() : null}
          </div>
        </div>
      )}

      {/* ── AI 추천 사이드 패널 ── */}
      {/* 사이드바 상태와 무관하게 항상 오른쪽에 고정 */}
      {aiModalOpen && (
        <div
          className="anim-panel-slide-in-right"
          style={{
            ...secondPanelStyle,
            left: "auto",   // secondPanelStyle의 left: 320 덮어쓰기
            right: 0,       // 화면 오른쪽에 고정
            width: 380,
            borderRight: "none",
            borderLeft: "1px solid rgba(255,255,255,0.07)",
            zIndex: 12,
          }}
        >
            {/* 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>✨</span>
                  <span style={{ fontSize: 19, fontWeight: 700, color: "#E8E8E8" }}>AI 상권 추천</span>
                </div>
                <div style={{ fontSize: 13, color: "#9E9E9E", paddingLeft: 28 }}>
                  {aiStep === "mode" && "분석 방식을 선택하세요"}
                  {aiStep === "form" && AI_MODE_META[aiMode]?.desc}
                  {(aiStep === "loading" || aiStep === "result") && AI_MODE_META[aiMode]?.title}
                  {aiStep === "spot_loading" && "위치 분석 중..."}
                  {aiStep === "spot" && `${spotDong} 내 추천 위치`}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {(aiStep === "result" || aiStep === "spot") && (
                  <button
                    onClick={() => { setAiStep("mode"); setAiResults(null); clearSpotMarkers(); }}
                    style={{ fontSize: 12, color: "#3B82F6", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 600 }}
                  >방식 다시 선택</button>
                )}
                <button onClick={() => { setAiModalOpen(false); clearSpotMarkers(); }} style={closeBtnStyle}>✕</button>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, flex: 1, overflowY: "auto" }}>

              {/* ── 모드 선택 단계 ── */}
              {aiStep === "mode" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(AI_MODE_META).map(([mode, { icon, title, desc, color, rgb }]) => (
                    <button
                      key={mode}
                      onClick={() => { setAiMode(mode); setAiStep("form"); }}
                      style={{
                        ...aiModeCardStyle,
                        borderLeft: `3px solid ${color}`,
                        background: `rgba(${rgb},0.06)`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(${rgb},0.14)`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(${rgb},0.06)`; }}
                    >
                      <div style={{
                        fontSize: 22, flexShrink: 0, width: 44, height: 44,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: 10, background: `rgba(${rgb},0.15)`,
                      }}>{icon}</div>
                      <div style={{ textAlign: "left", flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#E8E8E8", marginBottom: 3 }}>{title}</div>
                        <div style={{ fontSize: 13, color: "#9E9E9E" }}>{desc}</div>
                      </div>
                      <span style={{ color: color, fontSize: 18, flexShrink: 0 }}>›</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── 폼 단계 ── */}
              {aiStep === "form" && (
                <>
                  <button
                    onClick={() => { setAiStep("mode"); setAiMode(null); }}
                    style={{ fontSize: 14, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "0 0 16px 0" }}
                  >
                    ← 방식 다시 선택
                  </button>

                  {/* 모드별 폼 — dong/score/gu 공통 업종 선택 UI */}
                  {(aiMode === "dong" || aiMode === "score" || aiMode === "gu") && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={aiSectionLabel}>
                        <span style={aiRequiredBadge}>필수</span> 창업 업종 선택
                        {aiIndustry && (
                          <span style={{ marginLeft: 8, fontSize: 13, color: "#93B8EE", fontWeight: 600 }}>
                            {CATEGORY_EMOJI[aiIndustry] ?? "🏪"} {aiIndustry}
                          </span>
                        )}
                      </div>

                      {/* 검색창 */}
                      <input type="text" placeholder="업종 검색... (예: 치킨, 네일, 한의원)"
                        value={aiIndustrySearchQuery}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAiIndustrySearchQuery(v);
                          clearTimeout(aiIndustrySuggestTimer.current);
                          if (v.trim().length >= 1) {
                            aiIndustrySuggestTimer.current = setTimeout(() => {
                              fetch(`http://localhost:8000/api/suggest/industries-with-category/?q=${encodeURIComponent(v)}`)
                                .then((r) => r.json())
                                .then((d) => { setAiIndustrySuggestions(d.suggestions || []); setAiIndustrySuggestOpen(true); })
                                .catch(() => setAiIndustrySuggestions([]));
                            }, 200);
                          } else {
                            setAiIndustrySuggestions([]);
                            setAiIndustrySuggestOpen(false);
                          }
                        }}
                        onBlur={() => setTimeout(() => setAiIndustrySuggestOpen(false), 150)}
                        style={{
                          width: "100%", padding: "7px 11px", fontSize: 13, marginBottom: 8,
                          borderRadius: aiIndustrySuggestOpen && aiIndustrySuggestions.length > 0 ? "8px 8px 0 0" : 8,
                          background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)",
                          color: "#E8E8E8", outline: "none", boxSizing: "border-box",
                        }}
                      />
                      {/* 자동완성 드롭다운 */}
                      <div style={{ overflow: "hidden", maxHeight: aiIndustrySuggestOpen && aiIndustrySuggestions.length > 0 ? 260 : 0, opacity: aiIndustrySuggestOpen && aiIndustrySuggestions.length > 0 ? 1 : 0, transition: "max-height 0.22s ease, opacity 0.18s ease", background: "#1E2330", border: "1.5px solid rgba(255,255,255,0.12)", borderTop: "none", borderRadius: "0 0 8px 8px", marginBottom: 8 }}>
                        {aiIndustrySuggestions.map((s, i) => (
                          <div key={i} onMouseDown={() => { setAiIndustry(s.통합카테고리); setAiIndustrySearchQuery(""); setAiIndustrySuggestOpen(false); setAiIndustryDrillGroup(null); }}
                            style={{ padding: "7px 12px", cursor: "pointer", fontSize: 13, borderBottom: i < aiIndustrySuggestions.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59,130,246,0.15)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <span style={{ color: "#E8E8E8" }}>{s.소분류명}</span>
                            <span style={{ fontSize: 11, color: "#93B8EE", background: "rgba(59,130,246,0.18)", padding: "2px 7px", borderRadius: 10 }}>{s.통합카테고리}</span>
                          </div>
                        ))}
                      </div>

                      {/* 드릴다운 */}
                      {!aiIndustrySearchQuery && (
                        aiIndustryDrillGroup ? (
                          /* 세부 카테고리 */
                          <>
                            <button onClick={() => setAiIndustryDrillGroup(null)} style={{ fontSize: 13, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "0 0 10px 0" }}>
                              ← {aiIndustryDrillGroup}
                            </button>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {CATEGORY_GROUPS[aiIndustryDrillGroup].map((cat) => (
                                <button key={cat}
                                  onClick={() => { const next = aiIndustry === cat ? null : cat; setAiIndustry(next); }}
                                  style={{ padding: "5px 10px", borderRadius: 20, cursor: "pointer", fontSize: 13, border: aiIndustry === cat ? "2px solid #3B82F6" : "1.5px solid rgba(255,255,255,0.15)", background: aiIndustry === cat ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.05)", color: aiIndustry === cat ? "#93B8EE" : "#C8C8C8", fontWeight: aiIndustry === cat ? 700 : 400, display: "flex", alignItems: "center", gap: 4 }}
                                >
                                  <span>{CATEGORY_EMOJI[cat] ?? "🏪"}</span>{cat}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          /* 대분류 목록 */
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {DRILL_GROUPS.map(group => (
                              <button key={group} onClick={() => setAiIndustryDrillGroup(group)}
                                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderRadius: 10, fontSize: 14, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#C8C8C8", transition: "background 0.15s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.12)"; e.currentTarget.style.color = "#93B8EE"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#C8C8C8"; }}
                              >
                                <span style={{ fontSize: 15 }}>{DRILL_GROUP_META[group].emoji} {group}</span>
                                <span style={{ color: "#6B7280", fontSize: 12 }}>{CATEGORY_GROUPS[group].length}개 →</span>
                              </button>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {(aiMode === "industry" || aiMode === "score") && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={aiSectionLabel}>
                        <span style={aiRequiredBadge}>필수</span> 행정동 입력
                      </div>
                      <input
                        value={aiDong}
                        onChange={(e) => setAiDong(e.target.value)}
                        placeholder="예: 역삼1동, 합정동"
                        style={{
                          width: "100%", padding: "10px 14px", background: "#2E2E2E",
                          border: "1.5px solid #4A4A4A", borderRadius: 10, color: "#E8E8E8",
                          fontSize: 16, outline: "none", boxSizing: "border-box",
                        }}
                      />
                    </div>
                  )}

                  {aiMode === "gu" && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={aiSectionLabel}>
                        <span style={aiRequiredBadge}>필수</span> 구 선택
                      </div>
                      <select
                        value={aiGu}
                        onChange={(e) => setAiGu(e.target.value)}
                        style={{
                          width: "100%", padding: "10px 14px", background: "#2E2E2E",
                          border: "1.5px solid #4A4A4A", borderRadius: 10, color: aiGu ? "#E8E8E8" : "#6B7280",
                          fontSize: 16, outline: "none", boxSizing: "border-box", cursor: "pointer",
                        }}
                      >
                        <option value="">구를 선택하세요</option>
                        {SEOUL_GU_LIST.map((gu) => (
                          <option key={gu} value={gu}>{gu}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* ── 지역 비교 폼 ── */}
                  {aiMode === "compare_region" && (
                    <div>
                      {/* 단위 선택 */}
                      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        {["dong", "gu"].map(t => (
                          <button key={t} onClick={() => { setCmpRegionType(t); setCmpRegionASelected(null); setCmpRegionBSelected(null); setCmpRegionAQuery(""); setCmpRegionBQuery(""); setCmpRegionASugg([]); setCmpRegionBSugg([]); }}
                            style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", border: cmpRegionType === t ? "2px solid #34D399" : "1.5px solid rgba(255,255,255,0.15)", background: cmpRegionType === t ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)", color: cmpRegionType === t ? "#34D399" : "#9E9E9E" }}>
                            {t === "dong" ? "🏘 행정동" : "🏙 구"}
                          </button>
                        ))}
                      </div>
                      {/* 지역 A / B */}
                      {[
                        { label: "지역 A", query: cmpRegionAQuery, setQuery: setCmpRegionAQuery, sugg: cmpRegionASugg, setSugg: setCmpRegionASugg, selected: cmpRegionASelected, setSelected: setCmpRegionASelected, timer: cmpRegionATimer },
                        { label: "지역 B", query: cmpRegionBQuery, setQuery: setCmpRegionBQuery, sugg: cmpRegionBSugg, setSugg: setCmpRegionBSugg, selected: cmpRegionBSelected, setSelected: setCmpRegionBSelected, timer: cmpRegionBTimer },
                      ].map(({ label, query, setQuery, sugg, setSugg, selected, setSelected, timer }) => (
                        <div key={label} style={{ marginBottom: 14, position: "relative" }}>
                          <div style={aiSectionLabel}>
                            <span style={aiRequiredBadge}>필수</span> {label}
                            {selected && <span style={{ marginLeft: 8, color: "#34D399", fontWeight: 600, fontSize: 13 }}>{cmpRegionType === "dong" ? `${selected.dong} (${selected.gu})` : selected}</span>}
                          </div>
                          <input
                            value={query}
                            onChange={e => {
                              const v = e.target.value;
                              setQuery(v);
                              setSelected(null);
                              clearTimeout(timer.current);
                              timer.current = setTimeout(() => searchRegionSuggest(v, cmpRegionType, setSugg), 200);
                            }}
                            onBlur={() => setTimeout(() => setSugg([]), 150)}
                            placeholder={cmpRegionType === "dong" ? "예: 역삼, 합정" : "예: 강남, 마포"}
                            style={{ width: "100%", padding: "8px 12px", background: "#2E2E2E", border: "1.5px solid #4A4A4A", borderRadius: sugg.length > 0 ? "8px 8px 0 0" : 8, color: "#E8E8E8", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                          />
                          {sugg.length > 0 && (
                            <div style={{ position: "absolute", zIndex: 10, width: "100%", background: "#1E2330", border: "1.5px solid rgba(255,255,255,0.12)", borderTop: "none", borderRadius: "0 0 8px 8px", maxHeight: 180, overflowY: "auto" }}>
                              {sugg.map((s, i) => (
                                <div key={i} onMouseDown={() => { setSelected(cmpRegionType === "dong" ? s : s); setQuery(cmpRegionType === "dong" ? s.dong : s); setSugg([]); }}
                                  style={{ padding: "7px 12px", cursor: "pointer", fontSize: 13, borderBottom: i < sugg.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", display: "flex", justifyContent: "space-between" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "rgba(52,211,153,0.12)"}
                                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                  <span style={{ color: "#E8E8E8" }}>{cmpRegionType === "dong" ? s.dong : s}</span>
                                  {cmpRegionType === "dong" && <span style={{ fontSize: 11, color: "#34D399", background: "rgba(52,211,153,0.15)", padding: "2px 7px", borderRadius: 10 }}>{s.gu}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {/* 업종 선택 */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={aiSectionLabel}>
                          <span style={aiRequiredBadge}>필수</span> 비교 업종
                          {cmpRegionCat && <span style={{ marginLeft: 8, color: "#34D399", fontWeight: 600, fontSize: 13 }}>{CATEGORY_EMOJI[cmpRegionCat] ?? "🏪"} {cmpRegionCat}</span>}
                        </div>
                        <button onClick={() => setCmpRegionPickerOpen(o => !o)}
                          style={{ width: "100%", padding: "8px 12px", background: "#2E2E2E", border: `1.5px solid ${cmpRegionPickerOpen ? "#34D399" : "#4A4A4A"}`, borderRadius: 8, color: cmpRegionCat ? "#34D399" : "#6B7280", fontSize: 14, cursor: "pointer", textAlign: "left" }}>
                          {cmpRegionCat ? `${CATEGORY_EMOJI[cmpRegionCat] ?? "🏪"} ${cmpRegionCat}` : "업종을 선택하세요 ▾"}
                        </button>
                        {cmpRegionPickerOpen && (
                          <div style={{ marginTop: 8 }}>
                            {cmpRegionDrillGroup ? (
                              <>
                                <button onClick={() => setCmpRegionDrillGroup(null)} style={{ fontSize: 12, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "0 0 8px 0" }}>← {cmpRegionDrillGroup}</button>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                  {CATEGORY_GROUPS[cmpRegionDrillGroup].map(c => (
                                    <button key={c} onClick={() => { setCmpRegionCat(c); setCmpRegionPickerOpen(false); setCmpRegionDrillGroup(null); }}
                                      style={{ padding: "4px 9px", borderRadius: 16, cursor: "pointer", fontSize: 12, border: `1.5px solid ${cmpRegionCat === c ? "#34D399" : "rgba(255,255,255,0.15)"}`, background: cmpRegionCat === c ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.04)", color: cmpRegionCat === c ? "#34D399" : "#C8C8C8" }}>
                                      {CATEGORY_EMOJI[c] ?? "🏪"} {c}
                                    </button>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {DRILL_GROUPS.map(group => (
                                  <button key={group} onClick={() => setCmpRegionDrillGroup(group)}
                                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#C8C8C8" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(52,211,153,0.08)"; e.currentTarget.style.color = "#34D399"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#C8C8C8"; }}
                                  >
                                    <span>{DRILL_GROUP_META[group].emoji} {group}</span>
                                    <span style={{ color: "#6B7280", fontSize: 11 }}>{CATEGORY_GROUPS[group].length}개 →</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── 업종 비교 폼 ── */}
                  {aiMode === "compare_industry" && (
                    <div>
                      {/* 단위 선택 */}
                      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        {["dong", "gu"].map(t => (
                          <button key={t} onClick={() => { setCmpIndRegionType(t); setCmpIndRegionSelected(null); setCmpIndRegionQuery(""); setCmpIndRegionSugg([]); }}
                            style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", border: cmpIndRegionType === t ? "2px solid #F59E0B" : "1.5px solid rgba(255,255,255,0.15)", background: cmpIndRegionType === t ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)", color: cmpIndRegionType === t ? "#F59E0B" : "#9E9E9E" }}>
                            {t === "dong" ? "🏘 행정동" : "🏙 구"}
                          </button>
                        ))}
                      </div>
                      {/* 지역 선택 */}
                      <div style={{ marginBottom: 16, position: "relative" }}>
                        <div style={aiSectionLabel}>
                          <span style={aiRequiredBadge}>필수</span> 비교할 지역
                          {cmpIndRegionSelected && <span style={{ marginLeft: 8, color: "#F59E0B", fontWeight: 600, fontSize: 13 }}>{cmpIndRegionType === "dong" ? `${cmpIndRegionSelected.dong} (${cmpIndRegionSelected.gu})` : cmpIndRegionSelected}</span>}
                        </div>
                        <input
                          value={cmpIndRegionQuery}
                          onChange={e => {
                            const v = e.target.value;
                            setCmpIndRegionQuery(v);
                            setCmpIndRegionSelected(null);
                            clearTimeout(cmpIndRegionTimer.current);
                            cmpIndRegionTimer.current = setTimeout(() => searchRegionSuggest(v, cmpIndRegionType, setCmpIndRegionSugg), 200);
                          }}
                          onBlur={() => setTimeout(() => setCmpIndRegionSugg([]), 150)}
                          placeholder={cmpIndRegionType === "dong" ? "예: 역삼, 합정" : "예: 강남, 마포"}
                          style={{ width: "100%", padding: "8px 12px", background: "#2E2E2E", border: "1.5px solid #4A4A4A", borderRadius: cmpIndRegionSugg.length > 0 ? "8px 8px 0 0" : 8, color: "#E8E8E8", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        />
                        {cmpIndRegionSugg.length > 0 && (
                          <div style={{ position: "absolute", zIndex: 10, width: "100%", background: "#1E2330", border: "1.5px solid rgba(255,255,255,0.12)", borderTop: "none", borderRadius: "0 0 8px 8px", maxHeight: 180, overflowY: "auto" }}>
                            {cmpIndRegionSugg.map((s, i) => (
                              <div key={i} onMouseDown={() => { setCmpIndRegionSelected(cmpIndRegionType === "dong" ? s : s); setCmpIndRegionQuery(cmpIndRegionType === "dong" ? s.dong : s); setCmpIndRegionSugg([]); }}
                                style={{ padding: "7px 12px", cursor: "pointer", fontSize: 13, borderBottom: i < cmpIndRegionSugg.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", display: "flex", justifyContent: "space-between" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.12)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                <span style={{ color: "#E8E8E8" }}>{cmpIndRegionType === "dong" ? s.dong : s}</span>
                                {cmpIndRegionType === "dong" && <span style={{ fontSize: 11, color: "#F59E0B", background: "rgba(245,158,11,0.15)", padding: "2px 7px", borderRadius: 10 }}>{s.gu}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* 업종 A / B 선택 */}
                      {[
                        { label: "업종 A", cat: cmpIndCatA, setCat: setCmpIndCatA, target: "a", color: "#34D399" },
                        { label: "업종 B", cat: cmpIndCatB, setCat: setCmpIndCatB, target: "b", color: "#F87171" },
                      ].map(({ label, cat, setCat, target, color }) => (
                        <div key={label} style={{ marginBottom: 12 }}>
                          <div style={aiSectionLabel}>
                            <span style={aiRequiredBadge}>필수</span> {label}
                            {cat && <span style={{ marginLeft: 8, color, fontWeight: 600, fontSize: 13 }}>{CATEGORY_EMOJI[cat] ?? "🏪"} {cat}</span>}
                          </div>
                          <button onClick={() => setCmpIndPickerTarget(cmpIndPickerTarget === target ? null : target)}
                            style={{ width: "100%", padding: "8px 12px", background: "#2E2E2E", border: `1.5px solid ${cmpIndPickerTarget === target ? color : "#4A4A4A"}`, borderRadius: 8, color: cat ? color : "#6B7280", fontSize: 14, cursor: "pointer", textAlign: "left" }}>
                            {cat ? `${CATEGORY_EMOJI[cat] ?? "🏪"} ${cat}` : "업종을 선택하세요 ▾"}
                          </button>
                          {cmpIndPickerTarget === target && (
                            <div style={{ marginTop: 8 }}>
                              {cmpIndDrillGroup ? (
                                <>
                                  <button onClick={() => setCmpIndDrillGroup(null)} style={{ fontSize: 12, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "0 0 8px 0" }}>← {cmpIndDrillGroup}</button>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                    {CATEGORY_GROUPS[cmpIndDrillGroup].map(c => (
                                      <button key={c} onClick={() => { setCat(c); setCmpIndPickerTarget(null); setCmpIndDrillGroup(null); }}
                                        style={{ padding: "4px 9px", borderRadius: 16, cursor: "pointer", fontSize: 12, border: `1.5px solid ${cat === c ? color : "rgba(255,255,255,0.15)"}`, background: cat === c ? `rgba(${target==="a"?"52,211,153":"248,113,113"},0.15)` : "rgba(255,255,255,0.04)", color: cat === c ? color : "#C8C8C8" }}>
                                        {CATEGORY_EMOJI[c] ?? "🏪"} {c}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  {DRILL_GROUPS.map(group => (
                                    <button key={group} onClick={() => setCmpIndDrillGroup(group)}
                                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#C8C8C8" }}
                                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.1)"; e.currentTarget.style.color = "#93B8EE"; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#C8C8C8"; }}
                                    >
                                      <span>{DRILL_GROUP_META[group].emoji} {group}</span>
                                      <span style={{ color: "#6B7280", fontSize: 11 }}>{CATEGORY_GROUPS[group].length}개 →</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {(() => {
                    const cmpRegionNameA = cmpRegionType === "dong" ? cmpRegionASelected?.dong : cmpRegionASelected;
                    const cmpRegionNameB = cmpRegionType === "dong" ? cmpRegionBSelected?.dong : cmpRegionBSelected;
                    const cmpIndRegionName = cmpIndRegionType === "dong" ? cmpIndRegionSelected?.dong : cmpIndRegionSelected;
                    const disabled =
                      (aiMode === "dong" && !aiIndustry) ||
                      (aiMode === "industry" && !aiDong.trim()) ||
                      (aiMode === "score" && (!aiDong.trim() || !aiIndustry)) ||
                      (aiMode === "gu" && (!aiGu || !aiIndustry)) ||
                      (aiMode === "compare_region" && (!cmpRegionNameA || !cmpRegionNameB || !cmpRegionCat)) ||
                      (aiMode === "compare_industry" && (!cmpIndRegionName || !cmpIndCatA || !cmpIndCatB));
                    const onClick =
                      aiMode === "compare_region" ? handleCompareRegion :
                      aiMode === "compare_industry" ? handleCompareIndustry :
                      handleAiRecommend;
                    const btnColor =
                      aiMode === "compare_region" ? "linear-gradient(135deg, #34D399, #059669)" :
                      aiMode === "compare_industry" ? "linear-gradient(135deg, #F59E0B, #D97706)" :
                      "linear-gradient(135deg, #3B82F6, #8B5CF6)";
                    return (
                      <button
                        onClick={onClick}
                        disabled={disabled}
                        style={{
                          width: "100%", padding: "13px 0",
                          background: disabled ? "#3A3A3A" : btnColor,
                          color: disabled ? "#666" : "#fff", border: "none", borderRadius: 12,
                          fontSize: 17, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
                          transition: "all 0.2s", letterSpacing: "0.02em",
                        }}
                      >
                        {aiMode === "compare_region" || aiMode === "compare_industry" ? "⚖️ 비교 시작" : "✨ 분석 시작"}
                      </button>
                    );
                  })()}
                </>
              )}

              {/* ── 로딩 단계 ── */}
              {aiStep === "loading" && (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontSize: 38, marginBottom: 16, display: "inline-block" }}>⚙️</div>
                  <div style={{ fontSize: 17, color: "#E8E8E8", fontWeight: 600, marginBottom: 8 }}>AI가 분석하고 있습니다</div>
                  <div style={{ fontSize: 14, color: "#9E9E9E" }}>매출·유동인구·경쟁 강도를 종합적으로 평가 중...</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", opacity: 0.3 + i * 0.35 }} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── 결과 단계 ── */}
              {aiStep === "result" && aiResults && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: 15, color: "#9E9E9E" }}>
                      {aiMode === "dong" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiSubIndustry}</span>{aiRegion && <> · {aiRegion}</>} 추천 상권</>}
                      {aiMode === "industry" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiDong}</span> 추천 업종</>}
                      {aiMode === "score" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiDong}</span> · <span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiIndustry}</span> 적합도</>}
                      {aiMode === "gu" && <><span style={{ color: "#A78BFA", fontWeight: 600 }}>{aiGu}</span> · <span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiIndustry}</span> 추천</>}
                      {aiMode === "compare_region" && <><span style={{ color: "#34D399", fontWeight: 600 }}>{aiResults?.a?.name}</span> vs <span style={{ color: "#34D399", fontWeight: 600 }}>{aiResults?.b?.name}</span> 비교</>}
                      {aiMode === "compare_industry" && <><span style={{ color: "#F59E0B", fontWeight: 600 }}>{aiResults?.region}</span> · 업종 비교</>}
                    </span>
                    {aiMode !== "dong" && aiMode !== "compare_region" && aiMode !== "compare_industry" && (
                      <button
                        onClick={() => setShowIndustryPicker((v) => !v)}
                        style={{ fontSize: 13, color: showIndustryPicker ? "#34D399" : "#3B82F6", background: showIndustryPicker ? "rgba(16,185,129,0.1)" : "rgba(59,130,246,0.1)", border: `1px solid ${showIndustryPicker ? "rgba(16,185,129,0.3)" : "rgba(59,130,246,0.3)"}`, borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontWeight: 600, flexShrink: 0 }}
                      >
                        {showIndustryPicker ? "접기 ↑" : "업종 선택"}
                      </button>
                    )}
                  </div>

                  {/* 모드 "dong" / "industry" — 랭킹 리스트 */}
                  {(aiMode === "dong" || aiMode === "industry") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {aiResults.map((item) => (
                        <div key={item.rank} style={aiResultCardStyle(item.rank === 1)}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={aiRankBadge(item.rank)}>
                                {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `#${item.rank}`}
                              </div>
                              <div>
                                <div style={{ fontSize: 17, fontWeight: 700, color: "#E8E8E8" }}>
                                  {aiMode === "dong" ? item.dongName : item.industry}
                                </div>
                                <div style={{ fontSize: 13, color: "#9E9E9E" }}>
                                  {aiMode === "dong" ? item.guName : item.category}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 24, fontWeight: 800, color: item.rank === 1 ? "#60A5FA" : "#E8E8E8" }}>{item.score}</div>
                              <div style={{ fontSize: 12, color: "#9E9E9E" }}>AI 점수</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 14, color: "#C8C8C8", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", marginBottom: 10, lineHeight: 1.6 }}>
                            {item.reason}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                            {item.tags.map((tag) => (
                              <span key={tag} style={{ fontSize: 13, color: "#93B8EE", background: "rgba(59,130,246,0.12)", borderRadius: 12, padding: "3px 9px", border: "1px solid rgba(59,130,246,0.25)" }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <div style={aiMiniStatStyle}>
                              <div style={{ fontSize: 12, color: "#9E9E9E", marginBottom: 2 }}>월 매출</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "#E8E8E8" }}>{fmtRevenue(item.revenue)}</div>
                            </div>
                            <div style={aiMiniStatStyle}>
                              <div style={{ fontSize: 12, color: "#9E9E9E", marginBottom: 2 }}>경쟁 점포</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: item.점포수 === 0 ? "#34D399" : "#E8E8E8" }}>
                                {item.점포수 === 0 ? "0개 (블루오션)" : `${item.점포수}개`}
                              </div>
                            </div>
                            <div style={aiMiniStatStyle}>
                              <div style={{ fontSize: 12, color: "#9E9E9E", marginBottom: 2 }}>경쟁 강도</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: item.competition === "낮음" ? "#34D399" : item.competition === "중간" ? "#FBBF24" : "#F87171" }}>
                                {item.competition}
                              </div>
                            </div>
                          </div>
                          {aiMode === "dong" && (
                            <button
                              onClick={() => handleSpotRecommend(item.dongName, aiResults[0]?.통합카테고리 || item.통합카테고리 || item.category)}
                              style={{ marginTop: 10, width: "100%", padding: "9px 0", borderRadius: 10, border: "none", background: "linear-gradient(90deg,#3B82F6,#6366F1)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                            >
                              📍 이 동네 안 위치 추천 보기
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── 구 모드 결과 (행정동 / 길단위 탭) ── */}
                  {aiMode === "gu" && (
                    <div>
                      {/* 탭 헤더 */}
                      <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
                        {[
                          { key: "dong", label: "🏘️ 행정동 추천" },
                          { key: "street", label: "🛣️ 길단위 상권 추천" },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setAiGuResultTab(key)}
                            style={{
                              flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                              background: aiGuResultTab === key ? "linear-gradient(135deg,#7C3AED,#A78BFA)" : "transparent",
                              color: aiGuResultTab === key ? "#fff" : "#9E9E9E",
                              transition: "all 0.18s",
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* 행정동 탭 */}
                      {aiGuResultTab === "dong" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {aiGuDongError && (
                            <div style={{ textAlign: "center", padding: "24px 0", color: "#9E9E9E", fontSize: 13 }}>
                              <div style={{ fontSize: 22, marginBottom: 8 }}>📭</div>
                              {aiGu} 내 <b style={{ color: "#E8E8E8" }}>{aiIndustry}</b> 데이터가 없습니다.<br />
                              <span style={{ fontSize: 11, color: "#6B7280" }}>길단위 상권 탭을 확인해보세요.</span>
                            </div>
                          )}
                          {aiResults.map((item) => (
                            <div key={item.rank} style={aiResultCardStyle(item.rank === 1)}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={aiRankBadge(item.rank)}>
                                    {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `#${item.rank}`}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 17, fontWeight: 700, color: "#E8E8E8" }}>{item.dongName}</div>
                                    <div style={{ fontSize: 13, color: "#9E9E9E" }}>{item.guName}</div>
                                  </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 24, fontWeight: 800, color: item.rank === 1 ? "#A78BFA" : "#E8E8E8" }}>{item.score}</div>
                                  <div style={{ fontSize: 12, color: "#9E9E9E" }}>AI 점수</div>
                                </div>
                              </div>
                              <div style={{ fontSize: 14, color: "#C8C8C8", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", marginBottom: 10, lineHeight: 1.6 }}>
                                {item.reason}
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                                {item.tags.map((tag) => (
                                  <span key={tag} style={{ fontSize: 13, color: "#C4B5FD", background: "rgba(167,139,250,0.12)", borderRadius: 12, padding: "3px 9px", border: "1px solid rgba(167,139,250,0.25)" }}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <div style={aiMiniStatStyle}>
                                  <div style={{ fontSize: 12, color: "#9E9E9E", marginBottom: 2 }}>월 매출</div>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: "#E8E8E8" }}>{fmtRevenue(item.revenue)}</div>
                                </div>
                                <div style={aiMiniStatStyle}>
                                  <div style={{ fontSize: 12, color: "#9E9E9E", marginBottom: 2 }}>경쟁 점포</div>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: item.stores === 0 ? "#34D399" : "#E8E8E8" }}>
                                    {item.stores === 0 ? "0개 (블루오션)" : `${item.stores}개`}
                                  </div>
                                </div>
                                <div style={aiMiniStatStyle}>
                                  <div style={{ fontSize: 12, color: "#9E9E9E", marginBottom: 2 }}>경쟁 강도</div>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: item.competition === "낮음" ? "#34D399" : item.competition === "중간" ? "#FBBF24" : "#F87171" }}>
                                    {item.competition}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 길단위 상권 탭 */}
                      {aiGuResultTab === "street" && aiGuStreetResults && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {aiGuStreetResults.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "32px 0", color: "#6B7280", fontSize: 14 }}>
                              해당 구에 관련 길단위 상권 데이터가 없습니다.
                            </div>
                          ) : aiGuStreetResults.map((item) => (
                            <div key={item.rank} style={{ ...aiResultCardStyle(item.rank === 1), borderColor: item.rank === 1 ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.08)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{ ...aiRankBadge(item.rank), background: item.rank === 1 ? "linear-gradient(135deg,#7C3AED,#A78BFA)" : "rgba(255,255,255,0.08)" }}>
                                    {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `#${item.rank}`}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 17, fontWeight: 700, color: "#E8E8E8" }}>{item.상권명}</div>
                                    <div style={{ fontSize: 13, color: "#9E9E9E" }}>길단위 상권</div>
                                  </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 24, fontWeight: 800, color: item.rank === 1 ? "#A78BFA" : "#E8E8E8" }}>{item.score}</div>
                                  <div style={{ fontSize: 12, color: "#9E9E9E" }}>AI 점수</div>
                                </div>
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {(item.tags || []).map((tag) => (
                                  <span key={tag} style={{ fontSize: 13, color: "#C4B5FD", background: "rgba(167,139,250,0.12)", borderRadius: 12, padding: "3px 9px", border: "1px solid rgba(167,139,250,0.25)" }}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── spot 로딩 ── */}
                  {aiStep === "spot_loading" && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#9E9E9E" }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
                      <div style={{ fontSize: 15 }}>{spotDong} 위치 분석 중...</div>
                    </div>
                  )}

                  {/* ── spot 결과 ── */}
                  {aiStep === "spot" && spotResults && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <button
                          onClick={() => { setAiStep("result"); clearSpotMarkers(); }}
                          style={{ background: "none", border: "none", color: "#9E9E9E", cursor: "pointer", fontSize: 22, lineHeight: 1 }}
                        >←</button>
                        <div style={{ fontSize: 13, color: "#9E9E9E" }}>
                          {spotDong} · {spotCategory} · 추천 위치 {spotResults.length}곳
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px" }}>
                        지도에 번호 마커로 표시됩니다. 생존율·경쟁·보완업종 데이터 기반 점수입니다.
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {spotResults.map((r) => {
                          const colors = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6"];
                          const color = colors[r.rank - 1] || "#6B7280";
                          return (
                            <div key={r.rank} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${color}40` }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{ background: color, color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{r.rank}</div>
                                  <div style={{ fontSize: 15, fontWeight: 700, color: "#E8E8E8" }}>추천 위치 {r.rank}순위</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 22, fontWeight: 800, color: color }}>{r.score}</div>
                                  <div style={{ fontSize: 11, color: "#9E9E9E" }}>입지점수</div>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                <div style={aiMiniStatStyle}>
                                  <div style={{ fontSize: 11, color: "#9E9E9E", marginBottom: 2 }}>2년 생존율</div>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: r.생존율 >= 60 ? "#34D399" : r.생존율 >= 40 ? "#FBBF24" : "#F87171" }}>{r.생존율}%</div>
                                </div>
                                <div style={aiMiniStatStyle}>
                                  <div style={{ fontSize: 11, color: "#9E9E9E", marginBottom: 2 }}>경쟁 수</div>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: r.경쟁밀도 <= 2 ? "#34D399" : r.경쟁밀도 <= 5 ? "#FBBF24" : "#F87171" }}>{r.경쟁밀도}개</div>
                                </div>
                                <div style={aiMiniStatStyle}>
                                  <div style={{ fontSize: 11, color: "#9E9E9E", marginBottom: 2 }}>시너지업종</div>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: "#E8E8E8" }}>{r.보완밀도}개</div>
                                </div>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {r.reasons.map((reason, i) => (
                                  <div key={i} style={{ fontSize: 13, color: "#C8C8C8", display: "flex", alignItems: "flex-start", gap: 6 }}>
                                    <span style={{ color: color, flexShrink: 0 }}>•</span>{reason}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 모드 "score" — 적합도 상세 */}
                  {aiMode === "score" && (() => {
                    const r = aiResults;
                    return (
                      <div>
                        {/* 종합 점수 */}
                        <div style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(59,130,246,0.08)", borderRadius: 14, padding: "16px 20px", marginBottom: 16, border: "1.5px solid rgba(59,130,246,0.25)" }}>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 46, fontWeight: 800, color: "#60A5FA", lineHeight: 1 }}>{r.score}</div>
                            <div style={{ fontSize: 13, color: "#9E9E9E", marginTop: 4 }}>종합 점수</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: "#E8E8E8", marginBottom: 4 }}>등급 {r.grade}</div>
                            <div style={{ fontSize: 14, color: "#C8C8C8", lineHeight: 1.6 }}>{r.summary}</div>
                          </div>
                        </div>

                        {/* 항목별 점수 */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 10 }}>항목별 평가</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {r.breakdown.map((b) => (
                              <div key={b.label}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ fontSize: 14, color: "#C8C8C8" }}>{b.label}</span>
                                  <span style={{ fontSize: 14, color: "#9E9E9E", fontWeight: 600 }}>{b.score} / {b.max}</span>
                                </div>
                                <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                                  <div style={{ width: `${(b.score / b.max) * 100}%`, height: "100%", background: b.score >= 80 ? "linear-gradient(90deg,#10B981,#34D399)" : b.score >= 60 ? "linear-gradient(90deg,#3B82F6,#60A5FA)" : "linear-gradient(90deg,#F59E0B,#FBBF24)", borderRadius: 4 }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 장단점 */}
                        <div style={{ display: "flex", gap: 8 }}>
                          <div style={{ flex: 1, background: "rgba(16,185,129,0.07)", borderRadius: 10, padding: "12px", border: "1px solid rgba(16,185,129,0.2)" }}>
                            <div style={{ fontSize: 13, color: "#34D399", fontWeight: 700, marginBottom: 8 }}>강점</div>
                            {r.pros.map((p) => <div key={p} style={{ fontSize: 14, color: "#C8C8C8", marginBottom: 4 }}>✓ {p}</div>)}
                          </div>
                          <div style={{ flex: 1, background: "rgba(239,68,68,0.07)", borderRadius: 10, padding: "12px", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <div style={{ fontSize: 13, color: "#F87171", fontWeight: 700, marginBottom: 8 }}>유의점</div>
                            {r.cons.map((c) => <div key={c} style={{ fontSize: 14, color: "#C8C8C8", marginBottom: 4 }}>! {c}</div>)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── 지역 비교 결과 ── */}
                  {aiMode === "compare_region" && aiResults?.a && (() => {
                    const { a, b, type, category } = aiResults;
                    const METRICS = [
                      { key: "점포수",         label: "점포수",       fmt: v => `${v}개` },
                      { key: "월매출",          label: "월 매출합",    fmt: v => v >= 1e8 ? `${(v/1e8).toFixed(1)}억` : `${(v/1e4).toFixed(0)}만` },
                      { key: "점포당매출",      label: "점포당 매출",  fmt: v => v >= 1e8 ? `${(v/1e8).toFixed(1)}억` : `${Math.round(v/1e4)}만` },
                      { key: "경쟁강도",        label: "경쟁강도",     fmt: v => `${v}` },
                      { key: "업종_포화도",     label: "업종 포화도",  fmt: v => `${v}%` },
                      { key: "업종_매출점유율", label: "매출 점유율",  fmt: v => `${v}%` },
                      { key: "개업률",          label: "개업률",       fmt: v => `${v}%` },
                      { key: "폐업률",          label: "폐업률",       fmt: v => `${v}%` },
                      { key: "성장확률",        label: "AI 성장확률",  fmt: v => `${v}%` },
                    ];
                    const reverseKeys = new Set(["경쟁강도", "업종_포화도", "폐업률"]);
                    return (
                      <div>
                        {/* 업종 배지 */}
                        <div style={{ textAlign: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 13, background: "rgba(52,211,153,0.12)", color: "#34D399", padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>
                            {CATEGORY_EMOJI[category] ?? "🏪"} {category}
                          </span>
                        </div>
                        {/* 지역명 헤더 */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                          <div />
                          {[a, b].map((r, i) => (
                            <div key={i} style={{ textAlign: "center", padding: "10px 6px", borderRadius: 10, background: i === 0 ? "rgba(52,211,153,0.1)" : "rgba(59,130,246,0.1)", border: `1.5px solid ${i===0?"rgba(52,211,153,0.3)":"rgba(59,130,246,0.3)"}` }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: i===0?"#34D399":"#60A5FA" }}>{r.name}</div>
                              <div style={{ fontSize: 11, color: "#9E9E9E", marginTop: 2 }}>등급 {r.등급} · {type === "dong" ? "행정동" : "구"}</div>
                            </div>
                          ))}
                        </div>
                        {/* 지표 행 */}
                        {METRICS.map(({ key, label, fmt }) => {
                          const vA = a[key] ?? 0, vB = b[key] ?? 0;
                          const isReverse = reverseKeys.has(key);
                          const aBetter = isReverse ? vA < vB : vA > vB;
                          const bBetter = isReverse ? vB < vA : vB > vA;
                          return (
                            <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6, alignItems: "center" }}>
                              <div style={{ fontSize: 12, color: "#9E9E9E", textAlign: "center" }}>{label}</div>
                              {[{ v: vA, better: aBetter }, { v: vB, better: bBetter }].map(({ v, better }, i) => (
                                <div key={i} style={{ textAlign: "center", padding: "7px 4px", borderRadius: 8, background: better ? (i===0?"rgba(52,211,153,0.1)":"rgba(59,130,246,0.1)") : "rgba(255,255,255,0.03)", border: `1px solid ${better?(i===0?"rgba(52,211,153,0.25)":"rgba(59,130,246,0.25)"):"rgba(255,255,255,0.06)"}` }}>
                                  <span style={{ fontSize: 13, fontWeight: better ? 700 : 400, color: better ? (i===0?"#34D399":"#60A5FA") : "#C8C8C8" }}>{fmt(v)}</span>
                                  {better && <span style={{ marginLeft: 3, fontSize: 10, color: i===0?"#34D399":"#60A5FA" }}>▲</span>}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                        <div style={{ marginTop: 10, fontSize: 12, color: "#666", textAlign: "center" }}>기준 분기: {aiResults.quarter}</div>

                        {/* 추천 박스 */}
                        {(() => {
                          const weights = { 성장확률: 3, 월매출: 2.5, 점포당매출: 2, 개업률: 1 };
                          const reverseW = new Set(["경쟁강도", "업종_포화도", "폐업률"]);
                          let scoreA = 0, scoreB = 0;
                          for (const [key, w] of Object.entries(weights)) {
                            const vA = a[key] ?? 0, vB = b[key] ?? 0;
                            if (vA > vB) scoreA += w;
                            else if (vB > vA) scoreB += w;
                          }
                          for (const key of reverseW) {
                            const vA = a[key] ?? 0, vB = b[key] ?? 0;
                            if (vA < vB) scoreA += 1;
                            else if (vB < vA) scoreB += 1;
                          }
                          const winner = scoreA >= scoreB ? a : b;
                          const loser  = scoreA >= scoreB ? b : a;
                          const winColor = scoreA >= scoreB ? "#34D399" : "#60A5FA";
                          const fmtMoney = v => v >= 1e8 ? `${(v/1e8).toFixed(1)}억원` : `${Math.round(v/1e4)}만원`;
                          const reasons = [];
                          if (winner.성장확률 > loser.성장확률)
                            reasons.push(`AI 성장확률(${winner.성장확률}%)이 ${loser.name}(${loser.성장확률}%)보다 높아 향후 성장 가능성이 큽니다.`);
                          if (winner.월매출 > loser.월매출) {
                            const ratio = loser.월매출 > 0 ? ((winner.월매출 / loser.월매출 - 1) * 100).toFixed(0) : 100;
                            reasons.push(`${category} 업종 월매출이 ${loser.name}보다 ${ratio}% 높은 ${fmtMoney(winner.월매출)}입니다.`);
                          }
                          if (winner.점포당매출 > loser.점포당매출)
                            reasons.push(`점포당 매출(${fmtMoney(winner.점포당매출)})이 더 높아 개별 점포의 수익성이 우수합니다.`);
                          if ((winner.경쟁강도 ?? 0) < (loser.경쟁강도 ?? 0))
                            reasons.push(`경쟁강도(${winner.경쟁강도})가 낮아 ${category} 창업 시 경쟁 부담이 적습니다.`);
                          if ((winner.폐업률 ?? 0) < (loser.폐업률 ?? 0))
                            reasons.push(`폐업률(${winner.폐업률}%)이 낮아 업종 생존율이 높은 안정적인 상권입니다.`);
                          const topReasons = reasons.slice(0, 3);
                          return (
                            <div style={{ marginTop: 16, padding: "16px", background: "rgba(52,211,153,0.06)", borderRadius: 12, border: "1.5px solid rgba(52,211,153,0.25)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <span style={{ fontSize: 18 }}>💡</span>
                                <span style={{ fontSize: 13, color: "#9E9E9E" }}>{category} 창업 추천 지역</span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: winColor, marginLeft: 4 }}>{winner.name}</span>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                {topReasons.map((r, i) => (
                                  <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                                    <span style={{ color: winColor, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✔</span>
                                    <span style={{ fontSize: 13, color: "#C8C8C8", lineHeight: 1.6 }}>{r}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}

                  {/* ── 업종 비교 결과 ── */}
                  {aiMode === "compare_industry" && aiResults?.a && (() => {
                    const { a, b, region, region_type } = aiResults;
                    const METRICS = [
                      { key: "점포수",          label: "점포수",        fmt: v => `${v}개` },
                      { key: "월매출",           label: "월 매출합",     fmt: v => v >= 1e8 ? `${(v/1e8).toFixed(1)}억` : `${(v/1e4).toFixed(0)}만` },
                      { key: "점포당매출",       label: "점포당 매출",   fmt: v => v >= 1e8 ? `${(v/1e8).toFixed(1)}억` : `${Math.round(v/1e4)}만` },
                      { key: "경쟁강도",         label: "경쟁강도",      fmt: v => `${v}` },
                      { key: "업종_포화도",      label: "업종 포화도",   fmt: v => `${v}%` },
                      { key: "업종_매출점유율",  label: "매출 점유율",   fmt: v => `${v}%` },
                      { key: "개업률",           label: "개업률",        fmt: v => `${v}%` },
                      { key: "폐업률",           label: "폐업률",        fmt: v => `${v}%` },
                      { key: "성장확률",         label: "AI 성장확률",   fmt: v => `${v}%` },
                    ];
                    const reverseKeys = new Set(["경쟁강도", "업종_포화도", "폐업률"]);
                    return (
                      <div>
                        {/* 지역/업종 헤더 */}
                        <div style={{ textAlign: "center", fontSize: 12, color: "#9E9E9E", marginBottom: 10 }}>
                          {region} ({region_type === "dong" ? "행정동" : "구"})
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                          <div />
                          {[a, b].map((r, i) => (
                            <div key={i} style={{ textAlign: "center", padding: "10px 6px", borderRadius: 10, background: i===0?"rgba(52,211,153,0.1)":"rgba(248,113,113,0.1)", border: `1.5px solid ${i===0?"rgba(52,211,153,0.3)":"rgba(248,113,113,0.3)"}` }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: i===0?"#34D399":"#F87171" }}>{CATEGORY_EMOJI[r.category] ?? "🏪"} {r.category}</div>
                              <div style={{ fontSize: 11, color: "#9E9E9E", marginTop: 2 }}>등급 {r.등급}</div>
                            </div>
                          ))}
                        </div>
                        {METRICS.map(({ key, label, fmt }) => {
                          const vA = a[key] ?? 0, vB = b[key] ?? 0;
                          const isReverse = reverseKeys.has(key);
                          const aBetter = isReverse ? vA < vB : vA > vB;
                          const bBetter = isReverse ? vB < vA : vB > vA;
                          return (
                            <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6, alignItems: "center" }}>
                              <div style={{ fontSize: 12, color: "#9E9E9E", textAlign: "center" }}>{label}</div>
                              {[{ v: vA, better: aBetter, idx: 0 }, { v: vB, better: bBetter, idx: 1 }].map(({ v, better, idx }) => (
                                <div key={idx} style={{ textAlign: "center", padding: "7px 4px", borderRadius: 8, background: better?(idx===0?"rgba(52,211,153,0.1)":"rgba(248,113,113,0.1)"):"rgba(255,255,255,0.03)", border: `1px solid ${better?(idx===0?"rgba(52,211,153,0.25)":"rgba(248,113,113,0.25)"):"rgba(255,255,255,0.06)"}` }}>
                                  <span style={{ fontSize: 13, fontWeight: better?700:400, color: better?(idx===0?"#34D399":"#F87171"):"#C8C8C8" }}>{fmt(v)}</span>
                                  {better && <span style={{ marginLeft: 3, fontSize: 10, color: idx===0?"#34D399":"#F87171" }}>▲</span>}
                                </div>
                              ))}
                            </div>
                          );
                        })}

                        {/* 업종 추천 박스 */}
                        {(() => {
                          // 가중치 기반 점수 계산
                          const W = { 성장확률: 3, 점포당매출: 2.5, 업종_매출점유율: 2, 개업률: 1.5 };
                          const REV = { 경쟁강도: 2, 업종_포화도: 1.5, 폐업률: 1 };
                          let sA = 0, sB = 0;
                          for (const [k, w] of Object.entries(W)) {
                            if ((a[k]??0) > (b[k]??0)) sA += w;
                            else if ((b[k]??0) > (a[k]??0)) sB += w;
                          }
                          for (const [k, w] of Object.entries(REV)) {
                            if ((a[k]??0) < (b[k]??0)) sA += w;
                            else if ((b[k]??0) < (a[k]??0)) sB += w;
                          }
                          const winner = sA >= sB ? a : b;
                          const loser  = sA >= sB ? b : a;
                          const winColor = sA >= sB ? "#34D399" : "#F87171";

                          const fmtMoney = v => v >= 1e8 ? `${(v/1e8).toFixed(1)}억원` : `${Math.round(v/1e4)}만원`;
                          const reasons = [];

                          if ((winner.성장확률??0) > (loser.성장확률??0)) {
                            reasons.push(`AI 성장확률이 ${winner.성장확률}%로 ${loser.category}(${loser.성장확률}%)보다 높아 향후 매출 성장 가능성이 큽니다.`);
                          }
                          if ((winner.점포당매출??0) > (loser.점포당매출??0)) {
                            const ratio = ((winner.점포당매출/loser.점포당매출 - 1)*100).toFixed(0);
                            reasons.push(`점포당 월 평균 매출이 ${fmtMoney(winner.점포당매출)}으로 ${loser.category}보다 ${ratio}% 높아 수익성이 우수합니다.`);
                          }
                          if ((winner.경쟁강도??0) < (loser.경쟁강도??0)) {
                            reasons.push(`경쟁강도(${winner.경쟁강도})가 낮아 신규 진입 시 경쟁 부담이 적습니다.`);
                          }
                          if ((winner.업종_포화도??0) < (loser.업종_포화도??0)) {
                            reasons.push(`업종 포화도(${winner.업종_포화도}%)가 낮아 아직 시장 여유가 있습니다.`);
                          }
                          if ((winner.폐업률??0) < (loser.폐업률??0)) {
                            reasons.push(`폐업률(${winner.폐업률}%)이 낮아 ${region}에서 안정적으로 운영되는 업종입니다.`);
                          }
                          if ((winner.업종_매출점유율??0) > (loser.업종_매출점유율??0)) {
                            reasons.push(`지역 내 매출 점유율(${winner.업종_매출점유율}%)이 높아 이미 검증된 수요가 있습니다.`);
                          }

                          const topReasons = reasons.slice(0, 3);

                          return (
                            <div style={{ marginTop: 16, padding: "16px", background: "rgba(52,211,153,0.06)", borderRadius: 12, border: `1.5px solid ${winColor}40` }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <span style={{ fontSize: 18 }}>💡</span>
                                <span style={{ fontSize: 13, color: "#9E9E9E" }}>추천 업종</span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: winColor, marginLeft: 4 }}>{CATEGORY_EMOJI[winner.category] ?? "🏪"} {winner.category}</span>
                                <span style={{ fontSize: 12, background: `${winColor}25`, color: winColor, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>등급 {winner.등급}</span>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                {topReasons.map((r, i) => (
                                  <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                                    <span style={{ color: winColor, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✔</span>
                                    <span style={{ fontSize: 13, color: "#C8C8C8", lineHeight: 1.6 }}>{r}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}

                  <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid #3A3A3A" }}>
                    <div style={{ fontSize: 13, color: "#777" }}>
                      ⚠️ 본 추천 결과는 AI 분석 기반이며, 실제 창업 시 현장 조사를 병행하시기 바랍니다.
                    </div>
                  </div>
                </>
              )}
            </div>
        </div>
      )}



      {/* ── 업종 선택 사이드 패널 ── */}
      {/* AI 패널(380px) 바로 왼쪽에 붙도록 right: 380 */}
      {aiModalOpen && showIndustryPicker && (
        <div
          className="anim-panel-slide-in-right"
          style={{
            ...secondPanelStyle,
            left: "auto",
            right: 380,     // AI 패널 왼쪽에 붙음
            width: 300,
            borderLeft: "1px solid rgba(255,255,255,0.07)",
            zIndex: 13,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 2 }}>{aiDong}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#E8E8E8" }}>업종 선택</div>
            </div>
            <button onClick={() => setShowIndustryPicker(false)} style={closeBtnStyle}>✕</button>
          </div>
          <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 12, flexShrink: 0 }}>업종을 선택하면 해당 지역의 창업 적합도를 분석합니다</div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {pickerDrillGroup ? (
              /* 세부 카테고리 */
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <button
                  onClick={() => setPickerDrillGroup(null)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#9E9E9E", marginBottom: 4 }}
                >
                  ← {DRILL_GROUP_META[pickerDrillGroup].emoji} {pickerDrillGroup}
                </button>
                {CATEGORY_GROUPS[pickerDrillGroup].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setAiIndustry(cat);
                      setAiMode("score");
                      setShowIndustryPicker(false);
                      setPickerDrillGroup(null);
                      setAiStep("loading");
                      Promise.all([
                        fetch(`http://localhost:8000/api/recommend/score/?dong=${encodeURIComponent(aiDong.trim())}&category=${encodeURIComponent(cat)}`).then((r) => r.json()),
                        new Promise((res) => setTimeout(res, 1200)),
                      ])
                        .then(([data]) => {
                          if (data.error) { alert(data.error); setAiStep("form"); return; }
                          setAiResults(data);
                          setAiStep("result");
                        })
                        .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("form"); });
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, fontSize: 14, fontWeight: 500, cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#C8C8C8", textAlign: "left", transition: "background 0.15s, color 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.15)"; e.currentTarget.style.color = "#93B8EE"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.35)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#C8C8C8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{CATEGORY_EMOJI[cat] ?? "🏪"}</span>
                    {cat}
                  </button>
                ))}
              </div>
            ) : (
              /* 대분류 목록 */
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DRILL_GROUPS.map((group) => (
                  <button
                    key={group}
                    onClick={() => setPickerDrillGroup(group)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#C8C8C8", textAlign: "left", transition: "background 0.15s, color 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.12)"; e.currentTarget.style.color = "#93B8EE"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#C8C8C8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  >
                    <span style={{ fontSize: 20 }}>{DRILL_GROUP_META[group].emoji}</span>
                    {group}
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#6B7280" }}>{CATEGORY_GROUPS[group].length}개 →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 창업비용 계산기 오버레이 ── */}
      {startupCalcOpen && (
        <div style={startupCalcOverlayStyle} onClick={() => { setStartupCalcOpen(false); setCalcResult(null); setCalcIndustry(null); setCalcArea(33); setCalcFloor("1층"); setCalcWorkers(1); setCalcSelectedGu(""); setCalcSearchQuery(""); setCalcDrillGroup(null); }}>
          <div style={startupCalcPanelStyle} onClick={(e) => e.stopPropagation()}>

            {/* 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>💰</span>
                <span style={{ fontSize: 19, fontWeight: 700, color: "#E8E8E8" }}>창업비용 계산기</span>
              </div>
              <button onClick={() => { setStartupCalcOpen(false); setCalcResult(null); setCalcIndustry(null); setCalcArea(33); setCalcFloor("1층"); setCalcWorkers(1); setCalcSelectedGu(""); setCalcSearchQuery(""); setCalcDrillGroup(null); }} style={closeBtnStyle}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* 결과 뷰 / 입력 뷰 전환 — calcResult가 있으면 결과만 표시, 없으면 입력 폼 표시 */}
            {calcResult ? (
              /* 결과 섹션 — gap을 10으로 줄여 카드 간격 최소화, 스크롤 없이 한 화면에 맞춤 */
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                {/* 헤더: 선택 업종·구 + 다시 계산하기 버튼 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, color: "#93B8EE", fontWeight: 700 }}>{calcIndustry} · {calcResult.구}</span>
                  <button
                    onClick={() => setCalcResult(null)} // 결과 초기화 → 입력 폼으로 복귀
                    style={{
                      padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12,
                      border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)",
                      color: "#C8C8C8",
                    }}
                  >← 다시 계산하기</button>
                </div>

                {/* 초기 창업비용 */}
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#E8E8E8", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    📦 초기 창업비용 <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 400 }}>(일회성)</span>
                  </div>
                  {[["보증금", calcResult.보증금], ["인테리어", calcResult.인테리어], ["설비·집기", calcResult.설비집기], ["초기재고", calcResult.초기재고]].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                      <span style={{ color: "#9E9E9E" }}>{label}</span>
                      <span style={{ color: "#E8E8E8", fontWeight: 500 }}>{val.toLocaleString()}만원</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 6, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#E8E8E8" }}>합계</span>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#60A5FA" }}>{calcResult.초기합계.toLocaleString()}만원</span>
                  </div>
                </div>

                {/* 월 고정비 */}
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#E8E8E8", marginBottom: 8 }}>📅 월 고정비</div>
                  {[["임대료", calcResult.월임대료], ["관리비·공과금", calcResult.월관리비], ["인건비", calcResult.월인건비]].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                      <span style={{ color: "#9E9E9E" }}>{label}</span>
                      <span style={{ color: "#E8E8E8", fontWeight: 500 }}>{val.toLocaleString()}만원</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 6, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#E8E8E8" }}>합계</span>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#34D399" }}>{calcResult.월고정비합계.toLocaleString()}만원</span>
                  </div>
                </div>

                {/* 손익분기 */}
                <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div style={{ color: "#FCD34D", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>💡 손익분기 기준</div>
                  <div style={{ color: "#D1D5DB", fontSize: 13, lineHeight: 1.5 }}>
                    원가율 {calcResult.원가율}% 기준, 월{" "}
                    <span style={{ color: "#FCD34D", fontWeight: 700 }}>{calcResult.손익분기_월매출.toLocaleString()}만원</span> 이상 매출 필요
                  </div>
                  {calcResult.특이사항 && (
                    <div style={{ color: "#9CA3AF", marginTop: 4, fontSize: 11 }}>⚠️ {calcResult.특이사항}</div>
                  )}
                </div>

                {/* 주석 */}
                <div style={{ fontSize: 11, color: "#6B7280", textAlign: "center", lineHeight: 1.5 }}>
                  ※ {calcResult.구} 평균 임대료 기준 ({calcResult.층}{calcResult.rentFallback ? " 데이터 없어 1층 기준" : ""}, {calcResult.rentPerSqm}만원/㎡)<br />
                  ※ 실제 비용은 참고용으로만 활용하세요.
                </div>
              </div>
            ) : (
              <>
              {/* ① 업종 선택 */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#9E9E9E", marginBottom: 10, letterSpacing: "0.05em" }}>① 업종 선택</div>
                {/* 업종 검색창 */}
                <div style={{ marginBottom: 8 }}>
                  <input
                    type="text"
                    placeholder="업종 직접 검색... (예: 피자, 세차장)"
                    value={calcSearchQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCalcSearchQuery(v);
                      setCalcDrillGroup(null);
                      clearTimeout(calcSuggestTimer.current);
                      if (v.trim().length >= 1) {
                        calcSuggestTimer.current = setTimeout(() => {
                          fetch(`http://localhost:8000/api/suggest/industries-with-category/?q=${encodeURIComponent(v)}`)
                            .then((r) => r.json())
                            .then((d) => { setCalcSuggestions(d.suggestions || []); setCalcSuggestOpen(true); })
                            .catch(() => setCalcSuggestions([]));
                        }, 200);
                      } else {
                        setCalcSuggestions([]);
                        setCalcSuggestOpen(false);
                      }
                    }}
                    onBlur={() => setTimeout(() => setCalcSuggestOpen(false), 150)}
                    style={{
                      width: "100%", padding: "6px 10px", fontSize: 13,
                      borderRadius: calcSuggestOpen && calcSuggestions.length > 0 ? "8px 8px 0 0" : 8,
                      background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)",
                      color: "#E8E8E8", outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <div style={{
                    overflow: "hidden",
                    maxHeight: calcSuggestOpen && calcSuggestions.length > 0 ? 320 : 0,
                    opacity: calcSuggestOpen && calcSuggestions.length > 0 ? 1 : 0,
                    transition: "max-height 0.22s ease, opacity 0.18s ease",
                    background: "#1E2330", border: "1.5px solid rgba(255,255,255,0.12)",
                    borderTop: "none", borderRadius: "0 0 8px 8px",
                  }}>
                    {calcSuggestions.map((s, i) => (
                      <div
                        key={i}
                        onMouseDown={() => {
                          setCalcIndustry(s.통합카테고리);
                          setCalcResult(null);
                          setCalcSearchQuery("");
                          setCalcSuggestOpen(false);
                        }}
                        style={{
                          padding: "7px 12px", cursor: "pointer", fontSize: 13,
                          borderBottom: i < calcSuggestions.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59,130,246,0.15)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{ color: "#E8E8E8" }}>{s.소분류명}</span>
                        <span style={{
                          fontSize: 11, color: "#93B8EE", background: "rgba(59,130,246,0.18)",
                          padding: "2px 7px", borderRadius: 10,
                        }}>{s.통합카테고리}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 드릴다운 목록 — 검색 중에는 숨김 */}
                {!calcSearchQuery && (
                  calcDrillGroup ? (
                    /* 세부 카테고리 */
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <button
                        onClick={() => setCalcDrillGroup(null)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#9E9E9E", marginBottom: 4 }}
                      >
                        ← {DRILL_GROUP_META[calcDrillGroup].emoji} {calcDrillGroup}
                      </button>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {CATEGORY_GROUPS[calcDrillGroup].map((cat) => (
                          <button key={cat} onClick={() => { setCalcIndustry(cat); setCalcResult(null); }}
                            style={{
                              padding: "5px 10px", borderRadius: 20, cursor: "pointer", fontSize: 13,
                              border: calcIndustry === cat ? "2px solid #3B82F6" : "1.5px solid rgba(255,255,255,0.15)",
                              background: calcIndustry === cat ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.05)",
                              color: calcIndustry === cat ? "#93B8EE" : "#C8C8C8",
                              fontWeight: calcIndustry === cat ? 700 : 400,
                              display: "flex", alignItems: "center", gap: 4,
                            }}
                          >
                            <span>{CATEGORY_EMOJI[cat] ?? "🏪"}</span>{cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* 대분류 목록 */
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {DRILL_GROUPS.map((group) => (
                        <button
                          key={group}
                          onClick={() => setCalcDrillGroup(group)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#C8C8C8", textAlign: "left", transition: "background 0.15s, color 0.15s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.12)"; e.currentTarget.style.color = "#93B8EE"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#C8C8C8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                        >
                          <span style={{ fontSize: 18 }}>{DRILL_GROUP_META[group].emoji}</span>
                          {group}
                          <span style={{ marginLeft: "auto", fontSize: 12, color: "#6B7280" }}>{CATEGORY_GROUPS[group].length}개 →</span>
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* ② 기본 정보 (업종 선택 후) */}
              {calcIndustry && (
                <>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#9E9E9E", marginBottom: 10, letterSpacing: "0.05em" }}>② 기본 정보</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                      {/* 면적 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, color: "#9E9E9E", width: 54, flexShrink: 0 }}>면적</span>
                        <input
                          type="number" min={10} max={300} value={calcArea}
                          onChange={(e) => { setCalcArea(Number(e.target.value)); setCalcResult(null); }}
                          style={calcInputStyle}
                        />
                        <span style={{ color: "#9E9E9E", fontSize: 13 }}>㎡ &nbsp;({(calcArea / 3.3).toFixed(1)}평)</span>
                      </div>

                      {/* 층수 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, color: "#9E9E9E", width: 54, flexShrink: 0 }}>층수</span>
                        {["지하1층", "1층", "2층"].map((f) => (
                          <button key={f} onClick={() => { setCalcFloor(f); setCalcResult(null); }} style={{
                            padding: "4px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                            border: calcFloor === f ? "1.5px solid #3B82F6" : "1.5px solid rgba(255,255,255,0.15)",
                            background: calcFloor === f ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.05)",
                            color: calcFloor === f ? "#93B8EE" : "#C8C8C8",
                          }}>{f}</button>
                        ))}
                      </div>

                      {/* 직원수 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, color: "#9E9E9E", width: 54, flexShrink: 0 }}>직원수</span>
                        <input
                          type="number" min={0} max={10} value={calcWorkers}
                          onChange={(e) => { setCalcWorkers(Number(e.target.value)); setCalcResult(null); }}
                          style={calcInputStyle}
                        />
                        <span style={{ color: "#9E9E9E", fontSize: 13 }}>명 (사장 포함)</span>
                      </div>

                      {/* 지역 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, color: "#9E9E9E", width: 54, flexShrink: 0 }}>지역</span>
                        {selectedDong?.guName ? (
                          <span style={{ fontSize: 13, color: "#93B8EE", fontWeight: 600 }}>
                            {selectedDong.guName} <span style={{ color: "#6B7280", fontWeight: 400 }}>(지도 선택)</span>
                          </span>
                        ) : (
                          <select
                            value={calcSelectedGu}
                            onChange={(e) => { setCalcSelectedGu(e.target.value); setCalcResult(null); }}
                            style={{
                              ...calcInputStyle,
                              width: 140, cursor: "pointer",
                              background: "#1E2330",          // 반투명 대신 solid — 브라우저 네이티브 select는 반투명이 흰색으로 렌더링됨
                              color: "#E8E8E8",
                            }}
                          >
                            <option value="" style={{ background: "#1E2330", color: "#9E9E9E" }}>구 선택...</option>
                            {REGIONS.map((g) => <option key={g} value={g} style={{ background: "#1E2330", color: "#E8E8E8" }}>{g}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 계산 버튼 */}
                  <button
                    onClick={() => {
                      const gu = selectedDong?.guName || calcSelectedGu;
                      if (!gu) { alert("지역(구)을 선택해주세요."); return; }
                      const cat = STARTUP_COSTS[calcIndustry];
                      const pyeong = calcArea / 3.3;
                      const guData = calcGuRental?.[gu];
                      const floorData = guData?.[calcFloor] || guData?.["1층"];
                      const rentPerSqm = floorData?.["임대료_만원per㎡"] ?? 4.0;
                      const 월임대료 = Math.round(rentPerSqm * calcArea);
                      const 보증금 = 월임대료 * cat["보증금_임대료배수"];
                      const 인테리어 = Math.round(cat["인테리어_만원per평"] * pyeong);
                      const 설비집기 = cat["설비_집기_만원"];
                      const 초기재고 = cat["초기재고_만원"];
                      const 초기합계 = 보증금 + 인테리어 + 설비집기 + 초기재고;
                      const 월최저임금 = Math.round(10030 * 209 / 10000);
                      const 월인건비 = calcWorkers * 월최저임금;
                      const 월관리비 = cat["관리비_공과금_만원per월"];
                      const 월고정비합계 = 월임대료 + 월관리비 + 월인건비;
                      const 원가율 = cat["원가율_%"];
                      const 손익분기_월매출 = Math.round(월고정비합계 / (1 - 원가율 / 100));
                      setCalcResult({
                        구: gu, 층: calcFloor, rentPerSqm,
                        월임대료, 보증금, 인테리어, 설비집기, 초기재고, 초기합계,
                        월인건비, 월관리비, 월고정비합계,
                        원가율, 손익분기_월매출,
                        특이사항: cat["특이사항"],
                        rentFallback: !guData?.[calcFloor],
                      });
                    }}
                    style={{
                      padding: "11px 0", borderRadius: 10, border: "none", flexShrink: 0,
                      background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                      color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    계산하기
                  </button>

                </>
              )}
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* ── 상단 오른쪽: AI 추천 + 메뉴 버튼 ── */}
      {/* ── 상단 네비게이션 바 ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: NAV_HEIGHT,
        background: "#fff",
        borderBottom: "1px solid #E5E7EB",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 20,
      }}>
        {/* 로고 */}
        <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>
          노다지
        </div>

        {/* 버튼 그룹 - 우측 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, transition: "margin-right 0.22s ease-out", marginRight: aiModalOpen ? 390 : 0 }}>

          {/* 상권 분석 도구 드롭다운 */}
          <div data-popup style={{ position: "relative", opacity: drawingMode ? 0.4 : 1, pointerEvents: drawingMode ? "none" : "auto" }}>
            <button
              onClick={() => setToolMenuOpen((v) => !v)}
              style={{
                height: NAV_HEIGHT, padding: "0 14px", border: "none", background: "transparent",
                color: "#444", fontSize: 14, fontWeight: toolMenuOpen ? 700 : 500,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                borderBottom: "none",
              }}
            >
              상권 분석 도구 <span style={{ fontSize: 10, color: "#9CA3AF" }}>▼</span>
            </button>
            {toolMenuOpen && (
              <div data-popup className="anim-slide-down" style={{ ...popupStyle({ left: 0, width: 200 }), background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                <button
                  style={{ ...menuItemStyle, color: "#374151" }}
                  onClick={() => {
                    setToolMenuOpen(false);
                    if (drawingMode) { drawingModeRef.current = false; setDrawingMode(false); clearCustomDrawing(); }
                    else { startDrawing(); }
                  }}
                >
                  {drawingMode ? "✏️ 그리기 중... (취소)" : "✏️ 상권 그리기"}
                </button>
                <div style={{ borderTop: "1px solid #F3F4F6", margin: "4px 0" }} />
                <button
                  style={{ ...menuItemStyle, color: "#374151" }}
                  onClick={() => { setToolMenuOpen(false); setStartupCalcOpen((v) => !v); }}
                >
                  💰 창업비용 계산기
                </button>
              </div>
            )}
          </div>

          {/* 상권 트렌드 */}
          <button
            onClick={() => navigate("/trend")}
            style={{
              height: NAV_HEIGHT, padding: "0 14px", border: "none", background: "transparent",
              color: "#444", fontSize: 14, fontWeight: 500, cursor: "pointer",
              borderBottom: "none",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#111827"; e.currentTarget.style.fontWeight = "700"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#444"; e.currentTarget.style.fontWeight = "500"; }}
          >
            트렌드
          </button>

          {/* AI 추천 */}
          <button
            onClick={openAiModal}
            style={{
              height: NAV_HEIGHT, padding: "0 14px", border: "none", background: "transparent",
              color: aiModalOpen ? "#111827" : "#444", fontSize: 14,
              fontWeight: aiModalOpen ? 700 : 500, cursor: "pointer",
              borderBottom: "none",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#111827"; e.currentTarget.style.fontWeight = "700"; }}
            onMouseLeave={(e) => { if (!aiModalOpen) { e.currentTarget.style.color = "#444"; e.currentTarget.style.fontWeight = "500"; } }}
          >
            AI 추천
          </button>

          {/* 구분선 */}
          <div style={{ width: 1, height: 20, background: "#E5E7EB", margin: "0 8px" }} />

          {/* 메뉴 */}
          <div data-popup style={{ position: "relative" }}>
            <button
              onClick={() => { setMenuOpen((v) => !v); setSearchExpanded(false); }}
              style={{
                height: NAV_HEIGHT, padding: "0 14px", border: "none", background: "transparent",
                color: menuOpen ? "#111827" : "#444", fontSize: 14,
                fontWeight: menuOpen ? 700 : 500, cursor: "pointer",
                borderBottom: "none",
              }}
            >
              메뉴
            </button>
            {menuOpen && (
              <div data-popup className="anim-slide-down" style={popupStyle({ right: 0, width: 180 })}>
                <button style={menuItemStyle} onClick={() => navigate("/login")}>🔐 로그인</button>
                <div style={{ borderTop: "1px solid #4A4A4A", margin: "4px 0" }} />
                <button style={menuItemStyle} onClick={() => navigate("/signup")}>📝 회원가입</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 구별 매출 순위 티커 바 ── */}
      {guAllRanking.length > 0 && (
        <div style={{
          position: "absolute", top: NAV_HEIGHT, right: 0,
          width: 260, height: 28,
          background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(229,231,235,0.6)", borderLeft: "1px solid rgba(229,231,235,0.6)",
          borderBottomLeftRadius: 8,
          display: "flex", alignItems: "center", gap: 8, padding: "0 12px",
          zIndex: 19,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#6B9FE4", borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>매출 TOP</span>
          <GuRankTicker items={guAllRanking.slice(0, 10)} />
        </div>
      )}

      {/* ── 상권 직접 그리기 결과 패널 ── */}
      {(drawingMode || customPolygonDone) && (
        <div style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          width: 340, background: "rgba(18,18,22,0.95)", backdropFilter: "blur(12px)",
          borderRadius: 14, border: "1px solid rgba(245,158,11,0.4)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)", zIndex: 300, padding: "16px 18px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#F59E0B" }}>
              {drawingMode ? "✏️ 지도를 클릭해 영역을 그리세요" : "✏️ 직접 그린 상권"}
            </span>
            <button
              onClick={() => { clearCustomDrawing(); drawingModeRef.current = false; setDrawingMode(false); }}
              style={{ background: "none", border: "none", color: "#9E9E9E", fontSize: 16, cursor: "pointer" }}
            >✕</button>
          </div>

          {drawingMode && (
            <p style={{ fontSize: 12, color: "#9E9E9E", margin: "0 0 8px" }}>
              꼭짓점을 3개 이상 찍고 첫 번째 점을 다시 클릭하면 완성돼요.
            </p>
          )}

          {customPolygonDone && (
            <>
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12, color: "#9E9E9E", margin: "0 0 8px" }}>업종 선택</p>
                {/* 검색 */}
                <input
                  type="text"
                  placeholder="업종 검색..."
                  value={customSearchQuery}
                  onChange={(e) => { setCustomSearchQuery(e.target.value); setCustomDrillGroup(e.target.value ? "__search__" : null); }}
                  style={{ width: "100%", padding: "6px 10px", fontSize: 13, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)", color: "#E8E8E8", outline: "none", boxSizing: "border-box", marginBottom: 8 }}
                />
                {customSearchQuery ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {Object.values(CATEGORY_GROUPS).flat().filter((c, i, a) => a.indexOf(c) === i && c.includes(customSearchQuery)).map(cat => (
                      <button key={cat} onClick={() => { setCustomCategory(cat); setCustomSearchQuery(""); setCustomDrillGroup(null); }}
                        style={{ padding: "4px 9px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: customCategory === cat ? "1.5px solid #F59E0B" : "1.5px solid rgba(255,255,255,0.15)", background: customCategory === cat ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.05)", color: customCategory === cat ? "#F59E0B" : "#C8C8C8" }}>
                        {CATEGORY_EMOJI[cat] ?? "🏪"} {cat}
                      </button>
                    ))}
                  </div>
                ) : customDrillGroup ? (
                  <>
                    <button onClick={() => setCustomDrillGroup(null)} style={{ fontSize: 12, color: "#F59E0B", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "0 0 8px 0" }}>
                      ← {customDrillGroup}
                    </button>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {CATEGORY_GROUPS[customDrillGroup].map(cat => (
                        <button key={cat} onClick={() => { setCustomCategory(cat); setCustomDrillGroup(null); }}
                          style={{ padding: "4px 9px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: customCategory === cat ? "1.5px solid #F59E0B" : "1.5px solid rgba(255,255,255,0.15)", background: customCategory === cat ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.05)", color: customCategory === cat ? "#F59E0B" : "#C8C8C8" }}>
                          {CATEGORY_EMOJI[cat] ?? "🏪"} {cat}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {customCategory && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", marginBottom: 2 }}>
                        <span style={{ fontSize: 12, color: "#F59E0B" }}>{CATEGORY_EMOJI[customCategory] ?? "🏪"} {customCategory}</span>
                        <button onClick={() => setCustomCategory("")} style={{ fontSize: 11, color: "#9E9E9E", background: "none", border: "none", cursor: "pointer" }}>✕ 해제</button>
                      </div>
                    )}
                    {DRILL_GROUPS.map(group => (
                      <button key={group} onClick={() => setCustomDrillGroup(group)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#C8C8C8" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.1)"; e.currentTarget.style.color = "#F59E0B"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#C8C8C8"; }}
                      >
                        <span>{DRILL_GROUP_META[group].emoji} {group}</span>
                        <span style={{ color: "#6B7280", fontSize: 11 }}>{CATEGORY_GROUPS[group].length}개 →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => { if (customCategory) fetchCustomSpot(customCategory); }}
                disabled={!customCategory || customLoading}
                style={{
                  width: "100%", padding: "9px 0", borderRadius: 8, border: "none",
                  background: customCategory ? "#F59E0B" : "rgba(255,255,255,0.1)",
                  color: customCategory ? "#000" : "#666", fontWeight: 700, fontSize: 14, cursor: customCategory ? "pointer" : "default",
                  marginBottom: customResults ? 12 : 0,
                }}
              >
                {customLoading ? "분석 중..." : "이 지역 추천 받기"}
              </button>

              {customResults && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 12, color: "#9E9E9E", marginBottom: 8 }}>
                    입지점수 Top {customResults.length} · 숫자 마커로 지도에 표시됨
                  </div>
                  {customResults.map((r) => (
                    <div key={r.rank} style={{
                      padding: "10px 0", borderBottom: r.rank < customResults.length ? "1px solid rgba(255,255,255,0.06)" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                          background: ["#EF4444","#F97316","#EAB308","#22C55E","#3B82F6"][r.rank-1],
                          color: "#fff", fontSize: 11, fontWeight: 700, width: 20, height: 20,
                          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>{r.rank}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#E8E8E8" }}>입지점수 {r.score}점</span>
                        <span style={{ fontSize: 11, color: "#9E9E9E", marginLeft: "auto" }}>생존율 {r.생존율}%</span>
                      </div>
                      {r.reasons.map((reason, i) => (
                        <div key={i} style={{ fontSize: 11, color: "#9E9E9E", paddingLeft: 28 }}>· {reason}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => { startDrawing(); }}
                style={{
                  width: "100%", marginTop: 10, padding: "7px 0", borderRadius: 8,
                  border: "1px solid rgba(245,158,11,0.3)", background: "transparent",
                  color: "#F59E0B", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >다시 그리기</button>
            </>
          )}
        </div>
      )}

    </div>
  );
}

/* ── 상가 카테고리 색상 ── */
const CATEGORY_EMOJI = {
  // 음식
  "한식":                   "🍚",
  "중식":                   "🥢",
  "일식":                   "🍱",
  "양식/기타외식":          "🍝",
  "분식/간식":              "🥯",
  "베이커리/디저트":        "🥐",
  "치킨전문점":             "🍗",
  "패스트푸드":             "🍔",
  "카페":                   "☕",
  "주점":                   "🍺",
  // 식품 소매
  "편의점":                 "🏪",
  "슈퍼마켓":               "🏬",
  "미곡판매":               "🌾",
  "수산물판매":             "🐟",
  "육류판매":               "🥩",
  "청과상":                 "🍎",
  "반찬가게":               "🥘",
  "식품 소매":              "🛒",  // store pin 전용
  // 의류
  "일반의류":               "👗",
  "신발":                   "👟",
  "가방":                   "👜",
  "섬유제품":               "🧵",
  "의류/패션":              "👗",  // store pin 전용
  // 뷰티
  "화장품":                 "💄",
  "네일숍":                 "💅",
  "피부관리실":             "🧖",
  "뷰티/화장품":            "💄",  // store pin 전용
  "미용실":                 "✂️",
  // 전자
  "가전제품":               "📺",
  "핸드폰":                 "📱",
  "컴퓨터및주변장치판매":   "💻",
  "전자/통신":              "📱",  // store pin 전용
  "생활용품 소매":          "🧹",
  // 의료
  "일반의원":               "🏥",
  "치과의원":               "🦷",
  "한의원":                 "🌿",
  "의료기기":               "🩺",
  "의약품":                 "💊",
  "안경":                   "👓",
  "의료/약국":              "💊",  // store pin 전용
  // 학원
  "외국어학원":             "🌍",
  "일반교습학원":           "📚",
  "예술학원":               "🎨",
  // 스포츠
  "스포츠 강습":            "🏃",
  "골프연습장":             "⛳",
  "스포츠클럽":             "🏋️",
  "스포츠/레저":            "⚽",  // store pin 전용
  // 기타
  "숙박":                   "🛏️",
  "PC방":                   "🖥️",
  "노래방":                 "🎤",
  "당구장":                 "🎱",
  "오락/유흥":              "🎮",  // store pin 전용
  "가전제품수리":           "🔧",
  "세탁소":                 "👕",
  "인테리어":               "🏗️",
  "자동차수리/미용":        "🚗",
  "기타 B2B서비스":         "💼",
  "애완동물":               "🐾",
};

const STORE_CATEGORY_COLORS = {
  // 음식 — 중간 파랑 계열 (hue ~210-220)
  "한식":                   "#4A7FCC",
  "중식":                   "#3D72C0",
  "일식":                   "#5589D4",
  "양식/기타외식":          "#6496DE",
  "분식/간식":              "#7AAAE8",
  "베이커리/디저트":        "#85B3EE",
  "치킨전문점":             "#3068B8",
  "패스트푸드":             "#4478C8",
  "카페":                   "#2A5AA0",
  "주점":                   "#6878C8",

  // 식품 소매 — 시안-파랑 계열 (hue ~193-200)
  "편의점":                 "#2AAAC8",
  "슈퍼마켓":               "#2090B0",
  "미곡판매":               "#3898BC",
  "수산물판매":             "#1A80A8",
  "육류판매":               "#2878A0",
  "청과상":                 "#3AAAC0",
  "반찬가게":               "#45B5C8",
  "식품 소매":              "#55C0D8",

  // 의류/패션 — 진한 파랑 계열 (hue ~226-232)
  "일반의류":               "#3A5AC0",
  "신발":                   "#4268CC",
  "가방":                   "#5078D8",
  "섬유제품":               "#3055B8",
  "의류/패션":              "#5A85E0",

  // 뷰티 — 블루-바이올렛 계열 (hue ~240-248)
  "화장품":                 "#6464C8",
  "네일숍":                 "#7070D0",
  "피부관리실":             "#7E7EDA",
  "뷰티/화장품":            "#8A8AE4",
  "미용실":                 "#5858C0",

  // 전자 — 밝은 시안-파랑 (hue ~193-198)
  "가전제품":               "#2298C8",
  "핸드폰":                 "#30AADC",
  "컴퓨터및주변장치판매":   "#1888B8",
  "전자/통신":              "#60C8E4",
  "생활용품 소매":          "#3AB0C8",

  // 의료 — 진한 네이비-파랑 (hue ~216-222)
  "일반의원":               "#2050A0",
  "치과의원":               "#2A5DB0",
  "한의원":                 "#1A4898",
  "의료기기":               "#3868B8",
  "의약품":                 "#184090",
  "안경":                   "#2C5AAA",
  "의료/약국":              "#163888",

  // 학원 — 인디고-파랑 (hue ~228-234)
  "외국어학원":             "#4462C0",
  "일반교습학원":           "#3A58B8",
  "예술학원":               "#5570CC",

  // 스포츠 — 하늘색 계열 (hue ~200-206)
  "스포츠 강습":            "#3AB5E8",
  "골프연습장":             "#2AA0D8",
  "스포츠클럽":             "#50C0EC",
  "스포츠/레저":            "#60CAF0",

  // 오락/유흥 — 블루-퍼플 (hue ~242-250)
  "PC방":                   "#7878D4",
  "노래방":                 "#8888DC",
  "당구장":                 "#6868C8",
  "오락/유흥":              "#9090E0",

  // 기타 서비스 — 슬레이트 블루 (채도 낮음)
  "숙박":                   "#5878A8",
  "애완동물":               "#6888B8",
  "가전제품수리":           "#708098",
  "세탁소":                 "#8090A8",
  "인테리어":               "#6078A8",
  "자동차수리/미용":        "#506888",
  "기타 B2B서비스":         "#485878",
};

const storeFilterChipStyle = (active) => ({
  padding: "5px 8px",
  borderRadius: 8,
  border: active ? "1px solid #9E9E9E" : "1px solid rgba(255,255,255,0.1)",
  background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
  color: active ? "#E8E8E8" : "#9E9E9E",
  fontWeight: active ? 600 : 400,
  cursor: "pointer",
  fontSize: 13,
  wordBreak: "keep-all",
  lineHeight: 1.3,
  display: "flex",
  alignItems: "center",
  gap: 5,
});

/* ── 스타일 ── */

const zoomBtnGroupStyle = {
  position: "absolute",
  bottom: 40,
  right: 20,
  display: "flex",
  flexDirection: "column",
  background: "rgba(35,35,35,0.97)",
  borderRadius: 10,
  boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
  backdropFilter: "blur(6px)",
  overflow: "hidden",
  zIndex: 10,
};

const zoomBtnStyle = {
  width: 40,
  height: 40,
  border: "none",
  background: "none",
  color: "#E8E8E8",
  fontSize: 22,
  fontWeight: 400,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

const tooltipStyle = {
  position: "absolute",
  bottom: 40,
  left: 20,
  background: "rgba(42,42,52,0.92)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 12,
  padding: "12px 16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  backdropFilter: "blur(10px)",
  zIndex: 10,
  fontSize: 16,
  pointerEvents: "none",
  minWidth: 180,
  transition: "left 0.22s ease-out",
};

const tooltipLabel = {
  fontSize: 12,
  fontWeight: 700,
  color: "#888",
  background: "rgba(255,255,255,0.07)",
  borderRadius: 4,
  padding: "2px 6px",
  letterSpacing: "0.06em",
  flexShrink: 0,
};

const dongListPanelStyle = {
  position: "absolute",
  bottom: 32,
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(28,28,38,0.97)",
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
  padding: "14px 18px",
  zIndex: 20,
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.09)",
  maxWidth: 680,
  minWidth: 340,
};

const dongChipStyle = {
  padding: "5px 11px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#C8C8C8",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s, border-color 0.15s, color 0.15s",
  whiteSpace: "nowrap",
};

const NAV_HEIGHT = 52;

const leftSidebarStyle = {
  position: "absolute",
  top: NAV_HEIGHT,
  left: 0,
  width: 320,
  height: `calc(100vh - ${NAV_HEIGHT}px)`,
  background: "rgba(42,42,52,0.88)",
  borderRight: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(10px)",
  zIndex: 10,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const quarterTriggerStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#C0C0C0",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s, color 0.15s",
};

const quarterDropdownStyle = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  right: 0,
  zIndex: 50,
  background: "#1E1E2E",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "12px 14px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
};

const secondPanelStyle = {
  position: "absolute",
  top: NAV_HEIGHT,
  left: 0,
  width: 340,
  height: `calc(100vh - ${NAV_HEIGHT}px)`,
  background: "rgba(42,42,52,0.88)",
  borderRight: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(10px)",
  zIndex: 11,
  display: "flex",
  flexDirection: "column",
  padding: "20px 16px",
  boxSizing: "border-box",
  overflow: "hidden",
};

const closeBtnStyle = {
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "#9E9E9E",
  borderRadius: 8,
  width: 32,
  height: 32,
  cursor: "pointer",
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const searchBoxStyle = {
  display: "flex",
  alignItems: "center",
  background: "rgba(45,45,45,0.97)",
  borderRadius: "12px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
  padding: "0 14px",
  height: 48,
  backdropFilter: "blur(6px)",
};

const btnStyle = (active) => ({
  height: 44,
  padding: "0 18px",
  background: active ? "#3B82F6" : "rgba(45,45,45,0.97)",
  color: active ? "#fff" : "#E8E8E8",
  border: "none",
  borderRadius: 12,
  boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  backdropFilter: "blur(6px)",
  transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, color 0.2s",
});

const popupStyle = (extra = {}) => ({
  position: "absolute",
  top: 52,
  background: "#363636",
  borderRadius: 14,
  boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
  padding: "16px",
  zIndex: 100,
  width: 260,
  ...extra,
});

const popupSectionLabel = {
  margin: "0 0 8px 0",
  fontSize: 14,
  fontWeight: 700,
  color: "#9E9E9E",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const chipGrid = { display: "flex", flexWrap: "wrap", gap: 6 };

const chipStyle = (active) => ({
  padding: "6px 12px",
  borderRadius: 20,
  border: active ? "2px solid #3B82F6" : "1.5px solid #4E4E4E",
  background: active ? "#1E3A5F" : "#424242",
  color: active ? "#93B8EE" : "#C8C8C8",
  fontSize: 15,
  fontWeight: active ? 600 : 400,
  cursor: "pointer",
});


const menuItemStyle = {
  display: "block",
  width: "100%",
  padding: "11px 12px",
  border: "none",
  background: "none",
  textAlign: "left",
  fontSize: 16,
  cursor: "pointer",
  borderRadius: 8,
  color: "#E8E8E8",
};

const badgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "#3B82F6",
  color: "#fff",
  borderRadius: 20,
  padding: "6px 12px",
  fontSize: 15,
  fontWeight: 600,
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
};

const badgeClose = {
  border: "none",
  background: "none",
  color: "#fff",
  cursor: "pointer",
  fontSize: 14,
  padding: 0,
  lineHeight: 1,
};

const inlineViewAllBtnStyle = {
  padding: "2px 8px",
  background: "rgba(59,130,246,0.12)",
  color: "#93B8EE",
  border: "1px solid rgba(59,130,246,0.25)",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  flexShrink: 0,
};

const statCardStyle = {
  flex: 1,
  background: "rgba(255,255,255,0.05)",
  borderRadius: 10,
  padding: "10px 12px",
  border: "1px solid rgba(255,255,255,0.07)",
};

/* ── 창업비용 계산기 스타일 ── */

const startupCalcBtnStyle = {
  height: 44,
  padding: "0 18px",
  background: "rgba(45,45,45,0.97)",
  color: "#E8E8E8",
  border: "none",
  borderRadius: 12,
  boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  backdropFilter: "blur(6px)",
  transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, color 0.2s",
};

const startupCalcOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  backdropFilter: "blur(2px)",
  zIndex: 200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const startupCalcPanelStyle = {
  background: "rgba(24,24,34,0.99)",
  borderRadius: 20,
  boxShadow: "0 20px 70px rgba(0,0,0,0.7)",
  border: "1px solid rgba(255,255,255,0.09)",
  width: 500,
  maxHeight: "85vh",
  overflowY: "auto",   // 패널 자체가 스크롤 — flex:1 자식이 패널을 maxHeight까지 늘리는 문제 방지
  padding: "22px 24px",
  boxSizing: "border-box",
};

const calcInputStyle = {
  width: 80,
  padding: "5px 10px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.07)",
  color: "#E8E8E8",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

/* ── AI 추천 스타일 ── */

const aiBtnStyle = {
  height: 44,
  padding: "0 18px",
  background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  boxShadow: "0 4px 15px rgba(59,130,246,0.35)",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  backdropFilter: "blur(6px)",
  transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, border-color 0.2s, color 0.2s",
  letterSpacing: "0.02em",
};

const aiSectionLabel = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 15,
  fontWeight: 700,
  color: "#C8C8C8",
  marginBottom: 10,
};

const aiRequiredBadge = {
  fontSize: 12,
  fontWeight: 700,
  color: "#fff",
  background: "#EF4444",
  borderRadius: 4,
  padding: "2px 6px",
};


const aiResultCardStyle = (isTop) => ({
  background: isTop ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)",
  borderRadius: 14,
  padding: "14px 16px",
  border: isTop ? "1.5px solid rgba(59,130,246,0.35)" : "1px solid rgba(255,255,255,0.07)",
});

const aiRankBadge = (rank) => ({
  fontSize: rank <= 3 ? 22 : 13,
  fontWeight: 700,
  color: "#9E9E9E",
  minWidth: 32,
  textAlign: "center",
});

const aiMiniStatStyle = {
  flex: 1,
  background: "rgba(255,255,255,0.05)",
  borderRadius: 8,
  padding: "7px 10px",
  border: "1px solid rgba(255,255,255,0.06)",
};

const aiModeCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "16px 18px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  cursor: "pointer",
  textAlign: "left",
  transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, border-color 0.2s, color 0.2s",
  width: "100%",
};

const AI_MODE_META = {
  // color: 카드 왼쪽 border + 아이콘 배경 틴트에 사용
  dong:            { icon: "📍", title: "업종 선택 → 행정동 추천",   desc: "창업할 업종을 선택하면 최적의 상권을 추천합니다", color: "#93C5FD", rgb: "147,197,253"  },
  industry:        { icon: "🏪", title: "행정동 선택 → 업종 추천",   desc: "관심 지역을 입력하면 유망 업종을 추천합니다",   color: "#3B82F6", rgb: "59,130,246"   },
  score:           { icon: "📊", title: "행정동 · 업종 적합도 점수", desc: "특정 지역과 업종 조합의 상세 점수를 분석합니다", color: "#38BDF8", rgb: "56,189,248"   },
  gu:              { icon: "🗺️", title: "구 · 업종 선택 → 상권 추천", desc: "구와 업종을 선택하면 행정동·길단위 상권을 추천합니다", color: "#A78BFA", rgb: "167,139,250" },
  compare_region:  { icon: "⚖️", title: "지역 비교",               desc: "업종을 선택하고 두 지역의 상권 지표를 비교합니다",  color: "#34D399", rgb: "52,211,153"   },
  compare_industry:{ icon: "📈", title: "업종 비교",               desc: "한 지역 안에서 두 업종의 주요 지표를 비교합니다",  color: "#F59E0B", rgb: "245,158,11"   },
};

const SEOUL_GU_LIST = [
  "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
  "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구",
  "성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구",
];

// 폴리곤 무게중심(centroid) 계산 — [[lng, lat], ...] 형식
function calcCentroid(ring) {
  let area = 0, cx = 0, cy = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  area /= 2;
  cx /= 6 * area;
  cy /= 6 * area;
  return [cx, cy]; // [lng, lat]
}

// MultiPolygon 중 가장 넓은 링의 centroid 반환
function getLargestRingCentroid(coordinates) {
  let best = null, bestArea = -Infinity;
  coordinates.forEach((rings) => {
    const ring = rings[0];
    let area = 0;
    for (let i = 0; i < ring.length; i++) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[(i + 1) % ring.length];
      area += x0 * y1 - x1 * y0;
    }
    const abs = Math.abs(area);
    if (abs > bestArea) { bestArea = abs; best = ring; }
  });
  return calcCentroid(best);
}


function fmtRevenue(won) {
  if (!won) return "0원";
  const eok = won / 100_000_000;
  if (eok >= 1) return `${eok.toFixed(1)}억원`;
  return `${Math.round(won / 10_000).toLocaleString()}만원`;
}

