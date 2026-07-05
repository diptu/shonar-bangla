import type { Sector } from "./domain";

/** A roadmap essay at repo root; slug (URL) = sector id, file resolved here so
 *  the `&`-named files never leak into URLs. */
export interface Essay {
  sector: Sector;
  title: string;
  file: string;
}

export const ESSAYS: Essay[] = [
  { sector: "economy", title: "Economic Diversification", file: "EconomicDiversification.md" },
  {
    sector: "climate",
    title: "Climate Resilience & Delta Management",
    file: "ClimateResilience&DeltaManagement.md",
  },
  {
    sector: "education",
    title: "Education & Human Capital",
    file: "Education&HumanCapital.md",
  },
  {
    sector: "digital-governance",
    title: "Digital Governance & Infrastructure",
    file: "DigitalGovernance&Infrastructure.md",
  },
  {
    sector: "healthcare",
    title: "Healthcare & Social Welfare",
    file: "Healthcare&SocialWelfare.md",
  },
  {
    sector: "military",
    title: "Military & National Security",
    file: "Military&NationalSecurity.md",
  },
  {
    sector: "environment",
    title: "Environmental Sustainability",
    file: "EnvironmentalSustainability.md",
  },
  { sector: "energy", title: "Energy Security", file: "EnergySecurity.md" },
  {
    sector: "divisional-restructuring",
    title: "Divisional Models",
    file: "DivisionalModels.md",
  },
];
