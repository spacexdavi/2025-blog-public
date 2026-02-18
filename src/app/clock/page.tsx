"use client";

import { useEffect, useState, useRef } from "react";

const THEMES = [
  { id: "apple-analog", name: "苹果指针" },
  { id: "matrix", name: "黑客帝国" },
  { id: "watch-aurora", name: "Apple Watch 极光" },
  { id: "watch-neon-line", name: "Apple Watch 霓虹线条" },
];

export default function ClockPage() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

  const clockRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentTheme = THEMES[currentThemeIndex];

  // 时间逻辑
  useEffect(() => {
    setMounted(true);
    const updateTime = () => setTime(new Date());
    const timer = setInterval(updateTime, 1000);
    updateTime();
    return () => clearInterval(timer);
  }, []);

  // 永不息屏
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch (err) {
        console.warn("Wake Lock 失败:", err);
      }
    };
    requestWakeLock();
    return () => { if (wakeLock) wakeLock.release(); };
  }, []);

  // 全屏监听
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Matrix 动画逻辑
  useEffect(() => {
    if (!mounted || currentTheme.id !== "matrix" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    let animationId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const fontSize = 16;
    let columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0F0";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = String.fromCharCode(0x30A0 + Math.random() * 96);
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [mounted, currentTheme.id]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      clockRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (!mounted || !time) return <div style={{ background: "black", height: "100vh" }} />;

  const h = time.getHours();
  const m = time.getMinutes();
  const s = time.getSeconds();

  // 指针旋转角度计算
  const secondDeg = s * 6;
  const minuteDeg = m * 6 + s * 0.1;
  const hourDeg = (h % 12) * 30 + m * 0.5;

  return (
    <div
      ref={clockRef}
      onDoubleClick={toggleFullscreen}
      className={`clock-root theme-${currentTheme.id}`}
      style={{
        height: "100vh", width: "100vw", background: "black",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", position: "relative", cursor: "pointer"
      }}
    >
      {/* 极光背景 */}
      {currentTheme.id === "watch-aurora" && <div className="aurora-bg" />}

      {/* Matrix Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", inset: 0,
          opacity: currentTheme.id === "matrix" ? 0.8 : 0,
          pointerEvents: "none", transition: "opacity 1s"
        }}
      />

      {/* 苹果指针时钟 (带磨砂质感) */}
      {currentTheme.id === "apple-analog" && (
        <div className="glass-analog-container">
          <div className="glass-clock-face">
            {/* 刻度 */}
            {[...Array(12)].map((_, i) => (
              <div key={i} className="clock-mark" style={{ transform: `rotate(${i * 30}deg)` }} />
            ))}
            {/* 指针 */}
            <div className="hand h-hand" style={{ transform: `rotate(${hourDeg}deg)` }} />
            <div className="hand m-hand" style={{ transform: `rotate(${minuteDeg}deg)` }} />
            <div className="hand s-hand" style={{ transform: `rotate(${secondDeg}deg)` }} />
            <div className="center-pin" />
          </div>
          {/* 下方数字读数（不显示秒） */}
          <div className="analog-digital-time">
            {h.toString().padStart(2, "0")}:{m.toString().padStart(2, "0")}
          </div>
        </div>
      )}

      {/* 其他主题的数字显示 */}
      {currentTheme.id !== "apple-analog" && (
        <div className="time-display" style={{ zIndex: 1, textAlign: "center" }}>
          <span className="hours-mins">{h.toString().padStart(2, "0")}:{m.toString().padStart(2, "0")}</span>
          <span className="seconds">:{s.toString().padStart(2, "0")}</span>
        </div>
      )}

      {/* UI 控件 */}
      {!isFullscreen && (
        <div className="hint" style={{ position: "absolute", bottom: "100px", color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
          双击切换全屏
        </div>
      )}

      <div className="controls" style={{ position: "absolute", bottom: "40px", zIndex: 10, opacity: isFullscreen ? 0 : 1, transition: "opacity 0.3s" }}>
        <button onClick={(e) => { e.stopPropagation(); setCurrentThemeIndex((i) => (i + 1) % THEMES.length); }}>
          风格: {currentTheme.name}
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Major+Mono+Display&display=swap');

        /* 磨砂玻璃指针时钟样式 */
        .glass-analog-container {
          display: flex; flex-direction: column; align-items: center; gap: 30px;
          animation: fadeIn 1s ease;
        }
        .glass-clock-face {
          position: relative; width: 320px; height: 320px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05), 0 20px 50px rgba(0,0,0,0.5);
        }
        .clock-mark {
          position: absolute; width: 4px; height: 12px; background: rgba(255,255,255,0.4);
          left: 50%; top: 10px; transform-origin: center 150px; margin-left: -2px;
        }
        .hand {
          position: absolute; bottom: 50%; left: 50%;
          transform-origin: bottom center; border-radius: 10px;
        }
        .h-hand { width: 8px; height: 80px; background: white; margin-left: -4px; z-index: 2; }
        .m-hand { width: 6px; height: 120px; background: white; margin-left: -3px; z-index: 3; }
        .s-hand { 
          width: 2px; height: 140px; background: #FF3B30; margin-left: -1px; z-index: 4;
          box-shadow: 0 0 10px rgba(255, 59, 48, 0.5);
        }
        .center-pin {
          position: absolute; top: 50%; left: 50%; width: 12px; height: 12px;
          background: #eee; border-radius: 50%; transform: translate(-50%, -50%); z-index: 5;
        }
        .analog-digital-time {
          color: white; font-size: 3rem; font-weight: 200; 
          font-family: -apple-system, sans-serif; letter-spacing: 2px;
        }

        /* 其他主题原有样式 */
        .time-display { color: white; transition: all 0.8s; font-variant-numeric: tabular-nums; }
        .theme-matrix .time-display { font-family: 'Orbitron'; font-size: 15vw; color: #00ff41; text-shadow: 0 0 20px #00ff41; }
        
        .theme-watch-aurora .time-display { font-size: 18vw; font-weight: 800; }
        .aurora-bg {
          position: absolute; inset: 0;
          background: linear-gradient(125deg, #2c3e50, #27ae60, #2980b9, #8e44ad);
          background-size: 400% 400%; animation: aurora-flow 15s ease infinite;
          filter: blur(60px); opacity: 0.6;
        }

        .theme-watch-neon-line .time-display {
          font-family: 'Major Mono Display'; font-size: 18vw;
          background: linear-gradient(45deg, #FF00FF, #00FFFF, #FFFF00);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: neon-color-shift 8s ease infinite;
        }
        .theme-watch-neon-line .seconds { display: none; }

        .controls button {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: white; padding: 12px 28px; border-radius: 30px; cursor: pointer;
          backdrop-filter: blur(10px); transition: 0.3s;
        }
        
        @keyframes aurora-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
