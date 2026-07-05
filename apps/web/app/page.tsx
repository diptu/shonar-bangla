import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-page flex-1 flex-col items-center justify-center gap-6 px-5 py-24 text-center md:px-16">
      <span className="chip label-sm">Ten-Year Development Roadmap</span>
      <h1 className="headline-xl">Shonar Bangla</h1>
      <p className="body-lg max-w-xl text-muted-foreground">
        Mapping Bangladesh&apos;s socioeconomic growth and infrastructure milestones through an
        interactive, data-driven interface.
      </p>
      <Button size="lg" render={<Link href="/design" />}>
        Explore the design system
      </Button>
    </main>
  );
}
