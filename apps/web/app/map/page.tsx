import Link from "next/link";
import { ApiOffline } from "@/components/api-offline";
import { ChartFigure } from "@/components/charts/chart-figure";
import { DivisionMapLazy } from "@/components/charts/division-map-lazy";
import { api, type ValueRow } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Map — Shonar Bangla" };

const fmt = new Intl.NumberFormat("en-US");

export default async function MapPage() {
  const population = await api<ValueRow[]>("/statistics/population/values");

  if (!population || population.length === 0) {
    return (
      <main className="mx-auto w-full max-w-page px-5 py-12 md:px-16">
        <ApiOffline />
      </main>
    );
  }

  const values = Object.fromEntries(population.map((v) => [v.geoCode, v.value]));

  return (
    <main className="mx-auto w-full max-w-page space-y-8 px-5 py-12 md:px-16">
      <header className="space-y-2">
        <h1 className="headline-lg">Division Explorer</h1>
        <p className="body-md text-muted-foreground">
          Population by division, BBS Census 2022. Click a division to explore it.
        </p>
      </header>
      <ChartFigure
        label="Choropleth map of Bangladesh divisions colored by 2022 population"
        headers={["Division", "Population (2022)"]}
        rows={population.map((v) => [v.geoCode, fmt.format(v.value)])}
      >
        <DivisionMapLazy values={values} />
      </ChartFigure>
      <p className="label-sm text-muted-foreground">
        Darker teal = fewer people, brighter teal = more. Boundaries: geoBoundaries ADM1
        (simplified). <Link href="/dashboard" className="text-primary">Dashboard →</Link>
      </p>
    </main>
  );
}
