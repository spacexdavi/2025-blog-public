"use client";

import { useEffect, useState } from "react";

export default function ClockPage() {
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 切换全屏
  const toggleFullscreen = () => {
    const elem = document.getElementById("clock-root");
    if (!document.fullscreenElement) {
      elem?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 双击退出全屏
  useEffect(() => {
    const elem = document.getElementById("clock-root");
    const handleDoubleClick = () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    };
    elem?.addEventListener("dblclick", handleDoubleClick);
    return () => {
      elem?.removeEventListener("dblclick", handleDoubleClick);
    };
  }, []);

  // ESC 键退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      id="clock-root"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #000000, #1a1a1a)",
        color: "#00ff99",
        fontSize: "5rem",
        fontFamily: "monospace",
        position: "relative",
        userSelect: "none",
      }}
    >
      <div style={{ textShadow: "0 0 20px #00ff99" }}>
        {time.toLocaleTimeString()}
      </div>

      {/* 右下角按钮（非全屏时显示） */}
      {!isFullscreen && (
        <button
          onClick={toggleFullscreen}
          style={{
            position: "absolute",
            bottom: "30px",
            right: "30px",
            padding: "12px 24px",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "none",
            background: "rgba(0, 255, 153, 0.2)",
            color: "#00ff99",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(0, 255, 153, 0.4)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(0, 255, 153, 0.2)")
          }
        >
          全屏
        </button>
      )}
    </div>
  );
}
