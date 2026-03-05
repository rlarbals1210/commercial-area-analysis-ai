import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const INDUSTRIES = ["음식점", "카페", "편의점", "병원", "학원", "미용실", "헬스장", "약국"];
const REGIONS = ["수원시", "성남시", "용인시", "안양시", "부천시", "광명시", "평택시", "안산시"];

export default function App() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // 카카오 지도 스크립트 로드
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

    script.onload = () => {
      window.kakao.maps.load(() => setMapLoaded(true));
    };

    document.head.appendChild(script);
  }, []);

  // 지도 생성
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const { kakao } = window;

    const center = new kakao.maps.LatLng(37.2635727, 127.0286009);

    const map = new kakao.maps.Map(mapRef.current, {
      center: center,
      level: 4,
    });

    new kakao.maps.Marker({
      position: center,
      map: map,
    });
  }, [mapLoaded]);

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-popup]")) {
        setMenuOpen(false);
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", fontFamily: "'Pretendard', sans-serif" }}>

      {/* 지도 영역 */}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* ── 상단 왼쪽: 검색창 ── */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          display: "flex",
          alignItems: "center",
          background: "rgba(255,255,255,0.95)",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
          padding: "0 14px",
          height: 44,
          width: 280,
          backdropFilter: "blur(6px)",
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 16, marginRight: 8, color: "#888" }}>🔍</span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="업종 또는 지역 검색"
          style={{
            border: "none",
            outline: "none",
            fontSize: 14,
            width: "100%",
            background: "transparent",
            color: "#333",
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{ border: "none", background: "none", cursor: "pointer", color: "#aaa", fontSize: 16, padding: 0 }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── 상단 오른쪽: 카테고리 버튼 + 메뉴 버튼 ── */}
      <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 10, zIndex: 10 }}>

        {/* 카테고리 검색 버튼 */}
        <div data-popup style={{ position: "relative" }}>
          <button
            onClick={() => { setCategoryOpen((v) => !v); setMenuOpen(false); }}
            style={btnStyle(categoryOpen)}
          >
            카테고리 검색
          </button>

          {/* 카테고리 팝업 */}
          {categoryOpen && (
            <div data-popup style={popupStyle({ right: 0 })}>
              <p style={popupSectionLabel}>업종</p>
              <div style={chipGrid}>
                {INDUSTRIES.map((item) => (
                  <button
                    key={item}
                    onClick={() => setSelectedIndustry(selectedIndustry === item ? null : item)}
                    style={chipStyle(selectedIndustry === item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #eee", margin: "12px 0" }} />

              <p style={popupSectionLabel}>지역</p>
              <div style={chipGrid}>
                {REGIONS.map((item) => (
                  <button
                    key={item}
                    onClick={() => setSelectedRegion(selectedRegion === item ? null : item)}
                    style={chipStyle(selectedRegion === item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <button
                style={{
                  marginTop: 14,
                  width: "100%",
                  padding: "10px 0",
                  background: "#3B82F6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                필터 적용
              </button>
            </div>
          )}
        </div>

        {/* 메뉴 버튼 */}
        <div data-popup style={{ position: "relative" }}>
          <button
            onClick={() => { setMenuOpen((v) => !v); setCategoryOpen(false); }}
            style={btnStyle(menuOpen)}
          >
            ☰ 메뉴
          </button>

          {/* 메뉴 팝업 */}
          {menuOpen && (
            <div data-popup style={popupStyle({ right: 0, width: 180 })}>
              <button onClick={() => navigate("/login")} style={menuItemStyle}>
                🔐 로그인
              </button>
              <div style={{ borderTop: "1px solid #eee", margin: "4px 0" }} />
              <button onClick={() => navigate("/signup")} style={menuItemStyle}>
                📝 회원가입
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 선택된 필터 뱃지 (지도 위 상단 중앙) ── */}
      {(selectedIndustry || selectedRegion) && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 8,
            zIndex: 10,
          }}
        >
          {selectedIndustry && (
            <span style={badgeStyle}>
              {selectedIndustry}
              <button onClick={() => setSelectedIndustry(null)} style={badgeClose}>✕</button>
            </span>
          )}
          {selectedRegion && (
            <span style={badgeStyle}>
              {selectedRegion}
              <button onClick={() => setSelectedRegion(null)} style={badgeClose}>✕</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 스타일 헬퍼 ── */

const btnStyle = (active) => ({
  height: 44,
  padding: "0 18px",
  background: active ? "#3B82F6" : "rgba(255,255,255,0.95)",
  color: active ? "#fff" : "#333",
  border: "none",
  borderRadius: 12,
  boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  backdropFilter: "blur(6px)",
  transition: "all 0.15s",
});

const popupStyle = (extra = {}) => ({
  position: "absolute",
  top: 52,
  background: "#fff",
  borderRadius: 14,
  boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
  padding: "16px",
  zIndex: 100,
  width: 260,
  ...extra,
});

const popupSectionLabel = {
  margin: "0 0 8px 0",
  fontSize: 12,
  fontWeight: 700,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const chipGrid = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const chipStyle = (active) => ({
  padding: "6px 12px",
  borderRadius: 20,
  border: active ? "2px solid #3B82F6" : "1.5px solid #ddd",
  background: active ? "#EFF6FF" : "#fff",
  color: active ? "#3B82F6" : "#555",
  fontSize: 13,
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
  fontSize: 14,
  cursor: "pointer",
  borderRadius: 8,
  color: "#333",
};

const badgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "#3B82F6",
  color: "#fff",
  borderRadius: 20,
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 600,
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
};

const badgeClose = {
  border: "none",
  background: "none",
  color: "#fff",
  cursor: "pointer",
  fontSize: 12,
  padding: 0,
  lineHeight: 1,
};
