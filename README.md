# ShiftForge

A car-modding community app modeled on the ModsNation product experience: a **3D Mods Lab** configurator with real wheel-fitment math, a community builds gallery, an Owner's Club for real cars, weekly Ratings with voting, a parts marketplace, fitment search, build journals, events map, shops and auctions.

## Stack

- Next.js 16 (App Router, server rendering + route handlers), React 19, TypeScript
- `node:sqlite` (built into Node ≥ 22.13) — schema auto-migrates and seeds on first boot into `data/shiftforge.db`
- Three.js procedural car/wheel renderer driven by `src/lib/fitment.ts`
- Email/password auth (scrypt, httpOnly session cookies, origin-checked mutations, rate-limited sign-in, reset tokens)
- Uploads stored under `data/uploads`, validated by magic bytes, served from `/media/*`
- AI renders via Puter in the browser (user signs in with their own Puter account)

## Run

```bash
npm install
npm run dev
```

Demo account: `demo@shiftforge.dev` / `shiftforge-demo`.

Environment (all optional): `DATA_DIR`, `DATABASE_PATH`, `SITE_URL`.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Seed thumbnails

Seeded builds and owner cars get thumbnails rendered by the real 3D engine:

```bash
ALLOW_SEED_RENDER=1 npm run dev -- --port 3217
node scripts/render-seed-images.mjs http://localhost:3217
```

Then delete `data/` so the database reseeds with the images.

Locally supplied `.glb` models go in `public/models/` (gitignored, not redistributed).

Fitment readouts are planning estimates, not engineering validation.
