import Link from "next/link";

export function Navbar() {
  return (
    <header className="glass sticky top-0 z-50">
      <nav className="mx-auto flex h-14 max-w-page items-center justify-between px-5 md:px-16">
        <Link href="/" className="data-display text-primary">
          SHONAR BANGLA
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="label-sm text-muted-foreground hover:text-primary">
            Home
          </Link>
          <Link href="/roadmap" className="label-sm text-muted-foreground hover:text-primary">
            Roadmap
          </Link>
          <Link href="/dashboard" className="label-sm text-muted-foreground hover:text-primary">
            Dashboard
          </Link>
          <Link href="/map" className="label-sm text-muted-foreground hover:text-primary">
            Map
          </Link>
          <Link href="/design" className="label-sm text-muted-foreground hover:text-primary">
            Design
          </Link>
        </div>
      </nav>
    </header>
  );
}
