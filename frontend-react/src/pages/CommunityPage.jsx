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
            글쓰기
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
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 0, marginTop: 20, borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", alignItems: "center" }}>
        <select
          value={searchType}
          onChange={(e) => { setSearchType(e.target.value); setPage(1); setSearchQ(""); setSearchInput(""); }}
          style={{ padding: "0 28px 0 12px", border: "none", borderRight: "1.5px solid #E5E7EB", background: "#F9FAFB", fontSize: 13, color: "#374151", fontWeight: 600, cursor: "pointer", outline: "none", height: 42, minWidth: 80, borderRadius: "8px 0 0 8px", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
        >
          <option value="title">제목</option>
          <option value="author">작성자</option>
        </select>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="검색어를 입력해주세요"
          style={{ flex: 1, padding: "0 14px", border: "none", fontSize: 14, outline: "none", color: "#111827", background: "#fff", height: 42 }}
        />
        <button type="submit" style={{ width: 52, height: 42, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: "0 8px 8px 0" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "#6B7280" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            작성자: <b style={{ color: "#374151" }}>{post.author}</b>
            {post.author_is_staff && <DevBadge />}
          </span>
          <span>{post.created_at}</span>
          <span>조회 {post.view_count}</span>
          {(isAuthor || isAdmin) && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {isAuthor && <button style={ghostSmBtnStyle} onClick={() => onEdit(post.id)}>수정</button>}
              <button style={deleteSmBtnStyle} onClick={handleDeletePost}>삭제</button>
            </div>
          )}
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
        <form onSubmit={handleCommentSubmit} style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "stretch" }}>
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="댓글을 입력하세요"
            style={commentInputStyle}
          />
          <button type="submit" disabled={loading} style={{ width: 52, height: 52, background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "center" }}>
            {loading
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
            }
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

  const [isDragOver, setIsDragOver] = useState(false);

  const processImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) { setError("이미지는 2MB 이하만 업로드 가능합니다."); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => { processImageFile(e.target.files[0]); e.target.value = ""; };

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragOver(false);
    processImageFile(e.dataTransfer.files[0]);
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
                height: 44, padding: "0 32px 0 14px", border: "1.5px solid #E5E7EB",
                borderRadius: 10, fontSize: 14, color: "#111827", background: "#fff",
                outline: "none", cursor: "pointer", fontFamily: "inherit",
                appearance: "none", WebkitAppearance: "none",
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
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
          style={{ ...inputStyle, height: 300, padding: 14, resize: "none" }}
          placeholder="내용을 입력하세요" required rows={12}
          value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
        />

        {/* 이미지 업로드 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            이미지 첨부 <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(선택, 2MB 이하)</span>
          </label>
          {form.image ? (
            <div style={{ position: "relative", display: "inline-block" }}>
              <img src={form.image} alt="preview" style={{ maxWidth: "100%", maxHeight: 240, borderRadius: 8, border: "1px solid #E5E7EB", display: "block" }} />
              <button type="button" onClick={() => setForm((p) => ({ ...p, image: "" }))}
                style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              style={{
                border: `2px dashed ${isDragOver ? "#3B82F6" : "#D1D5DB"}`,
                borderRadius: 10, background: isDragOver ? "#EFF6FF" : "#F9FAFB",
                padding: "16px 20px", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 8, transition: "all 0.15s",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isDragOver ? "#3B82F6" : "#9CA3AF"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
              </svg>
              <p style={{ margin: 0, fontSize: 13, color: "#6B7280", textAlign: "center" }}>
                이미지를 여기에 끌어다 놓거나
              </p>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 18px", border: "1.5px solid #D1D5DB", borderRadius: 7, cursor: "pointer", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600 }}>
                파일 선택
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </label>
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

        {/* 로고 SVG — 사이드바 너비(200px)에서 헤더 padding(32px)을 뺀 168px 고정 */}
        <div onClick={() => navigate("/map")} style={{ width: 168, flexShrink: 0, position: "relative", zIndex: 1, cursor: "pointer" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 101.10 31.50" width="140" height="44" overflow="visible">
            <text x="0" y="23.50" fontFamily="Arial Black, Helvetica Neue, Arial, sans-serif" fontWeight="900" fontSize="20" letterSpacing="1.20" fill="#cde0f0">NODAJI</text>
            <g transform="translate(91.60,3.00) rotate(35)">
              <circle cx="0" cy="0" r="5.5" fill="none" stroke="#8ab0cc" strokeWidth="0.44" opacity="0.80"/>
              <line x1="0" y1="-4.84" x2="0" y2="-3.03" stroke="#8ab0cc" strokeWidth="0.55" opacity="0.65"/>
              <line x1="0" y1="4.84" x2="0" y2="3.03" stroke="#8ab0cc" strokeWidth="0.55" opacity="0.65"/>
              <line x1="-4.84" y1="0" x2="-3.03" y2="0" stroke="#8ab0cc" strokeWidth="0.55" opacity="0.65"/>
              <line x1="4.84" y1="0" x2="3.03" y2="0" stroke="#8ab0cc" strokeWidth="0.55" opacity="0.65"/>
              <polygon points="0,-4.51 0.82,0 0,0.88 -0.82,0" fill="#d94e30"/>
              <polygon points="0,4.51 0.82,0 0,-0.88 -0.82,0" fill="#b8d0e8" opacity="0.85"/>
              <circle cx="0" cy="0" r="0.66" fill="#1a2440"/>
              <circle cx="0" cy="0" r="0.28" fill="#8ab0cc"/>
            </g>
          </svg>
        </div>

        {/* 구분선 + 커뮤니티 레이블 — 사이드바 경계에 맞춰 정렬 */}
        <div style={{ width: 1, height: 28, background: "rgba(148,163,184,0.25)", marginRight: 16, position: "relative", zIndex: 1 }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: "#cde0f0", letterSpacing: "0.03em", position: "relative", zIndex: 1 }}>커뮤니티</span>

      </header>

      <div style={pageStyle}>
      {/* 사이드바 */}
      <aside style={sidebarStyle}>
        <div style={{ padding: "16px 16px 10px", fontWeight: 700, fontSize: 16, color: "#6B7280", letterSpacing: "0.06em", borderBottom: "1px solid #E5E7EB" }}>
          MENU
        </div>
        <nav style={{ padding: "8px 0" }}>
          {/* 고정 게시판 (공지) */}
          {PINNED_BOARDS.map((item) => (
            <BoardNavBtn key={item.value} item={item} active={board === item.value} onClick={() => setSearchParams({ board: item.value }, { replace: true })} />
          ))}

          {/* 구분선 */}
          <div style={{ margin: "8px 16px", borderTop: "1px solid #E5E7EB" }} />
          <div style={{ padding: "2px 20px 6px", fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em" }}>
            게시판
          </div>

          {/* 일반 게시판 */}
          {REGULAR_BOARDS.map((item) => (
            <BoardNavBtn key={item.value} item={item} active={board === item.value} onClick={() => setSearchParams({ board: item.value }, { replace: true })} />
          ))}
        </nav>
      </aside>

      {/* 본문 */}
      <main style={mainStyle}>
        {view === "list" && (
          <PostList
            board={board}
            user={user}
            onWrite={() => setSearchParams({ board, view: "write" }, { replace: true })}
            onPostClick={(id) => setSearchParams({ board, view: "detail", post: id }, { replace: true })}
          />
        )}
        {view === "detail" && postId && (
          <PostDetail
            postId={postId}
            user={user}
            onBack={() => setSearchParams({ board }, { replace: true })}
            onEdit={(id) => setSearchParams({ board, view: "edit", edit: id }, { replace: true })}
          />
        )}
        {view === "write" && (
          <PostForm
            board={board}
            user={user}
            onDone={(id) => id ? setSearchParams({ board, view: "detail", post: id }, { replace: true }) : setSearchParams({ board }, { replace: true })}
          />
        )}
        {view === "edit" && editId && (
          <PostForm
            editPostId={editId}
            user={user}
            onDone={(id) => id ? setSearchParams({ board, view: "detail", post: id }, { replace: true }) : setSearchParams({ board }, { replace: true })}
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
const colTitle  = { flex: 1,    minWidth: 0,   fontSize: 14, color: "#374151", textAlign: "center", justifyContent: "center" };
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
  flex: 1, height: 52, padding: "0 14px", border: "1.5px solid #E5E7EB",
  borderRadius: 10, fontSize: 14, outline: "none", resize: "none",
  fontFamily: "inherit", background: "#fff", color: "#111827",
};
const inputStyle = {
  height: 44, padding: "0 14px", border: "1.5px solid #E5E7EB",
  borderRadius: 10, fontSize: 14, outline: "none", color: "#111827",
  background: "#fff", boxSizing: "border-box", width: "100%",
  fontFamily: "inherit",
};
