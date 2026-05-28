import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import "../pages/LoginPage.css";
import "./SignupPage.css";

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    userId: "", password: "", passwordConfirm: "",
    name: "", phone: "", email: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fading, setFading] = useState(false);
  const [expanding, setExpanding] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.passwordConfirm) { setError("비밀번호가 일치하지 않습니다."); return; }
    if (form.password.length < 8) { setError("비밀번호는 8자 이상이어야 합니다."); return; }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/accounts/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.userId,
          password: form.password,
          nickname: form.name,
          email: form.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "회원가입에 실패했습니다."); return; }

      // 가입 직후 자동 로그인 → 토큰 저장
      const loginRes = await fetch("http://localhost:8000/api/accounts/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.userId, password: form.password }),
      });
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        localStorage.setItem("access", loginData.access);
        localStorage.setItem("refresh", loginData.refresh);
        localStorage.setItem("user", JSON.stringify(loginData.user));
      }

      setStep(3);
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  // step 3: 폭죽 + 페이드 + 지도 이동
  useEffect(() => {
    if (step !== 3) return;

    // 폭죽 — 양쪽에서 연달아 발사
    const fire = (opts) => confetti({ particleCount: 80, spread: 70, startVelocity: 45, ...opts });
    fire({ origin: { x: 0.2, y: 0.6 }, angle: 60 });
    const t0 = setTimeout(() => fire({ origin: { x: 0.8, y: 0.6 }, angle: 120 }), 200);
    const t1 = setTimeout(() => fire({ origin: { x: 0.5, y: 0.5 }, angle: 90, particleCount: 60 }), 450);

    const t2 = setTimeout(() => setFading(true), 2500);
    const t3 = setTimeout(() => setExpanding(true), 3000);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [step]);

  return (
    <div style={styles.page}>
      {/* ── 배경 SVG 지도 ── */}
      <svg style={styles.mapBg} viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="sp-mg" cx="48%" cy="44%" r="52%">
            <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#EFF6FF" stopOpacity="0" />
          </radialGradient>
          <filter id="sp-fs1" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#0EA5E9" floodOpacity="0.5" /></filter>
          <filter id="sp-fs2" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#10B981" floodOpacity="0.5" /></filter>
          <filter id="sp-fs3" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#F59E0B" floodOpacity="0.5" /></filter>
          <filter id="sp-fs4" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#8B5CF6" floodOpacity="0.5" /></filter>
          <filter id="sp-fs5" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#EF4444" floodOpacity="0.45" /></filter>
          <filter id="sp-lf"  x="-15%" y="-50%" width="130%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#0EA5E9" floodOpacity="0.15" /></filter>
          <g id="sp-pin-blue">
            <path d="M12,0 C5.4,0 0,5.4 0,12 C0,21 12,36 12,36 C12,36 24,21 24,12 C24,5.4 18.6,0 12,0 Z" fill="#0EA5E9" />
            <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.95" />
          </g>
          <g id="sp-pin-green">
            <path d="M12,0 C5.4,0 0,5.4 0,12 C0,21 12,36 12,36 C12,36 24,21 24,12 C24,5.4 18.6,0 12,0 Z" fill="#10B981" />
            <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.95" />
          </g>
          <g id="sp-pin-amber">
            <path d="M12,0 C5.4,0 0,5.4 0,12 C0,21 12,36 12,36 C12,36 24,21 24,12 C24,5.4 18.6,0 12,0 Z" fill="#F59E0B" />
            <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.95" />
          </g>
          <g id="sp-pin-violet">
            <path d="M12,0 C5.4,0 0,5.4 0,12 C0,21 12,36 12,36 C12,36 24,21 24,12 C24,5.4 18.6,0 12,0 Z" fill="#8B5CF6" />
            <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.95" />
          </g>
          <g id="sp-pin-red">
            <path d="M12,0 C5.4,0 0,5.4 0,12 C0,21 12,36 12,36 C12,36 24,21 24,12 C24,5.4 18.6,0 12,0 Z" fill="#EF4444" />
            <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.95" />
          </g>
        </defs>

        <rect width="1400" height="900" fill="#EFF6FF" />
        <rect width="1400" height="900" fill="url(#sp-mg)" />

        <g stroke="#DBEAFE" strokeWidth="1">
          <line x1="90"  y1="0" x2="88"  y2="900" /><line x1="215" y1="0" x2="218" y2="900" />
          <line x1="340" y1="0" x2="337" y2="900" /><line x1="465" y1="0" x2="468" y2="900" />
          <line x1="590" y1="0" x2="587" y2="900" /><line x1="715" y1="0" x2="718" y2="900" />
          <line x1="840" y1="0" x2="837" y2="900" /><line x1="960" y1="0" x2="963" y2="900" />
          <line x1="0" y1="90"  x2="1000" y2="92"  /><line x1="0" y1="210" x2="1000" y2="208" />
          <line x1="0" y1="330" x2="1000" y2="334" /><line x1="0" y1="450" x2="1000" y2="447" />
          <line x1="0" y1="570" x2="1000" y2="574" /><line x1="0" y1="690" x2="1000" y2="687" />
          <line x1="0" y1="810" x2="1000" y2="812" />
        </g>
        <g stroke="#BFDBFE" strokeWidth="2.2" fill="none">
          <path d="M0,335 Q290,316 590,340 T990,326" /><path d="M0,572 Q215,552 510,578 T990,564" />
          <path d="M148,0 Q162,315 144,622 T130,900" /><path d="M500,0 Q484,262 508,532 T492,900" />
          <path d="M770,0 Q786,292 764,596 T780,900" /><path d="M0,200 Q320,184 640,205 T990,196" />
          <path d="M0,740 Q280,724 560,748 T990,736" />
        </g>
        <g stroke="#93C5FD" strokeWidth="2.8" fill="none" opacity="0.9">
          <path d="M0,448 Q415,428 765,452 T990,440" /><path d="M336,0 Q344,460 338,900" />
        </g>
        <g>
          <rect x="98"  y="98"  width="108" height="54"  rx="3" fill="#DBEAFE" opacity="0.7" />
          <rect x="98"  y="162" width="65"  height="38"  rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="172" y="162" width="36"  height="38"  rx="3" fill="#DBEAFE" opacity="0.5" />
          <rect x="226" y="98"  width="54"  height="35"  rx="3" fill="#BFDBFE" opacity="0.6" />
          <rect x="226" y="142" width="100" height="58"  rx="3" fill="#DBEAFE" opacity="0.55" />
          <rect x="98"  y="218" width="80"  height="100" rx="3" fill="#DBEAFE" opacity="0.65" />
          <rect x="188" y="218" width="46"  height="45"  rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="244" y="218" width="82"  height="100" rx="3" fill="#BFDBFE" opacity="0.55" />
          <rect x="98"  y="458" width="90"  height="100" rx="3" fill="#DBEAFE" opacity="0.6" />
          <rect x="98"  y="568" width="55"  height="112" rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="162" y="568" width="68"  height="100" rx="3" fill="#DBEAFE" opacity="0.55" />
          <rect x="240" y="458" width="86"  height="55"  rx="3" fill="#DBEAFE" opacity="0.5" />
          <rect x="350" y="98"  width="104" height="58"  rx="3" fill="#DBEAFE" opacity="0.65" />
          <rect x="476" y="98"  width="102" height="102" rx="3" fill="#BFDBFE" opacity="0.5" />
          <rect x="350" y="220" width="55"  height="100" rx="3" fill="#DBEAFE" opacity="0.55" />
          <rect x="476" y="220" width="100" height="100" rx="3" fill="#BFDBFE" opacity="0.55" />
          <rect x="350" y="580" width="100" height="80"  rx="3" fill="#DBEAFE" opacity="0.6" />
          <rect x="476" y="580" width="96"  height="55"  rx="3" fill="#BFDBFE" opacity="0.55" />
          <rect x="600" y="98"  width="108" height="55"  rx="3" fill="#DBEAFE" opacity="0.6" />
          <rect x="720" y="98"  width="90"  height="102" rx="3" fill="#BFDBFE" opacity="0.55" />
          <rect x="822" y="98"  width="60"  height="93"  rx="3" fill="#DBEAFE" opacity="0.6" />
          <rect x="600" y="220" width="55"  height="100" rx="3" fill="#DBEAFE" opacity="0.55" />
          <rect x="720" y="220" width="90"  height="91"  rx="3" fill="#DBEAFE" opacity="0.6" />
          <rect x="600" y="580" width="55"  height="108" rx="3" fill="#DBEAFE" opacity="0.6" />
          <rect x="720" y="580" width="90"  height="108" rx="3" fill="#BFDBFE" opacity="0.55" />
          <rect x="822" y="580" width="60"  height="98"  rx="3" fill="#DBEAFE" opacity="0.5" />
        </g>
        <g strokeDasharray="6 5" strokeWidth="1.4" fill="none">
          <line x1="480" y1="380" x2="720" y2="185" stroke="#93C5FD" opacity="0.55" />
          <line x1="480" y1="380" x2="615" y2="715" stroke="#93C5FD" opacity="0.45" />
          <line x1="480" y1="380" x2="200" y2="580" stroke="#A78BFA" opacity="0.42" />
          <line x1="480" y1="380" x2="870" y2="600" stroke="#FCA5A5" opacity="0.42" />
        </g>

        {/* ① 파랑 */}
        <circle cx="480" cy="356" r="14" fill="#0EA5E9" opacity="0">
          <animate attributeName="r" values="14;50" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.20;0" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="480" cy="356" r="14" fill="none" stroke="#0EA5E9" strokeWidth="1.2" opacity="0">
          <animate attributeName="r" values="14;62" dur="2.2s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.28;0" dur="2.2s" begin="0.8s" repeatCount="indefinite" />
        </circle>
        <g filter="url(#sp-fs1)"><use href="#sp-pin-blue" x="468" y="344" /></g>
        <g className="lp-al2" filter="url(#sp-lf)">
          <rect x="506" y="339" width="136" height="34" rx="17" fill="#0EA5E9" />
          <text x="574" y="361" textAnchor="middle" fill="#fff" fontSize="13.5" fontFamily="'Noto Sans KR',sans-serif" fontWeight="700">★ 창업 기회</text>
        </g>

        {/* ② 초록 */}
        <circle cx="720" cy="161" r="13" fill="#10B981" opacity="0">
          <animate attributeName="r" values="13;46" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.20;0" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="720" cy="161" r="13" fill="none" stroke="#10B981" strokeWidth="1.2" opacity="0">
          <animate attributeName="r" values="13;56" dur="2.5s" begin="0.7s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.26;0" dur="2.5s" begin="0.7s" repeatCount="indefinite" />
        </circle>
        <g filter="url(#sp-fs2)"><use href="#sp-pin-green" x="708" y="149" /></g>
        <g className="lp-al1" filter="url(#sp-lf)">
          <rect x="556" y="144" width="148" height="34" rx="17" fill="#10B981" />
          <text x="630" y="166" textAnchor="middle" fill="#fff" fontSize="13.5" fontFamily="'Noto Sans KR',sans-serif" fontWeight="600">성장 가능성 높음</text>
        </g>

        {/* ③ 앰버 */}
        <circle cx="615" cy="691" r="13" fill="#F59E0B" opacity="0">
          <animate attributeName="r" values="13;48" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.20;0" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="615" cy="691" r="13" fill="none" stroke="#F59E0B" strokeWidth="1.2" opacity="0">
          <animate attributeName="r" values="13;58" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.26;0" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
        </circle>
        <g filter="url(#sp-fs3)"><use href="#sp-pin-amber" x="603" y="679" /></g>
        <g className="lp-al3" filter="url(#sp-lf)">
          <rect x="456" y="674" width="130" height="34" rx="17" fill="#F59E0B" />
          <text x="521" y="696" textAnchor="middle" fill="#fff" fontSize="13.5" fontFamily="'Noto Sans KR',sans-serif" fontWeight="700">경쟁 낮음</text>
        </g>

        {/* ④ 바이올렛 */}
        <circle cx="200" cy="556" r="12" fill="#8B5CF6" opacity="0">
          <animate attributeName="r" values="12;44" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.20;0" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="556" r="12" fill="none" stroke="#8B5CF6" strokeWidth="1.2" opacity="0">
          <animate attributeName="r" values="12;52" dur="2.4s" begin="0.65s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.24;0" dur="2.4s" begin="0.65s" repeatCount="indefinite" />
        </circle>
        <g filter="url(#sp-fs4)"><use href="#sp-pin-violet" x="188" y="544" /></g>
        <g className="lp-al4" filter="url(#sp-lf)">
          <rect x="228" y="539" width="116" height="34" rx="17" fill="#8B5CF6" />
          <text x="286" y="561" textAnchor="middle" fill="#fff" fontSize="13.5" fontFamily="'Noto Sans KR',sans-serif" fontWeight="600">인기 업종</text>
        </g>

        {/* ⑤ 레드 */}
        <circle cx="870" cy="576" r="12" fill="#EF4444" opacity="0">
          <animate attributeName="r" values="12;44" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.20;0" dur="2.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="870" cy="576" r="12" fill="none" stroke="#EF4444" strokeWidth="1.2" opacity="0">
          <animate attributeName="r" values="12;52" dur="2.6s" begin="0.7s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.24;0" dur="2.6s" begin="0.7s" repeatCount="indefinite" />
        </circle>
        <g filter="url(#sp-fs5)"><use href="#sp-pin-red" x="858" y="564" /></g>
        <g className="lp-al5" filter="url(#sp-lf)">
          <rect x="726" y="559" width="120" height="34" rx="17" fill="#EF4444" />
          <text x="786" y="581" textAnchor="middle" fill="#fff" fontSize="13.5" fontFamily="'Noto Sans KR',sans-serif" fontWeight="600">매출액 높음</text>
        </g>

        <text x="24" y="882" fill="#BFDBFE" fontSize="11.5" fontFamily="'Noto Sans KR',sans-serif">nodaji — AI 상권분석 플랫폼</text>
      </svg>

      <div style={styles.mapArea} />

      {/* ── 우측 패널 ── */}
      <div style={{ ...styles.panel, overflow: step === 3 ? "hidden" : "auto" }}>
        {/* 로고 */}
        <div style={{ marginBottom: 24 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 197.20 56.00" width="160" height="46" overflow="visible">
            <text x="0" y="43.00" fontFamily="Arial Black, Helvetica Neue, Arial, sans-serif" fontWeight="900" fontSize="40" letterSpacing="2.40" fill="#cde0f0">NODAJI</text>
            <g transform="translate(183.20,3.00) rotate(35)">
              <circle cx="0" cy="0" r="10.0" fill="none" stroke="#8ab0cc" strokeWidth="0.80" opacity="0.80" />
              <line x1="0" y1="-8.80" x2="0" y2="-5.50" stroke="#8ab0cc" strokeWidth="1.00" opacity="0.65" />
              <line x1="0" y1="8.80"  x2="0" y2="5.50"  stroke="#8ab0cc" strokeWidth="1.00" opacity="0.65" />
              <line x1="-8.80" y1="0" x2="-5.50" y2="0" stroke="#8ab0cc" strokeWidth="1.00" opacity="0.65" />
              <line x1="8.80"  y1="0" x2="5.50"  y2="0" stroke="#8ab0cc" strokeWidth="1.00" opacity="0.65" />
              <polygon points="0,-8.20  1.50,0  0,1.60  -1.50,0" fill="#d94e30" />
              <polygon points="0,8.20   1.50,0  0,-1.60 -1.50,0" fill="#b8d0e8" opacity="0.85" />
              <circle cx="0" cy="0" r="1.20" fill="#1a2440" />
              <circle cx="0" cy="0" r="0.50" fill="#8ab0cc" />
            </g>
          </svg>
        </div>

        <h2 style={styles.title}>회원가입</h2>
        <p style={styles.subtitle}>상권분석 AI 서비스를 시작해보세요</p>

        {/* 스텝 인디케이터 */}
        <div style={styles.stepBar}>
          <div style={styles.stepItem}>
            <div className={`sp-step-circle ${step >= 1 ? "active" : "inactive"}`}>1</div>
            <span className={`sp-step-label ${step >= 1 ? "active" : "inactive"}`}>계정 정보</span>
          </div>
          <div className={`sp-step-line ${step >= 2 ? "active" : "inactive"}`} />
          <div style={styles.stepItem}>
            <div className={`sp-step-circle ${step >= 2 ? "active" : "inactive"}`}>2</div>
            <span className={`sp-step-label ${step >= 2 ? "active" : "inactive"}`}>추가 정보</span>
          </div>
          <div className={`sp-step-line ${step >= 3 ? "active" : "inactive"}`} />
          <div style={styles.stepItem}>
            <div className={`sp-step-circle ${step >= 3 ? "active" : "inactive"}`}>✓</div>
            <span className={`sp-step-label ${step >= 3 ? "active" : "inactive"}`}>가입 완료</span>
          </div>
        </div>

        {/* step 1 */}
        {step === 1 && (
          <form onSubmit={handleNext} style={styles.form}>
            <label style={styles.fieldLabel} htmlFor="sp-userId">아이디</label>
            <div style={styles.fieldWrap}>
              <input id="sp-userId" type="text" name="userId" value={form.userId}
                onChange={handleChange} placeholder="사용할 아이디를 입력하세요"
                autoComplete="username" className="lp-input" required />
            </div>
            <label style={styles.fieldLabel} htmlFor="sp-pw">비밀번호</label>
            <div style={styles.fieldWrap}>
              <input id="sp-pw" type="password" name="password" value={form.password}
                onChange={handleChange} placeholder="8자 이상 입력하세요"
                autoComplete="new-password" className="lp-input" required />
            </div>
            <label style={styles.fieldLabel} htmlFor="sp-pw2">비밀번호 확인</label>
            <div style={styles.fieldWrap}>
              <input id="sp-pw2" type="password" name="passwordConfirm" value={form.passwordConfirm}
                onChange={handleChange} placeholder="비밀번호를 다시 입력하세요"
                autoComplete="new-password" className="lp-input" required />
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" className="lp-btn-login">다음 단계 →</button>
            <div style={styles.footer}>
              <p style={styles.footerText}>
                이미 계정이 있으신가요?{" "}
                <a href="/login" className="lp-footer-link">로그인</a>
              </p>
              <button type="button" className="lp-back-link" onClick={() => navigate("/map", { replace: true })}>← 지도로 돌아가기</button>
            </div>
          </form>
        )}

        {/* step 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.fieldLabel} htmlFor="sp-name">이름</label>
            <div style={styles.fieldWrap}>
              <input id="sp-name" type="text" name="name" value={form.name}
                onChange={handleChange} placeholder="실명을 입력하세요"
                className="lp-input" required />
            </div>
            <label style={styles.fieldLabel} htmlFor="sp-phone">전화번호</label>
            <div style={styles.fieldWrap}>
              <input id="sp-phone" type="tel" name="phone" value={form.phone}
                onChange={handleChange} placeholder="010-0000-0000"
                className="lp-input" required />
            </div>
            <label style={styles.fieldLabel} htmlFor="sp-email">이메일</label>
            <div style={styles.fieldWrap}>
              <input id="sp-email" type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="example@email.com"
                autoComplete="email" className="lp-input" />
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="sp-btn-ghost" onClick={() => { setStep(1); setError(""); }}>← 이전</button>
              <button type="submit" className="lp-btn-login" style={{ flex: 1, marginTop: 0 }} disabled={loading}>
                {loading ? "처리 중..." : "가입 완료"}
              </button>
            </div>
          </form>
        )}

        {/* step 3 완료 */}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "16px 0", opacity: fading ? 0 : 1, transition: "opacity 0.5s", overflow: "hidden" }}>
            <div
              className="sp-success-icon"
              style={expanding ? { transform: "scale(22)", opacity: 0, transition: "transform 1s cubic-bezier(0.4,0,1,1), opacity 1s" } : {}}
              onTransitionEnd={() => { if (expanding) navigate("/map", { replace: true }); }}
            >✓</div>
            <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 700, color: "#0C1A2E" }}>
              가입이 완료되었습니다!
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "#64748B", lineHeight: 1.7 }}>
              {form.userId}님, 환영합니다 🎉<br />
              <span style={{ fontSize: 12, color: "#94A3B8" }}>잠시 후 지도로 이동합니다</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

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
  panel: {
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
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: "#0C1A2E",
    letterSpacing: "-0.5px",
    marginBottom: 5,
    marginTop: 0,
  },
  subtitle: {
    fontSize: 13.5,
    color: "#64748B",
    marginBottom: 20,
    marginTop: 0,
  },
  stepBar: {
    display: "flex",
    alignItems: "center",
    marginBottom: 22,
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
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
    marginBottom: 14,
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  error: {
    margin: "0 0 8px",
    fontSize: 13,
    color: "#EF4444",
  },
  footer: {
    marginTop: 22,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  footerText: {
    fontSize: 13.5,
    color: "#64748B",
    margin: 0,
  },
};
