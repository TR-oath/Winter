'use client';
// 마우스를 움직이면 깃털이 하나씩 떨어지는 효과 (PC 전용, 터치 화면에서는 나오지 않음)
import { useEffect } from 'react';

// ──────────────────────────────────────────────
// ★ 여기만 고치면 됩니다 ★
const CONFIG = {
  opacity: 0.55,     // 진하기 (0.2 ~ 0.9)
  distance: 47,      // 마우스가 이만큼(px) 움직일 때마다 깃털 하나 (클수록 드문드문)
  interval: 80,      // 깃털 사이 최소 시간(ms)
  max: 22,           // 화면에 동시에 떠 있는 깃털 최대 개수
  size: [8, 13],     // 깃털 너비(px) 범위 (처음 12~20px의 66%)
  life: [1800, 2800],// 떨어져서 사라지기까지 시간(ms)
  fall: [70, 130],   // 떨어지는 거리(px)
  sway: 60,          // 좌우로 흩날리는 폭(px)
  zIndex: 80,        // 상단바(60)·BGM(70) 위, 모달(90) 아래
};
// ──────────────────────────────────────────────

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

const feather = (from: string, to: string) =>
  'url("data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 48"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><path d="M10 1C17 8 18 26 11 46C9 38 4 26 3 17C3 9 7 3 10 1Z" fill="url(#g)" stroke="rgba(150,168,200,.55)" stroke-width=".7"/><path d="M10.5 3C10.9 18 11 32 11 45" stroke="rgba(140,158,192,.7)" stroke-width=".8" fill="none"/><path d="M10.7 12L16 19M10.8 22L16.5 30M10.9 32L15.5 39M10.6 12L5 18M10.7 22L4.5 28" stroke="rgba(160,176,205,.5)" stroke-width=".5" fill="none"/></svg>`,
  ) + '")';

export default function FeatherCursor() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;       // 마우스가 없는 화면은 건너뜀

    const tints = [feather('#ffffff', '#e6edf9'), feather('#ffffff', '#fde8ef'), feather('#ffffff', '#e4f1ff')];
    const live = new Set<HTMLElement>();
    let lx = 0, ly = 0, lt = 0, started = false;

    const spawn = (x: number, y: number) => {
      const w = rnd(CONFIG.size[0], CONFIG.size[1]);
      const life = rnd(CONFIG.life[0], CONFIG.life[1]);
      const r0 = rnd(-60, 60), r1 = r0 + rnd(-90, 90);
      const dx = rnd(-CONFIG.sway / 2, CONFIG.sway / 2), dy = rnd(CONFIG.fall[0], CONFIG.fall[1]);
      const o = CONFIG.opacity * rnd(0.7, 1);

      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'fixed', left: x + 'px', top: y + 'px', width: w + 'px', height: w * 2.4 + 'px',
        background: `${tints[Math.floor(Math.random() * tints.length)]} center/contain no-repeat`,
        pointerEvents: 'none', zIndex: String(CONFIG.zIndex), opacity: '0', willChange: 'transform, opacity',
        filter: 'drop-shadow(0 1px 2px rgba(60,90,150,.3))',
      });
      document.body.appendChild(el);
      live.add(el);

      const anim = el.animate([
        { transform: `translate(-50%,-50%) rotate(${r0}deg)`, opacity: 0 },
        { opacity: o, offset: 0.15 },
        { transform: `translate(calc(-50% + ${-dx * 0.35}px),calc(-50% + ${dy * 0.5}px)) rotate(${(r0 + r1) / 2}deg)`, opacity: o * 0.9, offset: 0.55 },
        { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${r1}deg)`, opacity: 0 },
      ], { duration: life, easing: 'cubic-bezier(.3,.6,.4,1)' });
      anim.onfinish = () => { el.remove(); live.delete(el); };
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || document.hidden) return;
      const now = performance.now();
      if (!started) { lx = e.clientX; ly = e.clientY; lt = now; started = true; return; }
      if (Math.hypot(e.clientX - lx, e.clientY - ly) < CONFIG.distance) return;
      if (now - lt < CONFIG.interval || live.size >= CONFIG.max) return;
      lx = e.clientX; ly = e.clientY; lt = now;
      spawn(e.clientX, e.clientY);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      live.forEach(el => el.remove());
      live.clear();
    };
  }, []);

  return null;
}
