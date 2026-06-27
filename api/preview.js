// Returns Spotify track preview URL + metadata for a given search query.
// Uses client credentials flow (no user auth needed).
async function getClientToken(clientId, clientSecret) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600");

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query required" });

  const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

  try {
    const { access_token } = await getClientToken(CLIENT_ID, CLIENT_SECRET);
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q + " jxxmal")}&type=track&limit=1`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const data = await searchRes.json();
    const track = data.tracks?.items?.[0];
    if (!track) return res.json({ found: false });

    return res.json({
      found:       true,
      id:          track.id,
      previewUrl:  track.preview_url,
      spotifyUrl:  track.external_urls.spotify,
      albumArt:    track.album.images[0]?.url ?? null,
      title:       track.name,
      artist:      track.artists.map((a) => a.name).join(", "),
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
}