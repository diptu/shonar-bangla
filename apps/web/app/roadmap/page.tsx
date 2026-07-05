import { ESSAYS } from "@shonar/domain";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Roadmap — Shonar Bangla" };

export default function RoadmapPage() {
  return (
    <main className="mx-auto w-full max-w-page space-y-8 px-5 py-12 md:px-16">
      <header className="space-y-2">
        <h1 className="headline-lg">The Ten-Year Roadmap</h1>
        <p className="body-md text-muted-foreground">
          Nine sector essays proposing a development plan for Bangladesh.
        </p>
      </header>
      <div className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
        {ESSAYS.map((essay) => (
          <Link key={essay.sector} href={`/roadmap/${essay.sector}`}>
            <Card className="glass h-full transition-shadow hover:shadow-[0_0_18px_-4px_var(--primary)]">
              <CardHeader>
                <CardTitle className="headline-md">{essay.title}</CardTitle>
                <CardDescription>
                  <span className="chip label-sm">{essay.sector}</span>
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
