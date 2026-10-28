import releases from "../src/data/releases.json" with { type: "json" };

function spotifyId(value) {
  if (typeof value !== "string" || value.length > 300) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com" || url.username || url.password || url.port) return null;
    return url.pathname.match(/^\/track\/([A-Za-z0-9]{22})\/?$/)?.[1] || null;
  } catch { return null; }
}

export default function handler(req, res) {
  res.setHeader("Allow", "GET");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });
  const release = typeof req.query?.track === "string" ? releases.find((track) => track.id === req.query.track) : null;
  const id = spotifyId(release?.spotifyUrl || req.query?.url);
  if (!id) return res.status(400).json({ error: "An individual Spotify track link is required." });
  const match = release || releases.find((track) => spotifyId(track.spotifyUrl) === id);
  const links = { spotify: `https://open.spotify.com/track/${id}` };
  if (match?.appleMusicUrl?.startsWith("https://music.apple.com/")) links.appleMusic = match.appleMusicUrl;
  if (/^https:\/\/listen\.tidal\.com\/track\/\d+$/.test(match?.tidalUrl || "")) links.tidal = match.tidalUrl;
  if (match?.amazonMusicUrl?.startsWith("https://music.amazon.com/")) links.amazonMusic = match.amazonMusicUrl;
  if (/^[\w-]{11}$/.test(match?.youtubeId || "")) links.youtube = `https://www.youtube.com/watch?v=${match.youtubeId}`;
  res.setHeader("Cache-Control", "public, s-maxage=86400");
  // The Odesli public API retired July 31, 2026. Its public song.link pages
  // continue to work. Keep direct, verified catalog links and offer the landing
  // page for other services rather than inventing matches or calling a dead API.
  return res.json({ pageUrl: `https://song.link/s/${id}`, links, source: "verified-catalog", resolutionAvailable: false });
}
