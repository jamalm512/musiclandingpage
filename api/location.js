function value(req, name) {
  const header = req.headers?.[name];
  return typeof header === "string" ? header : null;
}

export default function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Vary", "x-vercel-ip-latitude, x-vercel-ip-longitude, x-vercel-ip-city, x-vercel-ip-country");
  res.setHeader("Allow", "GET");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });
  const rawLatitude = value(req, "x-vercel-ip-latitude");
  const rawLongitude = value(req, "x-vercel-ip-longitude");
  const latitude = rawLatitude == null || rawLatitude.trim() === "" ? NaN : Number(rawLatitude);
  const longitude = rawLongitude == null || rawLongitude.trim() === "" ? NaN : Number(rawLongitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return res.json({ available: false, coordinates: null, latitude: null, longitude: null, city: null, country: null, approximate: true });
  }
  // City-level Vercel headers, not GPS. No location or IP is stored or logged.
  const lat = Math.round(latitude * 10) / 10;
  const lng = Math.round(longitude * 10) / 10;
  const rawCity = value(req, "x-vercel-ip-city");
  let city = rawCity;
  try { if (rawCity) city = decodeURIComponent(rawCity); } catch { city = null; }
  const rawCountry = value(req, "x-vercel-ip-country");
  const country = /^[A-Z]{2}$/.test(rawCountry || "") ? rawCountry : null;
  return res.json({ available: true, coordinates: [lng, lat], latitude: lat, longitude: lng, city, country, approximate: true });
}
