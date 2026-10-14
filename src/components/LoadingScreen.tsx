'use client';
// 로딩 화면 — 사이트를 처음 열거나 새로고침할 때, 배경 이미지와 첫 화면의 이미지가
// 준비될 때까지 덮어 두었다가 서서히 사라지며 실제 페이지를 보여 줍니다.
// (메뉴를 눌러 페이지를 옮길 때는 나오지 않습니다)
// 스타일은 같은 폴더의 loading-screen.css 에 있고, 이 파일이 자동으로 불러옵니다.
import './loading-screen.css';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';

// ──────────────────────────────────────────────
// ★ 여기만 고치면 됩니다 ★
const CONFIG = {
  // 가운데에서 통통 뛰는 이미지. 비워 두면 회색 동글이가 나옵니다.
  //   방법 1) 이미지 링크:  'https://i.postimg.cc/.../char.png'
  //   방법 2) 내 사이트에 올린 파일:  '/loading-char.png'  (GitHub의 public 폴더에 올린 파일 이름)
  image: '',
  imageWidth: 130,   // 이미지 가로 크기(px)

  // 배경 이미지 (모눈종이). 못 불러오면 CSS로 그린 모눈종이가 대신 나옵니다.
  background: 'https://i.postimg.cc/K8XNjSPn/baegyeong.png',

  barWidth: 240,         // 로딩바 길이(px)
  barColor: '#f33421',   // 로딩바 색

  onlyMain: true,        // 사이트를 처음 연 페이지가 메인(/)일 때만 보여 줌 (다른 페이지로 바로 들어오면 안 나옴)
  oncePerSession: true,  // 한 번 보면 같은 탭에서는 다시 안 나옴 (새로고침해도 안 나옴). false면 메인을 열 때마다 나옴

  minShow: 600,          // 아무리 빨리 끝나도 최소로 보여 줄 시간(ms) — 번쩍임 방지
  maxWait: 10000,        // 이 시간(ms)이 지나면 이미지가 덜 떠도 넘어감
  settleMs: 900,         // 화면의 사진이 모두 뜬 상태가 이만큼(ms) 이어져야 넘어감 (사진이 늦게 나타나는 걸 잡는 시간)
  waitPageImages: true,  // 첫 화면에 보이는 이미지가 뜰 때까지 기다릴지 (false면 배경 이미지만)

  exit: 'fade' as 'flip' | 'fade',   // 사라지는 방식: 'fade' = 서서히 투명해짐 / 'flip' = 책장 넘기기
  exitMs: 1100,                      // 책장이 넘어가는 시간(ms) — 길수록 천천히
};
// ──────────────────────────────────────────────

// 이미지를 안 넣었거나 못 불러올 때 쓰는 회색 동글이
const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 6C70 4 92 20 94 46C96 72 78 94 50 94C24 94 6 76 6 50C6 26 24 8 50 6Z" fill="#848484"/></svg>',
);

const SEEN = 'ohome.ls.seen';
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// 테마가 :root(또는 body)에 지정해 둔 사이트 배경 이미지 주소를 읽는다
function siteBgUrl(): string | null {
  for (const el of [document.documentElement, document.body]) {
    const v = getComputedStyle(el).getPropertyValue('--bg-image');
    const m = v.match(/url\(\s*["']?([^"')]+)["']?\s*\)/);
    if (m) return m[1];
  }
  return null;
}

const loadImg = (src: string) =>
  new Promise<void>(res => { const i = new Image(); i.onload = i.onerror = () => res(); i.src = src; });

// 지금 화면 안에 보이는 이미지의 전체 수와, 그중 아직 안 뜬 수 (화면 밖 지연 로딩 이미지는 세지 않음)
function visibleImgs(): { total: number; pending: number } {
  const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('#appMain img')).filter(img => {
    if (!img.getAttribute('src')) return false;
    const r = img.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0;
  });
  return { total: imgs.length, pending: imgs.filter(i => !i.complete).length };
}

export default function LoadingScreen() {
  const isMain = usePathname() === '/';
  const [enabled] = useState(() => !CONFIG.onlyMain || isMain);   // 처음 열린 페이지로만 결정 — 이후 메뉴 이동에는 영향 없음
  const [phase, setPhase] = useState<'show' | 'hide' | 'gone'>('show');
  const [pct, setPct] = useState(6);
  const [src, setSrc] = useState(CONFIG.image || PLACEHOLDER);

  useEffect(() => {
    if (!enabled) return;
    if (CONFIG.oncePerSession) {
      try { if (sessionStorage.getItem(SEEN) === '1') { setPhase('gone'); return; } } catch {}
    }
    let cancelled = false;
    const t0 = performance.now();
    const left = () => Math.max(0, CONFIG.maxWait - (performance.now() - t0));
    const bump = (v: number) => setPct(p => Math.max(p, v));

    // 로딩바: 90%를 향해 천천히 차오르다가, 실제로 끝나면 100%로 채운다
    const tick = setInterval(() => setPct(p => p + (90 - p) * 0.06), 120);

    (async () => {
      // 1) 사이트 배경 이미지: 테마가 값을 넣을 때까지 잠깐 기다렸다가 미리 불러온다
      for (let i = 0; i < 10 && !siteBgUrl() && !cancelled; i++) await sleep(100);
      const u = siteBgUrl();
      if (u) await Promise.race([loadImg(u), sleep(left())]);
      bump(55);

      // 2) 첫 화면 이미지: 앱이 그려지고, 보이는 이미지가 모두 뜬 상태가 잠시 이어질 때까지
      if (CONFIG.waitPageImages) {
        const need = Math.ceil(CONFIG.settleMs / 150);
        let calm = 0, lastTotal = -1;
        while (!cancelled && left() > 0) {
          const { total, pending } = visibleImgs();
          // 앱이 그려졌고, 안 뜬 사진이 없고, 보이는 사진 수가 더 늘지 않는 상태가 이어져야 함
          const ready = !!document.getElementById('appMain') && pending === 0 && total === lastTotal;
          lastTotal = total;
          calm = ready ? calm + 1 : 0;
          if (total > 0) bump(55 + Math.round((35 * (total - pending)) / total));   // 로딩바가 사진 수를 따라감
          if (calm >= need) break;
          await sleep(150);
        }
      }
      bump(90);

      // 3) 최소 표시 시간을 채우고, 로딩바를 끝까지 채운 뒤 서서히 사라짐
      await sleep(Math.max(0, CONFIG.minShow - (performance.now() - t0)));
      if (cancelled) return;
      clearInterval(tick);
      setPct(100);
      await sleep(450);
      if (cancelled) return;
      try { sessionStorage.setItem(SEEN, '1'); } catch {}
      setPhase('hide');
      await sleep(CONFIG.exit === 'flip' ? CONFIG.exitMs + 150 : 800);
      if (!cancelled) setPhase('gone');
    })();

    return () => { cancelled = true; clearInterval(tick); };
  }, [enabled]);

  if (!enabled || phase === 'gone') return null;

  const vars = {
    '--ls-bg': CONFIG.background ? `url("${CONFIG.background}")` : 'none',
    '--ls-img-w': CONFIG.imageWidth + 'px',
    '--ls-bar-w': CONFIG.barWidth + 'px',
    '--ls-bar-c': CONFIG.barColor,
    '--p': pct + '%',
    '--ls-exit-ms': CONFIG.exitMs + 'ms',
  } as CSSProperties;

  return (
    <>
    {/* 이미 본 탭이면 화면이 그려지기 전에 바로 숨겨서 깜빡임을 막는다 */}
    {CONFIG.oncePerSession && (
      <script dangerouslySetInnerHTML={{ __html: `try{if(sessionStorage.getItem('${SEEN}')==='1')document.documentElement.classList.add('ls-seen')}catch(e){}` }} />
    )}
    <div className={`ls-wrap ls-exit-${CONFIG.exit} ${phase === 'hide' ? 'ls-hide' : ''}`} style={vars} aria-hidden="true">
      <div className="ls">
        <div className="ls-stage">
          <div className="ls-char">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" draggable={false} onError={() => setSrc(PLACEHOLDER)} />
          </div>
          <div className="ls-shadow" />
        </div>
        <div className="ls-bar"><i /></div>
      </div>
    </div>
    </>
  );
}
