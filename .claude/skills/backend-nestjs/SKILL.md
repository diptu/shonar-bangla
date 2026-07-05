---
name: nestjs-architect
description: >
  Enterprise NestJS architect. Scalable, secure, maintainable backends —
  Clean Architecture, SOLID, modern NestJS, zero fluff. Use when designing
  or reviewing NestJS services, modules, or APIs.
---

# NestJS Architect

## Trigger
`/nestjs [path|service_name]` — review or scaffold a NestJS project against this rubric.

## 1. The Lazy Doctrine
- Lean on NestJS DI. Don't write factories the framework already gives you.
- One source of truth per concern. If `class-validator` does it, don't write a custom pipe.
- Generate boilerplate (`nest g resource`, schematics), don't type it twice.
- Convention over configuration — name files the way the CLI expects.
- If a bullet below contradicts "did the framework just solve this?", ignore the bullet.

## 2. Module Layout (feature-first)
```
src/
  app.module.ts
  main.ts
  config/                 # env schema, loaders (Joi/Zod)
  common/                 # filters, interceptors, decorators, guards
  shared/                 # cross-feature infra clients (S3, mail, queue)
  modules/
    <feature>/
      <feature>.module.ts
      <feature>.controller.ts
      <feature>.service.ts
      dto/
      entities/           # TypeORM / Prisma / Mongoose models
      repositories/       # only if persistence logic is non-trivial
      interfaces/
      events/             # domain events in/out
      tests/
```
- One module per bounded capability. No god-modules.
- `common/` = pure infrastructure (filters, pipes, decorators). Never business code.
- `shared/` = thin clients wrapping external SDKs. Nothing else.

## 3. The Rules (terse)

| Concern | Do | Avoid |
|---|---|---|
| Controllers | HTTP shape, validation, delegation. <50 lines each. | Business logic, direct repo access, try/catch |
| Services | Business rules. Composable, framework-agnostic where cheap. | 500-line god-services, static helpers |
| Persistence | Repositories (custom provider or `@nestjs/typeorm`) | Raw `EntityManager` in controllers, N+1 loops |
| Validation | `class-validator` + `class-transformer` DTOs + global `ValidationPipe` | Manual `if (!body.x)` checks, trusting client |
| Auth | Delegated to AuthService / `@nestjs/jwt` / `@nestjs/passport` | Rolling JWT by hand, storing creds, secrets in code |
| Authz | Guards + `@Roles()` / CASL policies | `if (user.role === 'admin')` scattered in services |
| Errors | Typed domain exceptions + global `ExceptionFilter` | `throw new Error('oops')`, raw stack leaks |
| Config | `@nestjs/config` + Joi/Zod schema at boot | `process.env.X` sprinkled across modules |
| Logging | `nestjs-pino` + correlation ID middleware | `console.log`, unstructured strings |
| Docs | `@nestjs/swagger` decorators on every controller/DTO | Hand-written OpenAPI files that drift |
| Events | `@nestjs/event-emitter` or message broker; idempotent handlers | Synchronous cross-module calls for side-effects |
| Performance | `CacheModule` (Redis), pagination DTOs, cursor over offset for big lists | Eager loading everything, unbounded `find()` |
| Security | Helmet, CORS allow-list, rate-limit (`@nestjs/throttler`), input sanitization | Trusting origin `*` in prod, leaking user enumeration |
| Testing | Unit (services) + e2e (controllers via `supertest`) + repo integration | Mocking the framework itself |

## 4. Scaffolding Shortcuts
- `nest new` → `nest g resource <feature>` → done. Edit, don't rewrite.
- Shared DTOs in `common/dto/`, not duplicated per feature.
- Base entity / base repository pattern when you have 3+ entities — save yourself 200 lines per repo.
- A single `BaseController<T, CreateDto, UpdateDto>` for boring CRUD endpoints. Only escape it when logic diverges.
- Auto-generate Swagger with `SwaggerModule.setup` + `DocumentBuilder`. Don't handcraft YAML.

## 5. Lazy Hard-Nos
These cost more than they save. Reject on sight:
- ❌ Static utility classes instead of injected services
- ❌ `any` in DTOs / services
- ❌ Direct DB calls from controllers
- ❌ Hardcoded role/permission strings in business code
- ❌ Secrets in `.env` committed to git
- ❌ Returning ORM entities from controllers (leaks schema; map to response DTOs)
- ❌ Long-running logic in `onModuleInit` (use a queue)
- ❌ Synchronous HTTP between microservices (use events/queues)

## 6. Production Defaults (ship these day 1)
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`
- Global `ExceptionFilter` → uniform `{ statusCode, message, correlationId, path }`
- Helmet + CORS allow-list + ThrottlerGuard
- Graceful shutdown: `app.enableShutdownHooks()`
- Health probes: `@nestjs/terminus` (`/health/live`, `/health/ready`)
- Pino logger with request ID + tenant ID
- Env validation fails fast on boot

## 7. Execution Checklist
Run through when reviewing `/nestjs [target]`:
1. Module boundaries clean? Anything in `common/` that's actually business logic?
2. Controllers thin? Any DB/ORM imports outside `repositories/`?
3. DTOs everywhere on the wire? Response mapping present?
4. Auth via guards, not inline checks?
5. Env validated at boot? No `process.env` leaks?
6. Errors funnel through one filter?
7. Swagger present and accurate?
8. Pagination on every list endpoint?
9. Health + graceful shutdown + throttling wired?
10. Tests: at least one happy-path e2e per public controller, unit tests for non-trivial services.

---
*If you only remember three things: thin controllers, validated env at boot, one global exception filter. The rest follows.*