# JXXMAL website: Vercel deployment

This project remains a React + Vite website with Vercel Node.js API routes. Keep `jxxmalmusik.com` attached to the existing Vercel project and retain the `jamalm512/musiclandingpage` GitHub integration. No hosting migration is required.

## Environment and build

Use Node.js 22 or newer (24 recommended). The API modules use supported JSON import attributes. Install with the checked-in lockfile and run the project's build command. Vercel should use the Vite preset and `dist` output directory. For a full local session including `/api/*`, use `vercel dev`; a bare Vite server needs the repository's API development adapter.

Set these server-side variables in Vercel for the environments you deploy to:

| Variable | Purpose | Required |
| --- | --- | --- |
| `SUPABASE_URL` | `https://tdzidbkqieqlyuxgoydk.supabase.co` | Email signups |
| `SUPABASE_ANON_KEY` | Project's anonymous/publishable API key | Email signups |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | Live subscriber count and latest uploads |
| `YOUTUBE_CHANNEL_HANDLE` | `JXXMALMUSIK` (default) | Optional override |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID | Optional preview fallback |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret | Optional preview fallback |

`SUPABASE_ANON_KEY` accepts either the existing legacy anon JWT or a new `sb_publishable_...` key under the same variable name. The API always sends the `apikey` header; it adds `Authorization: Bearer` only for JWT-shaped legacy keys. A publishable key must not be sent as a JWT. Use the low-privilege anon/publishable key, not a service-role or secret key.

Keep secrets out of source control and browser code; do not prefix them with `VITE_`. `SPOTIFY_REFRESH_TOKEN` is no longer used: the public site does not access the artist's Spotify account or expose a now-playing panel. `/api/callback` and `/api/now-playing` are inert 410 responses. Create a replacement YouTube key if the previously browser-embedded key needs rotation, and restrict the new key to YouTube Data API v3.

## Email storage

Supabase access was verified against project `tdzidbkqieqlyuxgoydk` (Music Landing Page, active, PostgreSQL 17). The read-only audit on October 27, 2026 found `public.subscribers` with UUID `id`, required `email` and `source`, a default `source` of `inner_circle`, and `created_at` defaulting to `now()`. It had zero rows and zero normalized duplicates. RLS was enabled, but the existing `Allow anonymous inserts` policy allowed unrestricted inserts and both public client roles held broad table privileges. The old `subscribers_email_key` constraint allowed each email to join only one list. No subscriber addresses or keys were retrieved for this audit.

The reviewed `supabase/schema.sql` was applied on October 27, 2026 as migration `support_separate_jxxmal_signup_lists`; Supabase returned success. Independent read-only verification confirmed the unique index `subscribers_email_source_unique` on `(lower(btrim(email)), source)`, removal of the legacy email-only constraint, RLS enabled, and the sole `Website signup insert` policy restricted to validated anonymous inserts. The only public-client grants are anonymous INSERT on `email` and `source`; effective SELECT, UPDATE, DELETE, and TRUNCATE access are false for both anonymous and authenticated roles. The row count remained zero immediately after migration. No subscriber rows were updated or deleted.

The schema uses one atomic DO statement without explicit BEGIN/COMMIT, creates the table when missing, and builds the composite unique index before removing the old constraint. If unexpected duplicates prevent that index from being built, the statement fails without dropping existing protection. Existing column defaults and nullability are preserved. Reapplying the schema safely produces the same result. No explicit column grants or incoming foreign keys were found in the pre-migration audit.

`POST /api/subscribe` accepts `{email, source, website?}`. `source` is `inner_circle` or `bounce_notify`; `website` is a honeypot field that visitors should leave empty. The route normalizes email, rejects invalid submissions and unexpected browser origins, and returns success only after Supabase accepts the insert or confirms an existing unique-key signup. Missing configuration, permission failures, timeouts, and rate limits return a visible retryable failure rather than a false success. The honeypot intentionally returns a generic success without storing suspected bot submissions.

No real subscriber data was written during automated verification. After configuration, submit a disposable address on a Vercel preview deployment, verify its row appears in Supabase for each source, check duplicate behavior, and remove that test row through your normal database workflow. Configure Vercel Firewall rate limiting if signup abuse becomes a problem; a per-process counter would not reliably protect a stateless deployment.

Saving addresses does not itself send email. A release announcement/newsletter sender still needs to be selected and connected before automatic notifications can be sent.

## Platform counts

`GET /api/platforms` fetches YouTube subscribers and recent uploads on the server, cached for 15 minutes. The public response contains counts, source, date and availability, never credentials. If YouTube fails, a recent cached result can be used for up to 24 hours with `stale: true`; otherwise its count becomes unavailable.

Instagram followers and Spotify monthly listeners are maintained manually at the artist's request. The current values are **245 Instagram followers** and **192 Spotify monthly listeners**, supplied October 28, 2026. Both the frontend and API read `src/data/platform-snapshots.json`; neither Meta nor Soundcharts credentials are required or used, even if old credentials remain configured.

When the artist supplies new counts, update the relevant number and `updatedAt` date in that JSON file, keep `source` as `artist-provided`, then build and deploy. Confirm the tiles and `/api/platforms` show the supplied values with `automatic: false`. YouTube remains automatic.

## Release catalog and audio

`src/data/releases.json` is the shared source of truth used by the UI and `/api/preview`. It contains verified individual Spotify links and Apple Music links for all five current releases. Update that file when a release changes. `Winning Again` is labelled Dancehall as requested.

The site streams the verified Apple catalog preview URLs and links back to Apple Music. It does not download, rehost, or rip streaming-service audio. Spotify marks its `preview_url` field deprecated and nullable, so the site does not depend on that field for basic playback. Optional Spotify credentials enable a fallback lookup by the exact hardcoded track ID, with the JXXMAL artist ID checked before accepting its result. No fuzzy title search is used.

To use your own clips, put the authorized MP3/M4A/OGG/WAV files in `public/audio/`, set each `previewUrl` to `/audio/<filename>`, and change `previewProvider` to `JXXMAL`. Test playback on desktop and a physical phone: browsers require a real tap/click before audio begins. Only one release preview should play at a time, vinyl rotation should match actual playback, and closing the card should stop its preview.

## Streaming links and Odesli

The public Odesli `v1-alpha.1` API retired on July 31, 2026. Its public `song.link` landing pages remain available. The website therefore uses verified direct Spotify/Apple Music links plus an all-platforms `song.link` link, without making runtime calls to the retired API. `/api/links` returns this honest catalog response with `resolutionAvailable: false`.

The three originally requested singles have Tidal and Amazon Music links verified from their public Songlink pages as well as the separately verified Spotify/Apple links. Other services only appear when a verified destination exists; the website does not invent a Tidal track ID or label a search result as a verified match. A visitor chooses their platform and adds the track within that service; the site does not claim to modify an account's playlist automatically.

## Location and privacy

The shared audience map uses `GET/POST /api/visitors` and the dedicated `supabase/visitor-map.sql` migration. It accumulates coarse visitor areas using Vercel geolocation and offers an explicit browser location-permission button. Exact GPS coordinates are rounded before transmission; public responses show only combined 2° grid cells. See [AUDIENCE-MAP.md](AUDIENCE-MAP.md) for storage, permissions and verification. The older `GET /api/location` endpoint remains available but is no longer used by the map.

## Verification

Run `node --test tests/backend.test.mjs` for isolated route checks. All external calls in those tests are mocked; the tests never contact production Supabase or publish data. After deploying a Vercel preview, verify:

- Intro skips correctly on later visits, with a visible skip option.
- Release preview, pause/stop behavior, keyboard card controls, and modal focus/escape.
- Signup failure and success states against the configured database.
- YouTube count loads without exposing its API key in the client bundle.
- Share/copy fallback, map unavailable state, and all release/platform destinations.
- Narrow layouts, keyboard navigation, reduced-motion preference, and a physical iOS/Android device.

Publish through the existing Vercel deployment workflow after verifying the release checks and deployed routes. Supabase authentication and the applied schema are confirmed. Vercel authorization for the existing `musiclandingpage` project and `jxxmal` team has been granted. Record the verified deployment URL and any outstanding provider authorization in `VALIDATION.md`.

## Primary integration references

- [Vercel geolocation headers](https://vercel.com/kb/guide/geo-ip-headers-geolocation-vercel-functions)
- [YouTube channels lookup by handle](https://developers.google.com/youtube/data/reference/rest/v3/channels/list)
- [YouTube uploads playlist items](https://developers.google.com/youtube/data/reference/rest/v3/playlistItems/list)
- [Spotify artist API response fields](https://developer.spotify.com/documentation/web-api/reference/get-an-artist)
- [Spotify track reference: nullable/deprecated preview URL](https://developer.spotify.com/documentation/web-api/reference/get-track)
- [Songlink/Odesli API deprecation notice](https://linktree.notion.site/API-d0ebe08a5e304a55928405eb682f6741)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase new API key migration and headers](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)

## Local development

Run `pnpm install --frozen-lockfile`, then `pnpm dev` with Node.js 22 or newer. The included development adapter serves Vite and the Vercel API handlers together. `pnpm typecheck`, `pnpm build`, and `pnpm test` are the release checks. `pnpm dev` also provides a local-only responsive inspection page at `/__responsive?width=390`; this page is not deployed.
