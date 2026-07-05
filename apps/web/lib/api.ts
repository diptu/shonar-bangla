const API_URL = process.env.API_URL ?? "http://localhost:3001";

/** null = API unreachable or non-200 — pages render honest empty states. */
export async function api<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/v1${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Prisma rows are the domain types + DB ids; the extras are harmless to render. */
export interface ValueRow {
  indicatorId: string;
  geoCode: string;
  year: number;
  value: number;
}
