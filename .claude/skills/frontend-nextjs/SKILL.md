---
name: nextjs-architect
description: >
  Enterprise Next.js architect for App Router. Server-first, type-safe,
  accessible, fast. Use when designing or reviewing Next.js 14/15 apps.
---

# Next.js Architect

## Trigger
`/nextjs [path|feature]` — review or scaffold a Next.js App Router project against this rubric.

## 1. The Lazy Doctrine
- Default to **Server Components**. Add `"use client"` only when forced (event handlers, browser APIs, state, effects).
- Lean on framework conventions: `loading.tsx`, `error.tsx`, `not-found.tsx` — no manual Suspense scaffolding.
- Generate, don't type: `create-next-app`, route groups, parallel routes, `generateStaticParams`.
- Co-locate until it hurts, then promote to a shared layer. Don't pre-build `components/` empires.
- If a bullet below contradicts "did Next.js already solve this?", ignore the bullet.

## 2. Project Layout
```
app/
  (marketing)/            # route group — no URL segment, shared layout
    page.tsx
  (app)/
    layout.tsx
    dashboard/
      page.tsx
      @analytics/         # parallel route slot
      loading.tsx
      error.tsx
      not-found.tsx
  api/                    # only when Server Actions won't cut it
  layout.tsx
  globals.css

components/               # cross-feature UI primitives (Button, Card)
features/<feature>/       # feature-scoped components, hooks, schemas
lib/                      # server-side clients, utils, env, db
hooks/                    # tiny cross-feature client hooks
types/                    # cross-cutting types only
public/
next.config.ts
middleware.ts             # auth gates, rewrites, headers
```
- Feature folders own their components, hooks, schemas, and types.
- `lib/` is server-infrastructure: db client, auth, env loader, API wrappers.
- Route groups `(name)/` = shared layout without URL noise.

## 3. The Rules (terse)

| Concern | Do | Avoid |
|---|---|---|
| Components | Server-first; small, composable, SRP | `"use client"` at root of a tree, 300-line pages |
| State | Simplest first: URL → React → Context → Server cache → Zustand | Global store for things one component owns |
| Data fetching | RSC + `fetch` cache; Server Actions for mutations | `useEffect`+`fetch` for initial data, SWR for server-only data |
| Mutations | Server Actions (`'use server'`); revalidate by tag/path | POST route handlers for form submits, manual `router.refresh()` |
| API | Typed client (Zod schema = type); centralize in `lib/api/` | One `fetch` per component, hand-written response types |
| Forms | `react-hook-form` + Zod resolver; RHF for client UX only | Yup, manual validation, uncontrolled chaos |
| Validation | Zod schemas shared client/server (parse on both) | Trusting client, validating only client-side |
| Auth | HTTP-only cookies; `middleware.ts` for gates; `auth()` in RSC | localStorage tokens, client-only checks, role in JSX as gate |
| Authz | Server-enforced; UI hides for UX only | `if (role === 'admin')` blocking real access |
| Styling | Tailwind; `cn()` helper; design tokens in `tailwind.config` | Inline styles, ad-hoc CSS files per component |
| Caching | `'use cache'` / `revalidateTag()` / `revalidatePath()`; default static | `cache: 'no-store'` everywhere out of fear |
| Streaming | `<Suspense>` per slow dependency; `loading.tsx` for routes | One giant spinner for the whole page |
| Images | `next/image` with `sizes` + `priority` for LCP | `<img>`, missing `alt`, missing `width/height` |
| Fonts | `next/font` self-hosted; CSS variable exposed | Google Fonts `<link>`, FOIT/FOUT |
| Metadata | `generateMetadata` per route; static `metadata` export | `<Head>` from `next/head` (legacy), missing OG/Twitter |
| Errors | `error.tsx` boundaries + root `global-error.tsx` | `try/catch` in render, swallowing errors |
| Logging | Pino on server, Sentry on client + server | `console.log` in prod |
| Testing | Vitest for units, Playwright for e2e, RSC testing-library | Mocking Next itself, brittle snapshot tests |

## 4. Scaffolding Shortcuts
- `pnpm create next-app@latest` — answers 4 prompts, you get TypeScript/Tailwind/App Router/eslint right.
- One Zod schema per resource in `features/<x>/schemas.ts`. Derive the TS type: `type X = z.infer<typeof schema>`. Don't write both.
- A `<DataTable>` primitive in `components/` once, reuse across features.
- `lib/env.ts` validates `process.env` with Zod at module load — fail fast on boot.
- Server Action file per feature: `features/<x>/actions.ts` exporting named async functions.
- `generateStaticParams` for known lists (product pages, blog posts) → zero per-request work.

## 5. RSC vs Client — Decision Tree
```
Need browser API / event / state / effect?  ──►  Client
Otherwise?                                  ──►  Server (default)

Tiny interactive island inside a Server tree?  ──►  Client child only
Form submission that mutates?                 ──►  Server Action in Server file
Auth check before render?                     ──►  middleware.ts or RSC `auth()`
```

## 6. Lazy Hard-Nos
Reject on sight:
- ❌ `"use client"` at the top of `app/layout.tsx`
- ❌ `useEffect` for initial data fetching
- ❌ `localStorage` / `sessionStorage` for auth tokens
- ❌ Hand-typed API responses (no Zod, no inferred types)
- ❌ Direct DB calls in code reachable from a Client Component (use `import 'server-only'`)
- ❌ `any` in component props or hooks
- ❌ Returning ORM entities from RSC — map to response DTOs
- ❌ Inline `style={{ ... }}` for anything beyond dynamic positioning
- ❌ Mixing `app/` and `pages/` (delete `pages/` if it exists)
- ❌ Trusting the frontend to enforce role/permission

## 7. Production Defaults (ship day 1)
- `experimental.typedRoutes: true` — typed `<Link href>` everywhere
- `next.config.ts`: `images.remotePatterns` allow-listed, `poweredByHeader: false`
- `middleware.ts`: auth gate + security headers (`X-Frame-Options`, CSP starter)
- Root `error.tsx` + per-route `loading.tsx` + `not-found.tsx`
- `<Toaster>` (sonner) for Server Action feedback
- Sentry (or equivalent) wired in `instrumentation.ts`
- Lighthouse CI in the pipeline; fail build under perf budget
- `next/font` for everything; `next/image` for everything visual
- `revalidateTag` strategy documented for any mutating action

## 8. Performance Levers (cheapest first)
1. Default to RSC → less JS shipped.
2. `next/font` + `next/image` → no CLS, no layout jank.
3. `generateStaticParams` / `'use cache'` → no render at request time.
4. `<Suspense>` around slow data → faster TTFB, streaming HTML.
5. Route-segment caching + `revalidateTag` for cheap invalidation.
6. Lazy-load heavy client libs (`next/dynamic` with `ssr: false`) — only when unavoidable.
7. Audit with `@next/bundle-analyzer` once a quarter; don't guess.

## 9. Execution Checklist
Run through when reviewing `/nextjs [target]`:
1. App Router only? Any leftover `pages/`?
2. Root layout is a Server Component? `"use client"` only where it must be?
3. `loading.tsx`, `error.tsx`, `not-found.tsx` in place per segment?
4. Data fetched in RSC; mutations via Server Actions?
5. Zod schemas shared client+server; no `any`?
6. Forms use RHF + Zod with optimistic UI where it helps?
7. Auth via HTTP-only cookies + middleware gates; tokens never in JS?
8. Tailwind only; no inline styles; design tokens consistent?
9. `next/image` + `next/font` everywhere they apply?
10. `metadata` / `generateMetadata` set on every public route?
11. Sentry + structured logs on both runtimes?
12. `middleware.ts` adds security headers and gates authed routes?
13. Lighthouse / bundle size budget enforced?
14. Playwright covers at least: login, primary happy-path, primary error-path?

---
*If you only remember three things: Server Components by default, Zod schemas shared both sides, auth in middleware + cookies — never in client state.*