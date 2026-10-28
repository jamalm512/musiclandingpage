# Shared audience map

The world map shows accumulated, anonymous visitor areas from Supabase. It starts collecting when this version is deployed; it does not invent a history of previous visits. A persistent random browser identifier prevents ordinary reloads from adding extra visitors. Clearing browser storage or switching browsers can add another visitor, so the total is an approximate audience measure rather than a unique-person analytics report.

On page load, `/api/visitors` uses Vercel's approximate geolocation headers to add the visitor's broad area. When those headers are unavailable (including localhost), it adds nothing. “Add my location” explicitly asks for browser location permission. The browser rounds the coordinates into a 2° grid before sending them; the API and database repeat the rounding. Permission denial leaves the shared map usable. Existing dots remain visible and refresh every minute while the page is visible.

The same browser's dot can move after an opt-in location refinement or a later visit from another area. The database keeps only a SHA-256 hash of the random identifier, coarse grid coordinates, and an optional two-letter country. It does not retain an IP, exact GPS, city, email, visit timestamp, or the original browser UUID. Public map responses contain only grid coordinates and aggregate visitor counts.

## Database setup

Apply `supabase/visitor-map.sql` to the existing project `tdzidbkqieqlyuxgoydk` using the migration name `add_shared_audience_map`. The existing `SUPABASE_URL` and `SUPABASE_ANON_KEY` server configuration is sufficient; no elevated service key is needed.

`audience_locations` has RLS enabled with no direct grants or policies allowing public reads or writes. Two deliberately public, bounded RPCs provide the necessary anonymous capability:

- `jxxmal_place_audience_dot`: validates a hashed browser identifier and coordinates, re-quantizes into 2° cells, and inserts or updates exactly that identifier's row. It returns no row data.
- `jxxmal_audience_map`: accepts no filter/query parameters and returns only grouped grid coordinates and counts, capped to the maximum 16,200 world grid cells.

Both functions have an empty fixed search path and explicit execution grants to `anon`. These `SECURITY DEFINER` functions are intentional public data endpoints; individual stored rows remain inaccessible to public roles. Anonymous writes can still be fabricated by a determined client, so the map is an audience illustration, not a fraud-resistant analytics service.

## Checks

Six map endpoint tests cover coarse rounding (including poles/date line), stable hashed identity, absent geolocation, malformed input, cross-origin requests, aggregate-only responses, missing storage and upstream failure. All 33 project backend tests and TypeScript pass after the map addition. After applying the schema, verify anonymous RPC insert/update and grouped reads, then verify denied direct table access. Browser testing on a deployed HTTPS origin is needed for actual permission behavior and Vercel location headers.
