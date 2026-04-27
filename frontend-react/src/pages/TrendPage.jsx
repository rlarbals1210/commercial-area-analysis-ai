import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Utensils, Coffee, Beer, ShoppingBag, Pill, GraduationCap,
  Scissors, Car, Music, Monitor, Dumbbell, Fish, Home, Landmark,
  Plane, Building2, Shirt, Eye, Gem, Stethoscope, Leaf, ShoppingCart,
  Zap, Wrench, ChefHat, Croissant, Cookie, Store, Smartphone,
  Drumstick, Handbag, CircleDot, Flag, Palette, Paintbrush, SportShoe,
} from "lucide-react";

const AGE_CAT_LIST = ["PC방","가방","가전제품","가전제품수리","골프연습장","기타 B2B서비스","네일숍","노래방","당구장","미곡판매","미용실","반찬가게","베이커리/디저트","분식/간식","생활용품 소매","섬유제품","세탁소","수산물판매","숙박","슈퍼마켓","스포츠 강습","스포츠클럽","신발","안경","애완동물","양식/기타외식","예술학원","외국어학원","육류판매","의료기기","의약품","인테리어","일반교습학원","일반의류","일반의원","일식","자동차수리/미용","주점","중식","청과상","치과의원","치킨전문점","카페","컴퓨터및주변장치판매","패스트푸드","편의점","피부관리실","한식","한의원","핸드폰","화장품"];

function AgeCategoryDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block", marginBottom: 28 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "9px 14px", borderRadius: 8, border: "1.5px solid #E5E7EB",
          fontSize: 14, color: value ? "#111827" : "#9CA3AF", background: "#fff",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 8, minWidth: 200,
        }}
      >
        <span style={{ flex: 1, textAlign: "left" }}>{value || "전체 업종"}</span>
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>▼</span>
      </button>
      {open && (
        <div className="no-scrollbar" style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
          background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: 260, overflowY: "auto",
          minWidth: 200,
        }}>
          {["", ...AGE_CAT_LIST].map((cat) => (
            <div
              key={cat || "__all__"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(cat); setOpen(false); }}
              style={{
                padding: "9px 14px", fontSize: 14, cursor: "pointer",
                color: cat === value ? "#1D4ED8" : "#374151",
                fontWeight: cat === value ? 600 : 400,
                background: cat === value ? "#EFF6FF" : "transparent",
              }}
              onMouseEnter={(e) => { if (cat !== value) e.currentTarget.style.background = "#F9FAFB"; }}
              onMouseLeave={(e) => { if (cat !== value) e.currentTarget.style.background = "transparent"; }}
            >
              {cat || "전체 업종"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DongDropdown({ dongList, selectedDong, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB",
          fontSize: 14, color: "#374151", background: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8, minWidth: 140,
        }}
      >
        {selectedDong || "동 선택"}
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>▼</span>
      </button>
      {open && (
        <div className="gu-dropdown-list" style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
          background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: 260, overflowY: "auto",
          minWidth: 140,
        }}>
          {dongList.map((dong) => (
            <div
              key={dong}
              onClick={() => { onChange(dong); setOpen(false); }}
              style={{
                padding: "9px 14px", fontSize: 14, cursor: "pointer",
                color: dong === selectedDong ? "#1D4ED8" : "#374151",
                fontWeight: dong === selectedDong ? 600 : 400,
                background: dong === selectedDong ? "#EFF6FF" : "transparent",
              }}
              onMouseEnter={(e) => { if (dong !== selectedDong) e.currentTarget.style.background = "#F9FAFB"; }}
              onMouseLeave={(e) => { if (dong !== selectedDong) e.currentTarget.style.background = "transparent"; }}
            >
              {dong}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GuDropdown({ guList, selectedGu, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB",
          fontSize: 14, color: "#374151", background: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8, minWidth: 140,
        }}
      >
        {selectedGu}
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>▼</span>
      </button>
      {open && (
        <div className="gu-dropdown-list" style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
          background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: 260, overflowY: "auto",
          minWidth: 140,
        }}>
          {guList.map((gu) => (
            <div
              key={gu}
              onClick={() => { onChange(gu); setOpen(false); }}
              style={{
                padding: "9px 14px", fontSize: 14, cursor: "pointer",
                color: gu === selectedGu ? "#1D4ED8" : "#374151",
                fontWeight: gu === selectedGu ? 600 : 400,
                background: gu === selectedGu ? "#EFF6FF" : "transparent",
              }}
              onMouseEnter={(e) => { if (gu !== selectedGu) e.currentTarget.style.background = "#F9FAFB"; }}
              onMouseLeave={(e) => { if (gu !== selectedGu) e.currentTarget.style.background = "transparent"; }}
            >
              {gu}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const API = "http://localhost:8000";
const PAGE_SIZE = 5;

const CAT_ICON = {
  "한식": Utensils, "중식": Utensils, "일식": Fish, "양식/기타외식": ChefHat,
  "카페": Coffee, "주점": Beer, "패스트푸드/치킨": Utensils, "분식/간식": Cookie,
  "베이커리/디저트": Croissant, "편의점": Store, "슈퍼마켓": ShoppingCart,
  "생활용품 소매": ShoppingBag, "화장품": Palette, "의류": Shirt, "일반의류": Shirt,
  "신발": SportShoe, "안경": Eye, "귀금속": Gem,
  "일반의원": Stethoscope, "치과의원": Stethoscope, "한의원": Leaf, "의약품": Pill,
  "일반교습학원": GraduationCap, "예체능학원": Music, "어학원": GraduationCap,
  "미용실": Scissors, "네일숍": Paintbrush, "피부관리실": Leaf, "자동차수리/미용": Car,
  "세탁소": Shirt, "수리/세탁": Wrench, "노래방": Music, "PC방": Monitor,
  "당구장": CircleDot, "골프연습장": Flag, "스포츠클럽": Dumbbell,
  "수산물판매": Fish, "반찬가게": Utensils, "육류판매": Utensils,
  "부동산": Home, "금융": Landmark, "여행": Plane,
  "B2B 서비스": Building2, "뷰티/화장품": Scissors, "식품 소매": ShoppingBag,
  "컴퓨터및주변장치판매": Monitor, "가전제품": Zap, "의료기기": Stethoscope,
  "핸드폰": Smartphone, "치킨전문점": Drumstick, "가방": Handbag,
};

// 카테고리 그룹별 파란색 계열 색상
const CAT_COLOR = {
  "한식": "#3B82F6", "중식": "#3B82F6", "일식": "#3B82F6",
  "양식/기타외식": "#3B82F6", "패스트푸드/치킨": "#3B82F6", "치킨전문점": "#3B82F6",
  "분식/간식": "#3B82F6", "반찬가게": "#3B82F6", "육류판매": "#3B82F6", "수산물판매": "#3B82F6",

  "카페": "#06B6D4", "주점": "#06B6D4", "베이커리/디저트": "#06B6D4",

  "편의점": "#6366F1", "슈퍼마켓": "#6366F1", "생활용품 소매": "#6366F1",
  "화장품": "#6366F1", "의류": "#6366F1", "일반의류": "#6366F1",
  "신발": "#6366F1", "안경": "#6366F1", "귀금속": "#6366F1",
  "식품 소매": "#6366F1", "컴퓨터및주변장치판매": "#6366F1", "가전제품": "#6366F1", "핸드폰": "#6366F1",

  "일반의원": "#0EA5E9", "치과의원": "#0EA5E9", "한의원": "#0EA5E9",
  "의약품": "#0EA5E9", "의료기기": "#0EA5E9",

  "일반교습학원": "#1D4ED8", "예체능학원": "#1D4ED8", "어학원": "#1D4ED8",

  "미용실": "#8B5CF6", "네일숍": "#8B5CF6", "피부관리실": "#8B5CF6", "뷰티/화장품": "#8B5CF6",

  "자동차수리/미용": "#64748B", "세탁소": "#64748B", "수리/세탁": "#64748B",

  "노래방": "#0891B2", "PC방": "#0891B2", "당구장": "#0891B2",
  "골프연습장": "#0891B2", "스포츠클럽": "#0891B2",

  "부동산": "#1E40AF", "금융": "#1E40AF", "여행": "#1E40AF",
  "B2B 서비스": "#1E40AF",
};


function CatIcon({ cat, size = 20 }) {
  const Icon = CAT_ICON[cat] || Store;
  const color = CAT_COLOR[cat] || "#3B82F6";
  return <Icon size={size} color={color} strokeWidth={1.8} />;
}

function fmt억(val) {
  if (!val) return "0";
  const 억 = val / 100_000_000;
  return 억 >= 1 ? `${억.toFixed(1)}억` : `${(val / 10_000).toFixed(0)}만`;
}

function ChangeRate({ value }) {
  if (value === 0) return <span style={{ color: "#888" }}>0%</span>;
  const up = value > 0;
  return (
    <span style={{ color: up ? "#DC2626" : "#3B82F6", fontWeight: 600 }}>
      {up ? "▲" : "▼"} {Math.abs(value)}%
    </span>
  );
}

export default function TrendPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [latestQuarter, setLatestQuarter] = useState("");
  const [trendingDong, setTrendingDong] = useState([]);
  const [trendingGu, setTrendingGu] = useState([]);

  const [guList, setGuList] = useState([]);
  const [guToDongs, setGuToDongs] = useState({});

  const [regionMode, setRegionMode] = useState("구"); // "구" | "동"
  const [regionGu, setRegionGu] = useState("");
  const [regionDong, setRegionDong] = useState("");
  const [regionIndustries, setRegionIndustries] = useState([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [regionVisibleCount, setRegionVisibleCount] = useState(PAGE_SIZE);

  const [mzVisible, setMzVisible] = useState(PAGE_SIZE);
  const [weekdayIndustries, setWeekdayIndustries] = useState([]);
  const [weekendIndustries, setWeekendIndustries] = useState([]);
  const [activeTab, setActiveTab] = useState("weekday");

  const [ageCategory, setAgeCategory] = useState("");
  const [ageData, setAgeData] = useState([]);
  const [ageLoading, setAgeLoading] = useState(false);

  const [timeCategory, setTimeCategory] = useState("");
  const [timeData, setTimeData] = useState([]);
  const [timeLoading, setTimeLoading] = useState(false);

  const [genderData, setGenderData] = useState([]);
  const [genderLoading, setGenderLoading] = useState(false);
  const [genderVisible, setGenderVisible] = useState(PAGE_SIZE);

  const [fullViewSection, setFullViewSection] = useState(null); // 'region'|'weekday'|'weekend'|'gender'|'weekdayPattern'|'openClose'|'salesPerStore'

  const [weekdayPatternCategory, setWeekdayPatternCategory] = useState("");
  const [weekdayPatternData, setWeekdayPatternData] = useState([]);
  const [weekdayPatternLoading, setWeekdayPatternLoading] = useState(false);

  const [openCloseData, setOpenCloseData] = useState([]);
  const [openCloseLoading, setOpenCloseLoading] = useState(false);
  const [openCloseVisible, setOpenCloseVisible] = useState(PAGE_SIZE);

  const [salesPerStoreData, setSalesPerStoreData] = useState([]);
  const [salesPerStoreLoading, setSalesPerStoreLoading] = useState(false);
  const [salesPerStoreVisible, setSalesPerStoreVisible] = useState(PAGE_SIZE);

  const upCarouselRef = useRef(null);
  const downCarouselRef = useRef(null);
  const upAnimRef = useRef(null);
  const downAnimRef = useRef(null);
  const upPosRef = useRef(0);
  const downPosRef = useRef(0);

  // 분기 표시용
  function fmtQ(code) {
    if (!code) return "";
    const s = String(code);
    return `${s.slice(0, 4)}년 ${s.slice(4)}분기`;
  }

  // body 배경색 오버라이드 (전역 다크 테마 → 트렌드 페이지 라이트 테마)
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#F8FAFC";
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  // 카테고리 트렌드 로드
  useEffect(() => {
    fetch(`${API}/api/trend/categories/`)
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.results || []);
        setLatestQuarter(data.latest_quarter);
      });
  }, []);

  // 실시간 트렌딩 로드
  useEffect(() => {
    fetch(`${API}/api/community/reports/trending/`)
      .then((r) => r.ok ? r.json() : {})
      .then((data) => {
        setTrendingDong(Array.isArray(data.dong) ? data.dong : []);
        setTrendingGu(Array.isArray(data.gu) ? data.gu : []);
      })
      .catch(() => {});
  }, []);

  // GeoJSON에서 구→동 매핑 로드
  useEffect(() => {
    fetch("/seoul_hangjeongdong.geojson")
      .then((r) => r.json())
      .then((data) => {
        const map = {};
        data.features.forEach((f) => {
          const gu = f.properties.gu_name;
          const dong = f.properties.dong_name;
          if (!map[gu]) map[gu] = [];
          map[gu].push(dong);
        });
        const sorted = Object.keys(map).sort();
        setGuToDongs(map);
        setGuList(sorted);
        setRegionGu(sorted[0] || "");
      });
  }, []);

  // 구 변경 시 첫 번째 동으로 초기화
  useEffect(() => {
    if (!regionGu || !guToDongs[regionGu]) return;
    setRegionDong(guToDongs[regionGu][0] || "");
    setRegionVisibleCount(PAGE_SIZE);
  }, [regionGu, guToDongs]);

  // 지역 선택 시 인기 업종 로드
  useEffect(() => {
    const dongs = regionMode === "구"
      ? (guToDongs[regionGu] || [])
      : regionDong ? [regionDong] : [];
    if (dongs.length === 0) return;
    setRegionLoading(true);
    setRegionVisibleCount(PAGE_SIZE);
    fetch(`${API}/api/trend/gu-industries/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gu: regionGu, dongs }),
    })
      .then((r) => r.json())
      .then((data) => {
        setRegionIndustries(data.results || []);
        setRegionLoading(false);
      });
  }, [regionMode, regionGu, regionDong, guToDongs]);

  // 주중 / 주말 매출 순위 로드 (인기 업종 섹션과 동일한 지역 state 공유)
  useEffect(() => {
    const dongs = regionMode === "구"
      ? (guToDongs[regionGu] || [])
      : regionDong ? [regionDong] : [];
    if (dongs.length === 0) return;
    const dongsParam = dongs.join(",");
    const qs = `?dongs=${encodeURIComponent(dongsParam)}`;
    setMzVisible(PAGE_SIZE);
    fetch(`${API}/api/trend/weekday-industries/${qs}`)
      .then((r) => r.json())
      .then((data) => setWeekdayIndustries(data.results || []));
    fetch(`${API}/api/trend/weekend-industries/${qs}`)
      .then((r) => r.json())
      .then((data) => setWeekendIndustries(data.results || []));
  }, [regionMode, regionGu, regionDong, guToDongs]);

  // 연령대 매출 비율 로드 (인기 업종 섹션과 동일한 지역 state 공유)
  useEffect(() => {
    const dongs = regionMode === "구"
      ? (guToDongs[regionGu] || [])
      : regionDong ? [regionDong] : [];
    if (dongs.length === 0) return;
    const params = new URLSearchParams();
    if (ageCategory) params.set("category", ageCategory);
    params.set("dongs", dongs.join(","));
    setAgeLoading(true);
    fetch(`${API}/api/trend/age-breakdown/?${params}`)
      .then((r) => r.json())
      .then((data) => { setAgeData(data.breakdown || []); setAgeLoading(false); })
      .catch(() => setAgeLoading(false));
  }, [ageCategory, regionMode, regionGu, regionDong, guToDongs]);

  // 시간대별 매출 로드
  useEffect(() => {
    const dongs = regionMode === "구" ? (guToDongs[regionGu] || []) : regionDong ? [regionDong] : [];
    if (dongs.length === 0) return;
    const params = new URLSearchParams();
    if (timeCategory) params.set("category", timeCategory);
    params.set("dongs", dongs.join(","));
    setTimeLoading(true);
    fetch(`${API}/api/trend/time-breakdown/?${params}`)
      .then((r) => r.json())
      .then((data) => { setTimeData(data.breakdown || []); setTimeLoading(false); })
      .catch(() => setTimeLoading(false));
  }, [timeCategory, regionMode, regionGu, regionDong, guToDongs]);

  // 성별 매출 비율 로드
  useEffect(() => {
    const dongs = regionMode === "구" ? (guToDongs[regionGu] || []) : regionDong ? [regionDong] : [];
    if (dongs.length === 0) return;
    const params = new URLSearchParams();
    params.set("dongs", dongs.join(","));
    setGenderLoading(true);
    setGenderVisible(PAGE_SIZE);
    fetch(`${API}/api/trend/gender-breakdown/?${params}`)
      .then((r) => r.json())
      .then((data) => { setGenderData(data.results || []); setGenderLoading(false); })
      .catch(() => setGenderLoading(false));
  }, [regionMode, regionGu, regionDong, guToDongs]);

  // 요일별 매출 패턴 로드
  useEffect(() => {
    const dongs = regionMode === "구" ? (guToDongs[regionGu] || []) : regionDong ? [regionDong] : [];
    if (dongs.length === 0) return;
    const params = new URLSearchParams();
    if (weekdayPatternCategory) params.set("category", weekdayPatternCategory);
    params.set("dongs", dongs.join(","));
    setWeekdayPatternLoading(true);
    fetch(`${API}/api/trend/weekday-pattern/?${params}`)
      .then((r) => r.json())
      .then((data) => { setWeekdayPatternData(data.breakdown || []); setWeekdayPatternLoading(false); })
      .catch(() => setWeekdayPatternLoading(false));
  }, [weekdayPatternCategory, regionMode, regionGu, regionDong, guToDongs]);

  // 개업/폐업률 로드
  useEffect(() => {
    const dongs = regionMode === "구" ? (guToDongs[regionGu] || []) : regionDong ? [regionDong] : [];
    if (dongs.length === 0) return;
    const params = new URLSearchParams();
    params.set("dongs", dongs.join(","));
    setOpenCloseLoading(true);
    setOpenCloseVisible(PAGE_SIZE);
    fetch(`${API}/api/trend/open-close/?${params}`)
      .then((r) => r.json())
      .then((data) => { setOpenCloseData(data.results || []); setOpenCloseLoading(false); })
      .catch(() => setOpenCloseLoading(false));
  }, [regionMode, regionGu, regionDong, guToDongs]);

  // 점포당 매출 로드
  useEffect(() => {
    const dongs = regionMode === "구" ? (guToDongs[regionGu] || []) : regionDong ? [regionDong] : [];
    if (dongs.length === 0) return;
    const params = new URLSearchParams();
    params.set("dongs", dongs.join(","));
    setSalesPerStoreLoading(true);
    setSalesPerStoreVisible(PAGE_SIZE);
    fetch(`${API}/api/trend/sales-per-store/?${params}`)
      .then((r) => r.json())
      .then((data) => { setSalesPerStoreData(data.results || []); setSalesPerStoreLoading(false); })
      .catch(() => setSalesPerStoreLoading(false));
  }, [regionMode, regionGu, regionDong, guToDongs]);

  // 캐러셀 자동 스크롤 헬퍼
  function startCarousel(elRef, animRef, posRef, speed = 0.6) {
    const el = elRef.current;
    if (!el) return () => {};
    const step = () => {
      posRef.current += speed;
      const half = el.scrollWidth / 2;
      if (posRef.current >= half) posRef.current = 0;
      el.scrollLeft = posRef.current;
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    const pause = () => cancelAnimationFrame(animRef.current);
    const resume = () => { animRef.current = requestAnimationFrame(step); };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    return () => {
      cancelAnimationFrame(animRef.current);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
    };
  }

  useEffect(() => {
    if (categories.length === 0) return;
    const stopUp = startCarousel(upCarouselRef, upAnimRef, upPosRef, 0.6);
    const stopDown = startCarousel(downCarouselRef, downAnimRef, downPosRef, 0.5);
    return () => { stopUp(); stopDown(); };
  }, [categories]);

  return (
    <>
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Pretendard', sans-serif" }}>
      {/* 상단 헤더 */}
      <header style={{
        background: "linear-gradient(135deg, #0f1a30, #162040)",
        borderBottom: "1px solid #1e2d4a",
        padding: "0 32px",
        height: 64,
        display: "flex", alignItems: "center",
        gap: 0,
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}>
        {/* 웨이브 배경 */}
        <svg viewBox="0 0 1200 64" width="100%" height="64" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} fill="none">
          <path d="M0 48 Q100 38,200 48 Q300 58,400 48 Q500 38,600 48 Q700 58,800 48 Q900 38,1000 48 Q1100 58,1200 44" stroke="#93c5fd" strokeWidth="1.5" opacity=".15" strokeLinecap="round"/>
          <path d="M0 54 Q120 42,240 54 Q360 66,480 54 Q600 42,720 54 Q840 66,960 54 Q1080 42,1200 50" stroke="#60a5fa" strokeWidth="1" opacity=".08" strokeLinecap="round"/>
        </svg>

        {/* 로고 */}
        <div onClick={() => navigate("/map")} style={{ flexShrink: 0, position: "relative", zIndex: 1, cursor: "pointer" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 101.10 31.50" width="140" height="44" overflow="visible">
            <text x="0" y="23.50" fontFamily="Arial Black, Helvetica Neue, Arial, sans-serif" fontWeight="900" fontSize="20" letterSpacing="1.20" fill="#cde0f0">NODAJI</text>
            <g transform="translate(91.60,3.00) rotate(35)">
              <circle cx="0" cy="0" r="5.5" fill="none" stroke="#8ab0cc" strokeWidth="0.44" opacity="0.80"/>
              <line x1="0" y1="-4.84" x2="0" y2="-3.03" stroke="#8ab0cc" strokeWidth="0.55" opacity="0.65"/>
              <line x1="0" y1="4.84" x2="0" y2="3.03" stroke="#8ab0cc" strokeWidth="0.55" opacity="0.65"/>
              <line x1="-4.84" y1="0" x2="-3.03" y2="0" stroke="#8ab0cc" strokeWidth="0.55" opacity="0.65"/>
              <line x1="4.84" y1="0" x2="3.03" y2="0" stroke="#8ab0cc" strokeWidth="0.55" opacity="0.65"/>
              <polygon points="0,-4.51 0.82,0 0,0.88 -0.82,0" fill="#d94e30"/>
              <polygon points="0,4.51 0.82,0 0,-0.88 -0.82,0" fill="#b8d0e8" opacity="0.85"/>
              <circle cx="0" cy="0" r="0.66" fill="#1a2440"/>
              <circle cx="0" cy="0" r="0.28" fill="#8ab0cc"/>
            </g>
          </svg>
        </div>

        {/* 구분선 + 트렌드 레이블 */}
        <div style={{ width: 1, height: 28, background: "rgba(148,163,184,0.25)", margin: "0 16px", position: "relative", zIndex: 1 }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: "#cde0f0", letterSpacing: "0.03em", position: "relative", zIndex: 1 }}>상권 트렌드</span>
        {latestQuarter && (
          <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8, position: "relative", zIndex: 1 }}>
            기준: {fmtQ(latestQuarter)}
          </span>
        )}
      </header>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 48px" }}>
        {/* 업종별 트렌드 캐러셀 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            업종별 트렌드
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
전 분기 대비 매출 증감률
          </p>

          {/* 성장 캐러셀 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#DC2626", whiteSpace: "nowrap" }}>▲ 성장</span>
          </div>
          <div style={{ position: "relative", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(to right, #F8FAFC, transparent)", zIndex: 2, pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(to left, #F8FAFC, transparent)", zIndex: 2, pointerEvents: "none" }} />
            <div ref={upCarouselRef} style={{ display: "flex", gap: 12, overflow: "hidden", cursor: "default" }}>
              {(() => { const up = categories.filter(c => c.매출_증감률 > 0); return [...up, ...up]; })().map((item, i) => (
                <div key={i} style={{ flexShrink: 0, width: 160, background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #FEE2E2" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.통합카테고리}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{fmt억(item.매출)}</div>
                  <ChangeRate value={item.매출_증감률} />
                </div>
              ))}
            </div>
          </div>

          {/* 하락 캐러셀 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#3B82F6", whiteSpace: "nowrap" }}>▼ 하락</span>
          </div>
          <div style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(to right, #F8FAFC, transparent)", zIndex: 2, pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(to left, #F8FAFC, transparent)", zIndex: 2, pointerEvents: "none" }} />
            <div ref={downCarouselRef} style={{ display: "flex", gap: 12, overflow: "hidden", cursor: "default" }}>
              {(() => { const down = categories.filter(c => c.매출_증감률 < 0); return [...down, ...down]; })().map((item, i) => (
                <div key={i} style={{ flexShrink: 0, width: 160, background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #DBEAFE" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.통합카테고리}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{fmt억(item.매출)}</div>
                  <ChangeRate value={item.매출_증감률} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 실시간 관심 상승 */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>실시간 관심 상승</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>최근 24시간 보고서 생성 기준</p>
          {(() => {
            const rankMeta = [
              { color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", glow: "0 4px 14px rgba(29,78,216,0.15)" },
              { color: "#3B82F6", bg: "#F0F9FF", border: "#BAE6FD", glow: "0 4px 14px rgba(59,130,246,0.10)" },
              { color: "#93C5FD", bg: "#F8FAFF", border: "#E0EAFF", glow: "none" },
            ];
            const Badge = ({ item, rank, type }) => {
              const m = rankMeta[rank];
              const name = item ? (item.dong || item.gu) : null;
              const sub = item?.dong ? item.gu : null;
              return (
                <div style={{ flex: 1, background: m.bg, border: `1.5px solid ${m.border}`, borderRadius: 14, padding: "16px 18px", boxShadow: m.glow }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: sub || item ? 6 : 0 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: m.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{rank + 1}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: name ? "#111827" : "#D1D5DB", letterSpacing: "-0.02em", lineHeight: 1 }}>
                      {name ?? "—"}
                    </span>
                  </div>
                  {sub && <div style={{ fontSize: 12, color: "#6B7280" }}>{sub}</div>}
                  {item && <div style={{ fontSize: 11, color: m.color, fontWeight: 600, marginTop: 4 }}>보고서 {item.count}회 생성</div>}
                </div>
              );
            };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 10 }}>구</div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {Array.from({ length: 3 }, (_, i) => <Badge key={i} item={trendingGu[i]} rank={i} type="구" />)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 10 }}>행정동</div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {Array.from({ length: 3 }, (_, i) => <Badge key={i} item={trendingDong[i]} rank={i} type="행정동" />)}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* 지역 선택기 */}
        <div style={{ marginBottom: 32, borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB", padding: "24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>지역 선택</span>
            <div style={{ display: "inline-flex", background: "#F1F5F9", borderRadius: 8, padding: 3, gap: 2 }}>
              {[{ key: "구", label: "구 단위" }, { key: "동", label: "행정동 단위" }].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRegionMode(key)}
                  style={{
                    padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600,
                    background: regionMode === key ? "#fff" : "transparent",
                    color: regionMode === key ? "#111827" : "#9CA3AF",
                    boxShadow: regionMode === key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <GuDropdown guList={guList} selectedGu={regionGu} onChange={setRegionGu} />
            {regionMode === "동" && (
              <DongDropdown dongList={guToDongs[regionGu] || []} selectedDong={regionDong} onChange={setRegionDong} />
            )}
          </div>
        </div>

        {/* 인기 업종 */}
        <section>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
              {regionMode === "구" ? `${regionGu}의 인기 업종` : `${regionDong}의 인기 업종`}
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr 1fr 1fr 1fr",
            padding: "10px 20px",
            fontSize: 13, fontWeight: 600, color: "#6B7280",
            borderBottom: "1px solid #E5E7EB",
            marginBottom: 8,
          }}>
            <span style={{ textAlign: "center" }}>순위</span>
            <span style={{ textAlign: "center" }}>업종</span>
            <span style={{ textAlign: "center" }}>{regionMode === "구" ? "인기 행정동" : "점포수"}</span>
            <span style={{ textAlign: "center" }}>매출</span>
            <span style={{ textAlign: "center" }}>매출 증감률</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {regionLoading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>불러오는 중...</div>
            ) : regionIndustries.slice(0, regionVisibleCount).length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>데이터 없음</div>
            ) : regionIndustries.slice(0, regionVisibleCount).map((row) => (
              <div
                key={row.순위}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 1fr 1fr 1fr",
                  alignItems: "center",
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #F3F4F6",
                  padding: "12px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: row.순위 <= 3 ? "#1D4ED8" : "#9CA3AF", textAlign: "center" }}>
                  {row.순위}위
                </span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <CatIcon cat={row.통합카테고리} size={20} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{row.통합카테고리}</span>
                </div>
                {regionMode === "구" ? (
                  <span style={{ textAlign: "center", fontSize: 14, color: "#6B7280" }}>{row.최고_행정동}</span>
                ) : (
                  <span style={{ textAlign: "center", fontSize: 14, color: "#6B7280" }}>{row.점포수?.toLocaleString()}개</span>
                )}
                <span style={{ textAlign: "center", fontSize: 14, color: "#111827", fontWeight: 500 }}>{fmt억(row.매출)}</span>
                <span style={{ textAlign: "center" }}><ChangeRate value={row.매출_증감률} /></span>
              </div>
            ))}
          </div>

          {regionIndustries.length > PAGE_SIZE && (
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <button
                onClick={() => setFullViewSection("region")}
                style={{ border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", padding: "7px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#374151" }}
              >
                전체 보기
              </button>
            </div>
          )}
        </section>

        {/* 주중매출 / 주말매출 인기 업종 */}
        <section style={{ marginTop: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
              {regionMode === "구" ? `${regionGu}의 업종별 매출 순위` : `${regionDong}의 업종별 매출 순위`}
            </h2>
            <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 8, padding: 3, gap: 2 }}>
              {[{ key: "weekday", label: "주중 매출" }, { key: "weekend", label: "주말 매출" }].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setMzVisible(PAGE_SIZE); }}
                  style={{
                    padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600,
                    background: activeTab === key ? "#fff" : "transparent",
                    color: activeTab === key ? "#111827" : "#9CA3AF",
                    boxShadow: activeTab === key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr 1fr",
            padding: "10px 20px",
            fontSize: 13, fontWeight: 600, color: "#6B7280",
            borderBottom: "1px solid #E5E7EB",
            marginBottom: 8,
          }}>
            <span style={{ textAlign: "center" }}>순위</span>
            <span style={{ textAlign: "center" }}>업종</span>
            <span style={{ textAlign: "center" }}>{activeTab === "weekday" ? "주중 매출 비율" : "주말 매출 비율"}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(() => {
              const data = activeTab === "weekday" ? weekdayIndustries : weekendIndustries;
              const barKey = activeTab === "weekday" ? "주중_매출비율" : "주말_매출비율";
              const maxVal = data.length > 0 ? Math.max(...data.map(r => r[barKey] || 0)) : 1;
              const barColor = activeTab === "weekday" ? "#3B82F6" : "#0EA5E9";

              return data.slice(0, mzVisible).map((row) => {
                const barPct = maxVal > 0 ? ((row[barKey] || 0) / maxVal) * 100 : 0;
                return (
                  <div
                    key={row.순위}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 1fr 1fr",
                      alignItems: "center",
                      background: "#fff",
                      borderRadius: 12,
                      border: "1px solid #F3F4F6",
                      padding: "12px 20px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: row.순위 <= 3 ? "#1D4ED8" : "#9CA3AF" }}>{row.순위}위</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <CatIcon cat={row.통합카테고리} size={20} />
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{row.통합카테고리}</span>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: barColor }}>{row[barKey]}%</span>
                      <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2, width: "80%", margin: "5px auto 0" }}>
                        <div style={{ height: "100%", width: `${barPct}%`, background: barColor, borderRadius: 2, transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {(activeTab === "weekday" ? weekdayIndustries : weekendIndustries).length > PAGE_SIZE && (
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <button
                onClick={() => setFullViewSection(activeTab)}
                style={{ border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", padding: "7px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#374151" }}
              >
                전체 보기
              </button>
            </div>
          )}
        </section>

        {/* 연령대별 매출 비율 */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            {regionMode === "구" ? `${regionGu}의 연령대별 매출 비율` : `${regionDong}의 연령대별 매출 비율`}
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>업종을 선택하면 해당 업종의 연령대별 매출 비율을 확인할 수 있어요</p>

          {/* 업종 선택 */}
          <AgeCategoryDropdown value={ageCategory} onChange={setAgeCategory} />

          {/* 도넛 차트 + 범례 */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F3F4F6", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "center", gap: 56, flexWrap: "wrap", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", minHeight: 260 }}>
            {ageLoading ? (
              <div style={{ color: "#9CA3AF", fontSize: 14 }}>불러오는 중...</div>
            ) : ageData.length > 0 ? (() => {
              const COLORS = ["#BFDBFE","#93C5FD","#60A5FA","#3B82F6","#2563EB","#1D4ED8"];
              const size = 200, cx = 100, cy = 100, r = 70, inner = 40;
              let cumAngle = -Math.PI / 2;
              const slices = ageData.map((d, i) => {
                const angle = (d.ratio / 100) * 2 * Math.PI;
                const x1 = cx + r * Math.cos(cumAngle);
                const y1 = cy + r * Math.sin(cumAngle);
                const x2 = cx + r * Math.cos(cumAngle + angle);
                const y2 = cy + r * Math.sin(cumAngle + angle);
                const xi1 = cx + inner * Math.cos(cumAngle);
                const yi1 = cy + inner * Math.sin(cumAngle);
                const xi2 = cx + inner * Math.cos(cumAngle + angle);
                const yi2 = cy + inner * Math.sin(cumAngle + angle);
                const large = angle > Math.PI ? 1 : 0;
                const path = `M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`;
                cumAngle += angle;
                return { path, color: COLORS[i], ...d };
              });
              return (
                <>
                  <svg width={size} height={size} style={{ flexShrink: 0 }}>
                    {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth={2} />)}
                    <text x={cx} y={cy - 8} textAnchor="middle" fontSize={13} fill="#6B7280">전체</text>
                    <text x={cx} y={cy + 10} textAnchor="middle" fontSize={11} fill="#9CA3AF">{ageCategory || "업종"}</text>
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {slices.map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: "#374151", width: 44 }}>{s.age}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{s.ratio}%</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })() : (
              <div style={{ color: "#9CA3AF", fontSize: 14 }}>데이터가 없습니다.</div>
            )}
          </div>
        </section>

        {/* 시간대별 매출 패턴 */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            {regionMode === "구" ? `${regionGu}의 시간대별 매출 패턴` : `${regionDong}의 시간대별 매출 패턴`}
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>어느 시간대에 매출이 집중되는지 확인할 수 있어요</p>
          <AgeCategoryDropdown value={timeCategory} onChange={setTimeCategory} />
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F3F4F6", padding: "28px 32px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", minHeight: 200 }}>
            {timeLoading ? (
              <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 14, padding: 32 }}>불러오는 중...</div>
            ) : timeData.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 14, padding: 32 }}>데이터가 없습니다.</div>
            ) : (() => {
              const maxRatio = Math.max(...timeData.map((d) => d.ratio));
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {timeData.map((d) => {
                    const isPeak = d.ratio === maxRatio;
                    const barColor = isPeak ? "#2563EB" : "#93C5FD";
                    return (
                      <div key={d.time} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 13, color: "#6B7280", width: 64, flexShrink: 0 }}>{d.time}</span>
                        <div style={{ flex: 1, height: 10, background: "#F3F4F6", borderRadius: 5, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(d.ratio / maxRatio) * 100}%`, background: barColor, borderRadius: 5, transition: "width 0.4s ease" }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: isPeak ? 700 : 500, color: isPeak ? "#1D4ED8" : "#374151", width: 40, textAlign: "right" }}>{d.ratio}%</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </section>

        {/* 업종별 성별 매출 비율 */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            {regionMode === "구" ? `${regionGu}의 업종별 성별 매출 비율` : `${regionDong}의 업종별 성별 매출 비율`}
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>업종별 남성·여성 매출 비율을 비교해요. 여성 비율이 높은 순으로 정렬됩니다.</p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: "#3B82F6", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#374151" }}>남성</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: "#F472B6", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#374151" }}>여성</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {genderLoading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>불러오는 중...</div>
            ) : genderData.slice(0, genderVisible).map((row) => (
              <div
                key={row.통합카테고리}
                style={{ background: "#fff", borderRadius: 12, border: "1px solid #F3F4F6", padding: "12px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "grid", gridTemplateColumns: "1fr 2fr 120px", alignItems: "center", gap: 16 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CatIcon cat={row.통합카테고리} size={18} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{row.통합카테고리}</span>
                </div>
                <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${row.남성비율}%`, background: "#3B82F6", transition: "width 0.4s ease" }} />
                  <div style={{ width: `${row.여성비율}%`, background: "#F472B6", transition: "width 0.4s ease" }} />
                </div>
                <div style={{ fontSize: 13, color: "#6B7280", textAlign: "right", whiteSpace: "nowrap" }}>
                  <span style={{ color: "#3B82F6", fontWeight: 600 }}>{row.남성비율}%</span>
                  <span style={{ margin: "0 4px" }}>·</span>
                  <span style={{ color: "#F472B6", fontWeight: 600 }}>{row.여성비율}%</span>
                </div>
              </div>
            ))}
          </div>

          {genderData.length > PAGE_SIZE && (
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <button
                onClick={() => setFullViewSection("gender")}
                style={{ border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", padding: "7px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#374151" }}
              >
                전체 보기
              </button>
            </div>
          )}
        </section>

        {/* 요일별 매출 패턴 */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            {regionMode === "구" ? `${regionGu}의 요일별 매출 패턴` : `${regionDong}의 요일별 매출 패턴`}
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>요일별 매출 비중을 확인할 수 있어요</p>
          <AgeCategoryDropdown value={weekdayPatternCategory} onChange={setWeekdayPatternCategory} />
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #F3F4F6", padding: "28px 32px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", minHeight: 200 }}>
            {weekdayPatternLoading ? (
              <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 14, padding: 32 }}>불러오는 중...</div>
            ) : weekdayPatternData.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 14, padding: 32 }}>데이터가 없습니다.</div>
            ) : (() => {
              const maxRatio = Math.max(...weekdayPatternData.map((d) => d.ratio));
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {weekdayPatternData.map((d) => {
                    const isWeekend = d.day === "토" || d.day === "일";
                    const isPeak = d.ratio === maxRatio;
                    const barColor = isPeak ? "#2563EB" : isWeekend ? "#FD8A8A" : "#93C5FD";
                    return (
                      <div key={d.day} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: isWeekend ? 600 : 400, color: isWeekend ? "#E05C5C" : "#6B7280", width: 24, flexShrink: 0, textAlign: "center" }}>{d.day}</span>
                        <div style={{ flex: 1, height: 10, background: "#F3F4F6", borderRadius: 5, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(d.ratio / maxRatio) * 100}%`, background: barColor, borderRadius: 5, transition: "width 0.4s ease" }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: isPeak ? 700 : 500, color: isPeak ? "#1D4ED8" : "#374151", width: 40, textAlign: "right" }}>{d.ratio}%</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </section>

        {/* 업종별 개업/폐업률 */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            {regionMode === "구" ? `${regionGu}의 업종별 개업/폐업률` : `${regionDong}의 업종별 개업/폐업률`}
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>개업률 - 폐업률 차이가 높은 순으로 정렬됩니다.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: "#3B82F6" }} /><span style={{ fontSize: 13, color: "#374151" }}>개업률</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: "#DC2626" }} /><span style={{ fontSize: 13, color: "#374151" }}>폐업률</span></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {openCloseLoading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>불러오는 중...</div>
            ) : (() => {
              const maxVal = Math.max(...openCloseData.map((r) => Math.max(r.개업률, r.폐업률)), 1);
              return openCloseData.slice(0, openCloseVisible).map((row) => (
                <div key={row.통합카테고리} style={{ background: "#fff", borderRadius: 12, border: "1px solid #F3F4F6", padding: "14px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "grid", gridTemplateColumns: "1fr 2fr", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CatIcon cat={row.통합카테고리} size={18} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{row.통합카테고리}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#3B82F6", fontWeight: 600, width: 32 }}>{row.개업률}%</span>
                      <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(row.개업률 / maxVal) * 100}%`, background: "#3B82F6", borderRadius: 3, transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 600, width: 32 }}>{row.폐업률}%</span>
                      <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(row.폐업률 / maxVal) * 100}%`, background: "#DC2626", borderRadius: 3, transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
          {openCloseData.length > PAGE_SIZE && (
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <button onClick={() => setFullViewSection("openClose")} style={{ border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", padding: "7px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#374151" }}>전체 보기</button>
            </div>
          )}
        </section>

        {/* 업종별 점포당 매출 */}
        <section style={{ marginTop: 48, marginBottom: 64 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            {regionMode === "구" ? `${regionGu}의 업종별 점포당 매출` : `${regionDong}의 업종별 점포당 매출`}
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>점포 1개당 평균 매출이 높은 업종 순입니다.</p>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr", padding: "10px 20px", fontSize: 13, fontWeight: 600, color: "#6B7280", borderBottom: "1px solid #E5E7EB", marginBottom: 8 }}>
            <span style={{ textAlign: "center" }}>순위</span>
            <span style={{ textAlign: "center" }}>업종</span>
            <span style={{ textAlign: "center" }}>점포당 매출</span>
            <span style={{ textAlign: "center" }}>점포수</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {salesPerStoreLoading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>불러오는 중...</div>
            ) : salesPerStoreData.slice(0, salesPerStoreVisible).map((row) => (
              <div key={row.통합카테고리} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr", alignItems: "center", background: "#fff", borderRadius: 12, border: "1px solid #F3F4F6", padding: "12px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: row.순위 <= 3 ? "#1D4ED8" : "#9CA3AF", textAlign: "center" }}>{row.순위}위</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <CatIcon cat={row.통합카테고리} size={20} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{row.통합카테고리}</span>
                </div>
                <span style={{ textAlign: "center", fontSize: 14, fontWeight: 600, color: "#1D4ED8" }}>{fmt억(row.점포당매출)}</span>
                <span style={{ textAlign: "center", fontSize: 14, color: "#6B7280" }}>{row.점포수?.toLocaleString()}개</span>
              </div>
            ))}
          </div>
          {salesPerStoreData.length > PAGE_SIZE && (
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <button onClick={() => setFullViewSection("salesPerStore")} style={{ border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", padding: "7px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#374151" }}>전체 보기</button>
            </div>
          )}
        </section>

      </div>
    </div>

    {/* 전체 보기 풀스크린 오버레이 */}
    {fullViewSection && (() => {
      const regionLabel = regionMode === "구" ? regionGu : regionDong;
      const titles = {
        region: `${regionLabel}의 인기 업종 전체`,
        weekday: `${regionLabel}의 주중 업종별 매출 순위 전체`,
        weekend: `${regionLabel}의 주말 업종별 매출 순위 전체`,
        gender: `${regionLabel}의 업종별 성별 매출 비율 전체`,
        openClose: `${regionLabel}의 업종별 개업/폐업률 전체`,
        salesPerStore: `${regionLabel}의 업종별 점포당 매출 전체`,
      };
      return (
        <div className="no-scrollbar" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#F8FAFC", overflowY: "auto", fontFamily: "'Pretendard', sans-serif" }}>
          {/* 헤더 */}
          <div style={{ position: "sticky", top: 0, background: "rgba(248,250,252,0.85)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(229,231,235,0.6)", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>{titles[fullViewSection]}</h2>
            <button
              onClick={() => setFullViewSection(null)}
              style={{ border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", padding: "7px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              닫기
            </button>
          </div>

          {/* 본문 */}
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 60px" }}>

            {/* 인기 업종 */}
            {fullViewSection === "region" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 1fr", padding: "10px 20px", fontSize: 13, fontWeight: 600, color: "#6B7280", borderBottom: "1px solid #E5E7EB", marginBottom: 8 }}>
                  <span style={{ textAlign: "center" }}>순위</span>
                  <span style={{ textAlign: "center" }}>업종</span>
                  <span style={{ textAlign: "center" }}>{regionMode === "구" ? "인기 행정동" : "점포수"}</span>
                  <span style={{ textAlign: "center" }}>매출</span>
                  <span style={{ textAlign: "center" }}>매출 증감률</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {regionIndustries.map((row) => (
                    <div key={row.순위} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 1fr", alignItems: "center", background: "#fff", borderRadius: 12, border: "1px solid #F3F4F6", padding: "12px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: row.순위 <= 3 ? "#1D4ED8" : "#9CA3AF", textAlign: "center" }}>{row.순위}위</span>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <CatIcon cat={row.통합카테고리} size={20} />
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{row.통합카테고리}</span>
                      </div>
                      {regionMode === "구" ? <span style={{ textAlign: "center", fontSize: 14, color: "#6B7280" }}>{row.최고_행정동}</span> : <span style={{ textAlign: "center", fontSize: 14, color: "#6B7280" }}>{row.점포수?.toLocaleString()}개</span>}
                      <span style={{ textAlign: "center", fontSize: 14, color: "#111827", fontWeight: 500 }}>{fmt억(row.매출)}</span>
                      <span style={{ textAlign: "center" }}><ChangeRate value={row.매출_증감률} /></span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 주중 / 주말 매출 순위 */}
            {(fullViewSection === "weekday" || fullViewSection === "weekend") && (() => {
              const data = fullViewSection === "weekday" ? weekdayIndustries : weekendIndustries;
              const barKey = fullViewSection === "weekday" ? "주중_매출비율" : "주말_매출비율";
              const maxVal = data.length > 0 ? Math.max(...data.map(r => r[barKey] || 0)) : 1;
              const barColor = fullViewSection === "weekday" ? "#3B82F6" : "#0EA5E9";
              return (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", padding: "10px 20px", fontSize: 13, fontWeight: 600, color: "#6B7280", borderBottom: "1px solid #E5E7EB", marginBottom: 8 }}>
                    <span style={{ textAlign: "center" }}>순위</span>
                    <span style={{ textAlign: "center" }}>업종</span>
                    <span style={{ textAlign: "center" }}>{fullViewSection === "weekday" ? "주중 매출 비율" : "주말 매출 비율"}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {data.map((row) => {
                      const barPct = maxVal > 0 ? ((row[barKey] || 0) / maxVal) * 100 : 0;
                      return (
                        <div key={row.순위} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", alignItems: "center", background: "#fff", borderRadius: 12, border: "1px solid #F3F4F6", padding: "12px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: row.순위 <= 3 ? "#1D4ED8" : "#9CA3AF", textAlign: "center" }}>{row.순위}위</span>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                            <CatIcon cat={row.통합카테고리} size={20} />
                            <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{row.통합카테고리}</span>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: barColor }}>{row[barKey]}%</span>
                            <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2, width: "80%", margin: "5px auto 0" }}>
                              <div style={{ height: "100%", width: `${barPct}%`, background: barColor, borderRadius: 2 }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {/* 성별 매출 비율 */}
            {fullViewSection === "gender" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: "#3B82F6" }} /><span style={{ fontSize: 13, color: "#374151" }}>남성</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: "#F472B6" }} /><span style={{ fontSize: 13, color: "#374151" }}>여성</span></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {genderData.map((row) => (
                    <div key={row.통합카테고리} style={{ background: "#fff", borderRadius: 12, border: "1px solid #F3F4F6", padding: "12px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "grid", gridTemplateColumns: "1fr 2fr 120px", alignItems: "center", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CatIcon cat={row.통합카테고리} size={18} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{row.통합카테고리}</span>
                      </div>
                      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${row.남성비율}%`, background: "#3B82F6" }} />
                        <div style={{ width: `${row.여성비율}%`, background: "#F472B6" }} />
                      </div>
                      <div style={{ fontSize: 13, color: "#6B7280", textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{ color: "#3B82F6", fontWeight: 600 }}>{row.남성비율}%</span>
                        <span style={{ margin: "0 4px" }}>·</span>
                        <span style={{ color: "#F472B6", fontWeight: 600 }}>{row.여성비율}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 개업/폐업률 */}
            {fullViewSection === "openClose" && (() => {
              const maxVal = Math.max(...openCloseData.map((r) => Math.max(r.개업률, r.폐업률)), 1);
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: "#3B82F6" }} /><span style={{ fontSize: 13, color: "#374151" }}>개업률</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: "#DC2626" }} /><span style={{ fontSize: 13, color: "#374151" }}>폐업률</span></div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {openCloseData.map((row) => (
                      <div key={row.통합카테고리} style={{ background: "#fff", borderRadius: 12, border: "1px solid #F3F4F6", padding: "14px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "grid", gridTemplateColumns: "1fr 2fr", alignItems: "center", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <CatIcon cat={row.통합카테고리} size={18} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{row.통합카테고리}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, color: "#3B82F6", fontWeight: 600, width: 32 }}>{row.개업률}%</span>
                            <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${(row.개업률 / maxVal) * 100}%`, background: "#3B82F6", borderRadius: 3 }} />
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 600, width: 32 }}>{row.폐업률}%</span>
                            <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${(row.폐업률 / maxVal) * 100}%`, background: "#DC2626", borderRadius: 3 }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}

            {/* 점포당 매출 */}
            {fullViewSection === "salesPerStore" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr", padding: "10px 20px", fontSize: 13, fontWeight: 600, color: "#6B7280", borderBottom: "1px solid #E5E7EB", marginBottom: 8 }}>
                  <span style={{ textAlign: "center" }}>순위</span>
                  <span style={{ textAlign: "center" }}>업종</span>
                  <span style={{ textAlign: "center" }}>점포당 매출</span>
                  <span style={{ textAlign: "center" }}>점포수</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {salesPerStoreData.map((row) => (
                    <div key={row.통합카테고리} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr", alignItems: "center", background: "#fff", borderRadius: 12, border: "1px solid #F3F4F6", padding: "12px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: row.순위 <= 3 ? "#1D4ED8" : "#9CA3AF", textAlign: "center" }}>{row.순위}위</span>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <CatIcon cat={row.통합카테고리} size={20} />
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{row.통합카테고리}</span>
                      </div>
                      <span style={{ textAlign: "center", fontSize: 14, fontWeight: 600, color: "#1D4ED8" }}>{fmt억(row.점포당매출)}</span>
                      <span style={{ textAlign: "center", fontSize: 14, color: "#6B7280" }}>{row.점포수?.toLocaleString()}개</span>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </div>
      );
    })()}
    </>
  );
}
