import { useEffect, useRef, useState } from "react";

export default function App() {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      
      {/* 지도 영역 */}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {/* 상단 제목 오버레이 */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.9)",
          padding: "12px 24px",
          borderRadius: "40px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
          backdropFilter: "blur(5px)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: "600",
          }}
        >
          상권분석 AI 웹사이트
        </h1>
      </div>
    </div>
  );
}
