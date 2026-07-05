# Domain Model (Phase 2 — Information Architecture)

Design artifact for the data the platform will eventually serve. Code mirror:
[`apps/web/types/domain.ts`](../apps/web/types/domain.ts) (types) +
[`apps/web/data/divisions.json`](../apps/web/data/divisions.json) (geography seed).
No database until Phase 4 — this doc is the contract the Prisma schema will implement.

## Geography hierarchy

```
Country (Bangladesh)
└── Division (8)     — ISO 3166-2:BD letter codes: BD-A … BD-H
    └── District (64) — ISO 3166-2:BD numeric codes: BD-01 … BD-64
```

ISO 3166-2:BD codes are the canonical IDs everywhere (data files, API paths, map joins).
Bengali names, upazilas, and geometry (GeoJSON) attach later without changing the model.

| Division | Code | Districts |
|---|---|---|
| Barishal | BD-A | 6 |
| Chattogram | BD-B | 11 |
| Dhaka | BD-C | 13 |
| Khulna | BD-D | 10 |
| Rajshahi | BD-E | 8 |
| Rangpur | BD-F | 8 |
| Sylhet | BD-G | 4 |
| Mymensingh | BD-H | 4 |

## Sector taxonomy

Sectors mirror the roadmap essays that actually exist at repo root — the essays are the product;
the taxonomy indexes them. Plan.md's extra sectors are reserved names with no indicators yet.

| Sector id | Roadmap essay |
|---|---|
| `economy` | EconomicDiversification.md |
| `climate` | ClimateResilience&DeltaManagement.md |
| `education` | Education&HumanCapital.md |
| `digital-governance` | DigitalGovernance&Infrastructure.md |
| `healthcare` | Healthcare&SocialWelfare.md |
| `military` | Military&NationalSecurity.md |
| `environment` | EnvironmentalSustainability.md |
| `energy` | EnergySecurity.md |
| `divisional-restructuring` | DivisionalModels.md |
| `agriculture` | *(reserved — indicators arrive with real data, Phases 5/10)* |
| `tourism` | *(reserved)* |
| `infrastructure` | *(reserved)* |

## Indicator model

Two entities carry all statistics; time-series support is just year-keyed value rows.

```
Indicator       — what is measured
  id            slug, e.g. "gdp-growth"
  name          "GDP growth rate"
  sector        Sector (taxonomy above)
  unit          "%", "MW", "BDT bn", "per 1,000 live births", …
  source        data provenance (see metadata conventions)
  geoLevel      finest level the indicator applies to: country | division | district

IndicatorValue  — one observation
  indicatorId   → Indicator.id
  geoCode       "BD" | "BD-A".."BD-H" | "BD-01".."BD-64"
  year          integer (fiscal or calendar year per indicator definition)
  value         number
```

A time series = all `IndicatorValue` rows for one `(indicatorId, geoCode)` pair ordered by year.
No separate time-series machinery needed — Phase 8 charts and the Phase 6 API both query this shape.

## Metadata conventions

- **Units** are human-readable strings on the `Indicator`, never on values.
- **Sources**: prefer official series — BBS (Bangladesh Bureau of Statistics), Bangladesh Bank,
  World Bank, IMF, WHO, UNESCO. Cite as `"World Bank WDI"`-style short names; URLs live in the
  Phase 5 content pipeline, not the domain model.
- **geoLevel** declares the finest granularity available; values may still exist at coarser
  levels (e.g. a district-level indicator also has a national aggregate row with `geoCode: "BD"`).

## Deferred (see TODO.md Phase 2 deferred)

Upazila level, Prisma schema (Phase 4), `packages/types` extraction (Phase 3),
essay/CMS metadata (Phase 5).
