---
name: event-driven-microservices-architect
description: >
  Event-driven microservices architect. Reliable async, idempotency,
  sagas, outbox, DLQs, schema evolution, tracing. Use when designing
  or reviewing any system that uses RabbitMQ, Kafka, BullMQ, NATS, or
  similar message brokers.
---

# Event-Driven Microservices Architect

## Trigger
`/events [path|service_name]` — review or scaffold an event-driven system against this rubric.

## 1. The Lazy Doctrine
- **Pick one tool per use case.** Don't run Kafka + RabbitMQ + BullMQ without a written reason for each.
- **Outbox, not dual-write.** Never publish to a broker from inside a business transaction. Write to DB; relay to broker separately.
- **Idempotency is non-negotiable.** Every consumer must dedupe by a stable event ID. Treat "we'll add it later" as a future outage.
- **Async bugs are silent.** Tracing through message boundaries is opt-in but the cheapest insurance you can buy.
- If a bullet below contradicts "did the broker/framework already solve this?", ignore the bullet.

## 2. Pick Your Tool (decide per use case, write the reason)

| Tool | Best for | Avoid for | Key trait |
|---|---|---|---|
| **BullMQ** (Redis) | Scheduled jobs, retries, rate-limited tasks, delayed work, single-execution semantics | Multi-consumer fanout, replay, stream processing | Task queue. Easy. Not durable across Redis loss unless persistence configured. |
| **RabbitMQ** | Service-to-service messaging, complex routing, pub/sub with topic/headers exchanges, moderate throughput | Replay from history, 100k+ msg/s, stream analytics | Broker. Routing-rich. Messages are ephemeral (unless you use quorum queues). |
| **Kafka** | Event log / sourcing, multiple independent consumers, replay, stream processing, high throughput | Small workloads, "just queue this job" | Append-only log. Durable. Replayable. Heavy to operate. |
| **NATS / Redis Streams** | Lightweight pub/sub, low ops, edge / IoT | Compliance / replay / large fanout | Simple. Ephemeral by default. |

**Heuristic:** if you can't write a one-line justification for Kafka, use RabbitMQ or BullMQ. Kafka pays off only when (a) you need replay, (b) you have ≥3 independent consumers per event, or (c) you're doing stream processing.

**Default Shonar-Bangla-style stack:** BullMQ for in-app scheduled jobs (PDF, email, retries); RabbitMQ for service-to-service commands/events with routing; Kafka only if you add event sourcing or analytics consumers.

## 3. Project Layout
```
src/
  modules/
    <feature>/
      service.ts
      handlers/             # event handlers, idempotent
      publishers.ts         # writes to outbox only
  common/
    messaging/
      outbox.ts             # OutboxRepo + relay loop
      envelope.ts           # CloudEvents envelope
      consumer.ts           # idempotency wrapper
      saga.ts               # saga state machine helpers
      tracing.ts            # OTel context inject/extract
      schema-registry.ts    # schema versioning
  infra/
    workers/
      outbox-relay.ts       # separate process
      saga-runner.ts
      dlq-inspector.ts
  schemas/                  # versioned event contracts
    order/
      v1.json
      v2.json
packages/
  event-types/              # generated TS types from schemas
test/
  events/
    replay-harness.ts       # replays a recorded stream
```

## 4. The Rules (terse)

| Concern | Do | Avoid |
|---|---|---|
| Publishing | Outbox table inside DB transaction; relay worker drains to broker | `kafka.send()` inside `prisma.$transaction()` (dual-write) |
| Consumer dedup | Store `event.id` in `processed_events` table; check-then-insert in one transaction | Trusting "we'll only deliver once" (you won't) |
| Consumer errors | Exponential backoff with jitter, finite attempts → DLQ | Retry forever / no max attempts / no DLQ |
| Saga state | Persist saga state in DB; transitions as pure functions | In-memory saga that loses progress on crash |
| Event schema | Versioned (`v1`, `v2`); backward-compatible additions only | Renaming/removing fields without version bump |
| Schema registry | Avro/Protobuf with Confluent or Apicurio; or JSON Schema + GitOps | "Just send JSON, we'll figure it out" |
| Tracing | Inject W3C `traceparent` into message headers; extract on consume | Spans that start and stop at HTTP boundary only |
| Topic naming | `<domain>.<aggregate>.<action>` (e.g., `order.placed`); per-version topics optional | Free-form names, no domain prefix |
| Partition key | Aggregate ID (e.g., `orderId`) — guarantees per-aggregate ordering | Random key / round-robin when order matters |
| Multi-tenant routing | Tenant in payload + header; consumer filters early; per-tenant quotas | Single global consumer that post-filters by tenant |
| Idempotency key | `<eventId>` stable; producer mints UUIDv7; never re-derived | Hash of payload (collisions on re-publish) |
| Failure visibility | DLQ depth metric; alert on age, not just count | "We'll check the logs" |
| Replay | Kafka: `kafka-consumer-groups.sh --reset-offsets`; BullMQ: re-add jobs with same id | No documented replay procedure |
| Consumer concurrency | Tunable per queue; idempotency makes concurrency safe | Single-threaded by reflex (it's often wrong) |
| Cron / scheduled | BullMQ repeatable jobs with `jobId` for idempotency | Cron that re-fires after manual run |
| Broker outage | Outbox keeps accumulating; circuit breaker on publisher | Crashing the producer when broker is down |

## 5. Core Patterns (copy these)

### 5.1 Outbox (the load-bearing pattern)
```ts
// Common transactional publish
await prisma.$transaction(async (tx) => {
  await tx.order.update({ where: { id }, data: { status: 'paid' } });
  await tx.outbox.create({
    data: {
      id: crypto.randomUUID(),                 // event ID (stable, UUIDv7)
      type: 'order.paid.v1',
      aggregateId: id,
      payload: { orderId: id, amount, currency },
      occurredAt: new Date(),
    },
  });
});

// Outbox relay (separate process / worker)
async function relayOnce(kafka: Producer) {
  const batch = await prisma.outbox.findMany({
    where: { publishedAt: null },
    orderBy: { occurredAt: 'asc' },
    take: 100,
  });
  for (const evt of batch) {
    await kafka.send({
      topic: evt.type,
      messages: [{
        key: evt.aggregateId,                 // partition by aggregate
        value: JSON.stringify(envelope(evt)), // CloudEvents envelope
      }],
    });
    await prisma.outbox.update({
      where: { id: evt.id },
      data: { publishedAt: new Date() },
    });
  }
}
setInterval(() => relayOnce(kafka).catch(console.error), 1000);
```
**Why:** DB transaction is atomic. Broker publish can fail and retry without losing data. Solves dual-write at the source.

### 5.2 Idempotent consumer (mandatory wrapper)
```ts
async function consume<T>(event: Envelope<T>, handler: (e: Envelope<T>) => Promise<void>) {
  const result = await prisma.$transaction(async (tx) => {
    const seen = await tx.processedEvent.findUnique({ where: { id: event.id } });
    if (seen) return { skipped: true };
    await handler(withTenantContext(event, () => tx));
    await tx.processedEvent.create({ data: { id: event.id, type: event.type, processedAt: new Date() } });
    return { skipped: false };
  });
  if (!result.skipped) metrics.increment('events.handled', { type: event.type });
}
```
**Rule:** every consumer calls `consume()` first. No exceptions.

### 5.3 CloudEvents envelope (standard)
```ts
type Envelope<T> = {
  id: string;                  // UUIDv7 — stable, dedup key
  source: string;              // '/services/order-service'
  type: string;                // 'order.paid.v1'
  specversion: '1.0';
  time: string;                // ISO-8601
  datacontenttype: 'application/json';
  dataschema: string;          // 'https://schemas.app/order/v1.json'
  tenantId: TenantId;          // for multi-tenant
  subject: string;             // aggregateId (e.g., order ID)
  traceparent?: string;        // W3C trace context
  tracestate?: string;
  data: T;
};
```
**Lazy win:** every consumer already knows `id` (dedup), `type` (routing), `time` (lag metrics), `traceparent` (tracing). Don't reinvent per service.

### 5.4 Saga — orchestration (when flows are non-trivial)
```ts
type OrderSagaState = 'pending' | 'payment_authorized' | 'inventory_reserved' | 'completed'
                    | 'payment_failed' | 'inventory_failed' | 'compensating';

class OrderSaga {
  async handle(evt: DomainEvent) {
    const saga = await this.repo.findByAggregate(evt.subject);
    const next = transition(saga.state, evt); // pure function, easy to test
    if (next.compensations.length) await this.runCompensations(saga, next.compensations);
    await this.repo.save({ ...saga, state: next.state, updatedAt: new Date() });
    for (const cmd of next.commands) await this.outbox.enqueue(cmd);
  }
}
```
**Pure `transition(state, event) → { state, commands, compensations }`** is the lazy part — it's a 50-line switch, fully unit-testable, no broker mock needed.

### 5.5 Saga — choreography (when flows are simple)
```ts
// Inventory service reacts to order.placed
@EventHandler('order.placed.v1')
async onOrderPlaced(evt: Envelope<OrderPlaced>) {
  await consume(evt, async () => {
    const reserved = await this.inventoryService.tryReserve(evt.data.items);
    if (reserved) await this.outbox.enqueue({ type: 'inventory.reserved.v1', aggregateId: evt.subject, ... });
    else await this.outbox.enqueue({ type: 'inventory.rejected.v1', ... });
  });
}
```
**Use choreography when:** <4 steps, no compensations needed, low coupling between services. **Use orchestration when:** you need a single view of "where is this order in the flow?", or there are compensations.

### 5.6 DLQ strategy
```ts
// BullMQ
new Queue('emails', {
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },  // 2s, 4s, 8s, 16s, 32s + jitter
    removeOnComplete: { age: 3600 },
    removeOnFail: { count: 1000 },                  // keep last 1000 failures for inspection
  },
});

// RabbitMQ: bind a DLX (dead-letter exchange) to the main queue
// Kafka: use a separate `<topic>.dlq` consumer
```
**Alerting:** DLQ depth (immediate) + age of oldest DLQ message (lazy — usually the real signal).

### 5.7 Tracing through async (W3C trace context)
```ts
// Producer
const headers = {};
propagation.inject(context.active(), headers);  // OTel auto-injects traceparent
await producer.send({ topic, messages: [{ headers, value }] });

// Consumer
const ctx = propagation.extract(context.active(), msg.headers);
context.with(ctx, () => {
  const span = tracer.startSpan(`consume ${msg.topic}`, { kind: SpanKind.CONSUMER });
  // ... process
  span.end();
});
```
**Result:** one trace ID spans HTTP request → DB write → outbox → Kafka → consumer → DB write. Without it, async bugs are invisible.

### 5.8 Schema evolution (backward-compatible only)
- **Add field with default**: ✅ backward compatible.
- **Add field without default**: ❌ breaks old consumers.
- **Rename/remove field**: ❌ requires new version (`v2`).
- **Change field type**: ❌ requires new version.

Use **JSON Schema** in `schemas/<domain>/v<n>.json` + GitOps deploy, or **Avro/Protobuf** with Confluent/Apicurio registry. Generate TS types in `packages/event-types/` — never hand-type.

### 5.9 Multi-tenant events
```ts
// Producer: include tenant in envelope + payload
type: 'order.paid.v1', tenantId, data: { ... }

// Consumer: filter early, propagate context
const { tenantId } = evt;
if (!this.tenantActive(tenantId)) return; // skip paused tenants
await tenantStorage.run({ tenantId, ... }, () => consume(evt, handler));

// Per-tenant rate limit at broker level via topic + consumer group per plan tier
```
**Multi-tenant lazy rule:** tenant context goes in the envelope AND the message header AND is restored via `tenantStorage.run` on consume. Never assume tenant from aggregate.

### 5.10 BullMQ patterns (cheat sheet)
```ts
// Idempotent scheduled job
await queue.add('send-reminder', { tenantId, userId },
  { jobId: `${tenantId}:reminder:${userId}`, delay: 24 * 3600 * 1000 });

// Rate-limited worker (e.g., 10 jobs/sec to a third-party API)
new Worker('external-api', handler, {
  limiter: { max: 10, duration: 1000 },
  concurrency: 5,
});

// Recurring job (with idempotent jobId)
await queue.add('nightly-rollup', {},
  { jobId: 'nightly-rollup', repeat: { pattern: '0 2 * * *', tz: 'Asia/Dhaka' } });
```

## 6. Scaffolding Shortcuts (set up once, forget forever)
- `OutboxRepo` + `enqueue(event)` helper that auto-sets `id`, `occurredAt`, `tenantId`.
- `consume(envelope, handler)` wrapper that does idempotency + tracing + metrics.
- `envelope(event)` serializer producing CloudEvents-compliant output.
- `withTenantContext(event, fn)` extracted once, reused by every consumer.
- Saga transitions as **pure functions** in `sagas/<name>.transition.ts` — easily tested.
- `dlq-inspector` CLI tool: list, replay, or drop dead-lettered messages.
- `event-types` package generated from `schemas/` via `json-schema-to-typescript` or `avro-to-typescript`.
- Local dev: **single-process broker** (RabbitMQ in docker; or `embedded-kafka`/`@confluentinc/kafka-javascript`); switch to managed in prod.

## 7. Lazy Hard-Nos
Reject on sight:
- ❌ Publishing to broker inside a DB transaction (dual-write)
- ❌ Consumer without idempotency / dedup
- ❌ Retry without max attempts → infinite loop
- ❌ Saga state in memory (lost on restart)
- ❌ Renaming/removing event fields without version bump
- ❌ Mixing event types on one topic (use different topics or discriminated payloads)
- ❌ Consumer that throws on `processingError` instead of NACK-ing with retry
- ❌ No DLQ + no alerting on DLQ depth
- ❌ `JSON.parse(message)` without envelope validation
- ❌ Tracing only on HTTP boundary (async gaps are dark)
- ❌ Kafka chosen because "we might need it later"
- ❌ Random partition key (breaks per-aggregate ordering)
- ❌ Per-tenant logic that requires querying the DB on every event (cache tenant plan in worker)
- ❌ No replay runbook (you'll write it during the outage)
- ❌ Hand-rolled event schemas (drift; one team uses snake_case, another camelCase)

## 8. Operations Playbook

**Inspecting a stuck DLQ:**
1. `dlq-inspector list --queue <name> --limit 50`
2. Look at `id`, `tenantId`, `type`, `error`, `originalPayload`, `traceparent`.
3. Replay: `dlq-inspector replay <id>` → republishes to source topic.
4. Drop: `dlq-inspector drop <id>` (with audit log entry).

**Schema migration (adding field to existing event):**
1. Add field as **optional** in `schemas/<domain>/v<n+1>.json`.
2. Producers updated to set field; consumers ignore if absent.
3. After all consumers deployed, change to required + bump version.

**Schema migration (breaking change):**
1. Publish `v<n+1>` to new topic (or new version-suffixed topic).
2. Run both for migration period; producers dual-emit if backward compatibility requires.
3. Old topic retired after retention + last consumer migration.

**Replay from Kafka:**
```bash
kafka-consumer-groups.sh --bootstrap-server $BS \
  --group <group> --topic <topic> \
  --reset-offsets --to-datetime 2026-07-05T00:00:00Z \
  --execute
```

**Outbox backpressure:** if relay falls behind, scale out relay workers (each grabs disjoint batch via `FOR UPDATE SKIP LOCKED`). If persistent, increase consumer-side concurrency or scale partition count.

**Broker outage:** producers don't fail (outbox accumulates). Relays retry with backoff. Alert on `outbox.pending` gauge. Drain on broker recovery.

## 9. Testing Strategy
- **Unit:** pure `transition(state, event)` for sagas — no broker needed.
- **Integration:** Testcontainers for Postgres + Kafka/RabbitMQ. Assert idempotency: send same event twice, handler called once.
- **Contract:** Pact (consumer-driven) — consumer defines expected schema, producer is verified in CI.
- **Replay:** record a real event stream to a file; replay into a fresh consumer; assert state matches.
- **Chaos:** kill the broker mid-test; assert no data loss (outbox catches it).

## 10. Execution Checklist
Run through when reviewing `/events [target]`:
1. Tool per use case justified in writing (RabbitMQ / Kafka / BullMQ)?
2. Outbox pattern in place? Zero direct broker publishes from request handlers?
3. Every consumer dedupes by `event.id` via `processed_events` table?
4. DLQ configured per queue? Alerts on depth + age?
5. Retries exponential with jitter + finite max attempts?
6. Event schemas versioned? Generated TS types, not hand-typed?
7. Saga state persisted in DB? Transitions testable as pure functions?
8. Tracing context propagated through every message header?
9. Multi-tenant events carry `tenantId` and rehydrate context on consume?
10. Partition key = aggregate ID where ordering matters?
11. Replay runbook documented (Kafka offsets / BullMQ re-add)?
12. Local dev uses single-process broker (Docker or embedded)?
13. Contract tests (Pact) between producer + consumer services?
14. Chaos test: kill broker mid-traffic; assert no data loss?

---
*If you only remember three things: outbox for publishing, idempotent consumers (always), tracing through async boundaries. The rest is detail.*
