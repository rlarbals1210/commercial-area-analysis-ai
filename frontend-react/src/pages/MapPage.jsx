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

  // ── 행정동 클릭 시 API fetch ──
  useEffect(() => {
    if (!selectedDong) return;
    setDongData(null);
    setDongLoading(true);
    fetch(`http://localhost:8000/api/analysis/?dong=${encodeURIComponent(selectedDong.dongName)}`)
      .then((r) => r.json())
      .then((data) => setDongData(data))
      .catch(() => setDongData(null))
      .finally(() => setDongLoading(false));
  }, [selectedDong]);

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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#9E9E9E" }}>{selectedDong?.guName}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#E8E8E8" }}>{selectedDong?.dongName} 전체 업종 현황</div>
                </div>
                <button onClick={() => setRankModalOpen(false)} style={closeBtnStyle}>✕</button>
              </div>

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
            </div>
          </div>
        );
      })()}

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

      {/* ── 상단 오른쪽: 카테고리 버튼 + 메뉴 버튼 ── */}
      <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 10, zIndex: 10 }}>

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
