import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API = "http://localhost:8000";

// ── 게시판 목록 — 나중에 여기만 추가하면 됨 ──────────────
// pinned: true → 상단 고정 영역 / adminOnly: true → 어드민만 글쓰기 가능
const BOARDS = [
  { value: "notice", label: "공지", adminOnly: true,  pinned: true  },
  { value: "free",   label: "자유게시판", adminOnly: false, pinned: false },
  { value: "info",   label: "정보게시판", adminOnly: false, pinned: false },
];

const PINNED_BOARDS  = BOARDS.filter((b) => b.pinned);
const REGULAR_BOARDS = BOARDS.filter((b) => !b.pinned);

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

// ── DEV 배지 ────────────────────────────────────────────
function DevBadge() {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
      color: "#fff", letterSpacing: "0.05em", flexShrink: 0,
    }}>DEV</span>
  );
}

function BoardNavBtn({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block", width: "100%", padding: "10px 20px",
        border: "none", background: active ? "#EFF6FF" : "transparent",
        color: active ? "#3B82F6" : "#374151",
        fontWeight: active ? 700 : 400,
        fontSize: 14, textAlign: "left", cursor: "pointer",
        borderLeft: active ? "3px solid #3B82F6" : "3px solid transparent",
      }}
    >
      {item.label}
    </button>
  );
}

// ── 게시글 목록 페이지 ──────────────────────────────────
function PostList({ board, user, onWrite, onPostClick }) {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchType, setSearchType] = useState("title");
  const [searchInput, setSearchInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const PAGE_SIZE = 10;

  useEffect(() => {
    setPage(1);
    setSearchInput("");
    setSearchQ("");
  }, [board]);

  useEffect(() => {
    const params = new URLSearchParams({ board, page });
    if (searchQ) { params.set("search_type", searchType); params.set("q", searchQ); }
    authFetch(`${API}/api/community/posts/?${params}`)
      .then((r) => r.json())
      .then((d) => { setPosts(d.posts || []); setTotal(d.total || 0); });
  }, [board, page, searchQ, searchType]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQ(searchInput.trim());
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const isAdmin = user?.is_staff;
  const canWrite = board === 'free' || isAdmin;

  return (
    <div>
      {/* 상단 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
            {board === 'free' ? '자유게시판' : '공지게시판'}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
            {board === 'free' ? '자유롭게 글을 쓰는 공간입니다.' : '관리자가 작성하는 공지사항입니다.'}
          </p>
        </div>
        {canWrite && (
          <button style={writeBtnStyle} onClick={onWrite}>
            ✏️ 글쓰기
          </button>
        )}
      </div>

      {/* 테이블 헤더 */}
      <div style={tableHeaderStyle}>
        <span style={colNum}>번호</span>
        <span style={colTitle}>제목</span>
        <span style={colAuthor}>작성자</span>
        <span style={colDate}>작성일</span>
        <span style={colStat}>조회</span>
        <span style={colStat}>좋아요</span>
      </div>

      {/* 게시글 목록 */}
      {posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF", fontSize: 14 }}>
          {searchQ ? `"${searchQ}" 검색 결과가 없습니다.` : "아직 게시글이 없습니다."}
        </div>
      ) : (
        posts.map((post, i) => (
          <TableRow key={post.id} onClick={() => onPostClick(post.id)}>
            <span style={colNum}>{total - (page - 1) * PAGE_SIZE - i}</span>
            <span style={{ ...colTitle, fontWeight: 500, color: "#111827", display: "flex", alignItems: "center", gap: 5 }}>
              {post.title}
              {post.comment_count > 0 && (
                <span style={{ fontSize: 12, color: "#3B82F6", flexShrink: 0 }}>[{post.comment_count}]</span>
              )}
              {post.has_image && (
                <span style={{ fontSize: 12, flexShrink: 0 }} title="이미지 포함">🖼️</span>
              )}
            </span>
            <span style={{ ...colAuthor, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              {post.author}{post.author_is_staff && <DevBadge />}
            </span>
            <span style={colDate}>{post.created_at}</span>
            <span style={colStat}>{post.view_count}</span>
            <span style={{ ...colStat, color: "#EF4444" }}>♥ {post.like_count}</span>
          </TableRow>
        ))
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 24 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 34, height: 34, borderRadius: 8, border: "1.5px solid",
                borderColor: p === page ? "#3B82F6" : "#E5E7EB",
                background: p === page ? "#3B82F6" : "#fff",
                color: p === page ? "#fff" : "#374151",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* 검색 바 */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 0, marginTop: 20, borderRadius: 10, overflow: "hidden", border: "1.5px solid #E5E7EB", background: "#fff" }}>
        <select
          value={searchType}
          onChange={(e) => { setSearchType(e.target.value); setPage(1); setSearchQ(""); setSearchInput(""); }}
          style={{ padding: "0 12px", border: "none", borderRight: "1.5px solid #E5E7EB", background: "#F9FAFB", fontSize: 13, color: "#374151", fontWeight: 600, cursor: "pointer", outline: "none", height: 42, minWidth: 90 }}
        >
          <option value="title">제목만</option>
          <option value="author">작성자</option>
        </select>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="검색어를 입력해주세요"
          style={{ flex: 1, padding: "0 14px", border: "none", fontSize: 14, outline: "none", color: "#111827", background: "#fff", height: 42 }}
        />
        <button type="submit" style={{ width: 46, height: 42, background: "#10B981", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </form>
    </div>
  );
}

// ── 게시글 상세 페이지 ──────────────────────────────────
function PostDetail({ postId, user, onBack, onEdit }) {
  const [post, setPost] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const fetchPost = () => {
    authFetch(`${API}/api/community/posts/${postId}/`)
      .then((r) => r.json())
      .then(setPost);
  };

  useEffect(() => { fetchPost(); }, [postId]);

  const handleLike = async () => {
    const res = await authFetch(`${API}/api/community/posts/${postId}/like/`, { method: "POST" });
    const data = await res.json();
    setPost((p) => ({ ...p, liked: data.liked, like_count: data.like_count }));
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setLoading(true);
    await authFetch(`${API}/api/community/posts/${postId}/comments/`, {
      method: "POST",
      body: JSON.stringify({ content: commentInput }),
    });
    setCommentInput("");
    setLoading(false);
    fetchPost();
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠어요?")) return;
    await authFetch(`${API}/api/community/comments/${commentId}/`, { method: "DELETE" });
    fetchPost();
  };

  const handleDeletePost = async () => {
    if (!window.confirm("게시글을 삭제하시겠어요?")) return;
    await authFetch(`${API}/api/community/posts/${postId}/`, { method: "DELETE" });
    onBack();
  };

  if (!post) return <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>불러오는 중...</div>;

  const isAuthor = user?.id === post.author_id;
  const isAdmin = user?.is_staff;

  return (
    <div>
      {/* 뒤로가기 */}
      <button onClick={onBack} style={backBtnStyle}>← 목록으로</button>

      {/* 게시글 헤더 */}
      <div style={{ borderBottom: "2px solid #E5E7EB", paddingBottom: 16, marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 700, color: "#111827" }}>{post.title}</h2>
        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#6B7280" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            작성자: <b style={{ color: "#374151" }}>{post.author}</b>
            {post.author_is_staff && <DevBadge />}
          </span>
          <span>{post.created_at}</span>
          <span>조회 {post.view_count}</span>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ minHeight: 200, fontSize: 15, lineHeight: 1.8, color: "#111827", marginBottom: post.image ? 20 : 32, whiteSpace: "pre-wrap" }}>
        {post.content}
      </div>

      {/* 첨부 이미지 */}
      {post.image && (
        <div style={{ marginBottom: 32 }}>
          <img
            src={post.image}
            alt="첨부 이미지"
            onClick={() => setLightbox(true)}
            style={{ maxWidth: "100%", borderRadius: 10, border: "1px solid #E5E7EB", cursor: "zoom-in", display: "block" }}
          />
        </div>
      )}

      {/* 라이트박스 */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, cursor: "zoom-out",
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
            style={{
              position: "fixed", top: 20, right: 24,
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)",
              color: "#fff", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
          >✕</button>
          <img
            src={post.image}
            alt="확대 이미지"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "60vw", height: "60vh",
              objectFit: "contain",
              borderRadius: 12, boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
              cursor: "default",
            }}
          />
        </div>
      )}

      {/* 좋아요 */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
        <button onClick={handleLike} style={{
          padding: "10px 28px", borderRadius: 20, border: "1.5px solid",
          borderColor: post.liked ? "#EF4444" : "#E5E7EB",
          background: post.liked ? "#FEF2F2" : "#fff",
          color: post.liked ? "#EF4444" : "#6B7280",
          fontSize: 15, fontWeight: 600, cursor: "pointer",
        }}>
          ❤️ {post.like_count}
        </button>
      </div>

      {/* 수정/삭제 버튼 */}
      {(isAuthor || isAdmin) && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 24 }}>
          {isAuthor && (
            <button style={ghostSmBtnStyle} onClick={() => onEdit(post.id)}>수정</button>
          )}
          <button style={deleteSmBtnStyle} onClick={handleDeletePost}>삭제</button>
        </div>
      )}

      {/* 댓글 목록 */}
      <div style={{ borderTop: "2px solid #E5E7EB", paddingTop: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111827" }}>
          댓글 {post.comments.length}개
        </h3>
        {post.comments.map((c) => (
          <div key={c.id} style={commentRowStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>{c.author}</span>
                {c.author_is_staff && <DevBadge />}
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>{c.created_at}</span>
              </div>
              {(user?.id === c.author_id || isAdmin) && (
                <button style={deleteSmBtnStyle} onClick={() => handleDeleteComment(c.id)}>삭제</button>
              )}
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{c.content}</p>
          </div>
        ))}

        {/* 댓글 입력 */}
        <form onSubmit={handleCommentSubmit} style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <textarea
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="댓글을 입력하세요"
            style={commentInputStyle}
            rows={2}
          />
          <button type="submit" style={writeBtnStyle} disabled={loading}>
            {loading ? "..." : "등록"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── 글쓰기 / 수정 폼 ────────────────────────────────────
function PostForm({ board: defaultBoard, editPostId, user, onDone }) {
  const [form, setForm] = useState({ title: "", content: "", board: defaultBoard || "free", image: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editPostId) return;
    authFetch(`${API}/api/community/posts/${editPostId}/`)
      .then((r) => r.json())
      .then((d) => setForm({ title: d.title, content: d.content, board: d.board, image: d.image || "" }));
  }, [editPostId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // 2MB 제한
    if (file.size > 2 * 1024 * 1024) {
      setError("이미지는 2MB 이하만 업로드 가능합니다.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = editPostId
      ? await authFetch(`${API}/api/community/posts/${editPostId}/`, {
          method: "PUT", body: JSON.stringify(form),
        })
      : await authFetch(`${API}/api/community/posts/`, {
          method: "POST", body: JSON.stringify(form),
        });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "오류가 발생했습니다."); return; }
    onDone(data.id);
  };

  return (
    <div>
      <button onClick={() => onDone(null)} style={backBtnStyle}>← 취소</button>
      <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: "#111827" }}>
        {editPostId ? "게시글 수정" : "글쓰기"}
      </h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {!editPostId && (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>게시판</label>
            <select
              value={form.board}
              onChange={(e) => setForm((p) => ({ ...p, board: e.target.value }))}
              style={{
                height: 44, padding: "0 14px", border: "1.5px solid #E5E7EB",
                borderRadius: 10, fontSize: 14, color: "#111827", background: "#fff",
                outline: "none", cursor: "pointer", fontFamily: "inherit",
                appearance: "auto",
              }}
            >
              {BOARDS.filter((b) => !b.adminOnly || user?.is_staff).map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
        )}
        <input
          style={inputStyle} placeholder="제목을 입력하세요" required
          value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />
        <textarea
          style={{ ...inputStyle, height: 300, padding: 14, resize: "vertical" }}
          placeholder="내용을 입력하세요" required rows={12}
          value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
        />

        {/* 이미지 업로드 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            이미지 첨부 <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(선택, 2MB 이하)</span>
          </label>
          <label style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
            border: "1.5px dashed #D1D5DB", borderRadius: 8, cursor: "pointer",
            background: "#F9FAFB", color: "#6B7280", fontSize: 13, fontWeight: 500,
          }}>
            📎 파일 선택
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
          </label>
          {form.image && (
            <div style={{ marginTop: 10, position: "relative", display: "inline-block" }}>
              <img src={form.image} alt="preview" style={{ maxWidth: "100%", maxHeight: 240, borderRadius: 8, border: "1px solid #E5E7EB", display: "block" }} />
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, image: "" }))}
                style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
            </div>
          )}
        </div>

        {error && <p style={{ margin: 0, fontSize: 13, color: "#EF4444" }}>{error}</p>}
        <button type="submit" style={writeBtnStyle} disabled={loading}>
          {loading ? "처리 중..." : editPostId ? "수정 완료" : "등록하기"}
        </button>
      </form>
    </div>
  );
}

// ── 메인 CommunityPage ──────────────────────────────────
export default function CommunityPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const view = searchParams.get("view") || "list";       // list | detail | write | edit
  const board = searchParams.get("board") || "free";     // free | notice
  const postId = searchParams.get("post");
  const editId = searchParams.get("edit");

  // 로그인 유저 정보 — localStorage로 즉시 렌더, /me API로 백그라운드 검증
  const stored = localStorage.getItem("user");
  const [user, setUser] = useState(() => {
    try { return stored ? JSON.parse(stored) : null; } catch { return null; }
  });

  useEffect(() => {
    if (!stored) { navigate("/login"); return; }
    authFetch(`${API}/api/accounts/me/`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) { navigate("/login"); return; }
        setUser(data);
      });
  }, []);

  if (!user) { navigate("/login"); return null; }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "'Pretendard', sans-serif", background: "#F9FAFB" }}>

      {/* ── NODAJI 로고 헤더 ── */}
      <header style={{
        background: "linear-gradient(135deg, #0f1a30, #162040)",
        borderBottom: "1px solid #1e2d4a",
        padding: "0 32px",
        height: 64,
        display: "flex", alignItems: "center",
        flexShrink: 0,
        position: "relative", overflow: "hidden",
      }}>
        {/* 웨이브 배경 */}
        <svg viewBox="0 0 1200 64" width="100%" height="64" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} fill="none">
          <path d="M0 48 Q100 38,200 48 Q300 58,400 48 Q500 38,600 48 Q700 58,800 48 Q900 38,1000 48 Q1100 58,1200 44" stroke="#93c5fd" strokeWidth="1.5" opacity=".15" strokeLinecap="round"/>
          <path d="M0 54 Q120 42,240 54 Q360 66,480 54 Q600 42,720 54 Q840 66,960 54 Q1080 42,1200 50" stroke="#60a5fa" strokeWidth="1" opacity=".08" strokeLinecap="round"/>
        </svg>

        {/* 로고 SVG */}
        <svg viewBox="0 0 360 56" width="200" height="56" fill="none" style={{ position: "relative", zIndex: 1 }}>
          <text x="0" y="42" fontFamily="Montserrat, sans-serif" fontWeight="900" fontSize="46" fill="#bfdbfe" letterSpacing="-1">NODAJI</text>
          <g transform="translate(280,6) rotate(-15, 16, 22)">
            <circle cx="16" cy="22" r="16" stroke="#60a5fa" strokeWidth="1" opacity=".5"/>
            <circle cx="16" cy="22" r="11" stroke="#60a5fa" strokeWidth=".4" opacity=".2"/>
            <line x1="16" y1="8" x2="16" y2="12" stroke="#60a5fa" strokeWidth="1" opacity=".6"/>
            <line x1="16" y1="32" x2="16" y2="36" stroke="#60a5fa" strokeWidth="1" opacity=".6"/>
            <line x1="2" y1="22" x2="6" y2="22" stroke="#60a5fa" strokeWidth="1" opacity=".6"/>
            <line x1="26" y1="22" x2="30" y2="22" stroke="#60a5fa" strokeWidth="1" opacity=".6"/>
            <polygon points="16,8 14,22 16,19 18,22" fill="#ef4444" opacity=".9"/>
            <polygon points="16,36 14,22 16,25 18,22" fill="#bfdbfe" opacity=".3"/>
            <circle cx="16" cy="22" r="2.5" fill="#3b82f6"/>
            <circle cx="16" cy="22" r="1" fill="#0f1a30"/>
          </g>
        </svg>

        {/* 구분선 + 커뮤니티 레이블 */}
        <div style={{ width: 1, height: 28, background: "rgba(148,163,184,0.25)", margin: "0 16px", position: "relative", zIndex: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", letterSpacing: "0.05em", position: "relative", zIndex: 1 }}>커뮤니티</span>

        {/* 우측 메인으로 버튼 */}
        <button
          onClick={() => navigate("/")}
          style={{
            marginLeft: "auto", position: "relative", zIndex: 1,
            padding: "6px 14px", background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(148,163,184,0.2)", borderRadius: 8,
            color: "#94a3b8", fontSize: 13, cursor: "pointer",
          }}
        >← 메인으로</button>
      </header>

      <div style={pageStyle}>
      {/* 사이드바 */}
      <aside style={sidebarStyle}>
        <div style={{ padding: "16px 16px 10px", fontWeight: 700, fontSize: 13, color: "#9CA3AF", letterSpacing: "0.06em", borderBottom: "1px solid #E5E7EB" }}>
          MENU
        </div>
        <nav style={{ padding: "8px 0" }}>
          {/* 고정 게시판 (공지) */}
          {PINNED_BOARDS.map((item) => (
            <BoardNavBtn key={item.value} item={item} active={board === item.value} onClick={() => setSearchParams({ board: item.value })} />
          ))}

          {/* 구분선 */}
          <div style={{ margin: "8px 16px", borderTop: "1px solid #E5E7EB" }} />
          <div style={{ padding: "2px 20px 6px", fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em" }}>
            게시판
          </div>

          {/* 일반 게시판 */}
          {REGULAR_BOARDS.map((item) => (
            <BoardNavBtn key={item.value} item={item} active={board === item.value} onClick={() => setSearchParams({ board: item.value })} />
          ))}
        </nav>
      </aside>

      {/* 본문 */}
      <main style={mainStyle}>
        {view === "list" && (
          <PostList
            board={board}
            user={user}
            onWrite={() => setSearchParams({ board, view: "write" })}
            onPostClick={(id) => setSearchParams({ board, view: "detail", post: id })}
          />
        )}
        {view === "detail" && postId && (
          <PostDetail
            postId={postId}
            user={user}
            onBack={() => setSearchParams({ board })}
            onEdit={(id) => setSearchParams({ board, view: "edit", edit: id })}
          />
        )}
        {view === "write" && (
          <PostForm
            board={board}
            user={user}
            onDone={(id) => id ? setSearchParams({ board, view: "detail", post: id }) : setSearchParams({ board })}
          />
        )}
        {view === "edit" && editId && (
          <PostForm
            editPostId={editId}
            user={user}
            onDone={(id) => id ? setSearchParams({ board, view: "detail", post: id }) : setSearchParams({ board })}
          />
        )}
      </main>
    </div>
    </div>
  );
}

// ── 테이블 행 (hover 효과용 컴포넌트) ───────────────────
function TableRow({ children, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center",
        padding: "13px 16px",
        borderBottom: "1px solid #F3F4F6",
        cursor: "pointer",
        background: hovered ? "#F0F7FF" : "#fff",
        transition: "background 0.12s",
      }}
    >
      {children}
    </div>
  );
}

/* ── 스타일 ── */
const pageStyle = {
  display: "flex", flex: 1,
};
const sidebarStyle = {
  width: 200, minHeight: "100vh", background: "#fff",
  borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column",
  flexShrink: 0,
};
const mainStyle = {
  flex: 1, padding: "32px 40px", maxWidth: 900,
};
const tableHeaderStyle = {
  display: "flex", alignItems: "center", padding: "11px 16px",
  background: "#F3F4F6", borderRadius: "10px 10px 0 0",
  fontSize: 13, fontWeight: 700, color: "#6B7280",
  borderBottom: "2px solid #E5E7EB",
};
// 컬럼 고정 너비
const colNum    = { width: 60,  flexShrink: 0, textAlign: "center", fontSize: 13, color: "#9CA3AF" };
const colTitle  = { flex: 1,    minWidth: 0,   fontSize: 14, color: "#374151" };
const colAuthor = { width: 120, flexShrink: 0, textAlign: "center", fontSize: 13, color: "#6B7280" };
const colDate   = { width: 100, flexShrink: 0, textAlign: "center", fontSize: 13, color: "#6B7280" };
const colStat   = { width: 60,  flexShrink: 0, textAlign: "center", fontSize: 13, color: "#6B7280" };
const writeBtnStyle = {
  height: 40, padding: "0 20px", background: "#3B82F6", color: "#fff",
  border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
  whiteSpace: "nowrap",
};
const backBtnStyle = {
  marginBottom: 20, padding: "8px 14px", background: "#fff",
  border: "1.5px solid #E5E7EB", borderRadius: 8,
  fontSize: 13, color: "#6B7280", cursor: "pointer",
};
const ghostSmBtnStyle = {
  height: 32, padding: "0 14px", background: "#fff", color: "#374151",
  border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: 13, cursor: "pointer",
};
const deleteSmBtnStyle = {
  height: 32, padding: "0 14px", background: "#FEF2F2", color: "#EF4444",
  border: "1.5px solid #FECACA", borderRadius: 6, fontSize: 13, cursor: "pointer",
};
const commentRowStyle = {
  padding: "14px 0", borderBottom: "1px solid #F3F4F6",
};
const commentInputStyle = {
  flex: 1, padding: "10px 14px", border: "1.5px solid #E5E7EB",
  borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical",
  fontFamily: "inherit",
};
const inputStyle = {
  height: 44, padding: "0 14px", border: "1.5px solid #E5E7EB",
  borderRadius: 10, fontSize: 14, outline: "none", color: "#111827",
  background: "#fff", boxSizing: "border-box", width: "100%",
  fontFamily: "inherit",
};
