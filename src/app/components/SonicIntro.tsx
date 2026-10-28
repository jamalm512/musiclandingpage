import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import './sonic-intro.css';

const LOGO = '/jxxmal-chrome-logo.png';
const SLICES = [
  { x: '-45%', y: '29%', r: '-12deg', outX: '-95vw', outY: '25vh' },
  { x: '-22%', y: '-64%', r: '16deg', outX: '-52vw', outY: '-74vh' },
  { x: '16%', y: '62%', r: '-19deg', outX: '-18vw', outY: '86vh' },
  { x: '-15%', y: '-52%', r: '14deg', outX: '24vw', outY: '-86vh' },
  { x: '32%', y: '45%', r: '-13deg', outX: '58vw', outY: '75vh' },
  { x: '53%', y: '-28%', r: '10deg', outX: '105vw', outY: '-28vh' },
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
          {artwork ? <>{SLICES.map((slice, index) => <div key={index} className="sonic-logo__slice" style={{ '--slice-x': slice.x, '--slice-y': slice.y, '--slice-r': slice.r, '--slice-out-x': slice.outX, '--slice-out-y': slice.outY, '--slice-delay': `${index * 28}ms`, clipPath: `inset(0 ${100 - (index + 1) * 100 / 6}% 0 ${index * 100 / 6}%)` } as CSSProperties}><img src={LOGO} alt="" width="2117" height="743" draggable={false} /></div>)}<div className="sonic-logo__reflection"><div /></div></> : ready ? <span className="sonic-logo__fallback">JXXMAL</span> : null}
        </div>
        <div className="sonic-intro__sparks">{Array.from({ length: 16 }, (_, index) => <i key={index} style={{ '--spark-angle': `${index * 22.5 + 8}deg`, '--spark-delay': `${(index % 4) * 24}ms` } as CSSProperties} />)}</div>
        <div className="sonic-intro__chapter"><span>CHAPTER <b>01</b></span><i /><p>FROM THE SPICE. <strong>FOR THE WORLD.</strong></p></div>
        <span className="sonic-intro__caption">A NEW FREQUENCY IS HERE.</span>
      </div>
      <button className="sonic-intro__skip" onClick={done}>Skip intro <ArrowUpRight size={16} /></button>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
