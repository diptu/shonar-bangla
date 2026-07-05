import type { District, Division } from "./domain";
import data from "./divisions";

/** The 8 divisions with their 64 districts, ISO 3166-2:BD coded. */
export const divisions: Division[] = data;

export const districts: District[] = divisions.flatMap((d) => d.districts);
