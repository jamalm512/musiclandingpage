// Public account authorization is not needed for this artist site. Keep the old
// route inert instead of returning account credentials in a browser response.
export default function handler(_req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(410).json({ error: "Spotify account authorization is no longer used by this website." });
}
