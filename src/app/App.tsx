import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import profileImg from "@/imports/IMG_4819_2.JPG";

// ─── Constants ────────────────────────────────────────────────────────────────
const YT_API_KEY = "AIzaSyCapyKEmV8BLbE8ckUW0-xcmUtYk7UmQe8";
const YT_HANDLE  = "JXXMALMUSIK";
const ERA_KEY    = "jxxmal_intro_chapter1";
const GEO_URL    = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CARIBBEAN_CODES = new Set(["GD","TT","JM","BB","LC","VC","AG","DM","KN","BS","TC","KY","AI","MS","CU","DO","HT","PR","VI","AW","CW","SX","BQ","GP","MQ","MF","BL"]);

const PLATFORMS = [
  { id:"spotify",   name:"Spotify",     cta:"Listen Now", href:"https://open.spotify.com/artist/0pYbVdhffwzvHfEBdeFEUC?si=KV5tdQkiTN6rRd9_46yLXA", color:"#1DB954", neon:"#00ff7f", glow:"rgba(29,185,84,0.32)",
    icon:<svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg> },
  { id:"apple",    name:"Apple Music", cta:"Listen Now", href:"https://music.apple.com/us/artist/jxxmal/1896724847",                                   color:"#fc3c44", neon:"#ff2d55", glow:"rgba(252,60,68,0.32)",
    icon:<svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg> },
  { id:"youtube",  name:"YouTube",     cta:"Watch Now",  href:"https://www.youtube.com/@JXXMALMUSIK",                                                  color:"#FF0000", neon:"#ff3b3b", glow:"rgba(255,0,0,0.28)",
    icon:<svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
  { id:"instagram",name:"Instagram",   cta:"Follow Now", href:"https://www.instagram.com/jxxmalmusik/",                                                color:"#E1306C", neon:"#ff2d78", glow:"rgba(225,48,108,0.32)",
    icon:<svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
];

const CARD_SPEEDS  = [4.2, 3.8, 4.6, 3.5];
const CARD_OFFSETS = [0, 90, 200, 300];
const BAR_HEIGHTS  = [35, 60, 80, 55, 90, 45, 75, 50, 65, 40, 70, 85, 45];

const PLAYLIST_PLATFORMS = [
  { name:"Spotify",      color:"#1DB954", icon:<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>, getUrl:(t:any)=>t?.spotifyUrl ?? `https://open.spotify.com/search/${encodeURIComponent(t?.title??"")}` },
  { name:"Apple Music",  color:"#fc3c44", icon:<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>, getUrl:(t:any)=>`https://music.apple.com/search?term=${encodeURIComponent((t?.title??"")+"+jxxmal")}` },
  { name:"YouTube Music",color:"#FF0000", icon:<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, getUrl:(t:any)=>`https://music.youtube.com/search?q=${encodeURIComponent((t?.title??"")+"+jxxmal")}` },
  { name:"Tidal",        color:"#00FFFF", icon:<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004 4.004-4.004 4.004 4.004 4.004-4.004zM8.008 16.004l-4.004-4.004L0 16.004 4.004 20.008zM12.012 12l-4.004 4.004 4.004 4.004 4.004-4.004zM16.016 12.001l4.004 4.004L24.024 12l-4.004-4.004z"/></svg>, getUrl:(t:any)=>`https://listen.tidal.com/search?q=${encodeURIComponent((t?.title??"")+"+jxxmal")}` },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type YTVideo   = { id: string; title: string; thumbnail: string; publishedAt: string };
type TrackData = { found: boolean; id?: string; previewUrl?: string | null; spotifyUrl?: string; albumArt?: string; title?: string; artist?: string };

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchChannelVideos(): Promise<YTVideo[]> {
  try {
    const c = await (await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${YT_HANDLE}&key=${YT_API_KEY}`)).json();
    const pid = c.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!pid) return [];
    const p = await (await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${pid}&key=${YT_API_KEY}`)).json();
    return (p.items ?? []).map((item: any) => ({ id: item.snippet.resourceId.videoId, title: item.snippet.title, thumbnail: `https://img.youtube.com/vi/${item.snippet.resourceId.videoId}/mqdefault.jpg`, publishedAt: item.snippet.publishedAt }));
  } catch { return []; }
}

async function fetchSubscriberCount(): Promise<string | null> {
  try {
    const c = await (await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${YT_HANDLE}&key=${YT_API_KEY}`)).json();
    const n = parseInt(c.items?.[0]?.statistics?.subscriberCount ?? "0");
    if (!n) return null;
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
    if (n >= 1000)    return `${(n/1000).toFixed(1)}K`;
    return String(n);
  } catch { return null; }
}

async function fetchRegion(): Promise<string | null> {
  try {
    const d = await (await fetch("https://ipapi.co/json/")).json();
    return d.country_code ?? null;
  } catch { return null; }
}

async function fetchTrackPreview(title: string): Promise<TrackData> {
  try {
    const res = await fetch(`/api/preview?q=${encodeURIComponent(title)}`);
    return res.json();
  } catch { return { found: false }; }
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @keyframes auroraShift  { 0%{filter:hue-rotate(0deg) brightness(1)} 50%{filter:hue-rotate(18deg) brightness(1.1)} 100%{filter:hue-rotate(-10deg) brightness(.95)} }
  @keyframes floatUp      { 0%{opacity:0;transform:translateY(0) scale(1)} 8%{opacity:.9} 80%{opacity:.3} 100%{opacity:0;transform:translateY(-110vh) scale(.4)} }
  @keyframes waveBar      { from{transform:scaleY(.15)} to{transform:scaleY(1)} }
  @keyframes spinRing     { to{transform:rotate(360deg)} }
  @keyframes pulseGlow    { 0%,100%{opacity:.45;transform:scale(.93)} 50%{opacity:.18;transform:scale(1.07)} }
  @keyframes pingDot      { 0%{transform:scale(1);opacity:.9} 100%{transform:scale(3);opacity:0} }
  @keyframes spin         { to{transform:rotate(360deg)} }
  @keyframes rotateBorder { to{transform:rotate(360deg)} }
  @keyframes charGlow     { 0%,100%{-webkit-text-stroke-color:var(--base-color);filter:drop-shadow(0 0 0 transparent)} 40%,60%{-webkit-text-stroke-color:var(--glow-color);filter:drop-shadow(0 0 8px var(--glow-color))} }
  @keyframes playPop      { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes vinylSpin    { to{transform:rotate(360deg)} }
  @keyframes needlePulse  { 0%,100%{transform:rotate(-25deg)} 50%{transform:rotate(-20deg)} }
  html { scroll-behavior: smooth; }
  * { scrollbar-width: none; }
  *::-webkit-scrollbar { display: none; }
`;

// ─── Grain ────────────────────────────────────────────────────────────────────
function GrainOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50" style={{ opacity: 0.04 }}>
      <svg width="100%" height="100%"><filter id="gf"><feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#gf)"/></svg>
    </div>
  );
}

// ─── Aurora ───────────────────────────────────────────────────────────────────
function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 55% at 15% 8%,rgba(134,239,172,.07) 0%,transparent 55%),radial-gradient(ellipse 55% 50% at 85% 88%,rgba(252,211,77,.05) 0%,transparent 55%),radial-gradient(ellipse 65% 65% at 50% 45%,rgba(168,85,247,.08) 0%,transparent 65%)", animation: "auroraShift 16s ease-in-out infinite alternate" }} />
      {Array.from({ length: 20 }).map((_, i) => {
        const colors = ["#86efac","#fcd34d","#a855f7","#ffffff","#6ee7b7"];
        return <div key={i} className="absolute rounded-full" style={{ width:`${1.2+(i%3)*1.2}px`, height:`${1.2+(i%3)*1.2}px`, left:`${(i*5.1+2)%100}%`, bottom:"-4%", background:colors[i%colors.length], opacity:0, animation:`floatUp ${11+(i*1.1)%9}s ${(i*.65)%9}s ease-in infinite` }} />;
      })}
    </div>
  );
}

// ─── Scroll progress ──────────────────────────────────────────────────────────
function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      setPct(scrollHeight <= clientHeight ? 0 : (scrollTop / (scrollHeight - clientHeight)) * 100);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <div className="fixed top-0 left-0 z-[60] h-[2px] pointer-events-none transition-all duration-100" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#a855f7,#22d3ee,#86efac)" }} />;
}

// ─── Era Intro ────────────────────────────────────────────────────────────────
function EraIntro({ onDone }: { onDone: () => void }) {
  const [exit, setExit] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setExit(true), 3400);
    const t2 = setTimeout(onDone, 4100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  return (
    <AnimatePresence>
      {!exit && (
        <motion.div className="fixed inset-0 z-[200] flex flex-col items-center justify-center" style={{ background: "#000" }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}>
          <motion.div initial={{ opacity: 0, letterSpacing: "0.6em" }} animate={{ opacity: 1, letterSpacing: "0.35em" }} transition={{ delay: 0.5, duration: 1.2 }} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 24 }}>Chapter 1</motion.div>
          <div style={{ display: "flex" }}>
            {"JXXMAL".split("").map((l, i) => (
              <motion.span key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ display: "inline-block", fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 900, fontSize: "clamp(4rem,18vw,8rem)", lineHeight: 1, background: "linear-gradient(130deg,#f0eeff 20%,#a855f7 58%,#86efac 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{l}</motion.span>
            ))}
          </div>
          <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0] }} transition={{ delay: 2.8, duration: 0.5 }} style={{ background: "radial-gradient(ellipse at center,rgba(168,85,247,0.5),transparent 70%)" }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [exit, setExit] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setExit(true), 2200);
    const t2 = setTimeout(onDone, 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  return (
    <AnimatePresence>
      {!exit && (
        <motion.div className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-6" style={{ background: "#07060f" }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} style={{ fontFamily: "'Big Shoulders Display',sans-serif", fontWeight: 900, fontSize: 48, background: "linear-gradient(130deg,#f0eeff,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>JXXMAL</motion.div>
          <div className="flex items-end gap-[3px]" style={{ height: 24 }}>
            {BAR_HEIGHTS.slice(0, 7).map((h, i) => <div key={i} className="rounded-full" style={{ width: 3, height: `${h}%`, background: i%2===0?"linear-gradient(to top,#a855f7,#c084fc)":"linear-gradient(to top,#86efac,#a855f7)", transformOrigin:"bottom", animation:`waveBar ${.55+(i%5)*.12}s ease-in-out ${i*.06}s infinite alternate` }} />)}
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, letterSpacing: "0.25em", color: "rgba(240,238,255,0.3)", textTransform: "uppercase" }}>Loading...</motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Waveform ─────────────────────────────────────────────────────────────────
function Waveform({ bars = 13, height = 28 }: { bars?: number; height?: number }) {
  return (
    <div className="flex items-end justify-center gap-[3px]" style={{ height }}>
      {BAR_HEIGHTS.slice(0, bars).map((h, i) => <div key={i} className="rounded-full" style={{ width:3, height:`${h}%`, background:i%2===0?"linear-gradient(to top,#a855f7,#c084fc)":"linear-gradient(to top,#86efac,#a855f7)", transformOrigin:"bottom", animation:`waveBar ${.55+(i%5)*.12}s ease-in-out ${i*.06}s infinite alternate` }} />)}
    </div>
  );
}

// ─── Glass ────────────────────────────────────────────────────────────────────
function Glass({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`rounded-2xl ${className}`} style={{ background:"rgba(255,255,255,0.04)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.08)", boxShadow:"0 8px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.06)", ...style }}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] tracking-[0.28em] uppercase mb-4" style={{ color:"rgba(240,238,255,0.25)", fontFamily:"'Outfit',sans-serif" }}>{children}</div>;
}

// ─── Vinyl component ──────────────────────────────────────────────────────────
function Vinyl({ albumArt, isPlaying }: { albumArt: string; isPlaying: boolean }) {
  return (
    <div className="relative mx-auto" style={{ width: 120, height: 120 }}>
      {/* Spinning disc */}
      <div className="absolute inset-0 rounded-full" style={{ background: "#0d0c1a", animation: isPlaying ? "vinylSpin 2.5s linear infinite" : "none", boxShadow: isPlaying ? "0 0 30px rgba(168,85,247,0.5)" : "0 0 10px rgba(0,0,0,0.5)" }}>
        {/* Groove rings */}
        {[42, 52, 62, 72, 82, 92].map(r => (
          <div key={r} className="absolute rounded-full" style={{ inset:`${(100-r)/2}%`, border:"1px solid rgba(255,255,255,0.04)" }} />
        ))}
        {/* Album art center */}
        <div className="absolute rounded-full overflow-hidden" style={{ width:"50%", height:"50%", top:"25%", left:"25%", border:"2px solid rgba(255,255,255,0.1)" }}>
          <img src={albumArt} alt="" className="w-full h-full object-cover" />
        </div>
        {/* Center hole */}
        <div className="absolute rounded-full" style={{ width:8, height:8, top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:"#07060f", border:"1px solid rgba(255,255,255,0.15)", zIndex:2 }} />
      </div>
      {/* Needle arm */}
      <div className="absolute" style={{ top:"-4px", right:"-4px", width:4, height:52, background:"linear-gradient(to bottom,rgba(240,238,255,0.6),rgba(240,238,255,0.2))", borderRadius:2, transformOrigin:"top center", animation: isPlaying ? "needlePulse 1.2s ease-in-out infinite" : "none", transform:"rotate(-20deg)" }} />
    </div>
  );
}

// ─── Platform modal ───────────────────────────────────────────────────────────
function PlatformModal({ trackData, onClose }: { trackData: TrackData | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[190] flex items-end justify-center px-4 pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ background: "rgba(7,6,15,0.85)", backdropFilter: "blur(12px)" }}>
        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type:"spring", stiffness:300, damping:28 }} className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <div className="text-center text-xs tracking-[0.2em] uppercase mb-4" style={{ color:"rgba(240,238,255,0.35)", fontFamily:"'Outfit',sans-serif" }}>Add to Playlist</div>
          <div className="grid grid-cols-2 gap-3">
            {PLAYLIST_PLATFORMS.map(p => (
              <a key={p.name} href={p.getUrl(trackData)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-2xl no-underline transition-all active:scale-95" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", backdropFilter:"blur(20px)" }}>
                <span style={{ color: p.color }}>{p.icon}</span>
                <span className="text-xs font-medium" style={{ color:"rgba(240,238,255,0.8)", fontFamily:"'Outfit',sans-serif" }}>{p.name}</span>
              </a>
            ))}
          </div>
          <button onClick={onClose} className="w-full mt-3 py-3 rounded-2xl text-xs tracking-widest uppercase transition-all active:scale-95" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(240,238,255,0.35)", fontFamily:"'Outfit',sans-serif" }}>Cancel</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Journey card (flip) ──────────────────────────────────────────────────────
function JourneyCard({ video, isFeatured }: { video: YTVideo; isFeatured: boolean }) {
  const color = isFeatured ? "#86efac" : "#a855f7";
  const [flipped,       setFlipped]       = useState(false);
  const [trackData,     setTrackData]     = useState<TrackData | null>(null);
  const [loadingTrack,  setLoadingTrack]  = useState(false);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [ended,         setEnded]         = useState(false);
  const [showPlatforms, setShowPlatforms] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleFlip() {
    if (flipped) {
      // Flip back
      audioRef.current?.pause();
      audioRef.current = null;
      setIsPlaying(false);
      setEnded(false);
      setFlipped(false);
      return;
    }
    setFlipped(true);
    setEnded(false);
    if (!trackData) {
      setLoadingTrack(true);
      const data = await fetchTrackPreview(video.title);
      setTrackData(data);
      setLoadingTrack(false);
      if (data.previewUrl) {
        const audio = new Audio(data.previewUrl);
        audio.onended = () => { setIsPlaying(false); setEnded(true); };
        audioRef.current = audio;
        audio.play();
        setIsPlaying(true);
      } else {
        setEnded(true);
      }
    } else if (trackData.previewUrl && !isPlaying) {
      const audio = new Audio(trackData.previewUrl);
      audio.onended = () => { setIsPlaying(false); setEnded(true); };
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
    }
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else           { audioRef.current.play();  setIsPlaying(true);  }
  }

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const albumArt = trackData?.albumArt ?? video.thumbnail;

  return (
    <>
      <div className="flex-shrink-0" style={{ width: 148, scrollSnapAlign: "start", perspective: 1000 }}>
        <div style={{ transformStyle: "preserve-3d", transition: "transform 0.65s cubic-bezier(0.22,1,0.36,1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0)", position: "relative", height: 220 }}>

          {/* ── Front ── */}
          <div style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }} onClick={handleFlip}>
            <Glass className="overflow-hidden h-full cursor-pointer" style={{ borderColor: isFeatured ? `${color}40` : undefined, boxShadow: isFeatured ? `0 0 20px ${color}20` : undefined }}>
              <div className="relative w-full" style={{ aspectRatio:"1" }}>
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" style={{ filter: isFeatured ? "brightness(1)" : "brightness(0.75)" }} />
                {isFeatured && <div className="absolute top-2 right-2 text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-full" style={{ background:`${color}30`, color, border:`1px solid ${color}50`, fontFamily:"'Outfit',sans-serif" }}>Latest</div>}
                <div className="absolute inset-0 flex items-center justify-center" style={{ background:"rgba(7,6,15,0.3)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.2)" }}>
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4" style={{ marginLeft:2 }}><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              </div>
              <div className="px-3 py-2.5">
                <div className="text-xs font-semibold leading-tight mb-1 line-clamp-2" style={{ color:"#f0eeff", fontFamily:"'Outfit',sans-serif" }}>{video.title}</div>
                <div className="text-[10px]" style={{ color:"rgba(240,238,255,0.35)", fontFamily:"'Outfit',sans-serif" }}>{new Date(video.publishedAt).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</div>
              </div>
            </Glass>
          </div>

          {/* ── Back (vinyl) ── */}
          <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
            <Glass className="h-full flex flex-col items-center justify-between p-3" style={{ background:"rgba(7,6,15,0.9)" }}>
              {loadingTrack ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2" style={{ borderColor:"rgba(168,85,247,0.5)", borderTopColor:"transparent", animation:"spin 0.8s linear infinite" }} />
                </div>
              ) : (
                <>
                  <div className="w-full flex justify-end">
                    <button onClick={handleFlip} className="text-[18px] leading-none" style={{ color:"rgba(240,238,255,0.3)" }}>×</button>
                  </div>

                  <div onClick={ended ? undefined : togglePlay} className={ended ? "" : "cursor-pointer"}>
                    <Vinyl albumArt={albumArt} isPlaying={isPlaying} />
                  </div>

                  <div className="w-full text-center">
                    {!ended ? (
                      <>
                        <div className="text-[10px] truncate mb-1" style={{ color:"rgba(240,238,255,0.7)", fontFamily:"'Outfit',sans-serif" }}>{video.title}</div>
                        <div className="text-[9px] tracking-widest uppercase" style={{ color:"rgba(240,238,255,0.3)", fontFamily:"'Outfit',sans-serif" }}>{isPlaying ? "playing preview" : trackData?.previewUrl ? "tap to play" : "no preview"}</div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2 w-full">
                        <button onClick={() => setShowPlatforms(true)} className="w-full py-2 rounded-xl text-[11px] font-semibold transition-all active:scale-95" style={{ background:"linear-gradient(135deg,#a855f7,#22d3ee)", color:"#fff", fontFamily:"'Outfit',sans-serif" }}>+ Add to Playlist</button>
                        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="w-full py-2 rounded-xl text-[11px] text-center no-underline transition-all active:scale-95" style={{ background:"rgba(255,0,0,0.15)", border:"1px solid rgba(255,0,0,0.3)", color:"rgba(240,238,255,0.8)", fontFamily:"'Outfit',sans-serif" }}>Watch on YouTube</a>
                      </div>
                    )}
                  </div>
                </>
              )}
            </Glass>
          </div>
        </div>
      </div>
      {showPlatforms && <PlatformModal trackData={trackData} onClose={() => setShowPlatforms(false)} />}
    </>
  );
}

// ─── Journey Timeline ─────────────────────────────────────────────────────────
function JourneyTimeline({ videos }: { videos: YTVideo[] }) {
  const ordered = [...videos].reverse();
  return (
    <motion.section initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} className="w-full max-w-md mx-auto mb-6 px-4">
      <SectionLabel>My Journey</SectionLabel>
      {videos.length === 0 ? (
        <div className="text-center py-6 text-sm" style={{ color:"rgba(240,238,255,0.3)", fontFamily:"'Outfit',sans-serif" }}>Loading releases...</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType:"x mandatory" }}>
          {ordered.map((v, i) => <JourneyCard key={v.id} video={v} isFeatured={i === ordered.length - 1} />)}
          <div className="flex-shrink-0" style={{ width:148, scrollSnapAlign:"start" }}>
            <Glass className="h-full flex flex-col items-center justify-center text-center p-4" style={{ minHeight:220 }}>
              <div className="text-2xl mb-2" style={{ color:"rgba(240,238,255,0.15)" }}>+</div>
              <div className="text-[10px] tracking-widest uppercase" style={{ color:"rgba(240,238,255,0.2)", fontFamily:"'Outfit',sans-serif" }}>Next Era</div>
            </Glass>
          </div>
        </div>
      )}
    </motion.section>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
// ── Update this number whenever your Instagram count changes ──
const IG_FOLLOWERS = "115";

function Hero({ eggCount, onEggTap, subscribers, isCaribbean }: { eggCount:number; onEggTap:()=>void; subscribers:string|null; isCaribbean:boolean }) {
  const [copied, setCopied] = useState(false);
  function share() {
    navigator.clipboard.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <section className="flex flex-col items-center pt-16 pb-8">
      <motion.div initial={{ opacity:0, scale:0.82 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.65, ease:[0.22,1,0.36,1] }} className="relative mb-5 cursor-pointer" onClick={onEggTap}>
        <div className="absolute inset-[-3px] rounded-full" style={{ background:"conic-gradient(from 0deg,#86efac,#fcd34d,#a855f7,#86efac)", animation:"spinRing 8s linear infinite" }} />
        <div className="absolute pointer-events-none" style={{ inset:-14, borderRadius:"9999px", background:"radial-gradient(ellipse,rgba(134,239,172,.15) 0%,transparent 68%)", animation:"pulseGlow 3.5s ease-in-out infinite" }} />
        <div className="relative rounded-full overflow-hidden" style={{ width:100, height:100, border:"2.5px solid #07060f", zIndex:1 }}>
          <ImageWithFallback src={profileImg} alt="JXXMAL" className="w-full h-full object-cover" />
        </div>
        {eggCount > 0 && eggCount < 7 && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background:"#a855f7", color:"#fff", zIndex:2 }}>{eggCount}</div>}
      </motion.div>

      <div className="flex items-end justify-center mb-3" style={{ perspective:600 }}>
        {"JXXMAL".split("").map((l, i) => (
          <motion.span key={i} initial={{ opacity:0, y:36, rotateX:-70 }} animate={{ opacity:1, y:0, rotateX:0 }} transition={{ delay:0.18+i*0.07, duration:0.55, ease:[0.22,1,0.36,1] }}
            style={{ display:"inline-block", fontFamily:"'Big Shoulders Display',sans-serif", fontWeight:900, fontSize:"clamp(3.2rem,15vw,5.8rem)", lineHeight:1, letterSpacing:"-0.01em", background:"linear-gradient(130deg,#f0eeff 20%,#a855f7 58%,#86efac 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", transformOrigin:"bottom center" }}>{l}
          </motion.span>
        ))}
      </div>

      <motion.div initial={{ opacity:0, scaleX:0.5 }} animate={{ opacity:1, scaleX:1 }} transition={{ delay:0.7, duration:0.5 }} className="mb-2"><Waveform /></motion.div>

      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.85 }} className="text-center mb-4" style={{ fontFamily:"'Big Shoulders Display',sans-serif", fontWeight:900, fontSize:"clamp(0.9rem,4vw,1.2rem)", letterSpacing:"0.04em" }}>
        {([["#","rgba(240,238,255,0.25)","rgba(240,238,255,0.9)","0s"],["4","rgba(206,17,38,0.45)","rgba(206,17,38,1)","0.7s"],["7","rgba(0,158,96,0.45)","rgba(0,158,96,1)","1.4s"],["3","rgba(252,209,22,0.45)","rgba(252,209,22,1)","2.1s"]] as [string,string,string,string][]).map(([ch,base,glow,delay],i) => (
          <span key={i} style={{ WebkitTextStroke:`1px ${base}`, WebkitTextFillColor:"transparent", color:"transparent", animation:`charGlow 3s ease-in-out ${delay} infinite`, ["--glow-color" as any]:glow, ["--base-color" as any]:base }}>{ch}</span>
        ))}
      </motion.div>

      {/* Social proof + Caribbean tag + Share */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1 }} className="flex items-center gap-3 mb-6 flex-wrap justify-center">
        {subscribers && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background:"rgba(255,0,0,0.1)", border:"1px solid rgba(255,0,0,0.2)" }}>
            <svg viewBox="0 0 24 24" fill="#FF0000" className="w-3 h-3"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            <span className="text-[10px] font-medium" style={{ color:"rgba(240,238,255,0.6)", fontFamily:"'Outfit',sans-serif" }}>{subscribers} subs</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background:"rgba(225,48,108,0.1)", border:"1px solid rgba(225,48,108,0.2)" }}>
          <svg viewBox="0 0 24 24" fill="#E1306C" className="w-3 h-3"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          <span className="text-[10px] font-medium" style={{ color:"rgba(240,238,255,0.6)", fontFamily:"'Outfit',sans-serif" }}>{IG_FOLLOWERS} followers</span>
        </div>
        {isCaribbean && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background:"rgba(0,158,96,0.1)", border:"1px solid rgba(0,158,96,0.25)" }}>
            <span style={{ fontSize:12 }}>🇬🇩</span>
            <span className="text-[10px]" style={{ color:"rgba(240,238,255,0.5)", fontFamily:"'Outfit',sans-serif" }}>from the rock</span>
          </div>
        )}
        <button onClick={share} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95" style={{ background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.25)" }}>
          {copied ? (
            <span className="text-[10px]" style={{ color:"#86efac", fontFamily:"'Outfit',sans-serif" }}>Link copied ✓</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(168,85,247,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              <span className="text-[10px]" style={{ color:"rgba(168,85,247,0.8)", fontFamily:"'Outfit',sans-serif" }}>Share</span>
            </>
          )}
        </button>
      </motion.div>

      <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:0.9, duration:0.65 }} className="w-full max-w-md" style={{ height:"1px", background:"linear-gradient(90deg,transparent,rgba(168,85,247,.35),rgba(134,239,172,.28),transparent)" }} />
    </section>
  );
}

// ─── Latest Release ───────────────────────────────────────────────────────────
function LatestRelease({ videos }: { videos: YTVideo[] }) {
  const latest = videos[0];
  const [playing, setPlaying] = useState(false);
  if (!latest) return null;
  return (
    <motion.section initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} className="w-full max-w-md mx-auto mb-6 px-4">
      <SectionLabel>Latest Drop</SectionLabel>
      <div className="relative rounded-2xl" style={{ padding:"1.5px" }}>
        <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ zIndex:0 }}>
          <div style={{ position:"absolute", inset:"-100%", background:"conic-gradient(from 0deg,transparent 72%,rgba(255,255,255,0.4) 84%,rgba(255,255,255,0.9) 90%,rgba(255,255,255,0.4) 96%,transparent 100%)", animation:"rotateBorder 5s linear infinite", filter:"blur(3px)" }} />
          <div style={{ position:"absolute", inset:"-100%", background:"conic-gradient(from 0deg,transparent 80%,rgba(255,255,255,0.5) 88%,rgba(255,255,255,0.5) 93%,transparent 100%)", animation:"rotateBorder 5s linear infinite" }} />
        </div>
        {!playing ? (
          <button onClick={() => setPlaying(true)} className="relative w-full group cursor-pointer block overflow-hidden" style={{ borderRadius:"calc(1rem - 1.5px)", aspectRatio:"16/9", background:"#0d0c1a", zIndex:1 }}>
            <img src={latest.thumbnail} alt={latest.title} className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-90 group-hover:scale-[1.02]" style={{ filter:"brightness(0.72)" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110" style={{ width:58, height:58, background:"rgba(255,255,255,0.93)", boxShadow:"0 0 40px rgba(255,255,255,.2)", animation:"playPop 2.5s ease-in-out infinite" }}>
                <svg viewBox="0 0 24 24" fill="#07060f" className="w-6 h-6" style={{ marginLeft:3 }}><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3" style={{ background:"linear-gradient(to top,rgba(7,6,15,.95),transparent)" }}>
              <div className="text-sm font-medium truncate" style={{ color:"rgba(240,238,255,.9)", fontFamily:"'Outfit',sans-serif" }}>{latest.title}</div>
              <div className="text-[11px] mt-0.5" style={{ color:"rgba(240,238,255,.35)", fontFamily:"'Outfit',sans-serif" }}>{new Date(latest.publishedAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
            </div>
          </button>
        ) : (
          <div className="relative w-full overflow-hidden" style={{ borderRadius:"calc(1rem - 1.5px)", aspectRatio:"16/9", zIndex:1 }}>
            <iframe src={`https://www.youtube.com/embed/${latest.id}?autoplay=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" style={{ border:"none" }} />
          </div>
        )}
      </div>
      <Glass className="mt-3 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold" style={{ color:"#f0eeff", fontFamily:"'Big Shoulders Display',sans-serif", letterSpacing:"0.02em" }}>Winning Again</div>
            <div className="text-[11px] mt-0.5" style={{ color:"rgba(240,238,255,0.4)", fontFamily:"'Outfit',sans-serif" }}>June 19, 2026 · 2:48</div>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {["Hip Hop","Motivational","Caribbean"].map(tag => <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full tracking-wide" style={{ background:"rgba(168,85,247,0.15)", border:"1px solid rgba(168,85,247,0.25)", color:"rgba(240,238,255,0.6)", fontFamily:"'Outfit',sans-serif" }}>{tag}</span>)}
          </div>
        </div>
      </Glass>
    </motion.section>
  );
}

// ─── Platform cards ───────────────────────────────────────────────────────────
function PlatformCard({ platform, index }: { platform: typeof PLATFORMS[0]; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [mag, setMag]         = useState({ x:0, y:0 });
  const [hovered, setHovered] = useState(false);
  const speed = CARD_SPEEDS[index]; const offset = CARD_OFFSETS[index];
  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setMag({ x:((e.clientX-r.left-r.width/2)/(r.width/2))*9, y:((e.clientY-r.top-r.height/2)/(r.height/2))*9 });
  }
  function onMouseLeave() { setMag({x:0,y:0}); setHovered(false); }
  return (
    <motion.div initial={{ opacity:0, scale:0.88, y:20 }} animate={{ opacity:1, scale:hovered?1.03:1, x:mag.x, y:mag.y }} transition={{ opacity:{delay:0.6+index*0.09,duration:0.5,ease:[0.22,1,0.36,1]}, scale:{type:"spring",stiffness:280,damping:22}, x:{type:"spring",stiffness:280,damping:22}, y:{type:"spring",stiffness:280,damping:22} }} className="relative rounded-2xl" style={{ padding:"1.5px" }}>
      <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ zIndex:0 }}>
        <div style={{ position:"absolute", inset:"-100%", background:`conic-gradient(from ${offset}deg,transparent 72%,${platform.neon} 84%,#ffffff 90%,${platform.neon} 96%,transparent 100%)`, animation:`rotateBorder ${speed}s linear infinite`, opacity:hovered?1:0.85, filter:"blur(3px)", transition:"opacity 0.3s" }} />
        <div style={{ position:"absolute", inset:"-100%", background:`conic-gradient(from ${offset}deg,transparent 80%,${platform.neon} 88%,${platform.neon} 93%,transparent 100%)`, animation:`rotateBorder ${speed}s linear infinite`, opacity:hovered?1:0.7, transition:"opacity 0.3s" }} />
      </div>
      <motion.a ref={ref} href={platform.href} target="_blank" rel="noopener noreferrer" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} onHoverStart={() => setHovered(true)} onHoverEnd={onMouseLeave}
        className="relative flex flex-col items-center justify-center gap-3 no-underline cursor-pointer w-full overflow-hidden"
        style={{ padding:"28px 16px 22px", background:hovered?`radial-gradient(ellipse at 50% 40%,${platform.color}18 0%,#0d0c1a 70%)`:"#0d0c1a", borderRadius:"calc(1rem - 1.5px)", zIndex:1, transition:"background 0.25s", backdropFilter:"blur(20px)" }}>
        <motion.div animate={{ scale:hovered?1.15:1, y:hovered?-2:0 }} transition={{ duration:0.2 }} style={{ color:hovered?platform.color:"rgba(240,238,255,0.75)", transition:"color 0.2s" }}>{platform.icon}</motion.div>
        <div className="text-center">
          <div className="text-[11px] font-semibold tracking-widest uppercase mb-0.5" style={{ color:hovered?platform.color:"rgba(240,238,255,0.85)", fontFamily:"'Outfit',sans-serif", transition:"color 0.2s" }}>{platform.name}</div>
          <div className="text-[10px] tracking-[0.15em] uppercase" style={{ color:"rgba(240,238,255,0.28)", fontFamily:"'Outfit',sans-serif" }}>{platform.cta}</div>
        </div>
      </motion.a>
    </motion.div>
  );
}

// ─── Next Era ─────────────────────────────────────────────────────────────────
function NextEraTeaser() {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"done"|"error">("idle");

  async function notify(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "bounce_notify" }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch { setStatus("error"); }
  }

  return (
    <motion.section initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} className="w-full max-w-md mx-auto mb-6 px-4">
      <SectionLabel>Next Era</SectionLabel>
      <Glass className="relative overflow-hidden p-6 text-center" style={{ background:"rgba(168,85,247,0.05)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 50% 100%,rgba(168,85,247,0.15),transparent 70%)" }} />
        <div className="w-28 h-28 mx-auto mb-5 rounded-2xl flex items-center justify-center relative" style={{ background:"linear-gradient(135deg,rgba(168,85,247,0.3),rgba(34,211,238,0.2))", border:"1px solid rgba(168,85,247,0.2)" }}>
          <div className="absolute inset-0 rounded-2xl" style={{ backdropFilter:"blur(8px)", background:"rgba(7,6,15,0.5)" }} />
          <div className="relative text-4xl" style={{ color:"rgba(168,85,247,0.6)" }}>?</div>
        </div>
        <div className="text-[11px] tracking-[0.3em] uppercase mb-1" style={{ color:"rgba(240,238,255,0.3)", fontFamily:"'Outfit',sans-serif" }}>Coming Soon</div>
        <div style={{ fontFamily:"'Big Shoulders Display',sans-serif", fontWeight:900, fontSize:"clamp(2rem,10vw,3.5rem)", background:"linear-gradient(130deg,#f0eeff,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", marginBottom:24 }}>BOUNCE</div>
        {status === "done" ? (
          <div className="text-sm" style={{ color:"#a855f7", fontFamily:"'Outfit',sans-serif" }}>You'll hear it first ✦</div>
        ) : (
          <form onSubmit={notify} className="flex gap-2">
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#f0eeff", fontFamily:"'Outfit',sans-serif" }} />
            <button type="submit" disabled={status==="loading"} className="px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all hover:scale-105 active:scale-95 disabled:opacity-60" style={{ background:"rgba(168,85,247,0.2)", border:"1px solid rgba(168,85,247,0.4)", color:"#c084fc", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap" }}>{status==="loading"?"...":"Notify Me"}</button>
          </form>
        )}
        {status === "error" && <div className="text-[11px] mt-2" style={{ color:"#fc3c44", fontFamily:"'Outfit',sans-serif" }}>Something went wrong. Try again.</div>}
      </Glass>
    </motion.section>
  );
}

// ─── Inner Circle ─────────────────────────────────────────────────────────────
function InnerCircle() {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"done"|"error">("idle");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status==="loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email}) });
      setStatus(res.ok ? "done" : "error");
    } catch { setStatus("error"); }
  }
  return (
    <motion.section initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} className="w-full max-w-md mx-auto mb-6 px-4">
      <Glass className="relative overflow-hidden p-6" style={{ background:"rgba(34,211,238,0.03)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 50% 0%,rgba(34,211,238,0.1),transparent 60%)" }} />
        <div className="relative text-center">
          <div className="text-[10px] tracking-[0.28em] uppercase mb-2" style={{ color:"rgba(34,211,238,0.5)", fontFamily:"'Outfit',sans-serif" }}>Exclusive Access</div>
          <div style={{ fontFamily:"'Big Shoulders Display',sans-serif", fontWeight:900, fontSize:"clamp(1.4rem,6vw,2rem)", color:"#f0eeff", marginBottom:16 }}>JOIN THE INNER CIRCLE</div>
          <div className="flex flex-col gap-2 mb-5 text-left">
            {["Hear songs before everyone else","Behind the scenes content","Exclusive snippets","Merch announcements","Early access to future releases"].map(b => (
              <div key={b} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:"#22d3ee" }} />
                <span className="text-[12px]" style={{ color:"rgba(240,238,255,0.6)", fontFamily:"'Outfit',sans-serif" }}>{b}</span>
              </div>
            ))}
          </div>
          {status === "done" ? (
            <div className="text-sm py-2" style={{ color:"#22d3ee", fontFamily:"'Outfit',sans-serif" }}>Welcome to the Inner Circle ✦</div>
          ) : (
            <form onSubmit={submit} className="flex gap-2">
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#f0eeff", fontFamily:"'Outfit',sans-serif" }} />
              <button type="submit" disabled={status==="loading"} className="px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all hover:scale-105 active:scale-95 disabled:opacity-60" style={{ background:"linear-gradient(135deg,#22d3ee,#a855f7)", color:"#fff", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap" }}>{status==="loading"?"...":"Join Now"}</button>
            </form>
          )}
          {status === "error" && <div className="text-[11px] mt-2" style={{ color:"#fc3c44", fontFamily:"'Outfit',sans-serif" }}>Something went wrong. Try again.</div>}
        </div>
      </Glass>
    </motion.section>
  );
}

// ─── Globe ────────────────────────────────────────────────────────────────────
const LISTENER_MARKERS: [number, number][] = [[-61.6,12.1],[-61.2,10.6],[-95.7,37.1],[-3.4,55.4],[-96.8,56.1],[-77.3,18.1],[-59.6,13.2],[10.4,51.2]];
const MARKER_NAMES = ["Grenada","Trinidad","United States","United Kingdom","Canada","Jamaica","Barbados","Germany"];

function ListenerGlobe() {
  const [userCoords, setUserCoords] = useState<[number,number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserCoords([pos.coords.longitude, pos.coords.latitude]),
      () => {} // silently fail if denied
    );
  }, []);

  return (
    <motion.section initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} className="w-full max-w-md mx-auto mb-6 px-4">
      <SectionLabel>Global Listeners</SectionLabel>
      <Glass className="p-4">
        <div className="rounded-xl overflow-hidden" style={{ background:"rgba(7,6,15,0.6)" }}>
          <ComposableMap projection="geoMercator" projectionConfig={{ scale:100, center:[-20,20] }} style={{ width:"100%", height:"auto" }}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) => geographies.map(geo => (
                <Geography key={geo.rsmKey} geography={geo} fill="rgba(168,85,247,0.08)" stroke="rgba(168,85,247,0.25)" strokeWidth={0.5} style={{ default:{outline:"none"}, hover:{fill:"rgba(168,85,247,0.18)",outline:"none"}, pressed:{outline:"none"} }} />
              ))}
            </Geographies>

            {/* Community listener dots */}
            {LISTENER_MARKERS.map((coords, i) => (
              <Marker key={i} coordinates={coords}>
                <circle r={4} fill="#a855f7" fillOpacity={0.9} style={{ filter:"drop-shadow(0 0 6px #a855f7)" }} />
                <circle r={8} fill="none" stroke="#a855f7" strokeWidth={1} strokeOpacity={0.4}>
                  <animate attributeName="r" from="4" to="14" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
              </Marker>
            ))}

            {/* Visitor's current location */}
            {userCoords && (
              <Marker coordinates={userCoords}>
                {/* Outer fast pulse */}
                <circle r={10} fill="none" stroke="#22d3ee" strokeWidth={1.5} strokeOpacity={0.5}>
                  <animate attributeName="r" from="6" to="18" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite" />
                </circle>
                {/* Middle ring */}
                <circle r={6} fill="none" stroke="#22d3ee" strokeWidth={1} strokeOpacity={0.4}>
                  <animate attributeName="r" from="4" to="10" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" from="0.6" to="0" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
                </circle>
                {/* Solid center dot */}
                <circle r={4} fill="#22d3ee" style={{ filter:"drop-shadow(0 0 8px #22d3ee)" }} />
                {/* "You" label */}
                <text textAnchor="middle" y={-10} style={{ fill:"#22d3ee", fontSize:6, fontFamily:"'Outfit',sans-serif", fontWeight:600 }}>YOU</text>
              </Marker>
            )}
          </ComposableMap>
        </div>
        <div className="text-center mt-3">
          <div className="text-sm font-semibold mb-1" style={{ color:"#f0eeff", fontFamily:"'Outfit',sans-serif" }}>Worldwide &amp; Growing</div>
          <div className="text-[11px]" style={{ color:"rgba(240,238,255,0.35)", fontFamily:"'Outfit',sans-serif" }}>
            {userCoords ? "You're part of this." : MARKER_NAMES.join(" · ")}
          </div>
        </div>
      </Glass>
    </motion.section>
  );
}

// ─── Easter Egg ───────────────────────────────────────────────────────────────
function EasterEgg({ onClose }: { onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[180] flex flex-col items-center justify-center p-8" style={{ background:"rgba(7,6,15,0.97)", backdropFilter:"blur(20px)" }} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 50% 50%,rgba(168,85,247,0.2),transparent 65%)" }} />
      <div className="relative text-center max-w-sm">
        <div className="text-4xl mb-4">✦</div>
        <div style={{ fontFamily:"'Big Shoulders Display',sans-serif", fontWeight:900, fontSize:32, color:"#f0eeff", marginBottom:8 }}>You Found It.</div>
        <div className="text-sm leading-relaxed mb-6" style={{ color:"rgba(240,238,255,0.55)", fontFamily:"'Outfit',sans-serif" }}>Real ones always find the hidden door. This space is for you — the ones who actually listen, actually feel it, actually support from day one. Chapter 1 is just the beginning. Stay close.</div>
        <div className="text-xs tracking-[0.3em] uppercase mb-6" style={{ color:"rgba(168,85,247,0.6)", fontFamily:"'Outfit',sans-serif" }}>— JXXMAL #473</div>
        <button onClick={onClose} className="px-6 py-2 rounded-full text-sm transition-all hover:scale-105" style={{ background:"rgba(168,85,247,0.2)", border:"1px solid rgba(168,85,247,0.4)", color:"#c084fc", fontFamily:"'Outfit',sans-serif" }}>Close</button>
      </div>
    </motion.div>
  );
}

// ─── Bottom bar ───────────────────────────────────────────────────────────────
function NowPlayingBar() {
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:1.4, duration:0.6 }} className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-3" style={{ paddingTop:10, paddingBottom:14, background:"linear-gradient(to top,rgba(7,6,15,1),rgba(7,6,15,0.7))", backdropFilter:"blur(16px)", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
      <div className="relative flex items-center justify-center" style={{ width:10, height:10 }}>
        <div className="absolute inset-0 rounded-full" style={{ background:"#a855f7", animation:"pingDot 2s ease-out infinite" }} />
        <div className="w-2 h-2 rounded-full" style={{ background:"#a855f7" }} />
      </div>
      <span style={{ color:"rgba(240,238,255,0.3)", fontSize:10, letterSpacing:"0.22em", fontFamily:"'Outfit',sans-serif", textTransform:"uppercase" }}>Streaming Everywhere</span>
      <div className="flex items-end gap-px" style={{ height:13 }}>
        {[40,80,55,100,65].map((h,i) => <div key={i} className="rounded-full" style={{ width:2, height:`${h}%`, background:"#a855f7", transformOrigin:"bottom", animation:`waveBar ${.5+i*.13}s ease-in-out ${i*.09}s infinite alternate` }} />)}
      </div>
    </motion.div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [showIntro,    setShowIntro]    = useState(() => !localStorage.getItem(ERA_KEY));
  const [showLoading,  setShowLoading]  = useState(true);
  const [eggCount,     setEggCount]     = useState(0);
  const [eggActive,    setEggActive]    = useState(false);
  const [videos,       setVideos]       = useState<YTVideo[]>([]);
  const [subscribers,  setSubscribers]  = useState<string | null>(null);
  const [isCaribbean,  setIsCaribbean]  = useState(false);

  const handleIntroDone   = useCallback(() => { localStorage.setItem(ERA_KEY,"1"); setShowIntro(false); }, []);
  const handleLoadingDone = useCallback(() => setShowLoading(false), []);
  const handleEggTap      = useCallback(() => {
    setEggCount(n => { const next = n+1; if (next>=7){ setEggActive(true); return 0; } return next; });
  }, []);

  useEffect(() => {
    fetchChannelVideos().then(setVideos);
    fetchSubscriberCount().then(setSubscribers);
    fetchRegion().then(c => { if (c && CARIBBEAN_CODES.has(c)) setIsCaribbean(true); });
  }, []);

  const ready = !showIntro && !showLoading;

  return (
    <div className="min-h-screen w-full relative" style={{ background:"#07060f", fontFamily:"'Outfit',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>
      <GrainOverlay />
      <AuroraBackground />
      <ScrollProgress />

      {showIntro   && <EraIntro      onDone={handleIntroDone}   />}
      {showLoading && <LoadingScreen onDone={handleLoadingDone} />}

      <AnimatePresence>
        {eggActive && <EasterEgg onClose={() => setEggActive(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {ready && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.6 }} className="pb-24">
            <Hero eggCount={eggCount} onEggTap={handleEggTap} subscribers={subscribers} isCaribbean={isCaribbean} />
            <LatestRelease videos={videos} />
            <JourneyTimeline videos={videos} />
            <div className="w-full max-w-md mx-auto mb-6 px-4">
              <SectionLabel>Stream &amp; Follow</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {PLATFORMS.map((p,i) => <PlatformCard key={p.id} platform={p} index={i} />)}
              </div>
            </div>
            <NextEraTeaser />
            <InnerCircle />
            <ListenerGlobe />
            <div className="text-center py-6 text-[10px] tracking-widest" style={{ color:"rgba(240,238,255,0.1)", fontFamily:"'Outfit',sans-serif" }}>© 2026 JXXMAL</div>
          </motion.div>
        )}
      </AnimatePresence>

      {ready && <NowPlayingBar />}
    </div>
  );
}
