import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const CSS = `
  .lp-root *, .lp-root *::before, .lp-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lp-root {
    font-family: 'Noto Sans KR', sans-serif;
    background: #060e1e;
    color: #ffffff;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    --navy-950: #060e1e;
    --navy-900: #0a1628;
    --navy-800: #0d2040;
    --navy-700: #122d5a;
    --navy-600: #1a3f7a;
    --sky-400: #38bdf8;
    --sky-300: #7dd3fc;
    --sky-200: #bae6fd;
    --sky-500: #0ea5e9;
    --sky-600: #0284c7;
    --gray-100: #f1f5f9;
    --gray-300: #cbd5e1;
    --gray-400: #94a3b8;
    --gray-500: #64748b;
    --red-400: #f87171;
    --amber-400: #fbbf24;
    --green-400: #4ade80;
    --teal-400: #2dd4bf;
  }
  .lp-root nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 0 60px; height: 80px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(6,14,30,0.85); backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(56,189,248,0.08); transition: background 0.3s;
  }
  .lp-nav-inner { max-width: 1280px; width: 100%; display: flex; align-items: center; justify-content: space-between; }
  .lp-root nav.scrolled { background: rgba(6,14,30,0.97); }
  .lp-nav-logo img { height: 40px; filter: brightness(1.1); }
  .lp-nav-links { display: flex; align-items: center; gap: 40px; list-style: none; }
  .lp-nav-links a { color: #cbd5e1; text-decoration: none; font-size: 15px; font-weight: 500; letter-spacing: 0.02em; transition: color 0.2s; }
  .lp-nav-links a:hover { color: #7dd3fc; }
  .lp-nav-cta {
    background: #0ea5e9; color: white; border: none;
    padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600;
    font-family: 'Noto Sans KR', sans-serif; cursor: pointer; transition: background 0.2s, transform 0.1s; letter-spacing: 0.02em;
  }
  .lp-nav-cta:hover { background: #38bdf8; transform: translateY(-1px); }

  .lp-hero {
    position: relative; min-height: 100vh;
    display: flex; flex-direction: column; justify-content: center;
    padding: 120px 80px 80px; overflow: hidden;
  }
  .lp-hero::before {
    content: ''; position: absolute; inset: 0;
    background-image: linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px);
    background-size: 60px 60px; pointer-events: none;
  }
  .lp-hero::after {
    content: ''; position: absolute; top: -20%; right: -10%; width: 800px; height: 800px;
    background: radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 65%); pointer-events: none;
  }
  .lp-hero-content { position: relative; z-index: 2; max-width: 760px; }
  .lp-hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.25);
    border-radius: 100px; padding: 6px 16px; font-size: 12px; font-weight: 600;
    color: #7dd3fc; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 28px;
  }
  .lp-badge-dot { width: 6px; height: 6px; background: #38bdf8; border-radius: 50%; animation: lp-pulse 2s ease-in-out infinite; }
  @keyframes lp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }
  .lp-hero-title { font-family: 'Noto Sans KR', sans-serif; font-size: clamp(40px,5vw,68px); font-weight: 900; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 24px; word-break: keep-all; }
  .lp-hero-title .accent { color: #38bdf8; }
  .lp-hero-sub { font-size: 17px; font-weight: 400; color: #94a3b8; line-height: 1.75; margin-bottom: 48px; max-width: 540px; word-break: keep-all; }
  .lp-hero-actions { display: flex; gap: 16px; align-items: center; margin-bottom: 72px; }
  .lp-btn-primary {
    background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; border: none;
    padding: 16px 36px; border-radius: 8px; font-size: 16px; font-weight: 700;
    font-family: 'Noto Sans KR', sans-serif; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 8px 32px rgba(14,165,233,0.35); letter-spacing: 0.02em;
  }
  .lp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(14,165,233,0.5); }
  .lp-btn-secondary {
    background: transparent; color: #cbd5e1; border: 1px solid rgba(255,255,255,0.12);
    padding: 16px 32px; border-radius: 8px; font-size: 15px; font-weight: 500;
    font-family: 'Noto Sans KR', sans-serif; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; gap: 8px; letter-spacing: 0.02em;
  }
  .lp-btn-secondary:hover { border-color: #38bdf8; color: #7dd3fc; }
  .lp-hero-stat-row { display: flex; gap: 48px; padding-top: 36px; border-top: 1px solid rgba(255,255,255,0.06); }
  .lp-hero-stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 700; color: #38bdf8; line-height: 1; margin-bottom: 6px; }
  .lp-hero-stat-label { font-size: 13px; color: #94a3b8; line-height: 1.4; word-break: keep-all; }

  .lp-hero-layout { max-width: 1280px; margin: 0 auto; width: 100%; position: relative; min-height: calc(100vh - 200px); display: flex; flex-direction: column; justify-content: center; }
  .lp-hero-visual { position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 720px; height: 490px; z-index: 2; }
  .lp-globe-wrap { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 240px; height: 240px; }
  .lp-globe-ping { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 10px; height: 10px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 14px #38bdf8; z-index: 5; }
  .lp-globe-ping::after { content: ''; position: absolute; inset: -6px; border-radius: 50%; border: 1px solid rgba(56,189,248,0.5); animation: lp-pingRing 2s ease-out infinite; }
  @keyframes lp-pingRing { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.8);opacity:0} }
  .lp-holo-beams { position: absolute; inset: 0; pointer-events: none; z-index: 3; }
  .lp-map-panel {
    position: absolute; right: 0; top: 50%; transform: translateY(-50%);
    width: 415px; height: 454px; background: rgba(6,14,30,0.94);
    border: 1px solid rgba(56,189,248,0.32); border-radius: 14px; overflow: hidden;
    box-shadow: 0 0 50px rgba(56,189,248,0.07), inset 0 0 30px rgba(56,189,248,0.03); z-index: 4;
  }
  .lp-panel-corner { position: absolute; width: 16px; height: 16px; z-index: 6; }
  .lp-panel-corner::before,.lp-panel-corner::after{content:'';position:absolute;background:#38bdf8;}
  .lp-panel-corner::before{width:100%;height:1.5px;top:0;}
  .lp-panel-corner::after{width:1.5px;height:100%;top:0;}
  .lp-panel-corner.tl{top:8px;left:8px;} .lp-panel-corner.tr{top:8px;right:8px;transform:scaleX(-1);}
  .lp-panel-corner.bl{bottom:8px;left:8px;transform:scaleY(-1);} .lp-panel-corner.br{bottom:8px;right:8px;transform:scale(-1);}
  .lp-panel-header { padding: 12px 14px 8px; white-space: nowrap; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(56,189,248,0.1); font-size: 11px; font-weight: 600; color: #7dd3fc; letter-spacing: 0.08em; text-transform: uppercase; }
  .lp-panel-live { color: #38bdf8; animation: lp-blink 2s step-end infinite; }
  @keyframes lp-blink{0%,100%{opacity:1}50%{opacity:0.3}}
  .lp-panel-scanline { position: absolute; left:0; right:0; height:1px; z-index:10; pointer-events:none; background: linear-gradient(90deg,transparent,rgba(56,189,248,0.22),transparent); animation: lp-panelScan 5s ease-in-out infinite; }
  @keyframes lp-panelScan{0%{top:40px;opacity:0}5%{opacity:1}95%{opacity:1}100%{top:460px;opacity:0}}
  .lp-seoul-svg-wrap { padding: 6px 14px 2px; flex:1; }
  .lp-panel-scores { display: flex; gap: 7px; padding: 7px 14px 10px; }
  .lp-ps-chip { flex:1; background:rgba(10,22,40,0.85); border-radius:8px; padding:8px 10px; }
  .lp-ps-chip.teal{border:1px solid rgba(45,212,191,0.28);} .lp-ps-chip.amber{border:1px solid rgba(251,191,36,0.26);}
  .lp-ps-label{font-size:9.5px;color:#64748b;margin-bottom:4px;}
  .lp-ps-row{display:flex;align-items:center;gap:6px;}
  .lp-ps-score{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:700;line-height:1;}
  .lp-ps-score.teal{color:#2dd4bf;} .lp-ps-score.amber{color:#fbbf24;}
  .lp-ps-badge{font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;}
  .lp-ps-badge.teal{background:rgba(45,212,191,0.12);color:#2dd4bf;} .lp-ps-badge.amber{background:rgba(251,191,36,0.1);color:#fbbf24;}

  section.lp-section { padding: 100px 80px; }
  .lp-section-label { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #38bdf8; margin-bottom: 16px; }
  .lp-section-title { font-size: clamp(28px,3vw,44px); font-weight: 800; line-height: 1.2; letter-spacing: -0.02em; margin-bottom: 16px; word-break: keep-all; }
  .lp-section-desc { font-size: 16px; color: #94a3b8; line-height: 1.75; max-width: 560px; word-break: keep-all; }

  .lp-stats-section { background: linear-gradient(180deg, #060e1e 0%, #0a1628 100%); position: relative; overflow: hidden; }
  .lp-stats-section::before { content:''; position:absolute; left:-200px; bottom:-200px; width:600px; height:600px; background:radial-gradient(circle,rgba(248,113,113,0.06) 0%,transparent 65%); pointer-events:none; }
  .lp-stats-inner { max-width: 1280px; margin: 0 auto; }
  .lp-stats-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:64px; gap:40px; }
  .lp-big-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:2px; margin-bottom:2px; }
  .lp-stat-block { background: #0d2040; padding:36px 32px; border: 1px solid rgba(255,255,255,0.05); position:relative; overflow:hidden; cursor:default; transition:transform 0.2s; }
  .lp-stat-block:hover { transform:translateY(-4px); z-index:2; }
  .lp-stat-block::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
  .lp-stat-block.danger::before{background:#f87171;} .lp-stat-block.warning::before{background:#fbbf24;} .lp-stat-block.info::before{background:#38bdf8;}
  .lp-stat-block-num { font-family:'Space Grotesk',sans-serif; font-size:clamp(36px,3vw,56px); font-weight:700; line-height:1; margin-bottom:12px; }
  .lp-stat-block.danger .lp-stat-block-num{color:#f87171;} .lp-stat-block.warning .lp-stat-block-num{color:#fbbf24;} .lp-stat-block.info .lp-stat-block-num{color:#38bdf8;}
  .lp-stat-block-label{font-size:14px;font-weight:600;color:#fff;margin-bottom:8px;word-break:keep-all;}
  .lp-stat-block-sub{font-size:12px;color:#64748b;}
  .lp-stat-block-icon{position:absolute;right:24px;top:28px;opacity:0.15;}
  .lp-stat-block-wide { background:linear-gradient(135deg,rgba(248,113,113,0.08),rgba(10,22,40,0.95)); border:1px solid rgba(248,113,113,0.15); padding:36px 48px; display:flex; align-items:center; gap:48px; }
  .lp-stat-block-wide .lp-stat-block-num{font-size:clamp(48px,5vw,80px);color:#f87171;white-space:nowrap;}
  .lp-stat-block-wide-text{display:flex;flex-direction:column;gap:8px;}
  .lp-stat-block-wide-text .lp-stat-block-label{font-size:18px;margin-bottom:0;}
  .lp-stat-block-wide-text .lp-stat-block-sub{font-size:14px;color:#94a3b8;}
  .lp-source-note{margin-top:20px;font-size:11px;color:#64748b;letter-spacing:.03em;}

  .lp-solution-section{background:#0a1628;position:relative;overflow:hidden;}
  .lp-solution-section::after{content:'';position:absolute;right:-100px;top:-100px;width:500px;height:500px;background:radial-gradient(circle,rgba(56,189,248,0.07) 0%,transparent 65%);pointer-events:none;}
  .lp-solution-inner{max-width:1280px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;}
  .lp-solution-points{margin-top:40px;display:flex;flex-direction:column;gap:20px;}
  .lp-solution-point{display:flex;gap:16px;align-items:flex-start;}
  .lp-solution-point-icon{width:40px;height:40px;border-radius:10px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .lp-solution-point-title{font-size:15px;font-weight:600;margin-bottom:4px;color:#fff;}
  .lp-solution-point-desc{font-size:13px;color:#94a3b8;line-height:1.6;word-break:keep-all;}
  .lp-dashboard-mockup{background:#0d2040;border-radius:16px;border:1px solid rgba(56,189,248,0.12);box-shadow:0 40px 80px rgba(0,0,0,0.5);overflow:hidden;}
  .lp-dash-topbar{background:#0a1628;padding:12px 20px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(56,189,248,0.08);}
  .lp-dash-dot{width:10px;height:10px;border-radius:50%;}
  .lp-dash-dot.red{background:#ff5f57;} .lp-dash-dot.yellow{background:#ffbd2e;} .lp-dash-dot.green{background:#28ca41;}
  .lp-dash-title{margin-left:8px;font-size:12px;color:#94a3b8;font-family:'Space Grotesk',sans-serif;}
  .lp-dash-body{padding:20px;}
  .lp-dash-row{display:flex;gap:12px;margin-bottom:12px;}
  .lp-dash-card{background:#0a1628;border:1px solid rgba(56,189,248,0.08);border-radius:10px;padding:14px 16px;flex:1;}
  .lp-dash-card-label{font-size:10px;color:#64748b;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px;font-family:'Space Grotesk',sans-serif;}
  .lp-dash-card-value{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:#38bdf8;}
  .lp-dash-card-value span{font-size:11px;color:#4ade80;margin-left:4px;font-weight:500;}
  .lp-dash-grade-row{display:flex;gap:8px;margin-bottom:12px;}
  .lp-dash-grade-item{flex:1;background:#0a1628;border:1px solid rgba(56,189,248,0.08);border-radius:10px;padding:12px;text-align:center;}
  .lp-dash-grade-letter{font-family:'Space Grotesk',sans-serif;font-size:28px;font-weight:700;margin-bottom:4px;}
  .lp-dash-grade-letter.a{color:#38bdf8;} .lp-dash-grade-letter.b{color:#2dd4bf;} .lp-dash-grade-letter.c{color:#fbbf24;} .lp-dash-grade-letter.d{color:#f87171;}
  .lp-dash-grade-name{font-size:10px;color:#64748b;word-break:keep-all;}
  .lp-dash-ai-score{background:linear-gradient(135deg,rgba(56,189,248,0.12),rgba(10,22,40,0.8));border:1px solid rgba(56,189,248,0.2);border-radius:10px;padding:16px;display:flex;align-items:center;gap:16px;}
  .lp-score-info-label{font-size:11px;color:#94a3b8;margin-bottom:4px;}
  .lp-score-info-value{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;color:#38bdf8;}
  .lp-score-info-sub{font-size:11px;color:#64748b;margin-top:2px;}

  .lp-features-section{background:#060e1e;position:relative;}
  .lp-features-inner{max-width:1280px;margin:0 auto;}
  .lp-features-header{text-align:center;margin-bottom:64px;}
  .lp-features-header .lp-section-desc{margin:0 auto;text-align:center;}
  .lp-features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;}
  .lp-feature-card{background:#0d2040;padding:40px 36px;border:1px solid rgba(255,255,255,0.04);position:relative;overflow:hidden;transition:all 0.3s;cursor:default;}
  .lp-feature-card:hover{background:rgba(13,32,64,0.95);border-color:rgba(56,189,248,0.15);transform:translateY(-4px);z-index:2;}
  .lp-feature-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(56,189,248,0.3),transparent);opacity:0;transition:opacity 0.3s;}
  .lp-feature-card:hover::after{opacity:1;}
  .lp-feature-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;border:1px solid rgba(56,189,248,0.2);}
  .lp-feature-icon.blue{background:rgba(56,189,248,0.1);} .lp-feature-icon.teal{background:rgba(45,212,191,0.1);border-color:rgba(45,212,191,0.2);} .lp-feature-icon.amber{background:rgba(251,191,36,0.1);border-color:rgba(251,191,36,0.2);} .lp-feature-icon.green{background:rgba(74,222,128,0.1);border-color:rgba(74,222,128,0.2);} .lp-feature-icon.purple{background:rgba(167,139,250,0.1);border-color:rgba(167,139,250,0.2);} .lp-feature-icon.rose{background:rgba(251,113,133,0.1);border-color:rgba(251,113,133,0.2);}
  .lp-feature-title{font-size:18px;font-weight:700;margin-bottom:10px;color:#fff;word-break:keep-all;}
  .lp-feature-desc{font-size:14px;color:#94a3b8;line-height:1.7;word-break:keep-all;}
  .lp-feature-tag{display:inline-block;margin-top:16px;padding:4px 12px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:.05em;}
  .lp-feature-tag.blue{background:rgba(56,189,248,0.12);color:#7dd3fc;} .lp-feature-tag.teal{background:rgba(45,212,191,0.1);color:#2dd4bf;} .lp-feature-tag.amber{background:rgba(251,191,36,0.1);color:#fbbf24;} .lp-feature-tag.green{background:rgba(74,222,128,0.1);color:#4ade80;} .lp-feature-tag.purple{background:rgba(167,139,250,0.1);color:#c4b5fd;} .lp-feature-tag.rose{background:rgba(251,113,133,0.1);color:#fda4af;}
  .lp-feature-num{position:absolute;right:24px;top:28px;font-family:'Space Grotesk',sans-serif;font-size:48px;font-weight:700;color:rgba(56,189,248,0.18);line-height:1;}

  .lp-howitworks-section{background:#0a1628;position:relative;overflow:hidden;}
  .lp-howitworks-section::before{content:'';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:800px;height:800px;background:radial-gradient(circle,rgba(56,189,248,0.05) 0%,transparent 60%);pointer-events:none;}
  .lp-howitworks-inner{max-width:1280px;margin:0 auto;}
  .lp-howitworks-header{text-align:center;margin-bottom:80px;}
  .lp-howitworks-header .lp-section-desc{margin:0 auto;text-align:center;}
  .lp-steps-row{display:grid;grid-template-columns:1fr 48px 1fr 48px 1fr;align-items:stretch;}
  .lp-step{background:#0d2040;border:1px solid rgba(56,189,248,0.1);border-radius:16px;padding:36px 32px;position:relative;display:flex;flex-direction:column;}
  .lp-step-num{font-family:'Space Grotesk',sans-serif;font-size:clamp(18px,2vw,28px);font-weight:700;color:rgba(56,189,248,0.25);line-height:1;flex-shrink:0;}
  .lp-step-header{display:flex;align-items:baseline;gap:10px;margin-bottom:20px;white-space:nowrap;overflow:hidden;}
  .lp-step-title{font-size:clamp(18px,2vw,28px);font-weight:700;color:#fff;margin-bottom:0;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .lp-step-desc{font-size:14px;color:#94a3b8;line-height:1.7;word-break:keep-all;}
  .lp-step-arrow{display:flex;align-items:center;justify-content:center;color:#0284c7;font-size:24px;}

  .lp-model-section{background:linear-gradient(135deg,#0d2040 0%,#0a1628 100%);border-top:1px solid rgba(56,189,248,0.08);border-bottom:1px solid rgba(56,189,248,0.08);padding:80px;}
  .lp-model-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:60px;}
  .lp-model-text{max-width:560px;}
  .lp-model-chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px;}
  .lp-model-chip{padding:8px 18px;border-radius:100px;font-size:13px;font-weight:500;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.18);color:#7dd3fc;}
  .lp-model-metrics{display:flex;flex-direction:column;gap:16px;flex-shrink:0;}
  .lp-model-metric{display:flex;align-items:center;gap:16px;background:rgba(10,22,40,0.6);border:1px solid rgba(56,189,248,0.1);border-radius:12px;padding:16px 24px;min-width:280px;}
  .lp-model-metric-icon{width:40px;height:40px;border-radius:10px;background:rgba(56,189,248,0.1);display:flex;align-items:center;justify-content:center;}
  .lp-model-metric-label{font-size:12px;color:#94a3b8;margin-bottom:4px;}
  .lp-model-metric-value{font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;color:#38bdf8;}

  .lp-cta-section{background:#060e1e;padding:120px 80px;text-align:center;position:relative;overflow:hidden;}
  .lp-cta-section::before{content:'';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:1000px;height:400px;background:radial-gradient(ellipse,rgba(56,189,248,0.08) 0%,transparent 60%);pointer-events:none;}
  .lp-cta-inner{position:relative;z-index:2;}
  .lp-cta-title{font-size:clamp(32px,4vw,54px);font-weight:900;letter-spacing:-0.02em;margin-bottom:16px;word-break:keep-all;}
  .lp-cta-title .sky{color:#38bdf8;}
  .lp-cta-desc{font-size:17px;color:#94a3b8;margin-bottom:48px;word-break:keep-all;}
  .lp-cta-actions{display:flex;gap:16px;justify-content:center;}

  footer.lp-footer{background:#060e1e;border-top:1px solid rgba(255,255,255,0.05);padding:48px 80px;display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center;}
  footer.lp-footer img{height:36px;filter:brightness(1.05);}
  .lp-footer-copy{font-size:12px;color:#64748b;}
  .lp-footer-links{display:flex;gap:24px;}
  .lp-footer-links a{font-size:12px;color:#64748b;text-decoration:none;transition:color 0.2s;}
  .lp-footer-links a:hover{color:#7dd3fc;}

  .lp-reveal{opacity:0;transform:translateY(28px);transition:opacity 0.7s ease,transform 0.7s ease;}
  .lp-reveal.visible{opacity:1;transform:none;}
  .lp-reveal-delay-1{transition-delay:0.1s;} .lp-reveal-delay-2{transition-delay:0.2s;} .lp-reveal-delay-3{transition-delay:0.3s;} .lp-reveal-delay-4{transition-delay:0.4s;}
`;

export default function LandingPage() {
  const navigate = useNavigate();
  const navRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Google Fonts
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@300;400;500;600;700;900&family=Space+Grotesk:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);

    // Nav scroll
    const nav = navRef.current;
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll);

    // Scroll reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll(".lp-reveal").forEach((el) => observer.observe(el));

    // Counter animation
    function animateCounter(el) {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const decimal = parseInt(el.dataset.decimal || "0");
      const duration = 1600;
      const start = performance.now();
      function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        const val = target * ease;
        el.textContent = (decimal > 0 ? val.toFixed(decimal) : Math.floor(val)) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { animateCounter(e.target); counterObserver.unobserve(e.target); } });
    }, { threshold: 0.5 });
    document.querySelectorAll("[data-count]").forEach((el) => counterObserver.observe(el));

    // Globe canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const W = 240, H = 240, cx = W / 2, cy = H / 2, R = 108;
      let angle = 0;
      let rafId;
      function drawGlobe() {
        ctx.clearRect(0, 0, W, H);
        const outerGlow = ctx.createRadialGradient(cx, cy, R * 0.75, cx, cy, R * 1.45);
        outerGlow.addColorStop(0, "rgba(56,189,248,0.07)"); outerGlow.addColorStop(0.5, "rgba(56,189,248,0.03)"); outerGlow.addColorStop(1, "rgba(56,189,248,0)");
        ctx.fillStyle = outerGlow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2); ctx.fill();
        const sphereGrad = ctx.createRadialGradient(cx - 70, cy - 70, 0, cx, cy, R);
        sphereGrad.addColorStop(0, "rgba(15,40,80,0.88)"); sphereGrad.addColorStop(0.6, "rgba(10,22,40,0.92)"); sphereGrad.addColorStop(1, "rgba(6,14,30,0.97)");
        ctx.fillStyle = sphereGrad; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R - 0.5, 0, Math.PI * 2); ctx.clip();
        [-75,-60,-45,-30,-15,0,15,30,45,60,75].forEach((lat) => {
          const fy = Math.sin(lat * Math.PI / 180), y = cy + R * fy, rx = R * Math.cos(lat * Math.PI / 180), ry = rx * 0.28;
          if (rx < 2) return;
          ctx.beginPath(); ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2);
          ctx.strokeStyle = lat === 0 ? "rgba(56,189,248,0.22)" : "rgba(56,189,248,0.07)";
          ctx.lineWidth = lat === 0 ? 1.2 : 0.7; ctx.stroke();
        });
        for (let i = 0; i < 12; i++) {
          const a = (i * 15 + angle) * Math.PI / 180, sinA = Math.sin(a), cosA = Math.cos(a);
          const rx = R * Math.abs(cosA), offsetX = R * sinA * 0.18;
          ctx.beginPath(); ctx.ellipse(cx + offsetX, cy, rx, R, 0, 0, Math.PI * 2);
          ctx.strokeStyle = Math.abs(sinA) < 0.6 ? "rgba(56,189,248,0.09)" : "rgba(56,189,248,0.04)";
          ctx.lineWidth = 0.7; ctx.stroke();
        }
        const seoulFy = Math.sin(37 * Math.PI / 180), seoulY = cy + R * seoulFy, seoulRx = R * Math.cos(37 * Math.PI / 180), seoulRy = seoulRx * 0.28;
        if (seoulRx > 2) {
          ctx.beginPath(); ctx.ellipse(cx, seoulY, seoulRx, seoulRy, 0, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(56,189,248,0.32)"; ctx.lineWidth = 1; ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.restore();
        const rimGrad = ctx.createRadialGradient(cx, cy, R - 20, cx, cy, R + 6);
        rimGrad.addColorStop(0, "rgba(56,189,248,0)"); rimGrad.addColorStop(0.7, "rgba(56,189,248,0.18)"); rimGrad.addColorStop(1, "rgba(56,189,248,0.08)");
        ctx.strokeStyle = rimGrad; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
        const specGrad = ctx.createRadialGradient(cx - 80, cy - 80, 0, cx - 60, cy - 60, R * 0.55);
        specGrad.addColorStop(0, "rgba(56,189,248,0.07)"); specGrad.addColorStop(1, "rgba(56,189,248,0)");
        ctx.fillStyle = specGrad; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(56,189,248,0.5)";
        ctx.beginPath(); ctx.arc(cx, cy - R, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy + R, 3, 0, Math.PI * 2); ctx.fill();
        angle += 0.18;
        rafId = requestAnimationFrame(drawGlobe);
      }
      drawGlobe();
      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("scroll", onScroll);
        observer.disconnect();
        counterObserver.disconnect();
        document.head.removeChild(link);
      };
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      counterObserver.disconnect();
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="lp-root">
      <style>{CSS}</style>

      {/* NAV */}
      <nav ref={navRef}>
        <div className="lp-nav-inner">
          <a href="#" className="lp-nav-logo"><img src="/nodaji-logo.png" alt="NODAJI" /></a>
          <ul className="lp-nav-links">
            <li><a href="#stats">시장 현황</a></li>
            <li><a href="#features">주요 기능</a></li>
            <li><a href="#how">사용 방법</a></li>
          </ul>
          <button className="lp-nav-cta" onClick={() => navigate("/map")}>무료로 시작하기</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero" id="home">
        <div className="lp-hero-layout">
        <div className="lp-hero-content">
          <div className="lp-hero-badge"><span className="lp-badge-dot"></span>AI 기반 상권분석 플랫폼</div>
          <h1 className="lp-hero-title">
            데이터가 말하는<br />
            <span className="accent">최적의 창업 입지</span>
          </h1>
          <p className="lp-hero-sub" style={{ maxWidth: 460 }}>
            연간 100만 명이 폐업하는 현실. NODAJI는 2020~2025년 서울 상권 데이터를 학습한 AI로
            행정동×업종별 성장확률을 예측하고, 당신의 창업 성공 가능성을 높입니다.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary" style={{ width: "100%", maxWidth: 460 }} onClick={() => navigate("/map")}>지금 상권 분석하기 →</button>
          </div>
          <div className="lp-hero-stat-row">
            <div><div className="lp-hero-stat-value" data-count="424" data-suffix="개">0개</div><div className="lp-hero-stat-label">서울시 행정동 커버리지</div></div>
            <div><div className="lp-hero-stat-value" data-count="51" data-suffix="개">0개</div><div className="lp-hero-stat-label">분석 가능 업종</div></div>
            <div><div className="lp-hero-stat-value" data-count="5" data-suffix="년">0년</div><div className="lp-hero-stat-label">학습 데이터 기간 (2020–2025)</div></div>
          </div>
        </div>

        {/* GLOBE VISUAL */}
        <div className="lp-hero-visual">
          <div className="lp-globe-wrap">
            <canvas ref={canvasRef} width="240" height="240" style={{ width: 240, height: 240, display: "block" }} />
            <div className="lp-globe-ping"></div>
          </div>
          <svg className="lp-holo-beams" viewBox="0 0 720 490" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="lp-beamGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <linearGradient id="lp-beamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(56,189,248,0.65)"/>
                <stop offset="100%" stopColor="rgba(56,189,248,0.06)"/>
              </linearGradient>
            </defs>
            <polygon points="228,245 305,22 305,468" fill="rgba(56,189,248,0.022)"/>
            <line x1="228" y1="245" x2="305" y2="40"  stroke="url(#lp-beamGrad)" strokeWidth="1" filter="url(#lp-beamGlow)"/>
            <line x1="228" y1="245" x2="305" y2="140" stroke="url(#lp-beamGrad)" strokeWidth="1.2" filter="url(#lp-beamGlow)"/>
            <line x1="228" y1="245" x2="305" y2="245" stroke="url(#lp-beamGrad)" strokeWidth="2.2" filter="url(#lp-beamGlow)"/>
            <line x1="228" y1="245" x2="305" y2="350" stroke="url(#lp-beamGrad)" strokeWidth="1.2" filter="url(#lp-beamGlow)"/>
            <line x1="228" y1="245" x2="305" y2="450" stroke="url(#lp-beamGrad)" strokeWidth="1" filter="url(#lp-beamGlow)"/>
          </svg>
          <div className="lp-map-panel">
            <div className="lp-panel-corner tl"></div><div className="lp-panel-corner tr"></div>
            <div className="lp-panel-corner bl"></div><div className="lp-panel-corner br"></div>
            <div className="lp-panel-scanline"></div>
            <div className="lp-panel-header"><span>서울시 AI 상권분석</span><span className="lp-panel-live">● LIVE</span></div>
            <div className="lp-seoul-svg-wrap">
              <svg viewBox="0 0 400 295" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{ display: "block" }}>
                <defs>
                  <filter id="lp-pglow" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  <filter id="lp-pglow2" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <path d="M75,152 L62,128 L68,102 L84,82 L106,66 L132,50 L160,40 L192,34 L224,32 L258,36 L286,48 L310,64 L326,84 L335,108 L338,134 L334,160 L324,184 L308,204 L288,220 L264,232 L238,240 L210,242 L182,238 L158,228 L136,215 L116,200 L98,184 L80,168 Z" fill="rgba(56,189,248,0.05)" stroke="rgba(56,189,248,0.6)" strokeWidth="1.6" strokeLinejoin="round" filter="url(#lp-pglow)"/>
                <g fill="none" stroke="rgba(56,189,248,0.16)" strokeWidth="0.6">
                  <line x1="132" y1="60" x2="132" y2="155"/><line x1="165" y1="44" x2="168" y2="140"/><line x1="200" y1="36" x2="202" y2="135"/>
                  <line x1="238" y1="42" x2="242" y2="140"/><line x1="275" y1="56" x2="278" y2="148"/><line x1="310" y1="80" x2="312" y2="158"/>
                  <line x1="68" y1="140" x2="210" y2="145"/><line x1="210" y1="145" x2="335" y2="138"/><line x1="78" y1="162" x2="215" y2="168"/>
                  <line x1="215" y1="168" x2="330" y2="162"/><line x1="88" y1="182" x2="230" y2="188"/><line x1="230" y1="188" x2="322" y2="182"/><line x1="108" y1="200" x2="256" y2="208"/>
                </g>
                <path d="M105,186 C150,196 195,202 232,202 C268,202 295,198 318,192" fill="none" stroke="rgba(56,189,248,0.5)" strokeWidth="6" strokeLinecap="round"/>
                <path d="M105,186 C150,196 195,202 232,202 C268,202 295,198 318,192" fill="none" stroke="rgba(56,189,248,0.14)" strokeWidth="11" strokeLinecap="round"/>
                <text x="206" y="202" textAnchor="middle" fontSize="6" fill="rgba(56,189,248,0.55)" fontFamily="Space Grotesk,sans-serif" letterSpacing="3">HAN RIVER</text>
                <path d="M148,98 L180,90 L206,98 L200,124 L184,134 L160,134 L148,120 Z" fill="rgba(45,212,191,0.22)" stroke="rgba(45,212,191,0.75)" strokeWidth="1.2" filter="url(#lp-pglow)"/>
                <path d="M102,138 L130,128 L150,138 L146,160 L130,170 L110,168 L100,154 Z" fill="rgba(251,191,36,0.18)" stroke="rgba(251,191,36,0.68)" strokeWidth="1.2" filter="url(#lp-pglow)"/>
                <path d="M204,206 L246,200 L262,212 L256,228 L232,234 L210,228 L200,218 Z" fill="rgba(251,191,36,0.16)" stroke="rgba(251,191,36,0.62)" strokeWidth="1.2" filter="url(#lp-pglow)"/>
                <circle cx="178" cy="113" r="5" fill="#2dd4bf" filter="url(#lp-pglow2)"><animate attributeName="r" values="5;8;5" dur="2.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="2.8s" repeatCount="indefinite"/></circle>
                <circle cx="178" cy="113" r="3.5" fill="#2dd4bf"/>
                <circle cx="124" cy="150" r="4.5" fill="#fbbf24" filter="url(#lp-pglow2)"><animate attributeName="r" values="4.5;7;4.5" dur="3.1s" repeatCount="indefinite" begin="1s"/><animate attributeName="opacity" values="1;0.4;1" dur="3.1s" repeatCount="indefinite" begin="1s"/></circle>
                <circle cx="124" cy="150" r="3" fill="#fbbf24"/>
                <circle cx="231" cy="217" r="4.5" fill="#fbbf24" filter="url(#lp-pglow2)"><animate attributeName="r" values="4.5;7;4.5" dur="3.4s" repeatCount="indefinite" begin="0.5s"/><animate attributeName="opacity" values="1;0.4;1" dur="3.4s" repeatCount="indefinite" begin="0.5s"/></circle>
                <circle cx="231" cy="217" r="3" fill="#fbbf24"/>
                <circle cx="220" cy="48" r="2" fill="rgba(56,189,248,0.4)"/>
                <circle cx="162" cy="52" r="2" fill="rgba(56,189,248,0.35)"/>
                <circle cx="290" cy="68" r="2" fill="rgba(56,189,248,0.35)"/>
                <circle cx="320" cy="110" r="2" fill="rgba(56,189,248,0.35)"/>
                <circle cx="305" cy="158" r="2" fill="rgba(56,189,248,0.35)"/>
                <circle cx="290" cy="210" r="2" fill="rgba(56,189,248,0.35)"/>
                <circle cx="108" cy="184" r="2" fill="rgba(56,189,248,0.35)"/>
                <circle cx="130" cy="218" r="2" fill="rgba(56,189,248,0.3)"/>
                <text x="178" y="108" textAnchor="middle" fontSize="7.5" fill="rgba(45,212,191,0.92)" fontFamily="Noto Sans KR,sans-serif" fontWeight="700">종로구</text>
                <text x="124" y="145" textAnchor="middle" fontSize="7.5" fill="rgba(251,191,36,0.92)" fontFamily="Noto Sans KR,sans-serif" fontWeight="700">마포구</text>
                <text x="231" y="211" textAnchor="middle" fontSize="7.5" fill="rgba(251,191,36,0.92)" fontFamily="Noto Sans KR,sans-serif" fontWeight="700">강남구</text>
                <text x="220" y="42" textAnchor="middle" fontSize="6.5" fill="rgba(56,189,248,0.5)" fontFamily="Noto Sans KR,sans-serif">노원구</text>
                <text x="305" y="152" textAnchor="middle" fontSize="6.5" fill="rgba(56,189,248,0.5)" fontFamily="Noto Sans KR,sans-serif">강동구</text>
                <text x="290" y="206" textAnchor="middle" fontSize="6.5" fill="rgba(56,189,248,0.5)" fontFamily="Noto Sans KR,sans-serif">송파구</text>
                <text x="105" y="180" textAnchor="middle" fontSize="6.5" fill="rgba(56,189,248,0.5)" fontFamily="Noto Sans KR,sans-serif">강서구</text>
              </svg>
            </div>
            <div className="lp-panel-scores">
              <div className="lp-ps-chip teal"><div className="lp-ps-label">종로구 · 한식</div><div className="lp-ps-row"><span className="lp-ps-score teal">74.4</span><span className="lp-ps-badge teal">B등급</span></div></div>
              <div className="lp-ps-chip amber"><div className="lp-ps-label">마포구 · 카페</div><div className="lp-ps-row"><span className="lp-ps-score amber">38.4</span><span className="lp-ps-badge amber">C등급</span></div></div>
              <div className="lp-ps-chip amber"><div className="lp-ps-label">강남구 · 한식</div><div className="lp-ps-row"><span className="lp-ps-score amber">41.5</span><span className="lp-ps-badge amber">C등급</span></div></div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* STATS */}
      <section className="lp-stats-section lp-section" id="stats">
        <div className="lp-stats-inner">
          <div className="lp-stats-header">
            <div>
              <p className="lp-section-label lp-reveal">시장 현황</p>
              <h2 className="lp-section-title lp-reveal lp-reveal-delay-1">창업 실패, 더 이상 남의 일이 아닙니다</h2>
            </div>
            <p className="lp-section-desc lp-reveal lp-reveal-delay-2" style={{ textAlign: "right" }}>
              국세청·통계청 공식 데이터가 보여주는<br />냉혹한 자영업 생존 현실
            </p>
          </div>
          <div className="lp-big-stat-grid lp-reveal">
            <div className="lp-stat-block danger">
              <span className="lp-stat-block-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,17 13,8 9,12 2,5"/><polyline points="16,17 22,17 22,11"/></svg></span>
              <div className="lp-stat-block-num" data-count="10.8" data-suffix="%" data-decimal="1">0%</div>
              <div className="lp-stat-block-label">연간 전체 업종 폐업률</div>
              <div className="lp-stat-block-sub">10명 중 1명이 매년 폐업 · 국세청</div>
            </div>
            <div className="lp-stat-block warning">
              <span className="lp-stat-block-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg></span>
              <div className="lp-stat-block-num" data-count="20.8" data-suffix="%" data-decimal="1">0%</div>
              <div className="lp-stat-block-label">소매업 폐업률</div>
              <div className="lp-stat-block-sub">5명 중 1명 · 국세청</div>
            </div>
            <div className="lp-stat-block warning">
              <span className="lp-stat-block-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></span>
              <div className="lp-stat-block-num" data-count="19.6" data-suffix="%" data-decimal="1">0%</div>
              <div className="lp-stat-block-label">음식업 폐업률</div>
              <div className="lp-stat-block-sub">평균 19.4~19.7% · 국세청</div>
            </div>
            <div className="lp-stat-block info">
              <span className="lp-stat-block-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></span>
              <div className="lp-stat-block-num" data-count="100" data-suffix="만명">0만명</div>
              <div className="lp-stat-block-label">연간 폐업자</div>
              <div className="lp-stat-block-sub">매년 약 100만 명 · 국세청</div>
            </div>
          </div>
          <div className="lp-stat-block-wide lp-reveal lp-reveal-delay-1">
            <div className="lp-stat-block-num" data-count="66.2" data-suffix="%" data-decimal="1">0%</div>
            <div className="lp-stat-block-wide-text">
              <div className="lp-stat-block-label">5년 내 폐업률 — 창업 후 5년이 지나면 3명 중 2명은 문을 닫습니다</div>
              <div className="lp-stat-block-sub">생존율 33.8% · 창업 전 철저한 상권 분석이 생존의 핵심입니다</div>
            </div>
          </div>
          <p className="lp-source-note">* 출처: 국세청 국세통계연보, 통계청 기업생멸행정통계</p>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="lp-solution-section lp-section" id="solution">
        <div className="lp-solution-inner">
          <div>
            <p className="lp-section-label lp-reveal">솔루션</p>
            <h2 className="lp-section-title lp-reveal lp-reveal-delay-1">AI가 찾아주는<br /><span style={{ color: "#38bdf8" }}>최적의 상권</span></h2>
            <p className="lp-section-desc lp-reveal lp-reveal-delay-2">막연한 감이 아닌 데이터. NODAJI는 서울시 전체 424개 행정동의 매출·유동인구·점포수를 분석하고, LightGBM 모델로 업종별 성장확률을 예측합니다.</p>
            <div className="lp-solution-points">
              {[
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>, title: "지도 기반 드릴다운 탐색", desc: "서울 전체 → 구 → 행정동 순으로 단계별 탐색. 선택 즉시 매출·유동인구·점포수 지표 표시", delay: "lp-reveal-delay-2" },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/></svg>, title: "AI 성장확률 점수 (0~100)", desc: "구 + 업종 입력 시 Top 10 행정동 추천. A/B/C/D 등급과 선호도 기반 맞춤 재정렬", delay: "lp-reveal-delay-3" },
                { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/><line x1="2" y1="22" x2="22" y2="22"/></svg>, title: "Gemini AI 심층 보고서", desc: "요일별/시간대별/연령대별 매출 분석, 비용·수익 분석을 자동으로 생성 및 저장", delay: "lp-reveal-delay-4" },
              ].map(({ icon, title, desc, delay }) => (
                <div key={title} className={`lp-solution-point lp-reveal ${delay}`}>
                  <div className="lp-solution-point-icon">{icon}</div>
                  <div><div className="lp-solution-point-title">{title}</div><div className="lp-solution-point-desc">{desc}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="lp-dashboard-mockup lp-reveal lp-reveal-delay-2">
            <div className="lp-dash-topbar">
              <div className="lp-dash-dot red"/><div className="lp-dash-dot yellow"/><div className="lp-dash-dot green"/>
              <span className="lp-dash-title">NODAJI — 강남구 음식점 분석</span>
            </div>
            <div className="lp-dash-body">
              <div className="lp-dash-row">
                <div className="lp-dash-card"><div className="lp-dash-card-label">월 평균 매출</div><div className="lp-dash-card-value">4,820<span>↑ 12.3%</span></div></div>
                <div className="lp-dash-card"><div className="lp-dash-card-label">일 평균 유동인구</div><div className="lp-dash-card-value">18,240<span>↑ 6.1%</span></div></div>
              </div>
              <div className="lp-dash-grade-row">
                {[["a","역삼1동"],["a","논현1동"],["b","청담동"],["b","삼성1동"],["c","대치1동"]].map(([g, name]) => (
                  <div key={name} className="lp-dash-grade-item"><div className={`lp-dash-grade-letter ${g}`}>{g.toUpperCase()}</div><div className="lp-dash-grade-name">{name}</div></div>
                ))}
              </div>
              <div className="lp-dash-ai-score">
                <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(56,189,248,0.1)" strokeWidth="5"/>
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#38bdf8" strokeWidth="5" strokeDasharray="163.4" strokeDashoffset="32" strokeLinecap="round" transform="rotate(-90 32 32)"/>
                  <text x="32" y="36" textAnchor="middle" fontSize="14" fontWeight="700" fill="#38bdf8" fontFamily="Space Grotesk, sans-serif">82</text>
                </svg>
                <div>
                  <div className="lp-score-info-label">AI 성장확률 점수</div>
                  <div className="lp-score-info-value">82 / 100 <span style={{ fontSize: 14, color: "#2dd4bf", fontWeight: 600 }}>등급 A</span></div>
                  <div className="lp-score-info-sub">역삼1동 · 한식 · 분석 기준일 2025.04</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-features-section lp-section" id="features">
        <div className="lp-features-inner">
          <div className="lp-features-header">
            <p className="lp-section-label lp-reveal">주요 기능</p>
            <h2 className="lp-section-title lp-reveal lp-reveal-delay-1">창업의 모든 결정을<br />데이터로</h2>
            <p className="lp-section-desc lp-reveal lp-reveal-delay-2">지도 탐색부터 AI 보고서, 비용 계산까지 — 창업 전 필요한 분석을 한 곳에서</p>
          </div>
          <div className="lp-features-grid">
            {[
              { num:"01", color:"blue", tag:"실시간 지도", title:"지도 기반 상권 탐색", desc:"서울 지도에서 구 → 행정동 드릴다운 선택. 매출·유동인구·점포수 등 핵심 지표를 즉시 확인하고 길단위 상권 폴리곤 오버레이로 시각화합니다.", icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>, delay:"" },
              { num:"02", color:"teal", tag:"LightGBM", title:"AI 창업 입지 추천", desc:"구 + 업종을 입력하면 해당 구 내 Top 10 행정동을 추천. 안정/수익/성장/블루오션 선호도 선택으로 당신에게 맞는 순위로 재정렬합니다.", icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/></svg>, delay:"lp-reveal-delay-1" },
              { num:"03", color:"amber", tag:"Gemini 2.5 Flash", title:"Gemini AI 보고서 자동 생성", desc:"행정동·업종 선택 후 버튼 클릭 한 번으로 요일별/시간대별/연령대별 매출, 비용·수익 분석 보고서를 자동 생성하고 프로필에 저장합니다.", icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>, delay:"lp-reveal-delay-2" },
              { num:"04", color:"green", tag:"51개 업종", title:"창업비용 계산기", desc:"51개 업종 선택 + 평수 입력만으로 인테리어·설비·초기재고·보증금·관리비를 자동 계산. 손익분기점과 월순익까지 추정해 드립니다.", icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><rect x="7" y="5" width="10" height="4" rx="1"/></svg>, delay:"" },
              { num:"05", color:"purple", tag:"트렌드", title:"트렌드 분석", desc:"전국·구·행정동 단위 인기 업종 순위, 주중·주말 매출 비율 높은 업종, 연령대별(10대~60대) 매출 비율, 업종별 최근 매출 증감률 캐러셀로 제공합니다.", icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,12 18,8 13,13 9,9 2,16"/><line x1="2" y1="20" x2="22" y2="20"/></svg>, delay:"lp-reveal-delay-1" },
              { num:"06", color:"rose", tag:"소셜 로그인", title:"커뮤니티 & 회원", desc:"자유·정보·공지 게시판, 좋아요·댓글, 이미지 첨부. 카카오·네이버 소셜 로그인, JWT 인증, 저장한 보고서 재열람까지 완전한 회원 시스템.", icon:<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="13" y2="14"/></svg>, delay:"lp-reveal-delay-2" },
            ].map(({ num, color, tag, title, desc, icon, delay }) => (
              <div key={num} className={`lp-feature-card lp-reveal ${delay}`}>
                <span className="lp-feature-num">{num}</span>
                <div className={`lp-feature-icon ${color}`}>{icon}</div>
                <h3 className="lp-feature-title">{title}</h3>
                <p className="lp-feature-desc">{desc}</p>
                <span className={`lp-feature-tag ${color}`}>{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-howitworks-section lp-section" id="how">
        <div className="lp-howitworks-inner">
          <div className="lp-howitworks-header">
            <p className="lp-section-label lp-reveal">사용 방법</p>
            <h2 className="lp-section-title lp-reveal lp-reveal-delay-1">3단계로 완성되는<br />상권 분석</h2>
            <p className="lp-section-desc lp-reveal lp-reveal-delay-2">복잡한 조작 없이 세 단계만으로 AI 분석 보고서까지</p>
          </div>
          <div className="lp-steps-row">
            <div className="lp-step lp-reveal">
              <div className="lp-step-header">
                <div className="lp-step-num">01</div>
                <h3 className="lp-step-title">지역 & 업종 선택</h3>
              </div>
              <p className="lp-step-desc">서울 지도에서 원하는 구와 행정동을 클릭하거나, 검색창에서 직접 입력하세요. 분석할 업종을 51개 카테고리에서 선택합니다.</p>
            </div>
            <div className="lp-step-arrow lp-reveal lp-reveal-delay-1">→</div>
            <div className="lp-step lp-reveal lp-reveal-delay-2">
              <div className="lp-step-header">
                <div className="lp-step-num">02</div>
                <h3 className="lp-step-title">보고서 생성 & 저장</h3>
              </div>
              <p className="lp-step-desc">Gemini AI가 상권 데이터를 종합 분석해 심층 보고서를 자동 생성합니다. 창업비용 계산기로 예산까지 한눈에 확인하세요.</p>
            </div>
            <div className="lp-step-arrow lp-reveal lp-reveal-delay-3">→</div>
            <div className="lp-step lp-reveal lp-reveal-delay-4">
              <div className="lp-step-header">
                <div className="lp-step-num">03</div>
                <h3 className="lp-step-title">AI 분석 실행</h3>
              </div>
              <p className="lp-step-desc">보고서 내 AI 분석 버튼으로 LightGBM 모델이 성장확률을 0~100 점수로 산출합니다. A~D 등급과 함께 Top 10 추천 입지를 확인하세요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI MODEL */}
      <section className="lp-model-section">
        <div className="lp-model-inner">
          <div className="lp-model-text lp-reveal">
            <p className="lp-section-label">AI 모델</p>
            <h2 className="lp-section-title" style={{ marginBottom: 12 }}>LightGBM ×<br />5년치 서울 상권 데이터</h2>
            <p className="lp-section-desc">2020~2025년 서울시 공공데이터로 학습된 LightGBM 모델이 행정동×업종 조합별 성장확률을 예측합니다. Gemini 2.5 Flash가 데이터를 자연어 보고서로 변환합니다.</p>
            <div className="lp-model-chips">
              {["LightGBM","Gemini 2.5 Flash","서울 424개 행정동","51개 업종","2020~2025 학습"].map((c) => <span key={c} className="lp-model-chip">{c}</span>)}
            </div>
          </div>
          <div className="lp-model-metrics lp-reveal lp-reveal-delay-2">
            {[
              { label:"분석 대상 행정동 수", value:"424개", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
              { label:"지원 업종 카테고리", value:"51개", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9"/><rect x="9" y="14" width="6" height="6"/></svg> },
              { label:"학습 데이터 기간", value:"5년 (2020–2025)", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="lp-model-metric">
                <div className="lp-model-metric-icon">{icon}</div>
                <div><div className="lp-model-metric-label">{label}</div><div className="lp-model-metric-value">{value}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta-section">
        <div className="lp-cta-inner">
          <p className="lp-section-label lp-reveal" style={{ display: "block", marginBottom: 16 }}>지금 시작하기</p>
          <h2 className="lp-cta-title lp-reveal lp-reveal-delay-1">성공하는 창업자는<br /><span className="sky">데이터로 준비합니다</span></h2>
          <p className="lp-cta-desc lp-reveal lp-reveal-delay-2">5년 내 폐업 <span style={{ color: "#f87171", fontWeight: 700 }}>66.2%</span> — 살아남는 <span style={{ color: "#38bdf8", fontWeight: 700 }}>33.8%</span>는 준비에 달렸습니다</p>
          <div className="lp-cta-actions lp-reveal lp-reveal-delay-3">
            <button className="lp-btn-primary" style={{ fontSize: 17, padding: "18px 48px" }} onClick={() => navigate("/map")}>무료로 상권 분석 시작하기 →</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <img src="/nodaji-logo.png" alt="NODAJI" />
        <p className="lp-footer-copy">© 2026 NODAJI · 데이터 출처: 국세청, 통계청, 소상공인진흥공단, 서울특별시</p>
        <div className="lp-footer-links">
          <a href="#">개인정보처리방침</a>
          <a href="#">이용약관</a>
          <a href="#">문의</a>
        </div>
      </footer>
    </div>
  );
}
