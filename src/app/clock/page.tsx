"use client";

import { useEffect, useState, useRef } from "react";

const THEMES = [
  { id: "matrix", name: "黑客帝国" },
  { id: "ios-lock", name: "iOS 锁屏" },
  { id: "watch-aurora", name: "Apple Watch 极光" },
  { id: "standby-red", name: "待机模式" },
];

export default function ClockPage() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

  const clockRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentTheme = THEMES[currentThemeIndex];

  // 1. 初始化
  useEffect(() => {
    setMounted(true);
    const updateTime = () => setTime(new Date());
    const timer = setInterval(updateTime, 1000);
    updateTime();
    return () => clearInterval(timer);
  }, []);

  // 2. 永不息屏 (Wake Lock)
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

  // 3. 全屏监听
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // 4. Matrix 动画修复
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
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff99";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = Math.random() > 0.5 ? "0" : "1";
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
      className={`clock-root theme-${currentTheme.id}`}
      style={{
        height: "100vh",
        width: "100vw",
        background: "black",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative"
      }}
    >
      {/* 动画 Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          opacity: currentTheme.id === "matrix" ? 0.6 : 0,
          pointerEvents: "none",
          transition: "opacity 1s"
        }}
      />

      {/* 时间显示区 */}
      <div className="time-display" style={{ zIndex: 1, textAlign: "center" }}>
        <span className="hours-mins">{hours}:{minutes}</span>
        {currentTheme.id !== "ios-lock" && <span className="seconds">:{seconds}</span>}
      </div>

      {/* 交互按钮 */}
      <div className="controls" style={{ 
        position: "absolute", 
        bottom: "40px", 
        zIndex: 10,
        opacity: isFullscreen ? 0 : 1,
        transition: "opacity 0.3s"
      }}>
        <button onClick={() => setCurrentThemeIndex((i) => (i + 1) % THEMES.length)}>
          风格: {currentTheme.name}
        </button>
        <button onClick={toggleFullscreen} style={{ marginLeft: "10px" }}>
          {isFullscreen ? "退出全屏" : "全屏"}
        </button>
      </div>

      {/* 核心样式注入 */}
      <style>{`
        .time-display { color: white; transition: all 0.5s; font-variant-numeric: tabular-nums; }
        
        .theme-matrix .time-display { 
            font-family: monospace; font-size: 15vw; color: #00ff99; 
            text-shadow: 0 0 20px #00ff99; 
        }
        
        .theme-ios-lock .time-display { 
            font-family: -apple-system, system-ui; font-weight: 200; font-size: 20vw; 
        }

        .theme-watch-aurora .time-display {
            font-size: 18vw; font-weight: 900;
            background: linear-gradient(45deg, #ff9a9e, #a18cd1, #4facfe);
            background-size: 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: aurora 5s infinite;
        }

        .theme-standby-red .time-display {
            font-family: sans-serif; font-weight: 800; font-size: 22vw;
            color: #ff3b30; text-shadow: 0 0 50px rgba(255, 0, 0, 0.5);
        }

        .controls button {
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
            color: white; padding: 8px 16px; border-radius: 20px; cursor: pointer;
            backdrop-filter: blur(10px);
        }

        @keyframes aurora {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
