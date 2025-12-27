"use client";

import { useEffect, useState } from "react";

export default function ClockPage() {
  const [time, setTime] = useState(new Date());
  const [prevDigits, setPrevDigits] = useState<string[]>([]);
  const [digits, setDigits] = useState<string[]>([]);

  useEffect(() => {
    const updateTime = () => {
      const newTime = new Date();
      setTime(newTime);
      const newDigits = newTime.toLocaleTimeString().split("");
      setPrevDigits(digits);
      setDigits(newDigits);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [digits]);

  // 绘制黑客帝国背景
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

      ctx.fillStyle = "rgba(0,255,0,0.3)"; // 半透明绿色
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

      {/* 时钟文字（逐位渲染） */}
      <div
        style={{
          fontSize: "6rem",
          textShadow: "0 0 20px #00ff99",
          zIndex: 1,
          display: "flex",
        }}
      >
        {digits.map((digit, i) => {
          const changed = prevDigits[i] !== digit;
          return (
            <span
              key={i}
              style={{
                transition: "filter 0.5s ease-out",
                filter: changed ? "blur(8px)" : "blur(0px)",
              }}
            >
              {digit}
            </span>
          );
        })}
      </div>
    </div>
  );
}
