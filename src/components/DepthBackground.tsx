'use client';
// 메인 페이지 배경 공간감 효과
//  - 마우스를 움직이면 배경이 반대 방향으로 살짝 밀려 깊이감이 생김 (PC 전용)
// 스타일은 같은 폴더의 depth-background.css 에 있고, 이 파일이 자동으로 불러옵니다.
import './depth-background.css';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// ──────────────────────────────────────────────
// ★ 여기만 고치면 됩니다 ★
const CONFIG = {
  parallax: 18,   // 배경이 움직이는 최대 거리(px). 0이면 움직이지 않음
};
// ──────────────────────────────────────────────

export default function DepthBackground() {
  const isMain = usePathname() === '/';          // 메인 페이지에서만

  // 메인에 있는 동안만 body에 표시를 달아 CSS가 동작하게 함
  useEffect(() => {
    if (!isMain) return;
    const b = document.body;
    b.classList.add('depth-on');
    return () => {
      b.classList.remove('depth-on');
      b.style.removeProperty('--dx');
      b.style.removeProperty('--dy');
    };
  }, [isMain]);

  // 마우스 따라 배경 이동
  useEffect(() => {
    if (!isMain || CONFIG.parallax <= 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;     // 마우스 없는 화면은 건너뜀

    const b = document.body;
    let raf = 0, nx = 0, ny = 0;
    const apply = () => {
      raf = 0;
      // 배경을 6% 키워 두었으므로 화면의 2.5%를 넘게 움직이면 가장자리가 비어 보임
      const amp = Math.min(CONFIG.parallax, window.innerWidth * 0.025, window.innerHeight * 0.025);
      b.style.setProperty('--dx', (-nx * amp).toFixed(1) + 'px');
      b.style.setProperty('--dy', (-ny * amp).toFixed(1) + 'px');
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      nx = (e.clientX / window.innerWidth) * 2 - 1;
      ny = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isMain]);

  return null;
}
