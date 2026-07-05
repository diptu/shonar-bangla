# TODO

Working checklist for [Plan.md](Plan.md). **Phases 0–8 are done.** Each phase is trimmed to
what's useful now (Phase 6 kept faithful per user decision); the rest is parked in deferred
lists with unblock conditions so nothing from Plan.md is lost. Next up: Phase 9 — Search.

## Housekeeping (do first)

- [x] Reconcile `hopeForBangladesh.md` links with actual file locations — decided: links fixed to point at existing root `&`-named files; no renames

## Phase 0 — Repository Foundation

- [x] Scaffold monorepo skeleton
  - [x] Root `package.json` with npm workspaces (`apps/*`, `packages/*`), `private: true`
  - [x] `turbo.json` with `build` / `lint` / `dev` pipeline (empty `apps/` for now — real apps arrive in Phases 1–3)
  - [x] Pin Node LTS via `.nvmrc` (24) + `engines` field
- [x] Root tooling
  - [x] Prettier — `.prettierrc` + `.prettierignore` (markdown essays excluded — prose, not code)
  - [x] ESLint flat config at root (bare `eslint.config.mjs`; plugins arrive with `apps/*`)
  - [x] Update `.gitignore` — only `.turbo/` was missing; rest already covered
- [x] Environment management (minimal)
  - [x] `.env.example` at root
  - [x] README note that `.env` is git-ignored
- [x] GitHub Actions CI
  - [x] `.github/workflows/ci.yml` — `npm ci` + `npx turbo lint build` on push/PR to `main`
  - [ ] (Optional) markdown-lint pass over the roadmap essays — skipped; add if doc links start rotting

## Phase 1 — Design System

Source of truth: [`docs/design/shonar_bangla_desing/shonar_bangla/DESIGN.md`](docs/design/shonar_bangla_desing/shonar_bangla/DESIGN.md)
— its frontmatter already defines every color/typography/radius/spacing token, so this phase is
transcription into Tailwind, not invention. Stack per README: Next.js + Tailwind v4 + shadcn/ui.

- [x] Prereq: scaffold minimal `apps/web` (Next.js 16 + TypeScript + Tailwind v4, App Router) —
      wired into turbo `build`/`lint`/`dev` automatically via workspaces
- [x] Design tokens (the actual system) — all in `apps/web/app/globals.css`
  - [x] DESIGN.md palette as Tailwind v4 `@theme` variables (shadcn semantic vars own
        primary/secondary/background: teal `#00F2FF` / gold `#FFD700` / `#10141a`), explicit radii,
        `1440px` container (`max-w-page`), gutter spacing tokens
  - [x] Fonts via `next/font`: Space Grotesk (`--font-heading`), Inter (`--font-sans`),
        Geist (`--font-data`)
  - [x] `@utility` classes for the named text styles (`headline-xl` … `label-sm`;
        `headline-lg` responsive, `label-sm` uppercase-tracked); plus `chip`
  - [x] `.glass` utility — blur(16px) + white/10 border (gradient stroke deferred to design review)
- [x] Primitives via shadcn/ui (base preset, restyled entirely through the CSS variables —
      component code stock except one neon-bloom hover class on Button):
  - [x] Button (teal fill, neon-bloom hover)
  - [x] Card (+ `.glass` treatment via className)
  - [x] Table (white/10 row borders via `--border`, `label-sm` headers)
  - [x] Input + Label (dark `#0a0e14` bg via `--input`)
  - [x] Skeleton
  - [x] Navbar (`components/navbar.tsx`, sticky glass top nav)
- [x] Theme support: dark-only — hardcoded `class="dark"` on `<html>`, tokens in `:root`
- [x] Check: `/design` demo page renders every token + primitive; `turbo lint build` green;
      compiled CSS verified to contain all custom utilities; `/` and `/design` return 200 under
      `next start`

### Phase 1 deferred

- [ ] Light theme + `next-themes` — *when DESIGN.md gets a light palette*
- [ ] Storybook — *when someone needs isolated component stories; the `/design` page covers it*
- [ ] Extract `packages/ui` — *when a second app consumes these components*
- [ ] React Hook Form + Zod — *when the first real form lands (auth, Phase 11)*
- [ ] TanStack Table — *when real data tables land (Phases 7–8); shadcn Table suffices now*

## Phase 2 — Information Architecture

No DB/backend until Phases 3–4, so IA materializes as one design doc + TypeScript domain types +
typed seed data that proves the model fits reality. Types stay in `apps/web` per the existing
rule: extract `packages/types` when the Phase 3 backend becomes a second consumer.

- [x] `docs/domain-model.md` — the design artifact
  - [x] Geography hierarchy: Country → 8 Divisions → 64 Districts, ISO 3166-2:BD codes as IDs
  - [x] Sector taxonomy mapped from the 9 roadmap essays that actually exist, reconciled against
        Plan.md's sector list (agriculture, tourism, infrastructure reserved as names, no
        indicators yet)
  - [x] Indicator model: `Indicator` + `IndicatorValue` — year-keyed rows ARE the time-series
        support
  - [x] Metadata conventions: units, sources (BBS / World Bank / IMF), geo-level applicability
- [x] TypeScript domain types in `apps/web/types/domain.ts` — `SECTORS` const + `Sector` union,
      `GeoLevel`, `Division`, `District`, `Indicator`, `IndicatorValue`
- [x] Seed geography data `apps/web/data/divisions.json` — 8 divisions + 64 districts with
      ISO codes, typed via `apps/web/lib/geography.ts` (`divisions` / `districts` exports)
- [x] Check: node script verified BD-01..BD-64 complete with no dupes; `turbo lint build` green
      with the seed typed against the model

### Phase 2 deferred

- [x] Extract `packages/types` — *done in Phase 3 as `packages/domain` (`@shonar/domain`)*
- [x] Prisma/DB schema — *done in Phase 4*
- [ ] Upazila (sub-district) level — *when a feature needs finer granularity than districts*
- [ ] Content/CMS metadata for the roadmap essays — *Phase 5 content pipeline*
- [ ] Agriculture/Tourism/Infrastructure indicator definitions — *when real data arrives
      (Phases 5/10); the taxonomy reserves the sector names now*

## Phase 3 — Backend Foundation

Trimmed hard: Plan.md lists 7 modules, but its own later phases claim most of them (DB schema is
Phase 4, Content Phase 5, Search Phase 9, Auth Phase 11). Phase 3 delivers a running NestJS API
with one real module — Geography, served from the Phase 2 seed — so Phase 4 can swap Prisma in
behind an unchanged API surface.

- [x] Extract `packages/domain` (`@shonar/domain`) — unblock condition met: the api is the second
      consumer of the domain types
  - [x] `domain.ts` + seed moved in (seed converted JSON → `divisions.ts` with `satisfies
        Division[]` — stronger check, no tsc JSON-emit quirks); old `apps/web` copies deleted;
        web's `/design` table now renders the real 8 divisions from the package
- [x] Scaffold `apps/api` — NestJS 11 + TypeScript (strict + both extra flags), wired into turbo
      via workspaces; port 3001, CORS allow-list for `localhost:3000`, global ValidationPipe,
      shutdown hooks
- [x] Geography module — thin controller + service over the seed
  - [x] `GET /geography/divisions` (districts nested)
  - [x] `GET /geography/divisions/:code` — case-insensitive, 404 on unknown code
  - [x] `GET /geography/districts` (flat 64)
  - [x] Prisma swaps into `GeographyService` internals in Phase 4; controller untouched
- [x] `GET /health` — liveness only (`@nestjs/terminus` readiness arrives with the DB)
- [x] Swagger UI at `/docs`
- [x] Check: curl smoke — health ok, 8 divisions, `bd-c` → Dhaka/13 districts, 404 on `BD-Z`,
      64 districts, `/docs` 200; `turbo lint build` green (5 tasks, 3 packages)

### Phase 3 deferred

- [x] PostgreSQL + Prisma + docker-compose — *done in Phase 4*
- [ ] Redis — *when something is measurably slow (Phase 14 performance)*
- [ ] Auth + Users modules — *Phase 11 authentication*
- [ ] Dashboard + Statistics modules — *when indicator data exists (Phases 4–6)*
- [ ] Content module — *Phase 5 content pipeline*
- [ ] Search module — *Phase 9 search*
- [x] Jest + supertest e2e — *done in Phase 4 (5 specs against the seeded DB)*

## Phase 4 — Database Design

Decided: 4 tables mirroring [`docs/domain-model.md`](docs/domain-model.md), not Plan.md's 9 schema
areas — Population/Economy/Education/Healthcare/Infrastructure/Historical are all `Indicator` +
`IndicatorValue` rows; Articles/Images wait for runtime-editable content (Phase 12). This phase
resolves four parked items: Docker (Phase 0), Prisma schema (Phase 2), Postgres+Prisma and
Jest+supertest (Phase 3).

- [x] `docker-compose.yml` at root — single `postgres:17-alpine`, volume, healthcheck; host port
      **5433** (a native Postgres on this machine owns 5432); `DATABASE_URL` in `.env.example`
- [x] Prisma **6** in `apps/api` (7 requires driver adapters + config file — machinery for later)
  - [x] Schema: `Division`, `District`, `Indicator`, `IndicatorValue` per the domain model;
        unique `(indicatorId, geoCode, year)` on values
  - [x] `init` migration committed
  - [x] Seed: `prisma db seed` → `prisma/seed.js` upserts from `@shonar/domain`, asserts 8/64
- [x] `GeographyService` internals → Prisma; controller only gained one `await`
- [x] `/health/ready` — 3-line `SELECT 1` (terminus when there's a second dependency)
- [x] First real tests: 5 supertest e2e specs against the seeded DB — all passing
- [x] Check: compose up → migrate → seed (8/64 asserted) → e2e green; `turbo lint build` green

### Phase 4 deferred

- [ ] Articles/Images tables — *Phase 12 admin portal (content is git-rendered until then)*
- [ ] Redis / pgvector / read replicas — *when something is measurably slow or vector search
      exists (Phases 9/13/14)*
- [ ] Indicator data beyond schema + a demo row — *Phase 5 seeds nothing; real datasets are
      Phase 10 ETL*

## Phase 5 — Content Pipeline

Decided: essays render from git, no DB hop — the 9 roadmap essays change via PRs, so
`Markdown → Parser → JSON → DB → API` collapses to `Markdown → apps/web at build time`.
The sector taxonomy in `@shonar/domain` becomes the content index.

- [x] Essay registry in `@shonar/domain` — `ESSAYS`: each `Sector` → essay file + display title
- [x] `/roadmap` page in `apps/web` — 9 glass cards from the registry, navbar link added
- [x] `/roadmap/[slug]` — build-time `fs` read + `generateStaticParams` (`dynamicParams: false`),
      `react-markdown` + `remark-gfm`, `prose prose-invert` via `@tailwindcss/typography` with
      heading font + teal links; `outputFileTracingRoot` set to monorepo root
- [x] `&` filenames never in URLs — slug = sector id, file resolved via registry
- [x] Check: all 9 `/roadmap/*` routes prerender (15 static pages total); essay prose and
      headings verified present in generated HTML; `turbo lint build` green

### Phase 5 deferred

- [ ] Content in Postgres + Content module in the api — *when content must be editable outside
      git (Phase 12 admin portal)*
- [ ] CSV/Excel/World Bank/IMF/UN ingestion — *Phase 10 ETL, per Plan.md itself*
- [ ] Bengali translations of essays — *when i18n lands (next-intl, README stack)*
- [ ] Search indexing of essay content — *Phase 9*

## Phase 6 — API Layer

**Decided: faithful to Plan.md** — dedicated per-sector controllers plus versioning and
pagination now (not the collapsed single-module variant). Sanity clause: all sector controllers
are thin wrappers over one shared `IndicatorsService` — faithful endpoint *surface*, no
copy-pasted internals. Search stays in Phase 9 where Plan.md itself puts it.

- [x] Seed real indicator data
  - [x] Division population, "BBS Census 2022" (8 rows, 2022, totals to ~165.2M)
  - [x] National GDP growth series, "World Bank WDI" (2015–2024, `geoCode: "BD"`)
- [x] URI versioning: `setGlobalPrefix("v1")` via shared `app.setup.ts` (used by main + e2e so
      both run the same app shape); Phase 4 specs updated
- [x] Shared `IndicatorsService` + `StatisticsController` (`/v1/statistics?sector=`, `/:id`,
      `/:id/values?geoCode=&from=&to=`)
- [x] Per-sector thin wrappers: `/v1/economy`, `/v1/education`, `/v1/healthcare` — abstract base
      class + explicit subclass constructors (param metadata isn't emitted on undecorated bases)
- [x] Validated query DTOs — sector via `@IsIn(SECTORS)`, numbers via `@Type` transform
- [x] Pagination `?limit=&offset=` (default 50, cap 200 → 400 above cap)
- [x] e2e: 11 specs total — statistics, sector filter, bounded series, economy wrapper, 400 cap,
      404 unknown indicator — all green
- [x] Check: Swagger shows all `/v1` groups; e2e green; `turbo lint build` green

### Phase 6 deferred

- [ ] Search endpoint — *Phase 9, per Plan.md's own ordering*
- [ ] Cursor pagination — *when offset pagination measurably hurts (needs >>10k rows)*
- [ ] `/v2` — *when a breaking change actually exists*

## Phase 7 — Dashboard UI

Decided: 3 pages + 1 dynamic template instead of 12 hand-built pages — the 7 sector pages share
one structure (indicators + essay link). Interactive Map and Timeline live in Phase 8 with the
viz. Dashboard pages render dynamically (`force-dynamic`) so `next build` never needs a live API.

- [x] Typed API client `apps/web/lib/api.ts` — `fetch` wrapper returning `null` on any failure,
      `API_URL` env; `ApiOffline` component renders the honest empty state
- [x] `/dashboard` — 4 KPI tiles (GDP growth 2024, population ~165.2M, 8/64), GDP line + population
      bar charts, sector chips, divisions table with per-division population
- [x] `/divisions/[code]` — division explorer: population headline + district table
- [x] `/sectors/[sector]` — ONE template for all 12 sectors: indicator cards with latest values +
      essay link; reserved sectors show "no data yet — Phase 10 ETL"
- [x] Navbar: Dashboard + Map links; sector chips on the dashboard
- [x] Check: all pages 200 with real data (Dhaka 44,215,107 verified in HTML); `API OFFLINE`
      state verified with API stopped; `turbo lint build` green

### Phase 7 deferred

- [ ] Hand-tuned per-sector layouts — *when a sector's content outgrows the shared template*
- [ ] Interactive Map page — *Phase 8 choropleth IS it*
- [ ] Timeline page — *Phase 8 time-series chart covers it until a dedicated scrubber is needed*
- [ ] Sidebar navigation — *when nav items outgrow the top bar*

## Phase 8 — Data Visualization

Decided: choropleth + line + bar — the three chart types today's data actually shapes into.
Heatmap/treemap/Sankey wait for datasets with those shapes.

- [x] Vendored GeoJSON: geoBoundaries ADM1 simplified → normalized to ISO codes + our names
      (fixed their `Rajshani`/`Chittagong`/`Barisal` labels), coords rounded — **37 KB** at
      `apps/web/data/divisions.geo.json`
- [x] Choropleth `/map`: MapLibre GL behind `next/dynamic` (`ssr: false`) with Skeleton loading;
      4 quantile classes on a lightness-monotonic teal ramp (dataviz validator run; sequential
      scope = monotonicity ✓, low-contrast steps relieved by borders/tooltip/table); hover
      tooltip, click → `/divisions/[code]`; self-contained style, no external tiles
- [x] GDP line + population-by-division bar (Recharts, single-hue marks per dataviz skill,
      animations off, tooltips on, axis text in muted ink)
- [x] a11y: `ChartFigure` wrapper — `role="img"` + `aria-label` + `sr-only` table on every chart
- [x] Check: `/map` 200 with 8 divisions; charts render seeded series; home bundle verified free
      of maplibre/recharts (script-by-script grep); `turbo lint build` green (5 tasks)

### Phase 8 deferred

- [ ] Heatmap / treemap / Sankey — *when a dataset has that shape (flows, hierarchies, matrices)*
- [ ] PMTiles / vector tiles — *8 division polygons is not a tiling problem; revisit at upazila
      level (64+ → 495 features)*
- [ ] Time-series scrubber / timeline page — *when multi-year data across many indicators lands
      (Phase 10 ETL)*
- [ ] District-level choropleth — *when district-level indicator data exists*

## Deferred until there's code

Parked from Plan.md Phase 0 — each with the condition that unblocks it:

- [ ] Husky + lint-staged + Commitlint — *when there's code worth gating; Conventional Commits are already the convention via CONTRIBUTING.md*
- [x] Docker / docker-compose dev environment — *done in Phase 4 (Postgres only; the apps run natively)*
- [ ] `packages/eslint-config` + `packages/tsconfig` shared packages — *when a second workspace package needs them*
