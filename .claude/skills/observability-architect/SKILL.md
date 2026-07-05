---
name: observability-sre-architect
description: >
  Observability and SRE architect. Three pillars as one system —
  structured logs, RED/USE metrics, distributed traces — plus SLOs,
  error budgets, and the on-call playbook. Use when designing or
  reviewing any production system.
---

# Observability & SRE Architect

## Trigger
`/observe [path|service_name]` — review or scaffold observability + SRE practices against this rubric.

## 1. The Lazy Doctrine
- **Four signals, one story.** Logs (events), metrics (aggregates), traces (flows), errors (exceptions). They answer different questions; you need all four.
- **Alert on symptoms, not causes.** Page on SLO burn, not on CPU. CPU is a hint; user pain is the alarm.
- **Cardinality is a budget.** Every metric label is a money + memory commitment. Default to ≤100 series per metric.
- **Tenant context on every signal.** Structured logs yes, traces yes, metrics only when cardinality-safe.
- If a bullet below contradicts "does this answer 'is the user suffering?'", it's the wrong signal.

## 2. The Four Signals (what each is for)

| Signal | Question it answers | Tool | Cardinality budget |
|---|---|---|---|
| **Logs** | What happened to *this* request? | Pino → Loki | High (per-request OK) |
| **Metrics** | How is the system trending *in aggregate*? | Prometheus → Grafana | Low (≤100 series/metric) |
| **Traces** | Where did *this* request spend time? | OpenTelemetry → Jaeger/Tempo | Per-request, sampled |
| **Errors** | What crashed and where? | Sentry | Per-error |

**Anti-pattern:** using metrics when you need logs (can't debug a single user), or logs when you need metrics (can't see trends). Pick by question, not by what's easy.

## 3. Project Layout
```
src/
  common/
    observability/
      logger.ts              # Pino setup + redaction
      correlation.ts         # request ID middleware
      metrics.ts             # prom-client registry
      tracing.ts             # OTel SDK init
      sentry.ts              # Sentry init + breadcrumbs
      health.ts              # /health/live, /health/ready
    shutdown.ts              # graceful shutdown helper
infra/
  grafana/
    dashboards/
    alerts/
  prometheus/
    rules.yml                # recording rules + alerts
    alerts.yml
  alertmanager/
    routes.yml
runbooks/
  <scenario>.md              # one per alert
```

## 4. The Rules (terse)

| Concern | Do | Avoid |
|---|---|---|
| Logging | Structured JSON via Pino; redaction of secrets + PII | `console.log`, free-form strings, sensitive fields |
| Correlation | One `requestId` per request; propagate to logs, traces, outbound HTTP, async jobs | Logging without a trace anchor |
| Metrics | RED for services, USE for resources; histograms for latency | Counting requests with a `userId` label |
| Tracing | Auto-instrumentation on (HTTP, DB, Redis, brokers) + manual spans for business logic | Manual spans only, no auto-instrumentation |
| Sampling | Tail-based or head-based at 1–10% in prod; 100% in dev | Sampling everything at 0% "to save money" |
| Errors | Sentry with source maps + release tags + tenant context | Sentry without source maps (useless stack traces) |
| SLOs | Defined per service; error budget tracked; alerts on burn rate | SLO defined as "be reliable" with no numbers |
| Alerts | Symptom-based (SLO burn, error rate spike, latency SLO breach) | Cause-based (CPU, memory, disk) — those are hints, not pages |
| Health | `/health/live` (am I alive), `/health/ready` (can I serve?), `/health/startup` (init done) | One `/health` endpoint that lies when DB is down |
| Dashboards | One per service (RED), one per SLO (golden signal), one for on-call (current state) | Single dashboard with 80 panels |
| Graceful shutdown | Drain in-flight requests, close DB pool, finish jobs, then exit | Kill signal → process dies mid-request |
| Cost | Track per-service spend; per-tenant rollup separately | Cost as a once-a-quarter finance exercise |
| Multi-tenant | Tenant ID in logs + traces always; in metrics only for low-cardinality counters | Per-tenant labels on histograms (OOM Prometheus) |
| Retention | Logs 30 days hot, 1 year cold; metrics 1 year; traces 7–14 days | Forever retention on everything (storage bill) |
| On-call | Rotation, escalation policy, runbook per alert | PagerDuty to whoever's laptop is open |

## 5. Core Patterns (copy these)

### 5.1 Structured logging (Pino)
```ts
// common/observability/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: process.env.SERVICE_NAME, env: process.env.NODE_ENV, version: process.env.GIT_SHA },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.secret', 'user.email'],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Per-request child logger
export const childLogger = (bindings: Record<string, unknown>) => logger.child(bindings);
```

### 5.2 Correlation ID propagation
```ts
// common/observability/correlation.ts
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

interface RequestContext { requestId: string; tenantId?: TenantId; userId?: UserId; }
export const requestStorage = new AsyncLocalStorage<RequestContext>();

export const correlationMiddleware = (req, res, next) => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  res.setHeader('x-request-id', requestId);
  const ctx = { requestId, tenantId: req.user?.tid, userId: req.user?.sub };
  req.log = logger.child(ctx);
  requestStorage.run(ctx, () => next());
};

// In any service code:
const ctx = requestStorage.getStore();
logger.info(ctx, 'processing order');
```
**Rule:** every outbound HTTP, every published message, every DB query carries `x-request-id`. Async workers extract from message headers.

### 5.3 Prometheus metrics (RED/USE)
```ts
// common/observability/metrics.ts
import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });

// RED: Rate, Errors, Duration
export const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

export const httpRequests = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

export const eventHandled = new Counter({
  name: 'events_handled_total',
  help: 'Events consumed',
  labelNames: ['type', 'result'],     // result: success | retry | dlq
  registers: [registry],
});

export const outboxPending = new Gauge({
  name: 'outbox_pending',
  help: 'Outbox events waiting to publish',
  registers: [registry],
});
```
**Cardinality rule:** if a label can have > 100 unique values in production, don't label. `userId` is forbidden. `tenantId` is allowed only on counters; never on histograms.

### 5.4 OpenTelemetry tracing
```ts
// common/observability/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export const otelSDK = new NodeSDK({
  serviceName: process.env.SERVICE_NAME,
  traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }),
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false },  // too noisy
  })],
});
otelSDK.start();

// Manual span around business logic
import { trace, SpanStatusCode } from '@opentelemetry/api';
const tracer = trace.getTracer(process.env.SERVICE_NAME!);

export const withSpan = async <T>(name: string, fn: (span: Span) => Promise<T>, attrs?: Record<string, string|number>) => {
  return tracer.startActiveSpan(name, async (span) => {
    if (attrs) span.setAttributes(attrs);
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
      throw err;
    } finally {
      span.end();
    }
  });
};

// Usage:
await withSpan('placeOrder', async (span) => {
  span.setAttribute('tenant.id', tenantId);
  span.setAttribute('order.amount', amount);
  return await doWork();
}, { 'feature.name': 'checkout' });
```

### 5.5 Error tracking (Sentry)
```ts
// common/observability/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.GIT_SHA,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    if (event.user) { delete event.user.ip_address; delete event.user.email; }
    return event;
  },
});

// In request handler
Sentry.setUser({ id: userId, tenantId });
Sentry.setTag('tenant.id', tenantId);
Sentry.setContext('request', { requestId, route });
```
**Source maps:** upload at deploy time (`@sentry/webpack-plugin` or `sentry-cli releases new -s ... files upload-sourcemaps`). Never debug a minified stack trace in prod.

### 5.6 SLOs and error budgets
```yaml
# prometheus/rules.yml
groups:
  - name: order-service-slo
    interval: 30s
    rules:
      # SLI: 99.9% availability over 30 days
      - record: slo:sli:order_availability:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{service="order",status_code=~"2.."}[5m]))
          /
          sum(rate(http_requests_total{service="order"}[5m]))

      # Fast burn (1h): consume 2% of 30-day budget in 1h → page
      - alert: OrderServiceAvailabilityFastBurn
        expr: |
          (1 - slo:sli:order_availability:ratio_rate5m) > (14.4 * (1 - 0.999))
        for: 2m
        labels: { severity: page, slo: order-availability }
        annotations:
          summary: "Order service burning error budget fast"
          runbook: "runbooks/order-availability.md"

      # Slow burn (6h): consume 5% of budget in 6h → ticket
      - alert: OrderServiceAvailabilitySlowBurn
        expr: |
          (1 - slo:sli:order_availability:ratio_rate6h) > (6 * (1 - 0.999))
        for: 30m
        labels: { severity: ticket, slo: order-availability }
```

**Multi-window multi-burn-rate** is the lazy way to alert: 1h window at 14.4x burn (page) + 6h window at 6x burn (ticket). Catches incidents fast without alert fatigue.

### 5.7 Health checks (three distinct probes)
```ts
@Controller('health')
export class HealthController {
  @Get('live') live() { return { status: 'ok' }; }                    // am I a process?

  @Get('ready') ready() {                                              // can I serve traffic?
    const checks = { db: this.db.isConnected(), redis: this.redis.ping() };
    const healthy = Object.values(checks).every(Boolean);
    return healthy ? { status: 'ok', checks } : throw new ServiceUnavailable(checks);
  }

  @Get('startup') startup() {                                          // did I finish initializing?
    return this.migrationsApplied ? { status: 'ok' } : throw new ServiceUnavailable();
  }
}
```
- **liveness**: kill pod if fails. Should never depend on external services.
- **readiness**: remove from LB if fails. Depends on DB, cache, broker.
- **startup**: give pod extra time during boot. Avoids premature kill loops.

### 5.8 Graceful shutdown
```ts
// common/shutdown.ts
export const setupGracefulShutdown = (app: INestApplication, logger: Logger) => {
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    // 1. Stop accepting new requests
    app.close();
    // 2. Wait for in-flight to finish (or timeout)
    // 3. Close DB pool, Redis, broker connections
    await Promise.allSettled([
      prisma.$disconnect(),
      redis.quit(),
      broker.close(),
    ]);
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};
```
**Why:** rolling deploys send SIGTERM. Without drain, you get 502s during deploys.

### 5.9 Alert routing (Alertmanager)
```yaml
# alertmanager/routes.yml
routes:
  - matchers: { severity="page" }
    receiver: 'on-call'
    group_wait: 30s
    group_interval: 5m
    repeat_interval: 4h
  - matchers: { severity="ticket" }
    receiver: 'tickets'
  - matchers: { team="frontend" }
    receiver: 'frontend-team'
receivers:
  - name: 'on-call'
    pagerduty_configs: [{ service_key: '...' }]
    slack_configs: [{ channel: '#oncall', title: '{{ .GroupLabels.alertname }}' }]
```

### 5.10 Dashboard design
**Three dashboard types, kept short:**
| Type | Audience | Panels |
|---|---|---|
| **Service (RED)** | Service owner | Rate, Errors, Duration, Saturation (current + 1h trend) |
| **SLO** | On-call | Error budget remaining, burn rate, multi-window |
| **On-call overview** | Whoever's paged | Active incidents, top errors (Sentry), slowest endpoints, DLQ depth |

**Anti-patterns:** 80-panel dashboards, no grouping by service, panels without units, no "current vs SLO" comparison.

### 5.11 Multi-tenant observability
```ts
// Logs: tenant_id always (Pino child logger)
// Traces: tenant_id as span attribute (cheap, searchable)
// Metrics: tenant_id ONLY on low-cardinality counters

// GOOD:
httpRequests.inc({ route: '/api/orders', status_code: '200' });
eventHandled.inc({ tenant_id: tenantId, type: 'order.placed' });   // counter, bounded
// BAD:
httpDuration.observe({ route: '/api/orders', tenant_id: tenantId, user_id: userId }, 0.5);
//   → 64 tenants × 1000 users × 50 routes = 3.2M series → Prometheus OOM
```
**Cost attribution:** separate rollup pipeline (ClickHouse / BigQuery). Don't compute per-tenant cost from the hot-path metrics.

## 6. Scaffolding Shortcuts
- One `logger.ts`, one `metrics.ts`, one `tracing.ts` per service — copy from the last service, change `serviceName`.
- Pino redaction list as a single constant.
- `withSpan(name, fn)` wrapper used by every business function.
- `setupGracefulShutdown(app, logger)` called in `main.ts`.
- `requestStorage` AsyncLocalStorage shared across HTTP + workers.
- Prometheus `/metrics` endpoint with auth (don't expose publicly).
- Source-map upload wired in CI (`sentry-cli releases new -s $GIT_SHA files upload-sourcemaps ./dist`).
- Recording rules in `prometheus/rules.yml` committed; deploy via GitOps.
- Runbook template: **Symptom → Impact → Hypothesis → Mitigation → Root cause → Action items**.

## 7. Runbook Skeleton (one per alert)
```md
# AlertName
**Severity:** page | ticket
**SLO affected:** order-availability
**Dashboard:** [link]

## Symptom
What the user sees.

## Impact
How many users, which tenants, what's broken.

## Hypothesis
Top 3 likely causes.

## Mitigation (do first, ask why later)
1. Roll back the latest deploy: `kubectl rollout undo deploy/order-service`
2. Scale up: `kubectl scale deploy/order-service --replicas=20`
3. Drain traffic to a healthy region.

## Root cause investigation
After mitigation:
1. Look at trace IDs from the affected window.
2. Check Sentry for new error types.
3. Compare dashboards before/after the deploy.

## Action items
- [ ] Add a regression test.
- [ ] Improve the alert to catch this earlier.
```

## 8. Lazy Hard-Nos
Reject on sight:
- ❌ `console.log` in production code
- ❌ Logging passwords, tokens, JWTs, PII
- ❌ Metrics with `userId` or unbounded labels
- ❌ Alert on CPU/memory/disk (cause, not symptom)
- ❌ Tracing only on HTTP boundary (async gaps are dark)
- ❌ Sentry without source maps + release tag
- ❌ Health endpoint that returns `200` always (or always checks DB → cascading failure)
- ❌ Killing pods mid-request during deploys (no graceful shutdown)
- ❌ Single 80-panel dashboard instead of focused per-service boards
- ❌ Alert without a runbook
- ❌ Alert that pages but no one knows what to do
- ❌ Sampling at 0% "to save money"
- ❌ Logs without correlation ID
- ❌ Per-tenant histograms (OOM Prometheus)
- ❌ Forever retention on logs/traces

## 9. Operations Playbook

**Incident lifecycle:**
1. **Detect** — alert fires, on-call acknowledges within 5 min.
2. **Mitigate** — rollback, scale, drain, feature-flag off. Don't debug in prod.
3. **Communicate** — status page within 15 min; updates every 30 min.
4. **Resolve** — alert clears; verify with synthetic or real-user check.
5. **Postmortem** — blameless, within 5 business days. Root cause + action items.

**Blameless postmortem template:**
- What happened (timeline)
- Impact (users affected, duration, SLO budget consumed)
- Root cause (5 Whys)
- What went well
- What went poorly
- Action items (with owners and dates)

**Capacity planning:**
- Forecast traffic from trend (linear + seasonality).
- Headroom: scale at 60% of capacity.
- Cost per tenant: rollup weekly; flag top-10.

**Cost observability:**
- Tag every resource by service, environment, tenant tier.
- Cloud cost dashboard updated daily.
- Anomaly detection on cost (3σ from trend).

## 10. SLO Cadence
- Define SLOs **before** launch. Negotiate with product.
- Review monthly: did we meet it? Should it change?
- Track error budget burn as a product metric (it competes with feature work).
- If budget exhausted → freeze non-critical deploys, prioritize reliability work.

## 11. Execution Checklist
Run through when reviewing `/observe [target]`:
1. Structured logs (Pino) with redaction + correlation IDs?
2. Prometheus metrics: RED for services, USE for resources, histograms for latency?
3. Cardinality discipline: no `userId`/`requestId` labels?
4. OpenTelemetry auto-instrumentation on (HTTP, DB, Redis, brokers)?
5. Manual `withSpan` on business-critical paths?
6. Sentry with source maps + release tags + tenant context?
7. SLOs defined per service? Recording rules committed?
8. Multi-window multi-burn-rate alerts (1h fast + 6h slow)?
9. Health probes split into live / ready / startup?
10. Graceful shutdown wired (drain + close)?
11. Alert routing via Alertmanager (page vs ticket vs team)?
12. Runbook per alert (symptom → mitigation → root cause)?
13. Dashboards per service (RED) + per SLO + on-call overview?
14. Multi-tenant context in logs + traces always; metrics only when cardinality-safe?
15. Cost observability: per-service tags, per-tenant rollup separate from hot path?

---
*If you only remember three things: alert on SLO burn, not CPU; correlation IDs on every signal; trace context propagates through async. The rest is detail.*