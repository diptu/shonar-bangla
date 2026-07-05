import { SECTORS, type Division } from "@shonar/domain";
import Link from "next/link";
import { ApiOffline } from "@/components/api-offline";
import { ChartFigure } from "@/components/charts/chart-figure";
import { GdpLine } from "@/components/charts/gdp-line";
import { PopulationBar } from "@/components/charts/population-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type ValueRow } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — Shonar Bangla" };

const fmt = new Intl.NumberFormat("en-US");

export default async function DashboardPage() {
  const [divisions, gdp, population] = await Promise.all([
    api<Division[]>("/geography/divisions"),
    api<ValueRow[]>("/statistics/gdp-growth/values?geoCode=BD"),
    api<ValueRow[]>("/statistics/population/values"),
  ]);

  if (!divisions) {
    return (
      <main className="mx-auto w-full max-w-page px-5 py-12 md:px-16">
        <ApiOffline />
      </main>
    );
  }

  const latestGdp = gdp?.at(-1);
  const totalPop = population?.reduce((sum, v) => sum + v.value, 0);
  const popByGeo = new Map(population?.map((v) => [v.geoCode, v.value]));

  const tiles = [
    { label: "GDP growth", value: latestGdp ? `${latestGdp.value}%` : "—", sub: latestGdp?.year },
    { label: "Population", value: totalPop ? fmt.format(totalPop) : "—", sub: "BBS Census 2022" },
    { label: "Divisions", value: divisions.length, sub: "ISO 3166-2:BD" },
    { label: "Districts", value: 64, sub: "nationwide" },
  ];

  return (
    <main className="mx-auto w-full max-w-page space-y-12 px-5 py-12 md:px-16">
      <h1 className="headline-lg">National Overview</h1>

      <section className="grid grid-cols-2 gap-gutter lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="glass">
            <CardHeader>
              <CardTitle className="label-sm text-muted-foreground">{tile.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="data-display text-primary">{tile.value}</p>
              <p className="label-sm mt-1 text-muted-foreground">{tile.sub}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-gutter lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="headline-md">GDP growth</CardTitle>
          </CardHeader>
          <CardContent>
            {gdp && gdp.length > 0 ? (
              <ChartFigure
                label="Line chart of Bangladesh GDP growth rate by year, World Bank"
                headers={["Year", "GDP growth (%)"]}
                rows={gdp.map((v) => [String(v.year), `${v.value}%`])}
              >
                <GdpLine data={gdp.map(({ year, value }) => ({ year, value }))} />
              </ChartFigure>
            ) : (
              <p className="body-md text-muted-foreground">No data.</p>
            )}
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader>
            <CardTitle className="headline-md">Population by division</CardTitle>
          </CardHeader>
          <CardContent>
            {population && population.length > 0 ? (
              <ChartFigure
                label="Bar chart of population by division, BBS Census 2022"
                headers={["Division", "Population"]}
                rows={population.map((v) => [v.geoCode, fmt.format(v.value)])}
              >
                <PopulationBar
                  data={divisions.map((d) => ({
                    name: d.name,
                    value: popByGeo.get(d.code) ?? 0,
                  }))}
                />
              </ChartFigure>
            ) : (
              <p className="body-md text-muted-foreground">No data.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="headline-md">Sectors</h2>
        <div className="flex flex-wrap gap-3">
          {SECTORS.map((sector) => (
            <Link key={sector} href={`/sectors/${sector}`} className="chip label-sm hover:bg-primary/20">
              {sector}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="headline-md">Divisions</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="label-sm">Division</TableHead>
              <TableHead className="label-sm">Code</TableHead>
              <TableHead className="label-sm text-right">Districts</TableHead>
              <TableHead className="label-sm text-right">Population (2022)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {divisions.map((division) => (
              <TableRow key={division.code}>
                <TableCell>
                  <Link href={`/divisions/${division.code}`} className="text-primary hover:underline">
                    {division.name}
                  </Link>
                </TableCell>
                <TableCell>{division.code}</TableCell>
                <TableCell className="text-right">{division.districts.length}</TableCell>
                <TableCell className="data-display text-right text-secondary">
                  {popByGeo.get(division.code) ? fmt.format(popByGeo.get(division.code)!) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </main>
  );
}
