"use client";

import { useEffect, useState } from "react";

export default function ClockPage() {
  const [time, setTime] = useState(new Date());
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setAnimate(true);
      setTimeout(() => setAnimate(false), 500); // 动画持续 0.5s
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0F0"; // 绿色
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

      {/* 时钟文字 */}
      <div
        style={{
          fontSize: "6rem",
          textShadow: "0 0 20px #00ff99",
          zIndex: 1,
          filter: animate ? "blur(8px)" : "blur(0px)",
          transition: "filter 0.5s ease-out",
        }}
      >
        {time.toLocaleTimeString()}
      </div>
    </div>
  );
}
