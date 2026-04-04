import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ userId: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      // 토큰을 localStorage에 저장 → 이후 API 호출 시 헤더에 포함
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <motion.div
        style={cardStyle}
        initial={{ opacity: 0, y: 56, scale: 0.88 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
      >
        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={logoWrapStyle}>
            <span style={{ fontSize: 22 }}>📍</span>
          </div>
        </div>

        {/* 타이틀 */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={titleStyle}>로그인</h1>
          <p style={subtitleStyle}>상권분석 AI 서비스에 오신 것을 환영합니다</p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={fieldGroup}>
            <label style={labelStyle}>아이디</label>
            <input
              type="text"
              name="userId"
              value={form.userId}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
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
              placeholder="비밀번호를 입력하세요"
              style={inputStyle}
              required
            />
          </div>
          {error && (
            <p style={{ margin: 0, fontSize: 13, color: "#EF4444", textAlign: "center" }}>{error}</p>
          )}
          <button type="submit" style={primaryBtnStyle} disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 구분선 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>또는</span>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
        </div>

        {/* 소셜 로그인 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            style={socialBtnStyle("#FEE500", "#3C1E1E")}
            onClick={async () => {
              // 백엔드에서 카카오 로그인 URL 받아서 이동
              const res = await fetch("http://localhost:8000/api/accounts/kakao/login/");
              const { url } = await res.json();
              window.location.href = url;
            }}
          >
            <span style={{ fontSize: 16 }}>💬</span> 카카오로 시작하기
          </button>
          <button style={socialBtnStyle("#03C75A", "#fff")}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>N</span> 네이버로 시작하기
          </button>
        </div>

        {/* 회원가입 링크 */}
        <p style={footerTextStyle}>
          계정이 없으신가요?{" "}
          <Link to="/signup" style={linkStyle}>회원가입</Link>
        </p>

        <button onClick={() => navigate("/")} style={backBtnStyle}>
          ← 지도로 돌아가기
        </button>
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

const socialBtnStyle = (bg, color) => ({
  height: 44,
  background: bg,
  color,
  border: "none",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
});

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
