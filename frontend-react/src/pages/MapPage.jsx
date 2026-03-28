import { useEffect, useRef, useState } from "react";
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
  "전자상거래업":           { "인테리어_만원per평": 20,  "설비_집기_만원": 200,  "초기재고_만원": 500,  "보증금_임대료배수": 6,  "관리비_공과금_만원per월": 10, "원가율_%": 40, "특이사항": "오프라인 매장 없거나 소규모" },
  "생활용품 소매": { "인테리어_만원per평": 40,  "설비_집기_만원": 400,  "초기재고_만원": 800,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 15, "원가율_%": 50, "특이사항": "" },
  "스포츠 강습":            { "인테리어_만원per평": 60,  "설비_집기_만원": 1500, "초기재고_만원": 100,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 20, "원가율_%": 20, "특이사항": "강사 인건비·운동기구 비중 높음" },
  "골프연습장":             { "인테리어_만원per평": 80,  "설비_집기_만원": 5000, "초기재고_만원": 100,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 50, "원가율_%": 15, "특이사항": "타석·시뮬레이터 등 설비 매우 큼" },
  "스포츠클럽":             { "인테리어_만원per평": 80,  "설비_집기_만원": 3000, "초기재고_만원": 100,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 40, "원가율_%": 20, "특이사항": "운동기구·샤워시설 비중 높음" },
  "일반학원":      { "인테리어_만원per평": 50,  "설비_집기_만원": 800,  "초기재고_만원": 100,  "보증금_임대료배수": 10, "관리비_공과금_만원per월": 20, "원가율_%": 15, "특이사항": "강사 인건비 비중 높음" },
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
  "소매": ["편의점", "슈퍼마켓", "미곡판매", "수산물판매", "육류판매", "청과상", "반찬가게", "일반의류", "신발", "가방", "섬유제품", "화장품", "네일숍", "피부관리실", "가전제품", "핸드폰", "컴퓨터및주변장치판매", "전자상거래업", "생활용품 소매"],
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
  const [aiMode, setAiMode] = useState(null);   // "dong" | "industry" | "score"
  const [aiIndustry, setAiIndustry] = useState(null);
  const [aiRegion, setAiRegion] = useState(null);
  const [aiDong, setAiDong] = useState("");
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
      fetch("/api/rental/regions/")
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
    // 구 모드 전환 시 뱃지 표시/숨김
    if (guBadgeOverlayRef.current)
      guBadgeOverlayRef.current.setMap(guMode ? map : null);
    if (dongBadgeOverlayRef.current)
      dongBadgeOverlayRef.current.setMap(guMode || level < DONG_BADGE_HIDE_LEVEL ? null : map);
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
          drawStreetPolygons(map, kakao, normalizeDongName(dongName));
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
          // 선택한 구 중심으로 이동
          const map = mapInstanceRef.current;
          if (map) {
            map.panTo(new kakao.maps.LatLng(guCLat, guCLng));
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

          kakao.maps.event.addListener(polygon, "mouseover", () => {
            if (selectedStreetRef.current?.상권코드 !== 상권_코드)
              polygon.setOptions(POLYGON_STREET_HOVER);
          });
          kakao.maps.event.addListener(polygon, "mouseout", () => {
            if (selectedStreetRef.current?.상권코드 !== 상권_코드)
              polygon.setOptions(POLYGON_STREET_DEFAULT);
          });
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

  // ── 구 선택 시 지도 위 매출 뱃지 오버레이 ──
  useEffect(() => {
    const { kakao } = window;
    if (!kakao || !mapInstanceRef.current) return;

    // 이전 오버레이 제거
    if (guBadgeOverlayRef.current) {
      guBadgeOverlayRef.current.setMap(null);
      guBadgeOverlayRef.current = null;
    }
    if (!selectedGu || !guData) return;

    const group = guPolygonGroupsRef.current.find((g) => g.guName === selectedGu);
    if (!group?.centroid) return;

    const { lat, lng } = group.centroid;
    const 변동률 = guData.매출변동률;
    const 변동색 = 변동률 == null ? "#9E9E9E" : 변동률 >= 0 ? "#34D399" : "#F87171";
    const 변동텍스트 = 변동률 == null ? "" : `${변동률 >= 0 ? "+" : ""}${변동률}%`;

    const eok = guData.총매출 / 100_000_000;
    const 매출텍스트 = eok >= 1 ? `${eok.toFixed(0)}억` : `${Math.round(guData.총매출 / 10_000).toLocaleString()}만`;

    const content = `
      <div style="
        background: rgba(18,18,18,0.62);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 12px;
        padding: 10px 14px;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        text-align: center;
        pointer-events: none;
        font-family: 'Pretendard', sans-serif;
        min-width: 90px;
        transform: translateX(-50%);
      ">
        <div style="font-size: 13px; font-weight: 700; color: #E8E8E8; margin-bottom: 3px;">${selectedGu}</div>
        <div style="font-size: 17px; font-weight: 800; color: #fff; line-height: 1.2;">${매출텍스트}</div>
        ${변동텍스트 ? `<div style="font-size: 11px; color: #9E9E9E; margin-top: 4px; margin-bottom: 1px;">전년 동분기 대비</div><div style="font-size: 14px; font-weight: 700; color: ${변동색};">${변동텍스트}</div>` : ""}
      </div>`;

    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(lat, lng),
      content,
      zIndex: 5,
    });
    overlay.setMap(mapInstanceRef.current);
    guBadgeOverlayRef.current = overlay;
  }, [selectedGu, guData]);

  // ── 행정동 선택 시 지도 위 매출 뱃지 오버레이 ──
  useEffect(() => {
    const { kakao } = window;
    if (!kakao || !mapInstanceRef.current) return;

    if (dongBadgeOverlayRef.current) {
      dongBadgeOverlayRef.current.setMap(null);
      dongBadgeOverlayRef.current = null;
    }
    if (!selectedDong || !dongData) return;

    const group = polygonGroupsRef.current.find(
      (g) => g.dongName === selectedDong.dongName && g.guName === selectedDong.guName
    );
    if (!group?.centroid) return;

    const { lat, lng } = group.centroid;
    const 변동률 = dongData.매출변동률;
    const 변동색 = 변동률 == null ? "#9E9E9E" : 변동률 >= 0 ? "#34D399" : "#F87171";
    const 변동텍스트 = 변동률 == null ? "" : `${변동률 >= 0 ? "+" : ""}${변동률}%`;

    const eok = dongData.총매출 / 100_000_000;
    const 매출텍스트 = eok >= 1 ? `${eok.toFixed(0)}억` : `${Math.round(dongData.총매출 / 10_000).toLocaleString()}만`;

    const content = `
      <div style="
        background: rgba(18,18,18,0.62);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 12px;
        padding: 10px 14px;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        text-align: center;
        pointer-events: none;
        font-family: 'Pretendard', sans-serif;
        min-width: 90px;
        transform: translateX(-50%);
      ">
        <div style="font-size: 13px; font-weight: 700; color: #E8E8E8; margin-bottom: 3px;">${selectedDong.dongName}</div>
        <div style="font-size: 17px; font-weight: 800; color: #fff; line-height: 1.2;">${매출텍스트}</div>
        ${변동텍스트 ? `<div style="font-size: 11px; color: #9E9E9E; margin-top: 4px; margin-bottom: 1px;">전년 동분기 대비</div><div style="font-size: 14px; font-weight: 700; color: ${변동색};">${변동텍스트}</div>` : ""}
      </div>`;

    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(lat, lng),
      content,
      zIndex: 5,
    });
    overlay.setMap(mapInstanceRef.current);
    dongBadgeOverlayRef.current = overlay;
  }, [selectedDong, dongData]);


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

  // ── AI 추천 요청 ──
  function handleAiRecommend() {
    if (aiMode === "dong" && !aiIndustry) return;
    if (aiMode === "industry" && !aiDong.trim()) return;
    if (aiMode === "score" && (!aiDong.trim() || !aiIndustry)) return;
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
  }

  // ── 줌 >= 7 시 전체 구 매출 순위 fetch ──
  useEffect(() => {
    if (zoomLevel < GU_MODE_LEVEL) { setGuAllRanking([]); return; }
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
  }, [zoomLevel]);

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
      // 구 모드 유지, 구 선택
      const doPan = () => map.panTo(new window.kakao.maps.LatLng(centroid.lat, centroid.lng));
      if (map.getLevel() < GU_MODE_LEVEL) smoothZoom(map, 8, doPan);
      else doPan();
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


      {/* ── 사이드바 접기 탭 ──
          위치는 원래대로 (top: 50%, left: 320).
          사이드바가 열려 있고 + 선택된 항목이 있을 때만 표시
          → 검색만 활성화된 빈 사이드바 상태에선 버튼 숨김 */}
      <button
        onClick={() => { setSidebarCollapsed(true); setRankModalOpen(false); setGuRankModalOpen(false); setDongStatsOpen(false); }}
        style={{
          position: "absolute",
          top: "50%",
          left: (rankModalOpen || guRankModalOpen || dongStatsOpen) ? 660 : 320,
          transform: sidebarCollapsed ? "translate(-320px, -50%)" : "translateY(-50%)",
          transition: "transform 0.22s ease-out, opacity 0.15s, left 0.22s ease-out",
          // 사이드바가 열려 있어도 선택된 항목이 없으면(검색만 활성화) 버튼 숨김
          opacity: (!sidebarCollapsed && (selectedDong || selectedGu || selectedIndustry) && !searchExpanded) ? 1 : 0,
          pointerEvents: (!sidebarCollapsed && (selectedDong || selectedGu || selectedIndustry) && !searchExpanded) ? "auto" : "none",
          zIndex: 15,
          width: 24,
          height: 56,
          background: "rgba(42,42,52,0.92)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderLeft: "none",
          borderRadius: "0 10px 10px 0",
          color: "#9E9E9E",
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(10px)",
        }}
        title="사이드바 접기"
      >«</button>


      {/* ── 왼쪽 사이드바 ── */}
      <div data-sidebar style={{
        ...leftSidebarStyle,
        // 선택된 항목이 있을 때만 슬라이드 애니메이션 사용.
        // 검색만 활성화된 경우(선택 없음)는 애니메이션 없이 즉시 표시/숨김.
        transform: (sidebarCollapsed && (selectedDong || selectedGu))
          ? "translateX(-320px)" : "translateX(0)",
        opacity: (sidebarCollapsed && !selectedDong && !selectedGu) ? 0 : 1,
        transition: (selectedDong || selectedGu)
          ? "transform 0.22s ease-out, opacity 0.15s"
          : "none",
        pointerEvents: drawingMode ? "none" : undefined,
        ...((!selectedDong && !selectedGu) && {
          background: "transparent",
          borderRight: "none",
          backdropFilter: "none",
          boxShadow: "none",
          overflow: sidebarCollapsed ? "hidden" : "visible",
        }),
      }}>

        {/* ── 스크롤 콘텐츠 영역 (선택된 항목 있을 때만 표시) ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", display: (selectedDong || selectedGu) ? "block" : "none" }}>

          {/* 행정동 상세 */}
          {selectedDong && (
            <div className="anim-slide-in-left">
              <div style={{ marginBottom: 16, paddingTop: 24 }}>
                <div style={{ fontSize: 15, color: "#9E9E9E", marginBottom: 2 }}>{selectedDong.guName}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#E8E8E8" }}>{selectedDong.dongName}</div>
              </div>


              {availableQuarters.length > 0 && (() => {
                const years = [...new Set(availableQuarters.map((q) => Math.floor(q / 10)))];
                const activeQ = selectedQuarter || availableQuarters[0];
                const activeYear = Math.floor(activeQ / 10);
                const quartersOfYear = availableQuarters.filter((q) => Math.floor(q / 10) === activeYear);
                const label = `${activeYear}년 ${activeQ % 10}분기`;
                return (
                  <div data-popup style={{ position: "relative", marginBottom: 12 }}>
                    <button
                      data-popup
                      onClick={() => setQuarterPopupOpen((v) => !v)}
                      style={quarterTriggerStyle}
                    >
                      📅 {label} <span style={{ fontSize: 10, marginLeft: 2 }}>▾</span>
                    </button>
                    {quarterPopupOpen && (
                      <div data-popup className="anim-slide-down" style={quarterDropdownStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 8 }}>
                          {years.map((y) => (
                            <button key={y} data-popup onClick={() => { const first = availableQuarters.find((q) => Math.floor(q / 10) === y); setSelectedQuarter(first === availableQuarters[0] ? null : first); }} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: activeYear === y ? "#3B82F6" : "rgba(255,255,255,0.07)", color: activeYear === y ? "#fff" : "#9E9E9E", textAlign: "left" }}>{y}</button>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {quartersOfYear.map((q) => {
                            const isLatest = q === availableQuarters[0];
                            const isActive = selectedQuarter === q || (!selectedQuarter && isLatest);
                            return (<button key={q} data-popup onClick={() => { setSelectedQuarter(isLatest ? null : q); setQuarterPopupOpen(false); }} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", border: isActive ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.1)", background: isActive ? "rgba(59,130,246,0.2)" : "transparent", color: isActive ? "#93B8EE" : "#9E9E9E" }}>{q % 10}분기</button>);
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ borderTop: "1px solid #4A4A4A", paddingTop: 14 }}>
                {dongLoading && <p style={{ color: "#9E9E9E", fontSize: 16, textAlign: "center", padding: "24px 0" }}>불러오는 중...</p>}
                {!dongLoading && !dongData && <p style={{ color: "#9E9E9E", fontSize: 16, textAlign: "center", padding: "24px 0" }}>데이터가 없습니다</p>}
                {!dongLoading && dongData && (() => {
                  const industries = dongData.industries || [];
                  const top6Rev   = industries.slice(0, 5);
                  const top6Store = [...industries].sort((a, b) => b["점포수"] - a["점포수"]).slice(0, 5);
                  const maxRevenue = Math.max(...top6Rev.map((d) => d["당월매출합"]), 1);
                  const maxStores  = Math.max(...top6Store.map((d) => d["점포수"]), 1);
                  return (
                    <>
                      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                        <div style={statCardStyle}>
                          <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 4 }}>총 매출</div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: "#E8E8E8" }}>{fmtRevenue(dongData.총매출)}</div>
                        </div>
                        <div style={statCardStyle}>
                          <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 4 }}>전체 순위</div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: "#93B8EE" }}>
                            {dongData.순위}위<span style={{ fontSize: 13, color: "#9E9E9E", fontWeight: 400, marginLeft: 4 }}>/ {dongData.전체동수}동</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                        <div style={{ fontSize: 14, color: "#9E9E9E" }}>업종별 매출 TOP 5</div>
                        <button onClick={() => { if (rankModalOpen && rankType === "revenue") { setRankModalOpen(false); } else { setRankType("revenue"); setRankModalOpen(true); setDongStatsOpen(false); } }} style={inlineViewAllBtnStyle}>{rankModalOpen && rankType === "revenue" ? "접기 ↑" : "전체 보기 →"}</button>
                      </div>
                      <div>
                        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 75 }}>
                          {top6Rev.map((item) => {
                            const pct = (item["당월매출합"] / maxRevenue) * 100;
                            return (
                              <div key={item["통합카테고리"]} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative" }}
                                onMouseEnter={(e) => { e.currentTarget.firstChild.style.display = "block"; }}
                                onMouseLeave={(e) => { e.currentTarget.firstChild.style.display = "none"; }}
                              >
                                <div style={{ display: "none", position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", background: "#1E1E1E", color: "#E8E8E8", padding: "5px 10px", borderRadius: 6, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", border: "1px solid rgba(255,255,255,0.15)", zIndex: 100, pointerEvents: "none" }}>{fmtRevenue(item["당월매출합"])}</div>
                                <div style={{ width: "100%", height: `${pct}%`, background: "linear-gradient(180deg, #60A5FA, #3B82F6)", borderRadius: "3px 3px 0 0", minHeight: 2 }} />
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ height: 1, background: "rgba(255,255,255,0.2)", marginBottom: 4 }} />
                        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                          {top6Rev.map((item) => (
                            <div key={item["통합카테고리"]} style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 11, color: "#C8C8C8", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textAlign: "center", lineHeight: 1.3, wordBreak: "keep-all" }}>{item["통합카테고리"]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                        <div style={{ fontSize: 14, color: "#9E9E9E" }}>업종별 상가 수 TOP 5</div>
                        <button onClick={() => { if (rankModalOpen && rankType === "stores") { setRankModalOpen(false); } else { setRankType("stores"); setRankModalOpen(true); setDongStatsOpen(false); } }} style={inlineViewAllBtnStyle}>{rankModalOpen && rankType === "stores" ? "접기 ↑" : "전체 보기 →"}</button>
                      </div>
                      <div>
                        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 75 }}>
                          {top6Store.map((item) => {
                            const pct = (item["점포수"] / maxStores) * 100;
                            return (
                              <div key={item["통합카테고리"]} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative" }}
                                onMouseEnter={(e) => { e.currentTarget.firstChild.style.display = "block"; }}
                                onMouseLeave={(e) => { e.currentTarget.firstChild.style.display = "none"; }}
                              >
                                <div style={{ display: "none", position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", background: "#1E1E1E", color: "#E8E8E8", padding: "5px 10px", borderRadius: 6, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", border: "1px solid rgba(255,255,255,0.15)", zIndex: 100, pointerEvents: "none" }}>{item["점포수"]}개</div>
                                <div style={{ width: "100%", height: `${pct}%`, background: "linear-gradient(180deg, #34D399, #10B981)", borderRadius: "3px 3px 0 0", minHeight: 2 }} />
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ height: 1, background: "rgba(255,255,255,0.2)", marginBottom: 4 }} />
                        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                          {top6Store.map((item) => (
                            <div key={item["통합카테고리"]} style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 11, color: "#C8C8C8", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textAlign: "center", lineHeight: 1.3, wordBreak: "keep-all" }}>{item["통합카테고리"]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginTop: 8 }}></div>
                      <button
                        onClick={() => openAiDongRecommend(selectedDong.dongName, selectedDong.guName)}
                        style={{ width: "100%", marginTop: 8, padding: "9px 0", background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))", color: "#93B8EE", border: "1px solid rgba(139,92,246,0.4)", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em" }}
                      >✨ 이 지역에서 AI 추천 받기</button>

                      {/* 길단위 상권 추천 패널 */}
                      {streetCount > 0 && (
                        <div style={{ marginTop: 14, borderTop: "1px solid #3A3A3A", paddingTop: 12 }}>
                          <div style={{ fontSize: 13, color: "#F59E0B", fontWeight: 600, marginBottom: 8 }}>
                            🏪 길단위 상권 {streetCount}개 표시됨<br/>
                            <span style={{ fontWeight: 400, color: "#9E9E9E" }}>지도 위 주황색 구역을 클릭해 업종 추천을 받아보세요</span>
                          </div>
                          {selectedStreet && (
                            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "10px 12px" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#FCD34D", marginBottom: 6 }}>
                                📍 {selectedStreet.상권명}
                              </div>
                              {streetLoading && <div style={{ color: "#9E9E9E", fontSize: 13 }}>분석 중...</div>}
                              {!streetLoading && streetResults?.results && (
                                <div>
                                  <div style={{ fontSize: 12, color: "#9E9E9E", marginBottom: 6 }}>유망 업종 Top 5 · 업종 클릭 시 상권 내 입지 추천</div>
                                  {streetResults.results.map((r, i) => (
                                    <div key={r.category} style={{ borderBottom: i < streetResults.results.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                          <span style={{ fontSize: 12, color: "#6B7280", minWidth: 16 }}>{r.rank}</span>
                                          <span style={{ fontSize: 13, color: "#E8E8E8" }}>{r.category}</span>
                                          <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: r.등급 === "A" ? "rgba(34,197,94,0.2)" : r.등급 === "B" ? "rgba(59,130,246,0.2)" : "rgba(107,114,128,0.2)", color: r.등급 === "A" ? "#4ADE80" : r.등급 === "B" ? "#93B8EE" : "#9E9E9E" }}>{r.등급}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                          <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>{r.성장확률}%</span>
                                          <button
                                            onClick={() => {
                                              if (streetSpotCategory === r.category && streetSpotResults) {
                                                clearStreetSpotMarkers();
                                                setStreetSpotResults(null);
                                                setStreetSpotCategory(null);
                                              } else {
                                                handleStreetSpotRecommend(selectedStreet.상권코드, r.category);
                                              }
                                            }}
                                            style={{ fontSize: 11, padding: "2px 7px", borderRadius: 5, border: "1px solid rgba(245,158,11,0.4)", background: streetSpotCategory === r.category ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.08)", color: "#F59E0B", cursor: "pointer" }}
                                          >📍 입지</button>
                                        </div>
                                      </div>

                                      {/* 입지 추천 결과 인라인 */}
                                      {streetSpotCategory === r.category && (
                                        <div style={{ marginBottom: 8 }}>
                                          {streetSpotLoading && (
                                            <div style={{ fontSize: 12, color: "#9E9E9E", padding: "6px 0" }}>입지 분석 중...</div>
                                          )}
                                          {!streetSpotLoading && streetSpotResults && (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                              {streetSpotResults.map((spot) => {
                                                const colors = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6"];
                                                const color = colors[spot.rank - 1] || "#6B7280";
                                                return (
                                                  <div key={spot.rank} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px", border: `1px solid ${color}30` }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <div style={{ background: color, color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{spot.rank}</div>
                                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#E8E8E8" }}>추천 위치 {spot.rank}순위</span>
                                                      </div>
                                                      <span style={{ fontSize: 18, fontWeight: 800, color }}>{spot.score}</span>
                                                    </div>
                                                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                                      <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "4px 6px", textAlign: "center" }}>
                                                        <div style={{ fontSize: 10, color: "#9E9E9E" }}>생존율</div>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: spot.생존율 >= 60 ? "#34D399" : spot.생존율 >= 40 ? "#FBBF24" : "#F87171" }}>{spot.생존율}%</div>
                                                      </div>
                                                      <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "4px 6px", textAlign: "center" }}>
                                                        <div style={{ fontSize: 10, color: "#9E9E9E" }}>경쟁</div>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: spot.경쟁밀도 <= 2 ? "#34D399" : spot.경쟁밀도 <= 5 ? "#FBBF24" : "#F87171" }}>{spot.경쟁밀도}개</div>
                                                      </div>
                                                      <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "4px 6px", textAlign: "center" }}>
                                                        <div style={{ fontSize: 10, color: "#9E9E9E" }}>시너지</div>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: "#E8E8E8" }}>{spot.보완밀도}개</div>
                                                      </div>
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                                      {spot.reasons.map((reason, ri) => (
                                                        <div key={ri} style={{ fontSize: 11, color: "#C8C8C8", display: "flex", gap: 4 }}>
                                                          <span style={{ color, flexShrink: 0 }}>•</span>{reason}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 구 상세 */}
          {selectedGu && (
            <div className="anim-slide-in-left">
              <div style={{ marginBottom: 16, paddingTop: 24 }}>
                <div style={{ fontSize: 15, color: "#9E9E9E", marginBottom: 2 }}>서울특별시</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#E8E8E8" }}>{selectedGu}</div>
              </div>

              {guAvailableQuarters.length > 0 && (() => {
                const years = [...new Set(guAvailableQuarters.map((q) => Math.floor(q / 10)))];
                const activeQ = guSelectedQuarter || guAvailableQuarters[0];
                const activeYear = Math.floor(activeQ / 10);
                const quartersOfYear = guAvailableQuarters.filter((q) => Math.floor(q / 10) === activeYear);
                const label = `${activeYear}년 ${activeQ % 10}분기`;
                return (
                  <div data-popup style={{ position: "relative", marginBottom: 12 }}>
                    <button
                      data-popup
                      onClick={() => setGuQuarterPopupOpen((v) => !v)}
                      style={quarterTriggerStyle}
                    >
                      📅 {label} <span style={{ fontSize: 10, marginLeft: 2 }}>▾</span>
                    </button>
                    {guQuarterPopupOpen && (
                      <div data-popup className="anim-slide-down" style={quarterDropdownStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 8 }}>
                          {years.map((y) => (
                            <button key={y} data-popup onClick={() => { const first = guAvailableQuarters.find((q) => Math.floor(q / 10) === y); setGuSelectedQuarter(first === guAvailableQuarters[0] ? null : first); }} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: activeYear === y ? "#3B82F6" : "rgba(255,255,255,0.07)", color: activeYear === y ? "#fff" : "#9E9E9E", textAlign: "left" }}>{y}</button>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {quartersOfYear.map((q) => {
                            const isLatest = q === guAvailableQuarters[0];
                            const isActive = guSelectedQuarter === q || (!guSelectedQuarter && isLatest);
                            return (<button key={q} data-popup onClick={() => { setGuSelectedQuarter(isLatest ? null : q); setGuQuarterPopupOpen(false); }} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", border: isActive ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.1)", background: isActive ? "rgba(59,130,246,0.2)" : "transparent", color: isActive ? "#93B8EE" : "#9E9E9E" }}>{q % 10}분기</button>);
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ borderTop: "1px solid #4A4A4A", paddingTop: 14 }}>
                {guLoading && <p style={{ color: "#9E9E9E", fontSize: 16, textAlign: "center", padding: "24px 0" }}>불러오는 중...</p>}
                {!guLoading && !guData && <p style={{ color: "#9E9E9E", fontSize: 16, textAlign: "center", padding: "24px 0" }}>데이터가 없습니다</p>}
                {!guLoading && guData && (() => {
                  const industries = guData.industries || [];
                  const top6Rev   = industries.slice(0, 5);
                  const top6Store = [...industries].sort((a, b) => b["점포수"] - a["점포수"]).slice(0, 5);
                  const maxRevenue = Math.max(...top6Rev.map((d) => d["당월매출합"]), 1);
                  const maxStores  = Math.max(...top6Store.map((d) => d["점포수"]), 1);
                  return (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                        <div style={{ fontSize: 14, color: "#9E9E9E" }}>업종별 매출 TOP 5</div>
                        <button onClick={() => { if (guRankModalOpen && guRankType === "revenue") { setGuRankModalOpen(false); } else { setGuRankType("revenue"); setGuRankModalOpen(true); } }} style={inlineViewAllBtnStyle}>{guRankModalOpen && guRankType === "revenue" ? "접기 ↑" : "전체 보기 →"}</button>
                      </div>
                      <div>
                        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 75 }}>
                          {top6Rev.map((item) => {
                            const pct = (item["당월매출합"] / maxRevenue) * 100;
                            return (
                              <div key={item["통합카테고리"]} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative" }}
                                onMouseEnter={(e) => { e.currentTarget.firstChild.style.display = "block"; }}
                                onMouseLeave={(e) => { e.currentTarget.firstChild.style.display = "none"; }}
                              >
                                <div style={{ display: "none", position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", background: "#1E1E1E", color: "#E8E8E8", padding: "5px 10px", borderRadius: 6, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", border: "1px solid rgba(255,255,255,0.15)", zIndex: 100, pointerEvents: "none" }}>{fmtRevenue(item["당월매출합"])}</div>
                                <div style={{ width: "100%", height: `${pct}%`, background: "linear-gradient(180deg, #60A5FA, #3B82F6)", borderRadius: "3px 3px 0 0", minHeight: 2 }} />
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ height: 1, background: "rgba(255,255,255,0.2)", marginBottom: 4 }} />
                        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                          {top6Rev.map((item) => (
                            <div key={item["통합카테고리"]} style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 11, color: "#C8C8C8", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textAlign: "center", lineHeight: 1.3, wordBreak: "keep-all" }}>{item["통합카테고리"]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                        <div style={{ fontSize: 14, color: "#9E9E9E" }}>업종별 상가 수 TOP 5</div>
                        <button onClick={() => { if (guRankModalOpen && guRankType === "stores") { setGuRankModalOpen(false); } else { setGuRankType("stores"); setGuRankModalOpen(true); } }} style={inlineViewAllBtnStyle}>{guRankModalOpen && guRankType === "stores" ? "접기 ↑" : "전체 보기 →"}</button>
                      </div>
                      <div>
                        <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 75 }}>
                          {top6Store.map((item) => {
                            const pct = (item["점포수"] / maxStores) * 100;
                            return (
                              <div key={item["통합카테고리"]} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative" }}
                                onMouseEnter={(e) => { e.currentTarget.firstChild.style.display = "block"; }}
                                onMouseLeave={(e) => { e.currentTarget.firstChild.style.display = "none"; }}
                              >
                                <div style={{ display: "none", position: "absolute", bottom: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", background: "#1E1E1E", color: "#E8E8E8", padding: "5px 10px", borderRadius: 6, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", border: "1px solid rgba(255,255,255,0.15)", zIndex: 100, pointerEvents: "none" }}>{item["점포수"]}개</div>
                                <div style={{ width: "100%", height: `${pct}%`, background: "linear-gradient(180deg, #34D399, #10B981)", borderRadius: "3px 3px 0 0", minHeight: 2 }} />
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ height: 1, background: "rgba(255,255,255,0.2)", marginBottom: 4 }} />
                        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                          {top6Store.map((item) => (
                            <div key={item["통합카테고리"]} style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 11, color: "#C8C8C8", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textAlign: "center", lineHeight: 1.3, wordBreak: "keep-all" }}>{item["통합카테고리"]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

            </div>
          )}

          {/* 구별 매출 순위 - 선택 없을 때만 표시 */}
          {zoomLevel >= GU_MODE_LEVEL && !searchExpanded && guAllRanking.length > 0 && !selectedGu && !selectedDong && (
            <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#9E9E9E", marginBottom: 8 }}>구별 매출 순위</div>
              {guAllRanking.slice(0, 10).map((item, i) => (
                <div
                  key={item.gu}
                  onClick={() => {
                    const group = guPolygonGroupsRef.current.find((g) => g.guName === item.gu);
                    if (group) handleSelectResult({ type: "gu", guName: item.gu, dongName: null, centroid: group.centroid });
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 4px", cursor: "pointer", borderBottom: i < 9 ? "1px solid rgba(255,255,255,0.05)" : "none", borderRadius: 6, transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59,130,246,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: i < 3 ? ["#FBBF24","#9CA3AF","#CD7C54"][i] : "#6B7280", width: 18, textAlign: "center" }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13, color: "#E8E8E8", fontWeight: 500 }}>{item.gu}</span>
                  <span style={{ fontSize: 12, color: "#9E9E9E" }}>{(item.총매출 / 100_000_000).toFixed(0)}억</span>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* 하단 고정: 버튼 영역 (선택된 항목 있을 때만 표시) */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, display: (selectedDong || selectedGu) && !searchExpanded ? "flex" : "none", flexDirection: "column", gap: 8 }}>
          {selectedDong && !selectedGu && (
            <button
              style={{ width: "100%", height: 42, background: dongStatsOpen ? "rgba(59,130,246,0.5)" : "rgba(59,130,246,0.35)", color: "#fff", border: "1.5px solid rgba(59,130,246,0.7)", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}
              onClick={() => { setDongStatsOpen((v) => !v); setRankModalOpen(false); }}
            >상세 통계</button>
          )}
          {selectedGu && (
            <button
              style={{ width: "100%", height: 42, background: "rgba(59,130,246,0.35)", color: "#fff", border: "1.5px solid rgba(59,130,246,0.7)", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, border-color 0.2s, color 0.2s" }}
              onClick={() => {
                const map = mapInstanceRef.current;
                if (!map) return;
                const group = guPolygonGroupsRef.current.find((g) => g.guName === selectedGu);
                if (group) {
                  smoothZoom(map, 6, () => {
                    map.panTo(new window.kakao.maps.LatLng(group.centroid.lat, group.centroid.lng));
                  });
                }
              }}
            >행정동 보기</button>
          )}
          <button
            style={{ width: "100%", height: 42, background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s" }}
            onClick={() => {
              const map = mapInstanceRef.current;
              if (!map) return;
              setDongStatsOpen(false);
              // 현재 선택된 행정동의 구를 selectedGu로 설정 → 행정동 보기 버튼 표시
              if (selectedDong) setSelectedGu(selectedDong.guName);
              const panSeoul = () => map.panTo(new window.kakao.maps.LatLng(37.5665, 126.9780));
              if (map.getLevel() < GU_MODE_LEVEL) smoothZoom(map, 8, panSeoul);
              else panSeoul();
            }}
          >구 보기</button>
        </div>
      </div>

      {/* ── 구 매출 순위 패널 (사이드바 비활성 시 플로팅) ── */}
      {zoomLevel >= GU_MODE_LEVEL && !searchExpanded && sidebarCollapsed && guAllRanking.length > 0 && (
        <div style={{
          position: "absolute", top: 16, left: 24,
          width: 280,
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
          background: "rgba(18,18,22,0.92)", backdropFilter: "blur(12px)",
          borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          zIndex: 200,
        }}>
          <div style={{ padding: "10px 14px 8px", fontSize: 13, fontWeight: 700, color: "#9E9E9E", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            구별 매출 순위
          </div>
          {guAllRanking.slice(0, 10).map((item, i) => (
            <div
              key={item.gu}
              onClick={() => {
                const group = guPolygonGroupsRef.current.find((g) => g.guName === item.gu);
                if (group) handleSelectResult({ type: "gu", guName: item.gu, dongName: null, centroid: group.centroid });
              }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", cursor: "pointer", borderBottom: i < 9 ? "1px solid rgba(255,255,255,0.05)" : "none", transition: "background 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(59,130,246,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: i < 3 ? ["#FBBF24","#9CA3AF","#CD7C54"][i] : "#6B7280", width: 18, textAlign: "center" }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 13, color: "#E8E8E8", fontWeight: 500 }}>{item.gu}</span>
              <span style={{ fontSize: 12, color: "#9E9E9E" }}>{(item.총매출 / 100_000_000).toFixed(0)}억</span>
            </div>
          ))}
        </div>
      )}

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
        <div className="anim-slide-up" style={{ ...tooltipStyle, left: sidebarCollapsed ? 16 : 340 }}>
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
            style={{ ...secondPanelStyle, transform: sidebarCollapsed ? "translateX(-320px)" : "translateX(0)", transition: "transform 0.22s ease-out" }}
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
            style={{ ...secondPanelStyle, transform: sidebarCollapsed ? "translateX(-320px)" : "translateX(0)", transition: "transform 0.22s ease-out" }}
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
            style={{ ...secondPanelStyle, transform: sidebarCollapsed ? "translateX(-320px)" : "translateX(0)", transition: "transform 0.22s ease-out", overflowY: "auto" }}
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

                  {/* 모드별 폼 — dong/score 공통 업종 선택 UI */}
                  {(aiMode === "dong" || aiMode === "score") && (
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

                  {(() => {
                    const disabled =
                      (aiMode === "dong" && !aiIndustry) ||
                      (aiMode === "industry" && !aiDong.trim()) ||
                      (aiMode === "score" && (!aiDong.trim() || !aiIndustry));
                    return (
                      <button
                        onClick={handleAiRecommend}
                        disabled={disabled}
                        style={{
                          width: "100%", padding: "13px 0",
                          background: disabled ? "#3A3A3A" : "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                          color: disabled ? "#666" : "#fff", border: "none", borderRadius: 12,
                          fontSize: 17, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
                          transition: "all 0.2s", letterSpacing: "0.02em",
                        }}
                      >
                        ✨ 분석 시작
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
                    </span>
                    {aiMode !== "dong" && (
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
      {/* AI 패널(380px)이 열리면 버튼들을 왼쪽으로 밀어서 가려지지 않게 함 */}
      <div style={{ position: "absolute", top: 20, right: aiModalOpen ? 400 : 20, display: "flex", gap: 10, zIndex: 10, transition: "right 0.22s ease-out" }}>

        {/* 상권 직접 그리기 버튼 */}
        <button
          onClick={() => {
            if (drawingMode) {
              drawingModeRef.current = false;
              setDrawingMode(false);
              clearCustomDrawing();
            } else {
              startDrawing();
            }
          }}
          style={{
            height: 40, padding: "0 16px", borderRadius: 10, border: "none",
            background: drawingMode ? "#F59E0B" : "rgba(30,30,34,0.85)",
            color: drawingMode ? "#000" : "#E8E8E8",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {drawingMode ? "✏️ 그리기 중... (취소)" : "✏️ 상권 그리기"}
        </button>

        {/* 창업 비용 계산기 버튼 */}
        <button onClick={() => setStartupCalcOpen((v) => !v)} disabled={drawingMode} style={{ ...startupCalcBtnStyle, opacity: drawingMode ? 0.3 : 1, pointerEvents: drawingMode ? "none" : "auto" }}>
          💰 창업비용 계산기
        </button>

        {/* AI 추천 버튼 */}
        <button onClick={openAiModal} disabled={drawingMode} style={{ ...aiBtnStyle, opacity: drawingMode ? 0.3 : 1, pointerEvents: drawingMode ? "none" : "auto" }}>
          ✨ AI 추천
        </button>

        {/* 메뉴 버튼 */}
        <div data-popup style={{ position: "relative", opacity: drawingMode ? 0.3 : 1, pointerEvents: drawingMode ? "none" : "auto" }}>
          <button onClick={() => { setMenuOpen((v) => !v); setSearchExpanded(false); }} style={btnStyle(menuOpen)}>
            ☰ 메뉴
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
  "전자상거래업":           "🛍️",
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
  "전자상거래업":           "#50BEDD",
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

const leftSidebarStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: 320,
  height: "100vh",
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
  top: 0,
  left: 320,
  width: 340,
  height: "100vh",
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
  // 다크 배경에서 잘 보이는 밝은 블루 계열 3색 — 스카이/블루/시안으로 구분
  dong:     { icon: "📍", title: "업종 선택 → 행정동 추천",   desc: "창업할 업종을 선택하면 최적의 상권을 추천합니다", color: "#93C5FD", rgb: "147,197,253"  },
  industry: { icon: "🏪", title: "행정동 선택 → 업종 추천",   desc: "관심 지역을 입력하면 유망 업종을 추천합니다",   color: "#3B82F6", rgb: "59,130,246"   },
  score:    { icon: "📊", title: "행정동 · 업종 적합도 점수", desc: "특정 지역과 업종 조합의 상세 점수를 분석합니다", color: "#38BDF8", rgb: "56,189,248"   },
};

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

