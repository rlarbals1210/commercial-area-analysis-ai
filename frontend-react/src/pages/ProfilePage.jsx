import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const API = "http://localhost:8000";

// access 토큰을 헤더에 포함해서 API 호출하는 헬퍼
function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access")}`,
      ...(options.headers || {}),
    },
  });
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ nickname: "", email: "", birth_date: "" });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", new_password_confirm: "" });
  const [msg, setMsg] = useState({ profile: "", pw: "" });
  const [err, setErr] = useState({ profile: "", pw: "" });
  const [loading, setLoading] = useState({ profile: false, pw: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 페이지 진입 시 내 정보 불러오기
  useEffect(() => {
    authFetch(`${API}/api/accounts/profile/`)
      .then((res) => {
        if (res.status === 401) { navigate("/login"); return null; }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setUser(data);
        setForm({
          nickname: data.nickname || "",
          email: data.email || "",
          birth_date: data.birth_date || "",
        });
      });
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setErr((p) => ({ ...p, profile: "" }));
    setMsg((p) => ({ ...p, profile: "" }));
    setLoading((p) => ({ ...p, profile: true }));
    const res = await authFetch(`${API}/api/accounts/profile/`, {
      method: "PUT",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading((p) => ({ ...p, profile: false }));
    if (!res.ok) { setErr((p) => ({ ...p, profile: data.error })); return; }
    setMsg((p) => ({ ...p, profile: "저장되었습니다." }));
    // localStorage user 정보도 최신화
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...stored, nickname: form.nickname }));
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    setErr((p) => ({ ...p, pw: "" }));
    setMsg((p) => ({ ...p, pw: "" }));
    if (pwForm.new_password !== pwForm.new_password_confirm) {
      setErr((p) => ({ ...p, pw: "새 비밀번호가 일치하지 않습니다." })); return;
    }
    setLoading((p) => ({ ...p, pw: true }));
    const res = await authFetch(`${API}/api/accounts/change-password/`, {
      method: "POST",
      body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
    });
    const data = await res.json();
    setLoading((p) => ({ ...p, pw: false }));
    if (!res.ok) { setErr((p) => ({ ...p, pw: data.error })); return; }
    setMsg((p) => ({ ...p, pw: data.message }));
    setPwForm({ current_password: "", new_password: "", new_password_confirm: "" });
  };

  const handleDelete = async () => {
    await authFetch(`${API}/api/accounts/delete/`, { method: "DELETE" });
    localStorage.clear();
    navigate("/");
  };

  if (!user) return <div style={loadingStyle}>불러오는 중...</div>;

  return (
    <div style={pageStyle}>
      <motion.div
        style={containerStyle}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 22 }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32, gap: 12 }}>
          <button onClick={() => navigate("/")} style={backBtnStyle}>←</button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>개인정보 설정</h1>
        </div>

        {/* ── 내 정보 섹션 ── */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>내 정보</h2>

          {/* 읽기 전용 정보 */}
          <div style={readonlyBoxStyle}>
            <Row label="아이디" value={user.username} />
            <Row label="가입 경로" value={user.login_type === "kakao" ? "카카오 로그인" : "자체 가입"} />
            <Row label="가입일" value={new Date(user.created_at).toLocaleDateString("ko-KR")} />
          </div>

          {/* 수정 가능한 정보 */}
          <form onSubmit={handleProfileSave} style={formStyle}>
            <Field label="닉네임">
              <input style={inputStyle} value={form.nickname} onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))} placeholder="닉네임 입력" />
            </Field>
            <Field label="이메일">
              <input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="이메일 입력" />
            </Field>
            <Field label="생년월일">
              <input style={inputStyle} type="date" value={form.birth_date} onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))} />
            </Field>
            {err.profile && <p style={errStyle}>{err.profile}</p>}
            {msg.profile && <p style={successStyle}>{msg.profile}</p>}
            <button type="submit" style={primaryBtnStyle} disabled={loading.profile}>
              {loading.profile ? "저장 중..." : "저장하기"}
            </button>
          </form>
        </section>

        {/* ── 비밀번호 변경 (자체 가입만) ── */}
        {user.login_type === "local" && (
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>비밀번호 변경</h2>
            <form onSubmit={handlePwChange} style={formStyle}>
              <Field label="현재 비밀번호">
                <input style={inputStyle} type="password" value={pwForm.current_password} onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))} placeholder="현재 비밀번호" />
              </Field>
              <Field label="새 비밀번호">
                <input style={inputStyle} type="password" value={pwForm.new_password} onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))} placeholder="8자 이상" />
              </Field>
              <Field label="새 비밀번호 확인">
                <input style={inputStyle} type="password" value={pwForm.new_password_confirm} onChange={(e) => setPwForm((p) => ({ ...p, new_password_confirm: e.target.value }))} placeholder="새 비밀번호 재입력" />
              </Field>
              {err.pw && <p style={errStyle}>{err.pw}</p>}
              {msg.pw && <p style={successStyle}>{msg.pw}</p>}
              <button type="submit" style={primaryBtnStyle} disabled={loading.pw}>
                {loading.pw ? "변경 중..." : "비밀번호 변경"}
              </button>
            </form>
          </section>
        )}

        {/* ── 계정 관리 ── */}
        <section style={sectionStyle}>
          <h2 style={{ ...sectionTitleStyle, color: "#EF4444" }}>계정 관리</h2>
          {!showDeleteConfirm ? (
            <button style={deleteBtnStyle} onClick={() => setShowDeleteConfirm(true)}>
              회원 탈퇴
            </button>
          ) : (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 16 }}>
              <p style={{ margin: "0 0 12px", fontSize: 14, color: "#991B1B", fontWeight: 600 }}>
                정말 탈퇴하시겠어요? 모든 데이터가 삭제되며 복구할 수 없습니다.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={deleteBtnStyle} onClick={handleDelete}>탈퇴 확인</button>
                <button style={ghostBtnStyle} onClick={() => setShowDeleteConfirm(false)}>취소</button>
              </div>
            </div>
          )}
        </section>
      </motion.div>
    </div>
  );
}

/* ── 작은 컴포넌트 ── */
function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ fontSize: 13, color: "#6B7280" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

/* ── 스타일 ── */
const pageStyle = {
  minHeight: "100vh", background: "linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 100%)",
  display: "flex", justifyContent: "center", padding: "40px 16px",
  fontFamily: "'Pretendard', sans-serif",
};
const containerStyle = {
  width: "100%", maxWidth: 520,
};
const sectionStyle = {
  background: "#fff", borderRadius: 16, padding: "24px 28px",
  marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
};
const sectionTitleStyle = {
  margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111827",
};
const readonlyBoxStyle = {
  background: "#F9FAFB", borderRadius: 10, padding: "4px 12px", marginBottom: 20,
};
const formStyle = { display: "flex", flexDirection: "column", gap: 14 };
const inputStyle = {
  height: 44, padding: "0 14px", border: "1.5px solid #E5E7EB",
  borderRadius: 10, fontSize: 14, outline: "none", color: "#111827",
  background: "#F9FAFB", boxSizing: "border-box", width: "100%",
};
const primaryBtnStyle = {
  height: 46, background: "linear-gradient(135deg, #3B82F6, #6366F1)",
  color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
  fontWeight: 700, cursor: "pointer", marginTop: 4,
};
const deleteBtnStyle = {
  height: 42, background: "#FEF2F2", color: "#EF4444",
  border: "1.5px solid #FECACA", borderRadius: 10, fontSize: 14,
  fontWeight: 600, cursor: "pointer", padding: "0 20px",
};
const ghostBtnStyle = {
  height: 42, background: "transparent", color: "#6B7280",
  border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14,
  fontWeight: 600, cursor: "pointer", padding: "0 20px",
};
const errStyle = { margin: 0, fontSize: 13, color: "#EF4444" };
const successStyle = { margin: 0, fontSize: 13, color: "#10B981" };
const backBtnStyle = {
  width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E5E7EB",
  background: "#fff", cursor: "pointer", fontSize: 16, display: "flex",
  alignItems: "center", justifyContent: "center",
};
const loadingStyle = {
  display: "flex", alignItems: "center", justifyContent: "center",
  height: "100vh", color: "#6B7280", fontFamily: "Pretendard, sans-serif",
};
