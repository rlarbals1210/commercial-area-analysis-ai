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

const BOARD_LABEL = { free: "자유", info: "정보", notice: "공지" };

const NavIcon = ({ type, active }) => {
  const color = active ? "#93C6E7" : "rgba(205,224,240,0.45)";
  if (type === "info") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
  if (type === "password") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
  if (type === "account") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
  if (type === "activity") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
  if (type === "reports") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  );
  return null;
};

const NAV_ITEMS = [
  { key: "info",     label: "정보 변경"   },
  { key: "password", label: "비밀번호"    },
  { key: "activity", label: "활동 내역"  },
  { key: "reports",  label: "저장한 보고서" },
  { key: "account",  label: "계정 관리"  },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const [user, setUser] = useState(null);

  // 정보 변경
  const [form, setForm] = useState({ nickname: "", email: "", birth_date: "" });
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // 비밀번호 게이트
  const [pwVerified, setPwVerified] = useState(false);
  const [gateInput, setGateInput] = useState("");
  const [gateErr, setGateErr] = useState("");
  const [gateLoading, setGateLoading] = useState(false);

  // 비밀번호 변경
  const [pwForm, setPwForm] = useState({ new_password: "", new_password_confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // 활동 내역
  const [activityTab, setActivityTab] = useState(null);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [activityData, setActivityData] = useState({ posts: null, likes: null, comments: null });
  const [savedReports, setSavedReports] = useState(null);
  const [openReport, setOpenReport] = useState(null);

  // 계정 삭제
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    authFetch(`${API}/api/accounts/profile/`)
      .then((res) => {
        if (res.status === 401) { navigate("/login"); return null; }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setUser(data);
        setForm({ nickname: data.nickname || "", email: data.email || "", birth_date: data.birth_date || "" });
      });
  }, []);

  // 활동 내역 탭 진입 시 데이터 로드
  useEffect(() => {
    if (activeTab !== "activity") return;
    const load = async (sub, url) => {
      if (activityData[sub] !== null) return; // 이미 로드됨
      const res = await authFetch(`${API}${url}`);
      const data = await res.json();
      setActivityData((p) => ({ ...p, [sub]: data }));
    };
    load("posts",    "/api/community/my-posts/");
    load("likes",    "/api/community/my-likes/");
    load("comments", "/api/community/my-comments/");
  }, [activeTab]);

  // 저장한 보고서 탭 진입 시 로드
  useEffect(() => {
    if (activeTab !== "reports") return;
    if (savedReports !== null) return;
    authFetch(`${API}/api/community/reports/saved/`)
      .then((r) => r.json())
      .then((data) => setSavedReports(data));
  }, [activeTab]);

  // 탭 전환 시 비밀번호 게이트 리셋
  const handleTabChange = (key) => {
    if (key === "activity") {
      setActivityExpanded((prev) => !prev);
      return; // activeTab은 그대로 유지
    }
    setActiveTab(key);
    setActivityExpanded(false);
    setActivityTab(null);
    if (key !== "password") {
      setPwVerified(false);
      setGateInput("");
      setGateErr("");
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileErr(""); setProfileMsg("");
    setProfileLoading(true);
    const res = await authFetch(`${API}/api/accounts/profile/`, { method: "PUT", body: JSON.stringify(form) });
    const data = await res.json();
    setProfileLoading(false);
    if (!res.ok) { setProfileErr(data.error); return; }
    setProfileMsg("저장되었습니다.");
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...stored, nickname: form.nickname }));
  };

  // 현재 비밀번호 검증 (로그인 API 활용)
  const handleGateVerify = async (e) => {
    e.preventDefault();
    setGateErr("");
    setGateLoading(true);
    const res = await fetch(`${API}/api/accounts/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user.username, password: gateInput }),
    });
    setGateLoading(false);
    if (!res.ok) { setGateErr("비밀번호가 올바르지 않습니다."); return; }
    setPwVerified(true);
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    setPwErr(""); setPwMsg("");
    if (pwForm.new_password !== pwForm.new_password_confirm) {
      setPwErr("새 비밀번호가 일치하지 않습니다."); return;
    }
    setPwLoading(true);
    const res = await authFetch(`${API}/api/accounts/change-password/`, {
      method: "POST",
      body: JSON.stringify({ current_password: gateInput, new_password: pwForm.new_password }),
    });
    const data = await res.json();
    setPwLoading(false);
    if (!res.ok) { setPwErr(data.error); return; }
    setPwMsg(data.message || "비밀번호가 변경되었습니다.");
    setPwForm({ new_password: "", new_password_confirm: "" });
    setGateInput("");
    setPwVerified(false);
  };

  const handleDelete = async () => {
    const refresh = localStorage.getItem("refresh");
    if (refresh) {
      try {
        const r = await fetch(`${API}/api/accounts/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        if (r.ok) {
          const d = await r.json();
          localStorage.setItem("access", d.access);
        }
      } catch {}
    }
    await authFetch(`${API}/api/accounts/delete/`, { method: "DELETE" });
    localStorage.clear();
    navigate("/");
  };

  if (!user) return (
    <div style={s.loadingWrap}>
      <div style={s.loadingDot} />
      불러오는 중...
    </div>
  );

  return (
    <div style={s.page}>
      {/* ── 사이드바 ── */}
      <aside style={s.sidebar}>
        {/* 로고 */}
        <div style={s.logoWrap} onClick={() => navigate("/")} title="메인으로">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 197.20 56.00" width="120" height="34" overflow="visible">
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
          <span style={s.logoSub}>개인정보 설정</span>
        </div>

        {/* 유저 정보 */}
        <div style={s.userBox}>
          <div style={s.avatar}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.9)"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="rgba(255,255,255,0.9)"/>
            </svg>
          </div>
          <div>
            <div style={s.userName}>{user.nickname || user.username}</div>
            <div style={s.userType}>{user.login_type === "kakao" ? "카카오 계정" : "일반 계정"}</div>
          </div>
        </div>

        {/* 내비게이션 */}
        <nav style={s.nav}>
          {NAV_ITEMS.map(({ key, label }) => {
            if (key === "password" && user.login_type === "kakao") return null;
            const isActive = key === "activity"
              ? (activeTab === "activity" && !!activityTab)
              : activeTab === key;
            const isActivityOpen = key === "activity" && activityExpanded;
            return (
              <div key={key}>
                <button
                  style={{ ...s.navItem, ...(isActive ? s.navItemActive : {}) }}
                  onClick={() => handleTabChange(key)}
                >
                  <span style={s.navIcon}><NavIcon type={key} active={isActive} /></span>
                  {label}
                  {key === "activity" && (
                    <svg
                      style={{ marginLeft: "auto", transition: "transform 0.25s", transform: isActivityOpen ? "rotate(-90deg)" : "rotate(90deg)" }}
                      width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="rgba(205,224,240,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  )}
                  {isActive && <span style={s.navActiveBar} />}
                </button>

                {/* 활동 내역 하위 항목 */}
                {isActivityOpen && (
                  <div style={s.subNav}>
                    {[
                      { key: "posts",    label: "내가 쓴 글"  },
                      { key: "likes",    label: "좋아요한 글" },
                      { key: "comments", label: "댓글 단 글"  },
                    ].map(({ key: subKey, label: subLabel }) => (
                      <button
                        key={subKey}
                        style={{ ...s.subNavItem, ...(activityTab === subKey ? s.subNavItemActive : {}) }}
                        onClick={() => { setActiveTab("activity"); setActivityTab(subKey); }}
                      >
                        {activityTab === subKey && <span style={s.subNavActiveBar} />}
                        {subLabel}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 하단 메인 버튼 */}
        <button style={s.backBtn} onClick={() => navigate("/")}>← 지도로 돌아가기</button>
      </aside>

      {/* ── 콘텐츠 영역 ── */}
      <main style={s.content}>
        <div style={s.card}>

          {/* ── 정보 변경 ── */}
          {activeTab === "info" && (
            <>
              <h2 style={s.cardTitle}>정보 변경</h2>

              {/* 읽기 전용 */}
              <div style={s.readonlyBox}>
                <InfoRow label="아이디">
                  <span style={s.infoVal}>{user.username}</span>
                  {user.is_staff && <span style={s.devBadge}>DEV</span>}
                </InfoRow>
                <InfoRow label="가입 경로">
                  <span style={s.infoVal}>{user.login_type === "kakao" ? "카카오 로그인" : "자체 가입"}</span>
                </InfoRow>
                <InfoRow label="가입일" last>
                  <span style={s.infoVal}>{new Date(user.created_at).toLocaleDateString("ko-KR")}</span>
                </InfoRow>
              </div>

              {/* 수정 폼 */}
              <form onSubmit={handleProfileSave} style={s.form}>
                <Field label="닉네임">
                  <input style={s.input} value={form.nickname}
                    onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
                    placeholder="닉네임 입력" />
                </Field>
                <Field label="이메일">
                  <input style={s.input} type="email" value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="이메일 입력" />
                </Field>
                <Field label="생년월일">
                  <input style={s.input} type="date" value={form.birth_date}
                    onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))} />
                </Field>
                {profileErr && <p style={s.err}>{profileErr}</p>}
                {profileMsg && <p style={s.success}>{profileMsg}</p>}
                <button type="submit" style={s.primaryBtn} disabled={profileLoading}>
                  {profileLoading ? "저장 중..." : "저장하기"}
                </button>
              </form>
            </>
          )}

          {/* ── 비밀번호 ── */}
          {activeTab === "password" && (
            <>
              <h2 style={s.cardTitle}>비밀번호 변경</h2>
              {!pwVerified ? (
                /* 현재 비밀번호 확인 게이트 */
                <div style={s.gateWrap}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8ab0cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <p style={s.gateDesc}>본인 확인을 위해<br />현재 비밀번호를 입력해주세요</p>
                  <form onSubmit={handleGateVerify} style={{ width: "100%", maxWidth: 380 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        style={{ ...s.input, flex: 1 }}
                        type="password"
                        value={gateInput}
                        onChange={(e) => setGateInput(e.target.value)}
                        placeholder="현재 비밀번호"
                        autoFocus
                        required
                      />
                      <button type="submit" style={s.gateBtn} disabled={gateLoading}>
                        {gateLoading ? "..." : "확인"}
                      </button>
                    </div>
                    {gateErr && <p style={{ ...s.err, marginTop: 8 }}>{gateErr}</p>}
                  </form>
                </div>
              ) : (
                /* 비밀번호 변경 폼 */
                <form onSubmit={handlePwChange} style={s.form}>
                  <Field label="새 비밀번호">
                    <input style={s.input} type="password" value={pwForm.new_password}
                      onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
                      placeholder="8자 이상 입력" required />
                  </Field>
                  <Field label="새 비밀번호 확인">
                    <input style={s.input} type="password" value={pwForm.new_password_confirm}
                      onChange={(e) => setPwForm((p) => ({ ...p, new_password_confirm: e.target.value }))}
                      placeholder="새 비밀번호 재입력" required />
                  </Field>
                  {pwErr && <p style={s.err}>{pwErr}</p>}
                  {pwMsg && <p style={s.success}>{pwMsg}</p>}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" style={s.ghostBtn}
                      onClick={() => { setPwVerified(false); setGateInput(""); setGateErr(""); setPwMsg(""); setPwErr(""); }}>
                      ← 다시 입력
                    </button>
                    <button type="submit" style={{ ...s.primaryBtn, flex: 1, marginTop: 0 }} disabled={pwLoading}>
                      {pwLoading ? "변경 중..." : "비밀번호 변경"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ── 활동 내역 ── */}
          {activeTab === "activity" && (
            <>
              <h2 style={s.cardTitle}>
                {{ posts: "내가 쓴 글", likes: "좋아요한 글", comments: "댓글 단 글", reports: "저장한 보고서" }[activityTab] || "활동 내역"}
              </h2>

              {/* 선택 전 안내 */}
              {!activityTab && (
                <p style={s.activityEmpty}>왼쪽에서 항목을 선택하세요.</p>
              )}

              {/* 카드 목록 */}
              {activityTab && activityTab !== "reports" && (() => {
                const list = activityData[activityTab];
                if (list === null) return <p style={s.activityEmpty}>불러오는 중...</p>;
                if (list.length === 0) return <p style={s.activityEmpty}>게시글이 없습니다.</p>;
                return (
                  <div style={s.postList}>
                    {list.map((post) => (
                      <div key={post.id} style={s.postCard}
                        onClick={() => navigate(`/community?post=${post.id}`)}
                      >
                        <div style={s.postCardHeader}>
                          <span style={s.postBoard}>{BOARD_LABEL[post.board] || post.board}</span>
                          <span style={s.postCardDate}>{post.created_at}</span>
                        </div>
                        <div style={s.postCardTitle}>{post.title}</div>
                        {post.content_preview && (
                          <div style={s.postCardPreview}>{post.content_preview}</div>
                        )}
                        <div style={s.postCardMeta}>
                          <span>♥ {post.like_count}</span>
                          <span>💬 {post.comment_count}</span>
                          <span>👁 {post.view_count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

            </>
          )}

          {/* ── 저장한 보고서 ── */}
          {activeTab === "reports" && (
            <>
              <h2 style={s.cardTitle}>저장한 보고서</h2>
              {savedReports === null ? (
                <p style={s.activityEmpty}>불러오는 중...</p>
              ) : savedReports.length === 0 ? (
                <p style={s.activityEmpty}>저장한 보고서가 없습니다.</p>
              ) : (
                <div style={s.postList}>
                  {savedReports.map((report) => (
                    <div
                      key={report.id}
                      style={{ ...s.postCard, cursor: "pointer" }}
                      onClick={async () => {
                        setOpenReport({ _loading: true, title: report.title, area_type: report.area_type });
                        const res = await authFetch(`${API}/api/community/reports/saved/${report.id}/`);
                        const data = await res.json();
                        setOpenReport(data);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                    >
                      <div style={s.postCardHeader}>
                        <span style={{ ...s.postBoard, background: "#EFF6FF", color: "#1D4ED8" }}>
                          {report.area_type === "gu" ? "구 보고서" : "행정동 보고서"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={s.postCardDate}>{report.created_at}</span>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const token = localStorage.getItem("access");
                              await fetch(`${API}/api/community/reports/saved/${report.id}/delete/`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              setSavedReports((p) => p.filter((r) => r.id !== report.id));
                            }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 12, padding: 0 }}
                            onMouseEnter={(e) => { e.stopPropagation(); e.currentTarget.style.color = "#EF4444"; }}
                            onMouseLeave={(e) => { e.stopPropagation(); e.currentTarget.style.color = "#9CA3AF"; }}
                          >삭제</button>
                        </div>
                      </div>
                      <div style={s.postCardTitle}>{report.title}</div>
                      {report.category && (
                        <div style={s.postCardPreview}>업종: {report.category}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 보고서 모달 */}
              {openReport && (
                <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => setOpenReport(null)}
                >
                  <div className="no-scrollbar" style={{ background: "#F8F9FA", borderRadius: 16, width: "min(760px, 92vw)", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 헤더 */}
                    <div style={{ background: "#fff", borderBottom: "2px solid #111827", padding: "20px 28px 16px", borderRadius: "16px 16px 0 0", flexShrink: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                            상권분석 결과
                            {openReport.report_data?.quarter && (
                              <span style={{ marginLeft: 10 }}>
                                {String(openReport.report_data.quarter).slice(0, 4)}년 {String(openReport.report_data.quarter).slice(4)}분기
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{openReport.area_name || openReport.title}</div>
                          {openReport.category && <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{openReport.category}</div>}
                        </div>
                        <button onClick={() => setOpenReport(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 4 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>

                    {/* 본문 */}
                    <div style={{ padding: "24px 28px 36px", flex: 1 }}>
                      {openReport._loading ? (
                        <div style={{ textAlign: "center", color: "#9CA3AF", padding: 60 }}>불러오는 중...</div>
                      ) : (() => {
                        const rd = openReport.report_data || {};
                        const ai = rd.ai_descriptions?.error ? {} : (rd.ai_descriptions || {});
                        const d = rd.data || {};

                        const fmtEok = (n) => {
                          if (!n) return "-";
                          const v = Number(n);
                          if (v >= 1e12) return `${(v / 1e12).toFixed(1)}조`;
                          if (v >= 1e8) return `${Math.round(v / 1e8)}억`;
                          return `${Math.round(v / 1e4)}만`;
                        };
                        const fmtNum = (n) => n ? Number(n).toLocaleString() : "-";

                        const SectionTitle = ({ children }) => (
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #F3F4F6" }}>{children}</div>
                        );

                        const AiText = ({ text, noBottom }) => text ? (
                          <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.85, margin: noBottom ? "0" : "0 0 16px", whiteSpace: "pre-wrap" }}>{text}</p>
                        ) : null;

                        const InlineBar = ({ label, ratio, color, value }) => (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: "#6B7280", width: 80, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
                            <div style={{ flex: 1, height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${Math.min(ratio, 100)}%`, background: color, borderRadius: 4, transition: "width 0.4s" }} />
                            </div>
                            <span style={{ fontSize: 12, color: "#374151", width: 52, textAlign: "right", flexShrink: 0 }}>{value}</span>
                          </div>
                        );

                        return (
                          <>
                            {/* 상권 개요 AI */}
                            {ai["상권_개요"] && <AiText text={ai["상권_개요"]} />}

                            {/* 핵심 지표 */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                              {[
                                { label: "총 매출", value: fmtEok(d.총매출) },
                                { label: "유동인구", value: d.총유동인구 ? `${fmtNum(d.총유동인구)}명` : "-" },
                                { label: "주거인구", value: d.주거인구 ? `${fmtNum(d.주거인구)}명` : "-" },
                                { label: "직장인구", value: d.직장인구 ? `${fmtNum(d.직장인구)}명` : "-" },
                                { label: "행정동 수", value: d.행정동수 ? `${d.행정동수}개` : "-" },
                              ].filter(x => x.value !== "-").map(({ label, value }) => (
                                <div key={label} style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", border: "1px solid #F3F4F6" }}>
                                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3 }}>{label}</div>
                                  <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>{value}</div>
                                </div>
                              ))}
                            </div>

                            {/* 유동인구 AI */}
                            {ai["유동인구_분석"] && (
                              <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", marginBottom: 16, border: "1px solid #F3F4F6" }}>
                                <SectionTitle>유동인구 분석</SectionTitle>
                                <AiText text={ai["유동인구_분석"]} noBottom />
                              </div>
                            )}

                            {/* 성별 매출 */}
                            {d.성별 && (
                              <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", marginBottom: 16, border: "1px solid #F3F4F6" }}>
                                <SectionTitle>성별 매출 비율</SectionTitle>
                                <InlineBar label="남성" ratio={d.성별.남성비율 || 0} color="#3B82F6" value={`${d.성별.남성비율 || 0}%`} />
                                <InlineBar label="여성" ratio={d.성별.여성비율 || 0} color="#EC4899" value={`${d.성별.여성비율 || 0}%`} />
                              </div>
                            )}

                            {/* 주중/주말 */}
                            {d.주중주말 && (
                              <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", marginBottom: 16, border: "1px solid #F3F4F6" }}>
                                <SectionTitle>주중 / 주말 매출</SectionTitle>
                                {(() => {
                                  const max = Math.max(d.주중주말.주중 || 0, d.주중주말.주말 || 0, 1);
                                  return (
                                    <>
                                      <InlineBar label="주중" ratio={(d.주중주말.주중 / max) * 100} color="#3B82F6" value={fmtEok(d.주중주말.주중)} />
                                      <InlineBar label="주말" ratio={(d.주중주말.주말 / max) * 100} color="#F59E0B" value={fmtEok(d.주중주말.주말)} />
                                    </>
                                  );
                                })()}
                              </div>
                            )}

                            {/* 시간대별 + 요일별 매출 (통합) */}
                            {((d.시간대 && Object.keys(d.시간대).length > 0) || d.요일별) ? (
                              <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", marginBottom: 16, border: "1px solid #F3F4F6" }}>
                                {d.시간대 && Object.keys(d.시간대).length > 0 && (
                                  <>
                                    <SectionTitle>시간대별 매출</SectionTitle>
                                    {(() => {
                                      const entries = Object.entries(d.시간대);
                                      const max = Math.max(...entries.map(([, v]) => v), 1);
                                      return entries.map(([time, val]) => (
                                        <InlineBar key={time} label={time} ratio={(val / max) * 100} color="#6366F1" value={fmtEok(val)} />
                                      ));
                                    })()}
                                  </>
                                )}
                                {d.요일별 && (
                                  <>
                                    <SectionTitle style={{ marginTop: (d.시간대 && Object.keys(d.시간대).length > 0) ? 16 : 0 }}>요일별 매출</SectionTitle>
                                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                                      {["월","화","수","목","금","토","일"].map((day) => {
                                        const v = d.요일별[day] || 0;
                                        const max = Math.max(...["월","화","수","목","금","토","일"].map(k => d.요일별[k] || 0), 1);
                                        const h = Math.round((v / max) * 100);
                                        const isWeekend = day === "토" || day === "일";
                                        return (
                                          <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                                            <div style={{ width: "100%", height: 58, display: "flex", alignItems: "flex-end" }}>
                                              <div style={{ width: "100%", height: `${h}%`, background: isWeekend ? "#FD8A8A" : "#AEE2FF", borderRadius: "3px 3px 0 0", transition: "height 0.4s" }} />
                                            </div>
                                            <div style={{ fontSize: 10, color: isWeekend ? "#E05C5C" : "#9CA3AF" }}>{day}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {ai["소비_패턴"] && <div style={{ marginTop: 14 }}><AiText text={ai["소비_패턴"]} noBottom /></div>}
                                  </>
                                )}
                              </div>
                            ) : null}


                            {/* 인기 업종 + AI */}
                            {d.top_업종 && d.top_업종.length > 0 && (
                              <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", marginBottom: 16, border: "1px solid #F3F4F6" }}>
                                <SectionTitle>인기 업종 TOP {d.top_업종.length}</SectionTitle>
                                {d.top_업종.map((item, i) => (
                                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < d.top_업종.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                                    <span style={{ fontSize: 13, color: i < 3 ? "#1D4ED8" : "#374151", fontWeight: i < 3 ? 700 : 400 }}>
                                      <span style={{ marginRight: 12 }}>{i + 1}위</span>{item.업종 || item.통합카테고리}
                                    </span>
                                    <span style={{ fontSize: 13, color: "#6B7280" }}>{fmtEok(item.매출 || item.당월매출합)}</span>
                                  </div>
                                ))}
                                {ai["인기_업종"] && <div style={{ marginTop: 12 }}><AiText text={ai["인기_업종"]} noBottom /></div>}
                              </div>
                            )}

                            {/* 창업 추천 AI */}
                            {ai["창업_추천"] && (
                              <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "16px 20px", border: "1px solid #BFDBFE" }}>
                                <SectionTitle>창업 추천</SectionTitle>
                                <AiText text={ai["창업_추천"]} noBottom />
                              </div>
                            )}

                            {/* 업종 심화분석 */}
                            {d.category_data && (() => {
                              const cat = d.category_data;
                              const ages = ["10대","20대","30대","40대","50대","60대이상"];
                              const ageLabels = ["10대","20대","30대","40대","50대","60대+"];
                              return (
                                <>
                                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "2px solid #E5E7EB" }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
                                      {cat.category || rd.category} 심화 분석
                                    </div>

                                    {/* 기본 지표 */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
                                      {[
                                        { label: "AI 등급", value: cat.AI등급 || "-" },
                                        { label: "점포당 매출", value: fmtEok(cat.점포당매출) },
                                        { label: "점포 수", value: cat.점포수 ? `${cat.점포수}개` : "-" },
                                        { label: "프랜차이즈 비율", value: cat.프랜차이즈비율 ? `${cat.프랜차이즈비율}%` : "-" },
                                        { label: "개업률", value: cat.개업률 ? `${Number(cat.개업률).toFixed(1)}%` : "-" },
                                        { label: "폐업률", value: cat.폐업률 ? `${Number(cat.폐업률).toFixed(1)}%` : "-" },
                                      ].map(({ label, value }) => (
                                        <div key={label} style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px", border: "1px solid #F3F4F6" }}>
                                          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3 }}>{label}</div>
                                          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{value}</div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* 요일별 + 나이별 매출 (통합) */}
                                    {(cat.요일별매출 || cat.나이별매출) && (
                                      <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", marginBottom: 16, border: "1px solid #F3F4F6" }}>
                                        {cat.요일별매출 && (() => {
                                          const 요일목록 = ["월","화","수","목","금","토","일"];
                                          const values = 요일목록.map(k => cat.요일별매출[k] || 0);
                                          const max = Math.max(...values, 1);
                                          return (
                                            <>
                                              <SectionTitle>요일별 매출 ({cat.category || rd.category})</SectionTitle>
                                              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                                                {요일목록.map((day, i) => {
                                                  const v = values[i];
                                                  const h = Math.round((v / max) * 100);
                                                  const isWeekend = day === "토" || day === "일";
                                                  return (
                                                    <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                                                      <div style={{ width: "100%", height: 58, display: "flex", alignItems: "flex-end" }}>
                                                        <div style={{ width: "100%", height: `${h}%`, background: isWeekend ? "#FD8A8A" : "#AEE2FF", borderRadius: "3px 3px 0 0" }} />
                                                      </div>
                                                      <div style={{ fontSize: 10, color: isWeekend ? "#E05C5C" : "#9CA3AF" }}>{day}</div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </>
                                          );
                                        })()}
                                        {cat.나이별매출 && (() => {
                                          const values = ages.map(k => cat.나이별매출[k] || 0);
                                          const max = Math.max(...values, 1);
                                          return (
                                            <>
                                              <SectionTitle style={{ marginTop: cat.요일별매출 ? 16 : 0 }}>나이별 매출 ({cat.category || rd.category})</SectionTitle>
                                              <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 80 }}>
                                                {ages.map((age, i) => {
                                                  const v = values[i];
                                                  const h = Math.round((v / max) * 100);
                                                  const isTop = v === max;
                                                  return (
                                                    <div key={age} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                                                      <div style={{ width: "100%", height: 58, display: "flex", alignItems: "flex-end" }}>
                                                        <div style={{ width: "100%", height: `${h}%`, background: isTop ? "#93C6E7" : "#B9F3FC", borderRadius: "3px 3px 0 0" }} />
                                                      </div>
                                                      <div style={{ fontSize: 9, color: isTop ? "#4E8D9C" : "#9CA3AF", textAlign: "center" }}>{ageLabels[i]}</div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                              {ai["소비_패턴"] && <div style={{ marginTop: 14 }}><AiText text={ai["소비_패턴"]} noBottom /></div>}
                                            </>
                                          );
                                        })()}
                                      </div>
                                    )}


                                    {/* 비용·수익 AI */}
                                    {ai["비용_수익"] && (
                                      <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", marginBottom: 16, border: "1px solid #F3F4F6" }}>
                                        <SectionTitle>비용 · 수익 분석</SectionTitle>
                                        <AiText text={ai["비용_수익"]} noBottom />
                                      </div>
                                    )}

                                    {/* 기타 통계 AI */}
                                    {ai["기타_통계"] && (
                                      <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", marginBottom: 16, border: "1px solid #F3F4F6" }}>
                                        <SectionTitle>기타 통계</SectionTitle>
                                        <AiText text={ai["기타_통계"]} noBottom />
                                      </div>
                                    )}
                                  </div>
                                </>
                              );
                            })()}

                            {rd.ai_descriptions?.error && (
                              <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: "12px 0" }}>AI 분석을 불러오지 못했습니다.</p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── 계정 관리 ── */}
          {activeTab === "account" && (
            <>
              <h2 style={{ ...s.cardTitle, color: "#EF4444" }}>계정 관리</h2>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>
                계정을 탈퇴하면 모든 데이터가 삭제되며 복구할 수 없습니다.
              </p>
              {!showDeleteConfirm ? (
                <button style={s.deleteBtn} onClick={() => setShowDeleteConfirm(true)}>회원 탈퇴</button>
              ) : (
                <div style={s.deleteConfirmBox}>
                  <p style={{ margin: "0 0 16px", fontSize: 14, color: "#991B1B", fontWeight: 600, lineHeight: 1.6 }}>
                    정말 탈퇴하시겠어요?<br />
                    <span style={{ fontSize: 13, fontWeight: 400 }}>모든 데이터가 삭제되며 복구할 수 없습니다.</span>
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={s.deleteBtn} onClick={handleDelete}>탈퇴 확인</button>
                    <button style={s.ghostBtn} onClick={() => setShowDeleteConfirm(false)}>취소</button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

/* ── 작은 컴포넌트 ── */
function InfoRow({ label, children, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: last ? "none" : "1px solid #F3F4F6" }}>
      <span style={{ fontSize: 13, color: "#6B7280" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{children}</span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

/* ── 스타일 ── */
const s = {
  page: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Pretendard', sans-serif",
    background: "#F1F5F9",
    overflow: "hidden",
  },

  /* 사이드바 */
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: "linear-gradient(180deg, #0f1a30 0%, #1a2e4a 100%)",
    display: "flex",
    flexDirection: "column",
    padding: "28px 0",
    boxShadow: "2px 0 16px rgba(0,0,0,0.18)",
  },
  logoWrap: {
    padding: "0 24px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  logoSub: {
    fontSize: 12,
    color: "rgba(205,224,240,0.5)",
    letterSpacing: "0.05em",
  },
  userBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(160deg, #1a3a5c, #0f1a30)",
    border: "1.5px solid #8ab0cc",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#cde0f0",
    maxWidth: 120,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userType: {
    fontSize: 11,
    color: "rgba(205,224,240,0.45)",
    marginTop: 2,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "0 12px",
    flex: 1,
  },
  navItem: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 14px",
    background: "none",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: "rgba(205,224,240,0.55)",
    textAlign: "left",
    transition: "background 0.15s, color 0.15s",
  },
  navItemActive: {
    background: "rgba(255,255,255,0.09)",
    color: "#cde0f0",
    fontWeight: 700,
  },
  navIcon: { fontSize: 15, width: 20, textAlign: "center" },
  navActiveBar: {
    position: "absolute",
    left: 0, top: "50%",
    transform: "translateY(-50%)",
    width: 3, height: 18,
    background: "#2563EB",
    borderRadius: "0 3px 3px 0",
  },
  subNav: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    padding: "2px 0 4px 28px",
  },
  subNavItem: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 14px",
    background: "none",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    color: "rgba(205,224,240,0.45)",
    textAlign: "left",
    fontFamily: "inherit",
    transition: "background 0.15s, color 0.15s",
    width: "100%",
  },
  subNavItemActive: {
    background: "rgba(255,255,255,0.06)",
    color: "#93C6E7",
    fontWeight: 700,
  },
  subNavActiveBar: {
    position: "absolute",
    left: 0, top: "50%",
    transform: "translateY(-50%)",
    width: 2, height: 14,
    background: "#93C6E7",
    borderRadius: "0 2px 2px 0",
  },
  backBtn: {
    margin: "0 12px",
    padding: "10px 14px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    color: "rgba(205,224,240,0.35)",
    textAlign: "left",
    transition: "color 0.15s",
  },

  /* 콘텐츠 */
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "48px 56px",
    background: "#F8FAFC",
  },
  card: {
    width: "100%",
  },
  cardTitle: {
    margin: "0 0 28px",
    paddingBottom: 16,
    borderBottom: "1.5px solid #E2E8F0",
    fontSize: 20,
    fontWeight: 700,
    color: "#0C1A2E",
  },

  /* 정보 */
  readonlyBox: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    padding: "4px 16px",
    marginBottom: 24,
  },
  infoVal: { fontSize: 13, color: "#0C1A2E", fontWeight: 500 },
  devBadge: {
    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
    background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", letterSpacing: "0.05em",
  },

  /* 비밀번호 게이트 */
  gateWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 0",
    gap: 12,
  },
  gateBtn: {
    height: 46,
    padding: "0 22px",
    background: "#2563EB",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: "inherit",
  },
  gateDesc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 1.7,
    margin: 0,
  },

  /* 계정 삭제 */
  deleteBtn: {
    height: 42,
    background: "#FEF2F2",
    color: "#EF4444",
    border: "1.5px solid #FECACA",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    padding: "0 20px",
  },
  deleteConfirmBox: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 12,
    padding: 20,
  },

  /* 공통 폼 */
  form: { display: "flex", flexDirection: "column", gap: 16 },
  input: {
    height: 46,
    padding: "0 14px",
    border: "1.5px solid #E2E8F0",
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    color: "#0C1A2E",
    background: "#F8FAFC",
    boxSizing: "border-box",
    width: "100%",
    fontFamily: "inherit",
  },
  primaryBtn: {
    height: 48,
    background: "#2563EB",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
    fontFamily: "inherit",
  },
  ghostBtn: {
    height: 48,
    background: "transparent",
    color: "#64748B",
    border: "1.5px solid #E2E8F0",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    padding: "0 20px",
    fontFamily: "inherit",
  },
  /* 활동 내역 */
  subTabBar: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
  },
  subTab: {
    padding: "7px 16px",
    borderRadius: 20,
    border: "1.5px solid #E2E8F0",
    background: "transparent",
    fontSize: 13,
    fontWeight: 600,
    color: "#64748B",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  },
  subTabActive: {
    background: "#2563EB",
    borderColor: "#2563EB",
    color: "#fff",
  },
  postList: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  postRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 10,
    cursor: "pointer",
    transition: "background 0.12s",
    background: "transparent",
  },
  postBoard: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 10,
    background: "#EFF6FF",
    color: "#2563EB",
  },
  postTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: 500,
    color: "#0C1A2E",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  postMeta: {
    flexShrink: 0,
    fontSize: 12,
    color: "#94A3B8",
  },
  activityEmpty: {
    textAlign: "center",
    padding: "48px 0",
    fontSize: 14,
    color: "#94A3B8",
    margin: 0,
  },
  backChip: {
    width: 30, height: 30,
    background: "#F1F5F9",
    border: "none", borderRadius: 8,
    fontSize: 14, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit",
  },
  activitySelectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
  },
  activitySelectCard: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 8, padding: "24px 16px",
    background: "#F8FAFC",
    border: "1.5px solid #E2E8F0",
    borderRadius: 14,
    cursor: "pointer", fontFamily: "inherit",
    transition: "border-color 0.15s, box-shadow 0.15s",
    textAlign: "center",
  },
  activitySelectIcon: {
    width: 52, height: 52, borderRadius: "50%",
    background: "#fff",
    border: "1.5px solid #E2E8F0",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  activitySelectLabel: {
    fontSize: 14, fontWeight: 700, color: "#0C1A2E",
  },
  activitySelectDesc: {
    fontSize: 12, color: "#94A3B8",
  },
  activitySelectCount: {
    marginTop: 2,
    fontSize: 13, fontWeight: 700, color: "#2563EB",
  },
  postCard: {
    padding: "16px 18px",
    background: "#F8FAFC",
    border: "1.5px solid #E2E8F0",
    borderRadius: 12,
    cursor: "pointer",
    transition: "border-color 0.15s, box-shadow 0.15s",
    display: "flex", flexDirection: "column", gap: 6,
  },
  postCardHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  postCardDate: {
    fontSize: 12, color: "#94A3B8",
  },
  postCardTitle: {
    fontSize: 15, fontWeight: 700, color: "#0C1A2E",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  postCardPreview: {
    fontSize: 13, color: "#64748B", lineHeight: 1.5,
  },
  postCardMeta: {
    display: "flex", gap: 12,
    fontSize: 12, color: "#94A3B8", marginTop: 2,
  },

  err: { margin: 0, fontSize: 13, color: "#EF4444" },
  success: { margin: 0, fontSize: 13, color: "#10B981" },

  loadingWrap: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10, height: "100vh", color: "#6B7280", fontFamily: "Pretendard, sans-serif",
  },
  loadingDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#2563EB", animation: "pulse 1s infinite",
  },
};
