import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent, ReactNode, RefObject } from 'react';
import { motion, useMotionTemplate, useReducedMotion, useSpring, useTransform } from 'motion/react';
import './spice-motion.css';

const SPRING = { mass: 1, stiffness: 100, damping: 10 };
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
const STAR_POINTS = Array.from({ length: 24 }, (_, index) => {
  const angle = (index * Math.PI) / 12 - Math.PI / 2;
  const radius = index % 2 ? 29 : 87;
  return `${100 + Math.cos(angle) * radius},${100 + Math.sin(angle) * radius}`;
}).join(' ');

/** Pause decorative work when its section is offscreen or its tab is hidden. */
function useAnimationActivity(ref: RefObject<HTMLElement>, onPause?: () => void) {
  const active = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let inView = false;
    const update = () => {
      active.current = inView && !document.hidden;
      element.dataset.motion = active.current ? 'playing' : 'paused';
      if (!active.current) onPause?.();
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      active.current = false;
    };
  }, [ref, onPause]);

  return active;
}

/** The opening sequence begins after the Chapter 01 intro has cleared. */
export function HeroHeadline({ ready }: { ready: boolean }) {
  return <h1 id="hero-title" className="spice-headline" data-ready={ready} aria-label="From the Spice.">
    <span className="spice-headline__mask" aria-hidden="true"><span className="spice-headline__line">FROM</span></span>
    <span className="spice-headline__mask" aria-hidden="true"><span className="spice-headline__line spice-headline__line--last">THE SPICE<span className="hero-period">.</span></span></span>
  </h1>;
}

/** Masked line reveals keep the type itself crisp while introducing each chapter. */
export function CinematicHeading({ id, lines, accentLast = false }: { id: string; lines: string[]; accentLast?: boolean }) {
  const root = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { element.dataset.revealed = 'true'; observer.disconnect(); }
    }, { threshold: .2 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <h2 ref={root} id={id} className="cinematic-heading" aria-label={lines.join(' ')}>
    {lines.map((line, index) => <span className={`cinematic-heading__mask ${accentLast && index === lines.length - 1 ? 'cinematic-heading__mask--accent' : ''}`} key={line} aria-hidden="true"><span className="cinematic-heading__line" style={{ transitionDelay: `${index * 60}ms` }}>{line}</span></span>)}
  </h2>;
}

/** A doubled track loops without moving or obscuring anything interactive. */
export function SpiceRibbon() {
  const root = useRef<HTMLDivElement>(null);
  useAnimationActivity(root);
  const phrases = ['GRENADA TO THE WORLD', 'DANCEHALL & BEYOND', 'INDEPENDENT. ALWAYS.', 'FROM THE SPICE'];
  return <div ref={root} className="chapter-strip spice-ribbon" data-motion="paused" aria-hidden="true"><div className="spice-ribbon__track">{[0, 1].map((copy) => <div className="spice-ribbon__group" key={copy}>{phrases.map((phrase) => <span className="spice-ribbon__phrase" key={phrase}><span>{phrase}</span><i>✳</i></span>)}</div>)}</div></div>;
}

export function BounceArtwork() {
  const root = useRef<HTMLDivElement>(null);
  useAnimationActivity(root);
  return <div ref={root} className="bounce-art" data-motion="paused" aria-hidden="true"><span className="bounce-coordinate">FREQUENCY: UNKNOWN / STATUS: LOADING</span><div className="bounce-orbit orbit-one"><i /></div><div className="bounce-orbit orbit-two"><i /></div><div className="bounce-disc"><span>JXXMAL</span><i /><strong>?</strong><small>NEXT CHAPTER</small></div><span className="bounce-caption">THE NEXT CHAPTER IS ALREADY IN MOTION.</span></div>;
}

/** Ambient loops are optional, independently of the system's reduced-motion setting. */
export function MotionControl() {
  const [paused, setPaused] = useState(() => {
    try { return localStorage.getItem('jxxmal_ambient_motion') === 'paused'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.dataset.ambientMotion = paused ? 'paused' : 'playing';
    try { localStorage.setItem('jxxmal_ambient_motion', paused ? 'paused' : 'playing'); } catch { /* Optional visitor preference. */ }
    return () => { delete document.documentElement.dataset.ambientMotion; };
  }, [paused]);
  useEffect(() => {
    const cards = new Map<Element, boolean>();
    const update = () => {
      document.documentElement.dataset.pageVisibility = document.hidden ? 'hidden' : 'visible';
      cards.forEach((visible, element) => { (element as HTMLElement).dataset.motion = visible && !document.hidden ? 'playing' : 'paused'; });
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => cards.set(entry.target, entry.isIntersecting));
      update();
    });
    document.querySelectorAll('.platform-card').forEach((card) => { cards.set(card, false); observer.observe(card); });
    document.addEventListener('visibilitychange', update);
    update();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); delete document.documentElement.dataset.pageVisibility; };
  }, []);
  return <button className="motion-control" type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}><span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>{paused ? 'Resume ambient motion' : 'Pause ambient motion'}</button>;
}

/** A quiet moving backdrop; it never captures input or changes document layout. */
export function HeroAtmosphere({ className = '' }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useAnimationActivity(root);

  return (
    <div ref={root} className={`spice-atmosphere ${className}`} data-motion="paused" aria-hidden="true">
      <div className="spice-atmosphere__halo" />
      <div className="spice-atmosphere__heat spice-atmosphere__heat--one" />
      <div className="spice-atmosphere__heat spice-atmosphere__heat--two" />
      <div className="spice-atmosphere__heat spice-atmosphere__heat--three" />
      <div className="spice-atmosphere__star-position">
        <svg className="spice-atmosphere__star" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="95" stroke="currentColor" strokeWidth=".5" strokeDasharray="1 7" />
          <polygon points={STAR_POINTS} stroke="currentColor" strokeWidth=".65" />
          <circle cx="100" cy="100" r="17" stroke="currentColor" strokeWidth=".6" />
          <circle cx="100" cy="100" r="4" fill="currentColor" />
        </svg>
      </div>
      <div className="spice-atmosphere__grain" />
    </div>
  );
}

/** Wrap the artwork visual, keeping play buttons and other controls outside. */
export function ArtworkTilt({ children, className = '' }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const canTilt = useRef(false);
  const reduce = useReducedMotion();
  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);
  const shineX = useSpring(0, SPRING);
  const shineY = useSpring(0, SPRING);
  const shineOpacity = useSpring(0, SPRING);
  const boundedX = useTransform(rotateX, (value) => clamp(value, 3));
  const boundedY = useTransform(rotateY, (value) => clamp(value, 3));
  const transform = useMotionTemplate`perspective(1100px) rotateX(${boundedX}deg) rotateY(${boundedY}deg)`;
  const shineTransform = useMotionTemplate`translate3d(${shineX}%, ${shineY}%, 0) rotate(-18deg)`;

  const stop = useCallback(() => {
    rotateX.jump(0); rotateY.jump(0);
    shineX.jump(0); shineY.jump(0); shineOpacity.jump(0);
  }, [rotateX, rotateY, shineX, shineY, shineOpacity]);
  const active = useAnimationActivity(root, stop);

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => {
      canTilt.current = query.matches && !reduce;
      if (!canTilt.current) stop();
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [reduce, stop]);

  const reset = () => {
    rotateX.set(0); rotateY.set(0);
    shineX.set(0); shineY.set(0); shineOpacity.set(0);
  };
  const trackPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!canTilt.current || !active.current || event.pointerType === 'touch' || document.documentElement.dataset.keyboard) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const x = clamp(((event.clientX - box.left) / box.width) * 2 - 1, 1);
    const y = clamp(((event.clientY - box.top) / box.height) * 2 - 1, 1);
    rotateX.set(-y * 3); rotateY.set(x * 3);
    shineX.set(x * 12); shineY.set(y * 12); shineOpacity.set(.45);
  };

  return (
    <div
      ref={root}
      className={`spice-artwork ${className}`}
      onPointerMove={trackPointer}
      onPointerLeave={reset}
      onPointerCancel={stop}
      onFocusCapture={stop}
      onKeyDownCapture={stop}
    >
      <motion.div className="spice-artwork__surface" style={{ transform }}>
        {children}
        <div className="spice-artwork__light" aria-hidden="true">
          <motion.div className="spice-artwork__sheen" style={{ transform: shineTransform, opacity: shineOpacity }} />
        </div>
      </motion.div>
    </div>
  );
}
