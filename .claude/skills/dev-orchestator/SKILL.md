---
name: dev-orchestrator
description: >
  Meta-skill that orchestrates the other 9 skills across every phase of
  development — scaffold → design → implement → review → test → deploy
  → operate → evolve. Evaluates a codebase against all skills, ensures
  each is used as intended, and produces one unified triage report with
  a composite health score.
---

# Dev Orchestrator (Meta-Skill)

## Trigger
- `/audit full` — full evaluation against all 9 skills.
- `/audit <phase>` — focus on a phase (`scaffold` / `design` / `implement` / `review` / `test` / `deploy` / `operate` / `evolve`).
- `/audit skill <name>` — deep-dive one skill.
- `/audit fix <id>` — apply an auto-fix for a known quick-win.

## 1. The Lazy Doctrine
- **One orchestrator, one report.** Don't run 9 separate audits; produce one composite score and one prioritized fix list.
- **Detection before judgment.** Grep patterns before opinions. A skill is "in sync" when its patterns are present, correct, and not contradicted.
- **Phase-aware routing.** Don't apply `observability-sre-architect` during scaffolding — apply it at operate. Apply `event-driven` at design, not retrofit.
- **Used-as-intended test:** the skill's hard-nos are absent AND its core patterns are present AND they're correct (not just present).
- If a bullet below contradicts "did the framework + tooling already solve this?", ignore the bullet.

## 2. The 9 Skills — Quick Reference

| # | Skill | When it applies | Single-sentence intent |
|---|---|---|---|
| 1 | `nextjs-architect` | Next.js 14/15 App Router codebases | Server Components by default, RSC data fetching, Server Actions, auth via cookies |
| 2 | `nestjs-architect` | NestJS backend codebases | Feature modules, thin controllers, DI, DTOs + validation, exception filters, Swagger |
| 3 | `typescript-architect` | Any TS project (universal) | strict tsconfig, Zod = type, derive don't redeclare, no `any`, branded IDs |
| 4 | `tailwind-architect` | Tailwind v3/v4 projects | Co-locate utilities, `cn()` + `cva`, theme tokens, lazy primitives |
| 5 | `multi-tenant-saas-architect` | Any SaaS serving >1 tenant | `AsyncLocalStorage` context, ORM auto-scoping, RLS backstop, no leakage |
| 6 | `event-driven-microservices-architect` | Codebases with RabbitMQ/Kafka/BullMQ | Outbox over dual-write, idempotent consumers, DLQs, saga persistence |
| 7 | `polyglot-persistence-architect` | Multi-store data architectures | Postgres-first, CDC over dual-write, cache invalidation via events |
| 8 | `observability-sre-architect` | Production systems | Pino + Prometheus + OTel + Sentry, SLOs with multi-window burn, runbooks |
| 9 | `data-visualization-geospatial-architect` | Dashboards / maps / charts | MapLibre + PMTiles, colorblind-safe palettes, chart-by-complexity, a11y table fallback |

## 3. Phase Routing — Which Skills When

| Phase | Primary skills | Secondary skills |
|---|---|---|
| **Scaffold** | `nestjs-architect` OR `nextjs-architect`, `typescript-architect`, `tailwind-architect` (FE) | `multi-tenant-saas-architect` (if SaaS) |
| **Design** | `multi-tenant-saas-architect`, `event-driven-microservices-architect`, `polyglot-persistence-architect` | `nextjs-architect` / `nestjs-architect` for contracts |
| **Implement** | `typescript-architect`, `tailwind-architect` | Language-specific skill of the layer being touched |
| **Review** | **ALL 9** (full audit) | Skill of the file being changed |
| **Test** | All 9 (each has a testing section) | `event-driven` (idempotency tests), `multi-tenant` (cross-tenant tests) |
| **Deploy** | `observability-sre-architect`, `polyglot-persistence-architect` | `event-driven-microservices-architect` (DLQ at boot) |
| **Operate** | `observability-sre-architect` | `event-driven-microservices-architect` (DLQ inspection), `multi-tenant-saas-architect` (per-tenant dashboards) |
| **Evolve** | Full audit + targeted deep-dive | Skill of the area being refactored |

## 4. Detection Playbook — Grep Before You Judge

For each skill, here are the file/grep patterns that prove (or disprove) "used as intended."

### 4.1 Stack detection (which skills apply at all?)
```bash
# Detect languages / frameworks
grep -l '"nestjs"' package.json                       # → apply nestjs-architect
ls -d app/ 2>/dev/null && grep -l '"next"' package.json # → apply nextjs-architect
grep -l '"typescript"' package.json                   # → apply typescript-architect
grep -l '"tailwindcss"' package.json                  # → apply tailwind-architect
grep -rl 'tenant_id\|tenantId' src/                   # → apply multi-tenant
grep -rl 'kafka\|amqplib\|bullmq\|@nestjs/microservices' src/  # → apply event-driven
grep -rl 'redis\|elasticsearch\|clickhouse\|pgvector\|s3' src/  # → apply polyglot
grep -rl 'pino\|prom-client\|@sentry\|@opentelemetry' src/      # → apply observability
grep -rl 'maplibre-gl\|recharts\|tremor\|@visx' src/   # → apply data-viz
```

### 4.2 Per-skill core patterns (presence checks)

**`nextjs-architect`:**
```bash
ls app/layout.tsx                                    # root layout exists
ls middleware.ts                                     # middleware exists
ls 'app/**/loading.tsx' 'app/**/error.tsx' 'app/**/not-found.tsx' 2>/dev/null  # convention files
grep -rL '"use client"' app/layout.tsx app/page.tsx  # root is RSC
grep -rl 'generateMetadata\|export const metadata' app/   # metadata present
grep -rL 'useEffect.*fetch\|fetch.*useEffect' src/   # no client-side initial fetching
```

**`nestjs-architect`:**
```bash
ls src/modules/                                      # feature-first layout
grep -rl '@Controller' src/                          # controllers exist
grep -rl 'ValidationPipe\|useGlobalPipes' src/main.ts  # global validation
grep -rl 'ExceptionFilter\|useGlobalFilters' src/main.ts  # global error filter
grep -rl '@nestjs/swagger\|SwaggerModule' src/       # swagger wired
ls test/ -R | grep -l 'supertest'                    # e2e tests
```

**`typescript-architect`:**
```bash
grep '"strict": true' tsconfig.json                  # strict mode on
grep '"noUncheckedIndexedAccess": true' tsconfig.json
grep '"exactOptionalPropertyTypes": true' tsconfig.json
grep -rL ': any' src/                                # no any
grep -rl 'z\.infer\|from .zod' src/                   # Zod schemas
grep -rl 'enum ' src/                                # enums (should be 0)
```

**`tailwind-architect`:**
```bash
ls tailwind.config.{ts,js} 'app/globals.css' 2>/dev/null
grep -rl 'from .clsx\|from .tailwind-merge' src/     # cn() helper
grep -rl 'cva(' src/                                 # class-variance-authority
grep -l 'prettier-plugin-tailwindcss' package.json
grep -rl '@apply' src/ | head                        # @apply usage (should be minimal)
```

**`multi-tenant-saas-architect`:**
```bash
grep -rl 'AsyncLocalStorage' src/                    # tenant context
grep -rl 'tenantStorage\|tenantContext' src/         # naming convention
grep -rl 'tenant_id\|tenantId' src/db src/migrations  # tenant column
ls prisma/migrations | grep 'rls\|policy'            # RLS policies
grep -rl 'tid' src/auth src/jwt                      # JWT tid claim
grep -rl 'adminPrisma\|elevatedPrisma' src/         # cross-tenant escape hatch (audited)
```

**`event-driven-microservices-architect`:**
```bash
grep -rl 'outbox\|Outbox' src/                       # outbox table
grep -rl 'processedEvents\|processed_events' src/    # idempotency table
grep -rl 'CloudEvents\|specversion' src/             # envelope
grep -rl 'DLQ\|dead-letter\|deadLetter' src/         # DLQ configured
ls 'src/schemas/' -R 2>/dev/null                     # versioned schemas
grep -rl 'prisma\.\$transaction.*kafka\|kafka.*prisma\.\$transaction' src/  # dual-write (anti-pattern)
```

**`polyglot-persistence-architect`:**
```bash
grep -rl 'prisma\|drizzle\|typeorm' src/             # ORM
grep -rl 'redis\|ioredis' src/                       # cache client
grep -rl 'opensearch\|@elastic' src/                 # search
grep -rl 'clickhouse\|@clickhouse' src/              # analytics
grep -rl 'pgvector\|vector_cosine_ops' prisma/ src/  # vector
grep -rl 'aws-sdk\|@aws-sdk\|@azure/storage' src/    # object storage
grep -rL 'tenant:' src/redis src/common/cache 2>/dev/null  # tenant-scoped keys
```

**`observability-sre-architect`:**
```bash
grep -rl 'from .pino' src/                           # structured logger
grep -rl 'prom-client\|/metrics' src/                # Prometheus
grep -rl '@opentelemetry\|trace.startSpan\|withSpan' src/  # OTel
grep -rl '@sentry\|Sentry.init' src/                 # Sentry
grep -rl 'enableShutdownHooks\|SIGTERM' src/         # graceful shutdown
ls runbooks/ 2>/dev/null                            # runbooks
ls infra/prometheus/rules.yml 2>/dev/null            # recording rules
```

**`data-visualization-geospatial-architect`:**
```bash
grep -rl 'maplibre-gl' src/                          # MapLibre
ls 'public/tiles/*.pmtiles' 2>/dev/null              # vector tiles
grep -rl 'tremor\|recharts\|@visx\|@nivo' src/       # chart libs
grep -rl 'cividis\|viridis\|colorbrewer' src/        # colorblind-safe
grep -rl 'role="img"\|aria-label' src/features src/components  # a11y
grep -rl 'prefers-reduced-motion' src/               # reduced motion
grep -rl 'Intl.NumberFormat\|date-fns/locale' src/   # i18n
```

## 5. Per-Skill Evaluation Criteria (pass / warn / fail)

Each skill gets evaluated on three dimensions:
- **P (Presence)** — core patterns exist.
- **C (Correctness)** — when used, they're used correctly (not just present).
- **A (Anti-patterns)** — the skill's hard-nos are absent.

Scoring: `P` and `C` each 0–5, `A` is inverted (5 = no anti-patterns found). Composite = average.

### 5.1 `nextjs-architect`
| Criterion | P | C | A |
|---|---|---|---|
| Root layout is RSC (no `"use client"`) | ✓ | ✓ | — |
| `loading.tsx` / `error.tsx` / `not-found.tsx` per segment | ✓ | ✓ | — |
| Data fetched in RSC; mutations via Server Actions | ✓ | ✓ | — |
| No `useEffect`+`fetch` for initial data | — | — | ✓ |
| No `localStorage` for tokens | — | — | ✓ |
| `next/font` + `next/image` everywhere applicable | ✓ | ✓ | — |
| `middleware.ts` for auth gates + security headers | ✓ | ✓ | — |
| `metadata` / `generateMetadata` on public routes | ✓ | ✓ | — |

### 5.2 `nestjs-architect`
| Criterion | P | C | A |
|---|---|---|---|
| Feature modules under `src/modules/` | ✓ | ✓ | — |
| Global `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` | ✓ | ✓ | — |
| Global `ExceptionFilter` for uniform error shape | ✓ | ✓ | — |
| Swagger wired (`@nestjs/swagger`) | ✓ | ✓ | — |
| Controllers < 50 lines; no ORM imports | — | — | ✓ |
| DB access only via repositories | ✓ | ✓ | — |
| Auth via guards, not inline checks | ✓ | ✓ | — |
| e2e test per public controller | ✓ | ✓ | — |

### 5.3 `typescript-architect`
| Criterion | P | C | A |
|---|---|---|---|
| `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` | ✓ | ✓ | — |
| Zod schemas at every external boundary | ✓ | ✓ | — |
| Zero `any` in `src/` | — | — | ✓ |
| Zero `enum` usage | — | — | ✓ |
| Branded types for IDs | ✓ | ✓ | — |
| `Result<T,E>` for expected failures | ✓ | ✓ | — |
| `assertNever` in exhaustive switches | ✓ | ✓ | — |
| `tsc --noEmit` green in CI | ✓ | — | — |

### 5.4 `tailwind-architect`
| Criterion | P | C | A |
|---|---|---|---|
| `cn()` helper present + used | ✓ | ✓ | — |
| `cva` for variant-heavy components | ✓ | ✓ | — |
| `prettier-plugin-tailwindcss` installed | ✓ | — | — |
| Theme tokens (`@theme` / `theme.extend`) populated | ✓ | ✓ | — |
| `@apply` only in primitive components | — | — | ✓ |
| `darkMode: 'class'` (or v4 `@variant`) when manual toggle exists | ✓ | ✓ | — |
| `tailwind-merge` resolves conflicts in `cn()` | ✓ | ✓ | — |
| `!important` (`!bg-*`) usage minimal | — | — | ✓ |

### 5.5 `multi-tenant-saas-architect`
| Criterion | P | C | A |
|---|---|---|---|
| `AsyncLocalStorage` wrapper + interceptor | ✓ | ✓ | — |
| Prisma Client Extension auto-injects `tenantId` | ✓ | ✓ | — |
| Postgres RLS enabled on tenant tables | ✓ | ✓ | — |
| JWT carries `tid` claim (not header-controlled) | ✓ | ✓ | — |
| User-tenant membership is M:N | ✓ | ✓ | — |
| CASL ability factory per-request (not global) | ✓ | ✓ | — |
| Cross-tenant leak test in CI (≥ 2 tenants) | ✓ | — | — |
| No `tenantId` as a function param (use context) | — | — | ✓ |

### 5.6 `event-driven-microservices-architect`
| Criterion | P | C | A |
|---|---|---|---|
| Outbox table + relay worker | ✓ | ✓ | — |
| Idempotent consumer wrapper (`consume(envelope, handler)`) | ✓ | ✓ | — |
| CloudEvents envelope (`id`, `type`, `traceparent`) | ✓ | ✓ | — |
| DLQ per queue + alert on depth + age | ✓ | ✓ | — |
| Event schemas versioned in `schemas/<domain>/v<n>.json` | ✓ | ✓ | — |
| Saga state persisted (not in-memory) | ✓ | ✓ | — |
| Tracing context propagated through headers | ✓ | ✓ | — |
| No direct broker publish inside `prisma.$transaction` | — | — | ✓ |

### 5.7 `polyglot-persistence-architect`
| Criterion | P | C | A |
|---|---|---|---|
| Postgres is system of record (no primary writes elsewhere) | ✓ | ✓ | — |
| Sync via CDC / outbox-relay (not app-code dual-write) | ✓ | ✓ | — |
| Cache keys include `tenantId` | ✓ | ✓ | — |
| Cache invalidation via events (not freshness chase) | ✓ | ✓ | — |
| Read replicas used for read-heavy paths | ✓ | ✓ | — |
| Search index projection (built from Postgres state) | ✓ | ✓ | — |
| pgvector first (no vector DB unless measured need) | ✓ | ✓ | — |
| Object storage via signed URLs + tenant-scoped keys | ✓ | ✓ | — |

### 5.8 `observability-sre-architect`
| Criterion | P | C | A |
|---|---|---|---|
| Pino with redaction + correlation IDs | ✓ | ✓ | — |
| Prometheus `/metrics` with sane cardinality (no `userId` labels) | ✓ | ✓ | — |
| OTel auto-instrumentation + `withSpan` on critical paths | ✓ | ✓ | — |
| Sentry with source maps + release tag | ✓ | ✓ | — |
| SLOs defined per service + multi-window burn-rate alerts | ✓ | ✓ | — |
| Three health probes (`/live`, `/ready`, `/startup`) | ✓ | ✓ | — |
| Graceful shutdown wired (drain + close) | ✓ | ✓ | — |
| Runbook per alert | ✓ | — | — |

### 5.9 `data-visualization-geospatial-architect`
| Criterion | P | C | A |
|---|---|---|---|
| MapLibre lazy-loaded per route | ✓ | ✓ | — |
| PMTiles for > 1k features (no big GeoJSON) | ✓ | ✓ | — |
| Colorblind-safe palette in both themes | ✓ | ✓ | — |
| `ckmeans` / quantile classification (not default linear) | ✓ | ✓ | — |
| Chart lib picked by complexity (Tremor → Visx → D3) | ✓ | ✓ | — |
| Every chart has `role="img"` + `aria-label` + `sr-only` table | ✓ | ✓ | — |
| `prefers-reduced-motion` respected | ✓ | ✓ | — |
| i18n via `Intl.NumberFormat` + `date-fns/locale` | ✓ | ✓ | — |

## 6. Anti-Pattern Scan (the lazy red-flag grep)

These one-liners catch the most common ways skills get misused. Run all of them in CI or pre-commit.

```bash
# TypeScript
grep -rn ': any\b' src/ --include='*.ts' --include='*.tsx' | grep -v 'eslint-disable' && echo "FAIL: any"
grep -rn '\benum\b' src/ --include='*.ts' --include='*.tsx' && echo "FAIL: enum"
grep -rn '// @ts-ignore\|// @ts-nocheck' src/ | grep -v 'TODO:' && echo "FAIL: ts-ignore"

# NestJS
grep -rn 'getRepository\|EntityManager' src/modules/ && echo "FAIL: direct ORM in modules"
grep -rn 'try {' src/modules/ && echo "WARN: try/catch in services (usually exception filter's job)"

# Next.js
grep -rn 'localStorage.*token\|sessionStorage.*token' src/ && echo "FAIL: token in storage"
grep -rn 'useEffect.*fetch(' src/ --include='*.tsx' | grep -v 'use client' && echo "WARN: useEffect+fetch"

# Multi-tenant
grep -rn 'tenantId:.*=.*req\.\|tenantId.*req\.query' src/ && echo "FAIL: tenantId from request (should be from JWT)"
grep -rn 'Ability()\|new Ability(' src/ | grep -v 'AbilityBuilder' && echo "FAIL: global static Ability"

# Event-driven
grep -rn 'prisma\.\$transaction' src/ -A 5 | grep -E 'kafka|amqp|publish|send\(' && echo "FAIL: dual-write"
grep -rn 'attempts:\s*undefined\|attempts:\s*0' src/ && echo "FAIL: infinite retry risk"

# Persistence
grep -rn 'redis\.set(.*"\(user\|order\|article\)' src/ | grep -v 'tenant:' && echo "FAIL: cache key missing tenant"

# Observability
grep -rn 'console\.\(log\|info\|warn\|error\)' src/ --include='*.ts' --include='*.tsx' && echo "FAIL: console.* in src"
grep -rn "labelNames.*['\"]user" src/ && echo "FAIL: high-cardinality label"

# Tailwind
grep -rn 'style={{.*color\|style={{.*margin' src/ --include='*.tsx' && echo "WARN: inline style for static value"
grep -rn '@apply' src/ | wc -l | awk '$1>20 {print "WARN: heavy @apply usage"}'

# Viz
grep -rn 'rainbow\|jet\|spectral' src/ | grep -v 'comment' && echo "FAIL: rainbow palette"
grep -rn 'maplibre-gl' src/app/layout.tsx src/app/page.tsx 2>/dev/null && echo "FAIL: MapLibre in initial bundle"
```

## 7. Composite Health Score

```
Skill Score = (P + C + A) / 3      # each 0-5
Overall = average across applicable skills
Tier:
  4.5–5.0  →  GREEN   (production-ready; ship with confidence)
  3.5–4.4  →  YELLOW  (ship with backlog; address in next sprint)
  2.0–3.4  →  ORANGE  (significant gaps; do not scale usage)
  < 2.0    →  RED     (re-architect before next milestone)
```

The overall tier reflects risk, not aesthetics. A 4.0 on `multi-tenant` matters more than 4.0 on `tailwind`.

**Hard fail (overrides tier):**
- Any `FAIL:` from the anti-pattern scan = **RED** until fixed.
- `tsc --noEmit` errors = **RED**.
- Missing test for cross-tenant leakage in a SaaS = **RED**.
- Missing DLQ on a queue that handles business events = **RED**.

## 8. Per-Phase Workflows

### 8.1 Scaffold (Day 0)
1. **Detect stack** → which of the 9 skills apply.
2. **Apply `nestjs-architect` or `nextjs-architect`** — directory layout, global pipes/filters/middleware.
3. **Apply `typescript-architect`** — `tsconfig.json` baseline (strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes).
4. **Apply `tailwind-architect` (FE)** — install `cn()` helper, `cva`, `prettier-plugin-tailwindcss`.
5. **Apply `multi-tenant-saas-architect` (if SaaS)** — AsyncLocalStorage wrapper, Prisma extension scaffold, JWT `tid` claim.
6. **Apply `polyglot-persistence-architect`** — Postgres + Prisma + Redis setup (only what's measured).
7. **Apply `observability-sre-architect`** — Pino + Prometheus + OTel + Sentry wired from line 1.
8. **Output:** scaffold report with what's wired vs deferred. **Tier target: GREEN for stack-level concerns, YELLOW acceptable for deferred skills.**

### 8.2 Design (before code)
1. **Apply `multi-tenant-saas-architect`** — tenant isolation strategy documented.
2. **Apply `polyglot-persistence-architect`** — storage decisions per access pattern (with "pain tests").
3. **Apply `event-driven-microservices-architect`** — message topology, event schemas (`v1.json`), saga decisions.
4. **Apply `nextjs-architect` / `nestjs-architect`** — API contracts (OpenAPI), route groups.
5. **Output:** design doc with decisions + tradeoffs. No code yet.

### 8.3 Implement (writing code)
1. **Per file touched, apply its primary skill.**
2. **Always apply `typescript-architect`** — Zod schemas at boundaries, branded types for IDs.
3. **Run anti-pattern scan as pre-commit hook** — fail fast on hard-nos.
4. **Run `tsc --noEmit` in dev loop.**
5. **Output:** working code that passes its skill's evaluation criteria.

### 8.4 Review (PR time)
1. **Full audit** — all 9 skills evaluated against changed files + adjacent files.
2. **Score per skill, per file** — if any file scores < 3, request changes.
3. **Auto-fix quick wins** — see section 10.
4. **Output:** review report (see section 9).

### 8.5 Test
1. **Per skill, run the testing section.**
2. **Multi-tenant:** ≥ 2 tenants in leak test.
3. **Event-driven:** idempotency test (send event twice, handler called once); chaos test (kill broker, assert no loss).
4. **Persistence:** projection consistency test (read from search after write).
5. **Observability:** assert logs are structured; assert `/metrics` returns 200; assert `/health/ready` checks all stores.
6. **Viz:** axe-core scan for a11y; reduced-motion check.
7. **Output:** test report with coverage per skill.

### 8.6 Deploy
1. **Apply `observability-sre-architect`** — verify Sentry release tag = `$GIT_SHA`; source maps uploaded.
2. **Apply `polyglot-persistence-architect`** — per-store backup verified; restore drill current.
3. **Apply `event-driven-microservices-architect`** — DLQ wired with alerts at boot.
4. **Smoke test in prod-like env** — run `audit full` against staging.
5. **Output:** deploy checklist signed off.

### 8.7 Operate
1. **Apply `observability-sre-architect`** — alert routing verified, runbooks linked, on-call rotation active.
2. **Apply `multi-tenant-saas-architect`** — per-tenant cost dashboards; abuse alerts on per-tenant consumption.
3. **Apply `event-driven-microservices-architect`** — DLQ depth + age monitored; replay runbook tested quarterly.
4. **Output:** operational health report (weekly).

### 8.8 Evolve (refactor / migrate)
1. **Full audit as baseline.**
2. **Pick the area of change** → deep-dive that skill.
3. **Plan migration** using that skill's "migration strategy" section if applicable.
4. **Re-audit after change** → confirm score improved, didn't regress others.
5. **Output:** before/after diff report.

## 9. Report Template

When running `/audit`, output this structure:

```markdown
# Audit Report — <repo> @ <commit>
**Date:** <iso>
**Tier:** GREEN | YELLOW | ORANGE | RED
**Overall score:** X.X / 5.0

## Per-skill summary
| Skill | P | C | A | Score | Tier | Top issue |
|---|---|---|---|---|---|---|
| nextjs-architect | 5 | 4 | 5 | 4.7 | 🟢 | Server Action missing for X |
| nestjs-architect | 4 | 4 | 5 | 4.3 | 🟡 | No global ExceptionFilter in main.ts |
| typescript-architect | 5 | 5 | 5 | 5.0 | 🟢 | — |
| tailwind-architect | 4 | 3 | 4 | 3.7 | 🟡 | cva missing on Button component |
| multi-tenant-saas-architect | 3 | 2 | 4 | 3.0 | 🟠 | Prisma extension not injecting tenantId on nested writes |
| event-driven-microservices-architect | 4 | 4 | 5 | 4.3 | 🟡 | No replay runbook documented |
| polyglot-persistence-architect | 5 | 5 | 5 | 5.0 | 🟢 | — |
| observability-sre-architect | 3 | 2 | 4 | 3.0 | 🟠 | No SLO defined for order service |
| data-visualization-geospatial-architect | 4 | 3 | 5 | 4.0 | 🟡 | Some charts lack sr-only table fallback |

## Hard fails (must fix)
- `FAIL: any` in src/legacy/old-types.ts:42
- `FAIL: token in storage` in src/auth/login.tsx:18
- `FAIL: dual-write` in src/orders/checkout.service.ts:67

## Top 5 fixes (sorted by impact)
1. **Add global ExceptionFilter** (nestjs-architect) — 15 min, prevents 1 prod debugging hour/week.
2. **Add SLO + burn-rate alert for order service** (observability-sre-architect) — 30 min, catches the next outage.
3. **Auto-fix: enable RLS on tenant tables** (multi-tenant-saas-architect) — 10 min, defense in depth.
4. **Add sr-only data tables to 4 charts** (data-viz) — 20 min, WCAG compliance.
5. **Document replay runbook** (event-driven) — 15 min, removes on-call panic during incident.

## Phase verdict
| Phase | Verdict | Notes |
|---|---|---|
| Scaffold | 🟢 | Stack-level concerns wired correctly |
| Implement | 🟡 | Speed up; some files skipping per-file audit |
| Review | 🟢 | Last audit run was clean |
| Test | 🟠 | Cross-tenant leak test missing |
| Deploy | 🟡 | Source maps not always uploaded |
| Operate | 🟠 | SLO coverage partial |
| Evolve | 🟡 | Last refactor didn't re-audit |

## Auto-fixes applied
- none (or list)
```

## 10. Auto-Fix Quick Wins

When `/audit fix <id>` is called, apply the documented fix.

| Fix ID | Skill | Action |
|---|---|---|
| `fix:any` | typescript-architect | Replace `: any` with `unknown` + add type guard; skip `// eslint-disable` |
| `fix:console` | observability-sre-architect | Replace `console.*` with `logger.*`; auto-import Pino logger |
| `fix:no-validation-pipe` | nestjs-architect | Add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))` in `main.ts` |
| `fix:no-exception-filter` | nestjs-architect | Generate `AllExceptionsFilter` + register globally |
| `fix:no-swagger` | nestjs-architect | Add `SwaggerModule.setup('docs', app, document)` |
| `fix:no-loading-tsx` | nextjs-architect | Generate `loading.tsx` skeleton for each route segment |
| `fix:no-cn-helper` | tailwind-architect | Generate `lib/cn.ts` with clsx + tailwind-merge |
| `fix:no-prettier-tailwind` | tailwind-architect | Install + configure `prettier-plugin-tailwindcss` |
| `fix:tenant-context-missing` | multi-tenant-saas-architect | Generate `tenant-context/` folder + interceptor + tests |
| `fix:outbox-table` | event-driven-microservices-architect | Generate Outbox model + relay worker skeleton |
| `fix:processed-events-table` | event-driven-microservices-architect | Generate `processed_events` table + idempotent consumer wrapper |
| `fix:no-pino` | observability-sre-architect | Generate `lib/logger.ts` with redaction list |
| `fix:no-source-maps` | observability-sre-architect | Add Sentry webpack plugin / `sentry-cli` upload step to CI |
| `fix:no-pmtiles` | data-visualization-geospatial-architect | Generate `tippecanoe` script + MapLibre protocol setup |
| `fix:no-a11y-table` | data-visualization-geospatial-architect | Generate `<ChartA11yTable>` wrapper |

**Rule:** auto-fixes must be non-destructive. If the file already has divergent content, skip and report instead of overwriting.

## 11. CI Integration

Wire `/audit` into CI so violations block merge:

```yaml
# .github/workflows/audit.yml
name: dev-orchestrator
on: [pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx tsc --noEmit                                    # typescript-architect
      - run: npm run lint                                         # all: hard-no scan
      - run: bash scripts/audit-anti-patterns.sh                  # orchestrator's grep set
      - run: npx @dev-orchestrator/cli audit full --report       # full evaluation
        env: { AUDIT_FAIL_ON: RED }
```

The orchestrator's CLI outputs a markdown report as PR comment + JSON for the badge.

## 12. Lazy Hard-Nos (the orchestrator itself)
- ❌ Running all 9 skills on a 5-line PR (use `/audit skill <name>` instead)
- ❌ Producing a report without concrete grep evidence
- ❌ Scoring a skill P=5 when only one pattern was checked (each criterion needs evidence)
- ❌ Auto-fixing a file without diff visibility (must be reviewable)
- ❌ Letting `tailwind-architect` score override `multi-tenant-saas-architect` tier
- ❌ Skipping cross-tenant leak test because "we only have one tenant in dev"
- ❌ Treating YELLOW as "ship it" without addressing the top issue
- ❌ Re-running the audit against a stale commit (always re-run on push)
- ❌ Reporting tier without listing the hard fails

## 13. Execution Checklist (the orchestrator)
Before posting any report:
1. Stack detected correctly? (which 9 apply)
2. Each applicable skill scored on all criteria (P, C, A)?
3. Anti-pattern grep set run, all FAILs listed?
4. Composite score calculated; tier assigned?
5. Top 5 fixes ranked by impact (not by alphabet)?
6. Hard fails override tier?
7. Phase verdicts honest (not optimistic)?
8. Report format matches template (PR-friendly)?

---
*If you only remember three things: detect before judge; phase-aware routing; tier = (P+C+A)/3, hard-fail overrides. The rest is detail.*