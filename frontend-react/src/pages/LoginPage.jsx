import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ userId: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwVisible, setPwVisible] = useState(false);
  const [mapZooming, setMapZooming] = useState(false);

  const goSignup = (e) => {
    e.preventDefault();
    setMapZooming(true);
    setTimeout(() => navigate("/signup"), 820);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.userId || !form.password) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/accounts/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.userId, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "로그인에 실패했습니다.");
        return;
      }
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/map");
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* ── 배경 SVG 지도 ── */}
      <svg
        style={styles.mapBg}
        className={mapZooming ? "lp-map-zooming" : ""}
        viewBox="0 0 1400 900"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="lp-mg" cx="48%" cy="44%" r="52%">
            <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#EFF6FF" stopOpacity="0" />
          </radialGradient>
          <filter id="lp-fs1" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#0EA5E9" floodOpacity="0.5" />
          </filter>
          <filter id="lp-fs2" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#10B981" floodOpacity="0.5" />
          </filter>
          <filter id="lp-fs3" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#F59E0B" floodOpacity="0.5" />
          </filter>
          <filter id="lp-fs4" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#8B5CF6" floodOpacity="0.5" />
          </filter>
          <filter id="lp-fs5" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#EF4444" floodOpacity="0.45" />
          </filter>
          <filter id="lp-lf" x="-15%" y="-50%" width="130%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#0EA5E9" floodOpacity="0.15" />
          </filter>
          <g id="lp-pin-blue">
            <path d="M12,0 C5.4,0 0,5.4 0,12 C0,21 12,36 12,36 C12,36 24,21 24,12 C24,5.4 18.6,0 12,0 Z" fill="#0EA5E9" />
            <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.95" />
          </g>
          <g id="lp-pin-green">
            <path d="M12,0 C5.4,0 0,5.4 0,12 C0,21 12,36 12,36 C12,36 24,21 24,12 C24,5.4 18.6,0 12,0 Z" fill="#10B981" />
            <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.95" />
          </g>
          <g id="lp-pin-amber">
            <path d="M12,0 C5.4,0 0,5.4 0,12 C0,21 12,36 12,36 C12,36 24,21 24,12 C24,5.4 18.6,0 12,0 Z" fill="#F59E0B" />
            <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.95" />
          </g>
          <g id="lp-pin-violet">
            <path d="M12,0 C5.4,0 0,5.4 0,12 C0,21 12,36 12,36 C12,36 24,21 24,12 C24,5.4 18.6,0 12,0 Z" fill="#8B5CF6" />
            <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.95" />
          </g>
          <g id="lp-pin-red">
            <path d="M12,0 C5.4,0 0,5.4 0,12 C0,21 12,36 12,36 C12,36 24,21 24,12 C24,5.4 18.6,0 12,0 Z" fill="#EF4444" />
            <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.95" />
          </g>
        </defs>

        {/* 배경 */}
        <rect width="1400" height="900" fill="#EFF6FF" />
        <rect width="1400" height="900" fill="url(#lp-mg)" />

        {/* 격자 도로 */}
        <g stroke="#DBEAFE" strokeWidth="1">
          <line x1="90"  y1="0"   x2="88"  y2="900" />
          <line x1="215" y1="0"   x2="218" y2="900" />
          <line x1="340" y1="0"   x2="337" y2="900" />
          <line x1="465" y1="0"   x2="468" y2="900" />
          <line x1="590" y1="0"   x2="587" y2="900" />
          <line x1="715" y1="0"   x2="718" y2="900" />
          <line x1="840" y1="0"   x2="837" y2="900" />
          <line x1="960" y1="0"   x2="963" y2="900" />
          <line x1="0" y1="90"    x2="1000" y2="92"  />
          <line x1="0" y1="210"   x2="1000" y2="208" />
          <line x1="0" y1="330"   x2="1000" y2="334" />
          <line x1="0" y1="450"   x2="1000" y2="447" />
          <line x1="0" y1="570"   x2="1000" y2="574" />
          <line x1="0" y1="690"   x2="1000" y2="687" />
          <line x1="0" y1="810"   x2="1000" y2="812" />
        </g>

        {/* 주요 도로 */}
        <g stroke="#BFDBFE" strokeWidth="2.2" fill="none">
          <path d="M0,335 Q290,316 590,340 T990,326" />
          <path d="M0,572 Q215,552 510,578 T990,564" />
          <path d="M148,0 Q162,315 144,622 T130,900" />
          <path d="M500,0 Q484,262 508,532 T492,900" />
          <path d="M770,0 Q786,292 764,596 T780,900" />
          <path d="M0,200 Q320,184 640,205 T990,196" />
          <path d="M0,740 Q280,724 560,748 T990,736" />
        </g>

        {/* 강조 도로 */}
        <g stroke="#93C5FD" strokeWidth="2.8" fill="none" opacity="0.9">
          <path d="M0,448 Q415,428 765,452 T990,440" />
          <path d="M336,0 Q344,460 338,900" />
        </g>

        {/* 건물 블록 */}
        <g>
          <rect x="98"  y="98"  width="108" height="54"  rx="3" fill="#DBEAFE" opacity="0.7" />
          <rect x="98"  y="162" width="65"  height="38"  rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="172" y="162" width="36"  height="38"  rx="3" fill="#DBEAFE" opacity="0.5" />
          <rect x="226" y="98"  width="54"  height="35"  rx="3" fill="#BFDBFE" opacity="0.6" />
          <rect x="226" y="142" width="100" height="58"  rx="3" fill="#DBEAFE" opacity="0.55" />
          <rect x="98"  y="218" width="80"  height="100" rx="3" fill="#DBEAFE" opacity="0.65" />
          <rect x="188" y="218" width="46"  height="45"  rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="188" y="272" width="46"  height="46"  rx="3" fill="#DBEAFE" opacity="0.45" />
          <rect x="244" y="218" width="82"  height="100" rx="3" fill="#BFDBFE" opacity="0.55" />
          <rect x="98"  y="458" width="90"  height="100" rx="3" fill="#DBEAFE" opacity="0.6" />
          <rect x="98"  y="568" width="55"  height="112" rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="162" y="568" width="68"  height="50"  rx="3" fill="#DBEAFE" opacity="0.55" />
          <rect x="162" y="628" width="68"  height="52"  rx="3" fill="#BFDBFE" opacity="0.45" />
          <rect x="240" y="458" width="86"  height="55"  rx="3" fill="#DBEAFE" opacity="0.5" />
          <rect x="240" y="522" width="86"  height="50"  rx="3" fill="#BFDBFE" opacity="0.45" />
          <rect x="350" y="98"  width="104" height="58"  rx="3" fill="#DBEAFE" opacity="0.65" />
          <rect x="350" y="165" width="48"  height="35"  rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="406" y="165" width="48"  height="35"  rx="3" fill="#DBEAFE" opacity="0.55" />
          <rect x="476" y="98"  width="102" height="102" rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="350" y="220" width="55"  height="100" rx="3" fill="#DBEAFE" opacity="0.55" />
          <rect x="414" y="220" width="55"  height="45"  rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="414" y="274" width="55"  height="46"  rx="3" fill="#DBEAFE" opacity="0.45" />
          <rect x="476" y="220" width="100" height="100" rx="3" fill="#BFDBFE" opacity="0.55" />
          <rect x="350" y="580" width="100" height="80"  rx="3" fill="#DBEAFE" opacity="0.6" />
          <rect x="350" y="670" width="46"  height="108" rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="404" y="670" width="46"  height="108" rx="3" fill="#DBEAFE" opacity="0.45" />
          <rect x="476" y="580" width="96"  height="55"  rx="3" fill="#BFDBFE" opacity="0.55" />
          <rect x="476" y="644" width="96"  height="80"  rx="3" fill="#DBEAFE" opacity="0.5" />
          <rect x="600" y="98"  width="108" height="55"  rx="3" fill="#DBEAFE" opacity="0.6" />
          <rect x="600" y="162" width="50"  height="38"  rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="659" y="162" width="49"  height="38"  rx="3" fill="#DBEAFE" opacity="0.5" />
          <rect x="720" y="98"  width="90"  height="102" rx="3" fill="#BFDBFE" opacity="0.55" />
          <rect x="822" y="98"  width="60"  height="50"  rx="3" fill="#DBEAFE" opacity="0.6" />
          <rect x="822" y="157" width="60"  height="43"  rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="600" y="220" width="55"  height="100" rx="3" fill="#DBEAFE" opacity="0.55" />
          <rect x="664" y="220" width="45"  height="100" rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="720" y="220" width="90"  height="45"  rx="3" fill="#DBEAFE" opacity="0.6" />
          <rect x="720" y="274" width="90"  height="46"  rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="822" y="220" width="60"  height="55"  rx="3" fill="#DBEAFE" opacity="0.55" />
          <rect x="822" y="284" width="60"  height="36"  rx="3" fill="#BFDBFE" opacity="0.45" />
          <rect x="600" y="580" width="55"  height="108" rx="3" fill="#DBEAFE" opacity="0.6" />
          <rect x="664" y="580" width="45"  height="55"  rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="664" y="644" width="45"  height="44"  rx="3" fill="#DBEAFE" opacity="0.5" />
          <rect x="720" y="580" width="90"  height="108" rx="3" fill="#BFDBFE" opacity="0.55" />
          <rect x="822" y="580" width="60"  height="50"  rx="3" fill="#DBEAFE" opacity="0.5" />
          <rect x="822" y="640" width="60"  height="48"  rx="3" fill="#BFDBFE" opacity="0.45" />
        </g>

        {/* 연결 점선 */}
        <g strokeDasharray="6 5" strokeWidth="1.4" fill="none">
          <line x1="480" y1="380" x2="720" y2="185" stroke="#93C5FD" opacity="0.55" />
          <line x1="480" y1="380" x2="615" y2="715" stroke="#93C5FD" opacity="0.45" />
          <line x1="480" y1="380" x2="200" y2="580" stroke="#A78BFA" opacity="0.42" />
          <line x1="480" y1="380" x2="870" y2="600" stroke="#FCA5A5" opacity="0.42" />
        </g>

        {/* ① 파랑 — AI 추천 상권 */}
        <circle cx="480" cy="356" r="14" fill="#0EA5E9" opacity="0">
          <animate attributeName="r"       values="14;50" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.20;0" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="480" cy="356" r="14" fill="none" stroke="#0EA5E9" strokeWidth="1.2" opacity="0">
          <animate attributeName="r"       values="14;62" dur="2.2s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.28;0" dur="2.2s" begin="0.8s" repeatCount="indefinite" />
        </circle>
        <g filter="url(#lp-fs1)"><use href="#lp-pin-blue"   x="468" y="344" /></g>
        <g className="lp-al2" filter="url(#lp-lf)">
          <rect x="506" y="339" width="152" height="34" rx="17" fill="#0EA5E9" />
          <text x="582" y="361" textAnchor="middle" fill="#fff" fontSize="13.5" fontFamily="'Noto Sans KR',sans-serif" fontWeight="700">★ AI 추천 상권</text>
        </g>

        {/* ② 초록 — 유동인구 높음 */}
        <circle cx="720" cy="161" r="13" fill="#10B981" opacity="0">
          <animate attributeName="r"       values="13;46" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.20;0" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="720" cy="161" r="13" fill="none" stroke="#10B981" strokeWidth="1.2" opacity="0">
          <animate attributeName="r"       values="13;56" dur="2.5s" begin="0.7s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.26;0" dur="2.5s" begin="0.7s" repeatCount="indefinite" />
        </circle>
        <g filter="url(#lp-fs2)"><use href="#lp-pin-green"  x="708" y="149" /></g>
        <g className="lp-al1" filter="url(#lp-lf)">
          <rect x="558" y="144" width="148" height="34" rx="17" fill="#10B981" />
          <text x="632" y="166" textAnchor="middle" fill="#fff" fontSize="13.5" fontFamily="'Noto Sans KR',sans-serif" fontWeight="600">유동인구 높음</text>
        </g>

        {/* ③ 앰버 — 경쟁 낮음 */}
        <circle cx="615" cy="691" r="13" fill="#F59E0B" opacity="0">
          <animate attributeName="r"       values="13;48" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.20;0" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="615" cy="691" r="13" fill="none" stroke="#F59E0B" strokeWidth="1.2" opacity="0">
          <animate attributeName="r"       values="13;58" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.26;0" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
        </circle>
        <g filter="url(#lp-fs3)"><use href="#lp-pin-amber"  x="603" y="679" /></g>
        <g className="lp-al3" filter="url(#lp-lf)">
          <rect x="456" y="674" width="130" height="34" rx="17" fill="#F59E0B" />
          <text x="521" y="696" textAnchor="middle" fill="#fff" fontSize="13.5" fontFamily="'Noto Sans KR',sans-serif" fontWeight="700">경쟁 낮음</text>
        </g>

        {/* ④ 바이올렛 — 인기 업종 */}
        <circle cx="200" cy="556" r="12" fill="#8B5CF6" opacity="0">
          <animate attributeName="r"       values="12;44" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.20;0" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="556" r="12" fill="none" stroke="#8B5CF6" strokeWidth="1.2" opacity="0">
          <animate attributeName="r"       values="12;52" dur="2.4s" begin="0.65s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.24;0" dur="2.4s" begin="0.65s" repeatCount="indefinite" />
        </circle>
        <g filter="url(#lp-fs4)"><use href="#lp-pin-violet" x="188" y="544" /></g>
        <g className="lp-al4" filter="url(#lp-lf)">
          <rect x="228" y="539" width="116" height="34" rx="17" fill="#8B5CF6" />
          <text x="286" y="561" textAnchor="middle" fill="#fff" fontSize="13.5" fontFamily="'Noto Sans KR',sans-serif" fontWeight="600">인기 업종</text>
        </g>

        {/* ⑤ 레드 — 매출액 높음 */}
        <circle cx="870" cy="576" r="12" fill="#EF4444" opacity="0">
          <animate attributeName="r"       values="12;44" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.20;0" dur="2.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="870" cy="576" r="12" fill="none" stroke="#EF4444" strokeWidth="1.2" opacity="0">
          <animate attributeName="r"       values="12;52" dur="2.6s" begin="0.7s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.24;0" dur="2.6s" begin="0.7s" repeatCount="indefinite" />
        </circle>
        <g filter="url(#lp-fs5)"><use href="#lp-pin-red"    x="858" y="564" /></g>
        <g className="lp-al5" filter="url(#lp-lf)">
          <rect x="726" y="559" width="120" height="34" rx="17" fill="#EF4444" />
          <text x="786" y="581" textAnchor="middle" fill="#fff" fontSize="13.5" fontFamily="'Noto Sans KR',sans-serif" fontWeight="600">매출액 높음</text>
        </g>

        {/* 워터마크 */}
        <text x="24" y="882" fill="#BFDBFE" fontSize="11.5" fontFamily="'Noto Sans KR',sans-serif">
          nodaji — AI 상권분석 플랫폼
        </text>
      </svg>

      {/* 지도 영역 (빈 공간) */}
      <div style={styles.mapArea} />

      {/* ── 우측 로그인 패널 ── */}
      <div style={styles.loginPanel} className={mapZooming ? "lp-panel-hiding" : ""}>
        {/* 로고 */}
        <div style={styles.loginLogo}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 197.20 56.00"
            width="160"
            height="46"
            overflow="visible"
          >
            <text
              x="0" y="43.00"
              fontFamily="Arial Black, Helvetica Neue, Arial, sans-serif"
              fontWeight="900"
              fontSize="40"
              letterSpacing="2.40"
              fill="#cde0f0"
            >
              NODAJI
            </text>
            <g transform="translate(183.20,3.00) rotate(35)">
              <circle cx="0" cy="0" r="10.0" fill="none" stroke="#8ab0cc" strokeWidth="0.80" opacity="0.80" />
              <line x1="0"     y1="-8.80" x2="0"     y2="-5.50" stroke="#8ab0cc" strokeWidth="1.00" opacity="0.65" />
              <line x1="0"     y1="8.80"  x2="0"     y2="5.50"  stroke="#8ab0cc" strokeWidth="1.00" opacity="0.65" />
              <line x1="-8.80" y1="0"     x2="-5.50" y2="0"     stroke="#8ab0cc" strokeWidth="1.00" opacity="0.65" />
              <line x1="8.80"  y1="0"     x2="5.50"  y2="0"     stroke="#8ab0cc" strokeWidth="1.00" opacity="0.65" />
              <polygon points="0,-8.20  1.50,0  0,1.60  -1.50,0" fill="#d94e30" />
              <polygon points="0,8.20   1.50,0  0,-1.60 -1.50,0" fill="#b8d0e8" opacity="0.85" />
              <circle cx="0" cy="0" r="1.20" fill="#1a2440" />
              <circle cx="0" cy="0" r="0.50" fill="#8ab0cc" />
            </g>
          </svg>
        </div>

        <h2 style={styles.loginTitle}>로그인</h2>
        <p style={styles.loginSubtitle}>상권분석 AI 서비스에 오신 것을 환영합니다</p>

        <form onSubmit={handleSubmit}>
          {/* 아이디 */}
          <label style={styles.fieldLabel} htmlFor="lp-username">아이디</label>
          <div style={styles.fieldWrap}>
            <input
              id="lp-username"
              type="text"
              name="userId"
              value={form.userId}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
              autoComplete="username"
              className="lp-input"
            />
          </div>

          {/* 비밀번호 */}
          <label style={styles.fieldLabel} htmlFor="lp-password">비밀번호</label>
          <div style={styles.fieldWrap}>
            <input
              id="lp-password"
              type={pwVisible ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              className="lp-input"
            />
            <button
              type="button"
              className="lp-eye-btn"
              onClick={() => setPwVisible((v) => !v)}
              aria-label="비밀번호 표시"
            >
              {pwVisible ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p style={styles.errorText}>{error}</p>
          )}

          <button type="submit" className="lp-btn-login" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 구분선 */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>또는</span>
          <div style={styles.dividerLine} />
        </div>

        {/* 카카오 로그인 */}
        <button
          className="lp-btn-kakao"
          onClick={async () => {
            const res = await fetch("http://localhost:8000/api/accounts/kakao/login/");
            const { url } = await res.json();
            window.location.href = url;
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.784 1.73 5.222 4.35 6.617L5.3 21l4.65-2.8c.67.1 1.35.15 2.05.15 5.523 0 10-3.477 10-7.8C22 6.477 17.523 3 12 3z" fill="#191919" />
          </svg>
          카카오로 시작하기
        </button>

        {/* 하단 링크 */}
        <div style={styles.loginFooter}>
          <p style={styles.footerText}>
            계정이 없으신가요?{" "}
            <a href="/signup" className="lp-footer-link" onClick={goSignup}>회원가입</a>
          </p>
          <button className="lp-back-link" onClick={() => navigate("/map")}>
            ← 지도로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 인라인 스타일 ── */
const styles = {
  page: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "stretch",
    fontFamily: "'Noto Sans KR', 'Pretendard', sans-serif",
    background: "#EFF6FF",
    overflow: "hidden",
  },
  mapBg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  mapArea: {
    position: "relative",
    zIndex: 2,
    flex: 1,
  },
  loginPanel: {
    position: "relative",
    zIndex: 2,
    flex: "0 0 420px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "48px 42px",
    background: "#ffffff",
    borderLeft: "1.5px solid #E0F2FE",
    boxShadow: "-8px 0 48px rgba(14,165,233,0.10)",
    overflowY: "auto",
  },
  loginLogo: {
    display: "flex",
    alignItems: "center",
    marginBottom: 30,
  },
  loginTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#0C1A2E",
    letterSpacing: "-0.5px",
    marginBottom: 5,
    marginTop: 0,
  },
  loginSubtitle: {
    fontSize: 13.5,
    color: "#64748B",
    marginBottom: 30,
    marginTop: 0,
  },
  fieldLabel: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#0369A1",
    marginBottom: 7,
  },
  fieldWrap: {
    position: "relative",
    marginBottom: 16,
  },
  errorText: {
    margin: "0 0 8px",
    fontSize: 13,
    color: "#EF4444",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "20px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#E2E8F0",
  },
  dividerText: {
    fontSize: 12,
    color: "#94A3B8",
    whiteSpace: "nowrap",
  },
  loginFooter: {
    marginTop: 26,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 11,
  },
  footerText: {
    fontSize: 13.5,
    color: "#64748B",
    margin: 0,
  },
};
