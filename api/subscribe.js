export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: "Email required" });
  try {
    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${process.env.BEEHIIV_PUBLICATION_ID}/subscriptions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.BEEHIIV_API_KEY}` },
        body: JSON.stringify({ email, utm_source: "jxxmal-website" }),
      }
    );
    return res.json(response.ok ? { success: true } : { error: "Failed" });
  } catch { return res.status(500).json({ error: "Server error" }); }
}