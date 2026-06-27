const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

async function getAccessToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: REFRESH_TOKEN }),
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  try {
    const { access_token } = await getAccessToken();
    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (response.status === 204 || response.status > 400) return res.json({ isPlaying: false });
    const song = await response.json();
    if (!song?.item) return res.json({ isPlaying: false });
    return res.json({
      isPlaying: song.is_playing,
      title:     song.item.name,
      artist:    song.item.artists.map((a) => a.name).join(", "),
      albumArt:  song.item.album.images[0]?.url ?? null,
      albumName: song.item.album.name,
      songUrl:   song.item.external_urls.spotify,
      duration:  song.item.duration_ms,
      progress:  song.progress_ms,
    });
  } catch { return res.json({ isPlaying: false }); }
}