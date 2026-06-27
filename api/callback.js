export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.send("<h2>No code found.</h2>");

  const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const proto         = req.headers["x-forwarded-proto"] ?? "https";
  const host          = req.headers.host;
  const REDIRECT_URI  = `${proto}://${host}/api/callback`;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }),
  });

  const data = await response.json();

  if (data.refresh_token) {
    return res.send(`
      <html><body style="font-family:monospace;padding:32px;background:#07060f;color:#f0eeff">
        <h2 style="color:#a855f7">Authorization successful!</h2>
        <p>Add this as <strong>SPOTIFY_REFRESH_TOKEN</strong> in Vercel Environment Variables:</p>
        <pre style="background:#1a1830;padding:16px;border-radius:8px;word-break:break-all;color:#86efac">${data.refresh_token}</pre>
      </body></html>
    `);
  }

  return res.send(`<pre>${JSON.stringify(data, null, 2)}</pre>`);
}