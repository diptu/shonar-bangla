---
name: multi-tenant-saas-architect
description: >
  Multi-tenant SaaS architect. Tenant isolation strategies, context
  propagation, authz scoping, background jobs, observability, and the
  operational playbook for serving many customers from one codebase.
  Use when designing or reviewing any multi-tenant system.
---

# Multi-Tenant SaaS Architect

## Trigger
`/multitenant [path|service_name]` — review or scaffold a multi-tenant codebase against this rubric.

## 1. The Lazy Doctrine
- **One isolation decision, made once.** Shared-schema / schema-per-tenant / DB-per-tenant. Don't migrate later.
- **Tenant context flows through `AsyncLocalStorage`.** Never pass `tenantId` as a parameter through 7 layers.
- **Every query is auto-scoped by the ORM layer.** If a developer can write `db.user.findMany()` and forget the tenant filter, the design failed.
- **Test cross-tenant leakage on day one.** It's free then; it's catastrophic in prod.
- If a bullet below contradicts "did the framework + ORM already solve this?", ignore the bullet.

## 2. Pick Your Isolation Strategy (decide before writing code)

| Strategy | Isolation | Cost | Migration | Backups | Best for |
|---|---|---|---|---|---|
| **Shared DB, shared schema** (`tenant_id` column) | Logical (RLS recommended) | Lowest | Easiest | One DB | Most SaaS, < 100k tenants, B2B mid-market |
| **Shared DB, schema-per-tenant** | Strong logical | Medium | Schema migrations × N | One DB, many schemas | Compliance, regulated industries |
| **DB-per-tenant** | Physical | Highest | Hardest (orchestration) | Per-DB | Enterprise / data-residency needs |

**Default choice:** shared-schema + `tenant_id` on every row + Postgres Row-Level Security (RLS). It's the lazy winner — one migration, one backup, one connection pool. You only escape it when compliance or scale forces you to.

**Hybrid is allowed:** free tier on shared schema, enterprise on dedicated DB. Codify the rule per tenant plan.

## 3. Project Layout (multi-tenant-aware)
```
src/
  modules/
    tenant/                  # tenant CRUD, onboarding
    iam/                     # users, roles, memberships
    <feature>/
      service.ts             # assumes tenant context exists
      repository.ts          # scoped queries only
  common/
    tenant-context/
      storage.ts             # AsyncLocalStorage wrapper
      interceptor.ts         # NestJS / Express middleware
      assert.ts              # requireTenantContext()
    auth/
      jwt.ts                 # issues { sub, tid, roles }
      casl-ability.ts        # ability factory per tenant
    db/
      prisma.extension.ts    # auto-injects tenant_id
packages/
  api-client/                # tenant-aware SDK
  types/                     # branded TenantId, UserId
test/
  fixtures/
    tenant.ts                # asTenant(tenantId) helper
infra/
  migrations/                # one-shot, applies to all schemas
```

## 4. The Rules (terse)

| Concern | Do | Avoid |
|---|---|---|
| Context propagation | `AsyncLocalStorage` via HTTP interceptor + worker wrapper | Passing `tenantId` through 7 function args |
| Query scoping | Prisma Client Extension / TypeORM subscriber / Drizzle middleware that injects `where: { tenantId }` | Manual `where: { tenantId }` per query (drift risk) |
| Defense-in-depth | Postgres RLS policies as a backstop behind the ORM | Relying on app code alone |
| JWT | Embed `tid` claim; resolve once per request | Re-reading `tenantId` from headers in every service |
| User-tenant relationship | M:N via membership table with `(userId, tenantId, role)` | Single `role` column on user (a user has different roles per tenant) |
| Authz | CASL ability factory built per-request from tenant context | Global static `Ability` instance |
| Background jobs | Payload includes `tenantId`; worker rehydrates context before running | Worker runs without tenant context |
| Webhooks | Signature includes `tenantId`; outbound webhook URL registered per tenant | Outbound URL guessed from request |
| Search indexes | Tenant filter on every query; consider per-tenant index aliases for OpenSearch | Single shared index + post-filter |
| File storage | Keys prefixed `tenants/{tenantId}/...`; signed URLs scoped | Predictable keys like `uploads/{userId}/{filename}` |
| Observability | `tenantId` as a structured log field + low-cardinality metric label | Free-form `tenantId` in logs only |
| Frontend routing | Sub-domain (`acme.app.com`) or path (`/t/acme/...`); default to last-active | No tenant in URL — easy to confuse |
| Testing | E2E test creates two tenants, queries each, asserts zero leakage | Only happy-path tests |
| Migrations | Idempotent; backfill `tenant_id` for existing rows before NOT NULL | Ship a migration that breaks prod |
| Feature flags | Per-tenant overrides in addition to global | One global flag for everyone |

## 5. Core Patterns (copy these)

### 5.1 Tenant context (AsyncLocalStorage)
```ts
// common/tenant-context/storage.ts
import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContext {
  tenantId: TenantId;
  userId: UserId;
  roles: readonly Role[];
  // optional: plan, region, feature flags snapshot
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export const requireTenantContext = (): TenantContext => {
  const ctx = tenantStorage.getStore();
  if (!ctx) throw new TenantContextMissingError();
  return ctx;
};

export const getOptionalTenantContext = () => tenantStorage.getStore();
```

### 5.2 NestJS interceptor (HTTP boundary)
```ts
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    const { sub: userId, tid: tenantId, roles } = req.user; // from JWT
    return tenantStorage.run({ tenantId, userId, roles }, () => next.handle().toPromise());
  }
}
```
Apply globally in `main.ts` AFTER `AuthGuard` so `req.user` is populated.

### 5.3 Prisma Client Extension (auto-scoping)
```ts
// common/db/prisma.extension.ts
const TENANT_SCOPED_MODELS = new Set(['User', 'Order', 'Article', /* ... */]);

export const scopedPrisma = (base: PrismaClient) =>
  base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_SCOPED_MODELS.has(model)) return query(args);
          const ctx = requireTenantContext();
          args = injectTenant(model, operation, args, ctx.tenantId);
          return query(args);
        },
      },
    },
  });

// injectTenant: appends tenantId to `where` for read/update/delete,
// adds it to `data` for create, and walks `include`/`select` for nested writes.
```
**Result:** developers write `prisma.order.findMany()` and get tenant-scoped rows for free. The only escape hatch is a separate `adminPrisma` client with explicit elevated context + audit log.

### 5.4 Postgres RLS (defense in depth)
```sql
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Order"
  USING ("tenantId" = current_setting('app.tenant_id')::uuid);
```
Set `app.tenant_id` at the start of every transaction (Prisma `$transaction` callback or middleware). If a developer forgets the ORM scope, RLS still blocks them.

### 5.5 JWT shape
```ts
type JwtPayload = {
  sub: UserId;     // user
  tid: TenantId;   // active tenant
  roles: Role[];   // roles within THAT tenant
  iat: number;
  exp: number;
};
```
Tenant switch = re-issue JWT with new `tid`. Don't try to multi-tenant a single token.

### 5.6 CASL ability factory
```ts
export const buildAbility = (ctx: TenantContext) => {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
  // Permissions vary by role WITHIN this tenant
  if (ctx.roles.includes('admin')) can('manage', 'all');
  if (ctx.roles.includes('editor')) can('update', 'Article');
  return build();
};

// Usage in service — never module-level:
const ability = buildAbility(requireTenantContext());
ForbiddenError.from(ability).throwUnlessCan('update', article);
```

### 5.7 Background job context (BullMQ)
```ts
// Producer
await queue.add('send-invoice', { tenantId, userId, invoiceId }, { jobId: `${tenantId}:${invoiceId}` });

// Worker
new Worker('invoices', async (job) => {
  const { tenantId, userId } = job.data;
  return tenantStorage.run(
    { tenantId, userId, roles: ['worker'], /* no real user */ },
    () => sendInvoice(job.data),
  );
});
```
Idempotency: stable `jobId` = `(tenantId, entityId)` so retries don't double-charge.

### 5.8 Sub-domain routing (Next.js middleware)
```ts
// middleware.ts
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const sub = host.split('.')[0];
  if (sub && !['www', 'app', 'api'].includes(sub)) {
    const url = req.nextUrl.clone();
    url.pathname = `/t/${sub}${url.pathname}`;
    return NextResponse.rewrite(url);
  }
}
```
Persist last-active tenant in cookie; restore on cold load.

### 5.9 File storage keys
```
tenants/{tenantId}/uploads/{year}/{month}/{uuid}-{filename}
```
Signed URLs scoped to a prefix; never expose a path that lets one tenant guess another's file.

## 6. Scaffolding Shortcuts (set up once, forget forever)
- `AsyncLocalStorage` wrapper + `requireTenantContext()` exported from one file.
- Prisma Client Extension generated from a config of `{ model → tenantField }` — don't handwrite per-model hooks.
- Postgres RLS policies generated from the same config.
- `asTenant(tenantId)` test helper that runs the wrapped function inside a tenant context (Vitest/Jest decorator).
- `withTenant(tenantId, fn)` helper for one-off scripts / cron entry points.
- `adminPrisma` factory that requires a special env var + audit log entry.
- `getEffectivePlan(tenantId)` cached lookup — feature flags + quotas live here, not scattered.
- Per-tenant `quotaUsage` table updated via outbox event (don't put rate limit checks inline everywhere).

## 7. Cross-Tenant Operations (admin-only escape hatch)
Some flows legitimately cross tenants: support tickets, billing, abuse investigation. Do not weaken isolation — use a **second Prisma client**:
```ts
// adminPrisma has NO tenant scoping, but:
// 1. Requires ADMIN_PRISMA_AUDIT_KEY env var to construct
// 2. Every query wraps in auditLog.record({ actor, action, tenantId, query })
// 3. Alerted on by observability
```
Never expose `adminPrisma` to feature services. Only `support/`, `billing/`, `compliance/` modules.

## 8. Observability Discipline
- **Logs:** `tenantId`, `userId`, `requestId` on every line (Pino child logger).
- **Metrics:** `tenantId` as a label ONLY on low-cardinality counters (errors, billing). Avoid per-tenant labels on high-cardinality histograms — Prometheus OOMs.
- **Traces:** tenantId as a span attribute; OpenTelemetry context propagated through BullMQ / Kafka / HTTP.
- **Cost attribution:** separate rollup pipeline (ClickHouse / BigQuery) computing per-tenant usage; do not do this in the hot path.
- **Alerting:** tenant-agnostic SLI + per-tenant paging only for "headline" tenants (config-driven).

## 9. Operations Playbook

**Onboarding a new tenant:**
1. Insert into `Tenant` table (in transaction).
2. Run seed migrations for default roles, settings, plan limits.
3. Issue welcome JWT for the inviting admin.
4. Async: send welcome email, create S3 prefix, provision search index alias.

**Offboarding (GDPR / cancellation):**
1. Mark tenant `deleted_at` (soft delete, 30-day grace).
2. Disable logins.
3. Hard-delete via scheduled job after grace period (with audit log).
4. Provide tenant data export endpoint (async, zipped JSON to S3, signed URL emailed).

**Schema migration across N tenants (shared schema):**
- One migration, runs once. Easiest mode.
- Backfill in batches (`UPDATE ... WHERE id IN (SELECT ... LIMIT 1000)` in a loop) to avoid lock storms.

**Schema migration (schema-per-tenant):**
- Iterate tenants in batches; track progress in `_migration_progress` table; resumable on crash.

**Tenant-specific rate limits:**
- Redis token bucket keyed by `tenantId`; check at API gateway, not in service.

**Data residency:**
- Tenant has `region` field; routing layer dispatches to region-pinned DB / queue.

## 10. Lazy Hard-Nos
Reject on sight:
- ❌ `db.user.findMany()` without an ORM-level tenant scope
- ❌ `tenantId` passed as a function arg instead of via `AsyncLocalStorage`
- ❌ Single global `Ability` instance (ignores per-tenant roles)
- ❌ Background job payload missing `tenantId`
- ❌ Worker that runs without `tenantStorage.run(...)`
- ❌ JWT without a `tid` claim
- ❌ File keys without `tenantId` prefix
- ❌ Search index spanning tenants without filter on every query
- ❌ `tenantId` as a high-cardinality Prometheus label
- ❌ Soft-deleted tenant still queryable by feature services
- ❌ Schema migration that doesn't backfill `tenant_id` before adding NOT NULL
- ❌ Per-tenant flag checked with `if (tenantId === 'special')` instead of feature-flag system
- ❌ Cross-tenant admin query without audit log
- ❌ Test suite with only one tenant fixture — leak tests must use two

## 11. Testing Checklist (run before every release)
1. Create tenants A and B with disjoint data.
2. As A, hit every list endpoint. Assert B's data is **not** present.
3. As A, attempt to read/update/delete a B resource by ID. Assert 404 (not 403 — don't leak existence).
4. As A, attempt cross-tenant file access by guessing a key. Assert 403/404.
5. As worker, dispatch a job for tenant A. Assert it cannot see tenant B's data.
6. As admin tool, run cross-tenant query. Assert audit log entry created.
7. Switch tenant mid-session: hit endpoints with new `tid`. Assert new data, no stale.
8. Disabled/soft-deleted tenant: every endpoint returns 401/403.
9. Rate limit per tenant: exceed quota, assert 429, not 200.

## 12. Execution Checklist
Run through when reviewing `/multitenant [target]`:
1. Isolation strategy chosen and documented? (shared-schema vs schema-per-tenant)
2. `AsyncLocalStorage` wrapper exists; interceptor applied globally after auth?
3. Prisma Client Extension auto-injects `tenantId` for scoped models?
4. Postgres RLS enabled on tenant-scoped tables as backstop?
5. JWT carries `tid`; `tid` cannot be set from client headers?
6. User-tenant membership is M:N with per-tenant roles?
7. CASL / authz ability factory takes tenant context (not global)?
8. Background workers rehydrate tenant context before running?
9. Outbound webhooks include `tenantId` in signature + payload?
10. File keys prefixed by `tenantId`; signed URLs scoped?
11. Search queries always filter by `tenantId`?
12. `tenantId` on every log line; on metrics only when cardinality-safe?
13. Migrations backfill `tenant_id` before NOT NULL?
14. Onboarding / offboarding runbooks exist and tested?
15. Cross-tenant tests run in CI with at least two tenant fixtures?

---
*If you only remember three things: `AsyncLocalStorage` for context, ORM-level auto-scoping for every query, Postgres RLS as backstop. Test cross-tenant leakage on day one — it's free then and catastrophic later.*