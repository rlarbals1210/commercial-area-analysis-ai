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

const POLYGON_DEFAULT  = { fillColor: "#9EC8F0", fillOpacity: 0.15, strokeColor: "#6B9FD4", strokeOpacity: 0.8 };
const POLYGON_HOVER    = { fillColor: "#3B82F6", fillOpacity: 0.45, strokeColor: "#1D4ED8", strokeOpacity: 1 };
const POLYGON_SELECTED = { fillColor: "#3B82F6", fillOpacity: 0.6,  strokeColor: "#1D4ED8", strokeOpacity: 1 };


export default function MapPage() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonGroupsRef = useRef([]);    // 행정동 폴리곤
  const guPolygonGroupsRef = useRef([]);  // 구 폴리곤
  const dongLabelsRef = useRef([]);       // 행정동 라벨
  const guLabelsRef = useRef([]);         // 구 라벨
  const selectedGroupRef = useRef(null);
  const selectedGuGroupRef = useRef(null); // 선택된 구 폴리곤
  const guToDongsRef = useRef({});         // { 구이름: [행정동이름, ...] }
  const storeMarkersRef = useRef([]);      // 개별 상가 마커 (CustomOverlay)
  const storeInfoWindowRef = useRef(null); // 현재 열린 상가 팝업
  const guBadgeOverlayRef = useRef(null);   // 구 선택 시 지도 위 매출 뱃지
  const dongBadgeOverlayRef = useRef(null); // 행정동 선택 시 지도 위 매출 뱃지
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
  const [isGuMode, setIsGuMode] = useState(true);         // 구 모드 여부
  const [dongData, setDongData] = useState(null);          // API 응답 전체
  const [dongLoading, setDongLoading] = useState(false);  // 로딩 상태
  const [rankModalOpen, setRankModalOpen] = useState(false); // 전체 보기 모달
  const [availableQuarters, setAvailableQuarters] = useState([]); // 선택 가능한 분기 목록
  const [selectedQuarter, setSelectedQuarter] = useState(null);   // 선택된 분기 코드 (null=최신)
  const [guData, setGuData] = useState(null);
  const [guLoading, setGuLoading] = useState(false);
  const [guRankModalOpen, setGuRankModalOpen] = useState(false);
  const [guAvailableQuarters, setGuAvailableQuarters] = useState([]);
  const [guSelectedQuarter, setGuSelectedQuarter] = useState(null);
  const [quarterPopupOpen, setQuarterPopupOpen] = useState(false);
  const [guQuarterPopupOpen, setGuQuarterPopupOpen] = useState(false);

  // ── 상가 마커 상태 ──
  const [showStoreMarkers, setShowStoreMarkers] = useState(false);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeCategoryFilter, setStoreCategoryFilter] = useState(null);

  // ── 창업 적합도 상태 ──
  const [scoreData, setScoreData] = useState(null);       // 전체 업종 점수 목록
  const [selectedScoreCat, setSelectedScoreCat] = useState(null); // 선택된 업종

  // ── AI 추천 상태 ──
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiStep, setAiStep] = useState("mode"); // "mode" | "form" | "loading" | "result"
  const [aiMode, setAiMode] = useState(null);   // "dong" | "industry" | "score"
  const [aiIndustry, setAiIndustry] = useState(null);
  const [aiRegion, setAiRegion] = useState(null);
  const [aiDong, setAiDong] = useState("");
  const [aiResults, setAiResults] = useState(null);

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
    guPolygonGroupsRef.current.forEach(({ guName, polygons }) => {
      const isSelected = selectedGuGroupRef.current?.guName === guName;
      polygons.forEach((p) => {
        p.setMap(guMode || isSelected ? map : null);
        if (!guMode && isSelected) p.setOptions(POLYGON_SELECTED);
      });
    });
    dongLabelsRef.current.forEach((label) => label.setMap(guMode ? null : map));
    guLabelsRef.current.forEach((label) => label.setMap(guMode ? map : null));
    // 구 모드 전환 시 뱃지 표시/숨김
    if (guBadgeOverlayRef.current)
      guBadgeOverlayRef.current.setMap(guMode ? map : null);
    if (dongBadgeOverlayRef.current)
      dongBadgeOverlayRef.current.setMap(guMode || level < DONG_BADGE_HIDE_LEVEL ? null : map);
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
        return new kakao.maps.Polygon({ path, strokeWeight: 1, zIndex: 2, ...POLYGON_DEFAULT });
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
          // 구 패널 닫기
          if (selectedGuGroupRef.current) {
            selectedGuGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
            selectedGuGroupRef.current = null;
          }
          setSelectedGu(null);

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
          polygons.forEach((p) => p.setOptions(POLYGON_HOVER));
          setHoveredDong({ dongName: null, guName });
        });
        kakao.maps.event.addListener(polygon, "mouseout", () => {
          // 선택된 구는 DEFAULT로 리셋하지 않고 SELECTED 유지
          const isSelected = selectedGuGroupRef.current?.guName === guName;
          polygons.forEach((p) => p.setOptions(isSelected ? POLYGON_SELECTED : POLYGON_DEFAULT));
          setHoveredDong(null);
        });
        kakao.maps.event.addListener(polygon, "click", () => {
          // 이전 선택 구 폴리곤 초기화
          if (selectedGuGroupRef.current)
            selectedGuGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
          polygons.forEach((p) => p.setOptions(POLYGON_SELECTED));
          selectedGuGroupRef.current = { guName, polygons };
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
  }

  function showStoreMarkersOnMap(map, stores) {
    const { kakao } = window;
    stores.forEach((store) => {
      const color = STORE_CATEGORY_COLORS[store.통합카테고리] || "#9E9E9E";

      // 마커 DOM
      const el = document.createElement("div");
      el.title = store.상호명;
      el.style.cssText = `
        width: 10px; height: 10px;
        background: ${color};
        border: 2px solid rgba(255,255,255,0.8);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.5);
        transition: transform 0.1s;
      `;
      el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.6)"; });
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
        yAnchor: 0.5,
        zIndex: 5,
      });
      overlay.setMap(map);
      storeMarkersRef.current.push(overlay);
    });
  }

  // ── 행정동 선택 + 마커 토글 변경 시: 상가 마커 fetch/clear ──
  useEffect(() => {
    clearStoreMarkers();
    const map = mapInstanceRef.current;
    if (!showStoreMarkers || !selectedDong || !map || !window.kakao) return;

    let cancelled = false;
    setStoreLoading(true);
    const params = new URLSearchParams({ dong: selectedDong.dongName, limit: 500 });
    if (storeCategoryFilter) params.set("category", storeCategoryFilter);

    fetch(`http://localhost:8000/api/stores/?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        showStoreMarkersOnMap(map, data.stores || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setStoreLoading(false); });

    return () => { cancelled = true; };
  }, [showStoreMarkers, selectedDong, storeCategoryFilter]);

  // 업종 필터 선택 시 상가 마커 자동 표시
  useEffect(() => {
    if (selectedIndustry && selectedDong) {
      setStoreCategoryFilter(selectedIndustry);
      setShowStoreMarkers(true);
    }
  }, [selectedIndustry]);

  // 행정동 패널 닫힐 때 마커 + 점수 초기화
  useEffect(() => {
    if (!selectedDong) {
      clearStoreMarkers();
      setShowStoreMarkers(false);
      setStoreCategoryFilter(null);
      setScoreData(null);
      setSelectedScoreCat(null);
    }
  }, [selectedDong]);

  // 행정동 선택 시 전체 업종 점수 fetch
  useEffect(() => {
    if (!selectedDong) return;
    fetch(`http://localhost:8000/api/score-all/?dong=${encodeURIComponent(selectedDong.dongName)}`)
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
    // 이전 동 폴리곤 초기화
    if (selectedGroupRef.current) {
      selectedGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
    }
    group.polygons.forEach((p) => p.setOptions(POLYGON_SELECTED));
    selectedGroupRef.current = group;

    map.setLevel(4, { animate: true });
    map.panTo(new window.kakao.maps.LatLng(group.centroid.lat, group.centroid.lng));

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
    setMenuOpen(false);
    setSearchExpanded(false);
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
      if (map.getLevel() < GU_MODE_LEVEL) map.setLevel(8, { animate: true });
      map.panTo(new window.kakao.maps.LatLng(centroid.lat, centroid.lng));
      const group = guPolygonGroupsRef.current.find((g) => g.guName === guName);
      if (group) {
        if (selectedGuGroupRef.current)
          selectedGuGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
        group.polygons.forEach((p) => p.setOptions(POLYGON_SELECTED));
        selectedGuGroupRef.current = group;
      }
      if (selectedGroupRef.current) {
        selectedGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
        selectedGroupRef.current = null;
      }
      setSelectedDong(null);
      setSelectedGu(guName);
    } else {
      // 행정동 모드로 줌인 후 선택
      if (map.getLevel() >= GU_MODE_LEVEL) map.setLevel(5, { animate: true });
      map.panTo(new window.kakao.maps.LatLng(centroid.lat, centroid.lng));
      const group = polygonGroupsRef.current.find((g) => g.dongName === dongName && g.guName === guName);
      if (group) {
        if (selectedGroupRef.current)
          selectedGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
        group.polygons.forEach((p) => p.setOptions(POLYGON_SELECTED));
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
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-popup]")) {
        setMenuOpen(false);
        setSearchExpanded(false);
        setQuarterPopupOpen(false);
        setGuQuarterPopupOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      {/* ── 왼쪽 사이드바 ── */}
      <div style={{
        ...leftSidebarStyle,
        ...(!selectedDong && !selectedGu && !selectedIndustry && {
          background: "transparent",
          borderRight: "none",
          backdropFilter: "none",
          boxShadow: "none",
        }),
      }}>

        {/* 검색창 */}
        <div data-popup style={{ position: "relative", padding: "16px 16px 10px", flexShrink: 0 }}>
          <div
            style={{ ...searchBoxStyle, width: "100%", boxSizing: "border-box", borderRadius: searchExpanded ? "12px 12px 0 0" : 12, borderBottom: searchExpanded ? "1px solid rgba(255,255,255,0.06)" : "none" }}
            onClick={() => setSearchExpanded(true)}
          >
            <span style={{ fontSize: 19, marginRight: 8, color: searchExpanded ? "#3B82F6" : "#777", transition: "color 0.15s" }}>🔍</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchExpanded(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchResults.length > 0) { handleSelectResult(searchResults[0]); setSearchExpanded(false); }
                if (e.key === "Escape") { setSearchQuery(""); setSearchResults([]); setSearchExpanded(false); }
              }}
              placeholder="지역명 · 업종 검색"
              style={{ border: "none", outline: "none", fontSize: 17, width: "100%", background: "transparent", color: "#E8E8E8" }}
            />
            {searchQuery && (
              <button
                onClick={(e) => { e.stopPropagation(); setSearchQuery(""); setSearchResults([]); }}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#777", fontSize: 18, padding: 0, flexShrink: 0 }}
              >✕</button>
            )}
          </div>

          {/* 확장 드롭다운 */}
          {searchExpanded && (
            <div data-popup style={{
              background: "#2A2A2A", borderRadius: "0 0 14px 14px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)", borderTop: "none",
              maxHeight: 420, overflowY: "auto",
            }}>
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
              <div style={{ padding: "12px 14px" }}>
                <p style={{ ...popupSectionLabel, marginBottom: 8, fontSize: 14 }}>업종 필터</p>
                <div style={chipGrid}>
                  {INDUSTRIES.map((item) => (
                    <button key={item} onClick={() => setSelectedIndustry(selectedIndustry === item ? null : item)} style={chipStyle(selectedIndustry === item)}>{item}</button>
                  ))}
                </div>
              </div>
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
                      }}
                      style={chipStyle(selectedRegion === item)}
                    >{item}</button>
                  ))}
                </div>
              </div>
              {selectedRegion && (
                <div data-popup style={{ background: "rgba(24,24,34,0.97)", borderTop: "1px solid rgba(59,130,246,0.25)", padding: "12px 14px 14px" }}>
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
        </div>

        {/* 선택된 업종 뱃지 */}
        {selectedIndustry && (
          <div style={{ padding: "0 16px 8px", flexShrink: 0 }}>
            <span style={badgeStyle}>
              {selectedIndustry}
              <button onClick={() => setSelectedIndustry(null)} style={badgeClose}>✕</button>
            </span>
          </div>
        )}

        {/* ── 스크롤 콘텐츠 영역 (선택된 항목 있을 때만 표시) ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", display: (selectedDong || selectedGu) ? "block" : "none" }}>

          {/* 행정동 상세 */}
          {selectedDong && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, color: "#9E9E9E", marginBottom: 2 }}>{selectedDong.guName}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#E8E8E8" }}>{selectedDong.dongName}</div>
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
                >✕</button>
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
                      <div data-popup style={quarterDropdownStyle}>
                        <div style={{ display: "flex", gap: 4, marginBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 8 }}>
                          {years.map((y) => (
                            <button key={y} data-popup onClick={() => { const first = availableQuarters.find((q) => Math.floor(q / 10) === y); setSelectedQuarter(first === availableQuarters[0] ? null : first); }} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: activeYear === y ? "#3B82F6" : "rgba(255,255,255,0.07)", color: activeYear === y ? "#fff" : "#9E9E9E" }}>{y}</button>
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
                  const top6Rev   = industries.slice(0, 6);
                  const top6Store = [...industries].sort((a, b) => b["점포수"] - a["점포수"]).slice(0, 6);
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
                      <div style={{ fontSize: 14, color: "#9E9E9E", marginBottom: 7 }}>업종별 매출 TOP 6</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                        {top6Rev.map((item) => (
                          <div key={item["통합카테고리"]}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                              <span style={{ fontSize: 14, color: "#C8C8C8" }}>{item["통합카테고리"]}</span>
                              <span style={{ fontSize: 14, color: "#9E9E9E" }}>{fmtRevenue(item["당월매출합"])}</span>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 3, height: 4, overflow: "hidden" }}>
                              <div style={{ width: `${(item["당월매출합"] / maxRevenue) * 100}%`, height: "100%", background: "linear-gradient(90deg, #3B82F6, #60A5FA)", borderRadius: 3 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 14, color: "#9E9E9E", marginBottom: 7 }}>업종별 상가 수 TOP 6</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                        {top6Store.map((item) => (
                          <div key={item["통합카테고리"]}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                              <span style={{ fontSize: 14, color: "#C8C8C8" }}>{item["통합카테고리"]}</span>
                              <span style={{ fontSize: 14, color: "#9E9E9E" }}>{item["점포수"]}개</span>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 3, height: 4, overflow: "hidden" }}>
                              <div style={{ width: `${(item["점포수"] / maxStores) * 100}%`, height: "100%", background: "linear-gradient(90deg, #10B981, #34D399)", borderRadius: 3 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setRankModalOpen(true)} style={viewAllBtnStyle}>전체 보기 ({industries.length}개 업종) →</button>
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={() => setShowStoreMarkers((v) => !v)}
                          style={{ width: "100%", padding: "9px 0", background: showStoreMarkers ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.05)", color: showStoreMarkers ? "#34D399" : "#9E9E9E", border: `1px solid ${showStoreMarkers ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                        >
                          {storeLoading ? "불러오는 중..." : showStoreMarkers ? "📍 상가 마커 표시 중 (클릭으로 숨기기)" : "📍 상가 마커 보기"}
                        </button>
                        {showStoreMarkers && (
                          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                            <button onClick={() => setStoreCategoryFilter(null)} style={storeFilterChipStyle(!storeCategoryFilter)}>전체</button>
                            {Object.keys(STORE_CATEGORY_COLORS).map((cat) => (
                              <button key={cat} onClick={() => setStoreCategoryFilter(storeCategoryFilter === cat ? null : cat)} style={{ ...storeFilterChipStyle(storeCategoryFilter === cat), borderColor: storeCategoryFilter === cat ? STORE_CATEGORY_COLORS[cat] : undefined, color: storeCategoryFilter === cat ? STORE_CATEGORY_COLORS[cat] : undefined }}>
                                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: STORE_CATEGORY_COLORS[cat], marginRight: 4, verticalAlign: "middle" }} />{cat}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => openAiModal({ region: selectedDong.guName, dong: selectedDong.dongName })}
                        style={{ width: "100%", marginTop: 8, padding: "9px 0", background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))", color: "#93B8EE", border: "1px solid rgba(139,92,246,0.4)", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em" }}
                      >✨ 이 지역에서 AI 추천 받기</button>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 구 상세 */}
          {selectedGu && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, color: "#9E9E9E", marginBottom: 2 }}>서울특별시</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#E8E8E8" }}>{selectedGu}</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedGu(null);
                    setGuRankModalOpen(false);
                    if (selectedGuGroupRef.current) {
                      selectedGuGroupRef.current.polygons.forEach((p) => p.setOptions(POLYGON_DEFAULT));
                      selectedGuGroupRef.current = null;
                    }
                  }}
                  style={closeBtnStyle}
                >✕</button>
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
                      <div data-popup style={quarterDropdownStyle}>
                        <div style={{ display: "flex", gap: 4, marginBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 8 }}>
                          {years.map((y) => (
                            <button key={y} data-popup onClick={() => { const first = guAvailableQuarters.find((q) => Math.floor(q / 10) === y); setGuSelectedQuarter(first === guAvailableQuarters[0] ? null : first); }} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: activeYear === y ? "#3B82F6" : "rgba(255,255,255,0.07)", color: activeYear === y ? "#fff" : "#9E9E9E" }}>{y}</button>
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
                  const top6Rev   = industries.slice(0, 6);
                  const top6Store = [...industries].sort((a, b) => b["점포수"] - a["점포수"]).slice(0, 6);
                  const maxRevenue = Math.max(...top6Rev.map((d) => d["당월매출합"]), 1);
                  const maxStores  = Math.max(...top6Store.map((d) => d["점포수"]), 1);
                  return (
                    <>
                      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                        <div style={statCardStyle}>
                          <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 4 }}>총 매출</div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: "#E8E8E8" }}>{fmtRevenue(guData.총매출)}</div>
                        </div>
                        <div style={statCardStyle}>
                          <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 4 }}>전체 순위</div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: "#93B8EE" }}>
                            {guData.순위}위<span style={{ fontSize: 13, color: "#9E9E9E", fontWeight: 400, marginLeft: 4 }}>/ {guData.전체구수}구</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, color: "#9E9E9E", marginBottom: 7 }}>업종별 매출 TOP 6</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                        {top6Rev.map((item) => (
                          <div key={item["통합카테고리"]}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                              <span style={{ fontSize: 14, color: "#C8C8C8" }}>{item["통합카테고리"]}</span>
                              <span style={{ fontSize: 14, color: "#9E9E9E" }}>{fmtRevenue(item["당월매출합"])}</span>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 3, height: 4, overflow: "hidden" }}>
                              <div style={{ width: `${(item["당월매출합"] / maxRevenue) * 100}%`, height: "100%", background: "linear-gradient(90deg, #3B82F6, #60A5FA)", borderRadius: 3 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 14, color: "#9E9E9E", marginBottom: 7 }}>업종별 상가 수 TOP 6</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                        {top6Store.map((item) => (
                          <div key={item["통합카테고리"]}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                              <span style={{ fontSize: 14, color: "#C8C8C8" }}>{item["통합카테고리"]}</span>
                              <span style={{ fontSize: 14, color: "#9E9E9E" }}>{item["점포수"]}개</span>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 3, height: 4, overflow: "hidden" }}>
                              <div style={{ width: `${(item["점포수"] / maxStores) * 100}%`, height: "100%", background: "linear-gradient(90deg, #10B981, #34D399)", borderRadius: 3 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setGuRankModalOpen(true)} style={viewAllBtnStyle}>전체 보기 ({industries.length}개 업종) →</button>
                    </>
                  );
                })()}
              </div>

              {/* 행정동 목록 */}
              {(() => {
                const dongs = guToDongsRef.current[selectedGu] || [];
                return dongs.length > 0 ? (
                  <div style={{ marginTop: 14, padding: "14px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: "#FBBF24", fontWeight: 700, background: "rgba(251,191,36,0.12)", borderRadius: 4, padding: "2px 7px" }}>구</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#E8E8E8" }}>{selectedGu} 행정동</span>
                      <span style={{ fontSize: 14, color: "#9E9E9E" }}>({dongs.length}개)</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {dongs.map((dong) => (
                        <button
                          key={dong}
                          onClick={() => handleSelectDongFromGu(dong)}
                          style={dongChipStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.25)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.7)"; e.currentTarget.style.color = "#93B8EE"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#C8C8C8"; }}
                        >{dong}</button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

        </div>

        {/* 하단 고정: 버튼 영역 (선택된 항목 있을 때만 표시) */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, display: (selectedDong || selectedGu) ? "flex" : "none", flexDirection: "column", gap: 8 }}>
          {selectedGu && (
            <button
              style={{ width: "100%", height: 42, background: "rgba(16,185,129,0.15)", color: "#34D399", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
              onClick={() => {
                const map = mapInstanceRef.current;
                if (!map) return;
                const group = guPolygonGroupsRef.current.find((g) => g.guName === selectedGu);
                if (group) {
                  map.setLevel(6, { animate: true });
                  map.panTo(new window.kakao.maps.LatLng(group.centroid.lat, group.centroid.lng));
                }
              }}
            >행정동 보기</button>
          )}
          <button
            style={{ width: "100%", height: 42, background: isGuMode ? "#3B82F6" : "rgba(255,255,255,0.07)", color: isGuMode ? "#fff" : "#E8E8E8", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => {
              const map = mapInstanceRef.current;
              if (!map) return;
              map.panTo(new window.kakao.maps.LatLng(37.5665, 126.9780));
              if (map.getLevel() < GU_MODE_LEVEL) map.setLevel(8, { animate: true });
            }}
          >구 보기</button>
        </div>
      </div>

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

      {/* ── 호버 툴팁 (사이드바 오른쪽 하단) ── */}
      {hoveredDong && (
        <div style={{ ...tooltipStyle, left: 340 }}>
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


      {/* ── 구 전체 보기 모달 ── */}
      {guRankModalOpen && guData && (() => {
        const industries = guData.industries || [];
        const maxRevenue = Math.max(...industries.map((d) => d["당월매출합"]), 1);
        const storesSorted = [...industries].sort((a, b) => b["점포수"] - a["점포수"]);
        const maxStores = Math.max(...storesSorted.map((d) => d["점포수"]), 1);
        return (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setGuRankModalOpen(false)}
          >
            <div
              style={{ background: "#2A2A2A", borderRadius: 16, padding: "24px", width: 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, color: "#9E9E9E", marginBottom: 2 }}>서울특별시</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#E8E8E8" }}>{selectedGu} 전체 업종 현황</div>
                </div>
                <button onClick={() => setGuRankModalOpen(false)} style={closeBtnStyle}>✕</button>
              </div>

              {guLoading ? (
                <p style={{ color: "#9E9E9E", fontSize: 15, textAlign: "center", padding: "24px 0" }}>불러오는 중...</p>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 10 }}>업종별 매출 (전체)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
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
                  <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 10 }}>업종별 상가 수 (전체)</div>
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
                  <div style={{ fontSize: 14, color: "#9E9E9E", marginBottom: 2 }}>{selectedDong?.guName}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#E8E8E8" }}>{selectedDong?.dongName} 전체 업종 현황</div>
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
                            fontSize: 14,
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
                              fontSize: 14,
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
                <p style={{ color: "#9E9E9E", fontSize: 15, textAlign: "center", padding: "24px 0" }}>불러오는 중...</p>
              ) : (
              <>
              <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 10 }}>업종별 매출 (전체)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
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

              <div style={{ fontSize: 13, color: "#9E9E9E", marginBottom: 10 }}>업종별 상가 수 (전체)</div>
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
                  <span style={{ fontSize: 22 }}>✨</span>
                  <span style={{ fontSize: 21, fontWeight: 700, color: "#E8E8E8" }}>AI 상권 추천</span>
                </div>
                <div style={{ fontSize: 14, color: "#9E9E9E", paddingLeft: 28 }}>
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
                      <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
                      <div style={{ textAlign: "left", flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#E8E8E8", marginBottom: 3 }}>{title}</div>
                        <div style={{ fontSize: 14, color: "#9E9E9E" }}>{desc}</div>
                      </div>
                      <span style={{ color: "#555", fontSize: 20, flexShrink: 0 }}>›</span>
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
                      {aiMode === "dong" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiIndustry}</span>{aiRegion && <> · {aiRegion}</>} 추천 상권</>}
                      {aiMode === "industry" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiDong}</span> 추천 업종</>}
                      {aiMode === "score" && <><span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiDong}</span> · <span style={{ color: "#93B8EE", fontWeight: 600 }}>{aiIndustry}</span> 적합도</>}
                    </span>
                    <button
                      onClick={() => { setAiStep("form"); setAiResults(null); }}
                      style={{ fontSize: 14, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
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
                              <div style={{ fontSize: 14, fontWeight: 600, color: "#E8E8E8" }}>{item.stores}개</div>
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
        </div>
      )}


      {/* ── 상단 오른쪽: AI 추천 + 메뉴 버튼 ── */}
      <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 10, zIndex: 10 }}>

        {/* AI 추천 버튼 */}
        <button onClick={openAiModal} style={aiBtnStyle}>
          ✨ AI 추천
        </button>

        {/* 메뉴 버튼 */}
        <div data-popup style={{ position: "relative" }}>
          <button onClick={() => { setMenuOpen((v) => !v); setSearchExpanded(false); }} style={btnStyle(menuOpen)}>
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

    </div>
  );
}

/* ── 상가 카테고리 색상 ── */
const STORE_CATEGORY_COLORS = {
  "한식":           "#FF6B6B",
  "중식":           "#FF8C00",
  "일식":           "#FFD700",
  "양식/기타외식":  "#C084FC",
  "분식/간식":      "#FB923C",
  "패스트푸드/치킨":"#F97316",
  "카페":           "#92400E",
  "주점":           "#7C3AED",
  "편의점":         "#16A34A",
  "식품 소매":      "#65A30D",
  "의료/약국":      "#DC2626",
  "미용실":         "#EC4899",
  "뷰티/화장품":    "#F472B6",
  "스포츠/레저":    "#0EA5E9",
  "스포츠 강습":    "#38BDF8",
  "일반학원":       "#3B82F6",
  "예술학원":       "#818CF8",
  "의류/패션":      "#A78BFA",
  "전자/통신":      "#06B6D4",
  "생활용품 소매":  "#84CC16",
  "수리/세탁":      "#94A3B8",
  "숙박":           "#F59E0B",
  "오락/유흥":      "#EF4444",
  "애완동물":       "#34D399",
  "B2B 서비스":     "#6B7280",
};

const storeFilterChipStyle = (active) => ({
  padding: "3px 8px",
  borderRadius: 12,
  border: active ? "1px solid #9E9E9E" : "1px solid rgba(255,255,255,0.1)",
  background: active ? "rgba(255,255,255,0.12)" : "transparent",
  color: active ? "#E8E8E8" : "#9E9E9E",
  fontSize: 12,
  fontWeight: active ? 600 : 400,
  cursor: "pointer",
  whiteSpace: "nowrap",
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
  background: "rgba(28,28,28,0.96)",
  borderRadius: 12,
  padding: "12px 16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  backdropFilter: "blur(8px)",
  zIndex: 10,
  fontSize: 16,
  pointerEvents: "none",
  minWidth: 180,
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
  transition: "all 0.12s",
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
  transition: "all 0.15s",
};

const quarterDropdownStyle = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  zIndex: 50,
  background: "#1E1E2E",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "12px 14px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  minWidth: 200,
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

const viewAllBtnStyle = {
  width: "100%",
  padding: "9px 0",
  background: "rgba(59,130,246,0.15)",
  color: "#93B8EE",
  border: "1px solid rgba(59,130,246,0.3)",
  borderRadius: 8,
  fontSize: 15,
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
  fontSize: 16,
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
