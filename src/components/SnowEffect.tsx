'use client';

import { useEffect, useRef } from 'react';

export default function SnowEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const numFlakes = Math.floor((width * height) / 10000);
    const flakes: any[] = [];

    class Snowflake {
      x = 0;
      y = 0;
      radius = 0;
      speed = 0;
      wind = 0;
      opacity = 0;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * -height;
        this.radius = Math.random() * 3 + 1;
        this.speed = Math.random() * 1 + 0.5;
        this.wind = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.7 + 0.3;
      }

      update() {
        this.y += this.speed;
        this.x += Math.sin(this.y / 30) + this.wind;

        if (this.y > height) {
          this.reset();
          this.y = 0;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < numFlakes; i++) {
      flakes.push(new Snowflake());
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const flake of flakes) {
        flake.update();
        flake.draw();
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

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
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
