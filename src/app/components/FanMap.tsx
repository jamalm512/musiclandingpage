import { useCallback, useEffect, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { LocateFixed } from "lucide-react";
import world from "world-atlas/countries-110m.json";
import "./components-feature.css";

type Point = { coordinates: [number, number]; visitors: number };
type Audience = { available: boolean; points: Point[]; totalVisitors: number };
const GRENADA: [number, number] = [-61.68, 12.12];
const VISITOR_KEY = "jxxmal_map_visitor";
const requestSignal = (signal?: AbortSignal) => signal ? AbortSignal.any([signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000);
const bucket = (number: number, max: number) => Math.min(max - 1, Math.floor((number + max) / 2) * 2 - max + 1);
function coordinates(value: unknown): [number, number] | null {
  return Array.isArray(value) && value.length === 2 && value.every((n) => typeof n === "number" && Number.isFinite(n)) && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90 ? [value[0], value[1]] : null;
}
function visitorId() {
  try {
    const previous = localStorage.getItem(VISITOR_KEY);
    if (previous && /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(previous)) return previous;
    const value = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, value); return value;
  } catch { return crypto.randomUUID(); }
}
function parseAudience(data: unknown): Audience | null {
  if (!data || typeof data !== "object") return null;
  const value = data as Record<string, unknown>;
  if (value.available !== true || !Array.isArray(value.points)) return null;
  const points = value.points.flatMap((point: Point) => {
    const location = coordinates(point?.coordinates);
    return location && Number.isSafeInteger(point.visitors) && point.visitors > 0 ? [{ coordinates: location, visitors: point.visitors }] : [];
  });
  return { available: true, points, totalVisitors: points.reduce((sum, point) => sum + point.visitors, 0) };
}

export default function FanMap() {
  const [audience, setAudience] = useState<Audience | null>(null);
  const [visitor, setVisitor] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("");
  const identity = useRef<string | null>(null);
  const mounted = useRef(true);
  const map = useRef<HTMLDivElement>(null);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch('/api/visitors', { signal: requestSignal(signal) });
    if (!response.ok) throw new Error();
    const value = parseAudience(await response.json());
    if (!value) throw new Error();
    if (mounted.current) setAudience(value);
  }, []);
  const place = useCallback(async (point?: [number, number], signal?: AbortSignal) => {
    identity.current ??= visitorId();
    const body = point
      ? { visitorId: identity.current, locationSource: 'browser', longitude: bucket(point[0], 180), latitude: bucket(point[1], 90) }
      : { visitorId: identity.current, locationSource: 'approximate' };
    const response = await fetch('/api/visitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: requestSignal(signal) });
    if (!response.ok) throw new Error();
    const data = await response.json();
    const saved = coordinates(data.coordinates);
    if (mounted.current && data.recorded === true && saved) setVisitor(saved);
    return data.recorded === true;
  }, []);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    // Vercel's approximate area adds an anonymous dot without a GPS prompt.
    void (async () => {
      try { await place(undefined, controller.signal); } catch { /* Reading the shared map can still work. */ }
      try { await refresh(controller.signal); } catch { /* The map explains unavailable storage without inventing visitors. */ }
      finally { if (mounted.current) setLoading(false); }
    })();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(controller.signal).catch(() => {}); }, 60000);
    const visible = () => { if (!document.hidden) void refresh(controller.signal).catch(() => {}); };
    document.addEventListener('visibilitychange', visible);
    return () => { mounted.current = false; controller.abort(); window.clearInterval(interval); document.removeEventListener('visibilitychange', visible); };
  }, [place, refresh]);
  useEffect(() => {
    const element = map.current;
    if (!element) return;
    let visible = false;
    const update = () => { element.dataset.motion = visible && !document.hidden ? 'playing' : 'paused'; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(element); document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  const shareLocation = () => {
    if (!navigator.geolocation) { setMessage('Location sharing is not supported in this browser. Your approximate area may still appear.'); return; }
    setSharing(true); setMessage('Your browser will ask to share your location. Only a broad area is added to the map.');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      if (!mounted.current) return;
      try {
        await place([coords.longitude, coords.latitude]);
        await refresh();
        if (mounted.current) setMessage('Your dot is on the map. Only your broad area was shared.');
      } catch { if (mounted.current) setMessage('We couldn’t save your dot right now. Please try again soon.'); }
      finally { if (mounted.current) setSharing(false); }
    }, (error) => {
      if (!mounted.current) return;
      setSharing(false);
      setMessage(error.code === 1 ? 'Location access is off. You can enable it in your browser settings; the shared map still works.' : 'Your location couldn’t be found. Please try again.');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  };
  const total = audience?.totalVisitors ?? 0;
  const format = new Intl.NumberFormat('en');
  return <div className="fan-map" ref={map} data-motion="paused">
    <div className="fan-map__overview"><p><strong>{audience ? format.format(total) : '—'}</strong><span>mapped visitors</span></p><p><strong>{audience ? format.format(audience.points.length) : '—'}</strong><span>corners of the world</span></p><span className="fan-map__privacy">Different places. One frequency.</span></div>
    <div className="fan-map__surface"><ComposableMap width={800} height={380} projection="geoEqualEarth" projectionConfig={{ scale: 145, center: [0, 8] }} role="img" aria-label={`World map of JXXMAL listeners${audience ? ` with ${total} mapped visitors across ${audience.points.length} approximate areas` : ''}.`} className="fan-map__svg">
      <Geographies geography={world}>{({ geographies }: { geographies: Array<{ rsmKey: string; properties: Record<string, unknown> }> }) => geographies.map((geography) => <Geography key={geography.rsmKey} geography={geography} fill="#252825" stroke="#0b0c0c" strokeWidth={0.7} tabIndex={-1} style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }} />)}</Geographies>
      {audience?.points.map((point) => <Marker key={point.coordinates.join(':')} coordinates={point.coordinates}><title>{format.format(point.visitors)} mapped {point.visitors === 1 ? 'visitor' : 'visitors'} in this broad area</title><circle r={Math.min(10, 3 + Math.log2(point.visitors + 1))} fill="#a5b991" opacity={.18} /><circle r={Math.min(5, 1.8 + Math.log2(point.visitors + 1) / 2)} fill="#a5b991" opacity={.85} /></Marker>)}
      <Marker coordinates={GRENADA}><circle r={11} fill="#d7ff3f" opacity={0.12} /><circle r={4} fill="#d7ff3f" stroke="#0b0c0c" strokeWidth={1.5} /><text x={10} y={-11} className="fan-map__origin-label">GRENADA</text></Marker>
      {visitor && <Marker coordinates={visitor}><circle r={12} className="fan-map__pulse" fill="none" stroke="#f4f2ea" strokeWidth={1} /><circle r={4} fill="#f4f2ea" stroke="#0b0c0c" strokeWidth={1.5} /></Marker>}
    </ComposableMap></div>
    <div className="fan-map__caption"><div className="fan-map__legend"><span><i className="fan-map__key fan-map__key--home" /> Artist’s home</span><span><i className="fan-map__key fan-map__key--audience" /> The audience</span>{visitor && <span><i className="fan-map__key fan-map__key--visitor" /> Your broad area</span>}</div><p>{loading ? 'Connecting the corners of the world…' : audience ? total ? 'An audience that keeps growing. Dots combine anonymous visits into broad areas.' : 'The first dots are yet to arrive. Add yours to start the story.' : 'The shared map is temporarily unavailable. Your music is still here.'}</p></div>
    <div className="fan-map__share"><div><p>Add your corner of the world.</p><span>We use an approximate area where available. Choose to share your location for a better match. Exact coordinates are never sent or saved.</span></div><button type="button" onClick={shareLocation} disabled={sharing}><LocateFixed size={16} />{sharing ? 'Finding your area…' : 'Add my location'}</button></div>
    <p className="fan-map__message" role="status">{message}</p>
  </div>;
}
