import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Utensils, Coffee, Beer, ShoppingBag, Pill, GraduationCap,
  Scissors, Car, Music, Monitor, Dumbbell, Fish, Home, Landmark,
  Plane, Building2, Shirt, Eye, Gem, Stethoscope, Leaf, ShoppingCart,
  Zap, Wrench, ChefHat, Croissant, Cookie, Store, Smartphone,
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
          display: "flex", alignItems: "center", gap: 8, minWidth: 120,
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
const PAGE_SIZE = 10;

const CAT_ICON = {
  "한식": Utensils, "중식": Utensils, "일식": Fish, "양식/기타외식": ChefHat,
  "카페": Coffee, "주점": Beer, "패스트푸드/치킨": Utensils, "분식/간식": Cookie,
  "베이커리/디저트": Croissant, "편의점": Store, "슈퍼마켓": ShoppingCart,
  "생활용품 소매": ShoppingBag, "화장품": Scissors, "의류": Shirt, "일반의류": Shirt,
  "신발": ShoppingBag, "안경": Eye, "귀금속": Gem,
  "일반의원": Stethoscope, "치과의원": Stethoscope, "한의원": Leaf, "의약품": Pill,
  "일반교습학원": GraduationCap, "예체능학원": Music, "어학원": GraduationCap,
  "미용실": Scissors, "네일숍": Scissors, "피부관리실": Leaf, "자동차수리/미용": Car,
  "세탁소": Shirt, "수리/세탁": Wrench, "노래방": Music, "PC방": Monitor,
  "당구장": Dumbbell, "골프연습장": Dumbbell, "스포츠클럽": Dumbbell,
  "수산물판매": Fish, "반찬가게": Utensils, "육류판매": Utensils,
  "부동산": Home, "금융": Landmark, "여행": Plane,
  "B2B 서비스": Building2, "뷰티/화장품": Scissors, "식품 소매": ShoppingBag,
  "컴퓨터및주변장치판매": Monitor, "가전제품": Zap, "의료기기": Stethoscope,
  "핸드폰": Smartphone, "치킨전문점": Utensils,
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
    <span style={{ color: up ? "#EF4444" : "#3B82F6", fontWeight: 600 }}>
      {up ? "▲" : "▼"} {Math.abs(value)}%
    </span>
  );
}

export default function TrendPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [latestQuarter, setLatestQuarter] = useState("");

  const [guList, setGuList] = useState([]);
  const [guToDongs, setGuToDongs] = useState({});
  const [selectedGu, setSelectedGu] = useState("");
  const [guIndustries, setGuIndustries] = useState([]);
  const [guLoading, setGuLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [mzVisible, setMzVisible] = useState(PAGE_SIZE);
  const [weekdayIndustries, setWeekdayIndustries] = useState([]);
  const [weekendIndustries, setWeekendIndustries] = useState([]);
  const [activeTab, setActiveTab] = useState("weekday");

  const [ageCategory, setAgeCategory] = useState("");
  const [ageData, setAgeData] = useState([]);
  const [ageLoading, setAgeLoading] = useState(false);

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
        setSelectedGu(sorted[0] || "");
      });
  }, []);

  // 구 선택 시 인기 업종 로드
  useEffect(() => {
    if (!selectedGu || !guToDongs[selectedGu]) return;
    setGuLoading(true);
    setVisibleCount(PAGE_SIZE);
    fetch(`${API}/api/trend/gu-industries/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gu: selectedGu, dongs: guToDongs[selectedGu] }),
    })
      .then((r) => r.json())
      .then((data) => {
        setGuIndustries(data.results || []);
        setGuLoading(false);
      });
  }, [selectedGu, guToDongs]);

  // MZ / 주중 / 주말 인기 업종 로드
  useEffect(() => {
    fetch(`${API}/api/trend/weekday-industries/`)
      .then((r) => r.json())
      .then((data) => setWeekdayIndustries(data.results || []));
    fetch(`${API}/api/trend/weekend-industries/`)
      .then((r) => r.json())
      .then((data) => setWeekendIndustries(data.results || []));
  }, []);

  // 연령대 매출 비율 로드
  useEffect(() => {
    setAgeLoading(true);
    fetch(`${API}/api/trend/age-breakdown/${ageCategory ? `?category=${encodeURIComponent(ageCategory)}` : ""}`)
      .then((r) => r.json())
      .then((data) => { setAgeData(data.breakdown || []); setAgeLoading(false); })
      .catch(() => setAgeLoading(false));
  }, [ageCategory]);

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

  const visibleRows = guIndustries.slice(0, visibleCount);
  const hasMore = visibleCount < guIndustries.length;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Pretendard', sans-serif" }}>
      {/* 상단 헤더 */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #E5E7EB",
        padding: "0 32px",
        height: 60,
        display: "flex",
        alignItems: "center",
        gap: 16,
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: "#F1F5F9", color: "#374151",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          ← 지도로 돌아가기
        </button>
        <div style={{ width: 1, height: 24, background: "#E5E7EB" }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>상권 트렌드</span>
        {latestQuarter && (
          <span style={{ fontSize: 13, color: "#6B7280", marginLeft: 4 }}>
            기준: {fmtQ(latestQuarter)}
          </span>
        )}
      </div>

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
            <span style={{ fontSize: 12, fontWeight: 600, color: "#EF4444", whiteSpace: "nowrap" }}>▲ 성장</span>
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

        {/* 구별 인기 업종 */}
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
            구별 인기 업종
          </h2>
          <div style={{ marginBottom: 16 }}>
            <GuDropdown guList={guList} selectedGu={selectedGu} onChange={setSelectedGu} />
          </div>

          {/* 헤더 */}
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
            <span style={{ textAlign: "center" }}>인기 행정동</span>
            <span style={{ textAlign: "center" }}>매출</span>
            <span style={{ textAlign: "center" }}>매출 증감률</span>
          </div>

          {/* 카드 목록 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {guLoading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>불러오는 중...</div>
            ) : visibleRows.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>데이터 없음</div>
            ) : visibleRows.map((row) => (
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
                {/* 순위 */}
                <span style={{ fontSize: 14, fontWeight: 700, color: row.순위 <= 3 ? "#1D4ED8" : "#9CA3AF", textAlign: "center" }}>
                  {row.순위}위
                </span>
                {/* 아이콘 + 업종 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <CatIcon cat={row.통합카테고리} size={20} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{row.통합카테고리}</span>
                </div>
                <span style={{ textAlign: "center", fontSize: 14, color: "#6B7280" }}>{row.최고_행정동}</span>
                <span style={{ textAlign: "center", fontSize: 14, color: "#111827", fontWeight: 500 }}>{fmt억(row.매출)}</span>
                <span style={{ textAlign: "center" }}><ChangeRate value={row.매출_증감률} /></span>
              </div>
            ))}
          </div>

          {hasMore && (
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <button
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                style={{
                  border: "none", background: "none", cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 4,
                  color: "#9CA3AF", fontSize: 13, fontWeight: 500,
                }}
              >
                더 보기
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          )}
        </section>

        {/* 주중매출 / 주말매출 인기 업종 */}
        <section style={{ marginTop: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>업종별 매출 순위</h2>
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
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
            {activeTab === "weekday" ? "주중(월~금) 매출이 높은 업종 순위" : "주말(토~일) 매출이 높은 업종 순위"}
          </p>

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

          {mzVisible < (activeTab === "weekday" ? weekdayIndustries : weekendIndustries).length && (
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <button
                onClick={() => setMzVisible((v) => v + PAGE_SIZE)}
                style={{
                  border: "none", background: "none", cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 4,
                  color: "#9CA3AF", fontSize: 13, fontWeight: 500,
                }}
              >
                더 보기
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          )}
        </section>

        {/* 연령대별 매출 비율 */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>연령대별 매출 비율</h2>
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
      </div>
    </div>
  );
}
