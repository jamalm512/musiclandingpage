import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowDown, ArrowUpRight, Check, Copy, Disc3, Headphones, Menu, Pause, Play, Plus, RotateCcw, Share2, X } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { ARTIST, RELEASES } from '../data/music';
import type { Release } from '../data/music';
import snapshots from '../data/platform-snapshots.json';
const FanMap = lazy(() => import('./components/FanMap'));
import SignupForm from './components/SignupForm';
import SonicIntro from './components/SonicIntro';
import { ArtworkTilt, BounceArtwork, CinematicHeading, HeroAtmosphere, HeroHeadline, MotionControl, SpiceRibbon } from './components/SpiceMotion';
import '../styles/site.css';

const INTRO_KEY = 'jxxmal_intro_sonic_ignition_v1';
const latest = RELEASES[RELEASES.length - 1];
const EASE = [0.23, 1, 0.32, 1] as const;

function BrandIcon({ platform }: { platform: string }) {
  const paths: Record<string, string> = {
    spotify: 'M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02Zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.32-1.32 9.72-.66 13.5 1.62.36.18.54.78.24 1.2Zm.12-3.36c-3.84-2.28-10.26-2.52-13.92-1.38-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-.9.6-1.56.3Z',
    apple: 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11Z',
    youtube: 'M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.2C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z',
    instagram: 'M7.05.07C2.7.27.27 2.69.07 7.05 0 8.33 0 8.74 0 12s0 3.67.07 4.95c.2 4.36 2.63 6.78 6.98 6.98 1.28.07 1.69.07 4.95.07s3.67 0 4.95-.07c4.36-.2 6.78-2.62 6.98-6.98.07-1.28.07-1.69.07-4.95s0-3.67-.07-4.95c-.2-4.36-2.62-6.78-6.98-6.98C15.67 0 15.26 0 12 0s-3.67 0-4.95.07Zm9.8 2.16c3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.67 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.69-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.15-3.23 1.66-4.77 4.92-4.92 1.27-.06 1.65-.07 4.85-.07s3.58.01 4.85.07ZM12 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z',
  };
  return paths[platform] ? <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={paths[platform]} /></svg> : <Headphones aria-hidden="true" />;
}

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, transform: 'translateY(18px)' }} whileInView={{ opacity: 1, transform: 'translateY(0)' }} viewport={{ once: true, amount: 0.08 }} transition={{ duration: 0.5, ease: EASE }}>{children}</motion.div>;
}

function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const root = document.documentElement;
        const distance = root.scrollHeight - root.clientHeight;
        if (ref.current) ref.current.style.transform = `scaleX(${distance > 0 ? root.scrollTop / distance : 0})`;
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  return <div className="scroll-progress" ref={ref} aria-hidden="true" />;
}

function usePreviewPlayer() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const current = useRef<string | null>(null);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const stop = useCallback(() => { audio.current?.pause(); setPlaying(false); setLoading(false); }, []);
  const toggle = useCallback(async (track: Release) => {
    if (current.current === track.id && audio.current) {
      const target = audio.current;
      if (!target.paused) { target.pause(); return; }
      if (target.ended) target.currentTime = 0;
      setLoading(true);
      try { await target.play(); } catch (error) { if (audio.current === target && !(error instanceof DOMException && error.name === 'AbortError')) { setLoading(false); toast.error('Playback was interrupted. Tap play to try again.'); } }
      return;
    }
    audio.current?.pause();
    if (!track.previewUrl) { toast('A preview is not available yet. Open this release on your music service.'); return; }
    const next = new Audio(track.previewUrl);
    audio.current = next; current.current = track.id;
    setTrackId(track.id); setPlaying(false); setLoading(true); setProgress(0);
    next.preload = 'none';
    next.onplaying = () => { if (audio.current === next) { setPlaying(true); setLoading(false); } };
    next.onpause = () => { if (audio.current === next) setPlaying(false); };
    next.onended = () => { if (audio.current === next) { setPlaying(false); setProgress(1); } };
    next.ontimeupdate = () => { if (audio.current === next && Number.isFinite(next.duration)) setProgress(next.currentTime / next.duration); };
    next.onerror = () => { if (audio.current === next) { setPlaying(false); setLoading(false); toast.error('This preview could not load. You can still listen on your music service.'); } };
    try { await next.play(); } catch (error) { if (audio.current === next && !(error instanceof DOMException && error.name === 'AbortError')) { setLoading(false); toast.error('Tap play again to start this preview.'); } }
  }, []);
  useEffect(() => {
    const hide = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', hide);
    return () => { audio.current?.pause(); document.removeEventListener('visibilitychange', hide); };
  }, [stop]);
  return { trackId, playing, loading, progress, toggle, stop };
}
type Player = ReturnType<typeof usePreviewPlayer>;


function MusicDialog({ track, close, returnFocus }: { track: Release | null; close: () => void; returnFocus: RefObject<HTMLElement> }) {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setLinks({}); setCopied(false);
    if (!track?.spotifyUrl) return;
    const controller = new AbortController();
    fetch(`/api/links?url=${encodeURIComponent(track.spotifyUrl)}`, { signal: controller.signal }).then((response) => response.ok ? response.json() : null).then((data) => { if (!controller.signal.aborted && data?.links) setLinks(data.links); }).catch(() => {});
    return () => controller.abort();
  }, [track]);
  const safe = (value?: string | null) => { if (!value) return null; try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; } };
  const spotify = safe(track?.spotifyUrl);
  const options = [
    { id: 'spotify', name: 'Spotify', url: spotify },
    { id: 'apple', name: 'Apple Music', url: safe(track?.appleMusicUrl) },
    { id: 'tidal', name: 'Tidal', url: safe(track?.tidalUrl || links.tidal) },
    { id: 'amazon', name: 'Amazon Music', url: safe(track?.amazonMusicUrl || links.amazonMusic) },
    { id: 'youtube', name: 'YouTube', url: safe(links.youtubeMusic || links.youtube || (track?.youtubeId ? `https://www.youtube.com/watch?v=${track.youtubeId}` : null)) },
  ];
  const songlink = spotify ? `https://song.link/s/${new URL(spotify).pathname.split('/').pop()}` : track?.appleMusicUrl;
  return <Dialog.Root open={!!track} onOpenChange={(open) => { if (!open) close(); }}><Dialog.Portal><Dialog.Overlay className="modal-backdrop" /><Dialog.Content className="music-dialog" onCloseAutoFocus={(event) => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus(); else document.getElementById('main')?.focus({ preventScroll: true }); }}>
    <Dialog.Close className="icon-button dialog-close" aria-label="Close music services"><X size={20} /></Dialog.Close>
    <img className="dialog-art" src={track?.artwork} alt="" /><span className="eyebrow lime">MAKE IT PART OF YOUR ROTATION</span>
    <Dialog.Title>{track?.title}</Dialog.Title><Dialog.Description>Open the track in your favourite app to save it or add it to a playlist.</Dialog.Description>
    <div className="service-options">{options.filter((option) => option.url).map((option) => <a key={option.id} href={option.url!} target="_blank" rel="noopener noreferrer"><BrandIcon platform={option.id} /><span>{option.name}</span><ArrowUpRight size={18} /></a>)}</div>
    {songlink && <a className="all-services" href={songlink} target="_blank" rel="noopener noreferrer">Find more services on Songlink <ArrowUpRight size={15} /></a>}
    <button className="copy-track" onClick={async () => { try { await navigator.clipboard.writeText(spotify || track?.appleMusicUrl || ARTIST.websiteUrl); setCopied(true); } catch { toast.error('Copy is unavailable in this browser. Open a service above.'); } }}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Track link copied' : 'Copy track link'}</button>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function JourneyCard({ release, index, player, openServices }: { release: Release; index: number; player: Player; openServices: (track: Release, opener: HTMLButtonElement) => void }) {
  const [flipped, setFlipped] = useState(false);
  const front = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const active = player.trackId === release.id;
  const isPlaying = active && player.playing;
  const reduce = useReducedMotion();
  return <motion.article className="release-card" initial={reduce ? false : { opacity: 0, transform: 'translateY(22px)' }} whileInView={{ opacity: 1, transform: 'translateY(0)' }} viewport={{ once: true, amount: .12 }} transition={{ duration: .55, ease: EASE, delay: index * .055 }}>
    <div className="release-date"><span>{String(index + 1).padStart(2, '0')}</span><time dateTime={release.releaseDate}>{release.releaseLabel}</time><i /></div>
    <div className={`record-flip ${flipped ? 'is-flipped' : ''}`}><div className="record-flip__inner">
      <button className="record-front" ref={front} onClick={(event) => { event.currentTarget.blur(); setFlipped(true); requestAnimationFrame(() => back.current?.focus()); void player.toggle(release); }} aria-label={`Play ${release.title} preview`} aria-hidden={flipped} tabIndex={flipped ? -1 : 0}>
        <img src={release.artwork} alt={`${release.title} cover`} loading="lazy" width="600" height="600" /><span className="record-front__play"><Play size={21} fill="currentColor" /><span>PLAY PREVIEW</span></span>{index === RELEASES.length - 1 && <span className="record-latest">LATEST RELEASE</span>}
      </button>
      <div className="record-back" aria-hidden={!flipped}><button className="record-close" ref={back} aria-label={`Close ${release.title} preview`} tabIndex={flipped ? 0 : -1} onClick={(event) => { event.currentTarget.blur(); setFlipped(false); requestAnimationFrame(() => front.current?.focus()); if (active) player.stop(); }}><X size={16} /></button><div className={`vinyl ${isPlaying ? 'is-playing' : ''}`}><img src={release.artwork} alt="" /><i /></div><button className="vinyl-control" tabIndex={flipped ? 0 : -1} onClick={() => void player.toggle(release)} aria-label={`${isPlaying ? 'Pause' : 'Play'} ${release.title}`}>{isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}<span>{active && player.loading ? 'LOADING…' : isPlaying ? 'PAUSE PREVIEW' : 'PLAY PREVIEW'}</span></button><a className="preview-credit" href={release.appleMusicUrl || ARTIST.appleMusicUrl} target="_blank" rel="noopener noreferrer" tabIndex={flipped ? 0 : -1}>Preview via Apple Music ↗</a></div>
    </div></div>
    <div className="release-heading"><h3>{release.title}</h3>{release.explicit && <abbr title="Explicit content">E</abbr>}</div><p className="release-meta">{release.genre}<span>{release.duration}</span></p>
    <button className="playlist-button" onClick={(event) => openServices(release, event.currentTarget)} aria-label={`Add ${release.title} to playlist`}><Plus size={15} /> Add to playlist <ArrowUpRight size={14} /></button>
  </motion.article>;
}

type AudienceMetric = { automatic?: boolean; stale?: boolean; updatedAt?: string; available?: boolean };
type PlatformStats = {
  youtube: AudienceMetric & { subscriberCount: number | null };
  instagram: AudienceMetric & { followers: number };
  spotify: AudienceMetric & { monthlyListeners: number };
};
const INITIAL_STATS: PlatformStats = {
  youtube: { subscriberCount: null },
  instagram: { ...snapshots.instagram, automatic: false },
  spotify: { ...snapshots.spotify, automatic: false },
};
function metricDate(metric: AudienceMetric) {
  const date = metric.updatedAt && new Date(metric.updatedAt);
  if (!date || !Number.isFinite(date.getTime())) return '';
  const label = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
  return metric.automatic && !metric.stale ? `Updated ${label}` : `Saved count · ${label}`;
}
function PlatformGrid({ stats }: { stats: PlatformStats }) {
  const format = (value: number) => new Intl.NumberFormat('en').format(value);
  const platforms = [
    { id: 'spotify', name: 'Spotify', label: 'Turn it up.', detail: `${format(stats.spotify.monthlyListeners)} monthly listeners`, note: metricDate(stats.spotify), href: ARTIST.spotifyUrl, color: '#8eec92' },
    { id: 'apple', name: 'Apple Music', label: 'Feel every word.', detail: 'Listen in your library', note: '', href: ARTIST.appleMusicUrl, color: '#ff8c9e' },
    { id: 'youtube', name: 'YouTube', label: 'See the sound.', detail: stats.youtube.subscriberCount === null ? 'Official videos & visualizers' : `${format(stats.youtube.subscriberCount)} subscribers`, note: stats.youtube.subscriberCount === null ? '' : metricDate(stats.youtube), href: ARTIST.youtubeUrl, color: '#ff7671' },
    { id: 'instagram', name: 'Instagram', label: 'Beyond the music.', detail: `${format(stats.instagram.followers)} followers`, note: metricDate(stats.instagram), href: ARTIST.instagramUrl, color: '#c8acff' },
  ];
  return <div className="platform-grid">{platforms.map((platform, index) => <a className="platform-card" key={platform.id} href={platform.href} target="_blank" rel="noopener noreferrer" style={{ '--platform-color': platform.color, '--border-delay': `${index * -2}s` } as CSSProperties}><span className="platform-card__top"><BrandIcon platform={platform.id} /><span>{platform.name}</span><ArrowUpRight size={22} /></span><strong>{platform.label}</strong><span className="platform-card__detail">{platform.detail}</span>{platform.note && <small className="platform-card__updated">{platform.note}</small>}</a>)}</div>;
}

function App() {
  const player = usePreviewPlayer();
  useEffect(() => {
    const keyboard = () => { document.documentElement.dataset.keyboard = 'true'; };
    const pointer = () => { delete document.documentElement.dataset.keyboard; };
    document.addEventListener('keydown', keyboard); document.addEventListener('pointerdown', pointer);
    return () => { document.removeEventListener('keydown', keyboard); document.removeEventListener('pointerdown', pointer); };
  }, []);
  const [services, setServices] = useState<Release | null>(null);
  const serviceOpener = useRef<HTMLElement | null>(null);
  const openServices = (track: Release, opener: HTMLButtonElement) => { serviceOpener.current = opener; setServices(track); };
  const [stats, setStats] = useState<PlatformStats>(INITIAL_STATS);
  const [menu, setMenu] = useState(false);
  const [intro, setIntro] = useState(() => { try { return !localStorage.getItem(INTRO_KEY); } catch { return true; } });
  const reduce = useReducedMotion();
  const finishIntro = useCallback(() => { try { localStorage.setItem(INTRO_KEY, 'seen'); } catch { /* Storage may be disabled. */ } setIntro(false); }, []);
  useEffect(() => {
    const controller = new AbortController();
    let lastAttempt = 0;
    const refresh = async () => {
      if (document.hidden || Date.now() - lastAttempt < 900000) return;
      lastAttempt = Date.now();
      try {
        const response = await fetch('/api/platforms', { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        const valid = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
        if (!controller.signal.aborted) setStats((previous) => ({
          youtube: data.youtube && (data.youtube.subscriberCount === null || valid(data.youtube.subscriberCount)) ? data.youtube : previous.youtube,
          instagram: valid(data.instagram?.followers) ? data.instagram : previous.instagram,
          spotify: valid(data.spotify?.monthlyListeners) ? data.spotify : previous.spotify,
        }));
      } catch { /* Keep clearly dated saved counts if a provider is unavailable. */ }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 900000);
    const visible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { controller.abort(); window.clearInterval(interval); document.removeEventListener('visibilitychange', visible); };
  }, []);
  const share = async () => { try { if (navigator.share) await navigator.share({ title: 'JXXMAL — From the Spice. For the world.', url: ARTIST.websiteUrl }); else { await navigator.clipboard.writeText(ARTIST.websiteUrl); toast.success('Website link copied. Share the sound.'); } } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) toast('Share this link: jxxmalmusik.com'); } };
  const latestPlaying = player.trackId === latest.id && player.playing;
  const currentTrack = RELEASES.find((release) => release.id === player.trackId);
  return <MotionConfig reducedMotion="user">
    <ScrollProgress /><a href="#main" className="skip-link">Skip to the music</a>
    <header className="site-header"><div className="header-inner"><a className="wordmark" href="#" aria-label="JXXMAL home">JXXMAL<span>®</span></a><nav className="desktop-nav" aria-label="Main navigation"><a href="#music">The music</a><a href="#connect">Stay connected</a><a href="#inner-circle">Inner circle <span>↗</span></a></nav><div className="header-actions"><span className="home-coordinate"><i /> GRENADA · 473</span><button className="icon-button share-button" aria-label="Share JXXMAL website" onClick={() => void share()}><Share2 size={17} /></button><button className="icon-button mobile-menu-toggle" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-controls="mobile-nav" aria-label={menu ? 'Close navigation' : 'Open navigation'}>{menu ? <X size={21} /> : <Menu size={21} />}</button></div></div>{menu && <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">{[['#music', 'The music'], ['#connect', 'Stay connected'], ['#inner-circle', 'Inner circle']].map(([href, label]) => <a key={href} href={href} onClick={() => setMenu(false)}>{label}<ArrowUpRight size={17} /></a>)}</nav>}</header>
    <main id="main" tabIndex={-1}>
      <section className="hero section-shell" aria-labelledby="hero-title" data-hero-ready={!intro}><HeroAtmosphere /><div className="hero-topline"><span className="eyebrow"><i className="live-dot" /> INDEPENDENT SOUND. ISLAND ROOTS.</span><span className="eyebrow hero-era">CHAPTER 01 / EST. 2026</span></div><div className="hero-grid">
        <div className="hero-copy"><span className="hero-kicker">THIS IS JXXMAL.</span><HeroHeadline ready={!intro} /><p className="hero-world">FOR THE WORLD.</p><p className="hero-description">Island energy. Real stories. A sound that goes<br className="desktop-break" /> wherever you do. Welcome to my world.</p><div className="hero-ctas"><button className="button button-lime" onClick={() => void player.toggle(latest)}>{latestPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}{latestPlaying ? 'Pause preview' : 'Play the latest'}</button><a className="text-link" href="#music">Explore the journey <ArrowDown size={16} /></a></div><div className="hero-origin"><span className="grenada-mark">✳</span><span>12.1165° N, 61.6790° W<br /><strong>GRENADA, WEST INDIES</strong></span><span className="origin-line" /><span className="origin-note">A small island.<br />A bigger vision.</span></div></div>
        <motion.div className="hero-record" initial={reduce ? false : { opacity: 0, transform: 'translateY(24px) rotate(2deg)' }} animate={intro && !reduce ? { opacity: 0, transform: 'translateY(24px) rotate(2deg)' } : { opacity: 1, transform: 'translateY(0) rotate(0deg)' }} transition={{ duration: 0.9, ease: EASE, delay: reduce ? 0 : 0.16 }}><div className="hero-art-halo" aria-hidden="true" /><div className="hero-record-tag"><span className="live-dot" /> OUT NOW<span>THE LATEST RELEASE</span></div><div className="hero-art-frame"><ArtworkTilt><img className="hero-art" src={latest.artwork} alt={`${latest.title} — JXXMAL, official cover artwork`} width="1000" height="1000" /></ArtworkTilt><span className="art-corner art-corner--tl" /><span className="art-corner art-corner--br" /><button className="hero-play" onClick={() => void player.toggle(latest)} aria-label={`${latestPlaying ? 'Pause' : 'Play'} ${latest.title} preview`}>{latestPlaying ? <Pause size={29} fill="currentColor" /> : <Play size={29} fill="currentColor" />}</button></div><div className="hero-release-info"><div><span className="eyebrow">SINGLE / {latest.releaseLabel}</span><h2>{latest.title}</h2></div><button className="round-link" onClick={(event) => openServices(latest, event.currentTarget)} aria-label={`Listen to ${latest.title} on music platforms`}><ArrowUpRight size={23} /></button></div>{latest.youtubeId && <a className="hero-video-link" href={`https://www.youtube.com/watch?v=${latest.youtubeId}`} target="_blank" rel="noopener noreferrer"><BrandIcon platform="youtube" /> Watch the official visualizer <ArrowUpRight size={13} /></a>}<a className="hero-preview-credit" href={latest.appleMusicUrl!} target="_blank" rel="noopener noreferrer">Audio preview courtesy of Apple Music <ArrowUpRight size={12} /></a></motion.div>
      </div><div className="hero-bottom"><span>THE SOUND OF WHERE I’M FROM. THE START OF WHERE I’M GOING.</span><a href="#music">SCROLL TO DISCOVER <ArrowDown size={14} /></a></div></section>
      <SpiceRibbon />
      <section className="music-section section-shell" id="music" aria-labelledby="music-title"><Reveal><div className="section-heading"><div><span className="eyebrow lime">01 / THE DISCOGRAPHY</span><CinematicHeading id="music-title" lines={['EVERY TRACK.', 'A NEW CHAPTER.']} /></div><p>From the first release to what’s next.<br />Tap a record. Find your soundtrack.</p></div><div className="journey-track">{RELEASES.map((release, index) => <JourneyCard key={release.id} release={release} index={index} player={player} openServices={openServices} />)}</div><div className="journey-note"><Disc3 size={15} /><span>Flip a cover to hear a preview. Save the ones that stay with you.</span><span className="journey-year">2026 — THE BEGINNING</span></div></Reveal></section>
      <section className="connect-section section-shell" id="connect" aria-labelledby="connect-title"><Reveal className="connect-layout"><div className="connect-copy"><span className="eyebrow lime">02 / FIND YOUR FREQUENCY</span><CinematicHeading id="connect-title" lines={['SAME SOUND.', 'YOUR PLATFORM.']} /><p>Wherever you listen, I’m there.<br />Follow the journey beyond the speakers.</p><div className="artist-signature"><img src="/artwork/jxxmal-portrait.webp" alt="JXXMAL in Grenada" loading="lazy" width="96" height="96" /><span className="connect-stamp">JXXMAL<br /><small>MUSIK WORLDWIDE</small></span></div></div><PlatformGrid stats={stats} /></Reveal></section>
      <section className="bounce-section" id="next" aria-labelledby="bounce-title"><div className="section-shell bounce-layout"><Reveal className="bounce-copy"><span className="eyebrow lime"><i className="live-dot" /> UP NEXT / A NEW ENERGY</span><h2 id="bounce-title">BOUNCE<span>↗</span></h2><p>Something’s moving.<br />Be the first to feel it.</p><SignupForm source="bounce_notify" label="Get the release announcement in your inbox." buttonLabel="Notify me" /></Reveal><BounceArtwork /></div></section>
      <section className="circle-section section-shell" id="inner-circle" aria-labelledby="circle-title"><Reveal className="circle-layout"><div><span className="eyebrow">03 / CLOSER TO THE MUSIC</span><CinematicHeading id="circle-title" lines={['NOT JUST A LISTENER.', 'PART OF THE CIRCLE.']} accentLast /></div><div className="circle-details"><p>Unreleased sounds. The stories behind the songs.<br />First access to whatever comes next.</p><div className="circle-perks"><span>EARLY LISTENS</span><span>BEHIND THE SCENES</span><span>FIRST DROPS</span></div><SignupForm source="inner_circle" label="An open invitation. A closer connection." buttonLabel="I’m in" /></div></Reveal></section>
      <section className="world-section section-shell" aria-labelledby="world-title"><Reveal><div className="world-heading"><div><span className="eyebrow lime">04 / NO BORDERS ON A GOOD SOUND</span><CinematicHeading id="world-title" lines={['ONE ISLAND. NO LIMITS.']} /></div><span className="world-home"><i className="live-dot" /> ROOTED IN GRENADA</span></div><Suspense fallback={<div className="map-loading">Loading the world map…</div>}><FanMap /></Suspense></Reveal></section>
    </main>
    <footer className="site-footer section-shell"><div className="footer-top"><a className="footer-wordmark" href="#" aria-label="Back to top">JXXMAL<span>®</span></a><p>FROM THE SPICE.<br />FOR THE WORLD.</p><button className="text-link" onClick={() => void share()}>Share the sound <Share2 size={15} /></button></div><div className="footer-bottom"><MotionControl /><button className="replay-intro" type="button" onClick={() => { player.stop(); window.scrollTo({ top: 0, behavior: 'instant' }); setIntro(true); }}><RotateCcw size={12} /> Replay intro</button><span>© {new Date().getFullYear()} JXXMAL. ALL RIGHTS RESERVED.</span><a href={ARTIST.instagramUrl} target="_blank" rel="noopener noreferrer">@JXXMALMUSIK <ArrowUpRight size={12} /></a><a href="#main">BACK TO TOP ↑</a></div></footer>
    <AnimatePresence>{currentTrack && (player.playing || player.loading) && <motion.div className="preview-bar" initial={{ opacity: 0, transform: 'translateY(12px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} exit={{ opacity: 0, transform: 'translateY(12px)' }} transition={{ duration: reduce ? 0 : 0.2, ease: EASE }}><img src={currentTrack.artwork} alt="" /><div className="preview-bar__info"><span>{currentTrack.title}</span><a href={currentTrack.appleMusicUrl!} target="_blank" rel="noopener noreferrer">{player.loading ? 'Loading preview…' : 'Preview via Apple Music ↗'}</a></div><button className="icon-button" onClick={() => player.stop()} aria-label="Pause audio preview"><Pause size={18} fill="currentColor" /></button><button className="icon-button" onClick={(event) => openServices(currentTrack, event.currentTarget)} aria-label={`Add ${currentTrack.title} to playlist`}><Plus size={19} /></button><div className="audio-progress" style={{ transform: `scaleX(${player.progress})` }} /></motion.div>}</AnimatePresence>
    <MusicDialog track={services} close={() => setServices(null)} returnFocus={serviceOpener} />{intro && <SonicIntro done={finishIntro} />}<Toaster theme="dark" position="bottom-center" closeButton toastOptions={{ style: { background: '#171916', color: '#f4f2ea', border: '1px solid #454a38', fontFamily: 'Outfit, sans-serif' } }} />
  </MotionConfig>;
}
export default App;
