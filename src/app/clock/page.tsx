"use client";

import { useEffect, useState, useRef } from "react";

const THEMES = [
  { id: "matrix", name: "黑客帝国" },
  { id: "ios-lock", name: "iOS 锁屏" },
  { id: "watch-aurora", name: "Apple Watch 极光" },
  { id: "watch-neon-line", name: "Apple Watch 霓虹线条" }, // 替换了待机红
];

export default function ClockPage() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

  const clockRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentTheme = THEMES[currentThemeIndex];

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

  // Matrix 动画
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
        const text = String.fromCharCode(0x30A0 + Math.random() * 96); // 使用片假名更有原版感觉
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

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  return (
    <div
      ref={clockRef}
      onDoubleClick={toggleFullscreen} // 双击切换全屏
      className={`clock-root theme-${currentTheme.id}`}
      style={{
        height: "100vh",
        width: "100vw",
        background: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        cursor: "pointer"
      }}
    >
      {/* 极光背景 (仅在 Watch Aurora 模式显示) */}
      {currentTheme.id === "watch-aurora" && <div className="aurora-bg" />}

      {/* Matrix Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          opacity: currentTheme.id === "matrix" ? 0.8 : 0,
          pointerEvents: "none",
          transition: "opacity 1s"
        }}
      />

      {/* 时间显示 */}
      <div className="time-display" style={{ zIndex: 1, textAlign: "center" }}>
        <span className="hours-mins">{hours}:{minutes}</span>
        {currentTheme.id !== "ios-lock" && <span className="seconds">:{seconds}</span>}
      </div>

      {/* 底部提示 (全屏时淡出) */}
      {!isFullscreen && (
        <div className="hint" style={{ position: "absolute", bottom: "100px", color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
          双击屏幕切换全屏
        </div>
      )}

      {/* 交互按钮 */}
      <div className="controls" style={{ 
        position: "absolute", 
        bottom: "40px", 
        zIndex: 10,
        opacity: isFullscreen ? 0 : 1,
        transition: "opacity 0.3s"
      }}>
        <button onClick={(e) => { e.stopPropagation(); setCurrentThemeIndex((i) => (i + 1) % THEMES.length); }}>
          风格: {currentTheme.name}
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Major+Mono+Display&display=swap'); /* 新增，用于霓虹线条 */

        .time-display { 
          color: white; 
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); 
          font-variant-numeric: tabular-nums; 
          text-shadow: none; /* 重置之前的 text-shadow 影响 */
        }
        
        /* Matrix 增强：使用更科幻的字体和发光 */
        .theme-matrix .time-display { 
            font-family: 'Orbitron', 'Courier New', monospace; 
            font-size: 15vw; color: #00ff41; 
            text-shadow: 0 0 10px #00ff41, 0 0 30px rgba(0,255,65,0.5);
            letter-spacing: -2px;
        }
        
        /* iOS 锁屏：追求极致轻盈 */
        .theme-ios-lock .time-display { 
            font-family: -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif; 
            font-weight: 200; font-size: 24vw; 
            letter-spacing: -5px;
            filter: drop-shadow(0 0 10px rgba(0,0,0,0.3));
        }

        /* Watch 极光：流动的渐变背景 */
        .theme-watch-aurora .time-display {
            font-size: 18vw; font-weight: 800;
            color: white;
            text-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .aurora-bg {
            position: absolute; inset: 0;
            background: linear-gradient(125deg, #2c3e50, #27ae60, #2980b9, #8e44ad);
            background-size: 400% 400%;
            animation: aurora-flow 15s ease infinite;
            filter: blur(60px); opacity: 0.6;
        }

        /* Apple Watch 霓虹线条 */
        .theme-watch-neon-line .time-display {
            font-family: 'Major Mono Display', monospace; /* 使用线条感字体 */
            font-size: 18vw; 
            font-weight: 400; /* 字体不宜过粗 */
            background: linear-gradient(45deg, #FF00FF, #00FFFF, #FFFF00, #00FF00); /* 多彩渐变 */
            background-size: 300% 300%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: neon-color-shift 8s ease infinite;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px #00FFFF, 0 0 30px #FF00FF; /* 霓虹发光效果 */
            letter-spacing: -5px;
        }
        /* 隐藏秒数，因为霓虹线条风格更注重简洁 */
        .theme-watch-neon-line .seconds {
            display: none;
        }


        .controls button {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
            color: white; padding: 10px 24px; border-radius: 30px; cursor: pointer;
            backdrop-filter: blur(15px); transition: 0.3s;
        }
        .controls button:hover { background: rgba(255,255,255,0.15); }

        @keyframes aurora-flow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        @keyframes neon-color-shift {
            0% { background-position: 0% 50%; }
            25% { background-position: 50% 100%; }
            50% { background-position: 100% 50%; }
            75% { background-position: 50% 0%; }
            100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
