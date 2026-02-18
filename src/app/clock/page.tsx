"use client";

import { useEffect, useState, useRef } from "react";

// 定义支持的主题
const THEMES = [
  { id: "matrix", name: "黑客帝国" },
  { id: "ios-lock", name: "iOS 锁屏" },
  { id: "watch-aurora", name: "Apple Watch 极光" },
  { id: "standby-red", name: "待机模式 (Nightstand)" },
];

export default function ClockPage() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

  const clockRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentTheme = THEMES[currentThemeIndex];

  // 1. 初始化与时间更新
  useEffect(() => {
    setMounted(true);
    const updateTime = () => setTime(new Date());
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. 永不息屏 (Wake Lock API)
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch (err) {
        console.warn("Wake Lock 失败:", err);
      }
    };

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock) wakeLock.release();
    };
  }, []);

  // 3. 全屏事件监听
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // 4. 黑客帝国 Matrix 背景逻辑 (仅在 matrix 主题下运行)
  useEffect(() => {
    if (!mounted || currentTheme.id !== "matrix" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    let animationFrameId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const letters = "01";
    const fontSize = 14;
    let columns = Math.floor(canvas.width / fontSize);
    let drops: number[] = new Array(columns).fill(1);

    function draw() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0, 255, 153, 0.2)";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = setTimeout(() => requestAnimationFrame(draw), 33) as any;
    }

    draw();

    return () => {
      clearTimeout(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [mounted, currentTheme.id]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      clockRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  const cycleTheme = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发双击退出全屏
    setCurrentThemeIndex((prev) => (prev + 1) % THEMES.length);
  };

  if (!mounted || !time) return <div style={{ background: "black", height: "100vh" }} />;

  // 格式化时间
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  return (
    <div
      id="clock-root"
      ref={clockRef}
      onDoubleClick={() => isFullscreen && document.exitFullscreen()}
      className={`theme-${currentTheme.id}`}
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "black",
        transition: "all 0.5s ease",
      }}
    >
      {/* 仅在 Matrix 主题渲染 Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
          opacity: currentTheme.id === "matrix" ? 1 : 0,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
        }}
      />

      {/* 时钟主体显示 */}
      <div className="clock-container" style={{ zIndex: 1, userSelect: "none" }}>
        <div className="time-display">
          <span>{hours}</span>
          <span className="colon">:</span>
          <span>{minutes}</span>
          <span className="seconds">{seconds}</span>
        </div>
      </div>

      {/* 控制栏 */}
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          display: "flex",
          gap: "15px",
          zIndex: 2,
          opacity: isFullscreen ? 0 : 1, // 全屏时隐藏控制按钮，保持纯净
          transition: "opacity 0.3s ease",
        }}
        className="controls"
      >
        <button className="glass-btn" onClick={cycleTheme}>
          切换风格: {currentTheme.name}
        </button>
        <button className="glass-btn" onClick={toggleFullscreen}>
          全屏模式
        </button>
      </div>

      <style jsx>{`
        /* 全局及通用动画 */
        .glass-btn {
          padding: 10px 20px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          backdrop-filter: blur(10px);
          font-family: sans-serif;
          transition: all 0.2s;
        }
        .glass-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        /* 为了在全屏时也能唤出按钮，添加 hover 区域 */
        #clock-root:hover .controls {
          opacity: 1 !important;
        }

        .clock-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .time-display {
          display: flex;
          align-items: baseline;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* 1. 黑客帝国 (原始极客风) */
        .theme-matrix .time-display {
          font-family: monospace;
          color: #00ff99;
          font-size: max(5rem, 10vw);
          text-shadow: 0 0 20px #00ff99;
        }
        .theme-matrix .seconds {
          font-size: max(2rem, 4vw);
          margin-left: 10px;
          color: rgba(0, 255, 153, 0.7);
        }

        /* 2. iOS 锁屏 (极简旧金山字体风格) */
        .theme-ios-lock .time-display {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-weight: 200; /* 极细字体 */
          color: #ffffff;
          font-size: max(7rem, 14vw);
          letter-spacing: -0.05em;
        }
        .theme-ios-lock .colon {
          animation: blink 2s infinite;
        }
        .theme-ios-lock .seconds {
          display: none; /* iOS锁屏通常不显示秒 */
        }

        /* 3. Apple Watch 极光渐变 */
        .theme-watch-aurora .time-display {
          font-family: "SF Pro Rounded", -apple-system, sans-serif;
          font-weight: 800;
          font-size: max(8rem, 15vw);
          background: linear-gradient(45deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: aurora 5s linear infinite;
        }
        .theme-watch-aurora .seconds {
          font-size: max(3rem, 5vw);
          font-weight: 600;
          margin-left: 15px;
        }

        /* 4. iOS 待机模式 (Nightstand 横屏红) */
        .theme-standby-red .time-display {
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 700;
          color: #ff3b30;
          font-size: max(9rem, 18vw);
          text-shadow: 0 0 40px rgba(255, 59, 48, 0.4);
          letter-spacing: -0.02em;
        }
        .theme-standby-red .seconds {
          font-size: max(4rem, 8vw);
          margin-left: 20px;
          opacity: 0.8;
        }

        /* 关键帧动画 */
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.3; }
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
