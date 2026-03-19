# Architecture — Hegemonia

## Overview

Hegemonia is a **server-side rendered, full-stack TypeScript application** built on TanStack Start. The architecture prioritizes type safety end-to-end, from database schema to UI props, with zero tolerance for runtime surprises.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TanStack Start (React SSR + Client Hydration)       │   │
│  │  ShadCN UI │ Tailwind CSS │ i18n │ Theme             │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │ Server Functions (RPC-like)
┌─────────────────────────▼───────────────────────────────────┐
│                    TanStack Start Server                    │
│  ┌──────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │Route Handlers│  │ Server Fns │  │  Middleware / Auth │   │
│  └──────────────┘  └─────┬──────┘  └────────────────────┘   │
│                          │ Zod validated                    │
│  ┌───────────────────────▼────────────────────────────────┐ │
│  │              Business Logic Layer (Services)           │ │
│  └───────────────────────┬────────────────────────────────┘ │
└──────────────────────────┼──────────────────────────────────┘
                           │ Drizzle ORM
┌──────────────────────────▼──────────────────────────────────┐
│                    Neon.tech (PostgreSQL)                   │
│         Serverless │ Connection Pooling │ Branching         │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack Decisions

### TanStack Start
- **Why:** Full-stack TypeScript with file-based routing, SSR, and server functions. Eliminates the API layer boilerplate — server functions are called like regular async functions from the client.
- **Key feature:** Loaders for data fetching, server functions for mutations — all type-safe.

### Bun
- **Why:** Significantly faster installs and test runs than Node/npm. Native TypeScript support. Used as the runtime and package manager.
- **Note:** Ensure CI also uses Bun via the official GitHub Action.

### Zod
- **Why:** Runtime schema validation that also generates TypeScript types. Used for:
  - Validating all server function inputs
  - Validating environment variables (`src/env.ts`)
  - Defining API contracts shared between client and server
  - Form validation schemas

### Drizzle ORM
- **Why:** Type-safe SQL-like query builder. Schema-first. Migrations are plain SQL — no magic.
- **Convention:** All schema files live in `db/schema/`. Each domain has its own file. Barrel exported via `db/schema/index.ts`.

### Neon.tech
- **Why:** Serverless PostgreSQL with autoscaling, connection pooling, and database branching for preview environments.
- **Usage:** One database per environment (dev, staging, prod). Use Neon branching for PR preview environments.

### ShadCN UI
- **Why:** Unstyled, accessible, composable components. Owned in the codebase — not a black-box dependency. Customizable to the pixel.
- **Rule:** Never use ShadCN components directly in feature code. Always wrap them in a local component (`app/components/ui/`).

### Tailwind CSS
- **Why:** Utility-first, co-located styles, excellent dark mode support via CSS variables.
- **Theme:** All colors defined as CSS variables in `globals.css`, consumed by Tailwind config. Never hardcode color values.

---

## Layer Architecture

### 1. Routes (`app/routes/`)
- File-based routing via TanStack Start conventions
- Each route file exports: `loader`, `component`, optionally `meta`
- Routes are **thin** — they fetch data via loaders and delegate rendering to feature components
- No business logic in route files

### 2. Server Functions (`app/server/`)
- Typed RPC-like functions called from client or server
- Every function validates its input with Zod before any logic
- Return typed results — never throw unhandled errors
- Structure:
```
app/server/
├── city/
│   ├── createCity.ts
│   ├── upgradeBuilding.ts
│   └── getCity.ts
├── units/
├── alliance/
└── combat/
```

### 3. Services (`app/features/*/service.ts`)
- Pure business logic functions
- No HTTP context — just TypeScript
- Fully unit-testable
- Called by server functions

### 4. Database Layer (`db/`)
- Drizzle schema as single source of truth
- All queries co-located with their feature service
- Never write raw SQL in application code

### 5. Components (`app/components/`)
```
components/
├── ui/          # ShadCN wrappers — only primitives
│   ├── Button.tsx
│   ├── Card.tsx
│   └── ...
└── game/        # Game-specific reusable components
    ├── ResourceBar.tsx
    ├── BuildingCard.tsx
    ├── UnitIcon.tsx
    └── ...
```

### 6. Features (`app/features/`)
Each feature is a self-contained vertical slice:
```
features/city/
├── components/       # Feature-specific UI
├── hooks/            # Feature-specific hooks
├── service.ts        # Business logic
├── schema.ts         # Zod schemas for this domain
├── types.ts          # TypeScript types
└── constants.ts      # Game constants for this domain
```

---

## Data Flow

### Read (Query)
```
Route Loader
  → calls server function (or direct DB query in loader)
  → Drizzle query (typed)
  → returns typed data
  → passed as props to component
```

### Write (Mutation)
```
User Action (form submit, button click)
  → calls server function
  → Zod validates input (reject early if invalid)
  → Auth check (reject if unauthorized)
  → Service layer processes business logic
  → Drizzle mutation
  → returns typed result
  → client updates UI (optimistic or refetch)
```

---

## Type Safety Strategy

### End-to-End Types

```typescript
// 1. Define schema in Drizzle
export const cities = pgTable('cities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  // ...
})

// 2. Infer TypeScript type from schema
export type City = typeof cities.$inferSelect
export type NewCity = typeof cities.$inferInsert

// 3. Define Zod schema for input validation
export const createCitySchema = z.object({
  name: z.string().min(3).max(100),
  worldId: z.string().uuid(),
})

// 4. Server function is typed end-to-end
export const createCity = createServerFn()
  .validator(createCitySchema)
  .handler(async ({ data }) => {
    // data is fully typed here
    return cityService.create(data)
  })
```

### Environment Variables

All env vars validated at startup with Zod:
```typescript
// src/env.ts
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'test', 'production']),
})

export const env = envSchema.parse(process.env)
```

---

## Error Handling Strategy

**No try/catch for control flow.** Use typed results instead.

```typescript
// Pattern: Result type
type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E }

// Usage in service
export async function upgradeBuilding(
  input: UpgradeBuildingInput
): Promise<Result<Building>> {
  const building = await db.query.buildings.findFirst(...)

  if (!building) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Building not found' } }
  }

  if (building.level >= MAX_LEVEL) {
    return { success: false, error: { code: 'MAX_LEVEL', message: 'Already at max level' } }
  }

  // ... proceed
  return { success: true, data: updated }
}
```

---

## Authentication & Authorization

- **Auth provider:** TBD (Clerk or Better Auth — to be evaluated by auth-agent)
- Session validated on every server function
- Role-based access: `player`, `alliance_leader`, `admin`
- Server functions check permission before business logic:

```typescript
// Always first in server functions
const session = await requireAuth()
const player = await requirePlayer(session.userId, worldId)
```

---

## Real-Time Game Loop

Game state evolves continuously on the server based on timestamps:

- **Construction timers:** Stored as `startedAt` + `duration`. Progress calculated on read.
- **Resource production:** Calculated as `lastCollectedAt` + `rate * elapsed`. No polling — computed on demand.
- **Army movement:** Stored as `departureAt` + `arrivalAt`. Server processes arrival via scheduled jobs.
- **No WebSocket initially** — polling with SWR or TanStack Query. WebSocket/SSE added in v2 for real-time notifications.

---

## i18n Strategy

```
locales/
├── en/
│   ├── common.json
│   ├── city.json
│   ├── units.json
│   ├── alliance.json
│   └── combat.json
└── fr/
    ├── common.json
    ├── city.json
    ├── units.json
    ├── alliance.json
    └── combat.json
```

**Key naming convention:** `namespace.feature.element`
```json
{
  "city.building.barracks.name": "Barracks",
  "city.building.barracks.description": "Train infantry units here.",
  "city.building.upgrade.cta": "Upgrade to level {{level}}"
}
```

**Rules:**
- Every string visible to the user must have an i18n key
- Keys must exist in both `en` and `fr` before merging
- Use typed key access — never string literals in components

---

## Theming

```css
/* globals.css — token definitions */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  /* ... all ShadCN tokens */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

Game-specific tokens extend the base theme:
```css
:root {
  --resource-food: 142 71% 45%;
  --resource-wood: 25 95% 53%;
  --resource-stone: 215 20% 65%;
  --resource-gold: 48 96% 53%;
}
```

---

## Testing Strategy

### Unit Tests (Vitest)
- All service functions
- All Zod schemas
- All utility functions
- Target: 80%+ coverage on `app/features/*/service.ts`

### E2E Tests (Playwright)
Critical paths:
- Player registration & login
- City creation
- Building construction & upgrade
- Unit recruitment
- Alliance creation & invitation
- Attack dispatch & resolution

### CI Pipeline
```yaml
on: [push, pull_request]
jobs:
  quality:
    - bun run typecheck    # Zero TS errors
    - bun run lint         # Zero ESLint errors
    - bun run test         # All unit tests pass
  e2e:
    - bun run test:e2e     # All E2E tests pass (on PRs to develop)
```

---

## Performance Guidelines

| Rule | Detail |
|------|--------|
| No N+1 queries | Use Drizzle `with` for relations |
| Paginate all lists | Default page size: 20 |
| Index foreign keys | Every FK column must have an index |
| Memoize expensive computations | Use `useMemo` / `useCallback` deliberately |
| Image optimization | Use `<img>` with explicit dimensions, lazy loading |
| Bundle analysis | Run `bun run build --analyze` before major releases |

---

## Security Checklist

- [ ] All inputs validated with Zod server-side
- [ ] Auth checked before any data access
- [ ] No sensitive data in client-side state
- [ ] Rate limiting on all mutation endpoints
- [ ] CSRF protection enabled
- [ ] SQL injection impossible via Drizzle parameterization
- [ ] Environment variables validated at startup
- [ ] No secrets in repository (`.env` in `.gitignore`)
- [ ] Dependency audit on every CI run (`bun audit`)