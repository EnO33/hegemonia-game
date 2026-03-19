# Contributing to Hegemonia

Welcome. This document defines the complete workflow for contributing to this project. Every contributor — human or automated — must follow these guidelines without exception.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Branching Strategy](#branching-strategy)
4. [Issue Management](#issue-management)
5. [Development Workflow](#development-workflow)
6. [Commit Conventions](#commit-conventions)
7. [Pull Request Process](#pull-request-process)
8. [Code Standards](#code-standards)
9. [Testing Requirements](#testing-requirements)
10. [Review Checklist](#review-checklist)

---

## Prerequisites

- **Bun** >= 1.1.0
- **Node.js** >= 20 (for compatibility tooling)
- **Git** >= 2.40
- Access to the Neon.tech project (request from project owner)
- GitHub account with repository access

---

## Repository Setup

```bash
# 1. Clone
git clone https://github.com/your-org/hegemonia.git
cd hegemonia

# 2. Install dependencies
bun install

# 3. Set up environment
cp .env.example .env.local
# Fill in values — ask a maintainer for dev credentials

# 4. Set up the database
bun run db:push

# 5. Seed development data
bun run db:seed

# 6. Start the dev server
bun run dev
```

---

## Branching Strategy

### Branch Hierarchy

```
main        ← Production only. Protected. Merges from develop via release PR.
develop     ← Integration branch. All feature/fix PRs target this branch.
  ├── feature/*
  ├── fix/*
  ├── refactor/*
  ├── chore/*
  └── docs/*
```

### Branch Naming

| Prefix | When to use | Example |
|--------|------------|---------|
| `feature/` | New functionality | `feature/city-building-system` |
| `fix/` | Bug fix | `fix/resource-overflow-calculation` |
| `refactor/` | Code quality, no behavior change | `refactor/extract-combat-service` |
| `chore/` | Dependencies, config, tooling | `chore/upgrade-drizzle-orm` |
| `docs/` | Documentation only | `docs/update-api-reference` |

### Rules
- **One branch = one issue = one PR**
- Branch names use `kebab-case` after the prefix
- Never push directly to `main` or `develop`
- Delete your branch after the PR is merged

---

## Issue Management

### Every task starts with an issue

Before opening a branch or writing a line of code, an issue must exist.

### Issue Templates

Use the appropriate template:
- **Feature** — New capability
- **Bug** — Something is broken
- **Chore** — Maintenance task
- **Documentation** — Docs improvement

### Required Issue Fields
- **Title:** Clear and specific (e.g., "Add resource production calculation to city service")
- **Description:** What, why, and any relevant context
- **Acceptance Criteria:** Checkbox list of what "done" looks like
- **Labels:** Apply relevant labels (see below)
- **Milestone:** Assign to the appropriate milestone
- **Assignee:** Self-assign when you start work

### Labels

| Label | Usage |
|-------|-------|
| `feature` | New functionality |
| `bug` | Confirmed bug |
| `chore` | Maintenance |
| `docs` | Documentation |
| `good first issue` | Suitable for new contributors |
| `needs review` | Waiting for review |
| `blocked` | Blocked by another issue |
| `priority: high` | Must be resolved in current milestone |
| `priority: low` | Nice to have |
| `security` | Security-related |
| `performance` | Performance improvement |
| `breaking change` | Changes public interface |

---

## Development Workflow

### Step-by-Step

```bash
# 1. Make sure develop is up to date
git checkout develop
git pull origin develop

# 2. Create your branch from develop
git checkout -b feature/my-feature

# 3. Work in small, focused commits
git add -p   # Stage changes selectively
git commit -m "feat(city): add resource production formula"

# 4. Push regularly
git push origin feature/my-feature

# 5. When ready, open a PR against develop
```

### Keeping Your Branch Up to Date

```bash
# Rebase onto develop (preferred over merge)
git fetch origin
git rebase origin/develop

# Resolve conflicts if any, then
git rebase --continue
```

### Before Opening a PR

Run the full quality check locally:
```bash
bun run typecheck    # Must pass with zero errors
bun run lint         # Must pass with zero warnings
bun run test         # Must pass 100%
bun run build        # Must complete without error
```

---

## Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `chore` | Build process, dependency updates, config |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `perf` | Performance improvement |
| `style` | Formatting, no logic change |
| `ci` | CI/CD configuration |

### Scopes

Use the feature/domain name as scope:
`city`, `units`, `combat`, `alliance`, `map`, `auth`, `db`, `api`, `i18n`, `theme`, `infra`

### Examples

```
feat(city): add resource production rate calculation
fix(combat): correct attacker loss formula for ranged phase
chore(deps): upgrade drizzle-orm to 0.32.0
refactor(alliance): extract invitation logic to dedicated service
docs(api): document city server functions
test(units): add unit tests for recruitment queue
perf(db): add composite index on cities(world_id, owner_id)
```

### Rules
- Use the **imperative mood**: "add", not "added" or "adds"
- No capital letter on the first word of the description
- No period at the end
- Keep description under 72 characters
- Reference issue in footer: `Closes #42`
- **Never mention AI tooling** in any commit message

---

## Pull Request Process

### Opening a PR

1. Target branch is always **`develop`** (never `main`)
2. Use the PR template (auto-filled by GitHub)
3. Title follows commit conventions: `feat(city): add resource system`
4. Description must include:
   - Summary of changes
   - `Closes #<issue-number>`
   - Testing instructions (if non-obvious)
   - Screenshots (for UI changes)

### PR Template

```markdown
## Summary
<!-- What does this PR do? -->

## Related Issue
Closes #

## Changes
<!-- Bullet list of key changes -->

## Testing
<!-- How to test this change manually -->

## Checklist
- [ ] TypeScript compiles without errors (`bun run typecheck`)
- [ ] Linting passes (`bun run lint`)
- [ ] All tests pass (`bun run test`)
- [ ] i18n keys added for both `en` and `fr`
- [ ] No hardcoded strings in UI
- [ ] No `any` types introduced
- [ ] No `try/catch` for control flow
- [ ] Components are reusable and not feature-locked
- [ ] Security: input validation present where needed
```

### Review Process

- Every PR requires **at least one approval** before merging
- Reviewer must verify the checklist above
- Address all review comments before requesting re-review
- Prefer **resolving conversations** over back-and-forth
- PRs that sit without activity for 7 days are flagged as stale

### Merging

- **Squash and merge** — one clean commit per PR on `develop`
- Branch is automatically deleted after merge
- Squash commit message follows the PR title (must be Conventional Commits compliant)

---

## Code Standards

### TypeScript

```typescript
// ✅ Correct — explicit typing
const getCity = async (id: string): Promise<City> => { ... }

// ❌ Forbidden — any
const getCity = async (id: any): Promise<any> => { ... }

// ✅ Correct — unknown + type guard
const parse = (data: unknown): City => {
  return citySchema.parse(data)
}
```

### Positive Code (Guard Clauses First)

```typescript
// ✅ Correct
function upgradeBuilding(building: Building, resources: Resources): Result<Building> {
  if (!building) return err('NOT_FOUND')
  if (building.level >= MAX_LEVEL) return err('MAX_LEVEL')
  if (!hasEnoughResources(resources, building)) return err('INSUFFICIENT_RESOURCES')

  return ok(applyUpgrade(building))
}

// ❌ Forbidden — deeply nested, inverted logic
function upgradeBuilding(building: Building, resources: Resources) {
  if (building) {
    if (building.level < MAX_LEVEL) {
      if (hasEnoughResources(resources, building)) {
        return applyUpgrade(building)
      }
    }
  }
}
```

### No Try/Catch

```typescript
// ✅ Correct — typed Result
import { ok, err, Result } from 'neverthrow' // or custom Result type

async function fetchCity(id: string): Promise<Result<City, AppError>> {
  const city = await db.query.cities.findFirst({ where: eq(cities.id, id) })
  if (!city) return err({ code: 'NOT_FOUND' })
  return ok(city)
}

// ❌ Forbidden
async function fetchCity(id: string) {
  try {
    const city = await db.query.cities.findFirst(...)
    return city
  } catch (e) {
    console.error(e)
    return null
  }
}
```

### Reusable Components

```tsx
// ✅ Correct — generic, reusable
interface ResourceBadgeProps {
  type: ResourceType
  amount: number
  showIcon?: boolean
}

export const ResourceBadge = ({ type, amount, showIcon = true }: ResourceBadgeProps) => (
  <span className={cn('resource-badge', `resource-badge--${type}`)}>
    {showIcon && <ResourceIcon type={type} />}
    {formatNumber(amount)}
  </span>
)

// ❌ Forbidden — hardcoded, non-reusable
export const FoodBadge = ({ amount }: { amount: number }) => (
  <span className="text-green-500">🌾 {amount}</span>
)
```

### Zod Validation

```typescript
// ✅ All server function inputs validated
const attackCitySchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  units: z.record(unitTypeSchema, z.number().int().positive()),
})

export const attackCity = createServerFn()
  .validator(attackCitySchema)
  .handler(async ({ data }) => { ... })
```

### i18n

```tsx
// ✅ Correct
const { t } = useTranslation('city')
return <h1>{t('city.building.barracks.name')}</h1>

// ❌ Forbidden — hardcoded string
return <h1>Barracks</h1>
```

---

## Testing Requirements

### What must be tested

| Code Type | Test Type | Coverage Target |
|-----------|-----------|----------------|
| Service functions | Unit (Vitest) | 100% |
| Zod schemas | Unit (Vitest) | 100% |
| Utility functions | Unit (Vitest) | 100% |
| Server functions | Integration | Key paths |
| Critical user flows | E2E (Playwright) | All critical paths |

### Test Naming Convention

```typescript
describe('cityService.upgradeBuilding', () => {
  it('returns NOT_FOUND when building does not exist', async () => { ... })
  it('returns MAX_LEVEL when building is already at level 30', async () => { ... })
  it('returns INSUFFICIENT_RESOURCES when player cannot afford the upgrade', async () => { ... })
  it('upgrades the building level when all conditions are met', async () => { ... })
})
```

### Running Tests

```bash
bun run test           # Run all unit tests
bun run test:watch     # Watch mode
bun run test:e2e       # Run E2E tests (requires running dev server)
bun run test:coverage  # Coverage report
```

---

## Review Checklist

Before approving any PR, verify:

### Correctness
- [ ] Feature works as described in the linked issue
- [ ] Edge cases are handled
- [ ] No obvious logic errors

### Type Safety
- [ ] No `any` types
- [ ] All function signatures explicitly typed
- [ ] Zod schemas used for all external inputs

### Code Quality
- [ ] Guard clauses used — positive code pattern followed
- [ ] No `try/catch` for control flow
- [ ] No duplicated logic — reusable components and functions used
- [ ] No magic numbers or hardcoded strings

### Security
- [ ] Auth checked before data access in server functions
- [ ] All inputs validated server-side
- [ ] No sensitive data leaked in responses

### Testing
- [ ] Unit tests cover new service logic
- [ ] Tests are meaningful — not just coverage padding

### i18n
- [ ] All user-facing strings have i18n keys
- [ ] Keys present in both `en` and `fr`

### Performance
- [ ] No N+1 queries introduced
- [ ] No unnecessary re-renders
- [ ] No unbounded data fetching (pagination present where needed)