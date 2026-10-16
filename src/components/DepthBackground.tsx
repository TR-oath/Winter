'use client';
// 메인 페이지 배경 공간감 효과
//  - 마우스를 움직이면 배경이 반대 방향으로 살짝 밀려 깊이감이 생김 (PC 전용)
//  - 가장자리를 살짝 어둡게(비네팅) + 아래쪽에 옅은 안개
//  - 빛 알갱이(먼지): 작은 것 위주 + 큰 보케 몇 개. 둘레에 살짝 프리즘빛이 돎.
//    페이지 위에 떠 있는 가장 앞쪽 층이고, 배경과 반대 방향으로 움직임 (PC 메인에서만 보임)
// 스타일은 같은 폴더의 depth-background.css 에 있고, 이 파일이 자동으로 불러옵니다.
import './depth-background.css';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

// ──────────────────────────────────────────────
// ★ 여기만 고치면 됩니다 ★
const CONFIG = {
  parallax: 18,   // 배경이 움직이는 최대 거리(px). 0이면 움직이지 않음
  dust: {
    tiny: 7,      // 아주 작은 알갱이 (2~5px)
    small: 3,     // 작은 알갱이 (5~9px)
    big: 1,       // 크고 흐릿한 보케 — 포인트 (24~42px)
  },              // 전부 0으로 하면 알갱이가 없어짐
};
// 색과 세기는 depth-background.css 맨 위에서 바꿉니다
// ──────────────────────────────────────────────

// 종류별 범위: s 크기(px) · o 투명도 · bl 번짐(px) · z 마우스를 따라 움직이는 정도(클수록 앞쪽) · t 떠다니는 주기(초)
const SPEC = {
  tiny:  { s: [2, 5],   o: [0.5, 0.95],  bl: [0.4, 1],   z: [0.4, 0.8], t: [8, 14] },
  small: { s: [5, 9],   o: [0.45, 0.85], bl: [0.8, 1.4], z: [0.8, 1.1], t: [7, 12] },
  big:   { s: [24, 42], o: [0.22, 0.4],  bl: [3, 6],     z: [1.4, 1.8], t: [10, 16] },
} as const;
type Kind = keyof typeof SPEC;
interface Dust { kind: Kind; style: CSSProperties }

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function makeDust(counts: Record<Kind, number>): Dust[] {
  const out: Dust[] = [];
  (Object.keys(SPEC) as Kind[]).forEach(kind => {
    const sp = SPEC[kind];
    for (let i = 0; i < counts[kind]; i++) {
      const s = rnd(sp.s[0], sp.s[1]);
      out.push({
        kind,
        style: {
          left: rnd(2, 98).toFixed(1) + '%', top: rnd(2, 98).toFixed(1) + '%',
          width: s, height: s,
          ['--o' as string]: rnd(sp.o[0], sp.o[1]).toFixed(2),
          ['--bl' as string]: rnd(sp.bl[0], sp.bl[1]).toFixed(1) + 'px',
          ['--z' as string]: rnd(sp.z[0], sp.z[1]).toFixed(2),
          ['--t' as string]: rnd(sp.t[0], sp.t[1]).toFixed(1) + 's',
          ['--d' as string]: '-' + rnd(0, 10).toFixed(1) + 's',
          ['--sx' as string]: rnd(-30, 30).toFixed(0) + 'px',
          ['--sy' as string]: '-' + rnd(10, 50).toFixed(0) + 'px',
          ['--h' as string]: Math.round(rnd(0, 360)) + 'deg',          // 프리즘빛이 시작되는 각도
          ['--rs' as string]: rnd(6, 14).toFixed(1) + 's',            // 프리즘빛이 도는 속도
          ['--tw' as string]: rnd(2, 5).toFixed(1) + 's',
          ['--td' as string]: '-' + rnd(0, 5).toFixed(1) + 's',
        } as CSSProperties,
      });
    }
  });
  return out;
}

export default function DepthBackground() {
  const isMain = usePathname() === '/';          // 메인 페이지에서만
  const [mounted, setMounted] = useState(false);
  const [dust, setDust] = useState<Dust[]>([]);

  // 화면이 그려진 뒤에 알갱이를 무작위로 만든다 (서버 화면과 어긋나지 않게). 휴대폰은 만들지 않음
  useEffect(() => {
    setMounted(true);
    const touch = window.matchMedia('(hover: none)').matches;
    setDust(touch ? [] : makeDust(CONFIG.dust));
  }, []);

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

  // 마우스 따라 배경 이동 (알갱이는 이 값을 반대로 받아 움직임)
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

  // 알갱이 층: body 바로 아래에 붙인다 (페이지 내용 위 가장 앞쪽)
  if (!mounted || dust.length === 0) return null;
  return createPortal(
    <div className="depth-dust" aria-hidden="true">
      {dust.map((d, k) => <i key={k} className={d.kind} style={d.style} />)}
    </div>,
    document.body,
  );
}
