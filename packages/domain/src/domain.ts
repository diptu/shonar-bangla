/**
 * Domain model types — the code mirror of docs/domain-model.md.
 * ponytail: lives here until the Phase 3 backend becomes a second consumer,
 * then extract to packages/types.
 */

export const SECTORS = [
  "economy",
  "climate",
  "education",
  "digital-governance",
  "healthcare",
  "military",
  "environment",
  "energy",
  "divisional-restructuring",
  // reserved — no indicators until real data arrives (Phases 5/10)
  "agriculture",
  "tourism",
  "infrastructure",
] as const;

export type Sector = (typeof SECTORS)[number];

export type GeoLevel = "country" | "division" | "district";

/** ISO 3166-2:BD numeric code, e.g. "BD-13" (Dhaka district) */
export interface District {
  code: string;
  name: string;
}

/** ISO 3166-2:BD letter code, e.g. "BD-C" (Dhaka division) */
export interface Division {
  code: string;
  name: string;
  districts: District[];
}

export interface Indicator {
  /** slug, e.g. "gdp-growth" */
  id: string;
  name: string;
  sector: Sector;
  /** human-readable, e.g. "%", "MW", "BDT bn" */
  unit: string;
  /** short source name, e.g. "World Bank WDI", "BBS" */
  source: string;
  /** finest geography level the indicator applies to */
  geoLevel: GeoLevel;
}

/** One observation; a time series = all rows for (indicatorId, geoCode) ordered by year */
export interface IndicatorValue {
  indicatorId: Indicator["id"];
  /** "BD" | division code | district code */
  geoCode: string;
  year: number;
  value: number;
}
