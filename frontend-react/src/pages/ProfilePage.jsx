import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";

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
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    authFetch(`${API}/api/accounts/profile/`)
      .then((r) => { if (r.status === 401) { navigate("/login"); return null; } return r.json(); })
      .then((data) => {
        if (!data) return;
        setUser(data);
        setForm({ nickname: data.nickname || "", email: data.email || "", birth_date: data.birth_date || "" });
      });
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setErr((p) => ({ ...p, profile: "" })); setMsg((p) => ({ ...p, profile: "" }));
    setLoading((p) => ({ ...p, profile: true }));
    const res = await authFetch(`${API}/api/accounts/profile/`, { method: "PUT", body: JSON.stringify(form) });
    const data = await res.json();
    setLoading((p) => ({ ...p, profile: false }));
    if (!res.ok) { setErr((p) => ({ ...p, profile: data.error })); return; }
    setMsg((p) => ({ ...p, profile: "변경사항이 저장되었습니다." }));
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...stored, nickname: form.nickname }));
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    setErr((p) => ({ ...p, pw: "" })); setMsg((p) => ({ ...p, pw: "" }));
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
    localStorage.clear(); navigate("/");
  };

  if (!user) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#aaa", fontSize: 14, fontFamily: "Pretendard, sans-serif" }}>
      로딩 중
    </div>
  );

  const tabs = [
    { key: "profile", label: "프로필" },
    ...(user.login_type === "local" ? [{ key: "security", label: "보안" }] : []),
    { key: "account", label: "계정" },
  ];

  const initial = (user.nickname || user.username || "?")[0].toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "'Pretendard', -apple-system, sans-serif" }}>

      {/* 헤더 */}
      <header style={{
        background: "linear-gradient(135deg, #0f1a30, #162040)",
        borderBottom: "1px solid #1e2d4a",
        height: 56, padding: "0 28px",
        display: "flex", alignItems: "center",
        position: "relative", overflow: "hidden",
      }}>
        <svg viewBox="0 0 1200 56" width="100%" height="56" preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }} fill="none">
          <path d="M0 36 Q300 24,600 36 Q900 48,1200 32" stroke="#93c5fd" strokeWidth="1" opacity=".1" strokeLinecap="round"/>
        </svg>
        <svg viewBox="0 0 300 44" width="130" height="44" fill="none" style={{ position: "relative", zIndex: 1 }}>
          <text x="0" y="34" fontFamily="Montserrat, sans-serif" fontWeight="900" fontSize="36" fill="#bfdbfe" letterSpacing="-1">NODAJI</text>
          <g transform="translate(224,4) rotate(-15, 13, 17)">
            <circle cx="13" cy="17" r="13" stroke="#60a5fa" strokeWidth="1" opacity=".5"/>
            <line x1="13" y1="5" x2="13" y2="9" stroke="#60a5fa" strokeWidth="1" opacity=".6"/>
            <line x1="13" y1="25" x2="13" y2="29" stroke="#60a5fa" strokeWidth="1" opacity=".6"/>
            <line x1="1"  y1="17" x2="5"  y2="17" stroke="#60a5fa" strokeWidth="1" opacity=".6"/>
            <line x1="21" y1="17" x2="25" y2="17" stroke="#60a5fa" strokeWidth="1" opacity=".6"/>
            <polygon points="13,5 11,17 13,14 15,17" fill="#ef4444" opacity=".9"/>
            <polygon points="13,29 11,17 13,20 15,17" fill="#bfdbfe" opacity=".3"/>
            <circle cx="13" cy="17" r="2" fill="#3b82f6"/>
          </g>
        </svg>
        <div style={{ width: 1, height: 22, background: "rgba(148,163,184,0.2)", margin: "0 14px", position: "relative", zIndex: 1 }} />
        <span style={{ fontSize: 13, color: "#475569", position: "relative", zIndex: 1 }}>설정</span>
        <button onClick={() => navigate("/")} style={{
          marginLeft: "auto", zIndex: 1, position: "relative",
          padding: "5px 12px", background: "transparent",
          border: "1px solid rgba(148,163,184,0.2)", borderRadius: 6,
          color: "#64748b", fontSize: 12, cursor: "pointer",
        }}>← 메인으로</button>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px", display: "flex", gap: 28, alignItems: "flex-start" }}>

        {/* 사이드바 */}
        <aside style={{ width: 200, flexShrink: 0 }}>
          {/* 유저 요약 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0 24px", gap: 10 }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: user.is_staff ? "#1e1b4b" : "#1e3a5f",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: "#fff",
              position: "relative",
            }}>
              {initial}
              {user.is_staff && (
                <span style={{
                  position: "absolute", bottom: -2, right: -2,
                  fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 10,
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  color: "#fff", border: "2px solid #fafafa",
                }}>DEV</span>
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{user.nickname || user.username}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>@{user.username}</div>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  width: "100%", padding: "9px 14px", border: "none", borderRadius: 8,
                  textAlign: "left", fontSize: 13, cursor: "pointer",
                  background: activeTab === tab.key ? "#f0f4ff" : "transparent",
                  color: activeTab === tab.key ? "#3B82F6" : "#6B7280",
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  transition: "all 0.1s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* 본문 */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* 프로필 탭 */}
          {activeTab === "profile" && (
            <div>
              <div style={sectionHeadStyle}>
                <h2 style={h2Style}>프로필</h2>
                <p style={descStyle}>이름, 이메일 등 기본 정보를 관리합니다.</p>
              </div>

              <div style={cardStyle}>
                <div style={rowStyle}>
                  <span style={labelStyle}>아이디</span>
                  <span style={valueStyle}>{user.username}</span>
                </div>
                <div style={dividerStyle} />
                <div style={rowStyle}>
                  <span style={labelStyle}>가입 경로</span>
                  <span style={valueStyle}>{user.login_type === "kakao" ? "카카오" : "이메일"}</span>
                </div>
                <div style={dividerStyle} />
                <div style={rowStyle}>
                  <span style={labelStyle}>가입일</span>
                  <span style={valueStyle}>{new Date(user.created_at).toLocaleDateString("ko-KR")}</span>
                </div>
              </div>

              <form onSubmit={handleProfileSave}>
                <div style={cardStyle}>
                  <FormRow label="닉네임">
                    <StyledInput value={form.nickname} onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))} placeholder="닉네임을 입력하세요" />
                  </FormRow>
                  <div style={dividerStyle} />
                  <FormRow label="이메일">
                    <StyledInput type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="이메일을 입력하세요" />
                  </FormRow>
                  <div style={dividerStyle} />
                  <FormRow label="생년월일">
                    <StyledInput type="date" value={form.birth_date} onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))} />
                  </FormRow>
                </div>
                {err.profile && <p style={errStyle}>{err.profile}</p>}
                {msg.profile && <p style={okStyle}>{msg.profile}</p>}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                  <button type="submit" style={saveBtnStyle} disabled={loading.profile}>
                    {loading.profile ? "저장 중..." : "저장"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 보안 탭 */}
          {activeTab === "security" && (
            <div>
              <div style={sectionHeadStyle}>
                <h2 style={h2Style}>보안</h2>
                <p style={descStyle}>비밀번호를 변경합니다.</p>
              </div>
              <form onSubmit={handlePwChange}>
                <div style={cardStyle}>
                  <FormRow label="현재 비밀번호">
                    <StyledInput type="password" value={pwForm.current_password} onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))} placeholder="현재 비밀번호" />
                  </FormRow>
                  <div style={dividerStyle} />
                  <FormRow label="새 비밀번호">
                    <StyledInput type="password" value={pwForm.new_password} onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))} placeholder="8자 이상" />
                  </FormRow>
                  <div style={dividerStyle} />
                  <FormRow label="새 비밀번호 확인">
                    <StyledInput type="password" value={pwForm.new_password_confirm} onChange={(e) => setPwForm((p) => ({ ...p, new_password_confirm: e.target.value }))} placeholder="새 비밀번호 재입력" />
                  </FormRow>
                </div>
                {err.pw && <p style={errStyle}>{err.pw}</p>}
                {msg.pw && <p style={okStyle}>{msg.pw}</p>}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                  <button type="submit" style={saveBtnStyle} disabled={loading.pw}>
                    {loading.pw ? "변경 중..." : "변경"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 계정 탭 */}
          {activeTab === "account" && (
            <div>
              <div style={sectionHeadStyle}>
                <h2 style={h2Style}>계정</h2>
                <p style={descStyle}>계정 삭제 등 위험한 작업을 수행합니다.</p>
              </div>
              <div style={{ ...cardStyle, border: "1px solid #fee2e2" }}>
                <div style={{ padding: "4px 0 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 4 }}>계정 삭제</div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>
                    계정을 삭제하면 모든 데이터가 영구 삭제되며 복구할 수 없습니다.
                  </div>
                </div>
                {!showDeleteConfirm ? (
                  <button style={dangerBtnStyle} onClick={() => setShowDeleteConfirm(true)}>계정 삭제</button>
                ) : (
                  <div style={{ background: "#fff5f5", borderRadius: 8, padding: "14px 16px", border: "1px solid #fecaca" }}>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "#b91c1c" }}>정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={dangerBtnStyle} onClick={handleDelete}>삭제 확인</button>
                      <button style={cancelBtnStyle} onClick={() => setShowDeleteConfirm(false)}>취소</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

/* ── 서브 컴포넌트 ── */
function FormRow({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "4px 0" }}>
      <span style={{ width: 90, flexShrink: 0, fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function StyledInput(props) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", height: 38, padding: "0 12px",
        border: `1px solid ${focused ? "#3B82F6" : "#E5E7EB"}`,
        borderRadius: 8, fontSize: 13, outline: "none",
        color: "#111", background: "#fff",
        boxSizing: "border-box", fontFamily: "inherit",
        transition: "border-color 0.15s",
      }}
    />
  );
}

/* ── 스타일 ── */
const sectionHeadStyle = { marginBottom: 20 };
const h2Style = { margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#111" };
const descStyle = { margin: 0, fontSize: 13, color: "#9CA3AF" };
const cardStyle = {
  background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12,
  padding: "16px 20px", marginBottom: 4,
};
const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" };
const dividerStyle = { borderTop: "1px solid #F3F4F6", margin: "0" };
const labelStyle = { fontSize: 13, color: "#6B7280" };
const valueStyle = { fontSize: 13, color: "#111", fontWeight: 500 };
const saveBtnStyle = {
  height: 36, padding: "0 20px", background: "#111", color: "#fff",
  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
  cursor: "pointer",
};
const dangerBtnStyle = {
  height: 36, padding: "0 16px", background: "#fff", color: "#EF4444",
  border: "1px solid #FECACA", borderRadius: 8, fontSize: 13,
  fontWeight: 600, cursor: "pointer",
};
const cancelBtnStyle = {
  height: 36, padding: "0 16px", background: "#fff", color: "#6B7280",
  border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13,
  fontWeight: 600, cursor: "pointer",
};
const errStyle = { margin: "8px 0 0", fontSize: 12, color: "#EF4444" };
const okStyle  = { margin: "8px 0 0", fontSize: 12, color: "#10B981" };
