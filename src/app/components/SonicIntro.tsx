import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import './sonic-intro.css';

const LOGO = '/jxxmal-chrome-logo.png';
// Contours follow the lettering, rather than dividing its transparent canvas
// into strips. The connected double-X stays together as the artist's emblem.
const GLYPHS = [
  { name: 'J', x: '-45%', y: '29%', r: '-12deg', outX: '-95vw', outY: '25vh', contour: 'polygon(0% 58%, 12.8% 58%, 13.2% 30%, 19.2% 30%, 19.2% 61%, 17.2% 70%, 12.5% 74%, 5% 72%, 0% 65%)' },
  { name: 'XX', x: '-12%', y: '-64%', r: '16deg', outX: '-38vw', outY: '-74vh', contour: 'polygon(16.8% 20.5%, 23.6% 23%, 29.5% 40%, 35.7% 20.5%, 41.5% 36.5%, 49.5% 23.5%, 55.2% 20.5%, 44.4% 49.8%, 58% 86%, 50.6% 79%, 43.8% 63%, 37% 85%, 35.3% 85%, 28.7% 64%, 21% 80%, 13.4% 86%, 25.7% 50%)' },
  { name: 'M', x: '16%', y: '62%', r: '-19deg', outX: '18vw', outY: '86vh', contour: 'polygon(51% 35%, 57.4% 38.7%, 61.5% 48.7%, 66% 38.5%, 68.5% 35.5%, 69.3% 37.5%, 69.3% 73%, 64% 73%, 64% 56%, 61.4% 63%, 57% 54%, 57% 73%, 52.5% 71%, 51% 45%)' },
  { name: 'A', x: '32%', y: '-52%', r: '14deg', outX: '58vw', outY: '-75vh', contour: 'polygon(67% 73%, 75.7% 35%, 78% 35%, 86.3% 73%, 81.5% 73%, 79.5% 65%, 73% 65%, 70.5% 73%)' },
  { name: 'L', x: '53%', y: '28%', r: '-10deg', outX: '105vw', outY: '28vh', contour: 'polygon(83.8% 30%, 90% 30%, 90% 59%, 100% 59%, 100% 67%, 96.5% 73%, 83.8% 73%)' },
];

/** A first-visit brand moment; CSS keeps the sequence independent of page loading. */
export default function SonicIntro({ done }: { done: () => void }) {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [artwork, setArtwork] = useState(false);
  const previousFocus = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);

  useEffect(() => {
    let active = true;
    let settled = false;
    const logo = new Image();
    const start = (loaded: boolean) => { if (active && !settled) { settled = true; setArtwork(loaded); setReady(true); } };
    logo.onload = () => start(true);
    logo.onerror = () => start(false);
    logo.src = LOGO;
    if (logo.complete && logo.naturalWidth) start(true);
    const timeout = window.setTimeout(() => start(logo.naturalWidth > 0), 1200);
    return () => { active = false; logo.onload = null; logo.onerror = null; window.clearTimeout(timeout); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(done, reduce ? 650 : 3150);
    return () => window.clearTimeout(timer);
  }, [done, ready, reduce]);

  return <Dialog.Root open onOpenChange={(open) => { if (!open) done(); }}><Dialog.Portal>
    <Dialog.Overlay className="sonic-intro__veil" data-ready={ready} data-reduced={!!reduce} />
    <Dialog.Content className="sonic-intro" data-ready={ready} data-reduced={!!reduce} onEscapeKeyDown={done} onCloseAutoFocus={(event) => {
      event.preventDefault();
      const target = previousFocus.current;
      if (target?.isConnected && target !== document.body) target.focus({ preventScroll: true });
      else document.getElementById('main')?.focus({ preventScroll: true });
    }}>
      <Dialog.Title className="sonic-intro__sr">JXXMAL — Chapter 01</Dialog.Title>
      <Dialog.Description className="sonic-intro__sr">From the Spice. For the world. A short artist introduction.</Dialog.Description>
      <div className="sonic-intro__curtain sonic-intro__curtain--left" aria-hidden="true" /><div className="sonic-intro__curtain sonic-intro__curtain--right" aria-hidden="true" />
      <div className="sonic-intro__scene" aria-hidden="true">
        <div className="sonic-intro__grid" />
        <span className="sonic-intro__coordinate">GRENADA, WEST INDIES<br />12.1165° N / 61.6790° W</span>
        <span className="sonic-intro__edition">INDEPENDENT SOUND<br />CHAPTER 01 — 2026</span>
        <div className="sonic-intro__orbit sonic-intro__orbit--outer" /><div className="sonic-intro__orbit sonic-intro__orbit--inner" />
        <div className="sonic-intro__shockwave" /><div className="sonic-intro__shockwave sonic-intro__shockwave--echo" />
        <div className="sonic-logo">
          <div className="sonic-logo__rail sonic-logo__rail--top" /><div className="sonic-logo__rail sonic-logo__rail--bottom" />
          {artwork ? <>
            {GLYPHS.map((glyph, index) => <div key={glyph.name} className="sonic-logo__glyph" style={{ '--glyph-x': glyph.x, '--glyph-y': glyph.y, '--glyph-r': glyph.r, '--glyph-out-x': glyph.outX, '--glyph-out-y': glyph.outY, '--glyph-delay': `${index * 28}ms`, clipPath: glyph.contour } as CSSProperties}><img src={LOGO} alt="" width="2117" height="743" draggable={false} /></div>)}
            <img className="sonic-logo__whole" src={LOGO} alt="" width="2117" height="743" draggable={false} />
            <div className="sonic-logo__reflection"><div /></div>
          </> : ready ? <span className="sonic-logo__fallback">JXXMAL</span> : null}
        </div>
        <div className="sonic-intro__sparks">{Array.from({ length: 16 }, (_, index) => <i key={index} style={{ '--spark-angle': `${index * 22.5 + 8}deg`, '--spark-delay': `${(index % 4) * 24}ms` } as CSSProperties} />)}</div>
        <div className="sonic-intro__chapter"><span>CHAPTER <b>01</b></span><i /><p>FROM THE SPICE. <strong>FOR THE WORLD.</strong></p></div>
        <span className="sonic-intro__caption">A NEW FREQUENCY IS HERE.</span>
      </div>
      <button className="sonic-intro__skip" onClick={done}>Skip intro <ArrowUpRight size={16} /></button>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
