import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Utensils, Coffee, Beer, ShoppingBag, Pill, GraduationCap,
  Scissors, Car, Music, Monitor, Dumbbell, Fish, Home,
  Building2, Shirt, Eye, Stethoscope, Leaf, ShoppingCart,
  Zap, Wrench, ChefHat, Croissant, Cookie, Store, Smartphone,
  ArrowDown, ArrowUp, Drumstick, Handbag, CircleDot, Flag,
  Palette, Paintbrush, SportShoe, ChevronDown,
  Signature, Calculator, MapPinned, Bot,
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

const CALC_CAT_ICON = {
  "한식": Utensils, "중식": Utensils, "일식": Fish, "양식/기타외식": ChefHat,
  "카페": Coffee, "주점": Beer, "치킨전문점": Drumstick, "분식/간식": Cookie,
  "베이커리/디저트": Croissant, "편의점": Store, "슈퍼마켓": ShoppingCart,
  "생활용품 소매": ShoppingBag, "화장품": Palette, "일반의류": Shirt,
  "신발": SportShoe, "안경": Eye, "가방": Handbag,
  "일반의원": Stethoscope, "치과의원": Stethoscope, "한의원": Leaf,
  "의약품": Pill, "의료기기": Stethoscope,
  "일반교습학원": GraduationCap, "예술학원": Music, "외국어학원": GraduationCap,
  "미용실": Scissors, "네일숍": Paintbrush, "피부관리실": Leaf,
  "자동차수리/미용": Car, "세탁소": Shirt, "노래방": Music, "PC방": Monitor,
  "당구장": CircleDot, "골프연습장": Flag, "스포츠클럽": Dumbbell, "스포츠 강습": Dumbbell,
  "수산물판매": Fish, "반찬가게": Utensils, "육류판매": Utensils, "청과상": Leaf,
  "컴퓨터및주변장치판매": Monitor, "가전제품": Zap, "가전제품수리": Wrench,
  "핸드폰": Smartphone, "숙박": Home, "인테리어": Wrench,
  "기타 B2B서비스": Building2, "미곡판매": ShoppingBag, "섬유제품": Shirt,
  "애완동물": Leaf, "패스트푸드": Utensils,
};
const CALC_CAT_COLOR = {
  // Utensils → 스틸 은색
  "한식": "#94A3B8", "중식": "#94A3B8", "일식": "#94A3B8", "양식/기타외식": "#94A3B8",
  "치킨전문점": "#F59E0B", "반찬가게": "#94A3B8",
  "육류판매": "#94A3B8", "미곡판매": "#94A3B8", "패스트푸드": "#94A3B8",
  // Fish → 바다 파랑
  "수산물판매": "#38BDF8",
  // Coffee → 진한 커피 브라운
  "카페": "#92400E",
  // Beer → 호박색
  "주점": "#B45309",
  // Croissant → 황금색
  "베이커리/디저트": "#F59E0B",
  // Cookie → 황토 브라운 / 청과상 → 초록
  "청과상": "#65A30D", "분식/간식": "#D97706",
  // Store / ShoppingCart → 인디고
  "편의점": "#6366F1", "슈퍼마켓": "#6366F1",
  // ShoppingBag → 보라 / SportShoe → 오렌지 / Handbag → 베이지브라운
  "생활용품 소매": "#8B5CF6", "신발": "#F97316", "가방": "#92400E",
  // Shirt → 하늘
  "일반의류": "#0EA5E9", "섬유제품": "#0EA5E9", "세탁소": "#0EA5E9",
  // Eye → 청록
  "안경": "#0891B2",
  // Palette → 보라 / Scissors → 핑크 / Paintbrush → 핑크
  "화장품": "#A855F7", "미용실": "#EC4899", "네일숍": "#EC4899",
  // Leaf → 초록
  "한의원": "#10B981", "피부관리실": "#10B981", "애완동물": "#10B981",
  // Stethoscope → 메디컬 레드
  "일반의원": "#EF4444", "치과의원": "#EF4444", "의료기기": "#EF4444",
  // Pill → 민트 그린
  "의약품": "#14B8A6",
  // GraduationCap → 남색
  "일반교습학원": "#1D4ED8", "예술학원": "#1D4ED8", "외국어학원": "#1D4ED8",
  // Music → 보라
  "노래방": "#7C3AED",
  // Monitor → 슬레이트
  "PC방": "#475569", "컴퓨터및주변장치판매": "#475569",
  // CircleDot → 당구대 녹색 / Flag → 깃발 빨강 / Dumbbell → 오렌지
  "당구장": "#16A34A", "골프연습장": "#EF4444", "스포츠클럽": "#F97316", "스포츠 강습": "#F97316",
  // Car → 슬레이트 그레이
  "자동차수리/미용": "#64748B",
  // Wrench → 중간 그레이
  "가전제품수리": "#6B7280", "인테리어": "#6B7280",
  // Zap → 노랑
  "가전제품": "#EAB308",
  // Smartphone → 다크
  "핸드폰": "#374151",
  // Home → 따뜻한 주황
  "숙박": "#EA580C",
  // Building2 → 그레이
  "기타 B2B서비스": "#64748B",
};
function CalcCatIcon({ cat, size = 18, color }) {
  const Icon = CALC_CAT_ICON[cat] || Store;
  const c = color || CALC_CAT_COLOR[cat] || "#6B7280";
  return <Icon size={size} color={c} strokeWidth={1.8} />;
}

function SidebarCategoryDropdown({ value, onChange, disabled, options, placeholder = "전체 업종", includeAll = true }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const items = includeAll ? ["", ...options] : options;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        style={{ width: "100%", padding: "8px 10px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: open ? "8px 8px 0 0" : 8, color: value ? "#111827" : "#9CA3AF", fontSize: 13, cursor: disabled ? "default" : "pointer", outline: "none", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}
      >
        <span>{value || placeholder}</span>
        <ChevronDown size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
      </button>
      {open && (
        <div className="no-scrollbar" style={{ position: "absolute", left: 0, right: 0, background: "#fff", border: "1px solid #E5E7EB", borderTop: "none", borderRadius: "0 0 8px 8px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", maxHeight: 220, overflowY: "auto", zIndex: 300 }}>
          {items.map((cat) => (
            <div
              key={cat || "__all__"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(cat); setOpen(false); }}
              style={{ padding: "8px 10px", fontSize: 13, cursor: "pointer", color: cat === value ? "#2563EB" : "#374151", fontWeight: cat === value ? 600 : 400, background: cat === value ? "#EFF6FF" : "transparent" }}
              onMouseEnter={(e) => { if (cat !== value) e.currentTarget.style.background = "#F9FAFB"; }}
              onMouseLeave={(e) => { if (cat !== value) e.currentTarget.style.background = "transparent"; }}
            >
              {cat || placeholder}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DRILL_GROUPS = ["음식", "소매", "서비스"];
const DRILL_GROUP_META = {
  "음식":   { emoji: "🍽️", icon: Utensils,   iconColor: "#94A3B8" },
  "소매":   { emoji: "🛍️", icon: ShoppingBag, iconColor: "#8B5CF6" },
  "서비스": { emoji: "⚙️", icon: Wrench,       iconColor: "#6B7280" },
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

// 업종별 예상 창업비용 계산 (20평, 월임대료 300만원 기준, 단위: 만원)
function calcStartupCost(category, pyeong = 20, monthlyRent = 300) {
  const c = STARTUP_COSTS[category];
  if (!c) return null;
  return (
    c["인테리어_만원per평"] * pyeong
    + c["설비_집기_만원"]
    + c["초기재고_만원"]
    + c["보증금_임대료배수"] * monthlyRent
  );
}

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
const POLYGON_GU_SELECTED  = { fillColor: "#000000", fillOpacity: 0, strokeColor: "#60A5FA", strokeOpacity: 1, strokeWeight: 3 };
// 선택된 행정동 경계: 투명(원래 지도 색) + 에메랄드 테두리
const POLYGON_DONG_SELECTED = { fillColor: "#000000", fillOpacity: 0.01, strokeColor: "#60A5FA", strokeOpacity: 0.8, strokeWeight: 2 };
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
  const fmtEok = (v) => v >= 1_000_000_000_000 ? `${Math.floor(v / 1_000_000_000_000)}조${Math.round((v % 1_000_000_000_000) / 100_000_000) > 0 ? ` ${Math.round((v % 1_000_000_000_000) / 100_000_000).toLocaleString()}억` : ""}` : v >= 100_000_000 ? `${Math.round(v / 100_000_000).toLocaleString()}억` : `${Math.round(v / 10_000)}만`;

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
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [cardSearchResults, setCardSearchResults] = useState([]);
  const [cardSearchHighlight, setCardSearchHighlight] = useState(-1);
  const cardSearchRef = useRef(null);

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
  const [reportLoadingStep, setReportLoadingStep] = useState(0); // 로딩 문구 단계
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

  // ── 프리미엄 AI 추천 상태 ──
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [premiumModalMinimized, setPremiumModalMinimized] = useState(false);
  const [premiumFlyingIn, setPremiumFlyingIn] = useState(false);
  const [premiumIndustryQuery, setPremiumIndustryQuery] = useState("");
  const [premiumIndustrySelected, setPremiumIndustrySelected] = useState(null);
  const [premiumTopLoading, setPremiumTopLoading] = useState(false);
  const [premiumTopResults, setPremiumTopResults] = useState(null); // { results: [], quarter: ... }
  const [premiumStep, setPremiumStep] = useState("q1"); // "q1" | "q2"
  const [premiumRegionQuery, setPremiumRegionQuery] = useState("");
  const [premiumRegionSugg, setPremiumRegionSugg] = useState([]);
  const [premiumRegionSelected, setPremiumRegionSelected] = useState(null);
  const [premiumBudget, setPremiumBudget] = useState(null);

  const [premiumResultLoading, setPremiumResultLoading] = useState(false);
  const [premiumResult, setPremiumResult] = useState(null); // { type: "dong"|"gu", data: ... }
  const [premiumMapPickMode, _setPremiumMapPickMode] = useState(false); // 지도에서 지역 선택 모드
  const [premiumMapPickCandidate, setPremiumMapPickCandidate] = useState(null); // { dong?, gu, type }
  const [premiumIndustryDrillGroup, setPremiumIndustryDrillGroup] = useState(null); // 업종 그룹 드릴다운
  const [premiumSubcategorySelected, setPremiumSubcategorySelected] = useState(null); // "냉면/밀면"
  const [premiumSubcategorySugg, setPremiumSubcategorySugg] = useState([]); // 검색 드롭다운용
  const [premiumCatDrillSub, setPremiumCatDrillSub] = useState(null); // 카테고리 드릴다운 level3
  const [premiumCatSubList, setPremiumCatSubList] = useState([]); // level3 소분류 목록
  const [premiumTrendData, setPremiumTrendData] = useState(null); // { dongName: { trend, counts, ... } }

  // ── AI 추천 상태 ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiStep, setAiStep] = useState("mode"); // "mode" | "form" | "loading" | "result" | "spot_loading" | "spot"
  const [aiResultCollapsed, setAiResultCollapsed] = useState(false);
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
  const [guDongRecommends, setGuDongRecommends] = useState(null);       // 구 보고서 내 AI 행정동 추천 결과
  const [guDongRecommendLoading, setGuDongRecommendLoading] = useState(false);
  const [guDongRecommendOpen, setGuDongRecommendOpen] = useState(false); // 접기/펼치기
  const [savedGuReportData, setSavedGuReportData] = useState(null);     // 행정동 보고서 전환 전 구 보고서 캐시
  const [savedGuReportCategory, setSavedGuReportCategory] = useState("");
  const [savedGuReportRegion, setSavedGuReportRegion] = useState(null);
  const [aiDong, setAiDong] = useState("");
  const [aiDongSuggestions, setAiDongSuggestions] = useState([]);
  const [aiDongSuggestOpen, setAiDongSuggestOpen] = useState(false);
  const [aiDongSuggestIdx, setAiDongSuggestIdx] = useState(-1);
  const [aiGuDropdownOpen, setAiGuDropdownOpen] = useState(false);
  const aiGuDropdownRef = useRef(null);
  const [aiGu, setAiGu] = useState("");            // gu 모드: 선택한 구
  const [aiGuResultTab, setAiGuResultTab] = useState("dong"); // "dong" | "street"
  const [aiGuStreetResults, setAiGuStreetResults] = useState(null); // 길단위 상권 결과
  const [aiGuDongError, setAiGuDongError] = useState(null); // 행정동 추천 실패 메시지
  const [aiResults, setAiResults] = useState(null);
  // ── 지역/업종 비교 오버레이 (상권분석도구 이동) ──
  const [compareRegionOpen, setCompareRegionOpen] = useState(false);
  const [compareRegionStep, setCompareRegionStep] = useState("form"); // "form"|"loading"|"result"
  const [compareRegionResults, setCompareRegionResults] = useState(null);
  const [compareIndustryOpen, setCompareIndustryOpen] = useState(false);
  const [compareIndustryStep, setCompareIndustryStep] = useState("form");
  const [compareIndustryResults, setCompareIndustryResults] = useState(null);
  // ── AI 추천 서베이 ──
  const [surveyHasIndustry, setSurveyHasIndustry] = useState(false);
  const [aiDongGuTab, setAiDongGuTab] = useState("dong"); // dong 모드 결과 탭: "dong" | "gu"
  const [dongLocReady, setDongLocReady] = useState(false); // dong 모드 서브스텝: 업종 선택 완료 여부
  const [dongLocChoice, setDongLocChoice] = useState(null); // "gu" | "dong"
  const [aiGuRankResults, setAiGuRankResults] = useState(null); // dong 모드 구 랭킹 결과
  const [aiDongSubMode, setAiDongSubMode] = useState(null); // dong 서브스텝 결과 타입: "gu_rank" | null
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);
  const [aiSubIndustry, setAiSubIndustry] = useState("");       // dong 모드: 소분류 입력값
  const [aiIndustrySearchQuery, setAiIndustrySearchQuery] = useState("");    // AI 업종 선택 검색어
  const [aiIndustryDrillGroup, setAiIndustryDrillGroup] = useState(null);   // AI 드릴다운 선택 그룹 (null=top)
  const [aiIndustrySuggestions, setAiIndustrySuggestions] = useState([]);    // AI 업종 자동완성
  const [aiIndustrySuggestOpen, setAiIndustrySuggestOpen] = useState(false); // 드롭다운 표시 여부
  const aiIndustrySuggestTimer = useRef(null);                               // 디바운스 타이머
  // 지도 상가 필터 드릴다운
  const [storeDrillGroup, setStoreDrillGroup] = useState(null);
  // AI 결과 패널 드릴다운
  const [pickerDrillGroup, setPickerDrillGroup] = useState(null);
  // 창업비용 계산기 드릴다운 (calcActiveTab → drillGroup으로 전환)
  const [calcDrillGroup, setCalcDrillGroup] = useState(null);
  const [calcStep, setCalcStep] = useState(1);                   // 1:위치 2:업종 3:크기 4:층수 5:결과
  const [startupCalcOpen, setStartupCalcOpen] = useState(false); // 창업 비용 계산기
  const [toolMenuOpen, setToolMenuOpen] = useState(false); // 상권 분석 도구 드롭다운
  const [calcIndustry, setCalcIndustry] = useState(null);       // 계산기 선택 업종
  const [calcRegion, setCalcRegion] = useState("");             // 구 선택
  const [calcDong, setCalcDong] = useState("");               // 동 선택
  const [calcSize, setCalcSize] = useState(null);               // '소형'|'중형'|'대형'
  const [calcFloor, setCalcFloor] = useState(null);             // 층수 카드 선택
  const [calcWorkers, setCalcWorkers] = useState(1);             // 직원수
  const [calcResult, setCalcResult] = useState(null);            // 계산 결과
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
  const [customPanelCollapsed, setCustomPanelCollapsed] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [customResults, setCustomResults] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [customDrillGroup, setCustomDrillGroup] = useState(null);
  const [customSearchQuery, setCustomSearchQuery] = useState("");
  const drawingModeRef = useRef(false);
  const premiumMapPickModeRef = useRef(false);
  const setPremiumMapPickMode = (v) => { premiumMapPickModeRef.current = v; _setPremiumMapPickMode(v); };
  const drawingPointsRef = useRef([]);
  const drawingPolylineRef = useRef(null);
  const drawingPreviewRef = useRef(null);
  const customPolygonRef = useRef(null);
  const customMarkersRef = useRef([]);
  const drawingDotsRef = useRef([]);
  const drawingClickListenerRef = useRef(null);
  const drawingMousemoveListenerRef = useRef(null);

  // 사이드바 안 검색 input에 포커스를 주기 위한 ref

  // ── 행정동/구 선택 시 사이드바 자동 열기 ──
  useEffect(() => {
    if (selectedDong || selectedGu) setSidebarCollapsed(false);
    if (!selectedDong) clearStreetPolygons();
  }, [selectedDong, selectedGu]);

  // ── 보고서 로딩 중 단계별 문구 전환 ──
  useEffect(() => {
    const isLoading = reportLoading || reportCategoryLoading;
    if (!isLoading) { setReportLoadingStep(0); return; }
    setReportLoadingStep(0);
    const id = setInterval(() => setReportLoadingStep((s) => Math.min(s + 1, 4)), 5000);
    return () => clearInterval(id);
  }, [reportLoading, reportCategoryLoading]);

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
    if (aiStep === "result" || aiStep === "spot") setAiResultCollapsed(false);
  }, [aiStep]);

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
      fetch(`${API}/api/rental/regions/`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setCalcGuRental(data); })
        .catch(() => {});
    }
  }, [startupCalcOpen]);



  // ── 프리미엄 결과 + 소분류 선택 시 트렌드 자동 fetch ──
  useEffect(() => {
    if (!premiumResult || !premiumSubcategorySelected) { setPremiumTrendData(null); return; }
    const results = premiumResult.data?.results || [];
    const dongs = results.map(r => r.dong).filter(Boolean);
    if (dongs.length === 0) { setPremiumTrendData(null); return; }
    fetch(`${API}/api/subcategory/trend/?subcategory=${encodeURIComponent(premiumSubcategorySelected)}&dongs=${encodeURIComponent(dongs.join(","))}`)
      .then(r => r.json())
      .then(d => setPremiumTrendData(d.data || null))
      .catch(() => setPremiumTrendData(null));
  }, [premiumResult, premiumSubcategorySelected]);

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
      // 폴리곤 완성 후 즉시 구별 매출 순위 fetch
      fetch(`${API}/api/gu-all-ranking/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gu_dongs_map: guToDongsRef.current }),
      })
        .then((r) => r.json())
        .then((d) => setGuAllRanking(d.rankings || []))
        .catch(() => {});
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
          // 프리미엄 지도 선택 모드 — ref와 state 둘 다 체크
          if (premiumMapPickModeRef.current) {
            setPremiumMapPickCandidate({ dong: dongName, gu: guName, type: "dong" });
            return;
          }
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
          // 프리미엄 지도 선택 모드
          if (premiumMapPickModeRef.current) {
            setPremiumMapPickCandidate({ gu: guName, type: "gu" });
            return;
          }
          // 모든 구 딤처리, 선택된 구만 투명(원래 지도 색)
          guPolygonGroupsRef.current.forEach(({ guName: gn, polygons: ps }) => {
            ps.forEach(p => p.setOptions(gn === guName ? POLYGON_GU_SELECTED : POLYGON_DIMMED));
          });
          selectedGuGroupRef.current = { guName, polygons };
          selectedGroupRef.current = null;
          setSidebarCollapsed(false);
          setSelectedGu(guName);
          setSelectedDong(null);
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
          background: #fff;
          border: 1.5px solid ${color};
          border-radius: 10px;
          padding: 8px 12px;
          font-family: 'Pretendard', sans-serif;
          min-width: 140px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          pointer-events: auto;
          position: relative;
        `;
        popup.innerHTML = `
          <div style="font-size:11px;color:${color};font-weight:700;margin-bottom:3px;">${store.통합카테고리}</div>
          <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:2px;">${store.상호명}</div>
          <div style="font-size:10px;color:#6B7280;">${store.상권업종소분류명}</div>
          ${store.도로명주소 ? `<div style="font-size:10px;color:#9CA3AF;margin-top:4px;border-top:1px solid #E5E7EB;padding-top:4px;">${store.도로명주소}</div>` : ""}
        `;
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "✕";
        closeBtn.style.cssText = `
          position:absolute; top:6px; right:8px;
          border:none; background:none; color:#6B7280;
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

  function drawStreetPolygons(map, kakao, dongName, selectCode = null) {
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

        const isAutoSelected = selectCode !== null && String(상권_코드) === String(selectCode);
        const polygons = rings.map((ring) => {
          const path = ring.map(([lng, lat]) => new kakao.maps.LatLng(lat, lng));
          const polygon = new kakao.maps.Polygon({
            map,
            path,
            ...(isAutoSelected ? POLYGON_STREET_SELECTED : POLYGON_STREET_DEFAULT),
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
            fetch(`${API}/api/recommend/street-industry/?상권코드=${상권_코드}`)
              .then((r) => r.json())
              .then((data) => { setStreetResults(data); setStreetLoading(false); })
              .catch(() => setStreetLoading(false));
          });

          return polygon;
        });

        streetPolygonGroupsRef.current.push({ 상권코드: 상권_코드, 상권명: 상권_코드_명, polygons });

        // 자동 선택 상권: selectedStreet 상태 및 분석 데이터 바로 로드
        if (isAutoSelected) {
          selectedStreetRef.current = { 상권코드: 상권_코드, 상권명: 상권_코드_명 };
          setSelectedStreet({ 상권코드: 상권_코드, 상권명: 상권_코드_명 });
        }
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

  // ── 마커 토글 / 행정동 / 업종 필터 변경 시: 카카오 API로 상가 마커 fetch ──
  useEffect(() => {
    clearStoreMarkers();
    allStoresRef.current = [];
    storeCategoryFilterRef.current = storeCategoryFilter;
    const map = mapInstanceRef.current;
    if (!showStoreMarkers || !selectedDong || !storeCategoryFilter.length || !map || !window.kakao) return;

    let cancelled = false;
    setStoreLoading(true);

    Promise.all(storeCategoryFilter.map((cat) => {
      const params = new URLSearchParams({
        dong: normalizeDongName(selectedDong.dongName),
        category: cat,
      });
      return fetch(`${API}/api/stores/?${params}`)
        .then((r) => r.json())
        .then((data) => data.stores || [])
        .catch(() => []);
    }))
      .then((results) => {
        if (cancelled) return;
        allStoresRef.current = results.flat();
        renderStoreMarkers(map, allStoresRef.current);
      })
      .finally(() => { if (!cancelled) setStoreLoading(false); });

    return () => { cancelled = true; };
  }, [showStoreMarkers, selectedDong, storeCategoryFilter]);


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
    fetch(`${API}/api/score-all/?dong=${encodeURIComponent(normalizeDongName(selectedDong.dongName))}`)
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
    fetch(`${API}/api/quarters/?dong=${encodeURIComponent(normalizeDongName(selectedDong.dongName))}`)
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
      ? `${API}/api/analysis/?dong=${encodeURIComponent(normalizeDongName(selectedDong.dongName))}&quarter=${selectedQuarter}`
      : `${API}/api/analysis/?dong=${encodeURIComponent(normalizeDongName(selectedDong.dongName))}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setDongData(data))
      .catch(() => setDongData(null))
      .finally(() => setDongLoading(false));
  }, [selectedDong, selectedQuarter]);


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
    fetch(`${API}/api/gu-quarters/?dongs=${encodeURIComponent(dongs.join(","))}`)
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
    fetch(`${API}/api/gu-analysis/`, {
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
          if (dist < 0.001) {
            finishPolygon(map, kakao);
            return;
          }
        }

        points.push(latlng);

        // 꼭짓점 점 표시
        const dotContent = `<div style="width:10px;height:10px;background:#2563EB;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></div>`;
        const dot = new kakao.maps.CustomOverlay({ position: latlng, content: dotContent, xAnchor: 0.5, yAnchor: 0.5, zIndex: 20 });
        dot.setMap(map);
        drawingDotsRef.current.push(dot);

        // 폴리라인 업데이트
        if (drawingPolylineRef.current) drawingPolylineRef.current.setMap(null);
        if (points.length >= 2) {
          drawingPolylineRef.current = new kakao.maps.Polyline({
            map, path: points,
            strokeWeight: 3, strokeColor: "#1D4ED8", strokeOpacity: 0.9, strokeStyle: "solid",
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
          strokeWeight: 2, strokeColor: "#3B82F6", strokeOpacity: 0.6, strokeStyle: "dashed",
        });
        // 첫 번째 점 스냅 하이라이트
        if (points.length >= 3 && drawingDotsRef.current.length > 0) {
          const first = points[0];
          const dist = Math.abs(e.latLng.getLat() - first.getLat()) + Math.abs(e.latLng.getLng() - first.getLng());
          const firstDot = drawingDotsRef.current[0];
          if (dist < 0.001) {
            firstDot.setContent(`<div style="width:20px;height:20px;background:#1D4ED8;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(29,78,216,0.35);cursor:pointer;"></div>`);
          } else {
            firstDot.setContent(`<div style="width:10px;height:10px;background:#2563EB;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></div>`);
          }
        }
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
    // 그리기 완료 시 구/동 선택 상태 초기화 (딤처리·호버 제거)
    if (selectedGuGroupRef.current) {
      selectedGuGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
      selectedGuGroupRef.current = null;
    }
    if (selectedGroupRef.current) {
      selectedGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
      selectedGroupRef.current = null;
    }
    setSelectedGu(null);
    setSelectedDong(null);
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
    drawingDotsRef.current.forEach((dot) => dot.setMap(null));
    drawingDotsRef.current = [];

    customPolygonRef.current = new kakao.maps.Polygon({
      map, path: points,
      strokeWeight: 3, strokeColor: "#1D4ED8", strokeOpacity: 1,
      fillColor: "#3B82F6", fillOpacity: 0.12,
    });

    setCustomPanelCollapsed(false);
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

    fetch(`${API}/api/recommend/custom-spot/`, {
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

    fetch(`${API}/api/recommend/street-spot/?상권코드=${encodeURIComponent(상권코드)}&category=${encodeURIComponent(category)}`)
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
    console.log("[spot] step → spot_loading");

    fetch(`${API}/api/recommend/spot/?dong=${encodeURIComponent(dongName)}&category=${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setAiStep("result"); alert(data.error); return; }
        console.log("[spot] results received:", data.results?.length, "→ step: spot");
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
      .catch(() => { setAiStep("result"); alert("위치 추천 요청에 실패했습니다."); });
  }

  // ── 지역 자동완성 검색 헬퍼 ──
  function searchRegionSuggest(query, type, setSugg) {
    if (!query.trim()) { setSugg([]); return; }
    fetch(`${API}/api/search/regions/?q=${encodeURIComponent(query)}&type=${type}`)
      .then(r => r.json())
      .then(d => setSugg(d.results || []))
      .catch(() => setSugg([]));
  }

  // ── 지역 비교 요청 ──
  function handleCompareRegion() {
    const nameA = cmpRegionType === "dong" ? cmpRegionASelected?.dong : cmpRegionASelected;
    const nameB = cmpRegionType === "dong" ? cmpRegionBSelected?.dong : cmpRegionBSelected;
    if (!nameA || !nameB || !cmpRegionCat) return;
    setCompareRegionStep("loading");
    fetch(`${API}/api/compare/region/?type=${cmpRegionType}&a=${encodeURIComponent(nameA)}&b=${encodeURIComponent(nameB)}&category=${encodeURIComponent(cmpRegionCat)}`)
      .then(r => r.json())
      .then(data => { setCompareRegionResults(data); setCompareRegionStep("result"); })
      .catch(() => setCompareRegionStep("form"));
  }

  // ── 업종 비교 요청 ──
  function handleCompareIndustry() {
    const regionName = cmpIndRegionType === "dong" ? cmpIndRegionSelected?.dong : cmpIndRegionSelected;
    if (!regionName || !cmpIndCatA || !cmpIndCatB) return;
    setCompareIndustryStep("loading");
    fetch(`${API}/api/compare/industry/?region=${encodeURIComponent(regionName)}&region_type=${cmpIndRegionType}&cat_a=${encodeURIComponent(cmpIndCatA)}&cat_b=${encodeURIComponent(cmpIndCatB)}`)
      .then(r => r.json())
      .then(data => { setCompareIndustryResults(data); setCompareIndustryStep("result"); })
      .catch(() => setCompareIndustryStep("form"));
  }

  // ── 서베이 제출 → 모드 결정 후 분석 시작 ──
  function handleSurveySubmit() {
    let mode;
    if (surveyHasIndustry && aiIndustry && aiDong.trim()) mode = "score";
    else if (surveyHasIndustry && aiIndustry && aiGu) mode = "gu";
    else if (surveyHasIndustry && aiIndustry) mode = "dong";
    else if (!surveyHasIndustry && aiDong.trim()) mode = "industry";
    else if (!surveyHasIndustry && aiGu) mode = "gu_overview";
    else return;
    setAiMode(mode);
    setAiStep("loading");
    setAiIndustrySuggestions([]);
    const MIN_LOADING_MS = 1200;
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    if (mode === "dong") {
      setAiDongGuTab("dong");
      setAiGuRankResults(null);
      Promise.all([
        fetch(`${API}/api/recommend/location/?업종=${encodeURIComponent(aiIndustry.trim())}`).then((r) => r.json()),
        delay(MIN_LOADING_MS),
      ])
        .then(([data]) => {
          if (data.error) { alert(data.error); setAiStep("survey"); return; }
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
        .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("survey"); });
    } else if (mode === "industry") {
      Promise.all([
        fetch(`${API}/api/recommend/industry/?dong=${encodeURIComponent(aiDong.trim())}`).then((r) => r.json()),
        delay(MIN_LOADING_MS),
      ])
        .then(([data]) => {
          if (data.error) { alert(data.error); setAiStep("survey"); return; }
          setAiResults(data.results);
          setAiStep("result");
        })
        .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("survey"); });
    } else if (mode === "score") {
      Promise.all([
        fetch(`${API}/api/recommend/score/?dong=${encodeURIComponent(aiDong.trim())}&category=${encodeURIComponent(aiIndustry)}`).then((r) => r.json()),
        delay(MIN_LOADING_MS),
      ])
        .then(([data]) => {
          if (data.error) { alert(data.error); setAiStep("survey"); return; }
          setAiResults(data);
          setAiStep("result");
        })
        .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("survey"); });
    } else if (mode === "gu") {
      setAiGuResultTab("dong");
      setAiGuStreetResults(null);
      setAiGuDongError(null);
      Promise.all([
        fetch(`${API}/api/recommend/location/?업종=${encodeURIComponent(aiIndustry)}&gu=${encodeURIComponent(aiGu)}`).then((r) => r.json()),
        fetch(`${API}/api/recommend/gu-streets/?gu=${encodeURIComponent(aiGu)}&category=${encodeURIComponent(aiIndustry)}`).then((r) => r.json()),
        delay(MIN_LOADING_MS),
      ])
        .then(([dongData, streetData]) => {
          if (dongData.error && streetData.error) { alert(dongData.error); setAiStep("survey"); return; }
          if (dongData.error) {
            setAiGuDongError(dongData.error);
            setAiResults([]);
          } else {
            const enriched = dongData.results.map((r) => ({
              ...r,
              guName: polygonGroupsRef.current.find((g) => g.dongName === r.dongName)?.guName ?? "",
              revenue: r.당월매출합,
              stores: r.소분류_점포수,
              통합카테고리: dongData.통합카테고리,
            }));
            setAiResults(enriched);
          }
          setAiGuStreetResults(streetData.error ? [] : streetData.results || []);
          setAiStep("result");
        })
        .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("survey"); });
    } else if (mode === "gu_overview") {
      Promise.all([
        fetch(`${API}/api/recommend/gu-industry/?gu=${encodeURIComponent(aiGu)}`).then((r) => r.json()),
        delay(MIN_LOADING_MS),
      ])
        .then(([data]) => {
          if (data.error) { alert(data.error); setAiStep("survey"); return; }
          setAiResults(data);
          setAiStep("result");
        })
        .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("survey"); });
    }
  }

  // ── AI 추천 요청 ──
  function handleAiRecommend(overrideMode = null) {
    const mode = overrideMode || aiMode;
    if (mode === "dong" && !aiIndustry) return;
    if (mode === "industry" && !aiDong.trim()) return;
    if (mode === "score" && (!aiDong.trim() || !aiIndustry)) return;
    if (mode === "gu" && (!aiGu || !aiIndustry)) return;
    setAiStep("loading");
    setAiIndustrySuggestions([]);

    const MIN_LOADING_MS = 1200;
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    if (mode === "dong") {
      setAiGuRankResults(null);
      Promise.all([
        fetch(`${API}/api/recommend/location/?업종=${encodeURIComponent(aiIndustry.trim())}`).then((r) => r.json()),
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

    if (mode === "industry") {
      Promise.all([
        fetch(`${API}/api/recommend/industry/?dong=${encodeURIComponent(aiDong.trim())}`).then((r) => r.json()),
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

    if (mode === "score") {
      Promise.all([
        fetch(`${API}/api/recommend/score/?dong=${encodeURIComponent(aiDong.trim())}&category=${encodeURIComponent(aiIndustry)}`).then((r) => r.json()),
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

    if (mode === "gu") {
      setAiGuResultTab("dong");
      setAiGuStreetResults(null);
      setAiGuDongError(null);
      Promise.all([
        fetch(`${API}/api/recommend/location/?업종=${encodeURIComponent(aiIndustry)}&gu=${encodeURIComponent(aiGu)}`).then((r) => r.json()),
        fetch(`${API}/api/recommend/gu-streets/?gu=${encodeURIComponent(aiGu)}&category=${encodeURIComponent(aiIndustry)}`).then((r) => r.json()),
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
    fetch(`${API}/api/gu-all-ranking/`, {
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

    const effectiveGu = selectedGu || selectedDong?.guName;
    const group = polygonGroupsRef.current.find(
      (g) => g.dongName === dongName && g.guName === effectiveGu
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

  // ── 플로팅 카드 검색 → 지도 선택 ──
  function handleCardSearchSelect({ type, guName, dongName, centroid }) {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao) return;
    setCardSearchQuery("");
    setCardSearchResults([]);
    setCardSearchHighlight(-1);
    if (type === "gu") {
      guPolygonGroupsRef.current.forEach(({ guName: gn, polygons: ps }) => {
        ps.forEach(p => p.setOptions(gn === guName ? POLYGON_GU_SELECTED : POLYGON_DIMMED));
      });
      const group = guPolygonGroupsRef.current.find(g => g.guName === guName);
      if (group) selectedGuGroupRef.current = group;
      if (selectedGroupRef.current) {
        selectedGroupRef.current.polygons.forEach(p => p.setOptions(POLYGON_DEFAULT));
        selectedGroupRef.current = null;
      }
      smoothZoom(map, GU_MODE_LEVEL, () => map.panTo(new window.kakao.maps.LatLng(centroid.lat, centroid.lng)));
      setSelectedDong(null);
      setSelectedGu(guName);
    } else {
      const group = polygonGroupsRef.current.find(g => g.dongName === dongName && g.guName === guName);
      if (group) {
        polygonGroupsRef.current.forEach(({ dongName: dn, polygons: ps }) => {
          ps.forEach(p => p.setOptions(dn === dongName ? POLYGON_GU_SELECTED : POLYGON_DIMMED));
        });
        selectedGroupRef.current = group;
      }
      if (selectedGuGroupRef.current) {
        selectedGuGroupRef.current.polygons.forEach(p => p.setOptions(POLYGON_DEFAULT));
        selectedGuGroupRef.current = null;
      }
      smoothZoom(map, 4, () => map.panTo(new window.kakao.maps.LatLng(centroid.lat, centroid.lng)));
      setSelectedGu(null);
      setSelectedDong({ dongName, guName });
    }
  }

  // ── 프리미엄 모달 열기 + 전체 초기화 ──
  function openPremiumModal() {
    setPremiumModalOpen(true);
    setPremiumModalMinimized(false);
    setPremiumFlyingIn(false);
    setPremiumStep("q1");
    setPremiumIndustryQuery("");
    setPremiumIndustrySelected(null);
    setPremiumIndustryDrillGroup(null);
    setPremiumSubcategorySelected(null);
    setPremiumSubcategorySugg([]);
    setPremiumCatDrillSub(null);
    setPremiumCatSubList([]);
    setPremiumTopResults(null);
    setPremiumTopLoading(false);
    setPremiumRegionQuery("");
    setPremiumRegionSugg([]);
    setPremiumRegionSelected(null);
    setPremiumBudget(null);
    setPremiumResult(null);
    setPremiumResultLoading(false);
    setPremiumTrendData(null);
  }

  // ── 프리미엄 결과 → 지도 이동 ──
  function navigatePremiumDong(dongName, guName) {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao) return;
    setPremiumFlyingIn(true);
    setTimeout(() => { setPremiumFlyingIn(false); setPremiumModalMinimized(true); }, 500);
    const group = polygonGroupsRef.current.find(g => g.dongName === dongName && g.guName === guName)
      || polygonGroupsRef.current.find(g => g.dongName === dongName);
    if (group) {
      polygonGroupsRef.current.forEach(({ dongName: dn, polygons: ps }) => {
        ps.forEach(p => p.setOptions(dn === dongName ? POLYGON_GU_SELECTED : POLYGON_DIMMED));
      });
      selectedGroupRef.current = group;
      if (selectedGuGroupRef.current) {
        selectedGuGroupRef.current.polygons.forEach(p => p.setOptions(POLYGON_DEFAULT));
        selectedGuGroupRef.current = null;
      }
      const dongGuGroup = guPolygonGroupsRef.current.find(g => g.guName === (guName || group.guName));
      if (dongGuGroup) dongGuGroup.polygons.forEach(p => { p.setMap(map); p.setOptions(POLYGON_GU_SELECTED); });
      smoothZoom(map, 4, () => map.panTo(new window.kakao.maps.LatLng(group.centroid.lat, group.centroid.lng)));
    }
    setSidebarCollapsed(false);
    setSelectedGu(null);
    setSelectedDong({ dongName, guName: guName || group?.guName || "" });
  }

  function navigatePremiumGu(guName) {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao) return;
    setPremiumFlyingIn(true);
    setTimeout(() => { setPremiumFlyingIn(false); setPremiumModalMinimized(true); }, 500);
    guPolygonGroupsRef.current.forEach(({ guName: gn, polygons: ps }) => {
      ps.forEach(p => p.setOptions(gn === guName ? POLYGON_GU_SELECTED : POLYGON_DIMMED));
    });
    const group = guPolygonGroupsRef.current.find(g => g.guName === guName);
    if (group) {
      selectedGuGroupRef.current = group;
      smoothZoom(map, GU_MODE_LEVEL, () => map.panTo(new window.kakao.maps.LatLng(group.centroid.lat, group.centroid.lng)));
    }
    if (selectedGroupRef.current) {
      selectedGroupRef.current.polygons.forEach(p => p.setOptions(POLYGON_DEFAULT));
      selectedGroupRef.current = null;
    }
    setSidebarCollapsed(false);
    setSelectedDong(null);
    setSelectedGu(guName);
  }

  function navigatePremiumStreet(street, guName) {
    const map = mapInstanceRef.current;
    const kakao = window.kakao;
    if (!map || !kakao) return;
    setPremiumFlyingIn(true);
    setTimeout(() => { setPremiumFlyingIn(false); setPremiumModalMinimized(true); }, 500);

    if (!street.lat || !street.lng || !street.dong) {
      // fallback: 구 전체 보기
      navigatePremiumGu(guName);
      return;
    }

    // 행정동 폴리곤 선택 해제 (길단위 상권 폴리곤으로 대체)
    if (selectedGroupRef.current) {
      selectedGroupRef.current.polygons.forEach(p => p.setOptions(POLYGON_DEFAULT));
      selectedGroupRef.current = null;
    }
    // 행정동 폴리곤 dimmed 처리
    polygonGroupsRef.current.forEach(({ dongName: dn, polygons: ps }) => {
      ps.forEach(p => p.setOptions(dn === street.dong ? POLYGON_GU_SELECTED : POLYGON_DIMMED));
    });

    // 해당 상권 폴리곤 하나만 그리기
    const drawSingle = (geoJson) => {
      clearStreetPolygons();
      const feature = geoJson.features.find(
        (f) => String(f.properties.상권_코드) === String(street.상권코드)
      );
      if (!feature) return;
      const { 상권_코드, 상권_코드_명 } = feature.properties;
      const geom = feature.geometry;
      const rings = geom.type === "MultiPolygon" ? geom.coordinates.flat() : geom.coordinates;
      const polygons = rings.map((ring) => {
        const path = ring.map(([lng, lat]) => new kakao.maps.LatLng(lat, lng));
        const polygon = new kakao.maps.Polygon({ map, path, ...POLYGON_STREET_SELECTED });
        polygon.setZIndex(10);
        return polygon;
      });
      streetPolygonGroupsRef.current.push({ 상권코드: 상권_코드, 상권명: 상권_코드_명, polygons });
      selectedStreetRef.current = { 상권코드: 상권_코드, 상권명: 상권_코드_명 };
      setSelectedStreet({ 상권코드: 상권_코드, 상권명: 상권_코드_명 });
      setStreetCount(1);
    };
    if (streetGeoJsonRef.current) {
      drawSingle(streetGeoJsonRef.current);
    } else {
      fetch("/street_boundaries.geojson").then(r => r.json()).then(geoJson => {
        streetGeoJsonRef.current = geoJson;
        drawSingle(geoJson);
      });
    }

    // 사이드바: 해당 행정동 선택 상태로 설정
    setSelectedGu(null);
    setSelectedDong({ dongName: street.dong, guName });
    setSidebarCollapsed(false);

    // 해당 상권 위치로 줌인
    smoothZoom(map, 3, () => map.panTo(new kakao.maps.LatLng(street.lat, street.lng)));
  }

  function openAiModal({ region = null, industry = null, dong = "" } = {}) {
    setAiModalOpen(true);
    setAiStep("mode");
    setAiMode(null);
    setAiIndustry(industry);
    setAiRegion(region);
    setAiDong(dong);
    setAiGu("");
    setAiResults(null);
    setAiDongGuTab("dong");
    setAiGuRankResults(null);
    setAiSubIndustry("");
    setAiIndustrySuggestions([]);
    setAiIndustrySearchQuery("");
    setAiIndustryDrillGroup(null);
    setAiIndustrySuggestions([]);
    setAiIndustrySuggestOpen(false);
    setSurveyHasIndustry(industry ? true : false);
    setMenuOpen(false);
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
    setAiStep("loading");
    Promise.all([
      fetch(`${API}/api/recommend/industry/?dong=${encodeURIComponent(dongName.trim())}`).then((r) => r.json()),
      new Promise((res) => setTimeout(res, 1200)),
    ])
      .then(([data]) => {
        if (data.error) { alert(data.error); setAiStep("form"); return; }
        setAiResults(data.results);
        setAiStep("result");
      })
      .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("form"); });
  }


  // ── 팝업 외부 클릭 시 닫기 ──
  // selectedDong/Gu/Industry를 의존성에 포함해 stale closure 방지
  useEffect(() => {
    const handleClickOutside = (e) => {
      // data-popup 영역과 data-sidebar 영역 밖을 클릭한 경우
      if (!e.target.closest("[data-popup]") && !e.target.closest("[data-sidebar]")) {
        setMenuOpen(false);
            setQuarterPopupOpen(false);
        setGuQuarterPopupOpen(false);
        // 선택된 항목이 없으면 사이드바도 자동으로 닫기
        if (!selectedDong && !selectedGu) {
          setSidebarCollapsed(true);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedDong, selectedGu]); // 선택 상태 바뀔 때마다 핸들러 갱신

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
                  const 매출텍스트 = 매출 >= 1_000_000_000_000 ? `${Math.floor(매출 / 1_000_000_000_000)}조${Math.round((매출 % 1_000_000_000_000) / 100_000_000) > 0 ? ` ${Math.round((매출 % 1_000_000_000_000) / 100_000_000).toLocaleString()}억` : ""}` : 매출 >= 100_000_000 ? `${Math.round(매출 / 100_000_000).toLocaleString()}억` : `${Math.round(매출 / 10_000)}만`;
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>상권분석</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginLeft: "auto" }}>검색하거나 지도에서 선택하세요</div>
                </div>
              </div>
            )}
            {/* 검색창 — 항상 표시 */}
            <div style={{ position: "relative", marginTop: (selectedDong || selectedGu) ? 10 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", background: "#F9FAFB", border: `1.5px solid ${cardSearchResults.length > 0 ? "#BFDBFE" : "#E5E7EB"}`, borderRadius: cardSearchResults.length > 0 ? "8px 8px 0 0" : 8, padding: "7px 10px", gap: 7, transition: "border-color 0.15s" }}>
                    <input
                      ref={cardSearchRef}
                      type="text"
                      placeholder="구 또는 행정동 검색..."
                      value={cardSearchQuery}
                      onChange={(e) => {
                        const q = e.target.value;
                        setCardSearchQuery(q);
                        setCardSearchHighlight(-1);
                        if (!q.trim()) { setCardSearchResults([]); return; }
                        const results = [];
                        guPolygonGroupsRef.current.forEach(({ guName, centroid }) => {
                          if (guName.includes(q)) results.push({ type: "gu", label: guName, guName, centroid });
                        });
                        polygonGroupsRef.current.forEach(({ dongName, guName, centroid }) => {
                          if (dongName.includes(q)) results.push({ type: "dong", label: dongName, dongName, guName, centroid });
                        });
                        setCardSearchResults(results.slice(0, 8));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") { e.preventDefault(); setCardSearchHighlight(h => Math.min(h + 1, cardSearchResults.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setCardSearchHighlight(h => Math.max(h - 1, 0)); }
                        else if ((e.key === "Enter" || e.key === "Tab") && cardSearchResults.length > 0) {
                          e.preventDefault();
                          const idx = cardSearchHighlight >= 0 ? cardSearchHighlight : 0;
                          handleCardSearchSelect(cardSearchResults[idx]);
                        }
                        else if (e.key === "Escape") { setCardSearchQuery(""); setCardSearchResults([]); setCardSearchHighlight(-1); }
                      }}
                      style={{ border: "none", outline: "none", fontSize: 13, width: "100%", background: "transparent", color: "#111827" }}
                    />
                    {cardSearchQuery && (
                      <button onClick={() => { setCardSearchQuery(""); setCardSearchResults([]); setCardSearchHighlight(-1); cardSearchRef.current?.focus(); }}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 14, padding: 0, flexShrink: 0 }}>✕</button>
                    )}
                  </div>
                  {cardSearchResults.length > 0 && (
                    <div style={{ position: "absolute", left: 0, right: 0, background: "#fff", border: "1.5px solid #BFDBFE", borderTop: "none", borderRadius: "0 0 8px 8px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", zIndex: 10, maxHeight: 220, overflowY: "auto", scrollbarWidth: "none" }}>
                      {cardSearchResults.map((r, i) => (
                        <div key={i}
                          onMouseDown={() => handleCardSearchSelect(r)}
                          onMouseEnter={() => setCardSearchHighlight(i)}
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", background: i === cardSearchHighlight ? "#EFF6FF" : "#fff", borderBottom: i < cardSearchResults.length - 1 ? "1px solid #F3F4F6" : "none" }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 700, color: r.type === "gu" ? "#D97706" : "#2563EB", background: r.type === "gu" ? "#FEF3C7" : "#EFF6FF", borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>
                            {r.type === "gu" ? "구" : "동"}
                          </span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{r.label}</div>
                            {r.type === "dong" && <div style={{ fontSize: 11, color: "#9CA3AF" }}>{r.guName}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
          </div>

          {/* 행정동 선택 (항상 표시, 구 선택 후 활성화) */}
          {(() => {
            const activeGu = selectedGu || selectedDong?.guName;
            const dongList = [...(guToDongsRef.current[activeGu] || [])].sort();
            return (
              <div style={{ padding: "10px 18px 0", opacity: activeGu ? 1 : 0.4, transition: "opacity 0.2s" }}>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6 }}>
                  행정동 선택 <span style={{ color: "#3B82F6", fontWeight: 600 }}>(선택사항)</span>
                </div>
                <SidebarCategoryDropdown
                  disabled={!activeGu}
                  value={selectedDong?.dongName || ""}
                  onChange={(dong) => { if (dong) handleSelectDongFromGu(dong); else { setSelectedDong(null); if (activeGu) setSelectedGu(activeGu); } }}
                  options={dongList}
                  placeholder={activeGu ? "구 단위로 분석 (선택 안 함)" : "지도에서 구를 먼저 선택하세요"}
                  includeAll={true}
                />
              </div>
            );
          })()}

          {/* 업종 선택 (항상 표시, 구 선택 후 활성화) */}
          {(() => {
            const active = !!(selectedDong || selectedGu);
            return (
              <div style={{ padding: "10px 18px 0", opacity: active ? 1 : 0.4, transition: "opacity 0.2s", position: "relative" }}>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6 }}>업종 선택 <span style={{ color: "#3B82F6", fontWeight: 600 }}>(선택사항)</span></div>
                <SidebarCategoryDropdown
                  value={reportCategory}
                  onChange={setReportCategory}
                  disabled={!active}
                  options={Object.keys(STARTUP_COSTS)}
                />
              </div>
            );
          })()}

          {/* 보고서 생성 버튼 */}
          <div style={{ padding: "12px 18px 16px" }}>
            <button
              disabled={!selectedDong && !selectedGu}
              onClick={() => {
                setReportOpen(true);
                setReportData(null);
                setReportLoading(true);
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
                const baseKeys = ["상권_개요", "인기_업종", "유동인구_분석"];
                const catKeys = [...baseKeys, "소비_패턴", "비용_수익", "기타_통계"];
                if (selectedDong) {
                  const dong = normalizeDongName(selectedDong.dongName);
                  const categoryParam = reportCategory ? `&category=${encodeURIComponent(reportCategory)}` : "";
                  const url = `${API}/api/report/?dong=${encodeURIComponent(dong)}${categoryParam}`;
                  const reqKeys = reportCategory ? catKeys : baseKeys;
                  const tryFetch = (left) => {
                    fetch(url).then((r) => r.json()).then((d) => {
                      const ai = d.ai_descriptions || {};
                      if (reqKeys.every((k) => ai[k])) {
                        setReportData({ ...d, _dong: dong }); setReportLoading(false);
                      } else if (left === 0) {
                        setReportData({ ...d, ai_descriptions: { ...ai, error: "AI 설명 생성에 실패했습니다." }, _dong: dong }); setReportLoading(false);
                      } else { setTimeout(() => tryFetch(left - 1), 3000); }
                    }).catch(() => { if (left > 0) setTimeout(() => tryFetch(left - 1), 3000); else setReportLoading(false); });
                  };
                  tryFetch(9);
                } else if (selectedGu) {
                  const dongs = guToDongsRef.current[selectedGu] || [];
                  const reqKeys = reportCategory ? catKeys : baseKeys;
                  const tryFetch = (left) => {
                    fetch(`${API}/api/gu-report/`, {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ gu: selectedGu, dongs, category: reportCategory }),
                    }).then((r) => r.json()).then((d) => {
                      const ai = d.ai_descriptions || {};
                      if (reqKeys.every((k) => ai[k])) {
                        setReportData({ ...d, _gu: selectedGu }); setReportLoading(false);
                      } else if (left === 0) {
                        setReportData({ ...d, ai_descriptions: { ...ai, error: "AI 설명 생성에 실패했습니다." }, _gu: selectedGu }); setReportLoading(false);
                      } else { setTimeout(() => tryFetch(left - 1), 3000); }
                    }).catch(() => { if (left > 0) setTimeout(() => tryFetch(left - 1), 3000); else setReportLoading(false); });
                  };
                  tryFetch(9);
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
          right: 82,
          zIndex: 20,
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 10,
          padding: "10px 16px",
          fontSize: 14,
          color: "#374151",
          boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
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
          right: 82,
          zIndex: 20,
          width: 240,
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          padding: "14px 14px 12px",
          boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
          transition: "right 0.22s ease-out",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>업종 필터</span>
            {storeCategoryFilter.length > 0 && (
              <button onClick={() => { setStoreCategoryFilter([]); setStoreDrillGroup(null); }}
                style={{ fontSize: 11, color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>
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
                      style={{ ...storeFilterChipStyle(active), ...(active ? { borderColor: STORE_CATEGORY_COLORS[cat], color: STORE_CATEGORY_COLORS[cat] } : {}) }}>
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
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: selectedCount > 0 ? "1px solid rgba(59,130,246,0.4)" : "1px solid #E5E7EB", background: selectedCount > 0 ? "#EFF6FF" : "#F9FAFB", color: selectedCount > 0 ? "#2563EB" : "#374151" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = selectedCount > 0 ? "#EFF6FF" : "#F9FAFB"; }}
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
            right: 20,
            zIndex: 10,
            width: 52,
            height: 52,
            borderRadius: 12,
            background: showStoreMarkers ? "#EFF6FF" : "#fff",
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
            <svg style={{ width: 22, height: 22, animation: "spin 0.8s linear infinite" }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round"/>
            </svg>
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
      <div style={{ ...zoomBtnGroupStyle, right: 20 }}>
        <button
          style={zoomBtnStyle}
          onClick={() => {
            const map = mapInstanceRef.current;
            if (map) map.setLevel(map.getLevel() - 1, { animate: true });
          }}
        >
          +
        </button>
        <div style={{ width: "100%", height: 1, background: "#E5E7EB" }} />
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

        {/* 드롭다운 (아래로 열림) */}

      {/* ── 호버 툴팁 (사이드바 오른쪽 하단) ── */}
      {hoveredDong && (
        <div className="anim-slide-up" style={{ ...tooltipStyle, left: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: hoveredDong.dongName ? 6 : 0 }}>
            <span style={tooltipLabel}>구</span>
            <span style={{ fontWeight: 700, color: "#111827", fontSize: 17 }}>{hoveredDong.guName}</span>
          </div>
          {hoveredDong.dongName && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={tooltipLabel}>행정동</span>
              <span style={{ fontWeight: 700, color: "#93B8EE", fontSize: 17 }}>{hoveredDong.dongName}</span>
            </div>
          )}
          <div style={{ color: "#6B7280", fontSize: 14, marginTop: 8, borderTop: "1px solid #E5E7EB", paddingTop: 6 }}>
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
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 2 }}>서울특별시</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{selectedGu} {guRankType === "revenue" ? "업종별 매출" : "업종별 상가 수"} 전체</div>
              </div>
              <button onClick={() => setGuRankModalOpen(false)} style={closeBtnStyle}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {guLoading ? (
                <p style={{ color: "#6B7280", fontSize: 15, textAlign: "center", padding: "24px 0" }}>불러오는 중...</p>
              ) : guRankType === "revenue" ? (
                <>
                  <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>업종별 매출 (전체 {industries.length}개)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {industries.map((item) => (
                      <div key={item["통합카테고리"]}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 14, color: "#374151" }}>{item["통합카테고리"]}</span>
                          <span style={{ fontSize: 14, color: "#6B7280" }}>{fmtRevenue(item["당월매출합"])}</span>
                        </div>
                        <div style={{ background: "#E5E7EB", borderRadius: 3, height: 5, overflow: "hidden" }}>
                          <div style={{ width: `${(item["당월매출합"] / maxRevenue) * 100}%`, height: "100%", background: "linear-gradient(90deg, #3B82F6, #60A5FA)", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>업종별 상가 수 (전체 {industries.length}개)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {storesSorted.map((item) => (
                      <div key={item["통합카테고리"]}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 14, color: "#374151" }}>{item["통합카테고리"]}</span>
                          <span style={{ fontSize: 14, color: "#6B7280" }}>{item["점포수"]}개</span>
                        </div>
                        <div style={{ background: "#E5E7EB", borderRadius: 3, height: 5, overflow: "hidden" }}>
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
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 2 }}>{selectedDong?.guName}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{selectedDong?.dongName} {rankType === "revenue" ? "업종별 매출" : "업종별 상가 수"} 전체</div>
              </div>
              <button onClick={() => setRankModalOpen(false)} style={closeBtnStyle}>✕</button>
            </div>

            {/* ── 연도/분기 선택 ── */}
            {availableQuarters.length > 0 && (() => {
              const years = [...new Set(availableQuarters.map((q) => Math.floor(q / 10)))];
              const activeYear = selectedQuarter ? Math.floor(selectedQuarter / 10) : Math.floor(availableQuarters[0] / 10);
              const quartersOfYear = availableQuarters.filter((q) => Math.floor(q / 10) === activeYear);
              return (
                <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 8, overflowX: "auto", paddingBottom: 2 }}>
                    {years.map((y) => (
                      <button
                        key={y}
                        onClick={() => {
                          const first = availableQuarters.find((q) => Math.floor(q / 10) === y);
                          setSelectedQuarter(first === availableQuarters[0] ? null : first);
                        }}
                        style={{ flexShrink: 0, padding: "4px 12px", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none", background: activeYear === y ? "#3B82F6" : "#F3F4F6", color: activeYear === y ? "#fff" : "#6B7280", transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s, color 0.15s" }}
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
                          style={{ flexShrink: 0, padding: "4px 14px", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer", border: isActive ? "1px solid #3B82F6" : "1px solid #E5E7EB", background: isActive ? "#EFF6FF" : "transparent", color: isActive ? "#2563EB" : "#6B7280", transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s, border-color 0.15s, color 0.15s" }}
                        >{q % 10}분기</button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div style={{ flex: 1, overflowY: "auto" }}>
              {dongLoading ? (
                <p style={{ color: "#6B7280", fontSize: 15, textAlign: "center", padding: "24px 0" }}>불러오는 중...</p>
              ) : rankType === "revenue" ? (
                <>
                  <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>업종별 매출 (전체 {industries.length}개)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {industries.map((item) => (
                      <div key={item["통합카테고리"]}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 14, color: "#374151" }}>{item["통합카테고리"]}</span>
                          <span style={{ fontSize: 14, color: "#6B7280" }}>{fmtRevenue(item["당월매출합"])}</span>
                        </div>
                        <div style={{ background: "#E5E7EB", borderRadius: 3, height: 5, overflow: "hidden" }}>
                          <div style={{ width: `${(item["당월매출합"] / maxRevenue) * 100}%`, height: "100%", background: "linear-gradient(90deg, #3B82F6, #60A5FA)", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>업종별 상가 수 (전체 {industries.length}개)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {storesSorted.map((item) => (
                      <div key={item["통합카테고리"]}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 14, color: "#374151" }}>{item["통합카테고리"]}</span>
                          <span style={{ fontSize: 14, color: "#6B7280" }}>{item["점포수"]}개</span>
                        </div>
                        <div style={{ background: "#E5E7EB", borderRadius: 3, height: 5, overflow: "hidden" }}>
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
        const fmtEok = (v) => v >= 1_000_000_000_000 ? `${Math.floor(v / 1_000_000_000_000)}조${Math.round((v % 1_000_000_000_000) / 100_000_000) > 0 ? ` ${Math.round((v % 1_000_000_000_000) / 100_000_000).toLocaleString()}억` : ""}` : v >= 100_000_000 ? `${Math.round(v / 100_000_000).toLocaleString()}억` : v >= 10_000 ? `${Math.round(v / 10_000)}만` : `${v}`;

        return (
          <div
            className="anim-panel-slide-in"
            style={{ ...secondPanelStyle, left: 0, overflowY: "auto" }}
          >
            {/* 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 2 }}>{selectedDong?.guName}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{selectedDong?.dongName} 상세 통계</div>
              </div>
              <button onClick={() => setDongStatsOpen(false)} style={closeBtnStyle}>✕</button>
            </div>

            {/* 성별 매출 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>성별 매출 비율</div>
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
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>주중 / 주말 매출</div>
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
                        <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color }}>{fmtEok(value)}</span>
                      </div>
                      <div style={{ height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${ratio}%`, background: color, borderRadius: 4, transition: "width 0.4s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 시간대별 매출 */}
            <div>
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>시간대별 매출</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
                {시간대목록.map(({ label, value }) => {
                  const heightPct = Math.round((value / 시간대최대) * 100);
                  const isTop = value === 시간대최대;
                  return (
                    <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 10, color: isTop ? "#2563EB" : "#6B7280", fontWeight: isTop ? 700 : 400 }}>{fmtEok(value)}</div>
                      <div style={{ width: "100%", height: 80, display: "flex", alignItems: "flex-end" }}>
                        <div style={{ width: "100%", height: `${heightPct}%`, background: isTop ? "#2563EB" : "#93C5FD", borderRadius: "4px 4px 0 0", transition: "height 0.4s" }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#6B7280", textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.3 }}>{label}</div>
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
              onClick={() => { setReportOpen(false); setSavedGuReportData(null); setSavedGuReportCategory(""); setSavedGuReportRegion(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                color: "#6B7280", fontSize: 12, fontWeight: 600,
                padding: 0, marginBottom: savedGuReportData && reportData?._dong ? 6 : 12,
              }}
            >
              ← 돌아가기
            </button>
            {savedGuReportData && reportData?._dong && (
              <button
                onClick={() => {
                  setReportData(savedGuReportData);
                  setReportCategory(savedGuReportCategory);
                  setReportRegion(savedGuReportRegion);
                  setSavedGuReportData(null);
                  setSavedGuReportCategory("");
                  setSavedGuReportRegion(null);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "#EFF6FF", border: "1px solid #BFDBFE",
                  borderRadius: 6, cursor: "pointer",
                  color: "#2563EB", fontSize: 12, fontWeight: 600,
                  padding: "4px 10px", marginBottom: 12,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#DBEAFE"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#EFF6FF"}
              >
                ← {savedGuReportRegion?.name || "구 보고서"}로 돌아가기
              </button>
            )}
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
                <div style={{ fontSize: 14, color: "#6B7280" }}>{[
                  "AI가 보고서를 작성하는 중입니다...",
                  "AI가 상권을 분석 중입니다...",
                  "AI가 데이터를 꼼꼼히 분석하고 있어요...",
                  "AI가 보고서를 정리 중입니다...",
                  "곧 완성됩니다...",
                ][reportLoadingStep]}</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : reportData ? (() => {
              const ai = reportData.ai_descriptions?.error ? {} : (reportData.ai_descriptions || {});
              const d = reportData.data || {};
              const cat = d.category_data;
              const fmtEok = (v) => !v ? "0" : v >= 1_000_000_000_000 ? `${Math.floor(v / 1_000_000_000_000)}조${Math.round((v % 1_000_000_000_000) / 100_000_000) > 0 ? ` ${Math.round((v % 1_000_000_000_000) / 100_000_000).toLocaleString()}억` : ""}` : v >= 100_000_000 ? `${Math.round(v / 100_000_000).toLocaleString()}억` : `${Math.round(v / 10_000)}만`;
              const fmtNum = (v) => v ? v.toLocaleString() : "0";
              const fmtPop = (v) => !v ? "0" : v >= 1_000_000_000_000 ? `${Math.floor(v / 1_000_000_000_000)}조${Math.round((v % 1_000_000_000_000) / 100_000_000) > 0 ? ` ${Math.round((v % 1_000_000_000_000) / 100_000_000).toLocaleString()}억` : ""}명` : v >= 100_000_000 ? `${Number((v / 100_000_000).toFixed(1)).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1})}억명` : v >= 10_000 ? `${Math.round(v / 10_000).toLocaleString()}만명` : `${v.toLocaleString()}명`;

              const SectionLabel = ({ num, title }) => (
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.05em", minWidth: 24 }}>{num}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</span>
                </div>
              );

              const aiError = reportData.ai_descriptions?.error;

              const retryReport = () => {
                const baseKeys = ["상권_개요", "인기_업종", "유동인구_분석"];
                const catKeys = ["상권_개요", "인기_업종", "유동인구_분석", "소비_패턴", "비용_수익", "기타_통계"];

                if (reportCategory) {
                  // 업종분석만 재시도 — 기본 보고서 데이터는 유지
                  setReportCategoryLoading(true);
                  if (reportData._dong) {
                    const dong = reportData._dong;
                    const url = `${API}/api/report/?dong=${encodeURIComponent(dong)}&category=${encodeURIComponent(reportCategory)}`;
                    const tryFetch = (left) => {
                      fetch(url).then((r) => r.json()).then((d) => {
                        const ai = d.ai_descriptions || {};
                        if (catKeys.every((k) => ai[k])) {
                          setReportData((prev) => ({ ...prev, ai_descriptions: ai, data: { ...prev.data, category_data: d.data?.category_data } }));
                          setReportCategoryLoading(false);
                        } else if (left === 0) {
                          setReportData((prev) => ({ ...prev, ai_descriptions: { ...ai, error: "AI 설명 생성에 실패했습니다." } }));
                          setReportCategoryLoading(false);
                        } else { setTimeout(() => tryFetch(left - 1), 3000); }
                      }).catch(() => { if (left > 0) setTimeout(() => tryFetch(left - 1), 3000); else setReportCategoryLoading(false); });
                    };
                    tryFetch(9);
                  } else if (reportData._gu) {
                    const gu = reportData._gu;
                    const dongs = guToDongsRef.current[gu] || [];
                    const tryFetch = (left) => {
                      fetch(`${API}/api/gu-report/`, {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ gu, dongs, category: reportCategory }),
                      }).then((r) => r.json()).then((d) => {
                        const ai = d.ai_descriptions || {};
                        if (catKeys.every((k) => ai[k])) {
                          setReportData((prev) => ({ ...prev, ai_descriptions: ai, data: { ...prev.data, category_data: d.data?.category_data } }));
                          setReportCategoryLoading(false);
                        } else if (left === 0) {
                          setReportData((prev) => ({ ...prev, ai_descriptions: { ...ai, error: "AI 설명 생성에 실패했습니다." } }));
                          setReportCategoryLoading(false);
                        } else { setTimeout(() => tryFetch(left - 1), 3000); }
                      }).catch(() => { if (left > 0) setTimeout(() => tryFetch(left - 1), 3000); else setReportCategoryLoading(false); });
                    };
                    tryFetch(9);
                  }
                } else {
                  // 기본 보고서 전체 재시도
                  setReportLoading(true);
                  if (reportData._dong) {
                    const dong = reportData._dong;
                    const url = `${API}/api/report/?dong=${encodeURIComponent(dong)}`;
                    const tryFetch = (left) => {
                      fetch(url).then((r) => r.json()).then((d) => {
                        const ai = d.ai_descriptions || {};
                        if (baseKeys.every((k) => ai[k])) {
                          setReportData({ ...d, _dong: dong }); setReportLoading(false);
                        } else if (left === 0) {
                          setReportData({ ...d, ai_descriptions: { ...ai, error: "AI 설명 생성에 실패했습니다." }, _dong: dong }); setReportLoading(false);
                        } else { setTimeout(() => tryFetch(left - 1), 3000); }
                      }).catch(() => { if (left > 0) setTimeout(() => tryFetch(left - 1), 3000); else setReportLoading(false); });
                    };
                    tryFetch(9);
                  } else if (reportData._gu) {
                    const gu = reportData._gu;
                    const dongs = guToDongsRef.current[gu] || [];
                    const tryFetch = (left) => {
                      fetch(`${API}/api/gu-report/`, {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ gu, dongs, category: "" }),
                      }).then((r) => r.json()).then((d) => {
                        const ai = d.ai_descriptions || {};
                        if (baseKeys.every((k) => ai[k])) {
                          setReportData({ ...d, _gu: gu }); setReportLoading(false);
                        } else if (left === 0) {
                          setReportData({ ...d, ai_descriptions: { ...ai, error: "AI 설명 생성에 실패했습니다." }, _gu: gu }); setReportLoading(false);
                        } else { setTimeout(() => tryFetch(left - 1), 3000); }
                      }).catch(() => { if (left > 0) setTimeout(() => tryFetch(left - 1), 3000); else setReportLoading(false); });
                    };
                    tryFetch(9);
                  }
                }
              };

              const AiText = ({ text }) => text ? (
                <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.85, margin: "0 0 20px 36px", wordBreak: "keep-all" }}>
                  {text}
                </p>
              ) : aiError ? (
                <div style={{ margin: "0 0 20px 36px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <p style={{ fontSize: 13, color: "#9CA3AF", margin: "0 0 12px 0", textAlign: "center" }}>
                    AI 설명을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                  </p>
                  {(reportCategoryLoading || reportLoading) ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#9CA3AF", fontSize: 13 }}>
                      <div style={{ width: 15, height: 15, border: "2px solid #E5E7EB", borderTop: "2px solid #6B7280", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                      재시도 중...
                    </div>
                  ) : (
                    <button
                      onClick={retryReport}
                      style={{ fontSize: 13, fontWeight: 600, color: "#374151", background: "#F3F4F6", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#E5E7EB"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#F3F4F6"}
                    >
                      다시 시도
                    </button>
                  )}
                </div>
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
                            background: i === 0 ? "#1D4ED8" : i === 1 ? "#3B82F6" : i === 2 ? "#93C5FD" : "#F3F4F6",
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
                    {d.요일별 && (() => {
                      const 요일목록 = ["월","화","수","목","금","토","일"];
                      const values = 요일목록.map(k => d.요일별[k] || 0);
                      const max = Math.max(...values, 1);
                      return (
                        <>
                          <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginTop: 16, marginBottom: 12 }}>요일별 매출</div>
                          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 80 }}>
                            {요일목록.map((day, i) => {
                              const v = values[i];
                              const h = Math.round((v / max) * 100);
                              const isWeekend = day === "토" || day === "일";
                              const isTop = v === max;
                              return (
                                <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                                  <div style={{ width: "100%", height: 58, display: "flex", alignItems: "flex-end" }}>
                                    <div style={{ width: "100%", height: `${h}%`, background: isWeekend ? "#FD8A8A" : (isTop ? "#93C6E7" : "#AEE2FF"), borderRadius: "3px 3px 0 0", transition: "height 0.4s" }} />
                                  </div>
                                  <div style={{ fontSize: 10, color: isWeekend ? "#E05C5C" : isTop ? "#4A8FAB" : "#9CA3AF" }}>{day}</div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
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
                        <div style={{ marginLeft: 24, textAlign: "center", padding: "20px 0", color: "#9CA3AF", fontSize: 13 }}>{[
                          "AI가 보고서를 작성하는 중입니다...",
                          "AI가 상권을 분석 중입니다...",
                          "AI가 데이터를 꼼꼼히 분석하고 있어요...",
                          "AI가 보고서를 정리 중입니다...",
                          "곧 완성됩니다...",
                        ][reportLoadingStep]}</div>
                      ) : (
                      <select
                        value={reportCategory}
                        onChange={(e) => {
                          const cat = e.target.value;
                          if (!cat) return;
                          setReportCategory(cat);
                          setReportCategoryLoading(true);
                          setGuDongRecommends(null);
                          setGuDongRecommendOpen(false);
                          const catKeys = ["상권_개요", "인기_업종", "유동인구_분석", "소비_패턴", "비용_수익", "기타_통계"];
                          if (selectedDong) {
                            const dong = normalizeDongName(selectedDong.dongName);
                            const url = `${API}/api/report/?dong=${encodeURIComponent(dong)}&category=${encodeURIComponent(cat)}`;
                            const tryFetch = (left) => {
                              fetch(url).then((r) => r.json()).then((data) => {
                                const ai = data.ai_descriptions || {};
                                if (catKeys.every((k) => ai[k])) {
                                  setReportData({ ...data, _dong: dong }); setReportCategoryLoading(false);
                                } else if (left === 0) {
                                  setReportData({ ...data, ai_descriptions: { ...ai, error: "AI 설명 생성에 실패했습니다." }, _dong: dong }); setReportCategoryLoading(false);
                                } else { setTimeout(() => tryFetch(left - 1), 3000); }
                              }).catch(() => { if (left > 0) setTimeout(() => tryFetch(left - 1), 3000); else setReportCategoryLoading(false); });
                            };
                            tryFetch(9);
                          } else if (selectedGu) {
                            const dongs = guToDongsRef.current[selectedGu] || [];
                            const tryFetch = (left) => {
                              fetch(`${API}/api/gu-report/`, {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ gu: selectedGu, dongs, category: cat }),
                              }).then((r) => r.json()).then((data) => {
                                const ai = data.ai_descriptions || {};
                                if (catKeys.every((k) => ai[k])) {
                                  setReportData({ ...data, _gu: selectedGu }); setReportCategoryLoading(false);
                                } else if (left === 0) {
                                  setReportData({ ...data, ai_descriptions: { ...ai, error: "AI 설명 생성에 실패했습니다." }, _gu: selectedGu }); setReportCategoryLoading(false);
                                } else { setTimeout(() => tryFetch(left - 1), 3000); }
                              }).catch(() => { if (left > 0) setTimeout(() => tryFetch(left - 1), 3000); else setReportCategoryLoading(false); });
                            };
                            tryFetch(9);
                          }
                        }}
                        style={{ marginLeft: 24, width: "calc(100% - 24px)", padding: "10px 12px", background: "#fff", border: "1px solid #D1D5DB", borderRadius: 8, color: "#374151", fontSize: 13, cursor: "pointer", outline: "none" }}
                      >
                        <option value="">업종 선택...</option>
                        {Object.keys(STARTUP_COSTS).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
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
                          setReportData((prev) => { const { category_data, ...restData } = prev.data || {}; return { ...prev, data: restData }; });
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
                                      <div style={{ width: "100%", height: `${h}%`, background: isTop ? "#2563EB" : "#93C5FD", borderRadius: "3px 3px 0 0", transition: "height 0.4s" }} />
                                    </div>
                                    <div style={{ fontSize: 10, color: isTop ? "#2563EB" : "#9CA3AF", textAlign: "center" }}>{label}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 요일별 매출 (업종) */}
                      {cat.요일별매출 && (() => {
                        const 요일목록 = ["월","화","수","목","금","토","일"];
                        const values = 요일목록.map(k => cat.요일별매출[k] || 0);
                        const max = Math.max(...values, 1);
                        return (
                          <div style={{ marginLeft: 24, marginBottom: 24 }}>
                            <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 12 }}>요일별 매출</div>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 90 }}>
                              {요일목록.map((day, i) => {
                                const v = values[i];
                                const h = Math.round((v / max) * 100);
                                const isWeekend = day === "토" || day === "일";
                                const isTop = v === max;
                                return (
                                  <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                    <div style={{ width: "100%", height: 68, display: "flex", alignItems: "flex-end" }}>
                                      <div style={{ width: "100%", height: `${h}%`, background: isWeekend ? "#FD8A8A" : (isTop ? "#93C6E7" : "#AEE2FF"), borderRadius: "3px 3px 0 0", transition: "height 0.4s" }} />
                                    </div>
                                    <div style={{ fontSize: 10, color: isWeekend ? "#E05C5C" : isTop ? "#4A8FAB" : "#9CA3AF" }}>{day}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 나이별 매출 금액 */}
                      {cat.나이별매출 && (() => {
                        const ages = ["10대","20대","30대","40대","50대","60대이상"];
                        const ageLabels = ["10대","20대","30대","40대","50대","60대+"];
                        const values = ages.map(k => cat.나이별매출[k] || 0);
                        const max = Math.max(...values, 1);
                        return (
                          <div style={{ marginLeft: 24, marginBottom: 24 }}>
                            <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 12 }}>나이별 매출</div>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 90 }}>
                              {ages.map((age, i) => {
                                const v = values[i];
                                const h = Math.round((v / max) * 100);
                                const isTop = v === max;
                                return (
                                  <div key={age} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                    <div style={{ width: "100%", height: 68, display: "flex", alignItems: "flex-end" }}>
                                      <div style={{ width: "100%", height: `${h}%`, background: isTop ? "#93C6E7" : "#B9F3FC", borderRadius: "3px 3px 0 0", transition: "height 0.4s" }} />
                                    </div>
                                    <div style={{ fontSize: 9, color: isTop ? "#4E8D9C" : "#9CA3AF", textAlign: "center" }}>{ageLabels[i]}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 나이별 결제 건수 */}
                      {cat.나이별건수 && (() => {
                        const ages = ["10대","20대","30대","40대","50대","60대이상"];
                        const ageLabels = ["10대","20대","30대","40대","50대","60대+"];
                        const values = ages.map(k => cat.나이별건수[k] || 0);
                        const max = Math.max(...values, 1);
                        return (
                          <div style={{ marginLeft: 24, marginBottom: 24 }}>
                            <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 12 }}>나이별 결제 건수</div>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 90 }}>
                              {ages.map((age, i) => {
                                const v = values[i];
                                const h = Math.round((v / max) * 100);
                                const isTop = v === max;
                                return (
                                  <div key={age} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                    <div style={{ width: "100%", height: 68, display: "flex", alignItems: "flex-end" }}>
                                      <div style={{ width: "100%", height: `${h}%`, background: isTop ? "#93C6E7" : "#AEE2FF", borderRadius: "3px 3px 0 0", transition: "height 0.4s" }} />
                                    </div>
                                    <div style={{ fontSize: 9, color: isTop ? "#4E8D9C" : "#9CA3AF", textAlign: "center" }}>{ageLabels[i]}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                    {/* 구 보고서 + 업종 심화분석 하단: AI 행정동 추천 (접기/펼치기) */}
                    {reportData?._gu && (
                      <div style={{ marginTop: 20, marginBottom: 4 }}>
                        <button
                          onClick={() => {
                            const next = !guDongRecommendOpen;
                            setGuDongRecommendOpen(next);
                            if (!next) setGuDongRecommends(null);
                          }}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "calc(100% - 24px)", marginLeft: 24, padding: "11px 14px", background: guDongRecommendOpen ? "#EFF6FF" : "#F9FAFB", border: `1px solid ${guDongRecommendOpen ? "#BFDBFE" : "#E5E7EB"}`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: guDongRecommendOpen ? "#2563EB" : "#374151", cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={(e) => { if (!guDongRecommendOpen) { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#2563EB"; } }}
                          onMouseLeave={(e) => { if (!guDongRecommendOpen) { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; } }}
                        >
                          <span>✨ AI 행정동 추천 보기</span>
                          <span style={{ fontSize: 11, color: guDongRecommendOpen ? "#2563EB" : "#9CA3AF" }}>{guDongRecommendOpen ? "▲ 닫기" : "▼ 열기"}</span>
                        </button>

                        {guDongRecommendOpen && (
                          <div style={{ marginTop: 10, marginLeft: 24 }}>
                            {guDongRecommendLoading ? (
                              <div style={{ textAlign: "center", padding: "20px 0", color: "#9CA3AF", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                <div style={{ width: 16, height: 16, border: "2px solid #E5E7EB", borderTop: "2px solid #6B7280", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                                AI가 최적 입지를 분석하는 중...
                              </div>
                            ) : guDongRecommends ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {guDongRecommends.slice(0, 5).map((item, i) => (
                                  <div key={item.dongName} style={{ background: "#F9FAFB", border: `1px solid ${i === 0 ? "#BFDBFE" : "#E5E7EB"}`, borderRadius: 10, padding: "12px 14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: i === 0 ? "#111827" : i === 1 ? "#6B7280" : "#E5E7EB", color: i < 2 ? "#fff" : "#9CA3AF", flexShrink: 0 }}>{i + 1}</span>
                                        <div>
                                          <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{item.dongName}</span>
                                          <span style={{ fontSize: 12, color: "#6B7280", marginLeft: 6 }}>{item.guName}</span>
                                        </div>
                                      </div>
                                      <div style={{ textAlign: "right" }}>
                                        <span style={{ fontSize: 20, fontWeight: 800, color: i === 0 ? "#2563EB" : "#111827" }}>{item.score}</span>
                                        <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 2 }}>점</span>
                                      </div>
                                    </div>
                                    <div style={{ fontSize: 12, color: "#374151", background: "#F3F4F6", borderRadius: 6, padding: "6px 8px", marginBottom: 8, lineHeight: 1.6 }}>
                                      {item.reason}
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                                      {(item.tags || []).map((tag) => (
                                        <span key={tag} style={{ fontSize: 11, color: "#3B82F6", background: "rgba(59,130,246,0.08)", borderRadius: 10, padding: "2px 7px", border: "1px solid rgba(59,130,246,0.2)" }}>{tag}</span>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => {
                                        const dong = item.dongName;
                                        setSavedGuReportData(reportData);
                                        setSavedGuReportCategory(reportCategory);
                                        setSavedGuReportRegion(reportRegion);
                                        setReportLoading(true);
                                        setGuDongRecommends(null);
                                        setGuDongRecommendOpen(false);
                                        const catKeys = ["상권_개요", "인기_업종", "유동인구_분석", "소비_패턴", "비용_수익", "기타_통계"];
                                        const url = `${API}/api/report/?dong=${encodeURIComponent(dong)}&category=${encodeURIComponent(reportCategory)}`;
                                        const tryFetch = (left) => {
                                          fetch(url).then((r) => r.json()).then((data) => {
                                            const ai = data.ai_descriptions || {};
                                            if (catKeys.every((k) => ai[k])) {
                                              setReportData({ ...data, _dong: dong }); setReportLoading(false);
                                            } else if (left === 0) {
                                              setReportData({ ...data, ai_descriptions: { ...ai, error: "AI 설명 생성에 실패했습니다." }, _dong: dong }); setReportLoading(false);
                                            } else { setTimeout(() => tryFetch(left - 1), 3000); }
                                          }).catch(() => { if (left > 0) setTimeout(() => tryFetch(left - 1), 3000); else setReportLoading(false); });
                                        };
                                        tryFetch(9);
                                      }}
                                      style={{ width: "100%", padding: "8px 0", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = "#374151"}
                                      onMouseLeave={(e) => e.currentTarget.style.background = "#111827"}
                                    >
                                      이 행정동 보고서 보기 →
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setGuDongRecommendLoading(true);
                                  fetch(`${API}/api/recommend/location/?업종=${encodeURIComponent(reportCategory)}&gu=${encodeURIComponent(reportData._gu)}`)
                                    .then((r) => r.json())
                                    .then((data) => {
                                      if (data.error) { alert(data.error); return; }
                                      setGuDongRecommends(data.results || []);
                                    })
                                    .catch(() => alert("추천 데이터를 불러오지 못했습니다."))
                                    .finally(() => setGuDongRecommendLoading(false));
                                }}
                                style={{ width: "100%", padding: "10px 0", background: "linear-gradient(90deg,#3B82F6,#6366F1)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                              >
                                ✨ AI 행정동 추천 받기
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

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

      {/* ── 지역 비교 오버레이 ── */}
      {compareRegionOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setCompareRegionOpen(false)}
        >
          <div className="anim-pop-in no-scrollbar" style={{ background: "#fff", borderRadius: 20, boxShadow: "0 20px 70px rgba(0,0,0,0.18)", border: "1px solid #E5E7EB", width: 520, maxHeight: "88vh", overflowY: "auto", padding: "24px", boxSizing: "border-box", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>⚖️</span>
                  <span style={{ fontSize: 19, fontWeight: 700, color: "#111827" }}>지역 비교</span>
                </div>
                <div style={{ fontSize: 13, color: "#6B7280", paddingLeft: 28 }}>업종을 선택하고 두 지역의 상권 지표를 비교합니다</div>
              </div>
              <button onClick={() => setCompareRegionOpen(false)} style={closeBtnStyle}>✕</button>
            </div>
            <div className="no-scrollbar" style={{ borderTop: "1px solid #E5E7EB", paddingTop: 16, flex: 1, overflowY: "auto" }}>
              {compareRegionStep === "loading" && (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontSize: 38, marginBottom: 16 }}>⚙️</div>
                  <div style={{ fontSize: 17, color: "#111827", fontWeight: 600, marginBottom: 8 }}>비교 분석 중입니다</div>
                  <div style={{ fontSize: 14, color: "#6B7280" }}>두 지역의 상권 지표를 비교하고 있습니다...</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
                    {[0, 1, 2].map((i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", opacity: 0.3 + i * 0.35 }} />)}
                  </div>
                </div>
              )}
              {compareRegionStep === "form" && (
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    {["dong", "gu"].map(t => (
                      <button key={t} onClick={() => { setCmpRegionType(t); setCmpRegionASelected(null); setCmpRegionBSelected(null); setCmpRegionAQuery(""); setCmpRegionBQuery(""); setCmpRegionASugg([]); setCmpRegionBSugg([]); }}
                        style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", border: cmpRegionType === t ? "2px solid #3B82F6" : "1.5px solid #E5E7EB", background: cmpRegionType === t ? "rgba(59,130,246,0.12)" : "#F9FAFB", color: cmpRegionType === t ? "#2563EB" : "#6B7280" }}>
                        {t === "dong" ? "🏘 행정동" : "🏙 구"}
                      </button>
                    ))}
                  </div>
                  {[
                    { label: "지역 A", query: cmpRegionAQuery, setQuery: setCmpRegionAQuery, sugg: cmpRegionASugg, setSugg: setCmpRegionASugg, selected: cmpRegionASelected, setSelected: setCmpRegionASelected, timer: cmpRegionATimer },
                    { label: "지역 B", query: cmpRegionBQuery, setQuery: setCmpRegionBQuery, sugg: cmpRegionBSugg, setSugg: setCmpRegionBSugg, selected: cmpRegionBSelected, setSelected: setCmpRegionBSelected, timer: cmpRegionBTimer },
                  ].map(({ label, query, setQuery, sugg, setSugg, selected, setSelected, timer }) => (
                    <div key={label} style={{ marginBottom: 14, position: "relative" }}>
                      <div style={aiSectionLabel}>
                        <span style={aiRequiredBadge}>필수</span> {label}
                        {selected && <span style={{ marginLeft: 8, color: "#2563EB", fontWeight: 600, fontSize: 13 }}>{cmpRegionType === "dong" ? `${selected.dong} (${selected.gu})` : selected}</span>}
                      </div>
                      <input value={query}
                        onChange={e => { const v = e.target.value; setQuery(v); setSelected(null); clearTimeout(timer.current); timer.current = setTimeout(() => searchRegionSuggest(v, cmpRegionType, setSugg), 200); }}
                        onBlur={() => setTimeout(() => setSugg([]), 150)}
                        placeholder={cmpRegionType === "dong" ? "예: 역삼, 합정" : "예: 강남, 마포"}
                        style={{ width: "100%", padding: "8px 12px", background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: sugg.length > 0 ? "8px 8px 0 0" : 8, color: "#111827", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                      />
                      {sugg.length > 0 && (
                        <div style={{ position: "absolute", zIndex: 10, width: "100%", background: "#fff", border: "1.5px solid #E5E7EB", borderTop: "none", borderRadius: "0 0 8px 8px", maxHeight: 180, overflowY: "auto" }}>
                          {sugg.map((s, i) => (
                            <div key={i} onMouseDown={() => { setSelected(s); setQuery(cmpRegionType === "dong" ? s.dong : s); setSugg([]); }}
                              style={{ padding: "7px 12px", cursor: "pointer", fontSize: 13, borderBottom: i < sugg.length - 1 ? "1px solid #F3F4F6" : "none", display: "flex", justifyContent: "space-between" }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.08)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <span style={{ color: "#111827" }}>{cmpRegionType === "dong" ? s.dong : s}</span>
                              {cmpRegionType === "dong" && <span style={{ fontSize: 11, color: "#2563EB", background: "rgba(59,130,246,0.15)", padding: "2px 7px", borderRadius: 10 }}>{s.gu}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ marginBottom: 12 }}>
                    <div style={aiSectionLabel}>
                      <span style={aiRequiredBadge}>필수</span> 비교 업종
                      {cmpRegionCat && <span style={{ marginLeft: 8, color: "#2563EB", fontWeight: 600, fontSize: 13 }}>{CATEGORY_EMOJI[cmpRegionCat] ?? "🏪"} {cmpRegionCat}</span>}
                    </div>
                    <button onClick={() => setCmpRegionPickerOpen(o => !o)} style={{ width: "100%", padding: "8px 12px", background: "#F9FAFB", border: `1.5px solid ${cmpRegionPickerOpen ? "#3B82F6" : "#E5E7EB"}`, borderRadius: 8, color: cmpRegionCat ? "#2563EB" : "#9CA3AF", fontSize: 14, cursor: "pointer", textAlign: "left" }}>
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
                                  style={{ padding: "4px 9px", borderRadius: 16, cursor: "pointer", fontSize: 12, border: `1.5px solid ${cmpRegionCat === c ? "#3B82F6" : "#E5E7EB"}`, background: cmpRegionCat === c ? "#DBEAFE" : "#F9FAFB", color: cmpRegionCat === c ? "#2563EB" : "#374151" }}>
                                  {CATEGORY_EMOJI[c] ?? "🏪"} {c}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {DRILL_GROUPS.map(group => {
                              const Meta = DRILL_GROUP_META[group];
                              const GroupIcon = Meta.icon;
                              return (
                                <button key={group} onClick={() => setCmpRegionDrillGroup(group)}
                                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderRadius: 10, fontSize: 14, cursor: "pointer", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", transition: "background 0.15s" }}
                                  onMouseEnter={e => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#2563EB"; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; }}
                                >
                                  <span style={{ display: "flex", alignItems: "center", gap: 7 }}><GroupIcon size={15} color={Meta.iconColor} strokeWidth={1.8} />{group}</span>
                                  <span style={{ color: "#6B7280", fontSize: 11 }}>{CATEGORY_GROUPS[group].length}개 →</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {(() => {
                    const nameA = cmpRegionType === "dong" ? cmpRegionASelected?.dong : cmpRegionASelected;
                    const nameB = cmpRegionType === "dong" ? cmpRegionBSelected?.dong : cmpRegionBSelected;
                    const disabled = !nameA || !nameB || !cmpRegionCat;
                    return (
                      <button onClick={handleCompareRegion} disabled={disabled} style={{ width: "100%", padding: "13px 0", background: disabled ? "#E5E7EB" : "linear-gradient(135deg,#2563EB,#3B82F6)", color: disabled ? "#9CA3AF" : "#fff", border: "none", borderRadius: 12, fontSize: 17, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", marginTop: 4 }}>
                        ⚖️ 비교 시작
                      </button>
                    );
                  })()}
                </div>
              )}
              {compareRegionStep === "result" && compareRegionResults?.a && (() => {
                const { a, b, type, category, quarter } = compareRegionResults;
                const METRICS = [
                  { key: "점포수", label: "점포수", fmt: v => `${v}개` },
                  { key: "월매출", label: "월 매출합", fmt: v => v >= 1e8 ? `${Number((v/1e8).toFixed(1)).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1})}억` : `${(v/1e4).toFixed(0)}만` },
                  { key: "점포당매출", label: "점포당 매출", fmt: v => v >= 1e8 ? `${Number((v/1e8).toFixed(1)).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1})}억` : `${Math.round(v/1e4)}만` },
                  { key: "경쟁강도", label: "경쟁강도", fmt: v => `${v}` },
                  { key: "업종_포화도", label: "업종 포화도", fmt: v => `${v}%` },
                  { key: "업종_매출점유율", label: "매출 점유율", fmt: v => `${v}%` },
                  { key: "개업률", label: "개업률", fmt: v => `${v}%` },
                  { key: "폐업률", label: "폐업률", fmt: v => `${v}%` },
                  { key: "성장확률", label: "AI 성장확률", fmt: v => `${v}%` },
                ];
                const reverseKeys = new Set(["경쟁강도", "업종_포화도", "폐업률"]);
                return (
                  <div>
                    <button onClick={() => setCompareRegionStep("form")} style={{ fontSize: 14, color: "#34D399", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "0 0 16px 0" }}>← 다시 비교</button>
                    <div style={{ textAlign: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, background: "rgba(52,211,153,0.10)", color: "#059669", padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>{CATEGORY_EMOJI[category] ?? "🏪"} {category}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                      <div />
                      {[a, b].map((r, i) => (
                        <div key={i} style={{ textAlign: "center", padding: "10px 6px", borderRadius: 10, background: i===0?"rgba(52,211,153,0.08)":"#EFF6FF", border: `1.5px solid ${i===0?"rgba(52,211,153,0.3)":"#BFDBFE"}` }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: i===0?"#059669":"#2563EB" }}>{r.name}</div>
                          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>등급 {r.등급} · {type==="dong"?"행정동":"구"}</div>
                        </div>
                      ))}
                    </div>
                    {METRICS.map(({ key, label, fmt }) => {
                      const vA = a[key]??0, vB = b[key]??0;
                      const isReverse = reverseKeys.has(key);
                      const aBetter = isReverse ? vA < vB : vA > vB;
                      const bBetter = isReverse ? vB < vA : vB > vA;
                      return (
                        <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6, alignItems: "center" }}>
                          <div style={{ fontSize: 12, color: "#6B7280", textAlign: "center" }}>{label}</div>
                          {[{v:vA,better:aBetter},{v:vB,better:bBetter}].map(({v,better},i) => (
                            <div key={i} style={{ textAlign: "center", padding: "7px 4px", borderRadius: 8, background: better?(i===0?"rgba(52,211,153,0.08)":"#EFF6FF"):"#F9FAFB", border: `1px solid ${better?(i===0?"rgba(52,211,153,0.25)":"#BFDBFE"):"#E5E7EB"}` }}>
                              <span style={{ fontSize: 13, fontWeight: better?700:400, color: better?(i===0?"#059669":"#2563EB"):"#374151" }}>{fmt(v)}</span>
                              {better && <span style={{ marginLeft: 3, fontSize: 10, color: i===0?"#059669":"#2563EB" }}>▲</span>}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 10, fontSize: 12, color: "#666", textAlign: "center" }}>기준 분기: {quarter}</div>
                    {(() => {
                      const weights = { 성장확률: 3, 월매출: 2.5, 점포당매출: 2, 개업률: 1 };
                      const reverseW = new Set(["경쟁강도","업종_포화도","폐업률"]);
                      let sA = 0, sB = 0;
                      for (const [k, w] of Object.entries(weights)) { if ((a[k]??0)>(b[k]??0)) sA+=w; else if ((b[k]??0)>(a[k]??0)) sB+=w; }
                      for (const k of reverseW) { if ((a[k]??0)<(b[k]??0)) sA+=1; else if ((b[k]??0)<(a[k]??0)) sB+=1; }
                      const winner = sA>=sB?a:b, loser = sA>=sB?b:a;
                      const fmtM = v => v>=1e8?`${Number((v/1e8).toFixed(1)).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1})}억원`:`${Math.round(v/1e4)}만원`;
                      const reasons = [];
                      if (winner.성장확률>loser.성장확률) reasons.push(`AI 성장확률(${winner.성장확률}%)이 ${loser.name}(${loser.성장확률}%)보다 높아 향후 성장 가능성이 큽니다.`);
                      if (winner.월매출>loser.월매출) { const r=loser.월매출>0?((winner.월매출/loser.월매출-1)*100).toFixed(0):100; reasons.push(`${category} 업종 월매출이 ${loser.name}보다 ${r}% 높은 ${fmtM(winner.월매출)}입니다.`); }
                      if (winner.점포당매출>loser.점포당매출) reasons.push(`점포당 매출(${fmtM(winner.점포당매출)})이 더 높아 개별 점포의 수익성이 우수합니다.`);
                      if ((winner.경쟁강도??0)<(loser.경쟁강도??0)) reasons.push(`경쟁강도(${winner.경쟁강도})가 낮아 ${category} 창업 시 경쟁 부담이 적습니다.`);
                      if ((winner.폐업률??0)<(loser.폐업률??0)) reasons.push(`폐업률(${winner.폐업률}%)이 낮아 업종 생존율이 높은 안정적인 상권입니다.`);
                      const top = reasons.slice(0,3);
                      return (
                        <div style={{ marginTop: 16, padding: "16px", background: "#F0FDF4", borderRadius: 12, border: "1.5px solid #86EFAC" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <span style={{ fontSize: 18 }}>💡</span>
                            <span style={{ fontSize: 13, color: "#6B7280" }}>{category} 창업 추천 지역</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: sA>=sB?"#059669":"#2563EB", marginLeft: 4 }}>{winner.name}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                            {top.map((r,i) => (
                              <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                                <span style={{ color: sA>=sB?"#059669":"#2563EB", fontSize: 13, flexShrink: 0, marginTop: 1 }}>✔</span>
                                <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── 업종 비교 오버레이 ── */}
      {compareIndustryOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setCompareIndustryOpen(false)}
        >
          <div className="anim-pop-in no-scrollbar" style={{ background: "#fff", borderRadius: 20, boxShadow: "0 20px 70px rgba(0,0,0,0.18)", border: "1px solid #E5E7EB", width: 520, maxHeight: "88vh", overflowY: "auto", padding: "24px", boxSizing: "border-box", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>📈</span>
                  <span style={{ fontSize: 19, fontWeight: 700, color: "#111827" }}>업종 비교</span>
                </div>
                <div style={{ fontSize: 13, color: "#6B7280", paddingLeft: 28 }}>한 지역 안에서 두 업종의 주요 지표를 비교합니다</div>
              </div>
              <button onClick={() => setCompareIndustryOpen(false)} style={closeBtnStyle}>✕</button>
            </div>
            <div className="no-scrollbar" style={{ borderTop: "1px solid #E5E7EB", paddingTop: 16, flex: 1, overflowY: "auto" }}>
              {compareIndustryStep === "loading" && (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontSize: 38, marginBottom: 16 }}>⚙️</div>
                  <div style={{ fontSize: 17, color: "#111827", fontWeight: 600, marginBottom: 8 }}>비교 분석 중입니다</div>
                  <div style={{ fontSize: 14, color: "#6B7280" }}>두 업종의 상권 지표를 비교하고 있습니다...</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
                    {[0, 1, 2].map((i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#38BDF8", opacity: 0.3 + i * 0.35 }} />)}
                  </div>
                </div>
              )}
              {compareIndustryStep === "form" && (
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    {["dong", "gu"].map(t => (
                      <button key={t} onClick={() => { setCmpIndRegionType(t); setCmpIndRegionSelected(null); setCmpIndRegionQuery(""); setCmpIndRegionSugg([]); }}
                        style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", border: cmpIndRegionType === t ? "2px solid #38BDF8" : "1.5px solid #E5E7EB", background: cmpIndRegionType === t ? "rgba(56,189,248,0.12)" : "#F9FAFB", color: cmpIndRegionType === t ? "#0EA5E9" : "#6B7280" }}>
                        {t === "dong" ? "🏘 행정동" : "🏙 구"}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginBottom: 16, position: "relative" }}>
                    <div style={aiSectionLabel}>
                      <span style={aiRequiredBadge}>필수</span> 비교할 지역
                      {cmpIndRegionSelected && <span style={{ marginLeft: 8, color: "#0EA5E9", fontWeight: 600, fontSize: 13 }}>{cmpIndRegionType==="dong"?`${cmpIndRegionSelected.dong} (${cmpIndRegionSelected.gu})`:cmpIndRegionSelected}</span>}
                    </div>
                    <input value={cmpIndRegionQuery}
                      onChange={e => { const v=e.target.value; setCmpIndRegionQuery(v); setCmpIndRegionSelected(null); clearTimeout(cmpIndRegionTimer.current); cmpIndRegionTimer.current=setTimeout(()=>searchRegionSuggest(v,cmpIndRegionType,setCmpIndRegionSugg),200); }}
                      onBlur={() => setTimeout(()=>setCmpIndRegionSugg([]),150)}
                      placeholder={cmpIndRegionType==="dong"?"예: 역삼, 합정":"예: 강남, 마포"}
                      style={{ width:"100%", padding:"8px 12px", background:"#F9FAFB", border:"1.5px solid #E5E7EB", borderRadius:cmpIndRegionSugg.length>0?"8px 8px 0 0":8, color:"#111827", fontSize:14, outline:"none", boxSizing:"border-box" }}
                    />
                    {cmpIndRegionSugg.length > 0 && (
                      <div style={{ position:"absolute", zIndex:10, width:"100%", background:"#fff", border:"1.5px solid #E5E7EB", borderTop:"none", borderRadius:"0 0 8px 8px", maxHeight:180, overflowY:"auto" }}>
                        {cmpIndRegionSugg.map((s,i) => (
                          <div key={i} onMouseDown={() => { setCmpIndRegionSelected(s); setCmpIndRegionQuery(cmpIndRegionType==="dong"?s.dong:s); setCmpIndRegionSugg([]); }}
                            style={{ padding:"7px 12px", cursor:"pointer", fontSize:13, borderBottom:i<cmpIndRegionSugg.length-1?"1px solid #F3F4F6":"none", display:"flex", justifyContent:"space-between" }}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(56,189,248,0.08)"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                          >
                            <span style={{ color:"#111827" }}>{cmpIndRegionType==="dong"?s.dong:s}</span>
                            {cmpIndRegionType==="dong"&&<span style={{ fontSize:11, color:"#0EA5E9", background:"rgba(56,189,248,0.15)", padding:"2px 7px", borderRadius:10 }}>{s.gu}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {[
                    { label:"업종 A", cat:cmpIndCatA, setCat:setCmpIndCatA, target:"a", color:"#0EA5E9" },
                    { label:"업종 B", cat:cmpIndCatB, setCat:setCmpIndCatB, target:"b", color:"#38BDF8" },
                  ].map(({label,cat,setCat,target,color}) => (
                    <div key={label} style={{ marginBottom: 12 }}>
                      <div style={aiSectionLabel}>
                        <span style={aiRequiredBadge}>필수</span> {label}
                        {cat && <span style={{ marginLeft:8, color, fontWeight:600, fontSize:13 }}>{CATEGORY_EMOJI[cat]??"🏪"} {cat}</span>}
                      </div>
                      <button onClick={() => setCmpIndPickerTarget(cmpIndPickerTarget===target?null:target)}
                        style={{ width:"100%", padding:"8px 12px", background:"#F9FAFB", border:`1.5px solid ${cmpIndPickerTarget===target?color:"#E5E7EB"}`, borderRadius:8, color:cat?color:"#9CA3AF", fontSize:14, cursor:"pointer", textAlign:"left" }}>
                        {cat?`${CATEGORY_EMOJI[cat]??"🏪"} ${cat}`:"업종을 선택하세요 ▾"}
                      </button>
                      {cmpIndPickerTarget===target && (
                        <div style={{ marginTop:8 }}>
                          {cmpIndDrillGroup ? (
                            <>
                              <button onClick={()=>setCmpIndDrillGroup(null)} style={{ fontSize:12, color:"#3B82F6", background:"none", border:"none", cursor:"pointer", fontWeight:600, padding:"0 0 8px 0" }}>← {cmpIndDrillGroup}</button>
                              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                                {CATEGORY_GROUPS[cmpIndDrillGroup].map(c=>(
                                  <button key={c} onClick={()=>{setCat(c);setCmpIndPickerTarget(null);setCmpIndDrillGroup(null);}}
                                    style={{ padding:"4px 9px", borderRadius:16, cursor:"pointer", fontSize:12, border:`1.5px solid ${cat===c?color:"#E5E7EB"}`, background:cat===c?"#E0F2FE":"#F9FAFB", color:cat===c?color:"#374151" }}>
                                    {CATEGORY_EMOJI[c]??"🏪"} {c}
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                              {DRILL_GROUPS.map(group => {
                                const Meta = DRILL_GROUP_META[group];
                                const GroupIcon = Meta.icon;
                                return (
                                  <button key={group} onClick={()=>setCmpIndDrillGroup(group)}
                                    style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 14px", borderRadius:10, fontSize:14, cursor:"pointer", border:"1px solid #E5E7EB", background:"#F9FAFB", color:"#374151", transition:"background 0.15s" }}
                                    onMouseEnter={e=>{e.currentTarget.style.background="#E0F2FE";e.currentTarget.style.color="#0EA5E9";}}
                                    onMouseLeave={e=>{e.currentTarget.style.background="#F9FAFB";e.currentTarget.style.color="#374151";}}
                                  >
                                    <span style={{ display:"flex", alignItems:"center", gap:7 }}><GroupIcon size={15} color={Meta.iconColor} strokeWidth={1.8} />{group}</span>
                                    <span style={{ color:"#6B7280", fontSize:11 }}>{CATEGORY_GROUPS[group].length}개 →</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {(() => {
                    const rName = cmpIndRegionType==="dong"?cmpIndRegionSelected?.dong:cmpIndRegionSelected;
                    const disabled = !rName || !cmpIndCatA || !cmpIndCatB;
                    return (
                      <button onClick={handleCompareIndustry} disabled={disabled} style={{ width:"100%", padding:"13px 0", background:disabled?"#E5E7EB":"linear-gradient(135deg,#0EA5E9,#38BDF8)", color:disabled?"#9CA3AF":"#fff", border:"none", borderRadius:12, fontSize:17, fontWeight:700, cursor:disabled?"not-allowed":"pointer", marginTop:4 }}>
                        📈 비교 시작
                      </button>
                    );
                  })()}
                </div>
              )}
              {compareIndustryStep === "result" && compareIndustryResults?.a && (() => {
                const { a, b, region, region_type } = compareIndustryResults;
                const METRICS = [
                  { key:"점포수", label:"점포수", fmt:v=>`${v}개` },
                  { key:"월매출", label:"월 매출합", fmt:v=>v>=1e8?`${Number((v/1e8).toFixed(1)).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1})}억`:`${(v/1e4).toFixed(0)}만` },
                  { key:"점포당매출", label:"점포당 매출", fmt:v=>v>=1e8?`${Number((v/1e8).toFixed(1)).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1})}억`:`${Math.round(v/1e4)}만` },
                  { key:"경쟁강도", label:"경쟁강도", fmt:v=>`${v}` },
                  { key:"업종_포화도", label:"업종 포화도", fmt:v=>`${v}%` },
                  { key:"업종_매출점유율", label:"매출 점유율", fmt:v=>`${v}%` },
                  { key:"개업률", label:"개업률", fmt:v=>`${v}%` },
                  { key:"폐업률", label:"폐업률", fmt:v=>`${v}%` },
                  { key:"성장확률", label:"AI 성장확률", fmt:v=>`${v}%` },
                ];
                const reverseKeys = new Set(["경쟁강도","업종_포화도","폐업률"]);
                return (
                  <div>
                    <button onClick={()=>setCompareIndustryStep("form")} style={{ fontSize:14, color:"#F59E0B", background:"none", border:"none", cursor:"pointer", fontWeight:600, padding:"0 0 16px 0" }}>← 다시 비교</button>
                    <div style={{ textAlign:"center", fontSize:12, color:"#6B7280", marginBottom:10 }}>{region} ({region_type==="dong"?"행정동":"구"})</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:12 }}>
                      <div />
                      {[a,b].map((r,i)=>(
                        <div key={i} style={{ textAlign:"center", padding:"10px 6px", borderRadius:10, background:i===0?"rgba(52,211,153,0.08)":"rgba(248,113,113,0.08)", border:`1.5px solid ${i===0?"rgba(52,211,153,0.3)":"rgba(248,113,113,0.3)"}` }}>
                          <div style={{ fontSize:13, fontWeight:700, color:i===0?"#059669":"#DC2626" }}>{CATEGORY_EMOJI[r.category]??"🏪"} {r.category}</div>
                          <div style={{ fontSize:11, color:"#6B7280", marginTop:2 }}>등급 {r.등급}</div>
                        </div>
                      ))}
                    </div>
                    {METRICS.map(({key,label,fmt})=>{
                      const vA=a[key]??0, vB=b[key]??0;
                      const isRev=reverseKeys.has(key);
                      const aBetter=isRev?vA<vB:vA>vB, bBetter=isRev?vB<vA:vB>vA;
                      return (
                        <div key={key} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:6, alignItems:"center" }}>
                          <div style={{ fontSize:12, color:"#6B7280", textAlign:"center" }}>{label}</div>
                          {[{v:vA,better:aBetter,idx:0},{v:vB,better:bBetter,idx:1}].map(({v,better,idx})=>(
                            <div key={idx} style={{ textAlign:"center", padding:"7px 4px", borderRadius:8, background:better?(idx===0?"rgba(52,211,153,0.08)":"rgba(248,113,113,0.08)"):"#F9FAFB", border:`1px solid ${better?(idx===0?"rgba(52,211,153,0.25)":"rgba(248,113,113,0.25)"):"#E5E7EB"}` }}>
                              <span style={{ fontSize:13, fontWeight:better?700:400, color:better?(idx===0?"#059669":"#DC2626"):"#374151" }}>{fmt(v)}</span>
                              {better&&<span style={{ marginLeft:3, fontSize:10, color:idx===0?"#059669":"#DC2626" }}>▲</span>}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {(() => {
                      const W={성장확률:3,점포당매출:2.5,업종_매출점유율:2,개업률:1.5}, REV={경쟁강도:2,업종_포화도:1.5,폐업률:1};
                      let sA=0,sB=0;
                      for(const[k,w]of Object.entries(W)){if((a[k]??0)>(b[k]??0))sA+=w;else if((b[k]??0)>(a[k]??0))sB+=w;}
                      for(const[k,w]of Object.entries(REV)){if((a[k]??0)<(b[k]??0))sA+=w;else if((b[k]??0)<(a[k]??0))sB+=w;}
                      const winner=sA>=sB?a:b, loser=sA>=sB?b:a;
                      const fmtM=v=>v>=1e8?`${Number((v/1e8).toFixed(1)).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1})}억원`:`${Math.round(v/1e4)}만원`;
                      const reasons=[];
                      if((winner.성장확률??0)>(loser.성장확률??0))reasons.push(`AI 성장확률이 ${winner.성장확률}%로 ${loser.category}(${loser.성장확률}%)보다 높아 향후 매출 성장 가능성이 큽니다.`);
                      if((winner.점포당매출??0)>(loser.점포당매출??0)){const r=((winner.점포당매출/loser.점포당매출-1)*100).toFixed(0);reasons.push(`점포당 월 평균 매출이 ${fmtM(winner.점포당매출)}으로 ${loser.category}보다 ${r}% 높아 수익성이 우수합니다.`);}
                      if((winner.경쟁강도??0)<(loser.경쟁강도??0))reasons.push(`경쟁강도(${winner.경쟁강도})가 낮아 신규 진입 시 경쟁 부담이 적습니다.`);
                      if((winner.폐업률??0)<(loser.폐업률??0))reasons.push(`폐업률(${winner.폐업률}%)이 낮아 ${region}에서 안정적으로 운영되는 업종입니다.`);
                      const top=reasons.slice(0,3);
                      return (
                        <div style={{ marginTop:16, padding:"16px", background:"#F0FDF4", borderRadius:12, border:`1.5px solid ${sA>=sB?"#86EFAC":"#FCA5A5"}` }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                            <span style={{ fontSize:18 }}>💡</span>
                            <span style={{ fontSize:13, color:"#6B7280" }}>추천 업종</span>
                            <span style={{ fontSize:16, fontWeight:800, color:sA>=sB?"#059669":"#DC2626", marginLeft:4 }}>{CATEGORY_EMOJI[winner.category]??"🏪"} {winner.category}</span>
                            <span style={{ fontSize:12, background:sA>=sB?"rgba(52,211,153,0.12)":"rgba(248,113,113,0.12)", color:sA>=sB?"#059669":"#DC2626", padding:"2px 8px", borderRadius:10, fontWeight:600 }}>등급 {winner.등급}</span>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                            {top.map((r,i)=>(
                              <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start" }}>
                                <span style={{ color:sA>=sB?"#059669":"#DC2626", fontSize:13, flexShrink:0, marginTop:1 }}>✔</span>
                                <span style={{ fontSize:13, color:"#374151", lineHeight:1.6 }}>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── AI 추천 모달 — 블록 1: 모드선택/폼/로딩 (중앙 모달) ── */}
      {aiModalOpen && !["result", "spot_loading", "spot"].includes(aiStep) && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => { setAiModalOpen(false); clearSpotMarkers(); setShowIndustryPicker(false); }}
        >
        <div
          className="anim-pop-in"
          style={{ background: "#fff", borderRadius: 20, boxShadow: "0 20px 70px rgba(0,0,0,0.18)", border: "1px solid #E5E7EB", width: 600, maxHeight: "88vh", overflowY: "auto", padding: "28px", boxSizing: "border-box", display: "flex", flexDirection: "column" }}
          onClick={(e) => e.stopPropagation()}
        >
            {/* 기존 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Bot size={20} color="#3B82F6" strokeWidth={1.6} />
                  <span style={{ fontSize: 19, fontWeight: 700, color: "#111827" }}>AI 상권 추천</span>
                </div>
                {aiStep === "mode" ? (
                  <div style={{ paddingLeft: 6, marginTop: 6, position: "relative", display: "inline-block" }}>
                    {/* 꼬리 외곽선 */}
                    <div style={{ position: "absolute", top: -9, left: 12, width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "9px solid #BFDBFE" }} />
                    {/* 꼬리 내부 (배경색) */}
                    <div style={{ position: "absolute", top: -7, left: 13, width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: "8px solid #EFF6FF" }} />
                    <div style={{ fontSize: 13, color: "#374151", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "7px 14px", boxShadow: "0 2px 8px rgba(59,130,246,0.1)" }}>
                      어떤 도움이 필요하세요?
                    </div>
                  </div>
                ) : (
                  <div style={{ paddingLeft: 6, marginTop: 6, position: "relative", display: "inline-block" }}>
                    <div style={{ position: "absolute", top: -9, left: 12, width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "9px solid #BFDBFE" }} />
                    <div style={{ position: "absolute", top: -7, left: 13, width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: "8px solid #EFF6FF" }} />
                    <div style={{ fontSize: 13, color: "#374151", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "7px 14px", boxShadow: "0 2px 8px rgba(59,130,246,0.1)" }}>
                      {aiStep === "form" && AI_MODE_META[aiMode]?.desc}
                      {aiStep === "loading" && "AI가 분석하고 있습니다"}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => { setAiModalOpen(false); clearSpotMarkers(); }} style={closeBtnStyle}>✕</button>
            </div>

            <div className="no-scrollbar" style={{ borderTop: "1px solid #E5E7EB", paddingTop: 16, flex: 1, overflowY: "auto" }}>

              {/* ── 모드 선택 단계 ── */}
              {aiStep === "mode" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { mode: "dong",     label: "업종은 정했는데, 구를 못정했어요" },
                      { mode: "industry", label: "행정동은 정했는데, 업종을 못정했어요" },
                      { mode: "gu",       label: "업종·구는 정했는데, 행정동을 못정했어요" },
                      { mode: "score",    label: "업종·구·행정동 모두 정했어요" },
                    ].map(({ mode, label }) => {
                      const checked = aiMode === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => setAiMode(mode)}
                          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 16px", borderRadius: 12, border: checked ? "2px solid #3B82F6" : "1.5px solid #E5E7EB", background: checked ? "rgba(59,130,246,0.06)" : "#F9FAFB", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                        >
                          <span style={{ width: 20, height: 20, borderRadius: "50%", border: checked ? "none" : "2px solid #D1D5DB", background: checked ? "#3B82F6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                            {checked && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "block" }} />}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: checked ? 600 : 400, color: checked ? "#1D4ED8" : "#374151" }}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    disabled={!aiMode}
                    onClick={() => { setAiStep("form"); setAiIndustry(null); setAiDong(""); setAiGu(""); setAiIndustrySearchQuery(""); setAiIndustryDrillGroup(null); setDongLocReady(false); setDongLocChoice(null); setAiDongSubMode(null); }}
                    style={{ width: "100%", padding: "13px 0", background: aiMode ? "linear-gradient(135deg, #2563EB, #3B82F6)" : "#E5E7EB", color: aiMode ? "#fff" : "#9CA3AF", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: aiMode ? "pointer" : "not-allowed", transition: "all 0.2s" }}
                  >
                    다음 →
                  </button>
                </div>
              )}

              {/* ── 폼 단계 ── */}
              {aiStep === "form" && (
                <>
                  <button
                    onClick={() => {
                      if (aiMode === "dong" && dongLocReady) {
                        setDongLocReady(false); setDongLocChoice(null);
                      } else {
                        setAiStep("mode"); setAiMode(null); setDongLocReady(false); setDongLocChoice(null); setAiDongSubMode(null);
                      }
                    }}
                    style={{ fontSize: 14, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "0 0 16px 0" }}
                  >
                    ← 다시 선택
                  </button>

                  {/* ── dong 모드: 업종 선택 → 구 추천 ── */}
                  {aiMode === "dong" && (
                    <div>
                      <div style={aiSectionLabel}>
                        <span style={aiRequiredBadge}>필수</span> 창업 업종 선택
                        {aiIndustry && <span style={{ marginLeft: 8, fontSize: 13, color: "#93B8EE", fontWeight: 600 }}>{aiIndustry}</span>}
                      </div>
                      <input type="text" placeholder="업종 검색... (예: 치킨, 네일, 한의원)"
                        value={aiIndustrySearchQuery}
                        onChange={(e) => {
                          const v = e.target.value; setAiIndustrySearchQuery(v);
                          clearTimeout(aiIndustrySuggestTimer.current);
                          if (v.trim().length >= 1) {
                            aiIndustrySuggestTimer.current = setTimeout(() => {
                              fetch(`${API}/api/suggest/industries-with-category/?q=${encodeURIComponent(v)}`)
                                .then((r) => r.json())
                                .then((d) => { setAiIndustrySuggestions(d.suggestions || []); setAiIndustrySuggestOpen(true); })
                                .catch(() => setAiIndustrySuggestions([]));
                            }, 200);
                          } else { setAiIndustrySuggestions([]); setAiIndustrySuggestOpen(false); }
                        }}
                        onBlur={() => setTimeout(() => setAiIndustrySuggestOpen(false), 150)}
                        style={{ width: "100%", padding: "7px 11px", fontSize: 13, marginBottom: 8, borderRadius: aiIndustrySuggestOpen && aiIndustrySuggestions.length > 0 ? "8px 8px 0 0" : 8, background: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#111827", outline: "none", boxSizing: "border-box" }}
                      />
                      <div style={{ overflow: "hidden", maxHeight: aiIndustrySuggestOpen && aiIndustrySuggestions.length > 0 ? 220 : 0, opacity: aiIndustrySuggestOpen && aiIndustrySuggestions.length > 0 ? 1 : 0, transition: "max-height 0.22s ease, opacity 0.18s ease", background: "#fff", border: "1.5px solid #E5E7EB", borderTop: "none", borderRadius: "0 0 8px 8px", marginBottom: 8 }}>
                        {aiIndustrySuggestions.map((s, i) => (
                          <div key={i} onMouseDown={() => { setAiIndustry(s.통합카테고리); setAiIndustrySearchQuery(""); setAiIndustrySuggestOpen(false); setAiIndustryDrillGroup(null); }}
                            style={{ padding: "7px 12px", cursor: "pointer", fontSize: 13, borderBottom: i < aiIndustrySuggestions.length - 1 ? "1px solid #F3F4F6" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#EFF6FF"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <span style={{ color: "#111827" }}>{s.소분류명}</span>
                            <span style={{ fontSize: 11, color: "#93B8EE", background: "rgba(59,130,246,0.18)", padding: "2px 7px", borderRadius: 10 }}>{s.통합카테고리}</span>
                          </div>
                        ))}
                      </div>
                      {!aiIndustrySearchQuery && (aiIndustryDrillGroup ? (
                        <>
                          <button onClick={() => setAiIndustryDrillGroup(null)} style={{ fontSize: 13, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "0 0 10px 0" }}>← {aiIndustryDrillGroup}</button>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {CATEGORY_GROUPS[aiIndustryDrillGroup].map((cat) => (
                              <button key={cat} onClick={() => setAiIndustry(aiIndustry === cat ? null : cat)}
                                style={{ padding: "5px 10px", borderRadius: 20, cursor: "pointer", fontSize: 13, border: aiIndustry === cat ? "2px solid #3B82F6" : "1.5px solid #E5E7EB", background: aiIndustry === cat ? "#EFF6FF" : "#F9FAFB", color: aiIndustry === cat ? "#2563EB" : "#374151", fontWeight: aiIndustry === cat ? 700 : 400, display: "flex", alignItems: "center", gap: 5 }}
                              ><CalcCatIcon cat={cat} size={13} />{cat}</button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {DRILL_GROUPS.map(group => {
                            const Meta = DRILL_GROUP_META[group];
                            const GroupIcon = Meta.icon;
                            return (
                              <button key={group} onClick={() => setAiIndustryDrillGroup(group)}
                                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderRadius: 10, fontSize: 14, cursor: "pointer", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", transition: "background 0.15s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#2563EB"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; }}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: 7 }}><GroupIcon size={15} color={Meta.iconColor} strokeWidth={1.8} />{group}</span>
                                <span style={{ color: "#6B7280", fontSize: 12 }}>{CATEGORY_GROUPS[group].length}개 →</span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                      <button
                        disabled={!aiIndustry}
                        onClick={() => {
                          setAiDongSubMode("gu_rank");
                          setAiGuRankResults(null);
                          setAiStep("loading");
                          fetch(`${API}/api/recommend/gu/?업종=${encodeURIComponent(aiIndustry)}`)
                            .then((r) => r.json())
                            .then((data) => {
                              if (data.error) { alert(data.error); setAiStep("form"); return; }
                              setAiGuRankResults(data.results || []);
                              setAiStep("result");
                            })
                            .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("form"); });
                        }}
                        style={{ width: "100%", marginTop: 20, padding: "13px 0", background: aiIndustry ? "linear-gradient(135deg, #2563EB, #3B82F6)" : "#E5E7EB", color: aiIndustry ? "#fff" : "#9CA3AF", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: aiIndustry ? "pointer" : "not-allowed", transition: "all 0.2s" }}
                      >✨ 분석 시작</button>
                    </div>
                  )}

                  {/* 모드별 폼 — score/gu 업종 선택 UI (dong은 위에서 별도 처리) */}
                  {(aiMode === "score" || aiMode === "gu") && (
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
                              fetch(`${API}/api/suggest/industries-with-category/?q=${encodeURIComponent(v)}`)
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
                          background: "#F9FAFB", border: "1.5px solid #E5E7EB",
                          color: "#111827", outline: "none", boxSizing: "border-box",
                        }}
                      />
                      {/* 자동완성 드롭다운 */}
                      <div style={{ overflow: "hidden", maxHeight: aiIndustrySuggestOpen && aiIndustrySuggestions.length > 0 ? 260 : 0, opacity: aiIndustrySuggestOpen && aiIndustrySuggestions.length > 0 ? 1 : 0, transition: "max-height 0.22s ease, opacity 0.18s ease", background: "#fff", border: "1.5px solid #E5E7EB", borderTop: "none", borderRadius: "0 0 8px 8px", marginBottom: 8 }}>
                        {aiIndustrySuggestions.map((s, i) => (
                          <div key={i} onMouseDown={() => { setAiIndustry(s.통합카테고리); setAiIndustrySearchQuery(""); setAiIndustrySuggestOpen(false); setAiIndustryDrillGroup(null); }}
                            style={{ padding: "7px 12px", cursor: "pointer", fontSize: 13, borderBottom: i < aiIndustrySuggestions.length - 1 ? "1px solid #F3F4F6" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#EFF6FF"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <span style={{ color: "#111827" }}>{s.소분류명}</span>
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
                                  style={{ padding: "5px 10px", borderRadius: 20, cursor: "pointer", fontSize: 13, border: aiIndustry === cat ? "2px solid #3B82F6" : "1.5px solid #E5E7EB", background: aiIndustry === cat ? "#EFF6FF" : "#F9FAFB", color: aiIndustry === cat ? "#2563EB" : "#374151", fontWeight: aiIndustry === cat ? 700 : 400, display: "flex", alignItems: "center", gap: 4 }}
                                >
                                  <CalcCatIcon cat={cat} size={13} />{cat}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          /* 대분류 목록 */
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {DRILL_GROUPS.map(group => {
                              const Meta = DRILL_GROUP_META[group];
                              const GroupIcon = Meta.icon;
                              return (
                                <button key={group} onClick={() => setAiIndustryDrillGroup(group)}
                                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderRadius: 10, fontSize: 14, cursor: "pointer", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", transition: "background 0.15s" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#2563EB"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; }}
                                >
                                  <span style={{ display: "flex", alignItems: "center", gap: 7 }}><GroupIcon size={15} color={Meta.iconColor} strokeWidth={1.8} />{group}</span>
                                  <span style={{ color: "#6B7280", fontSize: 12 }}>{CATEGORY_GROUPS[group].length}개 →</span>
                                </button>
                              );
                            })}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {(aiMode === "industry" || aiMode === "score") && (
                    <div style={{ marginBottom: 20, position: "relative" }}>
                      <div style={aiSectionLabel}>
                        <span style={aiRequiredBadge}>필수</span> 행정동 입력
                      </div>
                      <input
                        value={aiDong}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAiDong(v);
                          setAiDongSuggestIdx(-1);
                          if (v.trim().length >= 1) {
                            const all = polygonGroupsRef.current || [];
                            const filtered = all
                              .filter((g) => g.dongName && g.dongName.includes(v.trim()))
                              .slice(0, 8)
                              .map((g) => ({ dongName: g.dongName, guName: g.guName }));
                            setAiDongSuggestions(filtered);
                            setAiDongSuggestOpen(filtered.length > 0);
                          } else {
                            setAiDongSuggestions([]);
                            setAiDongSuggestOpen(false);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!aiDongSuggestOpen || aiDongSuggestions.length === 0) return;
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setAiDongSuggestIdx((i) => Math.min(i + 1, aiDongSuggestions.length - 1));
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setAiDongSuggestIdx((i) => Math.max(i - 1, 0));
                          } else if (e.key === "Tab" || e.key === "Enter") {
                            const idx = aiDongSuggestIdx >= 0 ? aiDongSuggestIdx : 0;
                            if (aiDongSuggestions[idx]) {
                              e.preventDefault();
                              setAiDong(aiDongSuggestions[idx].dongName);
                              setAiDongSuggestOpen(false);
                              setAiDongSuggestIdx(-1);
                            }
                          } else if (e.key === "Escape") {
                            setAiDongSuggestOpen(false);
                          }
                        }}
                        onBlur={() => setTimeout(() => setAiDongSuggestOpen(false), 150)}
                        placeholder="예: 역삼1동, 합정동"
                        style={{
                          width: "100%", padding: "10px 14px", background: "#F9FAFB",
                          border: "1.5px solid #E5E7EB", borderRadius: aiDongSuggestOpen ? "10px 10px 0 0" : 10,
                          color: "#111827", fontSize: 16, outline: "none", boxSizing: "border-box",
                        }}
                      />
                      {aiDongSuggestOpen && aiDongSuggestions.length > 0 && (
                        <div style={{ position: "absolute", left: 0, right: 0, background: "#fff", border: "1.5px solid #E5E7EB", borderTop: "none", borderRadius: "0 0 10px 10px", zIndex: 10, maxHeight: 220, overflowY: "auto" }}>
                          {aiDongSuggestions.map((s, i) => (
                            <div
                              key={s.dongName}
                              onMouseDown={() => { setAiDong(s.dongName); setAiDongSuggestOpen(false); setAiDongSuggestIdx(-1); }}
                              style={{ padding: "9px 14px", cursor: "pointer", fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center", background: i === aiDongSuggestIdx ? "#EFF6FF" : "transparent", borderBottom: i < aiDongSuggestions.length - 1 ? "1px solid #F3F4F6" : "none" }}
                              onMouseEnter={() => setAiDongSuggestIdx(i)}
                            >
                              <span style={{ color: "#111827", fontWeight: i === aiDongSuggestIdx ? 600 : 400 }}>{s.dongName}</span>
                              <span style={{ fontSize: 12, color: "#6B7280" }}>{s.guName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {aiMode === "gu" && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={aiSectionLabel}>
                        <span style={aiRequiredBadge}>필수</span> 구 선택
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                        {REGIONS.map((gu) => (
                          <button key={gu} onClick={() => setAiGu(aiGu === gu ? "" : gu)}
                            style={{ padding: "7px 2px", borderRadius: 8, fontSize: 11, cursor: "pointer", border: aiGu === gu ? "2px solid #3B82F6" : "1.5px solid #E5E7EB", background: aiGu === gu ? "#EFF6FF" : "#F9FAFB", color: aiGu === gu ? "#2563EB" : "#374151", fontWeight: aiGu === gu ? 700 : 400, transition: "all 0.15s" }}
                          >{gu.replace("구", "")}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiMode !== "dong" && (() => {
                    const disabled =
                      (aiMode === "industry" && !aiDong.trim()) ||
                      (aiMode === "score" && (!aiDong.trim() || !aiIndustry)) ||
                      (aiMode === "gu" && (!aiGu || !aiIndustry));
                    return (
                      <button
                        onClick={() => handleAiRecommend()}
                        disabled={disabled}
                        style={{
                          width: "100%", padding: "13px 0",
                          background: disabled ? "#E5E7EB" : "linear-gradient(135deg, #2563EB, #3B82F6)",
                          color: disabled ? "#9CA3AF" : "#fff", border: "none", borderRadius: 12,
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
                  <div style={{ fontSize: 17, color: "#111827", fontWeight: 600, marginBottom: 8 }}>AI가 분석하고 있습니다</div>
                  <div style={{ fontSize: 14, color: "#6B7280" }}>매출·유동인구·경쟁 강도를 종합적으로 평가 중...</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", opacity: 0.3 + i * 0.35 }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── 업종 선택 인라인 레이어 ── */}
            {showIndustryPicker && (
              <div style={{ position: "absolute", inset: 0, background: "#fff", borderRadius: 20, padding: "24px", display: "flex", flexDirection: "column", zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 2 }}>{aiDong}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>업종 선택</div>
                  </div>
                  <button onClick={() => setShowIndustryPicker(false)} style={closeBtnStyle}>✕</button>
                </div>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 12, flexShrink: 0 }}>업종을 선택하면 해당 지역의 창업 적합도를 분석합니다</div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {pickerDrillGroup ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <button
                        onClick={() => setPickerDrillGroup(null)}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", marginBottom: 4 }}
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
                              fetch(`${API}/api/recommend/score/?dong=${encodeURIComponent(aiDong.trim())}&category=${encodeURIComponent(cat)}`).then((r) => r.json()),
                              new Promise((res) => setTimeout(res, 1200)),
                            ])
                              .then(([data]) => {
                                if (data.error) { alert(data.error); setAiStep("form"); return; }
                                setAiResults(data);
                                setAiStep("result");
                              })
                              .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("form"); });
                          }}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, fontSize: 14, fontWeight: 500, cursor: "pointer", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", textAlign: "left", transition: "background 0.15s, color 0.15s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#2563EB"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
                        >
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{CATEGORY_EMOJI[cat] ?? "🏪"}</span>
                          {cat}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {DRILL_GROUPS.map((group) => (
                        <button
                          key={group}
                          onClick={() => setPickerDrillGroup(group)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", textAlign: "left", transition: "background 0.15s, color 0.15s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#2563EB"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
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
        </div>
        </div>
      )}

      {/* ── AI 추천 결과 플로팅 카드 (결과/spot 단계) ── */}
      {aiModalOpen && ["result", "spot_loading", "spot"].includes(aiStep) && (
        <div
          className="anim-panel-slide-in-right no-scrollbar"
          style={{
            position: "absolute",
            top: NAV_HEIGHT + 36,
            right: 12,
            width: 380,
            height: `calc(100vh - ${NAV_HEIGHT + 60}px)`,
            background: "#fff",
            borderRadius: "16px 16px 16px 16px",
            boxShadow: "-4px 4px 24px rgba(0,0,0,0.12)",
            border: "1px solid #E5E7EB",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* 네비바 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Bot size={13} color="#3B82F6" strokeWidth={1.6} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                {aiStep === "spot_loading" && "위치 분석 중..."}
                {aiStep === "spot" && `${spotDong} 내 추천 위치`}
                {aiStep === "result" && (AI_MODE_META[aiMode]?.title ?? "AI 추천 결과")}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => { setAiStep("mode"); setAiMode(null); setAiResults(null); setAiDongSubMode(null); clearSpotMarkers(); }}
                style={{ fontSize: 11, color: "#3B82F6", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
              >설문으로 돌아가기</button>
              <button
                onClick={() => setAiResultCollapsed(v => !v)}
                title={aiResultCollapsed ? "펼치기" : "접기"}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {aiResultCollapsed ? (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <rect x="1" y="1" width="11" height="11" rx="1.5" stroke="#6B7280" strokeWidth="1.6"/>
                  </svg>
                ) : (
                  <svg width="14" height="3" viewBox="0 0 14 3" fill="none">
                    <path d="M1 1.5h12" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
              <button
                onClick={() => { setAiModalOpen(false); clearSpotMarkers(); }}
                title="닫기"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* spot 단계: 별도 렌더링 */}
          {(aiStep === "spot_loading" || aiStep === "spot") && !aiResultCollapsed && (
            <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {aiStep === "spot_loading" && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#6B7280" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
                  <div style={{ fontSize: 15 }}>{spotDong} 위치 분석 중...</div>
                </div>
              )}
              {aiStep === "spot" && spotResults && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <button onClick={() => { setAiStep("result"); clearSpotMarkers(); }} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 22, lineHeight: 1 }}>←</button>
                    <div style={{ fontSize: 13, color: "#6B7280" }}>{spotDong} · {spotCategory} · {spotResults.length}곳</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", background: "#F9FAFB", borderRadius: 8, padding: "8px 10px", border: "1px solid #E5E7EB" }}>
                    지도에 번호 마커로 표시됩니다. 생존율·경쟁·보완업종 데이터 기반입니다.
                  </div>
                  {spotResults.map((r) => {
                    const colors = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6"];
                    const color = colors[(r.rank || 1) - 1] || "#6B7280";
                    return (
                      <div key={r.rank} style={{ background: "#F9FAFB", borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${color}60` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ background: color, color: "#fff", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{r.rank}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>추천 위치 {r.rank}순위</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color }}>{r.score}</div>
                            <div style={{ fontSize: 11, color: "#6B7280" }}>입지점수</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                          <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: "8px", border: "1px solid #E5E7EB", textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>2년 생존율</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: (r.생존율||0) >= 60 ? "#059669" : (r.생존율||0) >= 40 ? "#D97706" : "#DC2626" }}>{r.생존율}%</div>
                          </div>
                          <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: "8px", border: "1px solid #E5E7EB", textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>경쟁 수</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: (r.경쟁밀도||0) <= 2 ? "#059669" : (r.경쟁밀도||0) <= 5 ? "#D97706" : "#DC2626" }}>{r.경쟁밀도}개</div>
                          </div>
                          <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: "8px", border: "1px solid #E5E7EB", textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>시너지업종</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{r.보완밀도}개</div>
                          </div>
                        </div>
                        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 6, letterSpacing: "0.05em" }}>추천 근거</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {[
                              (r.생존율||0) >= 60 ? `2년 생존율 ${r.생존율}%로 높은 편입니다` : (r.생존율||0) >= 40 ? `2년 생존율 ${r.생존율}%로 평균 수준입니다` : `2년 생존율 ${r.생존율}%로 낮은 편입니다`,
                              (r.경쟁밀도||0) <= 2 ? "반경 300m 내 동업종 경쟁이 적습니다" : (r.경쟁밀도||0) <= 5 ? `반경 300m 내 동업종이 ${r.경쟁밀도}개 있습니다` : `반경 300m 내 동업종 ${r.경쟁밀도}개로 경쟁이 많습니다`,
                              (r.보완밀도||0) >= 10 ? `시너지 업종 ${r.보완밀도}개로 집객에 유리합니다` : (r.보완밀도||0) >= 5 ? `인근에 시너지 업종 ${r.보완밀도}개가 있습니다` : "인근 시너지 업종이 적어 독립 입지입니다",
                            ].map((text, i) => (
                              <div key={i} style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "flex-start", gap: 5, lineHeight: 1.5 }}>
                                <span style={{ color, flexShrink: 0, fontWeight: 700 }}>•</span>
                                <span>{text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* result 단계: 기존 콘텐츠 */}
          {!aiResultCollapsed && aiStep === "result" && (
            <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "16px", position: "relative" }}>

              {/* spot_loading */}
              {aiStep === "spot_loading" && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#6B7280" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
                  <div style={{ fontSize: 14 }}>최적 위치를 분석 중입니다...</div>
                </div>
              )}

              {/* 결과 단계 */}
              {aiStep === "result" && (aiResults || aiDongSubMode === "gu_rank") && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: 15, color: "#6B7280" }}>
                      {aiMode === "dong" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiSubIndustry}</span>{aiRegion && <> · {aiRegion}</>} 추천 상권</>}
                      {aiMode === "industry" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiDong}</span> 추천 업종</>}
                      {aiMode === "score" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiDong}</span> · <span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiIndustry}</span> 적합도</>}
                      {aiMode === "gu" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiGu}</span> · <span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiIndustry}</span> 추천</>}
                      {aiMode === "gu_overview" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiGu}</span> 업종별 상권 현황</>}
                    </span>
                    {aiMode !== "gu_overview" && (
                      <button
                        onClick={() => { setAiStep("form"); setAiResults(null); setAiGuRankResults(null); setAiDongSubMode(null); }}
                        style={{ fontSize: 13, color: "#6B7280", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontWeight: 600, flexShrink: 0 }}
                      >
                        ← 이전으로
                      </button>
                    )}
                  </div>
              {/* 구를 못정했어요 → 구 랭킹 단독 표시 */}
              {aiDongSubMode === "gu_rank" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {!aiGuRankResults ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <div style={{ width: 16, height: 16, border: "2px solid #E5E7EB", borderTop: "2px solid #6B7280", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      구 데이터 분석 중...
                    </div>
                  ) : (
                    aiGuRankResults.map((item) => (
                      <div key={item.guName} style={{ background: item.rank === 1 ? "linear-gradient(135deg,#EFF6FF,#F5F3FF)" : "#F9FAFB", border: `1px solid ${item.rank === 1 ? "#BFDBFE" : "#E5E7EB"}`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={aiRankBadge(item.rank)}>
                              {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `${item.rank}위`}
                            </div>
                            <div>
                              <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{item.guName}</div>
                              <div style={{ fontSize: 12, color: "#6B7280" }}>행정동 {item.행정동수}개 분석</div>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: item.rank === 1 ? "#2563EB" : "#111827" }}>{item.score}</div>
                            <div style={{ fontSize: 12, color: "#6B7280" }}>AI 점수</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <div style={aiMiniStatStyle}><div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>월 매출</div><div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{fmtRevenue(item.당월매출합)}</div></div>
                          <div style={aiMiniStatStyle}><div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>점포 수</div><div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.점포수}개</div></div>
                          <div style={aiMiniStatStyle}><div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>평균 성장확률</div><div style={{ fontSize: 14, fontWeight: 600, color: (item.성장확률||0) >= 60 ? "#059669" : "#D97706" }}>{item.성장확률}%</div></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 모드 "dong" / "industry" — 랭킹 리스트 */}
              {aiDongSubMode !== "gu_rank" && (aiMode === "dong" || aiMode === "industry") && (
                <>
                  {/* 행정동 추천 — industry 모드 또는 dong 모드 */}
                  {(aiMode === "industry" || aiMode === "dong") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {aiResults.map((item) => (
                        <div key={item.rank} style={aiResultCardStyle(item.rank === 1)}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={aiRankBadge(item.rank)}>
                                {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `${item.rank}위`}
                              </div>
                              <div>
                                <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
                                  {aiMode === "dong" ? item.dongName : item.industry}
                                </div>
                                <div style={{ fontSize: 13, color: "#6B7280" }}>
                                  {aiMode === "dong" ? item.guName : `AI가 판단한 성장확률 ${item.성장확률}%`}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 24, fontWeight: 800, color: item.rank === 1 ? "#2563EB" : "#111827" }}>{item.score}</div>
                              <div style={{ fontSize: 12, color: "#6B7280" }}>AI 점수</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 14, color: "#374151", background: "#F3F4F6", borderRadius: 8, padding: "8px 10px", marginBottom: 10, lineHeight: 1.6 }}>
                            {item.reason}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                            {item.tags.map((tag) => (
                              <span key={tag} style={{ fontSize: 13, color: "#1D4ED8", background: "#DBEAFE", borderRadius: 12, padding: "3px 9px", border: "1px solid #93C5FD" }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <div style={aiMiniStatStyle}>
                              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>월 매출</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{fmtRevenue(item.revenue)}</div>
                            </div>
                            <div style={aiMiniStatStyle}>
                              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>경쟁 점포</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: (item.stores ?? item.점포수) === 0 ? "#059669" : "#111827" }}>
                                {(item.stores ?? item.점포수) === 0 ? "0개 (블루오션)" : `${item.stores ?? item.점포수}개`}
                              </div>
                            </div>
                            <div style={aiMiniStatStyle}>
                              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>경쟁 강도</div>
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

                </>
              )}

              {/* ── 구 모드 결과 (행정동 / 길단위 탭) ── */}
              {aiMode === "gu" && (
                <div>
                  {/* 탭 헤더 */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "#F3F4F6", borderRadius: 10, padding: 4 }}>
                    {[
                      { key: "dong", label: "🏘️ 행정동 추천" },
                      { key: "street", label: "🛣️ 길단위 상권 추천" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setAiGuResultTab(key)}
                        style={{
                          flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                          background: aiGuResultTab === key ? "linear-gradient(135deg,#2563EB,#3B82F6)" : "transparent",
                          color: aiGuResultTab === key ? "#fff" : "#6B7280",
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
                        <div style={{ textAlign: "center", padding: "24px 0", color: "#6B7280", fontSize: 13 }}>
                          <div style={{ fontSize: 22, marginBottom: 8 }}>📭</div>
                          {aiGu} 내 <b style={{ color: "#111827" }}>{aiIndustry}</b> 데이터가 없습니다.<br />
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>길단위 상권 탭을 확인해보세요.</span>
                        </div>
                      )}
                      {aiResults.map((item) => (
                        <div key={item.rank} style={aiResultCardStyle(item.rank === 1)}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={aiRankBadge(item.rank)}>
                                {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `${item.rank}위`}
                              </div>
                              <div>
                                <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{item.dongName}</div>
                                <div style={{ fontSize: 13, color: "#6B7280" }}>{item.guName}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 24, fontWeight: 800, color: item.rank === 1 ? "#2563EB" : "#111827" }}>{item.score}</div>
                              <div style={{ fontSize: 12, color: "#6B7280" }}>AI 점수</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 14, color: "#374151", background: "#F3F4F6", borderRadius: 8, padding: "8px 10px", marginBottom: 10, lineHeight: 1.6 }}>
                            {item.reason}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                            {item.tags.map((tag) => (
                              <span key={tag} style={{ fontSize: 13, color: "#1D4ED8", background: "#DBEAFE", borderRadius: 12, padding: "3px 9px", border: "1px solid #93C5FD" }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <div style={aiMiniStatStyle}>
                              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>월 매출</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{fmtRevenue(item.revenue)}</div>
                            </div>
                            <div style={aiMiniStatStyle}>
                              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>경쟁 점포</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: item.stores === 0 ? "#059669" : "#111827" }}>
                                {item.stores === 0 ? "0개 (블루오션)" : `${item.stores}개`}
                              </div>
                            </div>
                            <div style={aiMiniStatStyle}>
                              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>경쟁 강도</div>
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
                        <div key={item.rank} style={aiResultCardStyle(item.rank === 1)}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={aiRankBadge(item.rank)}>
                                {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `${item.rank}위`}
                              </div>
                              <div>
                                <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{item.상권명}</div>
                                <div style={{ fontSize: 13, color: "#6B7280" }}>길단위 상권</div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 24, fontWeight: 800, color: item.rank === 1 ? "#2563EB" : "#111827" }}>{item.score}</div>
                              <div style={{ fontSize: 12, color: "#6B7280" }}>AI 점수</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {(item.tags || []).map((tag) => (
                              <span key={tag} style={{ fontSize: 13, color: "#1D4ED8", background: "#DBEAFE", borderRadius: 12, padding: "3px 9px", border: "1px solid #93C5FD" }}>
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

              {/* 모드 "score" — 적합도 상세 */}
              {aiMode === "score" && (() => {
                const r = aiResults;
                return (
                  <div>
                    {/* 종합 점수 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#EFF6FF", borderRadius: 14, padding: "16px 20px", marginBottom: 16, border: "1.5px solid #BFDBFE" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 46, fontWeight: 800, color: "#2563EB", lineHeight: 1 }}>{r.score}</div>
                        <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>종합 점수</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>등급 {r.grade}</div>
                        <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{r.summary}</div>
                      </div>
                    </div>

                    {/* 항목별 점수 */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>항목별 평가</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {r.breakdown.map((b) => (
                          <div key={b.label}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 14, color: "#374151" }}>{b.label}</span>
                              <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600 }}>{b.score} / {b.max}</span>
                            </div>
                            <div style={{ background: "#E5E7EB", borderRadius: 4, height: 6, overflow: "hidden" }}>
                              <div style={{ width: `${(b.score / b.max) * 100}%`, height: "100%", background: b.score >= 80 ? "linear-gradient(90deg,#10B981,#34D399)" : b.score >= 60 ? "linear-gradient(90deg,#3B82F6,#60A5FA)" : "linear-gradient(90deg,#F59E0B,#FBBF24)", borderRadius: 4 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 장단점 */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1, background: "rgba(16,185,129,0.06)", borderRadius: 10, padding: "12px", border: "1px solid rgba(16,185,129,0.2)" }}>
                        <div style={{ fontSize: 13, color: "#059669", fontWeight: 700, marginBottom: 8 }}>강점</div>
                        {r.pros.map((p) => <div key={p} style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>✓ {p}</div>)}
                      </div>
                      <div style={{ flex: 1, background: "rgba(239,68,68,0.06)", borderRadius: 10, padding: "12px", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <div style={{ fontSize: 13, color: "#DC2626", fontWeight: 700, marginBottom: 8 }}>유의점</div>
                        {r.cons.map((c) => <div key={c} style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>! {c}</div>)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 모드 "gu_overview" — 구 기준 업종 AI 추천 */}
              {aiMode === "gu_overview" && aiResults?.results && (() => {
                const { results, quarter } = aiResults;
                const fmtRev = v => v >= 1e8 ? `${Number((v/1e8).toFixed(1)).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1})}억` : `${Math.round(v/1e4).toLocaleString()}만`;
                const maxScore = results[0]?.score ?? 1;
                return (
                  <div>
                    <div style={{ fontSize: 12, color: "#6B7280", textAlign: "center", marginBottom: 12 }}>기준 분기: {quarter} · {aiGu} 창업 추천 업종 Top 10</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {results.map((item, i) => {
                        const barW = maxScore > 0 ? (item.score / maxScore * 100) : 0;
                        const compColor = item.경쟁강도 === "낮음" ? "#34D399" : item.경쟁강도 === "중간" ? "#FBBF24" : "#F87171";
                        return (
                          <div key={item.통합카테고리} style={{ background: i === 0 ? "rgba(59,130,246,0.06)" : "#F9FAFB", borderRadius: 10, padding: "10px 12px", border: `1px solid ${i===0?"#BFDBFE":"#E5E7EB"}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: i===0?"#2563EB":"#9CA3AF", minWidth: 22 }}>
                                  {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                                </span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{CATEGORY_EMOJI[item.통합카테고리] ?? "🏪"} {item.통합카테고리}</span>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 15, fontWeight: 800, color: i===0?"#2563EB":"#374151" }}>{item.avg_성장확률}%</div>
                                <div style={{ fontSize: 11, color: "#9CA3AF" }}>AI 성장확률</div>
                              </div>
                            </div>
                            <div style={{ background: "#E5E7EB", borderRadius: 3, height: 4, overflow: "hidden", marginBottom: 6 }}>
                              <div style={{ width: `${barW}%`, height: "100%", background: "linear-gradient(90deg,#93C5FD,#3B82F6)", borderRadius: 3 }} />
                            </div>
                            <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
                              <span style={{ color: "#6B7280" }}>월매출 <b style={{ color: "#374151" }}>{fmtRev(item.총매출)}원</b></span>
                              <span style={{ color: "#6B7280" }}>점포 <b style={{ color: "#374151" }}>{item.총점포수?.toLocaleString()}개</b></span>
                              <span style={{ color: compColor, fontWeight: 600 }}>경쟁 {item.경쟁강도}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
                      업종을 선택하면 더 자세한 AI 추천 분석을 받을 수 있습니다
                    </div>
                  </div>
                );
              })()}

              <div style={{ marginTop: 14, padding: "10px 14px", background: "#FFF7ED", borderRadius: 10, border: "1px solid #FED7AA" }}>
                <div style={{ fontSize: 13, color: "#92400E" }}>
                  ⚠️ 본 추천 결과는 AI 분석 기반이며, 실제 창업 시 현장 조사를 병행하시기 바랍니다.
                </div>
              </div>
            </>
              )}

              {/* 업종 선택 인라인 레이어 */}
              {showIndustryPicker && (
                <div style={{ position: "absolute", inset: 0, background: "#fff", borderRadius: "0 0 0 16px", padding: "24px", display: "flex", flexDirection: "column", zIndex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
                    <div>
                      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 2 }}>{aiDong}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>업종 선택</div>
                    </div>
                    <button onClick={() => setShowIndustryPicker(false)} style={closeBtnStyle}>✕</button>
                  </div>
                  <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 12, flexShrink: 0 }}>업종을 선택하면 해당 지역의 창업 적합도를 분석합니다</div>
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {pickerDrillGroup ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <button
                          onClick={() => setPickerDrillGroup(null)}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", marginBottom: 4 }}
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
                                fetch(`${API}/api/recommend/score/?dong=${encodeURIComponent(aiDong.trim())}&category=${encodeURIComponent(cat)}`).then((r) => r.json()),
                                new Promise((res) => setTimeout(res, 1200)),
                              ])
                                .then(([data]) => {
                                  if (data.error) { alert(data.error); setAiStep("form"); return; }
                                  setAiResults(data);
                                  setAiStep("result");
                                })
                                .catch(() => { alert("서버 연결에 실패했습니다."); setAiStep("form"); });
                            }}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, fontSize: 14, fontWeight: 500, cursor: "pointer", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", textAlign: "left", transition: "background 0.15s, color 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#2563EB"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
                          >
                            <span style={{ fontSize: 18, flexShrink: 0 }}>{CATEGORY_EMOJI[cat] ?? "🏪"}</span>
                            {cat}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {DRILL_GROUPS.map((group) => (
                          <button
                            key={group}
                            onClick={() => setPickerDrillGroup(group)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", textAlign: "left", transition: "background 0.15s, color 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#2563EB"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
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
            </div>
          )}
        </div>
      )}

      {/* ── 창업비용 계산기 오버레이 ── */}
      {startupCalcOpen && (
        <div style={startupCalcOverlayStyle} onClick={() => { setStartupCalcOpen(false); setCalcResult(null); setCalcIndustry(null); setCalcRegion(""); setCalcDong(""); setCalcSize(null); setCalcFloor(null); setCalcWorkers(1); setCalcSearchQuery(""); setCalcDrillGroup(null); setCalcStep(1); }}>
          <div className="no-scrollbar" style={startupCalcPanelStyle} onClick={(e) => e.stopPropagation()}>

            {/* 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>창업비용 계산기</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>예상 초기비용과 월 고정비를 확인하세요</div>
              </div>
              <button onClick={() => { setStartupCalcOpen(false); setCalcResult(null); setCalcIndustry(null); setCalcRegion(""); setCalcDong(""); setCalcSize(null); setCalcFloor(null); setCalcWorkers(1); setCalcSearchQuery(""); setCalcDrillGroup(null); setCalcStep(1); }} style={closeBtnStyle}>✕</button>
            </div>

            {/* 스텝 인디케이터 */}
            {calcStep < 5 && (() => {
              const steps = [
                { n: 1, label: "위치" },
                { n: 2, label: "업종" },
                { n: 3, label: "크기" },
                { n: 4, label: "층수" },
                { n: 5, label: "결과" },
              ];
              return (
                <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 24 }}>
                  {steps.flatMap(({ n, label }, i) => {
                    const items = [
                      <div key={`step-${n}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: calcStep >= n ? "#60A5FA" : "#F3F4F6", color: calcStep >= n ? "#fff" : "#9CA3AF", transition: "background 0.2s" }}>{n}</div>
                        <div style={{ fontSize: 10, color: calcStep >= n ? "#60A5FA" : "#9CA3AF", fontWeight: calcStep === n ? 700 : 400, whiteSpace: "nowrap" }}>{label}</div>
                      </div>
                    ];
                    if (i < 4) items.push(<div key={`line-${n}`} style={{ flex: 1, height: 2, background: calcStep > n ? "#BFDBFE" : "#E5E7EB", margin: "12px 4px 0", transition: "background 0.2s" }} />);
                    return items;
                  })}
                </div>
              );
            })()}

            {/* 스텝 1: 위치(구/동) 선택 */}
            {calcStep === 1 && (() => {
              const preGu = selectedGu?.name || selectedDong?.guName || "";
              const preDong = selectedDong?.dongName || "";
              const activeGu = calcRegion || preGu;
              const dongList = guToDongsRef.current[activeGu] || [];
              const activeDong = calcDong || (activeGu === preGu ? preDong : "");
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* 구 선택 단계 */}
                  {!activeGu ? (
                    <>
                      <div style={{ fontSize: 13, color: "#6B7280" }}>구를 선택하세요</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                        {REGIONS.map((gu) => (
                          <button key={gu} onClick={() => { setCalcRegion(gu); setCalcDong(""); }}
                            style={{ padding: "8px 4px", borderRadius: 8, cursor: "pointer", fontSize: 12, border: "1.5px solid #E5E7EB", background: "#F9FAFB", color: "#374151", transition: "all 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#F0F9FF"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#E5E7EB"; }}>
                            {gu.replace("구", "")}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* 선택된 구 버튼 (누르면 구 목록으로 복귀) */}
                      <button onClick={() => { setCalcRegion(""); setCalcDong(""); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, border: "2px solid #60A5FA", background: "#60A5FA", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, textAlign: "left" }}>
                        <span>📍 {activeGu}</span>
                        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 400, opacity: 0.6 }}>← 구 변경</span>
                      </button>

                      {/* 동 목록 */}
                      <div style={{ fontSize: 12, color: "#6B7280" }}>행정동을 선택하세요 <span style={{ color: "#9CA3AF" }}>(선택사항)</span></div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {[...dongList].sort().map((dong) => {
                          const isActive = activeDong === dong;
                          return (
                            <button key={dong} onClick={() => setCalcDong(dong === calcDong ? "" : dong)}
                              style={{ padding: "6px 12px", borderRadius: 16, cursor: "pointer", fontSize: 13, border: isActive ? "2px solid #3B82F6" : "1.5px solid #E5E7EB", background: isActive ? "#EFF6FF" : "#F9FAFB", color: isActive ? "#1D4ED8" : "#374151", fontWeight: isActive ? 700 : 400, transition: "all 0.15s" }}>
                              {dong}
                            </button>
                          );
                        })}
                      </div>

                      {/* 선택 확인 + 다음 버튼 */}
                      <div style={{ marginTop: 4 }}>
                        <button onClick={() => setCalcStep(2)}
                          style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: "#60A5FA", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                          다음 →
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* 스텝 2: 업종 선택 */}
            {calcStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* 검색창 */}
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="업종 검색... (예: 카페, 피자)"
                    value={calcSearchQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCalcSearchQuery(v);
                      setCalcDrillGroup(null);
                      clearTimeout(calcSuggestTimer.current);
                      if (v.trim().length >= 1) {
                        calcSuggestTimer.current = setTimeout(() => {
                          fetch(`${API}/api/suggest/industries-with-category/?q=${encodeURIComponent(v)}`)
                            .then((r) => r.json())
                            .then((d) => { setCalcSuggestions(d.suggestions || []); setCalcSuggestOpen(true); })
                            .catch(() => setCalcSuggestions([]));
                        }, 200);
                      } else { setCalcSuggestions([]); setCalcSuggestOpen(false); }
                    }}
                    onBlur={() => setTimeout(() => setCalcSuggestOpen(false), 150)}
                    style={{ width: "100%", padding: "10px 14px", fontSize: 14, borderRadius: calcSuggestOpen && calcSuggestions.length > 0 ? "10px 10px 0 0" : 10, border: "1.5px solid #E5E7EB", background: "#F9FAFB", color: "#111827", outline: "none", boxSizing: "border-box" }}
                  />
                  <div style={{ overflow: "hidden", maxHeight: calcSuggestOpen && calcSuggestions.length > 0 ? 320 : 0, opacity: calcSuggestOpen && calcSuggestions.length > 0 ? 1 : 0, transition: "max-height 0.22s ease, opacity 0.18s ease", background: "#fff", border: "1.5px solid #E5E7EB", borderTop: "none", borderRadius: "0 0 10px 10px", position: "absolute", width: "100%", zIndex: 10 }}>
                    {calcSuggestions.map((s, i) => (
                      <div key={i} onMouseDown={() => { setCalcIndustry(s.통합카테고리); setCalcSearchQuery(""); setCalcSuggestOpen(false); }}
                        style={{ padding: "9px 14px", cursor: "pointer", fontSize: 13, borderBottom: i < calcSuggestions.length - 1 ? "1px solid #F3F4F6" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#EFF6FF"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{ color: "#111827" }}>{s.소분류명}</span>
                        <span style={{ fontSize: 11, color: "#3B82F6", background: "rgba(59,130,246,0.1)", padding: "2px 8px", borderRadius: 10 }}>{s.통합카테고리}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 드릴다운 */}
                {!calcSearchQuery && (
                  calcDrillGroup ? (
                    <div>
                      <button onClick={() => setCalcDrillGroup(null)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#6B7280", marginBottom: 10 }}>
                        {(() => { const m = DRILL_GROUP_META[calcDrillGroup]; return <m.icon size={14} color={m.iconColor} strokeWidth={1.8} />; })()}
                        ← {calcDrillGroup}
                      </button>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {CATEGORY_GROUPS[calcDrillGroup].map((cat) => (
                          <button key={cat} onClick={() => setCalcIndustry(calcIndustry === cat ? null : cat)}
                            style={{ padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontSize: 13, border: calcIndustry === cat ? "2px solid #60A5FA" : "1.5px solid #E5E7EB", background: calcIndustry === cat ? "#60A5FA" : "#F9FAFB", color: calcIndustry === cat ? "#fff" : "#374151", fontWeight: calcIndustry === cat ? 700 : 400, display: "flex", alignItems: "center", gap: 4 }}
                          ><CalcCatIcon cat={cat} size={16} color={calcIndustry === cat ? "#fff" : undefined} />{cat}</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {DRILL_GROUPS.map((group) => (
                        <button key={group} onClick={() => setCalcDrillGroup(group)}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151", textAlign: "left", transition: "background 0.15s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#F0F9FF"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
                        >
                          {(() => { const m = DRILL_GROUP_META[group]; return <m.icon size={20} color={m.iconColor} strokeWidth={1.8} />; })()}
                          <span>{group}</span>
                          <span style={{ marginLeft: "auto", fontSize: 12, color: "#9CA3AF" }}>{CATEGORY_GROUPS[group].length}개 →</span>
                        </button>
                      ))}
                    </div>
                  )
                )}

                {/* 선택된 업종 표시 + 다음/이전 버튼 */}
                {calcIndustry && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setCalcStep(1)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← 이전</button>
                      <button onClick={() => setCalcStep(3)} style={{ flex: 2, padding: "12px 0", borderRadius: 10, border: "none", background: "#60A5FA", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>다음 →</button>
                    </div>
                  </div>
                )}
                {!calcIndustry && (
                  <button onClick={() => setCalcStep(1)} style={{ padding: "11px 0", borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← 이전</button>
                )}
              </div>
            )}

            {/* 스텝 3: 매장 크기 선택 */}
            {calcStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 13, color: "#6B7280" }}>매장 크기를 선택하세요</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { key: "소형", label: "소형", range: "10~20평", desc: "1인 운영, 소규모 창업", multiplier: "×0.6" },
                    { key: "중형", label: "중형", range: "20~40평", desc: "직원 1~2명, 일반 점포", multiplier: "×1.0 (기준)" },
                    { key: "대형", label: "대형", range: "40평+", desc: "직원 다수, 대형 점포", multiplier: "×1.8" },
                  ].map(({ key, label, range, desc, multiplier }) => (
                    <button key={key} onClick={() => setCalcSize(key)}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, cursor: "pointer", border: calcSize === key ? "2px solid #60A5FA" : "1.5px solid #E5E7EB", background: calcSize === key ? "#60A5FA" : "#F9FAFB", color: calcSize === key ? "#fff" : "#374151", textAlign: "left", transition: "all 0.15s" }}>
                      <div>{key === "소형" ? <Home size={22} strokeWidth={1.8} /> : key === "중형" ? <Store size={22} strokeWidth={1.8} /> : <Building2 size={22} strokeWidth={1.8} />}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{label} <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>({range})</span></div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{desc}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.6 }}>{multiplier}</div>
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={() => setCalcStep(2)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← 이전</button>
                  <button onClick={() => setCalcStep(4)} disabled={!calcSize}
                    style={{ flex: 2, padding: "12px 0", borderRadius: 10, border: "none", background: calcSize ? "#60A5FA" : "#E5E7EB", color: calcSize ? "#fff" : "#9CA3AF", fontSize: 15, fontWeight: 700, cursor: calcSize ? "pointer" : "default" }}>
                    다음 →
                  </button>
                </div>
              </div>
            )}

            {/* 스텝 4: 층수 선택 */}
            {calcStep === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 13, color: "#6B7280" }}>층수를 선택하세요</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { key: "지하1층", label: "지하 1층", icon: <ArrowDown size={20} strokeWidth={1.8} />, multiplier: "×0.7", desc: "임대료 저렴, 유동인구↓" },
                    { key: "1층", label: "1층", icon: <Store size={20} strokeWidth={1.8} />, multiplier: "×1.3", desc: "유동인구 최고, 임대료↑" },
                    { key: "2층", label: "2층", icon: <ArrowUp size={20} strokeWidth={1.8} />, multiplier: "×0.85", desc: "임대료 적당, 접근성↓" },
                    { key: "3층이상", label: "3층 이상", icon: <Building2 size={20} strokeWidth={1.8} />, multiplier: "×0.7", desc: "임대료 저렴, 집객↓↓" },
                  ].map(({ key, label, icon, multiplier, desc }) => (
                    <button key={key} onClick={() => setCalcFloor(key)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "14px 14px", borderRadius: 12, cursor: "pointer", border: calcFloor === key ? "2px solid #60A5FA" : "1.5px solid #E5E7EB", background: calcFloor === key ? "#60A5FA" : "#F9FAFB", color: calcFloor === key ? "#fff" : "#374151", textAlign: "left", transition: "all 0.15s" }}>
                      <div>{icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>{desc}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>{multiplier}</div>
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={() => setCalcStep(3)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← 이전</button>
                  <button
                    disabled={!calcFloor}
                    onClick={() => {
                      const preGu = selectedGu?.name || selectedDong?.guName || "";
                      const preDong = selectedDong?.dongName || "";
                      const gu = calcRegion || preGu;
                      const dong = calcDong || (gu === preGu ? preDong : "");
                      const cat = STARTUP_COSTS[calcIndustry];
                      const sizeMultiplier = { 소형: 0.6, 중형: 1.0, 대형: 1.8 }[calcSize] ?? 1.0;
                      const floorMultiplier = { "지하1층": 0.7, "1층": 1.3, "2층": 0.85, "3층이상": 0.7 }[calcFloor] ?? 1.0;
                      const combined = sizeMultiplier * floorMultiplier;
                      const pyeong = { 소형: 15, 중형: 30, 대형: 60 }[calcSize] ?? 30;
                      const guData = calcGuRental?.[gu];
                      const floorKey = calcFloor === "3층이상" ? "2층" : calcFloor === "지하1층" ? "지하1층" : calcFloor;
                      const floorData = guData?.[floorKey] || guData?.["1층"];
                      const rentPerSqm = (floorData?.["임대료_만원per㎡"] ?? 4.0) * floorMultiplier;
                      const sqm = pyeong * 3.3;
                      const 월임대료 = Math.round(rentPerSqm * sqm);
                      const 보증금 = Math.round(월임대료 * cat["보증금_임대료배수"]);
                      const 인테리어 = Math.round(cat["인테리어_만원per평"] * pyeong * sizeMultiplier);
                      const 설비집기 = Math.round(cat["설비_집기_만원"] * sizeMultiplier);
                      const 초기재고 = Math.round(cat["초기재고_만원"] * sizeMultiplier);
                      const 초기합계 = 보증금 + 인테리어 + 설비집기 + 초기재고;
                      const 월최저임금 = Math.round(10030 * 209 / 10000);
                      const workers = { 소형: 1, 중형: 2, 대형: 4 }[calcSize] ?? 2;
                      const 월인건비 = workers * 월최저임금;
                      const 월관리비 = Math.round(cat["관리비_공과금_만원per월"] * sizeMultiplier);
                      const 월고정비합계 = 월임대료 + 월관리비 + 월인건비;
                      const 원가율 = cat["원가율_%"];
                      const 손익분기_월매출 = Math.round(월고정비합계 / (1 - 원가율 / 100));
                      setCalcResult({ 구: gu, 동: dong, 층: calcFloor, 크기: calcSize, pyeong, rentPerSqm: floorData?.["임대료_만원per㎡"] ?? 4.0, 월임대료, 보증금, 인테리어, 설비집기, 초기재고, 초기합계, 월인건비, 월관리비, 월고정비합계, 원가율, 손익분기_월매출, 특이사항: cat["특이사항"], rentFallback: !guData?.[floorKey] });
                      setCalcStep(5);
                    }}
                    style={{ flex: 2, padding: "12px 0", borderRadius: 10, border: "none", background: calcFloor ? "#60A5FA" : "#E5E7EB", color: calcFloor ? "#fff" : "#9CA3AF", fontSize: 15, fontWeight: 700, cursor: calcFloor ? "pointer" : "default" }}>
                    결과 보기
                  </button>
                </div>
              </div>
            )}

            {/* 스텝 5: 카드형 결과 */}
            {calcStep === 5 && calcResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* 요약 헤더 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "linear-gradient(135deg,#60A5FA,#60A5FA)", borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>{calcResult.구}{calcResult.동 ? ` ${calcResult.동}` : ""} · {calcResult.크기} ({calcResult.pyeong}평) · {calcResult.층}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                      <CalcCatIcon cat={calcIndustry} size={18} color="#fff" />{calcIndustry}
                    </div>
                  </div>
                  <button onClick={() => setCalcStep(4)} style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>← 수정</button>
                </div>

                {/* 초기 창업비용 카드 */}
                <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 2 }}>📦 초기 창업비용 <span style={{ fontWeight: 400 }}>(일회성)</span></div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#3B82F6" }}>{calcResult.초기합계.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 600, color: "#6B7280" }}>만원</span></div>
                  </div>
                  <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {[["보증금", calcResult.보증금, calcResult.초기합계], ["인테리어", calcResult.인테리어, calcResult.초기합계], ["설비·집기", calcResult.설비집기, calcResult.초기합계], ["초기재고", calcResult.초기재고, calcResult.초기합계]].map(([label, val, total]) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: "#6B7280" }}>{label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{val.toLocaleString()}만원</span>
                        </div>
                        <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.round(val / total * 100)}%`, background: "#93C5FD", borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 월 고정비 카드 */}
                <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 2 }}>📅 월 고정비</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#059669" }}>{calcResult.월고정비합계.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 600, color: "#6B7280" }}>만원/월</span></div>
                  </div>
                  <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {[["임대료", calcResult.월임대료, calcResult.월고정비합계], ["관리비·공과금", calcResult.월관리비, calcResult.월고정비합계], ["인건비", calcResult.월인건비, calcResult.월고정비합계]].map(([label, val, total]) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: "#6B7280" }}>{label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{val.toLocaleString()}만원</span>
                        </div>
                        <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.round(val / total * 100)}%`, background: "#6EE7B7", borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 손익분기 카드 */}
                <div style={{ padding: "14px 16px", background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: "#92400E", fontWeight: 700, marginBottom: 6 }}>💡 손익분기점</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: "#D97706" }}>{calcResult.손익분기_월매출.toLocaleString()}</span>
                    <span style={{ fontSize: 13, color: "#92400E", fontWeight: 600 }}>만원/월 이상 매출 필요</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#B45309", marginTop: 4 }}>원가율 {calcResult.원가율}% 기준</div>
                  {calcResult.특이사항 && (
                    <div style={{ fontSize: 11, color: "#D97706", marginTop: 6, padding: "6px 10px", background: "rgba(217,119,6,0.08)", borderRadius: 6 }}>⚠️ {calcResult.특이사항}</div>
                  )}
                </div>

                {/* 주석 + 다시 계산 */}
                <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", lineHeight: 1.7 }}>
                  ※ {calcResult.구} 평균 임대료 기준 ({calcResult.층}{calcResult.rentFallback ? ", 1층 기준 적용" : ""}, {calcResult.rentPerSqm}만원/㎡)<br />
                  ※ 실제 비용은 달라질 수 있습니다. 참고용으로만 활용하세요.
                </div>
                <button onClick={() => { setCalcStep(1); setCalcResult(null); setCalcIndustry(null); setCalcRegion(""); setCalcDong(""); setCalcSize(null); setCalcFloor(null); setCalcDrillGroup(null); }}
                  style={{ padding: "11px 0", borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  처음부터 다시 계산하기
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── 프리미엄 AI 추천 모달 ── */}
      {/* 프리미엄 지도 선택 모드 — 좌상단 패널 */}
      {premiumMapPickMode && (
        <div style={{ position: "fixed", top: NAV_HEIGHT + 16, left: 16, zIndex: 3000, width: 280, background: "#fff", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
          {/* 헤더 */}
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>지역 선택</span>
            </div>
            <button
              onClick={() => { setPremiumMapPickMode(false); setPremiumMapPickCandidate(null); setPremiumModalOpen(true); setPremiumStep("q2"); }}
              style={{ fontSize: 16, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", lineHeight: 1, padding: 0 }}
            >✕</button>
          </div>

          {/* 안내 or 선택 결과 */}
          {!premiumMapPickCandidate ? (
            <div style={{ padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🗺️</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>지도에서 지역을 클릭하세요</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>구 또는 행정동을<br/>클릭하면 선택됩니다</div>
            </div>
          ) : (
            <div
              key={premiumMapPickCandidate.type === "dong"
                ? `${premiumMapPickCandidate.gu}-${premiumMapPickCandidate.dong}`
                : premiumMapPickCandidate.gu}
              className="anim-pop-in"
              style={{ padding: "16px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: premiumMapPickCandidate.type === "gu" ? "#EFF6FF" : "#F0FDF4", color: premiumMapPickCandidate.type === "gu" ? "#3B82F6" : "#10B981" }}>
                  {premiumMapPickCandidate.type === "gu" ? "구 전체" : "행정동"}
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
                  {premiumMapPickCandidate.type === "dong"
                    ? `${premiumMapPickCandidate.gu} ${premiumMapPickCandidate.dong}`
                    : premiumMapPickCandidate.gu}
                </span>
              </div>
              <button
                onClick={() => {
                  const item = premiumMapPickCandidate;
                  setPremiumRegionSelected(item);
                  setPremiumRegionQuery(item.type === "dong" ? `${item.gu} ${item.dong}` : item.gu);
                  setPremiumRegionSugg([]);
                  setPremiumMapPickMode(false);
                  setPremiumMapPickCandidate(null);
                  setPremiumModalOpen(true);
                  setPremiumStep("q2");
                }}
                style={{ width: "100%", padding: "11px 0", background: "linear-gradient(135deg, #2563EB, #3B82F6)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}
              >이 지역 선택하기 →</button>
              <button
                onClick={() => setPremiumMapPickCandidate(null)}
                style={{ width: "100%", padding: "9px 0", background: "#F3F4F6", color: "#6B7280", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >다시 선택</button>
            </div>
          )}
        </div>
      )}

      {/* 최소화 탭 */}
      {premiumModalOpen && premiumModalMinimized && (
        <button
          onClick={() => setPremiumModalMinimized(false)}
          style={{ position: "fixed", bottom: 200, right: 14, zIndex: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 0", width: 52, background: "linear-gradient(160deg, #2563EB, #3B82F6)", color: "#fff", border: "none", borderRadius: 12, boxShadow: "0 4px 16px rgba(37,99,235,0.45)", cursor: "pointer", animation: "premiumTabIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
          title="AI 추천 결과 보기"
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>💎</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0, lineHeight: 1.3, textAlign: "center" }}>AI<br/>결과</span>
        </button>
      )}

      {premiumModalOpen && !premiumModalMinimized && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setPremiumModalOpen(false)}
        >
          <div
            className={premiumFlyingIn ? "anim-fly-to-corner" : "anim-pop-in"}
            style={{ background: "#fff", borderRadius: 20, boxShadow: "0 20px 70px rgba(0,0,0,0.18)", border: "1px solid #E5E7EB", width: "78vw", maxWidth: 1100, minWidth: 480, height: "78vh", maxHeight: 860, padding: "32px", boxSizing: "border-box", display: "flex", flexDirection: "column", overflowY: "auto", transformOrigin: "bottom left" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>💎</span>
                  <span style={{ fontSize: 19, fontWeight: 700, color: "#111827" }}>프리미엄 AI 추천</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#6B9FE4", borderRadius: 4, padding: "1px 5px", lineHeight: 1.4 }}>beta</span>
                </div>
                <div style={{ fontSize: 13, color: "#6B7280", paddingLeft: 28 }}>
                  {{ q1: "맞춤형 창업 입지를 분석해 드립니다", q2: "창업 희망 지역을 선택해 주세요", q3: "창업 예산을 선택해 주세요", result: "AI 분석 결과입니다" }[premiumStep]}
                </div>
              </div>
              {/* 선택 요약 칩 — 선택된 값이 있으면 현재 step 포함 항상 표시 */}
              {(() => {
                const q1Done = !!premiumIndustrySelected;
                const q2Done = !!premiumRegionSelected;
                const q3Done = !!premiumBudget;
                if (!q1Done && !q2Done && !q3Done) return null;
                const chipStyle = { display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#F3F4F6", borderRadius: 8, border: "none", cursor: "pointer" };
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 12 }}>
                    {premiumStep !== "q1" && (
                      <button
                        onClick={() => setPremiumStep(premiumStep === "result" ? "q3" : premiumStep === "q3" ? "q2" : "q1")}
                        style={{ fontSize: 14, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0, flexShrink: 0 }}
                      >← 이전</button>
                    )}
                    {q1Done && (
                      <button onClick={() => setPremiumStep("q1")} style={chipStyle}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#E5E7EB"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#F3F4F6"}
                      >
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>업종</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: premiumStep === "q1" ? "#3B82F6" : "#374151" }}>{premiumSubcategorySelected ? `${premiumIndustrySelected} › ${premiumSubcategorySelected}` : (premiumIndustrySelected ?? "선택 안 함")}</span>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>✎</span>
                      </button>
                    )}
                    {q2Done && (
                      <button onClick={() => setPremiumStep("q2")} style={chipStyle}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#E5E7EB"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#F3F4F6"}
                      >
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>지역</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: premiumStep === "q2" ? "#3B82F6" : "#374151" }}>{premiumRegionSelected ? premiumRegionQuery : "선택 안 함"}</span>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>✎</span>
                      </button>
                    )}
                    {q3Done && (
                      <button onClick={() => setPremiumStep("q3")} style={chipStyle}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#E5E7EB"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#F3F4F6"}
                      >
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>예산</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: premiumStep === "q3" ? "#3B82F6" : "#374151" }}>{premiumBudget?.label ?? "선택 안 함"}</span>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>✎</span>
                      </button>
                    )}
                  </div>
                );
              })()}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {premiumStep === "result" && (
                  <button
                    onClick={() => setPremiumModalMinimized(true)}
                    title="최소화"
                    style={{ background: "#F3F4F6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", fontSize: 16 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                )}
                <button
                  onClick={() => setPremiumModalOpen(false)}
                  style={closeBtnStyle}
                >✕</button>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 20 }}>
              {/* ── Q1 ── */}
              {premiumStep === "q1" && (<>{/* Q1 */}
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6B9FE4" }}>Q1</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginLeft: 8 }}>창업을 희망하는 업종이 있나요?</span>
              </div>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 14px 0" }}>업종명을 검색하거나 목록에서 선택해 주세요.</p>

              {/* 검색 인풋 */}
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #D1D5DB", borderRadius: 10, padding: "10px 14px", gap: 8, background: "#F9FAFB" }}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="8.5" cy="8.5" r="5.5" stroke="#9CA3AF" strokeWidth="1.8"/>
                    <path d="M13 13l3.5 3.5" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  <input
                    autoFocus
                    value={premiumIndustryQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPremiumIndustryQuery(v);
                      setPremiumIndustrySelected(null);
                      setPremiumSubcategorySelected(null);
                      setPremiumIndustryDrillGroup(null);
                      // 소분류 API 검색
                      if (v.trim()) {
                        fetch(`${API}/api/suggest/industries-with-category/?q=${encodeURIComponent(v)}`)
                          .then(r => r.json())
                          .then(d => setPremiumSubcategorySugg(d.suggestions || []));
                      } else {
                        setPremiumSubcategorySugg([]);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing && !premiumIndustrySelected) {
                        e.preventDefault();
                        const filtered = Object.keys(STARTUP_COSTS).filter(k => k.includes(premiumIndustryQuery));
                        if (filtered.length > 0) {
                          setPremiumIndustrySelected(filtered[0]);
                          setPremiumIndustryQuery(filtered[0]);
                          setPremiumSubcategorySelected(null);
                          setPremiumTopResults(null);
                          setPremiumIndustryDrillGroup(null);
                          setPremiumSubcategorySugg([]);
                        } else if (premiumSubcategorySugg.length > 0) {
                          const s = premiumSubcategorySugg[0];
                          setPremiumIndustrySelected(s.통합카테고리);
                          setPremiumSubcategorySelected(s.소분류명 !== s.통합카테고리 ? s.소분류명 : null);
                          setPremiumIndustryQuery(s.소분류명);
                          setPremiumTopResults(null);
                          setPremiumIndustryDrillGroup(null);
                          setPremiumSubcategorySugg([]);
                        }
                      }
                    }}
                    placeholder="예: 냉면, 삼겹살, 카페, 미용실..."
                    style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#111827" }}
                  />
                  {premiumIndustryQuery && (
                    <button
                      onClick={() => { setPremiumIndustryQuery(""); setPremiumIndustrySelected(null); setPremiumSubcategorySelected(null); setPremiumIndustryDrillGroup(null); setPremiumSubcategorySugg([]); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: 0 }}
                    >✕</button>
                  )}
                </div>

                {/* 검색 드롭다운 — 통합카테고리 + 소분류 통합 표시 */}
                {premiumIndustryQuery && !premiumIndustrySelected && (() => {
                  const filteredCats = Object.keys(STARTUP_COSTS).filter(k => k.includes(premiumIndustryQuery));
                  // 소분류 결과 중 통합카테고리와 중복되지 않는 것만
                  const filteredSubs = premiumSubcategorySugg.filter(s => s.소분류명 !== s.통합카테고리);
                  if (filteredCats.length === 0 && filteredSubs.length === 0) return (
                    <div style={{ marginTop: 8, padding: "10px 14px", background: "#F9FAFB", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13, color: "#9CA3AF" }}>
                      일치하는 업종이 없습니다
                    </div>
                  );
                  return (
                    <div style={{ marginTop: 6, background: "#fff", borderRadius: 10, border: "1.5px solid #E5E7EB", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", maxHeight: 260, overflowY: "auto" }} className="no-scrollbar">
                      {filteredCats.length > 0 && (
                        <>
                          <div style={{ padding: "6px 14px 4px", fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.05em" }}>업종 카테고리</div>
                          {filteredCats.map((k, idx) => (
                            <button
                              key={k}
                              onClick={() => { setPremiumIndustrySelected(k); setPremiumSubcategorySelected(null); setPremiumIndustryQuery(k); setPremiumTopResults(null); setPremiumIndustryDrillGroup(null); setPremiumSubcategorySugg([]); }}
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", borderBottom: "1px solid #F9FAFB", background: "transparent", cursor: "pointer", fontSize: 14, color: "#111827" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#F3F4F6"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                            >
                              <span>{k}</span>
                              {idx === 0 && filteredSubs.length === 0 && <span style={{ fontSize: 10, color: "#9CA3AF", background: "#F3F4F6", borderRadius: 4, padding: "1px 6px" }}>Enter</span>}
                            </button>
                          ))}
                        </>
                      )}
                      {filteredSubs.length > 0 && (
                        <>
                          <div style={{ padding: "6px 14px 4px", fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.05em", borderTop: filteredCats.length > 0 ? "1px solid #F3F4F6" : "none" }}>세부 업종</div>
                          {filteredSubs.map((s, idx) => (
                            <button
                              key={s.소분류명 + idx}
                              onClick={() => { setPremiumIndustrySelected(s.통합카테고리); setPremiumSubcategorySelected(s.소분류명); setPremiumIndustryQuery(s.소분류명); setPremiumTopResults(null); setPremiumIndustryDrillGroup(null); setPremiumSubcategorySugg([]); }}
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", borderBottom: idx < filteredSubs.length - 1 ? "1px solid #F9FAFB" : "none", background: "transparent", cursor: "pointer", fontSize: 14, color: "#111827" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#F3F4F6"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                            >
                              <span>{s.소분류명}</span>
                              <span style={{ fontSize: 11, color: "#9CA3AF", background: "#F9FAFB", borderRadius: 4, padding: "2px 7px", flexShrink: 0 }}>{s.통합카테고리}</span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* 카테고리 그룹 드릴다운 (검색어 없을 때) */}
              {!premiumIndustryQuery && !premiumIndustrySelected && (
                <div style={{ marginTop: 12 }}>
                  {!premiumIndustryDrillGroup ? (
                    <>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>카테고리로 찾기</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {["음식", "소매", "서비스"].map(group => (
                          <button
                            key={group}
                            onClick={() => { setPremiumIndustryDrillGroup(group); setPremiumCatDrillSub(null); setPremiumCatSubList([]); }}
                            style={{ flex: 1, padding: "10px 0", border: "1.5px solid #E5E7EB", borderRadius: 10, background: "#F9FAFB", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151", transition: "all 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6B9FE4"; e.currentTarget.style.background = "rgba(107,159,228,0.06)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "#F9FAFB"; }}
                          >
                            <div style={{ fontSize: 16, marginBottom: 2 }}>{{ 음식: "🍽️", 소매: "🛍️", 서비스: "💼" }[group]}</div>
                            {group}
                            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>{CATEGORY_GROUPS[group].length}개</div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : !premiumCatDrillSub ? (
                    // Level 2: 통합카테고리 목록
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <button
                          onClick={() => setPremiumIndustryDrillGroup(null)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#6B9FE4", fontWeight: 600, padding: 0 }}
                        >← 카테고리</button>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{{ 음식: "🍽️", 소매: "🛍️", 서비스: "💼" }[premiumIndustryDrillGroup]} {premiumIndustryDrillGroup}</span>
                      </div>
                      <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid #E5E7EB", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", maxHeight: 220, overflowY: "auto" }} className="no-scrollbar">
                        {CATEGORY_GROUPS[premiumIndustryDrillGroup].map((k, idx, arr) => (
                          <button
                            key={k}
                            onClick={() => {
                              setPremiumCatDrillSub(k);
                              fetch(`${API}/api/suggest/industries/?category=${encodeURIComponent(k)}`)
                                .then(r => r.json())
                                .then(d => setPremiumCatSubList(d.suggestions || []));
                            }}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", padding: "10px 16px", border: "none", borderBottom: idx < arr.length - 1 ? "1px solid #F9FAFB" : "none", background: "transparent", cursor: "pointer", fontSize: 14, color: "#111827" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#F3F4F6"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <span>{k}</span>
                            <span style={{ fontSize: 11, color: "#9CA3AF" }}>세부 →</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    // Level 3: 소분류 목록
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <button
                          onClick={() => { setPremiumCatDrillSub(null); setPremiumCatSubList([]); }}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#6B9FE4", fontWeight: 600, padding: 0 }}
                        >← {premiumCatDrillSub}</button>
                      </div>
                      <div style={{ background: "#fff", borderRadius: 10, border: "1.5px solid #E5E7EB", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", maxHeight: 220, overflowY: "auto" }} className="no-scrollbar">
                        {/* 통합카테고리 전체 선택 */}
                        <button
                          onClick={() => { setPremiumIndustrySelected(premiumCatDrillSub); setPremiumSubcategorySelected(null); setPremiumIndustryQuery(premiumCatDrillSub); setPremiumTopResults(null); setPremiumIndustryDrillGroup(null); setPremiumCatDrillSub(null); setPremiumCatSubList([]); }}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", padding: "10px 16px", border: "none", borderBottom: "1px solid #E5E7EB", background: "#F8FAFF", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#1D4ED8" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#EFF6FF"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "#F8FAFF"}
                        >
                          <span>{premiumCatDrillSub} 전체</span>
                          <span style={{ fontSize: 11, color: "#6B9FE4" }}>트렌드 없음</span>
                        </button>
                        {/* 소분류 목록 */}
                        {premiumCatSubList.map((sub, idx) => (
                          <button
                            key={sub}
                            onClick={() => { setPremiumIndustrySelected(premiumCatDrillSub); setPremiumSubcategorySelected(sub); setPremiumIndustryQuery(sub); setPremiumTopResults(null); setPremiumIndustryDrillGroup(null); setPremiumCatDrillSub(null); setPremiumCatSubList([]); }}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", padding: "10px 16px", border: "none", borderBottom: idx < premiumCatSubList.length - 1 ? "1px solid #F9FAFB" : "none", background: "transparent", cursor: "pointer", fontSize: 14, color: "#111827" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#F3F4F6"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <span>{sub}</span>
                            <span style={{ fontSize: 10, color: "#10B981", background: "rgba(16,185,129,0.08)", borderRadius: 4, padding: "2px 7px" }}>트렌드 ✓</span>
                          </button>
                        ))}
                        {premiumCatSubList.length === 0 && (
                          <div style={{ padding: "12px 16px", fontSize: 13, color: "#9CA3AF" }}>소분류 데이터 없음</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 선택 완료 표시 */}
              {premiumIndustrySelected && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(107,159,228,0.08)", borderRadius: 10, border: "1px solid #6B9FE4" }}>
                  <div>
                    <span style={{ fontSize: 13, color: "#1D4ED8", fontWeight: 600 }}>✓ {premiumIndustrySelected}</span>
                    {premiumSubcategorySelected && (
                      <span style={{ fontSize: 13, color: "#10B981", fontWeight: 600 }}> › {premiumSubcategorySelected}</span>
                    )}
                    {premiumSubcategorySelected && (
                      <div style={{ fontSize: 11, color: "#10B981", marginTop: 2 }}>트렌드 정보 포함</div>
                    )}
                  </div>
                  <button
                    onClick={() => { setPremiumIndustrySelected(null); setPremiumSubcategorySelected(null); setPremiumIndustryQuery(""); setPremiumIndustryDrillGroup(null); setPremiumSubcategorySugg([]); }}
                    style={{ fontSize: 12, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}
                  >변경</button>
                </div>
              )}

              {/* 업종 미정 옵션 */}
              {!premiumIndustrySelected && (
                <div style={{ marginTop: 20 }}>
                  {/* 구분선 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                    <span style={{ fontSize: 11, color: "#D1D5DB", fontWeight: 500, whiteSpace: "nowrap" }}>업종을 모르신다면</span>
                    <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                  </div>

                  {/* 업종 추천받기 */}
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <button
                      onClick={() => {
                        if (premiumTopResults) { setPremiumTopResults(null); return; }
                        setPremiumTopLoading(true);
                        fetch(`${API}/api/recommend/top-industries/`)
                          .then(r => r.json())
                          .then(data => { setPremiumTopResults(data); })
                          .catch(() => setPremiumTopResults({ error: true }))
                          .finally(() => setPremiumTopLoading(false));
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: premiumTopResults ? "#3B82F6" : "#6B7280", textDecoration: "underline", textDecorationStyle: "dashed", textUnderlineOffset: 3, padding: "4px 8px", transition: "color 0.15s" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#374151"}
                      onMouseLeave={(e) => e.currentTarget.style.color = premiumTopResults ? "#3B82F6" : "#6B7280"}
                    >
                      {premiumTopResults ? "✓ 업종 추천 결과 보는 중 (접기)" : "💡 요즘 잘되는 업종 추천받기"}
                    </button>
                  </div>

                </div>
              )}

              {/* 업종 추천 로딩 */}
              {premiumTopLoading && (
                <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "20px 0", color: "#6B7280", fontSize: 14 }}>
                  <div style={{ width: 18, height: 18, border: "2.5px solid #E5E7EB", borderTopColor: "#6B9FE4", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  서울 전체 업종 데이터 분석 중...
                </div>
              )}

              {/* Top 10 업종 결과 */}
              {premiumTopResults && !premiumTopResults.error && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>서울 전체 유망 업종 Top 10</span>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{String(premiumTopResults.quarter).slice(0,4)}년 {String(premiumTopResults.quarter).slice(4)}분기 기준</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", background: "#F8FAFF", borderRadius: 10, border: "1px solid #E0EAFF", marginBottom: 12 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>📊</span>
                    <div style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.7 }}>
                      <span style={{ fontWeight: 700, color: "#374151" }}>추천 점수 산출 기준</span><br />
                      AI 성장확률 <strong>40%</strong> · A등급 비율 <strong>20%</strong> · 점포당 매출 <strong>20%</strong> · 폐업률 낮을수록 <strong>10%</strong> · 포화도 낮을수록 <strong>10%</strong>을 종합해 서울 전체 행정동 데이터를 기반으로 산출합니다.
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }} className="no-scrollbar">
                    {premiumTopResults.results.map((item, i) => {
                      const rankColors = ["#F59E0B", "#9CA3AF", "#CD7F32"];
                      const rankColor = i < 3 ? rankColors[i] : "#D1D5DB";
                      const barWidth = Math.round(item.score);
                      return (
                        <button
                          key={item.category}
                          onClick={() => { setPremiumIndustrySelected(item.category); setPremiumIndustryQuery(item.category); setPremiumTopResults(null); }}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: 12, background: "#FAFAFA", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6B9FE4"; e.currentTarget.style.background = "rgba(107,159,228,0.06)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "#FAFAFA"; }}
                        >
                          {/* 순위 */}
                          <span style={{ width: 26, height: 26, borderRadius: "50%", background: rankColor, color: i < 3 ? "#fff" : "#6B7280", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                          {/* 업종명 + 바 */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.category}</span>
                              <span style={{ fontSize: 12, color: "#6B7280", flexShrink: 0 }}>성장확률 {item.avg_성장확률}점</span>
                            </div>
                            <div style={{ height: 5, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${barWidth}%`, background: "linear-gradient(90deg, #6B9FE4, #8B5CF6)", borderRadius: 4, transition: "width 0.6s ease" }} />
                            </div>
                          </div>
                          {/* 세부 지표 */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
                            <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>A등급 {item.a_rate}%</span>
                            <span style={{ fontSize: 11, color: "#9CA3AF" }}>폐업률 {item.avg_폐업률}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 10, textAlign: "center" }}>업종을 클릭하면 바로 선택됩니다</p>
                </div>
              )}

              {premiumTopResults?.error && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: "#FEF2F2", borderRadius: 10, fontSize: 13, color: "#EF4444" }}>
                  데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
                </div>
              )}

              {/* 다음 버튼 */}
              {!premiumTopResults?.results && (
                <button
                  disabled={!premiumIndustrySelected}
                  onClick={() => { if (premiumIndustrySelected) setPremiumStep("q2"); }}
                  style={{ width: "100%", marginTop: 20, padding: "13px 0", background: premiumIndustrySelected ? "linear-gradient(135deg, #2563EB, #3B82F6)" : "#E5E7EB", color: premiumIndustrySelected ? "#fff" : "#9CA3AF", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: premiumIndustrySelected ? "pointer" : "not-allowed", transition: "all 0.2s" }}
                >
                  다음 →
                </button>
              )}
              </>)}

              {/* ── Q2 ── */}
              {premiumStep === "q2" && (
                <>
                  {/* Q2 질문 */}
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6B9FE4" }}>Q2</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginLeft: 8 }}>지역을 골라주세요</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 14px 0" }}>구 또는 행정동명을 검색해 주세요.</p>

                  {/* 검색 인풋 */}
                  <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #D1D5DB", borderRadius: 10, padding: "10px 14px", gap: 8, background: "#F9FAFB" }}>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="8.5" cy="8.5" r="5.5" stroke="#9CA3AF" strokeWidth="1.8"/>
                        <path d="M13 13l3.5 3.5" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      <input
                        autoFocus
                        value={premiumRegionQuery}
                        onChange={(e) => {
                          const q = e.target.value;
                          setPremiumRegionQuery(q);
                          setPremiumRegionSelected(null);
                          setPremiumRegionSugg([]);
                          if (!q.trim()) return;
                          // "강남구" 또는 "강남구 세" 형태 모두 처리
                          const matchedGu = REGIONS.find(g => q === g || q.startsWith(g + " ") || q.startsWith(g));
                          if (matchedGu) {
                            const dongQuery = q.slice(matchedGu.length).trim();
                            fetch(`${API}/api/search/regions/?gu=${encodeURIComponent(matchedGu)}`)
                              .then(r => r.json())
                              .then(d => {
                                let results = d.results || [];
                                if (dongQuery) results = results.filter(item => item.dong.includes(dongQuery));
                                // 구 전체 옵션을 맨 앞에 추가 (행정동 검색어 없을 때만)
                                if (!dongQuery) results = [{ gu: matchedGu, type: "gu" }, ...results];
                                setPremiumRegionSugg(results);
                              });
                          } else {
                            searchRegionSuggest(q, "all", setPremiumRegionSugg);
                          }
                        }}
                        placeholder="예: 강남구, 역삼1동..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.nativeEvent.isComposing && premiumRegionSugg.length > 0 && !premiumRegionSelected) {
                            e.preventDefault();
                            const first = premiumRegionSugg[0];
                            setPremiumRegionSelected(first);
                            setPremiumRegionQuery(first.dong ? `${first.gu} ${first.dong}`.trim() : first.gu);
                            setPremiumRegionSugg([]);
                          }
                        }}
                        style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#111827" }}
                      />
                      {premiumRegionQuery && (
                        <button
                          onClick={() => { setPremiumRegionQuery(""); setPremiumRegionSelected(null); setPremiumRegionSugg([]); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: 0 }}
                        >✕</button>
                      )}
                    </div>

                    {/* 드롭다운 */}
                    {premiumRegionSugg.length > 0 && !premiumRegionSelected && (
                      <div style={{ marginTop: 6, background: "#fff", borderRadius: 10, border: "1.5px solid #E5E7EB", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", maxHeight: 240, overflowY: "auto" }} className="no-scrollbar">
                        {premiumRegionSugg.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setPremiumRegionSelected(item);
                              setPremiumRegionQuery(item.dong ? `${item.gu} ${item.dong}`.trim() : item.gu);
                              setPremiumRegionSugg([]);
                            }}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", padding: "10px 16px", border: "none", borderBottom: idx < premiumRegionSugg.length - 1 ? "1px solid #F9FAFB" : "none", background: item.type === "gu" ? "#F8FAFF" : "transparent", cursor: "pointer", fontSize: 14, color: "#111827" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#F3F4F6"}
                            onMouseLeave={(e) => e.currentTarget.style.background = item.type === "gu" ? "#F8FAFF" : "transparent"}
                          >
                            <span style={{ fontWeight: item.type === "gu" ? 700 : 400 }}>
                              {item.dong ? `${item.gu} ${item.dong}` : item.gu}
                            </span>
                            {item.type === "gu" && <span style={{ fontSize: 11, color: "#6B9FE4", fontWeight: 600 }}>구 전체</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 지도에서 선택하기 버튼 */}
                  {!premiumRegionSelected && (
                    <button
                      onClick={() => {
                        setPremiumMapPickMode(true);
                        setPremiumMapPickCandidate(null);
                        setPremiumModalOpen(false);
                        // 기존 사이드바 패널 닫기 (겹침 방지)
                        setSidebarCollapsed(true);
                        setSelectedDong(null);
                        setSelectedGu(null);
                      }}
                      style={{ width: "100%", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", border: "1.5px dashed #6B9FE4", borderRadius: 12, background: "rgba(107,159,228,0.05)", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#3B82F6", transition: "all 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(107,159,228,0.12)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(107,159,228,0.05)"; }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      지도에서 선택하기
                    </button>
                  )}

                  {/* 선택 완료 표시 */}
                  {premiumRegionSelected && (
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(107,159,228,0.08)", borderRadius: 10, border: "1px solid #6B9FE4" }}>
                      <span style={{ fontSize: 13, color: "#1D4ED8", fontWeight: 600 }}>✓ {premiumRegionQuery} 선택됨</span>
                      <button onClick={() => { setPremiumRegionSelected(null); setPremiumRegionQuery(""); }} style={{ fontSize: 12, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}>변경</button>
                    </div>
                  )}

                  {/* 다음 버튼 */}
                  <button
                    disabled={!premiumRegionSelected}
                    onClick={() => { if (premiumRegionSelected) setPremiumStep("q3"); }}
                    style={{ width: "100%", marginTop: 14, padding: "13px 0", background: premiumRegionSelected ? "linear-gradient(135deg, #2563EB, #3B82F6)" : "#E5E7EB", color: premiumRegionSelected ? "#fff" : "#9CA3AF", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: premiumRegionSelected ? "pointer" : "not-allowed", transition: "all 0.2s" }}
                  >
                    다음 →
                  </button>
                </>
              )}

              {/* ── Q3 ── */}
              {premiumStep === "q3" && (
                <>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6B9FE4" }}>Q3</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginLeft: 8 }}>창업 예산이 얼마나 되세요?</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 16px 0" }}>예산 범위에 맞는 업종과 입지를 분석해 드립니다.</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "3천만원 미만",       sub: "소규모 창업 · 1인 운영",         min: 0,    max: 3000  },
                      { label: "3천만원 ~ 5천만원",   sub: "중소형 매장 · 인테리어 포함",     min: 3000, max: 5000  },
                      { label: "5천만원 ~ 1억원",     sub: "일반 매장 · 설비 구비",           min: 5000, max: 10000 },
                      { label: "1억원 ~ 2억원",       sub: "프리미엄 매장 · 프랜차이즈",      min: 10000,max: 20000 },
                      { label: "2억원 이상",          sub: "대형 매장 · 복합 업종",           min: 20000,max: null  },
                    ].map((opt) => {
                      const selected = premiumBudget?.label === opt.label;
                      return (
                        <button
                          key={opt.label}
                          onClick={() => { setPremiumBudget(opt); }}
                          style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", border: `1.5px solid ${selected ? "#3B82F6" : "#E5E7EB"}`, borderRadius: 12, background: selected ? "rgba(59,130,246,0.06)" : "#F9FAFB", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                          onMouseEnter={(e) => { if (!selected) { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.background = "#F3F4F6"; } }}
                          onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.background = "#F9FAFB"; } }}
                        >
                          <span style={{ width: 20, height: 20, borderRadius: "50%", border: selected ? "none" : "2px solid #D1D5DB", background: selected ? "#3B82F6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {selected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "block" }} />}
                          </span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: selected ? 700 : 500, color: selected ? "#1D4ED8" : "#111827" }}>{opt.label}</div>
                            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{opt.sub}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={!premiumBudget}
                    onClick={() => {
                      if (!premiumBudget) return;
                      const category = premiumIndustrySelected;
                      const region = premiumRegionSelected;
                      setPremiumResultLoading(true);
                      setPremiumStep("result");

                      if (category && region) {
                        // 업종 O + 지역 O
                        if (region.type === "gu") {
                          fetch(`${API}/api/recommend/location/?업종=${encodeURIComponent(category)}&gu=${encodeURIComponent(region.gu)}`)
                            .then(r => r.json())
                            .then(data => setPremiumResult({ type: "gu", gu: region.gu, category, data }))
                            .catch(() => setPremiumResult({ error: "데이터를 불러오지 못했습니다." }))
                            .finally(() => setPremiumResultLoading(false));
                        } else {
                          Promise.all([
                            fetch(`${API}/api/recommend/score/?dong=${encodeURIComponent(region.dong)}&category=${encodeURIComponent(category)}`).then(r => r.json()),
                            fetch(`${API}/api/recommend/gu-streets/?gu=${encodeURIComponent(region.gu)}&category=${encodeURIComponent(category)}`).then(r => r.json()),
                          ])
                            .then(([score, streets]) => setPremiumResult({ type: "dong", dong: region.dong, gu: region.gu, category, score, streets }))
                            .catch(() => setPremiumResult({ error: "데이터를 불러오지 못했습니다." }))
                            .finally(() => setPremiumResultLoading(false));
                        }
                      } else if (category && !region) {
                        // 업종 O + 지역 X → 서울 전체 행정동 추천
                        fetch(`${API}/api/recommend/location/?업종=${encodeURIComponent(category)}`)
                          .then(r => r.json())
                          .then(data => setPremiumResult({ type: "gu", gu: "서울 전체", category, data }))
                          .catch(() => setPremiumResult({ error: "데이터를 불러오지 못했습니다." }))
                          .finally(() => setPremiumResultLoading(false));
                      } else if (!category && region) {
                        // 업종 X + 지역 O → 해당 지역 Top 업종 추천
                        if (region.type === "gu") {
                          fetch(`${API}/api/recommend/gu-industry/?gu=${encodeURIComponent(region.gu)}`)
                            .then(r => r.json())
                            .then(data => setPremiumResult({ type: "industry_gu", gu: region.gu, data }))
                            .catch(() => setPremiumResult({ error: "데이터를 불러오지 못했습니다." }))
                            .finally(() => setPremiumResultLoading(false));
                        } else {
                          fetch(`${API}/api/recommend/industry/?dong=${encodeURIComponent(region.dong)}`)
                            .then(r => r.json())
                            .then(data => setPremiumResult({ type: "industry_dong", dong: region.dong, gu: region.gu, data }))
                            .catch(() => setPremiumResult({ error: "데이터를 불러오지 못했습니다." }))
                            .finally(() => setPremiumResultLoading(false));
                        }
                      } else {
                        // 업종 X + 지역 X → 서울 전체 Top 업종
                        fetch(`${API}/api/recommend/top-industries/`)
                          .then(r => r.json())
                          .then(data => setPremiumResult({ type: "industry_all", data }))
                          .catch(() => setPremiumResult({ error: "데이터를 불러오지 못했습니다." }))
                          .finally(() => setPremiumResultLoading(false));
                      }
                    }}
                    style={{ width: "100%", marginTop: 14, padding: "13px 0", background: premiumBudget ? "linear-gradient(135deg, #2563EB, #3B82F6)" : "#E5E7EB", color: premiumBudget ? "#fff" : "#9CA3AF", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: premiumBudget ? "pointer" : "not-allowed", transition: "all 0.2s" }}
                  >
                    결과 보기 →
                  </button>
                </>
              )}

              {/* ── 결과 화면 ── */}
              {premiumStep === "result" && (
                <>
                  {/* 다시 분석 버튼 */}
                  <button
                    onClick={() => { setPremiumStep("q3"); setPremiumResult(null); }}
                    style={{ fontSize: 14, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "0 0 16px 0" }}
                  >← 다시 설정</button>

                  {/* 로딩 */}
                  {premiumResultLoading && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 0", color: "#6B7280", fontSize: 14 }}>
                      <div style={{ width: 28, height: 28, border: "3px solid #E5E7EB", borderTopColor: "#6B9FE4", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      데이터를 분석하고 있습니다...
                    </div>
                  )}

                  {/* 에러 */}
                  {!premiumResultLoading && premiumResult?.error && (
                    <div style={{ padding: "16px", background: "#FEF2F2", borderRadius: 12, fontSize: 14, color: "#EF4444" }}>
                      {premiumResult.error}
                    </div>
                  )}

                  {/* ── 예산 카드 (업종 선택 시 항상 표시) ── */}
                  {!premiumResultLoading && premiumResult && !premiumResult.error && premiumBudget && premiumResult.category && (() => {
                    const est = calcStartupCost(premiumResult.category);
                    if (!est) return null;
                    const budgetMax = premiumBudget.max;
                    const fit = budgetMax === null || est <= budgetMax;
                    return (
                      <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${fit ? "#10B981" : "#F59E0B"}`, background: fit ? "rgba(16,185,129,0.05)" : "rgba(245,158,11,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>
                              {premiumResult.category} 예상 창업비용 <span style={{ fontSize: 10 }}>(20평·보증금 포함)</span>
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
                              약 {est >= 10000 ? `${(est / 10000).toFixed(1)}억` : `${est.toLocaleString()}만`}원
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>선택 예산</div>
                            <span style={{ fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: fit ? "#10B981" : "#F59E0B", color: "#fff" }}>
                              {fit ? "✓ 예산 적합" : "⚠ 예산 초과"} · {premiumBudget.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── 구 선택 결과: 행정동 추천 리스트 ── */}
                  {!premiumResultLoading && premiumResult?.type === "gu" && (() => {
                    const { gu, category, data } = premiumResult;
                    const results = data?.results || [];
                    const gradeColor = { A: "#10B981", B: "#3B82F6", C: "#F59E0B", D: "#EF4444" };
                    const trendIcon = { 상승: "↑", 하락: "↓", 유지: "→", 없음: "?" };
                    const trendColor = { 상승: "#10B981", 하락: "#EF4444", 유지: "#6B7280", 없음: "#D1D5DB" };
                    return (
                      <div>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
                            {gu} × {category} 추천 행정동
                          </div>
                          <div style={{ fontSize: 13, color: "#6B7280" }}>AI 성장확률·매출·유동인구를 종합한 Top {results.length} 행정동입니다</div>
                          {premiumSubcategorySelected && (
                            <div style={{ marginTop: 6, fontSize: 12, color: "#3B82F6" }}>
                              📊 <b>{premiumSubcategorySelected}</b> 점포 트렌드 (2025 1→4분기) 포함
                            </div>
                          )}
                        </div>
                        {results.length === 0
                          ? <div style={{ padding: "20px 0", color: "#9CA3AF", fontSize: 14 }}>추천 결과가 없습니다.</div>
                          : results.map((item, i) => {
                            const rankColors = ["#F59E0B", "#9CA3AF", "#CD7F32"];
                            const trend = premiumTrendData?.[item.dong];
                            return (
                              <div
                                key={item.dong}
                                onClick={() => navigatePremiumDong(item.dong, gu)}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.cursor = "pointer"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#FAFAFA"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
                                style={{ padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: 12, marginBottom: 8, background: "#FAFAFA", transition: "background 0.15s, border-color 0.15s" }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: i < 3 ? rankColors[i] : "#E5E7EB", color: i < 3 ? "#fff" : "#6B7280", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{item.dong}</span>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 11, color: "#93C5FD" }}>📍 지도로 이동</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: gradeColor[item.grade] ?? "#6B7280", background: `${gradeColor[item.grade] ?? "#E5E7EB"}18`, padding: "2px 8px", borderRadius: 6 }}>{item.grade}등급</span>
                                      </div>
                                    </div>
                                    <div style={{ height: 5, background: "#F3F4F6", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                                      <div style={{ height: "100%", width: `${item.score ?? item.성장확률 ?? 0}%`, background: "linear-gradient(90deg, #6B9FE4, #8B5CF6)", borderRadius: 4 }} />
                                    </div>
                                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6B7280" }}>
                                      <span>성장확률 <b style={{ color: "#374151" }}>{item.성장확률}점</b></span>
                                      {item.점포당매출 > 0 && <span>점포당 매출 <b style={{ color: "#374151" }}>{Math.round(item.점포당매출 / 10000).toLocaleString()}만</b></span>}
                                    </div>
                                    {/* 소분류 트렌드 뱃지 */}
                                    {trend && (
                                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 11, color: "#6B7280" }}>{premiumSubcategorySelected}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: trendColor[trend.trend] }}>
                                          {trendIcon[trend.trend]} {trend.trend}
                                        </span>
                                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                                          현재 {trend.latest_count}개
                                          {trend.change !== 0 && (
                                            <span style={{ color: trend.change > 0 ? "#10B981" : "#EF4444" }}>
                                              {" "}({trend.change > 0 ? "+" : ""}{trend.change})
                                            </span>
                                          )}
                                        </span>
                                        {trend.counts && (
                                          <span style={{ fontSize: 10, color: "#D1D5DB", marginLeft: "auto" }}>
                                            {trend.counts.join(" → ")}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    );
                  })()}

                  {/* ── 행정동 선택 결과: 종합점수 + 길단위 상권 ── */}
                  {/* ── 업종 X + 지역 O(구) 결과: 해당 구 Top 업종 ── */}
                  {!premiumResultLoading && premiumResult?.type === "industry_gu" && (() => {
                    const { gu, data } = premiumResult;
                    const results = data?.results || [];
                    const compColor = { "낮음": "#10B981", "중간": "#F59E0B", "높음": "#EF4444" };
                    return (
                      <div>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{gu} 추천 업종 Top {results.length}</div>
                          <div style={{ fontSize: 13, color: "#6B7280" }}>AI 성장확률·매출·경쟁강도를 종합한 창업 유망 업종입니다</div>
                        </div>
                        {results.length === 0
                          ? <div style={{ padding: "20px 0", color: "#9CA3AF", fontSize: 14 }}>추천 결과가 없습니다.</div>
                          : results.map((item, i) => {
                            const rankColors = ["#F59E0B", "#9CA3AF", "#CD7F32"];
                            const est = premiumBudget ? calcStartupCost(item.통합카테고리) : null;
                            const budgetFit = est === null ? null : (premiumBudget.max === null || est <= premiumBudget.max);
                            return (
                              <div key={item.통합카테고리} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: 12, marginBottom: 8, background: "#FAFAFA" }}>
                                <span style={{ width: 26, height: 26, borderRadius: "50%", background: i < 3 ? rankColors[i] : "#E5E7EB", color: i < 3 ? "#fff" : "#6B7280", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{item.통합카테고리}</span>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                      {budgetFit !== null && (
                                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: budgetFit ? "#10B981" : "#F59E0B", color: "#fff" }}>
                                          {budgetFit ? "✓ 예산 적합" : "⚠ 초과"}
                                        </span>
                                      )}
                                      <span style={{ fontSize: 11, fontWeight: 600, color: compColor[item.경쟁강도] ?? "#6B7280", background: `${compColor[item.경쟁강도] ?? "#E5E7EB"}18`, padding: "2px 8px", borderRadius: 6 }}>경쟁 {item.경쟁강도}</span>
                                    </div>
                                  </div>
                                  <div style={{ height: 5, background: "#F3F4F6", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                                    <div style={{ height: "100%", width: `${item.score ?? 0}%`, background: "linear-gradient(90deg, #6B9FE4, #8B5CF6)", borderRadius: 4 }} />
                                  </div>
                                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6B7280" }}>
                                    <span>성장확률 <b style={{ color: "#374151" }}>{item.avg_성장확률}점</b></span>
                                    {item.총매출 > 0 && <span>구 내 총매출 <b style={{ color: "#374151" }}>{item.총매출 >= 1e8 ? `${(item.총매출 / 1e8).toFixed(0)}억` : `${Math.round(item.총매출 / 1e4).toLocaleString()}만`}</b></span>}
                                    <span>점포수 <b style={{ color: "#374151" }}>{(item.총점포수 || 0).toLocaleString()}</b></span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    );
                  })()}

                  {/* ── 업종 X + 지역 O(동) 결과: 해당 행정동 Top 업종 ── */}
                  {!premiumResultLoading && premiumResult?.type === "industry_dong" && (() => {
                    const { dong, gu, data } = premiumResult;
                    const results = data?.results || [];
                    const gradeColor = { A: "#10B981", B: "#3B82F6", C: "#F59E0B", D: "#EF4444" };
                    return (
                      <div>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{dong} 추천 업종 Top {results.length}</div>
                          <div style={{ fontSize: 13, color: "#6B7280" }}>{gu} · AI 성장확률·매출·경쟁강도를 종합한 창업 유망 업종입니다</div>
                        </div>
                        {results.length === 0
                          ? <div style={{ padding: "20px 0", color: "#9CA3AF", fontSize: 14 }}>추천 결과가 없습니다.</div>
                          : results.map((item, i) => {
                            const rankColors = ["#F59E0B", "#9CA3AF", "#CD7F32"];
                            const est = premiumBudget ? calcStartupCost(item.category) : null;
                            const budgetFit = est === null ? null : (premiumBudget.max === null || est <= premiumBudget.max);
                            return (
                              <div key={item.category} style={{ padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: 12, marginBottom: 8, background: "#FAFAFA" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: i < 3 ? rankColors[i] : "#E5E7EB", color: i < 3 ? "#fff" : "#6B7280", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", flex: 1 }}>{item.category}</span>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    {budgetFit !== null && (
                                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: budgetFit ? "#10B981" : "#F59E0B", color: "#fff" }}>
                                        {budgetFit ? "✓ 적합" : "⚠ 초과"}
                                      </span>
                                    )}
                                    <span style={{ fontSize: 12, fontWeight: 700, color: gradeColor[item.등급] ?? "#6B7280", background: `${gradeColor[item.등급] ?? "#E5E7EB"}18`, padding: "2px 8px", borderRadius: 6 }}>{item.등급}등급</span>
                                  </div>
                                </div>
                                <div style={{ height: 5, background: "#F3F4F6", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                                  <div style={{ height: "100%", width: `${item.score ?? 0}%`, background: "linear-gradient(90deg, #6B9FE4, #8B5CF6)", borderRadius: 4 }} />
                                </div>
                                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6B7280", flexWrap: "wrap", marginBottom: item.tags?.length > 0 ? 6 : 0 }}>
                                  <span>성장확률 <b style={{ color: "#374151" }}>{item.성장확률}점</b></span>
                                  {item.revenue > 0 && <span>월매출 <b style={{ color: "#374151" }}>{item.revenue >= 1e8 ? `${(item.revenue / 1e8).toFixed(1)}억` : `${Math.round(item.revenue / 1e4).toLocaleString()}만`}</b></span>}
                                  <span>경쟁 <b style={{ color: "#374151" }}>{item.competition}</b></span>
                                </div>
                                {item.tags?.length > 0 && (
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {item.tags.map(t => <span key={t} style={{ fontSize: 11, background: "#EFF6FF", color: "#3B82F6", borderRadius: 6, padding: "2px 7px" }}>{t}</span>)}
                                  </div>
                                )}
                                {item.reason && <div style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>{item.reason}</div>}
                              </div>
                            );
                          })
                        }
                      </div>
                    );
                  })()}

                  {/* ── 업종 X + 지역 X 결과: 서울 전체 Top 업종 ── */}
                  {!premiumResultLoading && premiumResult?.type === "industry_all" && (() => {
                    const results = premiumResult.data?.results || [];
                    return (
                      <div>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 4 }}>서울 전체 유망 업종 Top {results.length}</div>
                          <div style={{ fontSize: 13, color: "#6B7280" }}>AI 성장확률·A등급 비율·점포당 매출·폐업률·포화도를 종합한 추천입니다</div>
                        </div>
                        {results.map((item, i) => {
                          const rankColors = ["#F59E0B", "#9CA3AF", "#CD7F32"];
                          const est = premiumBudget ? calcStartupCost(item.category) : null;
                          const budgetFit = est === null ? null : (premiumBudget.max === null || est <= premiumBudget.max);
                          return (
                            <div key={item.category} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: 12, marginBottom: 8, background: "#FAFAFA" }}>
                              <span style={{ width: 26, height: 26, borderRadius: "50%", background: i < 3 ? rankColors[i] : "#E5E7EB", color: i < 3 ? "#fff" : "#6B7280", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{item.category}</span>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    {budgetFit !== null && (
                                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: budgetFit ? "#10B981" : "#F59E0B", color: "#fff" }}>
                                        {budgetFit ? "✓ 적합" : "⚠ 초과"}
                                      </span>
                                    )}
                                    <span style={{ fontSize: 11, color: "#6B7280" }}>A등급 <b style={{ color: "#10B981" }}>{item.a_rate}%</b></span>
                                  </div>
                                </div>
                                <div style={{ height: 5, background: "#F3F4F6", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                                  <div style={{ height: "100%", width: `${item.score ?? 0}%`, background: "linear-gradient(90deg, #6B9FE4, #8B5CF6)", borderRadius: 4 }} />
                                </div>
                                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6B7280" }}>
                                  <span>성장확률 <b style={{ color: "#374151" }}>{item.avg_성장확률}점</b></span>
                                  {item.avg_점포당매출 > 0 && <span>점포당 매출 <b style={{ color: "#374151" }}>{item.avg_점포당매출.toLocaleString()}만</b></span>}
                                  <span>폐업률 <b style={{ color: "#374151" }}>{(item.avg_폐업률 * 100).toFixed(1)}%</b></span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {!premiumResultLoading && premiumResult?.type === "dong" && (() => {
                    const { dong, gu, category, score, streets } = premiumResult;
                    const gradeColor = { A: "#10B981", B: "#3B82F6", C: "#F59E0B", D: "#EF4444" };
                    const grade = score?.grade ?? "-";
                    const composite = score?.score ?? 0;
                    const breakdown = score?.breakdown ?? [];
                    const streetResults = streets?.results ?? [];
                    return (
                      <div style={{ display: "flex", gap: 20 }}>
                        {/* 왼쪽: 행정동 종합 점수 */}
                        <div style={{ flex: "0 0 260px" }}>
                          <div
                            onClick={() => navigatePremiumDong(dong, gu)}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.cursor = "pointer"; e.currentTarget.style.borderRadius = "8px"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, padding: "4px 6px", transition: "background 0.15s" }}
                          >
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{dong}</div>
                            <span style={{ fontSize: 11, color: "#93C5FD", fontWeight: 600 }}>📍 지도로 이동</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 14 }}>{gu} · {category}</div>

                          {/* 종합 점수 원형 */}
                          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", background: "#F8FAFF", borderRadius: 14, border: "1px solid #E0EAFF", marginBottom: 14 }}>
                            <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                              <svg width="72" height="72" viewBox="0 0 72 72">
                                <circle cx="36" cy="36" r="30" fill="none" stroke="#E5E7EB" strokeWidth="7" />
                                <circle cx="36" cy="36" r="30" fill="none" stroke={gradeColor[grade] ?? "#6B9FE4"} strokeWidth="7"
                                  strokeDasharray={`${(composite / 100) * 188.5} 188.5`}
                                  strokeLinecap="round" transform="rotate(-90 36 36)" />
                              </svg>
                              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{composite}</span>
                                <span style={{ fontSize: 10, color: "#9CA3AF" }}>/ 100</span>
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 22, fontWeight: 900, color: gradeColor[grade] ?? "#6B9FE4", lineHeight: 1 }}>{grade}등급</div>
                              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4, lineHeight: 1.5 }}>{score?.summary ?? ""}</div>
                              {score?.is_fallback && (
                                <div style={{ fontSize: 10, color: "#F59E0B", marginTop: 4 }}>※ 업종 평균 기반 추정값</div>
                              )}
                            </div>
                          </div>

                          {/* Breakdown 게이지 */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {breakdown.map(item => (
                              <div key={item.label}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#374151", marginBottom: 4 }}>
                                  <span>{item.label}</span>
                                  <span style={{ fontWeight: 700 }}>{item.score}점</span>
                                </div>
                                <div style={{ height: 6, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${item.score}%`, background: "linear-gradient(90deg, #6B9FE4, #8B5CF6)", borderRadius: 4, transition: "width 0.6s ease" }} />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 장단점 */}
                          {(score?.pros?.length > 0 || score?.cons?.length > 0) && (
                            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                              {(score.pros ?? []).map((p, i) => <div key={i} style={{ fontSize: 12, color: "#059669" }}>✓ {p}</div>)}
                              {(score.cons ?? []).map((c, i) => <div key={i} style={{ fontSize: 12, color: "#DC2626" }}>✗ {c}</div>)}
                            </div>
                          )}
                        </div>

                        {/* 오른쪽: 길단위 상권 추천 */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{gu} 내 추천 상권</div>
                          <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 14 }}>{category} 창업에 유리한 길단위 상권 Top {streetResults.length}</div>
                          {streetResults.length === 0
                            ? <div style={{ padding: "20px 0", color: "#9CA3AF", fontSize: 13 }}>길단위 상권 데이터가 없습니다.</div>
                            : streetResults.map((s, i) => {
                              const rankColors = ["#F59E0B", "#9CA3AF", "#CD7F32"];
                              return (
                                <div
                                  key={s.상권코드}
                                  onClick={() => navigatePremiumStreet(s, gu)}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#F0FDF4"; e.currentTarget.style.borderColor = "#6EE7B7"; e.currentTarget.style.cursor = "pointer"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "#FAFAFA"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
                                  style={{ padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: 12, marginBottom: 8, background: "#FAFAFA", transition: "background 0.15s, border-color 0.15s" }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: i < 3 ? rankColors[i] : "#E5E7EB", color: i < 3 ? "#fff" : "#6B7280", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", flex: 1 }}>{s.상권명}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ fontSize: 10, color: "#6EE7B7" }}>📍 {s.dong || gu}</span>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: gradeColor[s.등급] ?? "#6B7280", background: `${gradeColor[s.등급] ?? "#E5E7EB"}18`, padding: "2px 8px", borderRadius: 6 }}>{s.등급}등급</span>
                                    </div>
                                  </div>
                                  <div style={{ height: 5, background: "#F3F4F6", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                                    <div style={{ height: "100%", width: `${s.score ?? 0}%`, background: "linear-gradient(90deg, #10B981, #3B82F6)", borderRadius: 4 }} />
                                  </div>
                                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6B7280", flexWrap: "wrap" }}>
                                    <span>성장확률 <b style={{ color: "#374151" }}>{s.성장확률}점</b></span>
                                    {s.revenue > 0 && <span>월매출 <b style={{ color: "#374151" }}>{s.revenue >= 1e8 ? `${(s.revenue / 1e8).toFixed(1)}억` : `${Math.round(s.revenue / 1e4).toLocaleString()}만`}</b></span>}
                                    {s.총유동인구 > 0 && <span>유동인구 <b style={{ color: "#374151" }}>{s.총유동인구.toLocaleString()}</b></span>}
                                  </div>
                                  {s.tags?.length > 0 && (
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                                      {s.tags.map(t => <span key={t} style={{ fontSize: 11, background: "#EFF6FF", color: "#3B82F6", borderRadius: 6, padding: "2px 7px" }}>{t}</span>)}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          }
                        </div>
                      </div>
                    );
                  })()}
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
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>

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
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Signature size={16} color="#3B82F6" strokeWidth={1.6} />
                    {drawingMode ? "그리기 중... (취소)" : "상권 그리기"}
                  </span>
                </button>
                <div style={{ borderTop: "1px solid #F3F4F6", margin: "4px 0" }} />
                <button
                  style={{ ...menuItemStyle, color: "#374151", display: "flex", alignItems: "center", gap: 8 }}
                  onClick={() => { setToolMenuOpen(false); setStartupCalcOpen((v) => !v); }}
                >
                  <Calculator size={16} color="#2563EB" strokeWidth={1.6} />
                  창업비용 계산기
                </button>
                <div style={{ borderTop: "1px solid #F3F4F6", margin: "4px 0" }} />
                <button
                  style={{ ...menuItemStyle, color: "#374151", display: "flex", alignItems: "center", gap: 8 }}
                  onClick={() => { setToolMenuOpen(false); setCompareRegionOpen(true); setCompareRegionStep("form"); setCompareRegionResults(null); }}
                >
                  <MapPinned size={16} color="#1D4ED8" strokeWidth={1.6} />
                  지역 비교
                </button>
                <button
                  style={{ ...menuItemStyle, color: "#374151", display: "flex", alignItems: "center", gap: 8 }}
                  onClick={() => { setToolMenuOpen(false); setCompareIndustryOpen(true); setCompareIndustryStep("form"); setCompareIndustryResults(null); }}
                >
                  <Store size={16} color="#60A5FA" strokeWidth={1.6} />
                  업종 비교
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
              borderBottom: "none", display: "flex", alignItems: "center", gap: 5,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#111827"; e.currentTarget.style.fontWeight = "700"; }}
            onMouseLeave={(e) => { if (!aiModalOpen) { e.currentTarget.style.color = "#444"; e.currentTarget.style.fontWeight = "500"; } }}
          >
            <Bot size={16} color="#3B82F6" strokeWidth={1.6} />
            AI 추천
          </button>

          {/* 프리미엄 AI 추천 (beta) */}
          <button
            onClick={() => openPremiumModal()}
            style={{
              height: NAV_HEIGHT, padding: "0 14px", border: "none", background: "transparent",
              color: "#444", fontSize: 14, fontWeight: 500, cursor: "pointer",
              borderBottom: "none", display: "flex", alignItems: "center", gap: 4,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#111827"; e.currentTarget.style.fontWeight = "700"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#444"; e.currentTarget.style.fontWeight = "500"; }}
          >
            프리미엄 AI 추천
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#fff", background: "#6B9FE4",
              borderRadius: 4, padding: "1px 5px", lineHeight: 1.4,
            }}>beta</span>
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
              <div data-popup className="anim-slide-down" style={popupStyle({ right: 0, width: 200 })}>
                {currentUser ? (
                  <>
                    <div style={{ padding: "10px 12px 6px", fontSize: 13, color: "#374151" }}>
                      <span style={{ fontWeight: 700 }}>{currentUser.nickname || currentUser.username}</span>님
                      {currentUser.login_type === "kakao" && (
                        <span style={{ marginLeft: 6, fontSize: 11, background: "#FEE500", color: "#3C1E1E", borderRadius: 4, padding: "1px 5px", fontWeight: 600 }}>카카오</span>
                      )}
                    </div>
                    <div style={{ borderTop: "1px solid #4A4A4A", margin: "4px 0" }} />
                    <button style={menuItemStyle} onClick={() => navigate("/profile")}>⚙️ 개인정보 설정</button>
                    <div style={{ borderTop: "1px solid #4A4A4A", margin: "4px 0" }} />
                    <button style={menuItemStyle} onClick={() => {
                      localStorage.removeItem("access");
                      localStorage.removeItem("refresh");
                      localStorage.removeItem("user");
                      setCurrentUser(null);
                      setMenuOpen(false);
                    }}>🚪 로그아웃</button>
                  </>
                ) : (
                  <>
                    <button style={menuItemStyle} onClick={() => navigate("/login")}>🔐 로그인</button>
                    <div style={{ borderTop: "1px solid #4A4A4A", margin: "4px 0" }} />
                    <button style={menuItemStyle} onClick={() => navigate("/signup")}>📝 회원가입</button>
                  </>
                )}
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
          width: "min(340px, calc(100vw - 32px))", background: "#fff",
          borderRadius: 14, border: "1px solid rgba(37,99,235,0.35)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)", zIndex: 300,
          padding: customPanelCollapsed ? "12px 18px" : "16px 18px",
          maxHeight: "calc(100vh - 52px - 48px)", overflowY: "auto",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: customPanelCollapsed ? 0 : 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#2563EB" }}>
              {drawingMode ? "🖊️ 지도를 클릭해 영역을 그리세요" : "🖊️ 직접 그린 상권"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {customResults && !customPanelCollapsed && (
                <button
                  onClick={() => { setCustomResults(null); setCustomSearchQuery(""); setCustomDrillGroup(null); }}
                  style={{ fontSize: 11, color: "#2563EB", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
                >다른 업종 선택하기</button>
              )}
              <button
                onClick={() => setCustomPanelCollapsed(v => !v)}
                title={customPanelCollapsed ? "펼치기" : "접기"}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {customPanelCollapsed ? (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <rect x="1" y="1" width="11" height="11" rx="1.5" stroke="#6B7280" strokeWidth="1.6"/>
                  </svg>
                ) : (
                  <svg width="14" height="3" viewBox="0 0 14 3" fill="none">
                    <path d="M1 1.5h12" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
              <button
                onClick={() => { clearCustomDrawing(); drawingModeRef.current = false; setDrawingMode(false); }}
                style={{ background: "none", border: "none", color: "#6B7280", fontSize: 16, cursor: "pointer" }}
              >✕</button>
            </div>
          </div>

          {!customPanelCollapsed && drawingMode && (
            <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 8px" }}>
              꼭짓점을 3개 이상 찍고 첫 번째 점을 다시 클릭하면 완성돼요.
            </p>
          )}

          {!customPanelCollapsed && customPolygonDone && (
            <>
              {customResults ? (
                /* ── 결과 뷰 ── */
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>입지점수 Top {customResults.length} · 숫자 마커로 지도에 표시됨</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#2563EB", background: "#EFF6FF", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap", flexShrink: 0, marginLeft: 8 }}>
                      <CalcCatIcon cat={customCategory} size={11} color="#2563EB" /> {customCategory}
                    </span>
                  </div>
                  {customResults.map((r) => (
                    <div key={r.rank} style={{
                      padding: "10px 0", borderBottom: r.rank < customResults.length ? "1px solid #E5E7EB" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                          background: ["#EF4444","#F97316","#EAB308","#22C55E","#3B82F6"][r.rank-1],
                          color: "#fff", fontSize: 11, fontWeight: 700, width: 20, height: 20,
                          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>{r.rank}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>입지점수 {r.score}점</span>
                        <span style={{ fontSize: 11, color: "#6B7280", marginLeft: "auto" }}>생존율 {r.생존율}%</span>
                      </div>
                      {r.reasons.map((reason, i) => (
                        <div key={i} style={{ fontSize: 11, color: "#6B7280", paddingLeft: 28 }}>· {reason}</div>
                      ))}
                    </div>
                  ))}
                </>
              ) : (
                /* ── 업종 선택 뷰 ── */
                <>
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 8px" }}>업종 선택</p>
                    <input
                      type="text"
                      placeholder="업종 검색..."
                      value={customSearchQuery}
                      onChange={(e) => { setCustomSearchQuery(e.target.value); setCustomDrillGroup(e.target.value ? "__search__" : null); }}
                      style={{ width: "100%", padding: "6px 10px", fontSize: 13, borderRadius: 8, background: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#111827", outline: "none", boxSizing: "border-box", marginBottom: 8 }}
                    />
                    {customSearchQuery ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {Object.values(CATEGORY_GROUPS).flat().filter((c, i, a) => a.indexOf(c) === i && c.includes(customSearchQuery)).map(cat => (
                          <button key={cat} onClick={() => { setCustomCategory(cat); setCustomSearchQuery(""); setCustomDrillGroup(null); }}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: customCategory === cat ? "1.5px solid #2563EB" : "1.5px solid #E5E7EB", background: customCategory === cat ? "rgba(37,99,235,0.1)" : "#F9FAFB", color: customCategory === cat ? "#2563EB" : "#374151" }}>
                            <CalcCatIcon cat={cat} size={13} />
                            {cat}
                          </button>
                        ))}
                      </div>
                    ) : customDrillGroup ? (
                      <>
                        <button onClick={() => setCustomDrillGroup(null)} style={{ fontSize: 12, color: "#2563EB", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "0 0 8px 0" }}>
                          ← {customDrillGroup}
                        </button>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {CATEGORY_GROUPS[customDrillGroup].map(cat => (
                            <button key={cat} onClick={() => { setCustomCategory(cat); setCustomDrillGroup(null); }}
                              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: customCategory === cat ? "1.5px solid #2563EB" : "1.5px solid #E5E7EB", background: customCategory === cat ? "rgba(37,99,235,0.1)" : "#F9FAFB", color: customCategory === cat ? "#2563EB" : "#374151" }}>
                              <CalcCatIcon cat={cat} size={13} />
                              {cat}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {customCategory && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", marginBottom: 2 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#2563EB" }}>
                              <CalcCatIcon cat={customCategory} size={13} color="#2563EB" /> {customCategory}
                            </span>
                            <button onClick={() => setCustomCategory("")} style={{ fontSize: 11, color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>✕ 해제</button>
                          </div>
                        )}
                        {DRILL_GROUPS.map(group => {
                          const Meta = DRILL_GROUP_META[group];
                          const GroupIcon = Meta.icon;
                          return (
                            <button key={group} onClick={() => setCustomDrillGroup(group)}
                              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#374151" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.08)"; e.currentTarget.style.color = "#2563EB"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; }}
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <GroupIcon size={15} color={Meta.iconColor} strokeWidth={1.8} /> {group}
                              </span>
                              <span style={{ color: "#6B7280", fontSize: 11 }}>{CATEGORY_GROUPS[group].length}개 →</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { if (customCategory) fetchCustomSpot(customCategory); }}
                    disabled={!customCategory || customLoading}
                    style={{
                      width: "100%", padding: "9px 0", borderRadius: 8, border: "none",
                      background: customCategory ? "#2563EB" : "rgba(0,0,0,0.06)",
                      color: customCategory ? "#fff" : "#666", fontWeight: 700, fontSize: 14, cursor: customCategory ? "pointer" : "default",
                    }}
                  >
                    {customLoading ? "분석 중..." : "이 지역 추천 받기"}
                  </button>
                </>
              )}

              <button
                onClick={() => { startDrawing(); }}
                style={{
                  width: "100%", marginTop: 10, padding: "7px 0", borderRadius: 8,
                  border: "1px solid rgba(37,99,235,0.3)", background: "transparent",
                  color: "#2563EB", fontSize: 12, fontWeight: 600, cursor: "pointer",
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
  border: active ? "1px solid #374151" : "1px solid #E5E7EB",
  background: active ? "#374151" : "#F9FAFB",
  color: active ? "#fff" : "#6B7280",
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
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
  border: "1px solid #E5E7EB",
  overflow: "hidden",
  zIndex: 10,
};

const zoomBtnStyle = {
  width: 40,
  height: 40,
  border: "none",
  background: "none",
  color: "#374151",
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
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: "12px 16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
  zIndex: 10,
  fontSize: 16,
  pointerEvents: "none",
  minWidth: 180,
  transition: "left 0.22s ease-out",
};

const tooltipLabel = {
  fontSize: 12,
  fontWeight: 700,
  color: "#6B7280",
  background: "#F3F4F6",
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
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
  padding: "14px 18px",
  zIndex: 20,
  border: "1px solid #E5E7EB",
  maxWidth: 680,
  minWidth: 340,
};

const dongChipStyle = {
  padding: "5px 11px",
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  background: "#F9FAFB",
  color: "#374151",
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
  background: "#fff",
  borderRight: "1px solid #E5E7EB",
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
  border: "1px solid #E5E7EB",
  background: "#F9FAFB",
  color: "#374151",
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
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: "12px 14px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
};

const secondPanelStyle = {
  position: "absolute",
  top: NAV_HEIGHT,
  left: 0,
  width: 340,
  height: `calc(100vh - ${NAV_HEIGHT}px)`,
  background: "#fff",
  borderRight: "1px solid #E5E7EB",
  boxShadow: "4px 0 24px rgba(0,0,0,0.08)",
  zIndex: 11,
  display: "flex",
  flexDirection: "column",
  padding: "20px 16px",
  boxSizing: "border-box",
  overflow: "hidden",
};

const closeBtnStyle = {
  border: "none",
  background: "#F3F4F6",
  color: "#6B7280",
  borderRadius: 8,
  width: 32,
  height: 32,
  cursor: "pointer",
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};


const btnStyle = (active) => ({
  height: 44,
  padding: "0 18px",
  background: active ? "#3B82F6" : "#fff",
  color: active ? "#fff" : "#374151",
  border: active ? "none" : "1px solid #E5E7EB",
  borderRadius: 12,
  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, color 0.2s",
});

const popupStyle = (extra = {}) => ({
  position: "absolute",
  top: 52,
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  padding: "16px",
  zIndex: 100,
  width: 260,
  ...extra,
});

const popupSectionLabel = {
  margin: "0 0 8px 0",
  fontSize: 14,
  fontWeight: 700,
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};


const menuItemStyle = {
  display: "block",
  width: "100%",
  padding: "11px 12px",
  border: "none",
  background: "none",
  textAlign: "left",
  fontSize: 14,
  cursor: "pointer",
  borderRadius: 8,
  color: "#374151",
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
  background: "#F9FAFB",
  borderRadius: 10,
  padding: "10px 12px",
  border: "1px solid #E5E7EB",
};

/* ── 창업비용 계산기 스타일 ── */

const startupCalcBtnStyle = {
  height: 44,
  padding: "0 18px",
  background: "#fff",
  color: "#374151",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
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
  background: "#fff",
  borderRadius: 20,
  boxShadow: "0 20px 70px rgba(0,0,0,0.18)",
  border: "1px solid #E5E7EB",
  width: 520,
  maxHeight: "88vh",
  overflowY: "auto",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  padding: "24px 24px",
  boxSizing: "border-box",
};

const calcInputStyle = {
  width: 80,
  padding: "5px 10px",
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  background: "#F9FAFB",
  color: "#111827",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

/* ── AI 추천 스타일 ── */

const aiBtnStyle = {
  height: 44,
  padding: "0 18px",
  background: "linear-gradient(135deg, #2563EB, #3B82F6)",
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
  color: "#374151",
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
  background: isTop ? "#EFF6FF" : "#F9FAFB",
  borderRadius: 14,
  padding: "14px 16px",
  border: isTop ? "1.5px solid #BFDBFE" : "1px solid #E5E7EB",
});

const aiRankBadge = (rank) => ({
  fontSize: rank <= 3 ? 22 : 13,
  fontWeight: 700,
  color: "#6B7280",
  minWidth: 32,
  textAlign: "center",
});

const aiMiniStatStyle = {
  flex: 1,
  background: "#F9FAFB",
  borderRadius: 8,
  padding: "7px 10px",
  border: "1px solid #E5E7EB",
};

const aiModeCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "16px 18px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  cursor: "pointer",
  textAlign: "left",
  transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, border-color 0.2s, color 0.2s",
  width: "100%",
};

const AI_MODE_META = {
  // color: 카드 왼쪽 border + 아이콘 배경 틴트에 사용
  dong:            { icon: "📍", title: "업종 선택 → 구 추천",   desc: "창업할 업종을 선택하면 최적의 구를 추천합니다", color: "#93C5FD", rgb: "147,197,253"  },
  industry:        { icon: "🏪", title: "행정동 선택 → 업종 추천",   desc: "관심 지역을 입력하면 유망 업종을 추천합니다",   color: "#3B82F6", rgb: "59,130,246"   },
  score:           { icon: "📊", title: "행정동 · 업종 적합도 점수", desc: "특정 지역과 업종 조합의 상세 점수를 분석합니다", color: "#60A5FA", rgb: "56,189,248"   },
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
  if (won >= 1_000_000_000_000) {
    const jo = Math.floor(won / 1_000_000_000_000);
    const rem = Math.round((won % 1_000_000_000_000) / 100_000_000);
    return rem > 0 ? `${jo}조 ${rem.toLocaleString()}억원` : `${jo}조원`;
  }
  if (eok >= 1) return `${Number(eok.toFixed(1)).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1})}억원`;
  return `${Math.round(won / 10_000).toLocaleString()}만원`;
}

