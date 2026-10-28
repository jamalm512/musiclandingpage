import { createHash } from 'node:crypto';

const UUID = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;
const bucket = (number, max) => Math.min(max - 1, Math.floor((number + max) / 2) * 2 - max + 1);
const number = (value) => typeof value === 'number' && Number.isFinite(value) ? value : NaN;
function headers(key) {
  const result = { apikey: key, 'Content-Type': 'application/json' };
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) result.Authorization = `Bearer ${key}`;
  return result;
}
function sameOrigin(req) {
  if (!req.headers?.origin) return true;
  try { const url = new URL(req.headers.origin); return ['https:', 'http:'].includes(url.protocol) && url.host === req.headers.host; } catch { return false; }
}
function approximate(req, body) {
  const browser = body.locationSource === 'browser';
  const rawLat = browser ? body.latitude : req.headers?.['x-vercel-ip-latitude'];
  const rawLng = browser ? body.longitude : req.headers?.['x-vercel-ip-longitude'];
  const lat = browser ? number(rawLat) : typeof rawLat === 'string' && rawLat.trim() ? Number(rawLat) : NaN;
  const lng = browser ? number(rawLng) : typeof rawLng === 'string' && rawLng.trim() ? Number(rawLng) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const country = req.headers?.['x-vercel-ip-country'];
  return { latitude: bucket(lat, 90), longitude: bucket(lng, 180), country: typeof country === 'string' && /^[A-Z]{2}$/.test(country) ? country : null };
}

export default async function handler(req, res) {
  res.setHeader('Allow', 'GET, POST');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', req.method === 'GET' ? 'public, s-maxage=60, stale-while-revalidate=120' : 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed.' });
  if (req.method === 'POST' && !sameOrigin(req)) return res.status(403).json({ error: 'Please add your dot from the JXXMAL website.' });
  const key = process.env.SUPABASE_ANON_KEY?.trim();
  let base;
  try { base = new URL(process.env.SUPABASE_URL); if (base.protocol !== 'https:' || !key) throw new Error(); }
  catch { return res.status(503).json({ available: false, error: 'The shared map is temporarily unavailable.' }); }
  const requestHeaders = headers(key);
  try {
    if (req.method === 'GET') {
      const response = await fetch(new URL('/rest/v1/rpc/jxxmal_audience_map', base), { method: 'POST', headers: requestHeaders, body: '{}', signal: AbortSignal.timeout(7000) });
      if (!response.ok) throw new Error();
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error();
      const points = rows.slice(0, 16200).flatMap((row) => {
        const latitude = Number(row.latitude), longitude = Number(row.longitude), visitors = Number(row.visitors);
        return Number.isInteger(latitude) && Math.abs(latitude) < 90 && Number.isInteger(longitude) && Math.abs(longitude) < 180 && Number.isSafeInteger(visitors) && visitors > 0
          ? [{ coordinates: [longitude, latitude], visitors }] : [];
      });
      return res.json({ available: true, points, totalVisitors: points.reduce((total, point) => total + point.visitors, 0), approximate: true });
    }
    let body = req.body;
    if (typeof body === 'string') {
      if (body.length > 1024) return res.status(413).json({ error: 'Submission is too large.' });
      try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid map request.' }); }
    }
    if (!body || typeof body !== 'object' || Array.isArray(body) || !UUID.test(body.visitorId || '') || !['approximate', 'browser'].includes(body.locationSource)) return res.status(400).json({ error: 'Invalid map request.' });
    const point = approximate(req, body);
    if (!point) return res.json({ available: false, recorded: false, coordinates: null });
    const visitor_hash = createHash('sha256').update(body.visitorId.toLowerCase()).digest('hex');
    const response = await fetch(new URL('/rest/v1/rpc/jxxmal_place_audience_dot', base), {
      method: 'POST', headers: requestHeaders,
      body: JSON.stringify({ p_visitor_hash: visitor_hash, p_latitude: point.latitude, p_longitude: point.longitude, p_country: point.country }),
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error();
    return res.json({ available: true, recorded: true, coordinates: [point.longitude, point.latitude], approximate: true });
  } catch { return res.status(503).json({ available: false, error: 'The shared map is temporarily unavailable. Please try again soon.' }); }
}
