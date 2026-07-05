# TODO

Working checklist for [Plan.md](Plan.md). Currently covers **Phase 0 — Repository Foundation** only.
The repo has no application code yet (old Vite `frontend/` was intentionally removed), so Phase 0 is
trimmed to what's useful now; the rest is parked in [Deferred](#deferred-until-theres-code) with unblock
conditions so nothing from Plan.md is lost.

## Housekeeping (do first)

- [ ] Commit the pending `frontend/` deletion (22 deleted files in the working tree) — `chore: remove old Vite frontend scaffold`
- [ ] Reconcile `hopeForBangladesh.md` links with actual file locations (`plans/ClimateResilienceAndDeltaManagement.md` vs root `ClimateResilience&DeltaManagement.md`) — **needs a decision** on naming/location convention first

## Phase 0 — Repository Foundation

- [ ] Scaffold monorepo skeleton
  - [ ] Root `package.json` with npm workspaces (`apps/*`, `packages/*`), `private: true`
  - [ ] `turbo.json` with `build` / `lint` / `dev` pipeline (empty `apps/` for now — real apps arrive in Phases 1–3)
  - [ ] Pin Node LTS via `.nvmrc` + `engines` field
- [ ] Root tooling
  - [ ] Prettier — `.prettierrc` + `.prettierignore`
  - [ ] ESLint flat config at root (keep shared config inline until a second package justifies extracting `packages/eslint-config`)
  - [ ] Update `.gitignore` for `node_modules/`, `.turbo/`, `.env`, build output
- [ ] Environment management (minimal)
  - [ ] `.env.example` at root
  - [ ] README note that `.env` is git-ignored
- [ ] GitHub Actions CI
  - [ ] `.github/workflows/ci.yml` — `npm ci`, `turbo lint`, `turbo build` on push/PR to `main`
  - [ ] (Optional) markdown-lint pass over the roadmap essays

## Deferred until there's code

Parked from Plan.md Phase 0 — each with the condition that unblocks it:

- [ ] Husky + lint-staged + Commitlint — *when there's code worth gating; Conventional Commits are already the convention via CONTRIBUTING.md*
- [ ] Docker / docker-compose dev environment — *when the NestJS backend lands (Phase 3); nothing to containerize before that*
- [ ] `packages/eslint-config` + `packages/tsconfig` shared packages — *when a second workspace package needs them*
