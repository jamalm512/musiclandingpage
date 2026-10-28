const SOURCES = new Set(["inner_circle", "bounce_notify"]);
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function isSameOrigin(req) {
  const origin = req.headers?.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const host = req.headers?.host;
    return !!host && parsed.host === host && ["http:", "https:"].includes(parsed.protocol);
  } catch { return false; }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Allow", "POST");
  if (req.method !== "POST") return res.status(405).json({ error: "Use the signup form to subscribe." });
  if (!isSameOrigin(req)) return res.status(403).json({ error: "Please subscribe from the JXXMAL website." });
  let body = req.body;
  if (typeof body === "string") {
    if (body.length > 4096) return res.status(413).json({ error: "Submission is too large." });
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Please check your submission." }); }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return res.status(400).json({ error: "Please enter your email address." });
  // Bots fill this hidden field. Do not store their submission or reveal the check.
  if (typeof body.website === "string" && body.website.trim()) return res.json({ success: true });
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const source = body.source ?? "inner_circle";
  if (email.length > 254 || !EMAIL.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
  if (!SOURCES.has(source)) return res.status(400).json({ error: "Please choose a valid signup list." });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return res.status(503).json({ error: "Signups are temporarily unavailable. Please try again soon." });
  let endpoint;
  try {
    endpoint = new URL("/rest/v1/subscribers", url);
    if (endpoint.protocol !== "https:") throw new Error("Invalid Supabase URL");
  } catch { return res.status(503).json({ error: "Signups are temporarily unavailable. Please try again soon." }); }
  try {
    const headers = { "Content-Type": "application/json", apikey: key, Prefer: "return=minimal" };
    // Publishable keys are opaque API keys, not JWTs. Sending one as a Bearer
    // token causes JWT validation errors; legacy anon JWTs still need that header.
    if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) {
      headers.Authorization = `Bearer ${key}`;
    }
    const response = await fetch(endpoint, {
      method: "POST", signal: AbortSignal.timeout(8000),
      headers,
      body: JSON.stringify({ email, source }),
    });
    if (response.ok) return res.json({ success: true });
    // Only this list-specific unique key confirms an existing signup. A legacy
    // email-only key could otherwise falsely report joining a different list.
    const details = await response.json().catch(() => ({}));
    const listDuplicate = typeof details.message === "string" && /"subscribers_email_source_(?:unique|key)"/.test(details.message);
    if (response.status === 409 && details.code === "23505" && listDuplicate) return res.json({ success: true });
    if (response.status === 429) return res.status(429).json({ error: "Please wait a moment before trying again." });
    return res.status(502).json({ error: "We couldn't save your signup. Please try again soon." });
  } catch { return res.status(503).json({ error: "We couldn't reach the signup service. Please try again soon." }); }
}
