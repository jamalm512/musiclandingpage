# Validation — October 28, 2026

- TypeScript check and production Vite build pass.
- 33 backend tests cover signup validation, duplicates across lists, missing services, publishable/legacy key handling, previews, exact platform links, YouTube failures/cache, and approximate location. External calls in automated tests are mocked.
- Browser playback confirmed for Make A Way and Tun Up; switching tracks pauses the previous preview, and vinyl state follows real playback.
- Streaming modal shows the verified Spotify, Apple Music, Tidal, Amazon and YouTube destinations for Winning Again. Track copying and Escape focus restoration pass.
- Chrome-logo Sonic Ignition intro assembles, sweeps, bursts and reveals the page in about 3 seconds. Browser checks confirm full completion, Escape, Replay intro and once-per-visitor skipping after reload. Reduced-motion CSS and timing fallback reviewed.
- Mobile navigation opens, closes on navigation, and reaches the Journey.
- Rendered widths 320, 390, 600, 768 and 1280 report no document horizontal overflow.
- Both email forms saved the same disposable example.com address under separate sources in the live Supabase database. Database rows were verified by source, without reading subscriber addresses. Test records are cleaned up.
- Supabase migration and insert-only RLS/column privileges were independently verified.
- YouTube subscriber count loaded server-side (611 when checked); Instagram and Spotify display clearly dated 127-follower / 192-monthly-listener snapshots until authorized provider access is configured. Automatic paths are covered by provider mocks.
- New spice headline, controlled ambient effects, and motion pause button verified in-browser. The updated title fits at 320, 390, 768 and 1280 pixels with no page overflow.
- The deployed preview resolves actual Vercel approximate location headers. Shared audience-map routes validate locations and return only aggregate areas; the deployed preview stored a real Grenada-area dot and aggregate retrieval was verified.
- Supabase audience-map migration is applied; anonymous callers cannot read or insert raw map rows and only have the bounded placement/aggregate RPCs.

Physical iOS/Android hardware testing remains a follow-up; browser layout checks cannot verify device audio policies, safe-area behavior or touch feel. Deployment results are reported separately from these local checks.
