import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    userId: "",
    password: "",
    passwordConfirm: "",
    name: "",
    phone: "",
    email: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (form.password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
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
          nickname: form.name,   // 이름을 닉네임으로 저장
          email: form.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "회원가입에 실패했습니다.");
        return;
      }
      setStep(3);
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fading, setFading] = useState(false);
  const [expanding, setExpanding] = useState(false);

  useEffect(() => {
    if (step !== 3) return;
    const t1 = setTimeout(() => setFading(true), 2500);
    const t2 = setTimeout(() => setExpanding(true), 2500 + 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [step]);

  return (
    <div style={pageStyle}>
      <motion.div
        style={{ ...cardStyle, transformOrigin: expanding ? "50% 66px" : "50% 50%" }}
        initial={{ opacity: 0, y: 48, scale: 0.92 }}
        animate={expanding ? { scale: 22, opacity: 0 } : { opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92, y: -32 }}
        transition={expanding
          ? { duration: 1.0, ease: [0.4, 0, 1, 1] }
          : { type: "spring", stiffness: 400, damping: 20 }}
        onAnimationComplete={() => { if (expanding) navigate("/"); }}
      >
        {/* 로고 — 페이드 아웃 제외 */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={logoWrapStyle}>
            <span style={{ fontSize: 22 }}>📍</span>
          </div>
        </div>

        <motion.div
          animate={{ opacity: fading ? 0 : 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
        {/* 타이틀 */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={titleStyle}>회원가입</h1>
          <p style={subtitleStyle}>상권분석 AI 서비스에 오신 것을 환영합니다</p>
        </div>

        {/* 스텝 인디케이터 */}
        <div style={stepBarStyle}>
          <div style={stepItemStyle}>
            <div style={stepCircleStyle(step >= 1)}>1</div>
            <span style={stepLabelStyle(step >= 1)}>계정 정보</span>
          </div>
          <div style={stepLineStyle(step >= 2)} />
          <div style={stepItemStyle}>
            <div style={stepCircleStyle(step >= 2)}>2</div>
            <span style={stepLabelStyle(step >= 2)}>추가 정보</span>
          </div>
          <div style={stepLineStyle(step >= 3)} />
          <div style={stepItemStyle}>
            <div style={stepCircleStyle(step >= 3)}>✓</div>
            <span style={stepLabelStyle(step >= 3)}>가입 완료</span>
          </div>
        </div>

        {/* 폼 */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              onSubmit={handleNext}
              style={formStyle}
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
            >
              <div style={fieldGroup}>
                <label style={labelStyle}>아이디</label>
                <input
                  type="text"
                  name="userId"
                  value={form.userId}
                  onChange={handleChange}
                  placeholder="사용할 아이디를 입력하세요"
                  style={inputStyle}
                  required
                />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>비밀번호</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="8자 이상 입력하세요"
                  style={inputStyle}
                  required
                />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>비밀번호 확인</label>
                <input
                  type="password"
                  name="passwordConfirm"
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  placeholder="비밀번호를 다시 입력하세요"
                  style={inputStyle}
                  required
                />
              </div>
              {error && (
                <p style={{ margin: 0, fontSize: 13, color: "#EF4444", textAlign: "center" }}>{error}</p>
              )}
              <button type="submit" style={primaryBtnStyle}>
                다음 단계 →
              </button>
            </motion.form>
          ) : step === 2 ? (
            <motion.form
              key="step2"
              onSubmit={handleSubmit}
              style={formStyle}
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
            >
              <div style={fieldGroup}>
                <label style={labelStyle}>이름</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="실명을 입력하세요"
                  style={inputStyle}
                  required
                />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>전화번호</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="010-0000-0000"
                  style={inputStyle}
                  required
                />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>이메일</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  style={inputStyle}
                  required
                />
              </div>
              {error && (
                <p style={{ margin: 0, fontSize: 13, color: "#EF4444", textAlign: "center" }}>{error}</p>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  style={ghostBtnStyle}
                >
                  ← 이전
                </button>
                <button type="submit" style={{ ...primaryBtnStyle, flex: 1 }} disabled={loading}>
                  {loading ? "처리 중..." : "가입 완료"}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="step3"
              style={{ textAlign: "center", padding: "12px 0" }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 450, damping: 18 }}
            >
              <div style={successIconStyle}>✓</div>
              <h2 style={{ margin: "16px 0 8px", fontSize: 20, fontWeight: 700, color: "#111827" }}>
                가입이 완료되었습니다!
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: "#6B7280" }}>
                {form.userId}님, 환영합니다 🎉<br />
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>잠시 후 지도로 이동합니다</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {step < 3 && (
          <p style={footerTextStyle}>
            이미 계정이 있으신가요?{" "}
            <Link to="/login" style={linkStyle}>로그인</Link>
          </p>
        )}

        {step < 3 && (
          <button onClick={() => navigate("/")} style={backBtnStyle}>
            ← 지도로 돌아가기
          </button>
        )}
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ── 스타일 ── */

const pageStyle = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Pretendard', sans-serif",
  background: "linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 100%)",
};

const cardStyle = {
  background: "#ffffff",
  borderRadius: 20,
  padding: "40px 44px",
  width: "100%",
  maxWidth: 420,
  boxShadow: "0 8px 40px rgba(59,130,246,0.10), 0 2px 12px rgba(0,0,0,0.06)",
};

const logoWrapStyle = {
  width: 52,
  height: 52,
  borderRadius: 14,
  background: "linear-gradient(135deg, #3B82F6, #6366F1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 12px",
  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
};

const titleStyle = {
  margin: "0 0 4px",
  fontSize: 22,
  fontWeight: 700,
  color: "#111827",
};

const subtitleStyle = {
  margin: 0,
  fontSize: 13,
  color: "#6B7280",
};

const stepBarStyle = {
  display: "flex",
  alignItems: "center",
  marginBottom: 28,
};

const stepItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const stepCircleStyle = (active) => ({
  width: 26,
  height: 26,
  borderRadius: "50%",
  background: active ? "#3B82F6" : "#E5E7EB",
  color: active ? "#fff" : "#9CA3AF",
  fontSize: 12,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.3s",
});

const stepLabelStyle = (active) => ({
  fontSize: 13,
  fontWeight: 600,
  color: active ? "#3B82F6" : "#9CA3AF",
  transition: "color 0.3s",
});

const stepLineStyle = (active) => ({
  flex: 1,
  height: 2,
  background: active ? "#3B82F6" : "#E5E7EB",
  margin: "0 10px",
  borderRadius: 2,
  transition: "background 0.3s",
});

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const fieldGroup = {
  display: "flex",
  flexDirection: "column",
  gap: 5,
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

const inputStyle = {
  height: 44,
  padding: "0 14px",
  border: "1.5px solid #E5E7EB",
  borderRadius: 10,
  fontSize: 14,
  outline: "none",
  color: "#111827",
  background: "#F9FAFB",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
  width: "100%",
};

const primaryBtnStyle = {
  height: 46,
  background: "linear-gradient(135deg, #3B82F6, #6366F1)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 4,
  boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
};

const ghostBtnStyle = {
  height: 46,
  background: "transparent",
  color: "#6B7280",
  border: "1.5px solid #E5E7EB",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 4,
  padding: "0 18px",
};

const footerTextStyle = {
  textAlign: "center",
  marginTop: 22,
  fontSize: 14,
  color: "#6B7280",
};

const linkStyle = {
  color: "#3B82F6",
  fontWeight: 600,
  textDecoration: "none",
};

const successIconStyle = {
  width: 60,
  height: 60,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #3B82F6, #6366F1)",
  color: "#fff",
  fontSize: 26,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto",
  boxShadow: "0 4px 18px rgba(99,102,241,0.35)",
};

const backBtnStyle = {
  display: "block",
  margin: "12px auto 0",
  border: "none",
  background: "none",
  cursor: "pointer",
  fontSize: 13,
  color: "#9CA3AF",
  padding: 0,
};
