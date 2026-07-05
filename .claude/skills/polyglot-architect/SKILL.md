---
name: polyglot-persistence-architect
description: >
  Polyglot persistence architect. Right store per access pattern,
  Postgres-first, projection patterns, cache discipline, vector and
  search scaling. Use when designing or reviewing data architectures
  that use multiple database technologies.
---

# Polyglot Persistence Architect

## Trigger
`/persistence [path|service_name]` — review or scaffold a multi-store data architecture against this rubric.

## 1. The Lazy Doctrine
- **Postgres first. Always.** Most "polyglot" setups are premature optimization. Add a new store only after measured pain — never because "we might need it later."
- **One source of truth per concept.** Postgres is the system of record. Every other store is a derived projection you can rebuild.
- **CDC over dual-write.** Never `INSERT INTO postgres; INSERT INTO search; INSERT INTO cache` from app code. Publish an event; let consumers project.
- **Cache invalidation, not freshness.** TTL + event-driven invalidation beats trying to keep cache and DB in lockstep.
- If a bullet below contradicts "is this actually measuring pain or just vibes?", ignore the bullet.

## 2. The Storage Selection Matrix (pick by access pattern)

| Access pattern | Default store | Graduate to | When to graduate |
|---|---|---|---|
| Transactional CRUD, strong consistency, joins | **Postgres** | CockroachDB / Spanner | Multi-region active-active |
| Sub-ms key-value lookups, sessions, rate limits | **Redis** | DragonflyDB / KeyDB | When Redis is the bottleneck (>100k ops/s/instance) |
| Full-text search + faceting + relevance ranking | **Postgres FTS / pg_trgm** | OpenSearch / Elasticsearch | When relevance ranking matters AND >1M docs AND complex analyzers |
| Sub-second analytics over billions of rows | **Postgres materialized views / TimescaleDB** | ClickHouse / DuckDB | When p95 analytical query > 5s AND > 100M rows |
| Vector similarity (RAG, semantic search, dedup) | **pgvector** | Qdrant / Pinecone / Weaviate | When > 1M vectors AND need specialized ANN (HNSW params, filtering speed) |
| Time-series high ingest | **TimescaleDB / Postgres + BRIN** | InfluxDB / Mimir | When ingest > 50k rows/s sustained |
| Graph / recursive relationships | **Postgres recursive CTEs** | Neo4j / Memgraph | When joins > 5 hops AND pattern is the dominant query |
| Large blobs (files, images, video, backups) | **S3 / Azure Blob / GCS** | (none — this is the right answer) | Never. |
| Queue / event log persistence | **BullMQ + Redis** / RabbitMQ / Kafka | Same | Don't graduate without rewriting consumers |
| Wide-column / sparse data | **Postgres JSONB + GIN** | DynamoDB / Cassandra | When > 100GB sparse rows AND access pattern is single-key |
| Ledger / append-only audit | **Postgres + append-only table** | QLDB / immudb | When cryptographic proof of integrity is required |

**Heuristic:** if you can't write the sentence "our p95 query is X ms over Y million rows, and here's the user-visible pain", you don't need a new store.

## 3. The "Pain Tests" (escape Postgres when…)

Add a new store only when you've measured one of these:

| Store | Test that justifies adding it |
|---|---|
| **Redis** | DB read latency p95 > 50ms AND request volume > 1k rps AND data is cacheable |
| **OpenSearch** | Text search results are obviously wrong to users AND > 1M docs AND language-specific analyzers matter |
| **ClickHouse** | Analytics dashboard query > 5s p95 AND > 100M source rows AND query can't be pre-aggregated |
| **pgvector** | You need cosine similarity AND < 1M vectors → pgvector. > 1M with HNSW tuning → Qdrant/Pinecone. |
| **Dedicated queue** (Kafka) | Multiple independent consumers needing replay OR stream processing |
| **Object storage** | Files > 1MB OR you serve images/video OR backups are bloating Postgres |

**Anti-pattern:** "we might want AI later, so let's add Pinecone on day one." You don't have vectors yet. When you do, pgvector is fine for the first 1M.

## 4. Project Layout
```
src/
  modules/
    <feature>/
      service.ts
      repository.ts            # Postgres
  common/
    persistence/
      postgres.ts              # PrismaClient + RLS context setter
      cache.ts                 # Redis client + helpers
      search.ts                # OpenSearch client + indexer
      analytics.ts             # ClickHouse client + query helpers
      vectors.ts               # pgvector helpers
      storage.ts               # S3 client + signed URLs
      projection.ts            # CDC consumer base class
  infra/
    cdc/
      debezium/                # Postgres → Kafka
      outbox-relay.ts          # alternative: outbox pattern
    etl/
      pg-to-clickhouse.ts
      pg-to-opensearch.ts
infra/
  postgres/
  redis/
  opensearch/
  clickhouse/
```

## 5. The Rules (terse)

| Concern | Do | Avoid |
|---|---|---|
| Source of truth | Postgres is system of record for everything transactional | Writing business data to Redis/ES first |
| Adding a store | After measured pain + written justification | "Just in case" |
| Sync mechanism | CDC (Debezium) or outbox-relay → consumer projects to derived store | App-code dual-write to multiple stores |
| Caching | Cache-aside + event-driven invalidation + sane TTL | Write-through without invalidation; cache as primary |
| Cache key naming | `tenant:{tenantId}:entity:{id}:version` (version = updated_at) | `entity:{id}` (no tenant; cross-tenant leaks) |
| Cache stampede | `SETNX` lock or jittered TTL refresh | All instances re-fetch at same TTL boundary |
| Hot keys | Single-key sharding, replica fan-out, or local in-process cache | Adding more Redis nodes (won't help a hot key) |
| Search index | Single source from Postgres via CDC; per-tenant index alias | App writes to search index directly |
| Search freshness | Document expected lag in dashboard; eventual consistency is fine | Treating search index as authoritative |
| Reindexing | Zero-downtime via index alias + atomic swap | Drop + recreate with downtime |
| Analytics | Pre-aggregate via materialized views in Postgres first; ClickHouse when measured | ClickHouse for operational queries (it's for analytics) |
| Vector search | pgvector until 1M vectors OR specialized filtering | Vector DB on day one without measuring |
| Object storage | S3 + signed URLs (time-limited) + CloudFront CDN; keys tenant-scoped | Public ACLs; predictable keys |
| Multi-tenant isolation | Tenant key in every Redis/ES/S3 path | Single global namespace |
| Backups | Per-store backup strategy; tested restore; documented RPO/RTO | Postgres backups only; "we'll figure out Redis later" |
| Monitoring | Per-store: latency, error rate, saturation, capacity | Single global "DB is up" check |
| Cost | Tag every store by service + tenant tier; review monthly | Cost surprise every quarter |

## 6. Core Patterns (copy these)

### 6.1 Cache-aside (default read pattern)
```ts
export const cached = async <T>(
  key: string,
  ttlSec: number,
  loader: () => Promise<T | null>,
): Promise<T | null> => {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit) as T;
  const fresh = await loader();
  if (fresh !== null) await redis.setex(key, ttlSec, JSON.stringify(fresh));
  return fresh;
};

// Usage:
const user = await cached(
  `tenant:${tenantId}:user:${userId}`,
  300,
  () => prisma.user.findUnique({ where: { id: userId } }),
);
```

### 6.2 Event-driven cache invalidation
```ts
// On user.updated event → invalidate cache
@EventHandler('user.updated.v1')
async onUserUpdated(evt: Envelope<UserUpdated>) {
  await redis.del(`tenant:${evt.tenantId}:user:${evt.data.userId}`);
}

// On user.deleted → invalidate + emit projection
@EventHandler('user.deleted.v1')
async onUserDeleted(evt: Envelope<UserDeleted>) {
  await redis.del(`tenant:${evt.tenantId}:user:${evt.data.userId}`);
  await this.search.deleteUser(evt.data.userId);
}
```
**Why event-driven:** single place for "what happens when user changes" — easier than scattering invalidation logic across services.

### 6.3 Stampede protection
```ts
export const cachedWithLock = async <T>(
  key: string, ttlSec: number, loader: () => Promise<T>,
): Promise<T> => {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit);
  const lockKey = `${key}:lock`;
  const got = await redis.set(lockKey, '1', 'EX', 10, 'NX');
  if (got !== 'OK') {
    // Another instance is loading; wait + retry
    await new Promise(r => setTimeout(r, 100));
    return cachedWithLock(key, ttlSec, loader);
  }
  try {
    const fresh = await loader();
    await redis.setex(key, ttlSec, JSON.stringify(fresh));
    return fresh;
  } finally {
    await redis.del(lockKey);
  }
};
```

### 6.4 Read replicas + connection pooling
```ts
// Prisma: use a separate read replica URL for reads
const prismaWrite = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const prismaRead  = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_READ_URL } } });

// Prisma 5+: use read replicas feature natively
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } }).$extends({
  query: {
    $allOperations({ args, query, operation }) {
      if (READ_ONLY_OPS.has(operation)) return prismaRead.$transaction([args]).then(r => r[0]);
      return query(args);
    },
  },
});
```
**Rule:** write to primary, read from replica. Lag is usually < 100ms; document it.

### 6.5 Search indexing (projection from Postgres)
```ts
// CDC consumer: Postgres → OpenSearch
@EventHandler('article.published.v1')
async onArticlePublished(evt: Envelope<ArticlePublished>) {
  const article = await prisma.article.findUnique({ where: { id: evt.data.articleId } });
  if (!article) return;
  await this.searchClient.index({
    index: `articles-${tenant(evt.tenantId)}`,
    id: article.id,
    body: {
      title: article.title,
      body: article.body,
      tags: article.tags,
      publishedAt: article.publishedAt,
      tenantId: article.tenantId,
    },
  });
}
```
**Lazy rule:** the search document is built from Postgres state, not from the event payload. Eliminates "search index drift" bugs.

### 6.6 Zero-downtime reindexing
```ts
// 1. Create new index with new mapping
await os.indices.create({ index: 'articles-v2', body: newMapping });
// 2. Reindex via alias (both indexes live)
await os.indices.putAlias({ index: 'articles-v2', name: 'articles' });
await os.indices.updateAliases({
  body: { actions: [{ remove: { index: 'articles-v1', alias: 'articles' } }] }
});
// 3. Backfill (CDC replay or scheduled job)
// 4. Atomic swap
await os.indices.updateAliases({
  body: { actions: [{ add: { index: 'articles-v2', alias: 'articles' } }, { remove: { index: 'articles-v1', alias: 'articles' } }] }
});
// 5. Delete old
await os.indices.delete({ index: 'articles-v1' });
```

### 6.7 Analytics via CDC → ClickHouse
```ts
// ETL consumer: Postgres → ClickHouse
@EventHandler('*.v1')  // any event
async onAnyEvent(evt: Envelope<unknown>) {
  await clickhouse.insert({
    table: 'events',
    values: [{
      event_id: evt.id,
      event_type: evt.type,
      tenant_id: evt.tenantId,
      occurred_at: evt.time,
      payload: JSON.stringify(evt.data),
    }],
    format: 'JSONEachRow',
  });
}
```
**Lazy win:** the event bus IS your ETL pipeline. You already have the events; just add a consumer that writes to ClickHouse.

### 6.8 Vector search (pgvector)
```ts
// Find similar documents
export const findSimilar = async (tenantId: TenantId, embedding: number[], limit = 10) => {
  return prisma.$queryRaw<Array<{ id: string; similarity: number }>>`
    SELECT id, 1 - (embedding <=> ${embedding}::vector) AS similarity
    FROM documents
    WHERE tenant_id = ${tenantId}::uuid
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${embedding}::vector
    LIMIT ${limit};
  `;
};

// HNSW index for scale (millions of vectors)
await prisma.$executeRaw`CREATE INDEX documents_embedding_hnsw ON documents USING hnsw (embedding vector_cosine_ops);`;
```
**Rule:** pgvector until 1M vectors. HNSW index makes <1M queries < 50ms. Don't add Pinecone yet.

### 6.9 Object storage (S3) with signed URLs
```ts
export const uploadUrl = async (tenantId: TenantId, filename: string, contentType: string) => {
  const key = `tenants/${tenantId}/uploads/${randomUUID()}-${sanitize(filename)}`;
  const url = await s3.getSignedUrl('putObject', {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: 300,           // 5 minutes
    ContentType: contentType,
  });
  return { url, key };
};

export const downloadUrl = async (tenantId: TenantId, key: string) => {
  if (!key.startsWith(`tenants/${tenantId}/`)) throw new ForbiddenError(); // tenant scoping
  return s3.getSignedUrl('getObject', { Bucket: process.env.S3_BUCKET, Key: key, Expires: 3600 });
};
```
**Lazy rule:** time-limited signed URLs, scoped to tenant prefix, behind CloudFront/CDN.

### 6.10 Multi-tenant data across stores
```ts
// Redis key:    tenant:{tenantId}:user:{userId}
// ES index:     users-{tenantId}  OR  shared index with tenantId filter (alias pattern)
// S3 key:       tenants/{tenantId}/...
// ClickHouse:   WHERE tenant_id = {tenantId} on every query
```
**Convention:** every key/index/path includes `tenantId`. No shared global namespace for tenant data.

### 6.11 Eventual consistency between stores
- **Document expected lag** in dashboards ("search index up to 5s behind").
- **Don't promise read-your-writes** across stores. If a user creates a doc and searches for it, they'll see it after the next projection tick.
- **For read-your-writes when needed:** write to DB → trigger projection immediately → return when projection completes (rare; usually not worth it).
- **Compensating action:** "did you mean to search?" — offer search-as-of-write for impatient users.

### 6.12 Migration strategy when adding a new store
1. Add the store to infra (compose file, secrets, monitoring).
2. Build projection consumer (Postgres → new store via CDC).
3. Backfill (initial dump or replay events from outbox).
4. Read from new store behind feature flag (canary).
5. Validate: same answer for known queries within lag tolerance.
6. Cut over reads; keep new store for writes via CDC.
7. Remove old read path; document the new one.

## 7. Scaffolding Shortcuts
- `common/persistence/{postgres,cache,search,analytics,vectors,storage}.ts` — one file per store with the connection + helpers.
- `cached(key, ttl, loader)` and `cachedWithLock(...)` — cache helpers reused everywhere.
- `Projection` base class for CDC consumers: handles idempotency + tracing + retry.
- Per-store health check: `/health/ready` includes `db.ping()`, `redis.ping()`, `os.ping()`, `ch.ping()`.
- Backup script per store with restore drill quarterly.
- Cost dashboard per store (Grafana + cloud billing export).
- Document store-choice rationale in `docs/data-architecture.md` (so the next dev doesn't add a 7th store without thinking).

## 8. Operations Playbook (per store)

**Postgres:**
- Backup: daily base + WAL archiving (PITR). Test restore monthly.
- Monitor: replication lag, long queries, lock waits, bloat.
- Scale: vertical until 80%; then read replicas; then partitioning; then sharding (rare).

**Redis:**
- Backup: AOF + RDB; assume cache loss is OK (rebuildable from Postgres).
- Monitor: memory, eviction rate, hit rate, hot keys.
- Scale: cluster mode when single-node > 80% memory OR ops > 100k/s.

**OpenSearch:**
- Backup: snapshots to S3; test restore.
- Monitor: JVM heap, search latency, indexing lag, shard count.
- Scale: shards should be 10–50 GB each; reindex when too many.

**ClickHouse:**
- Backup: snapshots to S3; assume analytics is rebuildable from CDC.
- Monitor: query latency, parts count, merge speed, disk.
- Scale: vertical first; sharding by tenant_id when > 10TB per node.

**pgvector:**
- Backup: same as Postgres (it's just rows + indexes).
- Monitor: index size, query latency, recall (sample-based).
- Scale: HNSW parameters + partitioning by tenant.

**S3:**
- Backup: versioning + cross-region replication for critical buckets.
- Monitor: request rate (per prefix for hot-spot detection), 4xx/5xx.
- Scale: it's already infinitely scalable; pay attention to cost (lifecycle to Glacier).

## 9. Lazy Hard-Nos
Reject on sight:
- ❌ Adding a new store "in case we need it"
- ❌ Using Redis/ES/ClickHouse as system of record
- ❌ App-code dual-write to multiple stores
- ❌ Cache key without `tenantId` in the path
- ❌ Public S3 ACLs
- ❌ ES index without sync strategy (will drift)
- ❌ ClickHouse for operational queries (use Postgres)
- ❌ Vector DB on day one without measuring
- ❌ Search index mapping without alias (no zero-downtime reindex possible)
- ❌ Store without backup strategy
- ❌ Store without tenant scoping
- ❌ Storing PII in multiple stores (compliance nightmare)
- ❌ Read from primary when replica would do
- ❌ Single global health check that masks store-specific failures

## 10. Cost Discipline
- Each store has its own cost metric; total per-service per-tenant.
- Set alerts at 1.5x baseline; investigate at 2x.
- Lifecycle policies: hot 30d → warm 90d → cold 1y → archive.
- Right-size: most teams over-provision Redis/OpenSearch by 3–5x. Measure.
- Tag-based cost attribution surfaces "which feature/tenant is expensive."

## 11. Execution Checklist
Run through when reviewing `/persistence [target]`:
1. Postgres is system of record for transactional data?
2. New store additions justified by measured pain (not "just in case")?
3. Sync via CDC or outbox-relay, not app-code dual-write?
4. Cache keys include `tenantId`; invalidation via events?
5. Cache stampede protection on hot paths?
6. Read replicas for read-heavy workloads?
7. Search index built from Postgres via projection (not from events)?
8. Zero-downtime reindexing via alias pattern documented?
9. Analytics pipeline via CDC → ClickHouse (not app writes)?
10. Vector search uses pgvector (not Pinecone) until measured need?
11. Object storage via signed URLs + CDN; tenant-scoped keys?
12. Every store has backup + tested restore + RPO/RTO documented?
13. Per-store health check in `/health/ready`?
14. Per-store cost monitoring + alerting at 1.5x baseline?
15. Documented choice rationale per store in `docs/data-architecture.md`?

*If you only remember three things: Postgres first, add stores after measured pain; CDC over dual-write; cache invalidation via events, not freshness chasing. The rest is detail.*
---