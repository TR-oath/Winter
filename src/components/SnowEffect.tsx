'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function SnowEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

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
      r: Math.random() * 2.5 + 1,
      d: Math.random() * 0.8 + 0.4,
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
  }, [mounted]);

  if (!mounted) return null;

  // 💡 createPortal을 사용해 document.body 바로 밑으로 canvas를 격리합니다.
  return createPortal(
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
        zIndex: 9999,
      }}
    />,
    document.body
  );
}
