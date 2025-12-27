"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ClockPage() {
  const [time, setTime] = useState(new Date());
  const [digits, setDigits] = useState<string[]>([]);
  const [prevDigits, setPrevDigits] = useState<string[]>([]);
  const [changedIndexes, setChangedIndexes] = useState<number[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const newTime = new Date();
      const newDigits = newTime.toLocaleTimeString().split("");
      const changed: number[] = [];
      newDigits.forEach((d, i) => {
        if (digits[i] !== d) {
          changed.push(i);
        }
      });
      setPrevDigits(digits);
      setDigits(newDigits);
      setChangedIndexes(changed);
      setTime(newTime);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [digits]);

  // 全屏切换
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

  // ESC退出全屏
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

  // 背景代码雨
  useEffect(() => {
    const canvas = document.getElementById("matrix") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    const letters = "01";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;

    function draw() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(0,255,0,0.25)"; // 更淡的绿色
      ctx.font = fontSize + "px monospace";

      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="clock-root"
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        fontFamily: "'Orbitron', sans-serif",
        color: "#00ff99",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "black",
      }}
    >
      {/* 背景 Canvas */}
      <canvas
        id="matrix"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      ></canvas>

      {/* 左上角导航 */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 10,
        }}
      >
        <Link href="/" className="nav-link">
          ← 返回首页
        </Link>
      </div>

      {/* 时钟文字 */}
      <div
        style={{
          fontSize: "6rem",
          textShadow: "0 0 20px #00ff99",
          zIndex: 1,
          display: "flex",
        }}
      >
        {digits.map((digit, i) => {
          const changed = changedIndexes.includes(i);
          // 用 digit + 时间戳作为 key，强制触发动画
          const key = changed ? `${digit}-${Date.now()}` : `${digit}-${i}`;
          return (
            <span
              key={key}
              className={changed ? "digit-change" : ""}
              style={{ margin: "0 2px" }}
            >
              {digit}
            </span>
          );
        })}
      </div>

      {/* 右下角全屏按钮 */}
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
            zIndex: 2,
          }}
        >
          全屏
        </button>
      )}

      <style jsx>{`
        .nav-link {
          color: #00ff99;
          text-decoration: none;
          cursor: pointer;
        }
        .digit-change {
          animation: blurIn 0.5s ease-out;
        }
        @keyframes blurIn {
          0% {
            filter: blur(8px);
            opacity: 0.5;
          }
          100% {
            filter: blur(0px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
