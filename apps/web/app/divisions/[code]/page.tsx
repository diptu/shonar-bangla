import type { Division } from "@shonar/domain";
import Link from "next/link";
import { notFound } from "next/navigation";
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

const fmt = new Intl.NumberFormat("en-US");

export default async function DivisionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [division, population] = await Promise.all([
    api<Division>(`/geography/divisions/${code}`),
    api<ValueRow[]>(`/statistics/population/values?geoCode=${code}`),
  ]);
  if (!division) notFound();

  const pop = population?.at(-1);

  return (
    <main className="mx-auto w-full max-w-page space-y-10 px-5 py-12 md:px-16">
      <header className="space-y-2">
        <Link href="/dashboard" className="label-sm text-muted-foreground hover:text-primary">
          ← Dashboard
        </Link>
        <h1 className="headline-lg">{division.name} Division</h1>
        <div className="flex items-center gap-4">
          <span className="chip label-sm">{division.code}</span>
          {pop && (
            <span className="data-display text-secondary">
              {fmt.format(pop.value)} people ({pop.year})
            </span>
          )}
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="headline-md">Districts ({division.districts.length})</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="label-sm">District</TableHead>
              <TableHead className="label-sm text-right">ISO code</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {division.districts.map((district) => (
              <TableRow key={district.code}>
                <TableCell>{district.name}</TableCell>
                <TableCell className="text-right">{district.code}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </main>
  );
}
