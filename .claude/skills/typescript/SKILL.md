---
name: typescript-architect
description: >
  Enterprise TypeScript architect. Type-safe, scalable, no clever-clever —
  one source of truth per concept, smart defaults, zero fluff. Use when
  designing or reviewing TS codebases, libs, or APIs.
---

# TypeScript Architect

## Trigger
`/typescript [path|service_name]` — review or scaffold a TS project against this rubric.

## 1. The Lazy Doctrine
- **Schema = type.** `z.infer<typeof schema>` once, reused everywhere. Never write both a Zod schema and a hand-typed interface.
- **Derive, don't redeclare.** `Pick`, `Omit`, `Partial`, `Required`, `Awaited<T>`, `Parameters<T>`, `ReturnType<T>`, `NonNullable<T>`. Built-ins beat custom every time.
- **`unknown` + narrow** beats `any`. Always.
- One type per concept. If a definition exists in another file, import — don't retype.
- If a bullet below contradicts "did TS already solve this?", ignore the bullet.

## 2. tsconfig Baseline (copy this)
```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "moduleDetection": "force",
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,   // arr[i] is T | undefined
    "exactOptionalPropertyTypes": true,  // {x?: T} ≠ {x: T | undefined}
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "types"]
}
```
Strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` = 80% of runtime bugs caught at compile time. Non-negotiable.

## 3. Project Layout (co-locate by default)
```
src/
  features/<x>/
    index.ts          # barrel
    schema.ts         # Zod schemas = types
    service.ts
    types.ts          # only what's not derivable from schema
  lib/
    result.ts         # Result<T, E>  
    brand.ts          # branded type helper
    assert.ts         # assertNever, invariant
  types/              # only cross-cutting, rarely used
test/
tsconfig.json
```
- Co-locate types inside the feature that owns them.
- Promote to `lib/` only when a helper is reused across 3+ features.

## 4. The Rules (terse)

| Concern | Do | Avoid |
|---|---|---|
| Public contracts | `interface` for objects, `type` for unions/intersections | Mixed conventions, `interface` for everything |
| Inference | Let TS infer locals; annotate public APIs only | Annotating every `const` |
| `any` | Never. Use `unknown` + type guard | Silencing the compiler to ship |
| Narrowing | Discriminated unions, `in`, `typeof`, `instanceof`, type predicates | `as` when narrowing would work |
| Error handling | Typed `Result<T,E>` OR typed `Error` subclasses — never raw strings | `throw "oops"`, swallowed `try {} catch {}` |
| Immutability | `readonly`, `ReadonlyArray<T>`, `as const`, `Object.freeze` in hot paths | Mutable defaults, hidden mutation |
| Generics | Only when a real second caller exists | Clever `<T extends infer U ? ...>` chains |
| Enums | String literal unions + `as const` object | `enum` (bad tree-shaking, breaks `isolatedModules`, weird runtime) |
| Assertions | `as` only at the trust boundary (post-parse) | `as` everywhere as a workaround |
| Runtime validation | Zod / Valibot / ArkType at boundaries | Relying on TS types at runtime |

## 5. Reach for These First (built-in cheatsheet)

| Need | Use |
|---|---|
| Wrap async return type | `Awaited<ReturnType<typeof fn>>` |
| Get function args | `Parameters<typeof fn>` |
| Get return type | `ReturnType<typeof fn>` |
| Subset of an object | `Pick<T, 'a' \| 'b'>` |
| Omit fields | `Omit<T, 'secret'>` |
| Make optional required | `Required<T>` |
| Make required optional | `Partial<T>` (watch `exactOptionalPropertyTypes`) |
| Strip null/undefined | `NonNullable<T>` |
| Union operations | `Exclude<T, U>`, `Extract<T, U>` |
| Record from union | `Record<'a' \| 'b', V>` |
| Strip brand helper output | `[K in keyof T as T[K] extends never ? never : K]: ...` |

**`satisfies` + `as const`** — the lazy combo for config & constants:
```ts
const ROUTES = {
  home: '/',
  users: '/users',
  user: (id: UserId) => `/users/${id}`,
} as const satisfies Record<string, string | ((...a: any[]) => string)>;
// typeof ROUTES.home → '/'  (narrow, no widening)
// ROUTES[keyof typeof ROUTES] constraint enforced
```

## 6. Domain Modeling Patterns

**Discriminated union** for state machines (no enums, no booleans):
```ts
type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: AppError };
```

**Branded types** — kill `string` mixups once:
```ts
// lib/brand.ts
type Brand<T, B> = T & { readonly __brand: B };
export type UserId = Brand<string, 'UserId'>;
export const UserId = (s: string) => s as UserId;
```

**Exhaustive checks** — TS tells you what's missing:
```ts
function assertNever(x: never): never {
  throw new Error(`Unreachable: ${JSON.stringify(x)}`);
}
switch (state.status) {
  case 'idle': /* ... */; break;
  case 'loading': /* ... */; break;
  case 'success': /* ... */; break;
  case 'error': /* ... */; break;
  default: assertNever(state);
}
```

**`Result<T, E>`** for expected failures (no exception):
```ts
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
// if (result.ok) { ... } else { ... } — discriminated, zero try/catch.
```

## 7. Scaffolding Shortcuts
- One Zod schema → one type. `type User = z.infer<typeof userSchema>`.
- `lib/brand.ts` once, reuse forever — saves debugging `string` mismatches.
- `Result<T, E>` once in `lib/result.ts` — never write a custom one.
- `tsc --noEmit` in CI. No `any` ESLint rule. Done.
- ESLint preset: `@typescript-eslint/strict-type-checked` + `@typescript-eslint/stylistic`. Don't handcraft rules.
- Path alias `@/*` → `src/*`. Set in `tsconfig.json` + bundler.
- Monorepo? Project references. One `tsconfig.base.json`, per-package `extends`.

## 8. Lazy Hard-Nos
Reject on sight:
- ❌ `any` in user code (lint it, fail CI on it)
- ❌ Type assertions (`x as Foo`) outside parser boundaries
- ❌ `enum` (use `as const` object or literal union)
- ❌ Non-null assertion (`!`) outside test files
- ❌ `// @ts-ignore` without an inline reason and ticket
- ❌ Mega `types.ts` per project — co-locate
- ❌ Reinvented `Pick`/`Omit`/`Partial` as custom helpers
- ❌ TS types used as runtime checks (they vanish after compilation)
- ❌ Class hierarchies for behavior — compose functions instead
- ❌ Conditional-type wizardry `<T, U, V extends ...>` when a simpler `interface` works
- ❌ Public API without exported Zod schema → runtime validation

## 9. CI / Project Hygiene
- `tsc --noEmit` step in CI (no emit, just check).
- ESLint with `@typescript-eslint` strict preset.
- `tsc --noEmit --watch` in dev for live errors.
- Pre-commit hook: `lint-staged` runs `eslint --fix` + `prettier`.
- Keep `package.json` `types` field exported for libraries.
- Generate API docs from JSDoc on exported types only.

## 10. Execution Checklist
Run through when reviewing `/typescript [target]`:
1. `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` on?
2. Zero `any` in `src/`? (Grep should confirm.)
3. Zod (or similar) at every external boundary (HTTP, storage, env)?
4. Discriminated unions for state machines — no boolean flags?
5. Branded types for IDs and other string-able domain concepts?
6. `Result<T,E>` for expected failures; typed `Error` subclasses for unexpected?
7. `Pick`/`Omit`/`Awaited`/`Parameters`/`ReturnType` used before custom helpers?
8. `satisfies` + `as const` for config tables?
9. `noUnusedLocals` / `noUnusedParameters` clean?
10. `assertNever` in every exhaustive switch?
11. `tsc --noEmit` green in CI?
12. Public types have a paired runtime schema?

---
*If you only remember three things: `unknown` + narrow instead of `any`; one Zod schema = one type; `Pick`/`Omit`/`Awaited` before custom helpers.*