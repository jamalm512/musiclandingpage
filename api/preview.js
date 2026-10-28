import releases from "../src/data/releases.json" with { type: "json" };

const ARTIST_ID = "0pYbVdhffwzvHfEBdeFEUC";
const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function safePreview(value) {
  if (typeof value !== "string") return null;
  if (/^\/audio\/[a-z0-9/_-]+\.(mp3|m4a|ogg|wav)$/i.test(value) && !value.includes("..")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["audio-ssl.itunes.apple.com", "p.scdn.co"].includes(url.hostname) ? url.href : null;
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader("Allow", "GET");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });
  const query = req.query?.track ?? req.query?.id ?? req.query?.q;
  if (typeof query !== "string" || query.length > 100) return res.status(400).json({ error: "Choose a JXXMAL release." });
  const release = releases.find((track) => normalize(track.id) === normalize(query) || normalize(track.title) === normalize(query));
  if (!release) return res.status(404).json({ found: false, previewUrl: null, error: "Release not found." });
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  const response = {
    found: true, id: release.id, title: release.title, artist: "JXXMAL",
    previewUrl: safePreview(release.previewUrl), previewProvider: release.previewProvider || null,
    spotifyUrl: release.spotifyUrl || null, appleMusicUrl: release.appleMusicUrl || null,
    albumArt: release.artwork,
  };
  // Artist-owned clips and verified catalog previews work without Spotify account
  // authorization. Spotify's preview_url is deprecated and may legitimately be null.
  if (response.previewUrl) return res.json(response);
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const id = release.spotifyUrl?.match(/^https:\/\/open\.spotify\.com\/track\/([A-Za-z0-9]{22})(?:\?|$)/)?.[1];
  if (!clientId || !clientSecret || !id) return res.json(response);
  try {
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST", signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64") },
      body: "grant_type=client_credentials",
    });
    if (!tokenResponse.ok) return res.json(response);
    const { access_token } = await tokenResponse.json();
    if (!access_token) return res.json(response);
    const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${id}?market=US`, {
      signal: AbortSignal.timeout(5000), headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!trackResponse.ok) return res.json(response);
    const track = await trackResponse.json();
    if (track.id !== id || !track.artists?.some((artist) => artist.id === ARTIST_ID)) return res.json(response);
    return res.json({ ...response, previewUrl: safePreview(track.preview_url), previewProvider: track.preview_url ? "Spotify" : null });
  } catch { return res.json(response); }
}
