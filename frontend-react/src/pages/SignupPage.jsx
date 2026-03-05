import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: 회원가입 API 연동
  };

  return (
    <div style={pageStyle}>
      <div style={bgStyle} />

      <div style={cardStyle}>
        <button onClick={() => navigate("/")} style={backBtnStyle}>
          ← 지도로 돌아가기
        </button>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={logoStyle}>📍</div>
          <h1 style={{ margin: "12px 0 4px", fontSize: 24, fontWeight: 700, color: "#E8E8E8" }}>
            회원가입
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#9E9E9E" }}>계정을 만들고 분석 결과를 확인하세요</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={fieldGroup}>
            <label style={labelStyle}>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              style={inputStyle}
              required
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              style={inputStyle}
              required
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>비밀번호 확인</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              style={inputStyle}
              required
            />
          </div>

          <button type="submit" style={submitBtnStyle}>
            가입하기
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#9E9E9E" }}>
          이미 계정이 있으신가요?{" "}
          <Link to="/login" style={{ color: "#6B9FE4", fontWeight: 600, textDecoration: "none" }}>
            로그인
          </Link>
        </p>
      </div>
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
  position: "relative",
  background: "#2D2D2D",
};

const bgStyle = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(135deg, #3B3B3B 0%, #252525 100%)",
  opacity: 0.6,
};

const cardStyle = {
  position: "relative",
  background: "#363636",
  borderRadius: 20,
  padding: "36px 40px",
  width: "100%",
  maxWidth: 420,
  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
};

const backBtnStyle = {
  border: "none",
  background: "none",
  cursor: "pointer",
  fontSize: 13,
  color: "#9E9E9E",
  padding: 0,
  marginBottom: 20,
  display: "block",
};

const logoStyle = {
  fontSize: 40,
  lineHeight: 1,
};

const fieldGroup = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#C0C0C0",
};

const inputStyle = {
  height: 46,
  padding: "0 14px",
  border: "1.5px solid #4E4E4E",
  borderRadius: 10,
  fontSize: 14,
  outline: "none",
  color: "#E8E8E8",
  background: "#424242",
  transition: "border-color 0.15s",
};

const submitBtnStyle = {
  height: 48,
  background: "#3B82F6",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 4,
};
