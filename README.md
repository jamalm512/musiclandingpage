# JXXMAL Music

Official artist website for https://jxxmalmusik.com, built with React, Vite, Motion and Vercel functions.

The shared release catalogue is `src/data/releases.json`. Update song links, artwork, preview clips and release metadata there. Platform counts use the server-side `/api/platforms` route. Instagram can update after Meta authorization; Spotify monthly listeners can update with Soundcharts production API access. Verified dated fallback counts are maintained in `src/data/platform-snapshots.json`. See `DEPLOYMENT.md` for activation and token renewal.

## Develop

Use Node.js 22 or newer and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The local server includes `/api/*`; a bare Vite server does not. Copy `.env.example` to `.env.local` and set the required values for local service access. Never commit populated environment files.

```sh
pnpm typecheck
pnpm build
pnpm test
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel/Supabase setup and [CATALOG-SOURCES.md](CATALOG-SOURCES.md) for verified music/artwork provenance.
