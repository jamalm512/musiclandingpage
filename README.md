# JXXMAL Music

Official artist website for https://jxxmalmusik.com, built with React, Vite, Motion and Vercel functions.

The shared release catalogue is `src/data/releases.json`. Update song links, artwork, preview clips and release metadata there. YouTube subscribers update through the server-side `/api/platforms` route. Instagram followers and Spotify monthly listeners are maintained manually in `src/data/platform-snapshots.json` from the artist's updates, with a visible update date. No Instagram or Soundcharts authorization is needed. See `DEPLOYMENT.md` for the update workflow.

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
