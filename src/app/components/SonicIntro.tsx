import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import './sonic-intro.css';

const LOGO = '/jxxmal-chrome-logo.png';
type Cut = readonly (readonly [number, number])[];
// Shared contours partition the complete transparent PNG between its glyphs.
// Every original pixel stays in one moving layer for the entire sequence;
// there is no crossfade to another wordmark that changes its alpha or shape.
const CUTS: readonly Cut[] = [
  [[0, 0], [0, 743]],
  [[359, 0], [359, 218], [391, 229], [405, 257], [409, 290], [407, 463], [401, 495], [388, 502], [386, 517], [370, 524], [367, 539], [359, 545], [331, 552], [331, 576], [300, 616], [304, 631], [337, 638], [337, 743]],
  [[1140, 0], [1140, 160], [1155, 170], [1175, 174], [1177, 205], [1175, 210], [1159, 214], [1159, 243], [1153, 259], [1125, 264], [1125, 270], [1101, 275], [1090, 284], [1088, 411], [1091, 418], [1209, 438], [1213, 576], [1219, 577], [1223, 590], [1239, 601], [1239, 621], [1148, 637], [1148, 743]],
  [[1438, 0], [1438, 257], [1447, 267], [1461, 271], [1467, 305], [1467, 486], [1457, 495], [1457, 501], [1446, 505], [1447, 532], [1438, 536], [1438, 743]],
  [[1759, 0], [1759, 389], [1762, 418], [1771, 426], [1772, 435], [1786, 440], [1786, 481], [1792, 488], [1702, 505], [1698, 510], [1698, 526], [1736, 538], [1736, 544], [1747, 550], [1747, 743]],
  [[2117, 0], [2117, 743]],
];
const partition = (left: Cut, right: Cut) => `polygon(${[...left, ...[...right].reverse()].map(([x, y]) => `${x / 2117 * 100}% ${y / 743 * 100}%`).join(', ')})`;
const GLYPHS = [
  { name: 'J', x: '-45%', y: '29%', r: '-12deg', outX: '-95vw', outY: '25vh' },
  { name: 'XX', x: '-12%', y: '-64%', r: '16deg', outX: '-38vw', outY: '-74vh' },
  { name: 'M', x: '16%', y: '62%', r: '-19deg', outX: '18vw', outY: '86vh' },
  { name: 'A', x: '32%', y: '-52%', r: '14deg', outX: '58vw', outY: '-75vh' },
  { name: 'L', x: '53%', y: '28%', r: '-10deg', outX: '105vw', outY: '28vh' },
].map((glyph, index) => ({ ...glyph, contour: partition(CUTS[index], CUTS[index + 1]) }));

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
