# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Shonar Bangla is currently a **content-only repository** — there is no application code:

1. **Policy/roadmap essays** (root-level `*.md` files) describing a proposed ten-year development plan for
   Bangladesh — economic, climate, education, digital governance, healthcare, military, environment, energy,
   and divisional-restructuring topics. These are the product of the repo today.
2. **Design mockups and a design-system spec** under `docs/design/` for a future dashboard app that will
   visualize this roadmap geospatially.

A Vite + React frontend scaffold previously existed at `frontend/` but was **intentionally deleted** (the user
confirmed this). It is still recoverable from git history (`git log -- frontend/`) if ever needed, but do not
restore it or treat it as current. `backend/` never had code. There are no build, lint, or test commands to
run anywhere in the repo right now.

## Aspirational vs. actual

`README.md` and `Plan.md` describe a large aspirational stack (Next.js + NestJS + PostgreSQL + Prisma +
Turborepo monorepo with microservices, Redis, Kafka, Kubernetes, etc.) and a phased build plan. **None of it
exists.** When asked to start building the app, treat these as intent, not fact — confirm scope and stack with
the user before scaffolding anything, and prefer starting far smaller than the README's architecture diagram.

## Content structure

- Root `*.md` files are the roadmap documents, e.g. `EconomicDiversification.md`, `EnergySecurity.md`,
  `Healthcare&SocialWelfare.md`, `DivisionalModels.md`. `hopeForBangladesh.md` is the narrative index that
  links to them. `Plan.md` is the phased platform build plan.
- **Known inconsistency**: `hopeForBangladesh.md` links to these files under a `plans/` subdirectory with
  "And"-joined names (e.g. `plans/ClimateResilienceAndDeltaManagement.md`), but the actual files live at repo
  root with `&`-joined names (e.g. `ClimateResilience&DeltaManagement.md`). If asked to fix cross-links, check
  with the user which convention (location and naming) to standardize on rather than guessing.
- `docs/design/shonar_bangla_desing/` (note the typo in the dir name — it's real) contains AI-generated visual
  mockups: paired `code.html` + `screen.png` per concept (dashboard, map explorer, metrics, 3D globe, etc.).
  These are design intent to translate into a real app later, not code to import.
- `docs/design/shonar_bangla_desing/shonar_bangla/DESIGN.md` is the design system spec: dark "Data-Driven
  Futuristic" theme, teal `#00F2FF` primary / gold `#FFD700` secondary, Space Grotesk headlines / Inter body /
  Geist for data, 8px baseline grid, glassmorphic cards. Use it as the source of truth for any future UI work.

## Conventions (from CONTRIBUTING.md)

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
  `docs:`, `refactor:`, `chore:`).
- Branch off `main` as `feature/your-feature`.
