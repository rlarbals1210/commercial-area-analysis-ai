import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const INDUSTRIES = ["음식점", "카페", "편의점", "병원", "학원", "미용실", "헬스장", "약국"];
const REGIONS = [
  "강남구", "강동구", "강북구", "강서구", "관악구",
  "광진구", "구로구", "금천구", "노원구", "도봉구",
  "동대문구", "동작구", "마포구", "서대문구", "서초구",
  "성동구", "성북구", "송파구", "양천구", "영등포구",
  "용산구", "은평구", "종로구", "중구", "중랑구",
];

const POLYGON_DEFAULT = { fillColor: "#9EC8F0", fillOpacity: 0.15, strokeColor: "#6B9FD4", strokeOpacity: 0.8 };
const POLYGON_HOVER   = { fillColor: "#3B82F6", fillOpacity: 0.45, strokeColor: "#1D4ED8", strokeOpacity: 1 };
const POLYGON_SELECTED = { fillColor: "#EF4444", fillOpacity: 0.4, strokeColor: "#B91C1C", strokeOpacity: 1 };

export default function MapPage() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonGroupsRef = useRef([]);    // 행정동 폴리곤
  const guPolygonGroupsRef = useRef([]);  // 구 폴리곤
  const dongLabelsRef = useRef([]);       // 행정동 라벨
  const guLabelsRef = useRef([]);         // 구 라벨
  const selectedGroupRef = useRef(null);
  const GU_MODE_LEVEL = 7; // 이 레벨 이상이면 구 단위 표시

  const [mapLoaded, setMapLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredDong, setHoveredDong] = useState(null);   // { dongName, guName }
  const [selectedDong, setSelectedDong] = useState(null); // { dongName, guName } — 팝업용
  const [isGuMode, setIsGuMode] = useState(true);         // 구 모드 여부
  const [dongData, setDongData] = useState(null);          // API 응답 전체
  const [dongLoading, setDongLoading] = useState(false);  // 로딩 상태
  const [rankModalOpen, setRankModalOpen] = useState(false); // 전체 보기 모달
  const [availableQuarters, setAvailableQuarters] = useState([]); // 선택 가능한 분기 목록
  const [selectedQuarter, setSelectedQuarter] = useState(null);   // 선택된 분기 코드 (null=최신)

  // ── AI 추천 상태 ──
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiStep, setAiStep] = useState("mode"); // "mode" | "form" | "loading" | "result"
  const [aiMode, setAiMode] = useState(null);   // "dong" | "industry" | "score"
  const [aiIndustry, setAiIndustry] = useState(null);
  const [aiRegion, setAiRegion] = useState(null);
  const [aiDong, setAiDong] = useState("");
  const [aiResults, setAiResults] = useState(null);

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

    // 두 GeoJSON 동시 로드
    Promise.all([
      fetch("/seoul_hangjeongdong.geojson").then((r) => r.json()),
      fetch("/seoul_gu.geojson").then((r) => r.json()),
    ]).then(([dongGeoJson, guGeoJson]) => {
      drawDongPolygons(map, dongGeoJson, kakao);
      drawGuPolygons(map, guGeoJson, kakao);
      // 초기 레벨 8 → 구 모드 적용
      applyMode(map, map.getLevel());
    });

    // 줌 변경 시 모드 전환
    kakao.maps.event.addListener(map, "zoom_changed", () => {
      applyMode(map, map.getLevel());
    });
  }, [mapLoaded]);

  // ── 줌 레벨에 따라 구/행정동 표시 전환 ──
  function applyMode(map, level) {
    const guMode = level >= GU_MODE_LEVEL;
    polygonGroupsRef.current.forEach(({ polygons }) =>
      polygons.forEach((p) => p.setMap(guMode ? null : map))
    );
    guPolygonGroupsRef.current.forEach(({ polygons }) =>
      polygons.forEach((p) => p.setMap(guMode ? map : null))
    );
    dongLabelsRef.current.forEach((label) => label.setMap(guMode ? null : map));
    guLabelsRef.current.forEach((label) => label.setMap(guMode ? map : null));
    setIsGuMode(guMode);
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
        return new kakao.maps.Polygon({ path, strokeWeight: 1, ...POLYGON_DEFAULT });
      });

      polygons.forEach((polygon) => {
        kakao.maps.event.addListener(polygon, "mouseover", () => {
          if (selectedGroupRef.current?.dongName !== dongName)
            polygons.forEach((p) => p.setOptions(POLYGON_HOVER));
          setHoveredDong({ dongName, guName });
        });
        kakao.maps.event.addListener(polygon, "mouseout", () => {
          if (selectedGroupRef.current?.dongName !== dongName)
            polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
          setHoveredDong(null);
        });
        kakao.maps.event.addListener(polygon, "click", () => {
          if (selectedGroupRef.current)
            selectedGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
          polygons.forEach((p) => p.setOptions(POLYGON_SELECTED));
          selectedGroupRef.current = { dongName, polygons };

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

      polygonGroupsRef.current.push({ dongName, guName, polygons });
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
        return new kakao.maps.Polygon({ path, strokeWeight: 1.5, ...POLYGON_DEFAULT });
      });

      polygons.forEach((polygon) => {
        kakao.maps.event.addListener(polygon, "mouseover", () => {
          polygons.forEach((p) => p.setOptions(POLYGON_HOVER));
          setHoveredDong({ dongName: null, guName });
        });
        kakao.maps.event.addListener(polygon, "mouseout", () => {
          polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
          setHoveredDong(null);
        });
        kakao.maps.event.addListener(polygon, "click", () => {
          // 구 클릭 → 해당 구 중심으로 이동 후 행정동 레벨로 줌인
          const bounds = new kakao.maps.LatLngBounds();
          coords.forEach((ring) =>
            ring.forEach(([lng, lat]) => bounds.extend(new kakao.maps.LatLng(lat, lng)))
          );
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          const center = new kakao.maps.LatLng(
            (ne.getLat() + sw.getLat()) / 2,
            (ne.getLng() + sw.getLng()) / 2
          );
          map.panTo(center);
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

      guPolygonGroupsRef.current.push({ guName, polygons });
    });
  }

  // ── 행정동 변경 시: 분기 목록 fetch + 선택 분기 초기화 ──
  useEffect(() => {
    if (!selectedDong) {
      setAvailableQuarters([]);
      setSelectedQuarter(null);
      return;
    }
    setAvailableQuarters([]);
    setSelectedQuarter(null);
    fetch(`http://localhost:8000/api/quarters/?dong=${encodeURIComponent(selectedDong.dongName)}`)
      .then((r) => r.json())
      .then((data) => setAvailableQuarters(data.quarters || []))
      .catch(() => setAvailableQuarters([]));
  }, [selectedDong]);

  // ── 행정동 또는 선택 분기 변경 시: 분석 데이터 fetch ──
  useEffect(() => {
    if (!selectedDong) return;
    setDongData(null);
    setDongLoading(true);
    const url = selectedQuarter
      ? `http://localhost:8000/api/analysis/?dong=${encodeURIComponent(selectedDong.dongName)}&quarter=${selectedQuarter}`
      : `http://localhost:8000/api/analysis/?dong=${encodeURIComponent(selectedDong.dongName)}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setDongData(data))
      .catch(() => setDongData(null))
      .finally(() => setDongLoading(false));
  }, [selectedDong, selectedQuarter]);

  // ── AI 추천 요청 ──
  function handleAiRecommend() {
    if (aiMode === "dong" && !aiIndustry) return;
    if (aiMode === "industry" && !aiDong.trim()) return;
    if (aiMode === "score" && (!aiDong.trim() || !aiIndustry)) return;
    setAiStep("loading");

    // TODO: AI 추천 API 연결
    // POST http://localhost:8000/api/ai/recommend/
    // Body: { mode: aiMode, industry: aiIndustry, region: aiRegion, dong: aiDong }
    // Response: { results: [...] }
    setTimeout(() => {
      if (aiMode === "dong") setAiResults(MOCK_DONG_RESULTS(aiIndustry));
      else if (aiMode === "industry") setAiResults(MOCK_INDUSTRY_RESULTS(aiDong));
      else if (aiMode === "score") setAiResults(MOCK_SCORE_RESULT(aiDong, aiIndustry));
      setAiStep("result");
    }, 1800);
  }

  function openAiModal({ region = null, industry = null, dong = "" } = {}) {
    setAiModalOpen(true);
    setAiStep("mode");
    setAiMode(null);
    setAiIndustry(industry);
    setAiRegion(region);
    setAiDong(dong);
    setAiResults(null);
    setMenuOpen(false);
    setCategoryOpen(false);
  }

  // ── 팝업 외부 클릭 시 닫기 ──
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

      {/* ── 구 보기 버튼 ── */}
      <button
        style={{
          position: "absolute",
          bottom: 136,
          right: 20,
          height: 40,
          padding: "0 16px",
          background: isGuMode ? "#3B82F6" : "rgba(45,45,45,0.97)",
          color: isGuMode ? "#fff" : "#E8E8E8",
          border: isGuMode ? "none" : "1.5px solid #4A4A4A",
          borderRadius: 10,
          boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          backdropFilter: "blur(6px)",
          zIndex: 10,
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
        onClick={() => {
          const map = mapInstanceRef.current;
          if (!map) return;
          map.panTo(new window.kakao.maps.LatLng(37.5665, 126.9780));
          if (map.getLevel() < GU_MODE_LEVEL)
            map.setLevel(8, { animate: true });
        }}
      >
        구 보기
      </button>

      {/* ── 줌 버튼 (우하단) ── */}
      <div style={zoomBtnGroupStyle}>
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

      {/* ── 호버 툴팁 (지도 좌하단) ── */}
      {hoveredDong && (
        <div style={tooltipStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: hoveredDong.dongName ? 6 : 0 }}>
            <span style={tooltipLabel}>구</span>
            <span style={{ fontWeight: 700, color: "#E8E8E8", fontSize: 15 }}>{hoveredDong.guName}</span>
          </div>
          {hoveredDong.dongName && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={tooltipLabel}>행정동</span>
              <span style={{ fontWeight: 700, color: "#93B8EE", fontSize: 15 }}>{hoveredDong.dongName}</span>
            </div>
          )}
          <div style={{ color: "#9E9E9E", fontSize: 11, marginTop: 8, borderTop: "1px solid #3A3A3A", paddingTop: 6 }}>
            {hoveredDong.dongName ? "클릭하면 상세 정보" : "클릭하면 행정동 보기"}
          </div>
        </div>
      )}

      {/* ── 행정동 클릭 상세 팝업 (우측 사이드패널) ── */}
      {selectedDong && (
        <div style={sidePanelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "#9E9E9E", marginBottom: 2 }}>{selectedDong.guName}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#E8E8E8" }}>{selectedDong.dongName}</div>
            </div>
            <button
              onClick={() => {
                setSelectedDong(null);
                setRankModalOpen(false);
                if (selectedGroupRef.current) {
                  selectedGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
                  selectedGroupRef.current = null;
                }
              }}
              style={closeBtnStyle}
            >
              ✕
            </button>
          </div>

          {/* ── 연도/분기 선택 ── */}
          {availableQuarters.length > 0 && (() => {
            const years = [...new Set(availableQuarters.map((q) => Math.floor(q / 10)))];
            const activeYear = selectedQuarter ? Math.floor(selectedQuarter / 10) : Math.floor(availableQuarters[0] / 10);
            const quartersOfYear = availableQuarters.filter((q) => Math.floor(q / 10) === activeYear);
            return (
              <div style={{ marginBottom: 12 }}>
                {/* 연도 탭 */}
                <div style={{ display: "flex", gap: 4, marginBottom: 6, overflowX: "auto", paddingBottom: 2 }}>
                  {years.map((y) => (
                    <button
                      key={y}
                      onClick={() => {
                        const first = availableQuarters.find((q) => Math.floor(q / 10) === y);
                        setSelectedQuarter(first === availableQuarters[0] ? null : first);
                      }}
                      style={{
                        flexShrink: 0,
                        padding: "3px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "none",
                        background: activeYear === y ? "#3B82F6" : "rgba(255,255,255,0.07)",
                        color: activeYear === y ? "#fff" : "#9E9E9E",
                        transition: "all 0.12s",
                      }}
                    >
                      {y}
                    </button>
                  ))}
                </div>
                {/* 분기 칩 */}
                <div style={{ display: "flex", gap: 4 }}>
                  {quartersOfYear.map((q) => {
                    const isLatest = q === availableQuarters[0];
                    const isActive = selectedQuarter === q || (!selectedQuarter && isLatest);
                    return (
                      <button
                        key={q}
                        onClick={() => setSelectedQuarter(isLatest ? null : q)}
                        style={{
                          flexShrink: 0,
                          padding: "3px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: "pointer",
                          border: isActive ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.1)",
                          background: isActive ? "rgba(59,130,246,0.18)" : "transparent",
                          color: isActive ? "#93B8EE" : "#9E9E9E",
                          transition: "all 0.12s",
                        }}
                      >
                        {q % 10}분기
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div style={{ borderTop: "1px solid #4A4A4A", paddingTop: 14 }}>

            {dongLoading && (
              <p style={{ color: "#9E9E9E", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
                불러오는 중...
              </p>
            )}

            {!dongLoading && !dongData && (
              <p style={{ color: "#9E9E9E", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
                데이터가 없습니다
              </p>
            )}

            {!dongLoading && dongData && (() => {
              const industries = dongData.industries || [];
              const top6Rev   = industries.slice(0, 6);
              const top6Store = [...industries].sort((a, b) => b["점포수"] - a["점포수"]).slice(0, 6);
              const maxRevenue = Math.max(...top6Rev.map((d) => d["당월매출합"]), 1);
              const maxStores  = Math.max(...top6Store.map((d) => d["점포수"]), 1);

              return (
                <>
                  {/* 총 매출 + 순위 */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <div style={statCardStyle}>
                      <div style={{ fontSize: 10, color: "#9E9E9E", marginBottom: 4 }}>총 매출</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#E8E8E8" }}>
                        {fmtRevenue(dongData.총매출)}
                      </div>
                    </div>
                    <div style={statCardStyle}>
                      <div style={{ fontSize: 10, color: "#9E9E9E", marginBottom: 4 }}>전체 순위</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#93B8EE" }}>
                        {dongData.순위}위
                        <span style={{ fontSize: 10, color: "#9E9E9E", fontWeight: 400, marginLeft: 4 }}>
                          / {dongData.전체동수}동
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 업종별 매출 TOP 6 */}
                  <div style={{ fontSize: 11, color: "#9E9E9E", marginBottom: 7 }}>업종별 매출 TOP 6</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                    {top6Rev.map((item) => (
                      <div key={item["통합카테고리"]}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 11, color: "#C8C8C8" }}>{item["통합카테고리"]}</span>
                          <span style={{ fontSize: 11, color: "#9E9E9E" }}>{fmtRevenue(item["당월매출합"])}</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 3, height: 4, overflow: "hidden" }}>
                          <div style={{ width: `${(item["당월매출합"] / maxRevenue) * 100}%`, height: "100%", background: "linear-gradient(90deg, #3B82F6, #60A5FA)", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 업종별 상가 수 TOP 6 */}
                  <div style={{ fontSize: 11, color: "#9E9E9E", marginBottom: 7 }}>업종별 상가 수 TOP 6</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                    {top6Store.map((item) => (
                      <div key={item["통합카테고리"]}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 11, color: "#C8C8C8" }}>{item["통합카테고리"]}</span>
                          <span style={{ fontSize: 11, color: "#9E9E9E" }}>{item["점포수"]}개</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 3, height: 4, overflow: "hidden" }}>
                          <div style={{ width: `${(item["점포수"] / maxStores) * 100}%`, height: "100%", background: "linear-gradient(90deg, #10B981, #34D399)", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 전체 보기 버튼 */}
                  <button onClick={() => setRankModalOpen(true)} style={viewAllBtnStyle}>
                    전체 보기 ({industries.length}개 업종) →
                  </button>

                  {/* AI 추천 버튼 */}
                  <button
                    onClick={() => openAiModal({ region: selectedDong.guName, dong: selectedDong.dongName })}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "9px 0",
                      background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))",
                      color: "#93B8EE",
                      border: "1px solid rgba(139,92,246,0.4)",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      letterSpacing: "0.02em",
                    }}
                  >
                    ✨ 이 지역에서 AI 추천 받기
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── 전체 보기 모달 ── */}
      {rankModalOpen && dongData && (() => {
        const industries = dongData.industries || [];
        const maxRevenue = Math.max(...industries.map((d) => d["당월매출합"]), 1);
        const storesSorted = [...industries].sort((a, b) => b["점포수"] - a["점포수"]);
        const maxStores = Math.max(...storesSorted.map((d) => d["점포수"]), 1);
        return (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setRankModalOpen(false)}
          >
            <div
              style={{ background: "#2A2A2A", borderRadius: 16, padding: "24px", width: 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#9E9E9E", marginBottom: 2 }}>{selectedDong?.guName}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#E8E8E8" }}>{selectedDong?.dongName} 전체 업종 현황</div>
                </div>
                <button onClick={() => setRankModalOpen(false)} style={closeBtnStyle}>✕</button>
              </div>

              {/* ── 연도/분기 선택 ── */}
              {availableQuarters.length > 0 && (() => {
                const years = [...new Set(availableQuarters.map((q) => Math.floor(q / 10)))];
                const activeYear = selectedQuarter ? Math.floor(selectedQuarter / 10) : Math.floor(availableQuarters[0] / 10);
                const quartersOfYear = availableQuarters.filter((q) => Math.floor(q / 10) === activeYear);
                return (
                  <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #3A3A3A" }}>
                    {/* 연도 탭 */}
                    <div style={{ display: "flex", gap: 4, marginBottom: 8, overflowX: "auto", paddingBottom: 2 }}>
                      {years.map((y) => (
                        <button
                          key={y}
                          onClick={() => {
                            const first = availableQuarters.find((q) => Math.floor(q / 10) === y);
                            setSelectedQuarter(first === availableQuarters[0] ? null : first);
                          }}
                          style={{
                            flexShrink: 0,
                            padding: "4px 12px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "none",
                            background: activeYear === y ? "#3B82F6" : "rgba(255,255,255,0.07)",
                            color: activeYear === y ? "#fff" : "#9E9E9E",
                            transition: "all 0.12s",
                          }}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                    {/* 분기 칩 */}
                    <div style={{ display: "flex", gap: 6 }}>
                      {quartersOfYear.map((q) => {
                        const isLatest = q === availableQuarters[0];
                        const isActive = selectedQuarter === q || (!selectedQuarter && isLatest);
                        return (
                          <button
                            key={q}
                            onClick={() => setSelectedQuarter(isLatest ? null : q)}
                            style={{
                              flexShrink: 0,
                              padding: "4px 14px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: "pointer",
                              border: isActive ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.1)",
                              background: isActive ? "rgba(59,130,246,0.18)" : "transparent",
                              color: isActive ? "#93B8EE" : "#9E9E9E",
                              transition: "all 0.12s",
                            }}
                          >
                            {q % 10}분기
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {dongLoading ? (
                <p style={{ color: "#9E9E9E", fontSize: 13, textAlign: "center", padding: "24px 0" }}>불러오는 중...</p>
              ) : (
              <>
              <div style={{ fontSize: 11, color: "#9E9E9E", marginBottom: 10 }}>업종별 매출 (전체)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
                {industries.map((item) => (
                  <div key={item["통합카테고리"]}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: "#C8C8C8" }}>{item["통합카테고리"]}</span>
                      <span style={{ fontSize: 12, color: "#9E9E9E" }}>{fmtRevenue(item["당월매출합"])}</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 3, height: 5, overflow: "hidden" }}>
                      <div style={{ width: `${(item["당월매출합"] / maxRevenue) * 100}%`, height: "100%", background: "linear-gradient(90deg, #3B82F6, #60A5FA)", borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: "#9E9E9E", marginBottom: 10 }}>업종별 상가 수 (전체)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {storesSorted.map((item) => (
                  <div key={item["통합카테고리"]}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: "#C8C8C8" }}>{item["통합카테고리"]}</span>
                      <span style={{ fontSize: 12, color: "#9E9E9E" }}>{item["점포수"]}개</span>
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

      {/* ── AI 추천 모달 ── */}
      {aiModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setAiModalOpen(false)}
        >
          <div
            style={{ background: "#242424", borderRadius: 20, padding: "28px", width: 520, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>✨</span>
                  <span style={{ fontSize: 19, fontWeight: 700, color: "#E8E8E8" }}>AI 상권 추천</span>
                </div>
                <div style={{ fontSize: 12, color: "#9E9E9E", paddingLeft: 28 }}>
                  {aiStep === "mode" && "분석 방식을 선택하세요"}
                  {aiStep === "form" && AI_MODE_META[aiMode]?.desc}
                  {(aiStep === "loading" || aiStep === "result") && AI_MODE_META[aiMode]?.title}
                </div>
              </div>
              <button onClick={() => setAiModalOpen(false)} style={closeBtnStyle}>✕</button>
            </div>

            <div style={{ borderTop: "1px solid #3A3A3A", paddingTop: 20 }}>

              {/* ── 모드 선택 단계 ── */}
              {aiStep === "mode" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(AI_MODE_META).map(([mode, { icon, title, desc }]) => (
                    <button
                      key={mode}
                      onClick={() => { setAiMode(mode); setAiStep("form"); }}
                      style={aiModeCardStyle}
                    >
                      <span style={{ fontSize: 26, flexShrink: 0 }}>{icon}</span>
                      <div style={{ textAlign: "left", flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#E8E8E8", marginBottom: 3 }}>{title}</div>
                        <div style={{ fontSize: 12, color: "#9E9E9E" }}>{desc}</div>
                      </div>
                      <span style={{ color: "#555", fontSize: 18, flexShrink: 0 }}>›</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── 폼 단계 ── */}
              {aiStep === "form" && (
                <>
                  <button
                    onClick={() => { setAiStep("mode"); setAiMode(null); }}
                    style={{ fontSize: 12, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "0 0 16px 0" }}
                  >
                    ← 방식 다시 선택
                  </button>

                  {/* 모드별 폼 */}
                  {(aiMode === "dong" || aiMode === "score") && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={aiSectionLabel}>
                        <span style={aiRequiredBadge}>필수</span> 창업 업종 선택
                      </div>
                      <div style={chipGrid}>
                        {INDUSTRIES.map((item) => (
                          <button key={item} onClick={() => setAiIndustry(aiIndustry === item ? null : item)} style={chipStyle(aiIndustry === item)}>
                            {item}
                          </button>
                        ))}
                      </div>
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
                          fontSize: 14, outline: "none", boxSizing: "border-box",
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
                          fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
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
                  <div style={{ fontSize: 36, marginBottom: 16, display: "inline-block" }}>⚙️</div>
                  <div style={{ fontSize: 15, color: "#E8E8E8", fontWeight: 600, marginBottom: 8 }}>AI가 분석하고 있습니다</div>
                  <div style={{ fontSize: 12, color: "#9E9E9E" }}>매출·유동인구·경쟁 강도를 종합적으로 평가 중...</div>
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
                    <span style={{ fontSize: 13, color: "#9E9E9E" }}>
                      {aiMode === "dong" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiIndustry}</span>{aiRegion && <> · {aiRegion}</>} 추천 상권</>}
                      {aiMode === "industry" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiDong}</span> 추천 업종</>}
                      {aiMode === "score" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiDong}</span> · <span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiIndustry}</span> 적합도</>}
                    </span>
                    <button
                      onClick={() => { setAiStep("form"); setAiResults(null); }}
                      style={{ fontSize: 12, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      ← 다시 설정
                    </button>
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
                                <div style={{ fontSize: 15, fontWeight: 700, color: "#E8E8E8" }}>
                                  {aiMode === "dong" ? item.dongName : item.industry}
                                </div>
                                <div style={{ fontSize: 11, color: "#9E9E9E" }}>
                                  {aiMode === "dong" ? item.guName : item.category}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 22, fontWeight: 800, color: item.rank === 1 ? "#60A5FA" : "#E8E8E8" }}>{item.score}</div>
                              <div style={{ fontSize: 10, color: "#9E9E9E" }}>AI 점수</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: "#C8C8C8", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", marginBottom: 10, lineHeight: 1.6 }}>
                            {item.reason}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                            {item.tags.map((tag) => (
                              <span key={tag} style={{ fontSize: 11, color: "#93B8EE", background: "rgba(59,130,246,0.12)", borderRadius: 12, padding: "3px 9px", border: "1px solid rgba(59,130,246,0.25)" }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <div style={aiMiniStatStyle}>
                              <div style={{ fontSize: 10, color: "#9E9E9E", marginBottom: 2 }}>월 매출</div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#E8E8E8" }}>{fmtRevenue(item.revenue)}</div>
                            </div>
                            <div style={aiMiniStatStyle}>
                              <div style={{ fontSize: 10, color: "#9E9E9E", marginBottom: 2 }}>경쟁 점포</div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#E8E8E8" }}>{item.stores}개</div>
                            </div>
                            <div style={aiMiniStatStyle}>
                              <div style={{ fontSize: 10, color: "#9E9E9E", marginBottom: 2 }}>경쟁 강도</div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: item.competition === "낮음" ? "#34D399" : item.competition === "중간" ? "#FBBF24" : "#F87171" }}>
                                {item.competition}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
                            <div style={{ fontSize: 44, fontWeight: 800, color: "#60A5FA", lineHeight: 1 }}>{r.score}</div>
                            <div style={{ fontSize: 11, color: "#9E9E9E", marginTop: 4 }}>종합 점수</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#E8E8E8", marginBottom: 4 }}>등급 {r.grade}</div>
                            <div style={{ fontSize: 12, color: "#C8C8C8", lineHeight: 1.6 }}>{r.summary}</div>
                          </div>
                        </div>

                        {/* 항목별 점수 */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 11, color: "#9E9E9E", marginBottom: 10 }}>항목별 평가</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {r.breakdown.map((b) => (
                              <div key={b.label}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ fontSize: 12, color: "#C8C8C8" }}>{b.label}</span>
                                  <span style={{ fontSize: 12, color: "#9E9E9E", fontWeight: 600 }}>{b.score} / {b.max}</span>
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
                            <div style={{ fontSize: 11, color: "#34D399", fontWeight: 700, marginBottom: 8 }}>강점</div>
                            {r.pros.map((p) => <div key={p} style={{ fontSize: 12, color: "#C8C8C8", marginBottom: 4 }}>✓ {p}</div>)}
                          </div>
                          <div style={{ flex: 1, background: "rgba(239,68,68,0.07)", borderRadius: 10, padding: "12px", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <div style={{ fontSize: 11, color: "#F87171", fontWeight: 700, marginBottom: 8 }}>유의점</div>
                            {r.cons.map((c) => <div key={c} style={{ fontSize: 12, color: "#C8C8C8", marginBottom: 4 }}>! {c}</div>)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid #3A3A3A" }}>
                    <div style={{ fontSize: 11, color: "#777" }}>
                      ⚠️ 본 추천 결과는 AI 분석 기반이며, 실제 창업 시 현장 조사를 병행하시기 바랍니다.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 상단 왼쪽: 검색창 ── */}
      <div style={searchBoxStyle}>
        <span style={{ fontSize: 16, marginRight: 8, color: "#777" }}>🔍</span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="업종 또는 지역 검색"
          style={{ border: "none", outline: "none", fontSize: 14, width: "100%", background: "transparent", color: "#E8E8E8" }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{ border: "none", background: "none", cursor: "pointer", color: "#777", fontSize: 16, padding: 0 }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── 상단 오른쪽: AI 추천 + 카테고리 버튼 + 메뉴 버튼 ── */}
      <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 10, zIndex: 10 }}>

        {/* AI 추천 버튼 */}
        <button onClick={openAiModal} style={aiBtnStyle}>
          ✨ AI 추천
        </button>

        {/* 카테고리 검색 버튼 */}
        <div data-popup style={{ position: "relative" }}>
          <button onClick={() => { setCategoryOpen((v) => !v); setMenuOpen(false); }} style={btnStyle(categoryOpen)}>
            카테고리 검색
          </button>
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
              <div style={{ borderTop: "1px solid #4A4A4A", margin: "12px 0" }} />
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
              <button style={applyBtnStyle}>필터 적용</button>
            </div>
          )}
        </div>

        {/* 메뉴 버튼 */}
        <div data-popup style={{ position: "relative" }}>
          <button onClick={() => { setMenuOpen((v) => !v); setCategoryOpen(false); }} style={btnStyle(menuOpen)}>
            ☰ 메뉴
          </button>
          {menuOpen && (
            <div data-popup style={popupStyle({ right: 0, width: 180 })}>
              <button style={menuItemStyle} onClick={() => navigate("/login")}>🔐 로그인</button>
              <div style={{ borderTop: "1px solid #4A4A4A", margin: "4px 0" }} />
              <button style={menuItemStyle} onClick={() => navigate("/signup")}>📝 회원가입</button>
            </div>
          )}
        </div>
      </div>

      {/* ── 선택된 필터 뱃지 ── */}
      {(selectedIndustry || selectedRegion) && (
        <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 10 }}>
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
  fontSize: 20,
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
  background: "rgba(28,28,28,0.96)",
  borderRadius: 12,
  padding: "12px 16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  backdropFilter: "blur(8px)",
  zIndex: 10,
  fontSize: 14,
  pointerEvents: "none",
  minWidth: 180,
};

const tooltipLabel = {
  fontSize: 10,
  fontWeight: 700,
  color: "#888",
  background: "rgba(255,255,255,0.07)",
  borderRadius: 4,
  padding: "2px 6px",
  letterSpacing: "0.06em",
  flexShrink: 0,
};

const sidePanelStyle = {
  position: "absolute",
  top: 20,
  right: 20,
  width: 300,
  background: "rgba(35,35,35,0.97)",
  borderRadius: 16,
  boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
  padding: "20px",
  zIndex: 20,
  backdropFilter: "blur(8px)",
  marginTop: 64, // 상단 버튼들 아래에 위치
};

const closeBtnStyle = {
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "#9E9E9E",
  borderRadius: 8,
  width: 32,
  height: 32,
  cursor: "pointer",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const searchBoxStyle = {
  position: "absolute",
  top: 20,
  left: 20,
  display: "flex",
  alignItems: "center",
  background: "rgba(45,45,45,0.97)",
  borderRadius: "12px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
  padding: "0 14px",
  height: 44,
  width: 280,
  backdropFilter: "blur(6px)",
  zIndex: 10,
};

const btnStyle = (active) => ({
  height: 44,
  padding: "0 18px",
  background: active ? "#3B82F6" : "rgba(45,45,45,0.97)",
  color: active ? "#fff" : "#E8E8E8",
  border: "none",
  borderRadius: 12,
  boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  backdropFilter: "blur(6px)",
  transition: "all 0.15s",
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
  fontSize: 12,
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
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  cursor: "pointer",
});

const applyBtnStyle = {
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

const viewAllBtnStyle = {
  width: "100%",
  padding: "9px 0",
  background: "rgba(59,130,246,0.15)",
  color: "#93B8EE",
  border: "1px solid rgba(59,130,246,0.3)",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const statCardStyle = {
  flex: 1,
  background: "rgba(255,255,255,0.05)",
  borderRadius: 10,
  padding: "10px 12px",
  border: "1px solid rgba(255,255,255,0.07)",
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
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  backdropFilter: "blur(6px)",
  transition: "all 0.15s",
  letterSpacing: "0.02em",
};

const aiSectionLabel = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 700,
  color: "#C8C8C8",
  marginBottom: 10,
};

const aiRequiredBadge = {
  fontSize: 10,
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
  transition: "all 0.15s",
  width: "100%",
};

const AI_MODE_META = {
  dong:     { icon: "📍", title: "업종 선택 → 행정동 추천",     desc: "창업할 업종을 선택하면 최적의 상권을 추천합니다" },
  industry: { icon: "🏪", title: "행정동 선택 → 업종 추천",     desc: "관심 지역을 입력하면 유망 업종을 추천합니다" },
  score:    { icon: "📊", title: "행정동 · 업종 적합도 점수",   desc: "특정 지역과 업종 조합의 상세 점수를 분석합니다" },
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

// ── Mock AI 추천 데이터 (API 연결 전 임시 사용) ──
// TODO: 실제 AI API 연결 시 아래 세 함수를 fetch로 교체

function MOCK_DONG_RESULTS(industry) {
  return [
    { rank: 1, dongName: "역삼1동", guName: "강남구", score: 94,
      reason: `${industry} 업종의 유동인구 대비 경쟁 점포 수가 적어 진입 여지가 큽니다. 30~40대 직장인 비율이 높아 안정적인 고객층이 예상됩니다.`,
      tags: ["유동인구 多", "경쟁 낮음", "직장인 밀집"], revenue: 8_200_000_000, stores: 12, competition: "낮음" },
    { rank: 2, dongName: "홍제3동", guName: "서대문구", score: 87,
      reason: `${industry} 수요 대비 공급이 부족한 지역으로, 인근 대학교 유입 인구가 꾸준히 증가하는 추세입니다.`,
      tags: ["수요 증가", "임대료 저렴", "대학가 인접"], revenue: 4_600_000_000, stores: 8, competition: "낮음" },
    { rank: 3, dongName: "합정동", guName: "마포구", score: 81,
      reason: `20~30대 유동인구가 많고 상권이 성장 중입니다. 다만 ${industry} 관련 기존 점포 수도 증가하는 추세라 차별화 전략이 필요합니다.`,
      tags: ["젊은 유동인구", "상권 성장", "트렌디"], revenue: 6_100_000_000, stores: 21, competition: "중간" },
    { rank: 4, dongName: "신림동", guName: "관악구", score: 73,
      reason: `1~2인 가구 비율이 높고 ${industry} 수요가 꾸준합니다. 경쟁 강도가 높은 편이므로 가격 경쟁력 확보가 중요합니다.`,
      tags: ["1인 가구 多", "수요 안정", "가격 민감"], revenue: 3_800_000_000, stores: 34, competition: "높음" },
    { rank: 5, dongName: "상계1동", guName: "노원구", score: 68,
      reason: `가족 단위 거주자가 많아 ${industry} 수요가 예측 가능합니다. 임대료가 상대적으로 낮아 초기 비용 부담이 적습니다.`,
      tags: ["가족 단위", "임대료 저렴", "안정적 수요"], revenue: 2_900_000_000, stores: 19, competition: "중간" },
  ];
}

function MOCK_INDUSTRY_RESULTS(dong) {
  return [
    { rank: 1, industry: "카페", category: "음료·디저트", score: 91,
      reason: `${dong}은 유동인구 중 20~30대 비율이 높아 카페 수요가 안정적입니다. 인근 경쟁 카페 대비 공백 상권이 존재합니다.`,
      tags: ["수요 안정", "공백 상권", "재방문율 높음"], revenue: 3_200_000_000, stores: 7, competition: "낮음" },
    { rank: 2, industry: "음식점", category: "외식·식사", score: 85,
      reason: `${dong} 직장인 점심 수요가 높습니다. 저녁 시간대 가족 단위 고객도 꾸준히 유입됩니다.`,
      tags: ["점심 수요", "회전율 높음", "저녁 유동"], revenue: 5_800_000_000, stores: 18, competition: "중간" },
    { rank: 3, industry: "미용실", category: "뷰티·미용", score: 78,
      reason: `${dong} 반경 500m 내 미용실 수가 적어 접근성 면에서 유리합니다. 단골 고객 형성 가능성이 높습니다.`,
      tags: ["경쟁 적음", "단골 형성", "접근성 우수"], revenue: 1_400_000_000, stores: 4, competition: "낮음" },
    { rank: 4, industry: "편의점", category: "생활편의", score: 71,
      reason: `${dong} 야간 유동인구가 꾸준하여 편의점 운영에 유리합니다. 단, 기존 대형 체인과의 경쟁을 고려해야 합니다.`,
      tags: ["야간 수요", "24시간 운영", "안정 매출"], revenue: 2_100_000_000, stores: 11, competition: "중간" },
    { rank: 5, industry: "헬스장", category: "스포츠·건강", score: 63,
      reason: `${dong} 30~40대 직장인 거주 비율이 높아 건강 관심도가 높습니다. 초기 시설 투자 비용이 크므로 사전 검토가 필요합니다.`,
      tags: ["건강 관심 高", "직장인 타겟", "초기 투자 필요"], revenue: 1_800_000_000, stores: 3, competition: "낮음" },
  ];
}

function MOCK_SCORE_RESULT(dong, industry) {
  return {
    score: 82,
    grade: "B+",
    summary: `${dong}은 ${industry} 창업 시 평균 이상의 적합도를 보입니다. 유동인구와 매출 잠재력은 우수하나 경쟁 강도를 사전에 파악하고 진입하는 것을 권장합니다.`,
    breakdown: [
      { label: "매출 잠재력",  score: 88, max: 100 },
      { label: "유동인구",     score: 85, max: 100 },
      { label: "경쟁 강도",   score: 72, max: 100 },
      { label: "임대료 수준", score: 78, max: 100 },
      { label: "성장 추세",   score: 83, max: 100 },
    ],
    pros: ["유동인구 대비 동업종 점포 수 적정", "최근 3개월 매출 상승 추세", "20~40대 핵심 소비층 집중"],
    cons: ["인근 대형 프랜차이즈 입점 예정", "임대료 전년 대비 8% 상승"],
  };
}

function fmtRevenue(won) {
  if (!won) return "0원";
  const eok = won / 100_000_000;
  if (eok >= 1) return `${eok.toFixed(1)}억원`;
  return `${Math.round(won / 10_000).toLocaleString()}만원`;
}
