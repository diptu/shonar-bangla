import { ESSAYS, SECTORS, type Indicator, type Sector } from "@shonar/domain";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiOffline } from "@/components/api-offline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type ValueRow } from "@/lib/api";

export const dynamic = "force-dynamic";

const fmt = new Intl.NumberFormat("en-US");

// ONE template serves every sector page (user-approved trim of Plan.md's 7 pages).
export default async function SectorPage({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = await params;
  if (!SECTORS.includes(sector as Sector)) notFound();

  const essay = ESSAYS.find((e) => e.sector === sector);
  const indicators = await api<Indicator[]>(`/statistics?sector=${sector}`);

  const withValues = indicators
    ? await Promise.all(
        indicators.map(async (indicator) => ({
          indicator,
          latest: (await api<ValueRow[]>(`/statistics/${indicator.id}/values`))?.at(-1),
        })),
      )
    : null;

  return (
    <main className="mx-auto w-full max-w-page space-y-10 px-5 py-12 md:px-16">
      <header className="space-y-2">
        <Link href="/dashboard" className="label-sm text-muted-foreground hover:text-primary">
          ← Dashboard
        </Link>
        <h1 className="headline-lg capitalize">{sector.replace(/-/g, " ")}</h1>
        {essay && (
          <Link href={`/roadmap/${essay.sector}`} className="body-md text-primary hover:underline">
            Read the roadmap essay: {essay.title} →
          </Link>
        )}
      </header>

      {!withValues ? (
        <ApiOffline />
      ) : withValues.length === 0 ? (
        <p className="body-lg text-muted-foreground">
          No indicators for this sector yet — data arrives with the Phase 10 ETL pipelines.
        </p>
      ) : (
        <section className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
          {withValues.map(({ indicator, latest }) => (
            <Card key={indicator.id} className="glass">
              <CardHeader>
                <CardTitle className="headline-md">{indicator.name}</CardTitle>
                <CardDescription className="label-sm">
                  {indicator.source} · {indicator.geoLevel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="data-display text-primary">
                  {latest ? `${fmt.format(latest.value)} ${indicator.unit}` : "no values"}
                </p>
                {latest && (
                  <p className="label-sm mt-1 text-muted-foreground">
                    {latest.geoCode} · {latest.year}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
