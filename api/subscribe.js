// Stores subscriber emails in Supabase.
// source: "inner_circle" or "bounce_notify"
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, source = "inner_circle" } = req.body ?? {};
  if (!email) return res.status(400).json({ error: "Email required" });

  const SUPABASE_URL     = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ email, source }),
    });

    // 409 = already subscribed — treat as success
    if (response.ok || response.status === 409) {
      return res.json({ success: true });
    }

    const err = await response.json().catch(() => ({}));
    return res.status(400).json({ error: err.message ?? "Subscription failed" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
}