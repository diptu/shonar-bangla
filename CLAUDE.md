# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Shonar Bangla is two things layered on top of each other right now:

1. **A set of policy/roadmap essays** (root-level `*.md` files) describing a proposed ten-year development
   plan for Bangladesh — economic, climate, education, digital governance, healthcare, military, environment,
   energy, and divisional-restructuring topics. These are the actual content/product of the repo today.
2. **An early-stage dashboard app scaffold** (`frontend/`) intended to eventually visualize this roadmap data
   geospatially. It is currently the unmodified Vite + React + TypeScript template — no roadmap data is wired
   up yet, and `backend/` exists as an empty directory with no code.

Don't assume the app already reflects the roadmap content — treat `frontend/` as a fresh scaffold to build out,
not a working product.

## Architecture mismatch to be aware of

`README.md` describes an aspirational stack (Next.js + NestJS + MongoDB + Prisma + Leaflet, monorepo with
`app/client`, `app/server`, `packages/database`). None of that exists yet. The actual current scaffold is:

- `frontend/` — Vite + React 19 + TypeScript, using Oxlint (not ESLint) for linting. No routing, state
  management, or map library is installed yet.
- `backend/` — empty.

When asked to build backend or frontend features, confirm with the user whether to follow the README's stated
stack or the actually-installed scaffold before introducing a new framework — do not assume the README is
current.

## Commands

All app commands run from `frontend/`:

```bash
cd frontend
npm install       # install deps
npm run dev       # start Vite dev server
npm run build     # tsc -b (project references) + vite build
npm run lint      # oxlint
npm run preview   # preview a production build
```

There is no test runner configured yet. There are no commands to run at the repo root — root only contains
markdown content plus `docs/` and the `frontend/`/`backend/` app directories.

## Content structure

- Root `*.md` files are the roadmap documents, e.g. `EconomicDiversification.md`, `EnergySecurity.md`,
  `Healthcare&SocialWelfare.md`, `DivisionalModels.md`. `hopeForBangladesh.md` is the narrative index that links
  to them.
- **Known inconsistency**: `hopeForBangladesh.md` links to these files under a `plans/` subdirectory with
  "And"-joined names (e.g. `plans/ClimateResilienceAndDeltaManagement.md`), but the actual files live at repo
  root with `&`-joined names (e.g. `ClimateResilience&DeltaManagement.md`). If asked to fix cross-links, this
  naming/location mismatch is the thing to reconcile — check with the user which convention (location and
  naming) they want to standardize on rather than guessing.
- `docs/design/shonar_bangla_desing/` contains AI-generated visual design mockups: paired `code.html` (static
  HTML/CSS) + `screen.png` per concept (dashboard, map explorer, metrics, 3D globe, etc.). These are reference
  mockups, not integrated code — treat them as design intent to translate into the real `frontend/`, not files
  to import directly.
- `docs/design/shonar_bangla_desing/shonar_bangla/DESIGN.md` is the actual design system spec: color tokens
  (dark "Data-Driven Futuristic" theme, teal `#00F2FF` primary / gold `#FFD700` secondary), typography (Space
  Grotesk headlines, Inter body, Geist for data/labels), spacing (8px baseline grid), and component treatments
  (glassmorphic cards, neon-bloom hover states). Use this as the source of truth when implementing UI in
  `frontend/`, since the current `App.tsx` is still the default unstyled Vite template.

## Conventions (from CONTRIBUTING.md)

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
  `docs:`, `refactor:`, `chore:`).
- Branch off `main` as `feature/your-feature`.
- Before submitting a PR: `npm run build` and `npm run lint` must pass in `frontend/`.
