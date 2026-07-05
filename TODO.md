# TODO

Working checklist for [Plan.md](Plan.md). Currently covers **Phase 0 — Repository Foundation** only.
The repo has no application code yet (old Vite `frontend/` was intentionally removed), so Phase 0 is
trimmed to what's useful now; the rest is parked in [Deferred](#deferred-until-theres-code) with unblock
conditions so nothing from Plan.md is lost.

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

## Deferred until there's code

Parked from Plan.md Phase 0 — each with the condition that unblocks it:

- [ ] Husky + lint-staged + Commitlint — *when there's code worth gating; Conventional Commits are already the convention via CONTRIBUTING.md*
- [ ] Docker / docker-compose dev environment — *when the NestJS backend lands (Phase 3); nothing to containerize before that*
- [ ] `packages/eslint-config` + `packages/tsconfig` shared packages — *when a second workspace package needs them*
