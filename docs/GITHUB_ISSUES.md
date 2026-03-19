# Initial GitHub Issues — Hegemonia

Open all of the following issues on GitHub at project kickoff. They represent the full initial scope of the project, organized by milestone.

---

## Milestone 1 — Project Foundation

### Issue 1: Project initialization and tooling setup
**Labels:** `chore`, `priority: high`
**Description:**
Initialize the TanStack Start project with Bun, configure TypeScript (strict mode), set up ESLint + Prettier, configure Tailwind CSS, integrate ShadCN UI, and set up the base folder structure as defined in ARCHITECTURE.md.

**Acceptance Criteria:**
- [ ] `bun run dev` starts the server
- [ ] `bun run typecheck` passes with zero errors
- [ ] `bun run lint` passes with zero warnings
- [ ] ShadCN UI components installable
- [ ] Tailwind dark/light/system theme working
- [ ] `.env.example` created with all required variables

---

### Issue 2: Environment variable validation
**Labels:** `chore`, `security`, `priority: high`
**Description:**
Create `src/env.ts` using Zod to validate all environment variables at startup. Application must refuse to start if required variables are missing or malformed.

**Acceptance Criteria:**
- [ ] All env vars defined in `src/env.ts` with Zod schema
- [ ] App throws a descriptive error on startup if any required var is missing
- [ ] `.env.example` documents all variables
- [ ] `env` object exported and used throughout the app (no `process.env` direct access)

---

### Issue 3: Database connection and Drizzle ORM setup
**Labels:** `chore`, `priority: high`
**Description:**
Configure Drizzle ORM with Neon.tech PostgreSQL. Set up the database client, drizzle config, and migration tooling. Confirm connectivity in development.

**Acceptance Criteria:**
- [ ] `drizzle.config.ts` configured
- [ ] `db/index.ts` exports the database client
- [ ] `bun run db:push` applies the schema
- [ ] `bun run db:generate` generates migration files
- [ ] `bun run db:migrate` applies migrations
- [ ] `bun run db:studio` opens Drizzle Studio

---

### Issue 4: i18n setup (en + fr)
**Labels:** `feature`, `i18n`, `priority: high`
**Description:**
Set up the i18n system with support for English and French. Configure namespace-based translation files, typed key access, and locale switching.

**Acceptance Criteria:**
- [ ] i18n library integrated (evaluate `next-intl` equivalent for TanStack Start or `i18next`)
- [ ] `locales/en/common.json` and `locales/fr/common.json` created
- [ ] `useTranslation` hook available in all components
- [ ] Locale switcher component created
- [ ] Language preference persisted (localStorage or cookie)
- [ ] All existing strings moved to i18n keys

---

### Issue 5: Dark / Light / System theme implementation
**Labels:** `feature`, `priority: high`
**Description:**
Implement full dark/light/system theme support using CSS variables and Tailwind. Theme preference must persist across sessions.

**Acceptance Criteria:**
- [ ] `ThemeProvider` wraps the app
- [ ] `ThemeToggle` component cycles between dark / light / system
- [ ] CSS variables defined for all ShadCN tokens in both themes
- [ ] Game-specific color tokens added (resource colors, etc.)
- [ ] Theme preference saved to localStorage
- [ ] No flash of unstyled content (FOUC) on load

---

### Issue 6: CI/CD pipeline with GitHub Actions
**Labels:** `chore`, `ci`, `priority: high`
**Description:**
Set up GitHub Actions workflows for quality checks on every PR and push to develop.

**Acceptance Criteria:**
- [ ] `ci.yml` workflow runs on every PR and push
- [ ] Steps: install deps, typecheck, lint, unit tests
- [ ] E2E workflow runs on PRs to develop
- [ ] `bun audit` runs to check for vulnerable dependencies
- [ ] Branch protection rules configured: `main` and `develop` require passing CI + 1 approval
- [ ] Neon branch created/deleted per PR (via Neon GitHub Action)

---

### Issue 7: Vitest + Playwright testing setup
**Labels:** `chore`, `priority: high`
**Description:**
Configure Vitest for unit tests and Playwright for E2E tests. Add coverage reporting.

**Acceptance Criteria:**
- [ ] `bun run test` runs Vitest
- [ ] `bun run test:coverage` generates coverage report
- [ ] `bun run test:e2e` runs Playwright
- [ ] Example unit test created
- [ ] Example E2E test created (home page loads)

---

## Milestone 2 — Authentication

### Issue 8: Authentication provider evaluation and integration
**Labels:** `feature`, `auth`, `priority: high`
**Description:**
Evaluate and integrate an authentication provider. Options: Clerk, Better Auth, Lucia. Must support session-based auth, email/password, and be compatible with TanStack Start.

**Acceptance Criteria:**
- [ ] Auth provider selected and documented (decision in PR description)
- [ ] Registration flow (email + password)
- [ ] Login flow
- [ ] Logout
- [ ] Session persistence
- [ ] Auth state accessible server-side in loaders and server functions
- [ ] `requireAuth()` utility function created

---

### Issue 9: User profile page
**Labels:** `feature`, `auth`
**Description:**
Create a basic user profile page showing username, email, and account settings.

**Acceptance Criteria:**
- [ ] Profile page at `/profile`
- [ ] Displays username and email
- [ ] Username change form (with validation)
- [ ] All strings i18n'd
- [ ] Protected route — redirects to login if not authenticated

---

## Milestone 3 — World & City Foundation

### Issue 10: Database schema — worlds and islands
**Labels:** `feature`, `db`, `priority: high`
**Description:**
Implement the Drizzle schema for `worlds` and `islands` tables as defined in DATABASE.md.

**Acceptance Criteria:**
- [ ] `db/schema/worlds.ts` created with correct types and indexes
- [ ] `db/schema/islands.ts` created with correct types and indexes
- [ ] Types exported and inferred from schema
- [ ] Migration generated and applied

---

### Issue 11: Database schema — cities, buildings, units
**Labels:** `feature`, `db`, `priority: high`
**Description:**
Implement the Drizzle schema for `cities`, `buildings`, `units`, and `unit_queues` tables.

**Acceptance Criteria:**
- [ ] All 4 tables created with correct types, constraints, and indexes
- [ ] TypeScript types inferred and exported
- [ ] Migration generated and applied
- [ ] Seed script creates sample data for development

---

### Issue 12: Database schema — players, alliances, armies, battles
**Labels:** `feature`, `db`, `priority: high`
**Description:**
Implement Drizzle schema for `players`, `alliances`, `alliance_members`, `alliance_diplomacy`, `armies`, `army_units`, and `battles`.

**Acceptance Criteria:**
- [ ] All tables created with correct types, constraints, and indexes
- [ ] TypeScript types inferred and exported
- [ ] Migration generated and applied

---

### Issue 13: World selection page
**Labels:** `feature`, `priority: high`
**Description:**
Create the world lobby where players can see available worlds and join one.

**Acceptance Criteria:**
- [ ] `/worlds` page lists all open worlds
- [ ] Displays world name, speed, player count, status
- [ ] "Join World" button creates a `Player` record
- [ ] Redirects to city overview after joining
- [ ] Protected route

---

### Issue 14: City creation flow
**Labels:** `feature`, `priority: high`
**Description:**
When a player joins a world for the first time, they must create their first city. Implement the city creation wizard.

**Acceptance Criteria:**
- [ ] City name input (validated: 3–100 chars, no profanity filter needed initially)
- [ ] Assigned to a random available island slot
- [ ] Capital flag set to true
- [ ] Default buildings created at level 0
- [ ] Default unit counts created at 0
- [ ] Redirects to city overview on success

---

### Issue 15: City overview page
**Labels:** `feature`, `priority: high`
**Description:**
The main city screen showing resources, buildings, and quick actions.

**Acceptance Criteria:**
- [ ] `/worlds/:worldId/city/:cityId` route
- [ ] Resource bar (Food, Wood, Stone, Gold) with current amounts and production rates
- [ ] Building grid showing all buildings with their current level
- [ ] Upgrade button per building (disabled if in progress or insufficient resources)
- [ ] Construction progress timer shown for active upgrade
- [ ] Fully responsive layout
- [ ] Dark/light theme compatible
- [ ] All strings i18n'd

---

## Milestone 4 — Resource & Building Systems

### Issue 16: Resource production calculation service
**Labels:** `feature`, `priority: high`
**Description:**
Implement the server-side resource production calculation based on building levels, terrain bonuses, and research bonuses.

**Acceptance Criteria:**
- [ ] `cityService.calculateResources(city)` returns current resource amounts
- [ ] Formula uses snapshot-based calculation (no polling)
- [ ] Accounts for building level, terrain bonus, research bonus
- [ ] Accounts for storage cap from Warehouse level
- [ ] Unit tests cover all formulas
- [ ] Production rates displayed correctly on city overview

---

### Issue 17: Building upgrade system
**Labels:** `feature`, `priority: high`
**Description:**
Implement the full building upgrade flow: cost checking, timer calculation, and completion.

**Acceptance Criteria:**
- [ ] Server function: `upgradeBuilding(cityId, buildingType)`
- [ ] Validates: sufficient resources, not already upgrading, below max level
- [ ] Deducts resources on start
- [ ] Sets `isUpgrading`, `upgradeStartedAt`, `upgradeEndsAt`
- [ ] Server-side job completes upgrade when timer expires
- [ ] UI reflects upgrade in progress (progress bar + countdown)
- [ ] Unit tests cover all validation paths

---

### Issue 18: Unit recruitment system
**Labels:** `feature`, `priority: high`
**Description:**
Implement the unit recruitment queue: adding units to the queue, training timer, and completion.

**Acceptance Criteria:**
- [ ] Recruitment page at `/worlds/:worldId/city/:cityId/recruit`
- [ ] Shows available unit types based on building levels
- [ ] Displays cost per unit (resources + time)
- [ ] Queue management: add, view, cancel
- [ ] Server-side job completes training when timer expires
- [ ] Unit tests for queue management and cost calculation

---

## Milestone 5 — World Map & Combat

### Issue 19: World map page
**Labels:** `feature`, `priority: high`
**Description:**
Implement a visual world map showing all islands, cities, and player territories.

**Acceptance Criteria:**
- [ ] `/worlds/:worldId/map` route
- [ ] Grid-based map rendering (SVG or Canvas — evaluate libraries)
- [ ] Islands displayed with city indicators
- [ ] Player cities highlighted
- [ ] Click island to see details (cities, available slots)
- [ ] Responsive and performant (virtualized for large maps)

---

### Issue 20: Attack system
**Labels:** `feature`, `priority: high`
**Description:**
Implement the full attack flow: army composition, travel timer, battle resolution, and result report.

**Acceptance Criteria:**
- [ ] Attack dialog: select target city, compose army
- [ ] Travel time calculated and displayed
- [ ] Army record created with `status: 'marching'`
- [ ] Combat resolved server-side on arrival
- [ ] Battle record created with outcome and losses
- [ ] Loot calculated and transferred
- [ ] Battle report accessible to both attacker and defender
- [ ] Unit tests for combat resolution formula

---

### Issue 21: Spy mission system
**Labels:** `feature`
**Description:**
Implement the espionage system: spy recruitment, mission dispatch, result, and detection.

**Acceptance Criteria:**
- [ ] Spy unit recruitable at Tavern
- [ ] Mission types: scout resources, scout army, scout buildings, full report, sabotage
- [ ] Detection chance calculated server-side
- [ ] Mission result stored and viewable
- [ ] Detection triggers notification to target player

---

## Milestone 6 — Alliance System

### Issue 22: Alliance creation and management
**Labels:** `feature`
**Description:**
Implement alliance founding, member management, and role-based permissions.

**Acceptance Criteria:**
- [ ] Create alliance: name + tag (unique per world)
- [ ] Invite players by username
- [ ] Role management: promote, demote, kick
- [ ] Alliance profile page
- [ ] Alliance member list with roles and points
- [ ] Leave alliance action

---

### Issue 23: Alliance diplomacy
**Labels:** `feature`
**Description:**
Implement formal diplomatic agreements between alliances (NAP, trade, alliance, war).

**Acceptance Criteria:**
- [ ] Send diplomatic proposal to another alliance
- [ ] Accept / reject proposal
- [ ] Active agreements visible on diplomacy screen
- [ ] War declaration triggers ranking tracking
- [ ] Cancel agreement action

---

### Issue 24: Alliance internal messaging
**Labels:** `feature`
**Description:**
Implement the alliance chat and message board.

**Acceptance Criteria:**
- [ ] Alliance chat page
- [ ] Messages paginated (newest first)
- [ ] New message form
- [ ] Officers+ can pin messages
- [ ] Polling for new messages (WebSocket in v2)

---

## Milestone 7 — Polish & Production

### Issue 25: Notifications system
**Labels:** `feature`
**Description:**
In-game notification center for battle results, alliance invites, construction completions, etc.

**Acceptance Criteria:**
- [ ] Notification bell in header with unread count
- [ ] Notification list with type icons
- [ ] Mark as read (individual + all)
- [ ] All game events generate appropriate notifications

---

### Issue 26: Player ranking / leaderboard
**Labels:** `feature`
**Description:**
Global world leaderboard showing top players and alliances by points.

**Acceptance Criteria:**
- [ ] `/worlds/:worldId/rankings` page
- [ ] Player ranking tab (points, cities, battles won)
- [ ] Alliance ranking tab (AP, member count)
- [ ] Search by player/alliance name
- [ ] Paginated

---

### Issue 27: Performance audit and optimization
**Labels:** `performance`, `chore`
**Description:**
Full performance audit before production launch. Identify and fix N+1 queries, slow routes, and unnecessary re-renders.

**Acceptance Criteria:**
- [ ] All routes load in < 500ms (p95)
- [ ] No N+1 queries (verified via query logging)
- [ ] Bundle size analyzed and optimized
- [ ] Lighthouse score >= 90 on key pages
- [ ] Database query plan reviewed for all major queries

---

### Issue 28: Security audit
**Labels:** `security`, `chore`, `priority: high`
**Description:**
Full security review before production launch.

**Acceptance Criteria:**
- [ ] All server functions have auth checks
- [ ] All inputs validated with Zod server-side
- [ ] Rate limiting implemented on all mutation endpoints
- [ ] `bun audit` passes with no high/critical vulnerabilities
- [ ] Sensitive data not exposed in API responses
- [ ] CSRF protection verified

---

### Issue 29: Production deployment setup
**Labels:** `chore`, `infra`, `priority: high`
**Description:**
Configure production deployment pipeline and environment.

**Acceptance Criteria:**
- [ ] Production deployment target configured (Vercel / Fly.io — to evaluate)
- [ ] Production Neon branch configured
- [ ] All environment variables set in production secrets
- [ ] Deploy on merge to `main`
- [ ] Health check endpoint at `/api/health`
- [ ] Error monitoring configured (Sentry or equivalent)

---

### Issue 30: Comprehensive E2E test suite
**Labels:** `test`, `priority: high`
**Description:**
Write full Playwright E2E test coverage for all critical user flows before production launch.

**Acceptance Criteria:**
- [ ] Registration + login flow
- [ ] World join + city creation flow
- [ ] Building upgrade flow
- [ ] Unit recruitment flow
- [ ] Attack dispatch flow
- [ ] Alliance creation + invite flow
- [ ] All tests pass in CI

---

*Open all 30 issues at project kickoff. Assign to milestones. Adjust priorities as the project evolves.*