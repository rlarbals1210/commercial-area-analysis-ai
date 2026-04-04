import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// 카카오/네이버 로그인 후 백엔드가 이 페이지로 리다이렉트함
// URL 예시: /social-callback?access=xxx&refresh=yyy
//
// 흐름:
//   1. 쿼리스트링에서 access/refresh 토큰 꺼내기
//   2. localStorage에 저장
//   3. 지도 페이지로 이동
export default function SocialCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const access = searchParams.get("access");
    const refresh = searchParams.get("refresh");

    const user = searchParams.get("user");
    if (access && refresh) {
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      if (user) localStorage.setItem("user", decodeURIComponent(user));
      navigate("/", { replace: true });
    } else {
      // 토큰이 없으면 로그인 페이지로
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Pretendard, sans-serif" }}>
      <p style={{ color: "#6B7280", fontSize: 15 }}>로그인 처리 중...</p>
    </div>
  );
}
