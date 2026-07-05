import fs from "node:fs/promises";
import path from "node:path";
import { ESSAYS } from "@shonar/domain";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const dynamicParams = false;

export function generateStaticParams() {
  return ESSAYS.map((essay) => ({ slug: essay.sector }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const essay = ESSAYS.find((e) => e.sector === slug);
  return { title: `${essay?.title ?? "Essay"} — Shonar Bangla` };
}

export default async function EssayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const essay = ESSAYS.find((e) => e.sector === slug);
  if (!essay) notFound();

  // Essays live at repo root; read at build time (all routes are static).
  const markdown = await fs.readFile(path.join(process.cwd(), "..", "..", essay.file), "utf8");

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <Link href="/roadmap" className="label-sm text-muted-foreground hover:text-primary">
        ← Roadmap
      </Link>
      <article className="prose prose-invert mt-8 max-w-none prose-headings:font-heading prose-a:text-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </article>
    </main>
  );
}
