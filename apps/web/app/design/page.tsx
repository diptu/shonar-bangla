import { divisions } from "@shonar/domain";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const colors = [
  ["primary / teal", "bg-primary"],
  ["secondary / gold", "bg-secondary"],
  ["background", "bg-background"],
  ["card", "bg-card"],
  ["muted", "bg-muted"],
  ["accent", "bg-accent"],
  ["destructive", "bg-destructive"],
  ["surface-container-lowest", "bg-surface-container-lowest"],
  ["surface-container", "bg-surface-container"],
  ["surface-container-highest", "bg-surface-container-highest"],
  ["outline", "bg-outline"],
  ["tertiary", "bg-tertiary"],
] as const;

const textStyles = [
  ["headline-xl", "The pulse of the delta"],
  ["headline-lg", "Sixty-four districts, one dashboard"],
  ["headline-md", "Energy security by 2035"],
  ["body-lg", "Deep, atmospheric backgrounds provide a canvas for vibrant neon accents."],
  ["body-md", "Surfaces leverage frosted-glass effects for depth and layering."],
  ["data-display", "GDP +6.8%"],
  ["label-sm", "System status: nominal"],
] as const;

export default function DesignPage() {
  return (
    <main className="mx-auto w-full max-w-page space-y-16 px-5 py-12 md:px-16">
      <header className="space-y-2">
        <h1 className="headline-lg">Design System</h1>
        <p className="body-md text-muted-foreground">
          Every token and primitive from DESIGN.md on one screen.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="label-sm text-muted-foreground">Colors</h2>
        <div className="grid grid-cols-2 gap-gutter-sm sm:grid-cols-3 lg:grid-cols-6">
          {colors.map(([name, cls]) => (
            <div key={name} className="space-y-2">
              <div className={`h-16 rounded-lg border ${cls}`} />
              <p className="label-sm text-muted-foreground">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="label-sm text-muted-foreground">Typography</h2>
        <div className="space-y-4">
          {textStyles.map(([cls, sample]) => (
            <div key={cls} className="flex flex-col gap-1 border-b pb-4 md:flex-row md:items-baseline md:gap-8">
              <span className="label-sm w-40 shrink-0 text-muted-foreground">{cls}</span>
              <span className={cls}>{sample}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="label-sm text-muted-foreground">Buttons</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <span className="chip label-sm">Chip / Tag</span>
        </div>
      </section>

      <section className="grid gap-gutter md:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="headline-md">Glassmorphic card</CardTitle>
            <CardDescription>backdrop-blur(16px), 1px white/10 border</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="data-display text-secondary">$465B GDP</p>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input id="district" placeholder="e.g. Sylhet" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="headline-md">Loading states</CardTitle>
            <CardDescription>Skeleton primitives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="label-sm text-muted-foreground">Data table</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="label-sm">Division</TableHead>
              <TableHead className="label-sm">ISO code</TableHead>
              <TableHead className="label-sm text-right">Districts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {divisions.map((division) => (
              <TableRow key={division.code}>
                <TableCell>{division.name}</TableCell>
                <TableCell>{division.code}</TableCell>
                <TableCell className="data-display text-right text-secondary">
                  {division.districts.length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </main>
  );
}
