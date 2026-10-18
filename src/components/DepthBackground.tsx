'use client';
// 메인 페이지 배경 공간감 효과
//  - 마우스를 움직이면 배경이 반대 방향으로 살짝 밀려 깊이감이 생김 (PC 전용)
//  - 빛기둥: 왼쪽 위 광원에서 비스듬히 내려오는 빛줄기 3줄 — 페이지 위에서 비추는 빛 (클릭은 통과)
//  - 렌즈 플레어: 광원에서 마우스 쪽으로 이어지는 선 위에 놓인 빛 고리들. 스스로 움직이지 않고,
//    마우스가 광원에서 멀어지면 퍼지고 가까워지면 모이며, 광원과 같은 박자로 숨 쉼
//  - 가장자리를 살짝 어둡게(비네팅) + 아래쪽에 옅은 안개
//  - 빛 알갱이(먼지): 작은 것 위주 + 큰 보케 몇 개. 뒤에서 분홍·하늘색 글로우가 번지며 움직임(프리즘빛).
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
  maxDefer: 12000, // 효과는 로딩 화면이 끝난 뒤에 시작함. 이 시간(ms)이 지나면 로딩 화면이 남아 있어도 시작
  parallax: 18,   // 배경이 움직이는 최대 거리(px). 0이면 움직이지 않음
  light: true,    // 빛기둥(광원 + 비스듬한 빛줄기 3줄)을 쓸지. false면 빛기둥만 빠짐 (휴대폰에서는 항상 숨김)
  flare: true,    // 렌즈 플레어(마우스에 따라 퍼지고 모이는 빛 고리)를 쓸지. 빛기둥과 따로 켜고 끔
  size: 0.7,      // 알갱이 크기 배율 (1 = 기본, 1.5 = 1.5배). 잘 안 보이면 올리고, 너무 크면 내리세요
  dust: {
    tiny: 7,      // 작은 알갱이 (4~8px)
    small: 3,     // 조금 큰 알갱이 (8~14px)
    big: 1,       // 크고 흐릿한 보케 — 포인트 (30~50px)
  },              // 전부 0으로 하면 알갱이가 없어짐
};
// 색과 세기는 depth-background.css 맨 위에서 바꿉니다
// ──────────────────────────────────────────────

// 종류별 범위: s 크기(px) · o 투명도 · bl 번짐(px) · z 마우스를 따라 움직이는 정도(클수록 앞쪽) · t 떠다니는 주기(초)
const SPEC = {
  tiny:  { s: [4, 8],   o: [0.6, 1],     bl: [0.3, 0.8], z: [0.4, 0.8], t: [8, 14] },
  small: { s: [8, 14],  o: [0.55, 0.95], bl: [0.5, 1.1], z: [0.8, 1.1], t: [7, 12] },
  big:   { s: [30, 50], o: [0.25, 0.45], bl: [3, 6],     z: [1.4, 1.8], t: [10, 16] },
} as const;
type Kind = keyof typeof SPEC;
interface Dust { kind: Kind; style: CSSProperties }

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function makeDust(counts: Record<Kind, number>): Dust[] {
  const out: Dust[] = [];
  (Object.keys(SPEC) as Kind[]).forEach(kind => {
    const sp = SPEC[kind];
    for (let i = 0; i < counts[kind]; i++) {
      const s = rnd(sp.s[0], sp.s[1]) * CONFIG.size;
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
          ['--sz' as string]: s.toFixed(1),                           // 글로우 번짐을 알갱이 크기에 맞추기 위한 값
          ['--gt' as string]: rnd(10, 18).toFixed(1) + 's',           // 글로우가 한 바퀴 도는 시간
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
  const [ready, setReady] = useState(false);   // 로딩 화면이 끝났는지
  const [dust, setDust] = useState<Dust[]>([]);

  // 화면이 그려진 뒤에 알갱이를 무작위로 만든다 (서버 화면과 어긋나지 않게). 휴대폰은 만들지 않음
  useEffect(() => { setMounted(true); }, []);

  // 로딩 화면이 끝난 뒤에 효과를 시작한다 — 사진을 불러오는 동안 컴퓨터가 효과를 그리느라 느려지지 않게.
  // 로딩 화면이 없거나 이미 본 탭이면 페이지가 다 로드된 직후에 시작
  useEffect(() => {
    let cancelled = false;
    const t0 = performance.now();
    const loading = () => {
      const el = document.querySelector('.ls-wrap');
      return !!el && !el.classList.contains('ls-hide') && getComputedStyle(el).display !== 'none';
    };
    const tick = () => {
      if (cancelled) return;
      if (!loading() || performance.now() - t0 > CONFIG.maxDefer) { setReady(true); return; }
      window.setTimeout(tick, 200);
    };
    const go = () => window.setTimeout(tick, 100);
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
    return () => { cancelled = true; window.removeEventListener('load', go); };
  }, []);

  // 알갱이는 효과를 시작할 때 만든다 (휴대폰은 만들지 않음)
  useEffect(() => {
    if (!ready) return;
    const touch = window.matchMedia('(hover: none)').matches;
    setDust(touch ? [] : makeDust(CONFIG.dust));
  }, [ready]);

  // 메인에 있는 동안만 body에 표시를 달아 CSS가 동작하게 함
  useEffect(() => {
    if (!isMain || !ready) return;
    const b = document.body;
    b.classList.add('depth-on');
    return () => {
      b.classList.remove('depth-on');
      b.style.removeProperty('--dx');
      b.style.removeProperty('--dy');
    };
  }, [isMain, ready]);

  // 마우스 따라 배경 이동 (알갱이는 이 값을 반대로 받아 움직임)
  useEffect(() => {
    if (!isMain || !ready) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;     // 마우스 없는 화면은 건너뜀

    const b = document.body;
    let raf = 0, nx = 0, ny = 0, mx = 0.5, my = 0.5;
    // 광원 위치(CSS의 --lx, --ly). 마우스가 광원에서 얼마나 가까운지로 플레어의 밝기를 정한다
    const cs = getComputedStyle(document.documentElement);
    const lx = parseFloat(cs.getPropertyValue('--lx')) || 0.14;
    const ly = parseFloat(cs.getPropertyValue('--ly')) || 0.075;
    const apply = () => {
      raf = 0;
      // 배경을 6% 키워 두었으므로 화면의 2.5%를 넘게 움직이면 가장자리가 비어 보임
      const amp = Math.min(CONFIG.parallax, window.innerWidth * 0.025, window.innerHeight * 0.025);
      b.style.setProperty('--dx', (-nx * amp).toFixed(1) + 'px');
      b.style.setProperty('--dy', (-ny * amp).toFixed(1) + 'px');
      // 렌즈 플레어: 마우스 위치와 광원까지의 가까움(0~1)
      const W = window.innerWidth, H = window.innerHeight;
      const dist = Math.hypot((mx - lx) * W, (my - ly) * H) / Math.hypot(W, H);
      b.style.setProperty('--mx', mx.toFixed(3));
      b.style.setProperty('--my', my.toFixed(3));
      b.style.setProperty('--fk', Math.max(0, 1 - dist * 1.4).toFixed(2));
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      nx = (e.clientX / window.innerWidth) * 2 - 1;
      ny = (e.clientY / window.innerHeight) * 2 - 1;
      mx = e.clientX / window.innerWidth;
      my = e.clientY / window.innerHeight;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isMain, ready]);

  // body 바로 아래에 붙인다. 빛기둥 → 렌즈 플레어 → 알갱이 순으로 모두 페이지 위에 겹쳐진다
  if (!mounted || !ready) return null;
  return createPortal(
    <>
      {CONFIG.light && (
        <div className="depth-light" aria-hidden="true">
          {/* 빛이 뿜어져 나오는 광원 */}
          <div className="dl-source" />
          {/* 겹쳐져서 깊이감을 만드는 대각선 빛기둥들 */}
          <div className="dl-ray dl-ray-1" />
          <div className="dl-ray dl-ray-2" />
          <div className="dl-ray dl-ray-3" />
        </div>
      )}
      {CONFIG.flare && (
        /* 렌즈 플레어: 광원(눈부심·가로 줄기)과, 광원에서 마우스 쪽으로 이어지는 선 위의 빛 고리 6개.
           위치는 전부 CSS가 계산하고, 이 파일은 마우스 위치만 알려 준다 */
        <div className="depth-flare" aria-hidden="true">
          <i className="fl-g fl-core" />
          <i className="fl-g fl-streak" />
          <i className="fl-g fl-g1" />
          <i className="fl-g fl-g2" />
          <i className="fl-g fl-g3" />
          <i className="fl-g fl-g4" />
          <i className="fl-g fl-g5" />
          <i className="fl-g fl-g6" />
        </div>
      )}
      {dust.length > 0 && (
        <div className="depth-dust" aria-hidden="true">
          {dust.map((d, k) => <i key={k} className={d.kind} style={d.style}><b /></i>)}
        </div>
      )}
    </>,
    document.body,
  );
}
