import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import profileImg from "@/imports/IMG_4819_2.JPG";

// ─── YouTube API ─────────────────────────────────────────────────────────────
const YT_API_KEY = "AIzaSyCapyKEmV8BLbE8ckUW0-xcmUtYk7UmQe8";
const YT_HANDLE  = "JXXMALMUSIK";

type VideoInfo = { id: string; title: string; published: string };

async function fetchLatestVideo(): Promise<VideoInfo | null> {
  try {
    const chanRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${YT_HANDLE}&key=${YT_API_KEY}`
    );
    if (!chanRes.ok) return null;
    const chanData = await chanRes.json();
    const uploadsId = chanData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return null;

    const plRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=${uploadsId}&key=${YT_API_KEY}`
    );
    if (!plRes.ok) return null;
    const plData = await plRes.json();
    const item = plData.items?.[0]?.snippet;
    if (!item) return null;

    return {
      id: item.resourceId.videoId,
      title: item.title,
      published: item.publishedAt
        ? new Date(item.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "",
    };
  } catch {
    return null;
  }
}

// ─── Platform data ────────────────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: "spotify",
    name: "Spotify",
    cta: "Listen Now",
    href: "https://open.spotify.com/artist/0pYbVdhffwzvHfEBdeFEUC?si=KV5tdQkiTN6rRd9_46yLXA",
    color: "#1DB954",
    neon: "#00ff7f",
    glow: "rgba(29,185,84,0.32)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
  },
  {
    id: "apple",
    name: "Apple Music",
    cta: "Listen Now",
    href: "https://music.apple.com/us/artist/jxxmal/1896724847",
    color: "#fc3c44",
    neon: "#ff2d55",
    glow: "rgba(252,60,68,0.32)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    id: "youtube",
    name: "YouTube",
    cta: "Watch Now",
    href: "https://www.youtube.com/@JXXMALMUSIK",
    color: "#FF0000",
    neon: "#ff3b3b",
    glow: "rgba(255,0,0,0.28)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    name: "Instagram",
    cta: "Follow Now",
    href: "https://www.instagram.com/jxxmalmusik/",
    color: "#E1306C",
    neon: "#ff2d78",
    glow: "rgba(225,48,108,0.32)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
];

// ─── Grain overlay ────────────────────────────────────────────────────────────
function GrainOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50" style={{ opacity: 0.04 }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>
    </div>
  );
}

// ─── Aurora background ────────────────────────────────────────────────────────
function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 15% 8%,  rgba(134,239,172,0.08) 0%, transparent 55%),
            radial-gradient(ellipse 55% 50% at 85% 88%, rgba(252,211,77,0.05)  0%, transparent 55%),
            radial-gradient(ellipse 65% 65% at 50% 45%, rgba(168,85,247,0.08)  0%, transparent 65%)
          `,
          animation: "auroraShift 16s ease-in-out infinite alternate",
        }}
      />
      {Array.from({ length: 20 }).map((_, i) => {
        const colors = ["#86efac", "#fcd34d", "#a855f7", "#ffffff", "#6ee7b7"];
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width:  `${1.2 + (i % 3) * 1.2}px`,
              height: `${1.2 + (i % 3) * 1.2}px`,
              left:   `${(i * 5.1 + 2) % 100}%`,
              bottom: "-4%",
              background: colors[i % colors.length],
              opacity: 0,
              animation: `floatUp ${11 + (i * 1.1) % 9}s ${(i * 0.65) % 9}s ease-in infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Waveform ─────────────────────────────────────────────────────────────────
const BAR_HEIGHTS = [35, 60, 80, 55, 90, 45, 75, 50, 65, 40, 70, 85, 45];

function Waveform() {
  return (
    <div className="flex items-end justify-center gap-[3px]" style={{ height: 28 }}>
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 3,
            height: `${h}%`,
            background: i % 2 === 0
              ? "linear-gradient(to top, #a855f7, #c084fc)"
              : "linear-gradient(to top, #86efac, #a855f7)",
            transformOrigin: "bottom",
            animation: `waveBar ${0.55 + (i % 5) * 0.12}s ease-in-out ${i * 0.06}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Animated name ────────────────────────────────────────────────────────────
function AnimatedName() {
  return (
    <div className="flex items-end justify-center" style={{ perspective: 600 }}>
      {"JXXMAL".split("").map((letter, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 36, rotateX: -70 }}
          animate={{ opacity: 1, y: 0,  rotateX: 0   }}
          transition={{ delay: 0.18 + i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: "inline-block",
            fontFamily: "'Big Shoulders Display', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(3.2rem, 15vw, 5.8rem)",
            lineHeight: 1,
            letterSpacing: "-0.01em",
            background: "linear-gradient(130deg, #f0eeff 20%, #a855f7 58%, #86efac 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            transformOrigin: "bottom center",
          }}
        >
          {letter}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Magnetic platform card ───────────────────────────────────────────────────
const CARD_SPEEDS   = [4.2, 3.8, 4.6, 3.5];
const CARD_OFFSETS  = [0, 90, 200, 300];

function PlatformCard({ platform, index }: { platform: typeof PLATFORMS[0] & { neon: string }; index: number }) {
  const ref  = useRef<HTMLAnchorElement>(null);
  const [mag, setMag] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    setMag({
      x: ((e.clientX - cx) / (r.width  / 2)) * 9,
      y: ((e.clientY - cy) / (r.height / 2)) * 9,
    });
  }

  function onMouseLeave() {
    setMag({ x: 0, y: 0 });
    setHovered(false);
  }

  const speed  = CARD_SPEEDS[index];
  const offset = CARD_OFFSETS[index];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 20 }}
      animate={{ opacity: 1, scale: hovered ? 1.03 : 1, x: mag.x, y: mag.y }}
      transition={{ opacity: { delay: 0.6 + index * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }, scale: { type: "spring", stiffness: 280, damping: 22 }, x: { type: "spring", stiffness: 280, damping: 22 }, y: { type: "spring", stiffness: 280, damping: 22 } }}
      className="relative rounded-2xl"
      style={{ padding: "1.5px" }}
    >
      {/* Rotating border spotlight */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-100%",
            background: `conic-gradient(from ${offset}deg, transparent 72%, ${platform.neon} 84%, #ffffff 90%, ${platform.neon} 96%, transparent 100%)`,
            animation: `rotateBorder ${speed}s linear infinite`,
            opacity: hovered ? 1 : 0.85,
            filter: `blur(3px)`,
            transition: "opacity 0.3s",
          }}
        />
        {/* Sharp overlay for crispness */}
        <div
          style={{
            position: "absolute",
            inset: "-100%",
            background: `conic-gradient(from ${offset}deg, transparent 80%, ${platform.neon} 88%, ${platform.neon} 93%, transparent 100%)`,
            animation: `rotateBorder ${speed}s linear infinite`,
            opacity: hovered ? 1 : 0.7,
            transition: "opacity 0.3s",
          }}
        />
      </div>

      {/* Card inner */}
      <motion.a
        ref={ref}
        href={platform.href}
        target="_blank"
        rel="noopener noreferrer"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={onMouseLeave}
        className="relative flex flex-col items-center justify-center gap-3 rounded-[calc(1rem-1.5px)] no-underline cursor-pointer w-full"
        style={{
          padding: "28px 16px 22px",
          background: hovered
            ? `radial-gradient(ellipse at 50% 40%, ${platform.color}18 0%, #0d0c1a 70%)`
            : "#0d0c1a",
          zIndex: 1,
          transition: "background 0.25s",
        }}
      >
        {/* icon */}
        <motion.div
          animate={{ scale: hovered ? 1.15 : 1, y: hovered ? -2 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: hovered ? platform.color : "rgba(240,238,255,0.75)", transition: "color 0.2s" }}
        >
          {platform.icon}
        </motion.div>

        {/* label */}
        <div className="text-center">
          <div
            className="text-[11px] font-semibold tracking-widest uppercase mb-0.5"
            style={{ color: hovered ? platform.color : "rgba(240,238,255,0.85)", fontFamily: "'Outfit',sans-serif", transition: "color 0.2s" }}
          >
            {platform.name}
          </div>
          <div
            className="text-[10px] tracking-[0.15em] uppercase"
            style={{ color: "rgba(240,238,255,0.28)", fontFamily: "'Outfit',sans-serif" }}
          >
            {platform.cta}
          </div>
        </div>
      </motion.a>
    </motion.div>
  );
}

// ─── YouTube video section ────────────────────────────────────────────────────
function VideoSection() {
  const [video,   setVideo]   = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    fetchLatestVideo().then((v) => { setVideo(v); setLoading(false); });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full mb-6"
    >
      <div
        className="text-[10px] tracking-[0.25em] uppercase mb-3"
        style={{ color: "rgba(240,238,255,0.25)", fontFamily: "'Outfit',sans-serif" }}
      >
        Latest Drop
      </div>

      {loading && (
        <div className="w-full rounded-2xl flex items-center justify-center"
          style={{ aspectRatio: "16/9", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent"
            style={{ borderColor: "rgba(168,85,247,0.5)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {!loading && video && !playing && (
        <div className="relative rounded-2xl" style={{ padding: "1.5px" }}>
          {/* Rotating white border spotlight */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ zIndex: 0 }}>
            <div style={{ position: "absolute", inset: "-100%", background: "conic-gradient(from 0deg, transparent 72%, rgba(255,255,255,0.4) 84%, rgba(255,255,255,0.9) 90%, rgba(255,255,255,0.4) 96%, transparent 100%)", animation: "rotateBorder 5s linear infinite", filter: "blur(3px)" }} />
            <div style={{ position: "absolute", inset: "-100%", background: "conic-gradient(from 0deg, transparent 80%, rgba(255,255,255,0.5) 88%, rgba(255,255,255,0.5) 93%, transparent 100%)", animation: "rotateBorder 5s linear infinite" }} />
          </div>
        <button
          onClick={() => setPlaying(true)}
          className="relative w-full rounded-[calc(1rem-1.5px)] overflow-hidden group cursor-pointer block"
          style={{ aspectRatio: "16/9", background: "#0d0c1a", zIndex: 1 }}
        >
          <img
            src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
            alt={video.title}
            className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-90 group-hover:scale-[1.02]"
            style={{ filter: "brightness(0.72)" }}
          />
          {/* play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
              style={{ width: 58, height: 58, background: "rgba(255,255,255,0.93)", boxShadow: "0 0 40px rgba(255,255,255,0.2)" }}
            >
              <svg viewBox="0 0 24 24" fill="#07060f" className="w-6 h-6" style={{ marginLeft: 3 }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {/* title overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3"
            style={{ background: "linear-gradient(to top, rgba(7,6,15,0.95), transparent)" }}>
            <div className="text-sm font-medium truncate" style={{ color: "rgba(240,238,255,0.9)", fontFamily: "'Outfit',sans-serif" }}>
              {video.title}
            </div>
            {video.published && (
              <div className="text-[11px] mt-0.5" style={{ color: "rgba(240,238,255,0.35)", fontFamily: "'Outfit',sans-serif" }}>
                {video.published}
              </div>
            )}
          </div>
        </button>
        </div>
      )}

      {!loading && video && playing && (
        <div className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9", border: "1px solid rgba(255,255,255,0.08)" }}>
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen className="w-full h-full" style={{ border: "none" }}
          />
        </div>
      )}

      {!loading && !video && (
        <a href="https://www.youtube.com/@JXXMALMUSIK" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full rounded-2xl no-underline"
          style={{ aspectRatio: "16/9", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(240,238,255,0.4)", fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>
          <svg viewBox="0 0 24 24" fill="#FF0000" className="w-5 h-5">
            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          Watch on YouTube
        </a>
      )}
    </motion.div>
  );
}

// ─── Now Playing bar ──────────────────────────────────────────────────────────
function NowPlayingBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4, duration: 0.6 }}
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-3"
      style={{
        paddingTop: 12,
        paddingBottom: 16,
        background: "linear-gradient(to top, rgba(7,6,15,1) 0%, rgba(7,6,15,0.7) 100%)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* pulsing dot */}
      <div className="relative flex items-center justify-center" style={{ width: 10, height: 10 }}>
        <div className="absolute inset-0 rounded-full" style={{ background: "#a855f7", animation: "pingDot 2s ease-out infinite", opacity: 0 }} />
        <div className="w-2 h-2 rounded-full" style={{ background: "#a855f7" }} />
      </div>

      <span style={{ color: "rgba(240,238,255,0.3)", fontSize: 10, letterSpacing: "0.22em", fontFamily: "'Outfit',sans-serif", textTransform: "uppercase" }}>
        Streaming Everywhere
      </span>

      {/* mini waveform */}
      <div className="flex items-end gap-px" style={{ height: 13 }}>
        {[40, 80, 55, 100, 65].map((h, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: 2,
              height: `${h}%`,
              background: "#a855f7",
              transformOrigin: "bottom",
              animation: `waveBar ${0.5 + i * 0.13}s ease-in-out ${i * 0.09}s infinite alternate`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative px-4 py-16 pb-20"
      style={{ background: "#07060f", fontFamily: "'Outfit', sans-serif" }}
    >
      <style>{`
        @keyframes auroraShift  { 0%{filter:hue-rotate(0deg) brightness(1)} 50%{filter:hue-rotate(18deg) brightness(1.1)} 100%{filter:hue-rotate(-10deg) brightness(0.95)} }
        @keyframes floatUp      { 0%{opacity:0;transform:translateY(0) scale(1)} 8%{opacity:.9} 80%{opacity:.3} 100%{opacity:0;transform:translateY(-110vh) scale(0.4)} }
        @keyframes rotateBorder { to { transform: rotate(360deg); } }
        @keyframes waveBar      { from{transform:scaleY(0.18)} to{transform:scaleY(1)} }
        @keyframes shimmer      { 0%{transform:translateX(-220%)} 100%{transform:translateX(320%)} }
        @keyframes spinRing     { to{transform:rotate(360deg)} }
        @keyframes pulseGlow    { 0%,100%{opacity:.45;transform:scale(.93)} 50%{opacity:.18;transform:scale(1.07)} }
        @keyframes charGlow {
          0%, 100% { -webkit-text-stroke-color: var(--base-color); filter: drop-shadow(0 0 0px transparent); }
          40%, 60%  { -webkit-text-stroke-color: var(--glow-color); filter: drop-shadow(0 0 8px var(--glow-color)); }
        }
        @keyframes pingDot      { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.8);opacity:0} }
        @keyframes spin         { to{transform:rotate(360deg)} }
        * { scrollbar-width:none; }
        *::-webkit-scrollbar { display:none; }
      `}</style>

      <GrainOverlay />
      <AuroraBackground />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-5"
        >
          <div
            className="absolute inset-[-3px] rounded-full"
            style={{ background: "conic-gradient(from 0deg, #86efac, #fcd34d, #a855f7, #86efac)", animation: "spinRing 8s linear infinite" }}
          />
          <div
            className="absolute pointer-events-none"
            style={{ inset: -14, borderRadius: "9999px", background: "radial-gradient(ellipse, rgba(134,239,172,0.15) 0%, transparent 68%)", animation: "pulseGlow 3.5s ease-in-out infinite" }}
          />
          <div className="relative rounded-full overflow-hidden" style={{ width: 100, height: 100, border: "2.5px solid #07060f", zIndex: 1 }}>
            <ImageWithFallback src={profileImg} alt="JXXMAL" className="w-full h-full object-cover" />
          </div>
        </motion.div>

        {/* Name — letter by letter */}
        <div className="mb-3">
          <AnimatedName />
        </div>

        {/* Waveform */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.5 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mb-2"
        >
          <Waveform />
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mb-3"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 900, fontSize: "clamp(0.9rem, 4vw, 1.2rem)", letterSpacing: "0.04em" }}
        >
          {[
              ["#", "rgba(240,238,255,0.25)", "rgba(240,238,255,0.9)",  "0s"],
              ["4", "rgba(206,17,38,0.45)",   "rgba(206,17,38,1)",     "0.7s"],
              ["7", "rgba(0,158,96,0.45)",    "rgba(0,158,96,1)",      "1.4s"],
              ["3", "rgba(252,209,22,0.45)",  "rgba(252,209,22,1)",    "2.1s"],
            ].map(([ch, base, glow, delay], i) => (
              <span
                key={i}
                style={{
                  WebkitTextStroke: `1px ${base}`,
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  animation: `charGlow 3s ease-in-out ${delay} infinite`,
                  ["--glow-color" as any]: glow,
                  ["--base-color" as any]: base,
                }}
              >{ch}</span>
            ))}
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.9, duration: 0.65 }}
          className="w-full mb-7"
          style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.35), rgba(134,239,172,0.28), transparent)" }}
        />

        {/* Latest YouTube video */}
        <VideoSection />

        {/* 2×2 platform grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-10">
          {PLATFORMS.map((p, i) => (
            <PlatformCard key={p.id} platform={p} index={i} />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="text-[10px] tracking-widest"
          style={{ color: "rgba(240,238,255,0.12)" }}
        >
          © 2026 JXXMAL
        </motion.p>
      </div>

      <NowPlayingBar />
    </div>
  );
}
