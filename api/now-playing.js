// Kept for existing bookmarks; never contacts a Spotify account or powers the UI.
export default function handler(_req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(410).json({ isPlaying: false, error: "Now playing is no longer part of this website." });
}
