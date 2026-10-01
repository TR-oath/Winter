'use client';

import React, { useEffect, useRef } from 'react';

export default function SnowEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // 💡 화면 폭에 비례하여 눈송이 수 조절 (모바일은 가볍게 15~20개, PC는 60~70개)
    const flakeCount = Math.max(15, Math.floor(width / 25));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const flakes = Array.from({ length: flakeCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.5 + 1, // 눈송이 크기 살짝 정돈
      d: Math.random() * 0.8 + 0.4, // 낙하 속도 정돈
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      for (const f of flakes) {
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
      }
      ctx.fill();

      for (const f of flakes) {
        f.y += f.d;
        f.x += Math.sin(f.y / 30) * 0.5;
        if (f.y > height) {
          f.y = -10;
          f.x = Math.random() * width;
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}
