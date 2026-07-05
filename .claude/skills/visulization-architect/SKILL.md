---
name: data-visualization-geospatial-architect
description: >
  Data visualization and geospatial architect. Choropleth design, chart
  library selection, KPI dashboards, time-series, accessibility, dark
  mode, performance at scale. Use when designing or reviewing any data
  product with charts, maps, or tables.
---

# Data Visualization & Geospatial Architect

## Trigger
`/viz [path|component]` — review or scaffold a data-viz / map product against this rubric.

## 1. The Lazy Doctrine
- **Chart lib by complexity, not by familiarity.** Tremor for dashboards, Recharts for custom, Visx for control-without-escape, D3 only when nothing else fits. Different libs, not different opinions.
- **Map source by scale.** GeoJSON until 1k features; PMTiles/vector tiles beyond that. Don't serve 50MB GeoJSON in production.
- **Color is load-bearing.** ColorBrewer for categorical, Viridis/Cividis for sequential, never rainbow, colorblind-safe by default.
- **Accessibility is non-negotiable.** Every chart has a data-table fallback. Color is never the only channel.
- If a bullet below contradicts "does the user actually understand this faster than reading the number?", it's the wrong viz.

## 2. Chart Library Matrix (pick by need)

| Need | Pick | Why |
|---|---|---|
| Pre-built dashboard widgets, fastest to ship | **Tremor** | KPI cards, sparklines, area charts out of the box |
| Custom React-style, mid-level control | **Recharts** | Composable, declarative, decent defaults |
| D3 primitives + React idioms, no escape hatch needed | **Visx** | Lower bundle than Recharts, full D3 power |
| Maximum control, animations, complex layouts | **D3** | Escape hatch. Only when Visx is too constrained. |
| Polished animated dashboards, marketing-style | **Nivo** | Heavier bundle, gorgeous defaults |
| Massive time-series (millions of points) | **uPlot** | Canvas, smallest, fastest |
| Legacy small charts, simple needs | **Chart.js** | Older, fine for simple |

**Heuristic:** start with Tremor for dashboards. Drop to Recharts/Visx when you need something Tremor doesn't have. Reach for D3 only when nothing else fits.

## 3. Map Library Matrix

| Need | Pick |
|---|---|
| Web map, OpenStreetMap-compatible, vector tiles | **MapLibre GL JS** (drop-in fork of Mapbox pre-BSL) |
| 2D map with deck.gl layers (points, arcs, hexagons) | **react-map-gl + deck.gl** |
| Single-file vector tile hosting, no tile server | **PMTiles** (protomaps) |
| 3D buildings / terrain | **MapLibre + 3D layer** |
| Quick map with markers only | **react-leaflet** |
| Satellite/aerial | MapLibre + Esri/Cesium raster source |

**Default:** MapLibre + PMTiles. Self-hostable, no API costs, no vendor lock. Matches Shonar Bangla's stack.

## 4. Project Layout
```
src/
  features/
    <viz>/
      Chart.tsx                # the viz component
      schema.ts                # Zod schema = viz input shape
      use-chart-data.ts        # data hook (TanStack Query)
      a11y-table.tsx           # data-table fallback
  components/
    ui/
      kpi-card.tsx
      sparkline.tsx
      chart-container.tsx      # title + chart + legend wrapper
  lib/
    viz/
      colors.ts                # colorblind-safe palettes
      classify.ts              # quantile, ckmeans, standard-deviation
      format.ts                # number/date formatters
      motion.ts                # respects prefers-reduced-motion
    geo/
      pmtiles-protocol.ts      # MapLibre protocol setup
      basemaps.ts              # map styles
      bbox.ts                  # Bangladesh bounds, fit-to-data
public/
  tiles/                       # self-hosted PMTiles
  styles/                      # MapLibre style JSON
```

## 5. The Rules (terse)

| Concern | Do | Avoid |
|---|---|---|
| Chart library | Tremor default; Visx for custom; D3 only when forced | Picking D3 because you're comfortable (bundle cost) |
| Map source | PMTiles for > 1k features; GeoJSON only for tiny static sets | GeoJSON > 1MB in production |
| Color | ColorBrewer (categorical), Viridis/Cividis (sequential); colorblind-safe | Rainbow (categorical confusion + not colorblind-safe) |
| Color channel | Color + label + position together; not color alone | Color as sole encoding (8% of men can't see it) |
| Choropleth | Quantile or ckmeans classification; clear legend; explicit units | Default linear scale, no legend, units in title only |
| Time-series | Brush for range selection; URL state shares the selection | Modifying global state on brush |
| KPIs | Label + value + delta + sparkline; comparison to baseline (last year, target) | Lone number with no context |
| Tables | TanStack Table + Virtual for > 100 rows; sort + filter + column visibility | Loading 50k rows into DOM |
| Dark mode | Different palette per theme; verify contrast ≥ 4.5:1 in both | Same colors in both themes (contrast fails) |
| Accessibility | aria-label summary, data-table fallback, keyboard nav, reduced motion | Chart-only with no a11y path |
| Performance | Lazy-load map; split chart bundles; WebGL for > 10k points | Loading MapLibre + full Tremor on first paint |
| i18n | `Intl.NumberFormat` + `date-fns/locale` (bn-BD, en) | Hardcoded "1,000" / "Jan 1" |
| State | URL search params for filters/selections; shareable link | Local state for things users expect to share |
| Animations | Respect `prefers-reduced-motion`; cap duration ≤ 400ms | 2-second fly-ins, infinite loops |
| Map controls | Keyboard nav, +/- zoom, attribution, scale bar | "Scroll to zoom" with no other options |
| Export | Puppeteer for PDF reports; snapshot URL for sharing | Print-stylesheet hacks |

## 6. Core Patterns (copy these)

### 6.1 Choropleth with MapLibre + PMTiles
```tsx
// Install: pnpm add maplibre-gl pmtiles
'use client';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';

let registered = false;
const ensureProtocol = () => {
  if (!registered) {
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.protocol);
    registered = true;
  }
};

export const BangladeshDistrictsMap = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ensureProtocol();
    if (!ref.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: '/styles/positron.json',   // or self-hosted
      center: [90.4, 23.7],            // Bangladesh
      zoom: 6,
      minZoom: 5,
      maxZoom: 12,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      map.addSource('districts', { type: 'vector', url: 'pmtiles://tiles/bd-districts.pmtiles' });
      map.addLayer({
        id: 'districts-fill',
        type: 'fill',
        source: 'districts',
        'source-layer': 'districts',
        paint: {
          'fill-color': [
            'interpolate', ['linear'], ['coalesce', ['get', 'kpi_value'], 0],
            0,    '#fef3c7',
            25,   '#fcd34d',
            50,   '#fb923c',
            75,   '#dc2626',
            100,  '#7f1d1d',
          ],
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0.7],
        },
      });
      map.addLayer({
        id: 'districts-outline',
        type: 'line',
        source: 'districts',
        'source-layer': 'districts',
        paint: { 'line-color': '#1f2937', 'line-width': 0.5 },
      });
      // Click → open district detail panel
      map.on('click', 'districts-fill', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        showDistrictPanel(f.properties);
      });
    });

    return () => map.remove();
  }, []);

  return <div ref={ref} className="h-full w-full" role="application" aria-label="Bangladesh districts map" />;
};
```

### 6.2 Vector tile pipeline (one-time setup)
```bash
# Build PMTiles from GeoJSON
# 1. Install: brew install tippecanoe   OR   pnpm add -g @developmentseed/tippecanoe-cli
# 2. Generate
tippecanoe \
  --output tiles/bd-districts.pmtiles \
  --name=districts \
  --layer=districts \
  --minimum-zoom=4 --maximum-zoom=12 \
  --simplification=10 \
  --detect-shared-borders \
  --force \
  data/bd-districts.geojson

# 3. Serve via any static host (S3 + CloudFront works great)
# 4. Or self-host: pnpm add pmtiles serve
```
**Lazy win:** one file. Apache/nginx-compatible. No tile server to operate.

### 6.3 KPI card (Tremor pattern)
```tsx
import { Card, Metric, Text, BadgeDelta, SparkAreaChart } from '@tremor/react';

export const KpiCard = ({ label, value, unit, delta, history, locale }: KpiCardProps) => {
  const fmt = useFormatter(locale);
  return (
    <Card className="dark:bg-zinc-900">
      <Text className="text-zinc-600 dark:text-zinc-400">{label}</Text>
      <Metric className="text-zinc-900 dark:text-zinc-100">{fmt.number(value)}{unit && ` ${unit}`}</Metric>
      <div className="mt-2 flex items-center gap-2">
        <BadgeDelta deltaType={delta >= 0 ? 'moderateIncrease' : 'moderateDecrease'}>
          {fmt.number(delta, { style: 'percent', maximumFractionDigits: 1 })}
        </BadgeDelta>
        <Text className="text-xs">vs last year</Text>
      </div>
      <SparkAreaChart
        data={history}
        index="date"
        categories={[label]}
        colors={['blue']}
        className="mt-4 h-12"
      />
    </Card>
  );
};
```

### 6.4 Time-series with brush (Visx)
```tsx
import { Brush } from '@visx/brush';
import { Group } from '@visx/group';
import { ScaleLinear } from 'd3-scale';

<svg width={width} height={height + 60}>
  <LineSeries data={data} xScale={xScale} yScale={yScale} />
  <Group top={height + 10}>
    <Brush {...brushProps} xScale={xScale} yScale={brushYScale} onChange={onBrushChange}>
      {(brush) => (
        <>
          <LineSeries data={data} xScale={brush.xScale} yScale={brush.yScale} />
          <brush.BrushSelection />
        </>
      )}
    </Brush>
  </Group>
</svg>
```

### 6.5 Color classification + colorblind-safe palettes
```ts
// lib/viz/colors.ts
export const palettes = {
  sequential: ['#fef3c7', '#fcd34d', '#fb923c', '#dc2626', '#7f1d1d'],      // warm
  sequentialCb: ['#fee391', '#fec44f', '#fe9929', '#d95f0e', '#993404'],     // colorblind-safe
  viridis: ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#fde725'], // perceptually uniform
  cividis: ['#00224e', '#123570', '#3b496c', '#575c6d', '#707173', '#8a8878', '#a59c74', '#c3b369', '#e1cc4e', '#fee838'],
  categorical: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2'],
};

// lib/viz/classify.ts
import { ckmeans } from 'simple-statistics';

export type Classification = 'quantile' | 'equal' | 'std' | 'ckmeans';
export const classify = (values: number[], breaks: number, method: Classification = 'ckmeans'): number[][] => {
  if (method === 'ckmeans') {
    const clusters = ckmeans(values, breaks);
    return clusters.map((c) => [c[0], c[c.length - 1]]);
  }
  // ... other methods
  return [];
};
```

### 6.6 i18n (Bangla + English numbers/dates)
```ts
import { bn, enUS } from 'date-fns/locale';
import { format as formatDate } from 'date-fns';

export const useFormatter = (locale: 'bn' | 'en') => {
  const fmt = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US', { maximumFractionDigits: 2 });
  const fmtPct = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US', { style: 'percent', maximumFractionDigits: 1 });
  const fmtCurrency = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US', { style: 'currency', currency: 'BDT' });
  return {
    number: (n: number, opts?: Intl.NumberFormatOptions) => fmt.format(n),
    percent: (n: number) => fmtPct.format(n),
    currency: (n: number) => fmtCurrency.format(n),
    date: (d: Date, pattern = 'PP') => formatDate(d, pattern, { locale: locale === 'bn' ? bn : enUS }),
  };
};
```

### 6.7 Dark mode palettes (verify in both themes)
```ts
export const darkMode = {
  sequential: ['#fef3c7', '#fcd34d', '#fb923c', '#dc2626', '#7f1d1d'],
  categorical: ['#60a5fa', '#fb923c', '#34d399', '#f87171', '#a78bfa', '#fbbf24', '#f472b6'],
  textOnDark: '#e4e4e7',     // zinc-200
  textOnDarkMuted: '#a1a1aa', // zinc-400
  bgDark: '#18181b',          // zinc-900
};
```
**Rule:** test every palette in both themes; many "light-pass" palettes fail WCAG AA in dark. Aim for contrast ≥ 4.5:1.

### 6.8 Accessibility — chart with table fallback
```tsx
export const AccessibleBarChart = ({ data, title, valueLabel, locale }: Props) => {
  const fmt = useFormatter(locale);
  return (
    <>
      <div role="img" aria-label={`${title}. ${data.map(d => `${d.label}: ${fmt.number(d.value)}`).join(', ')}`}>
        <BarChart data={data} ... />
      </div>
      {/* Hidden but SR-accessible */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead><tr><th>Category</th><th>{valueLabel}</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.label}><td>{d.label}</td><td>{fmt.number(d.value)}</td></tr>)}</tbody>
      </table>
    </>
  );
};
```
**Rule:** every chart has both `role="img"` + `aria-label` summary AND a `sr-only` table with the same data. WCAG requires non-visual access.

### 6.9 Reduced motion (respect user preference)
```ts
export const motion = {
  duration: (ms: number) =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms,
  ease: 'ease-out',
};
```
Pair with Motion (Framer) `<motion.div transition={{ duration: motion.duration(0.3) }} />`.

### 6.10 URL state (shareable filters)
```tsx
import { useQueryState, parseAsString, parseAsArrayOf } from 'nuqs'; // or useSearchParams + custom hook

export const useDistrictFilter = () => {
  const [districts, setDistricts] = useQueryState('d', parseAsArrayOf(parseAsString).withDefault([]));
  const [year, setYear] = useQueryState('y', parseAsString.withDefault('2024'));
  return { districts, setDistricts, year, setYear };
};
```
**Why:** users expect filters to survive refresh + be shareable by URL. Local state breaks this expectation.

### 6.11 Performance — lazy-load map + bundle split
```tsx
// app/dashboard/page.tsx (Server Component)
import dynamic from 'next/dynamic';

const BangladeshDistrictsMap = dynamic(
  () => import('@/features/viz/BangladeshDistrictsMap').then(m => m.BangladeshDistrictsMap),
  { ssr: false, loading: () => <MapSkeleton /> },
);
```
**Result:** MapLibre (~250KB gz) loads only on the dashboard, not on every page.

### 6.12 Large data table (TanStack Virtual)
```tsx
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/virtual';

const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 35,
  overscan: 10,
});
```
**Rule:** virtualize for > 100 rows; sort + filter are still needed even with virtualization.

### 6.13 PDF export via Puppeteer (job)
```ts
// Queue job — render a server-side PDF of /dashboard?embed=1
await pdfQueue.add('render-dashboard', { tenantId, filters }, {
  jobId: `dashboard:${tenantId}:${hash(filters)}`,
  attempts: 2,
});
new Worker('pdf', async (job) => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(`${process.env.APP_URL}/dashboard?embed=1&${qs(filters)}`, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', landscape: true });
  const key = `tenants/${job.data.tenantId}/reports/${Date.now()}.pdf`;
  await s3.putObject(key, pdf, 'application/pdf').promise();
  await mailer.sendReportEmail(job.data.tenantId, key);
  await browser.close();
});
```
**Lazy win:** use the same React component for screen and PDF; route Puppeteer to `?embed=1` to hide chrome.

### 6.14 Real-time updates (SSE)
```ts
// Server: stream KPI updates
app.get('/api/dashboards/:id/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  const send = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const sub = eventBus.subscribe(`dashboard:${req.params.id}`, send);
  req.on('close', () => eventBus.unsubscribe(sub));
});

// Client:
const evtSource = new EventSource(`/api/dashboards/${id}/stream`);
evtSource.onmessage = (e) => setKpis(JSON.parse(e.data));
```
Use SSE for one-way server → client (perfect for KPI updates). Use WebSocket only if you need bidirectional (rare for dashboards).

## 7. Scaffolding Shortcuts
- One `<ChartContainer>` wrapper for title + chart + legend + a11y table.
- One `useFormatter(locale)` per app — handles bn/en number/date/currency.
- `palettes` + `classify` exported once.
- `motion.duration(ms)` everywhere instead of hardcoded transitions.
- PMTiles served from same CDN as the rest of the static assets.
- Map style JSON committed to repo (don't fetch from external service at runtime).
- Per-locale color palette override (some corporate brands differ per market).

## 8. Performance Budgets (set early)
| Asset | Budget |
|---|---|
| Initial JS (incl. chart libs) | ≤ 250KB gz |
| MapLibre | Lazy-loaded per route |
| Each chart lib (Recharts/Visx/Tremor) | ≤ 30KB gz per import |
| First chart render | ≤ 200ms after data load |
| Choropleth panning | 60fps (MapLibre WebGL = default) |
| Table virtual scroll | 60fps with 50k rows |
| PDF generation | ≤ 8s end-to-end |

## 9. Lazy Hard-Nos
Reject on sight:
- ❌ Rainbow color scales (categorical confusion, not colorblind-safe)
- ❌ Charts without axis labels or units
- ❌ Maps missing attribution / scale bar / keyboard nav
- ❌ Choropleth without legend
- ❌ 3D charts without explicit reason
- ❌ Pie charts for >5 categories (use bar)
- ❌ Animations that ignore `prefers-reduced-motion`
- ❌ Charts without `role="img"` + `aria-label` + data table fallback
- ❌ Map without keyboard navigation
- ❌ Color as sole encoding channel (must pair with label/position)
- ❌ Hardcoded English numbers/dates (breaks bn locale)
- ❌ GeoJSON > 1MB in production (use PMTiles)
- ❌ Loading 50k rows into the DOM (virtualize)
- ❌ MapLibre in initial JS bundle (lazy-load per route)
- ❌ Same palette in light + dark mode (contrast fails)
- ❌ Local state for "shareable filters" (URL state)
- ❌ Force-directed layout for > 100 nodes (use aggregation)

## 10. Execution Checklist
Run through when reviewing `/viz [target]`:
1. Chart lib picked by need (Tremor default; Visx for custom; D3 only when forced)?
2. Map source: PMTiles for > 1k features; GeoJSON only for tiny static sets?
3. Color palette colorblind-safe + sufficient contrast in both themes?
4. Classification method chosen (ckmeans default; quantile for skewed data)?
5. Time-series selections stored in URL (shareable)?
6. KPI cards have label + value + delta + baseline + sparkline?
7. Data tables virtualize at > 100 rows; sort + filter available?
8. Every chart has `role="img"` + `aria-label` + `sr-only` table fallback?
9. Keyboard navigation on all interactive viz (map, time-slider, table)?
10. `prefers-reduced-motion` respected in all animations?
11. i18n via `Intl.NumberFormat` + `date-fns/locale` (bn/en)?
12. Map lazy-loaded per route, not in initial JS bundle?
13. Bundle budgets met (≤ 250KB gz initial; chart libs split)?
14. PDF export uses Puppeteer + same React component + `?embed=1`?
15. Real-time updates via SSE (not polling) where one-way stream suffices?

---
*If you only remember three things: colorblind-safe palette + data-table fallback + chart lib by complexity (Tremor → Visx → D3). The rest is detail.*