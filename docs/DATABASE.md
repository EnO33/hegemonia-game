# Database — Hegemonia

## Overview

Hegemonia uses **PostgreSQL** hosted on **Neon.tech** (serverless), accessed via **Drizzle ORM**. The schema is the single source of truth for all data structures — TypeScript types are derived from it, never defined separately.

---

## Setup

```bash
# Push schema to database (development)
bun run db:push

# Generate and run migrations (staging/production)
bun run db:generate
bun run db:migrate

# Open Drizzle Studio
bun run db:studio
```

---

## Schema Conventions

- All tables use `uuid` primary keys with `defaultRandom()`
- All tables include `createdAt` and `updatedAt` timestamps
- Column names in `camelCase` in TypeScript, `snake_case` in PostgreSQL
- Foreign keys always have a corresponding index
- Soft deletes via `deletedAt` where historical data matters

---

## Schema Reference

### `worlds`
Represents a game world instance.

```ts
worlds {
  id           uuid PK
  name         varchar(100)
  speed        enum('standard', 'speed', 'casual')
  status       enum('open', 'active', 'ended')
  victoryType  enum('dominance', 'wonder', 'points')
  startedAt    timestamp
  endedAt      timestamp nullable
  createdAt    timestamp
  updatedAt    timestamp
}
```

---

### `users`
Platform-level user account.

```ts
users {
  id           uuid PK
  email        varchar(255) UNIQUE
  username     varchar(50) UNIQUE
  passwordHash varchar(255)
  role         enum('player', 'admin')
  createdAt    timestamp
  updatedAt    timestamp
}
```

---

### `players`
A user's participation in a specific world.

```ts
players {
  id        uuid PK
  userId    uuid FK → users.id
  worldId   uuid FK → worlds.id
  points    integer DEFAULT 0
  createdAt timestamp
  updatedAt timestamp

  UNIQUE (userId, worldId)
  INDEX  (worldId)
  INDEX  (userId)
}
```

---

### `islands`
Fixed map locations that contain city slots.

```ts
islands {
  id            uuid PK
  worldId       uuid FK → worlds.id
  x             integer           -- grid coordinate
  y             integer           -- grid coordinate
  terrainType   enum('standard', 'fertile', 'rocky', 'coastal')
  foodBonus     integer DEFAULT 0
  woodBonus     integer DEFAULT 0
  stoneBonus    integer DEFAULT 0
  maxCities     integer DEFAULT 4
  createdAt     timestamp

  UNIQUE (worldId, x, y)
  INDEX  (worldId)
}
```

---

### `cities`
A player's city on the world map.

```ts
cities {
  id              uuid PK
  playerId        uuid FK → players.id
  islandId        uuid FK → islands.id
  name            varchar(100)
  isCapital       boolean DEFAULT false
  morale          integer DEFAULT 100     -- 0-100
  population      integer DEFAULT 100
  populationCap   integer DEFAULT 500
  wallLevel       integer DEFAULT 0

  -- Snapshot-based resource tracking
  food            decimal(12,2) DEFAULT 0
  wood            decimal(12,2) DEFAULT 0
  stone           decimal(12,2) DEFAULT 0
  gold            decimal(12,2) DEFAULT 0
  lastResourceSnapshotAt timestamp

  createdAt       timestamp
  updatedAt       timestamp

  INDEX (playerId)
  INDEX (islandId)
}
```

---

### `buildings`
One row per building type per city.

```ts
buildings {
  id            uuid PK
  cityId        uuid FK → cities.id
  type          enum('farm', 'lumber_mill', 'quarry', 'market',
                      'barracks', 'stable', 'siege_workshop', 'harbor',
                      'wall', 'senate', 'academy', 'warehouse', 'tavern', 'temple')
  level         integer DEFAULT 0
  isUpgrading   boolean DEFAULT false
  upgradeStartedAt  timestamp nullable
  upgradeEndsAt    timestamp nullable
  createdAt     timestamp
  updatedAt     timestamp

  UNIQUE (cityId, type)
  INDEX  (cityId)
}
```

---

### `units`
Unit counts stationed in a city.

```ts
units {
  id       uuid PK
  cityId   uuid FK → cities.id
  type     enum('swordsman', 'hoplite', 'archer',
                'scout', 'horseman', 'cataphract',
                'battering_ram', 'catapult', 'trebuchet',
                'scout_ship', 'warship', 'transport', 'fire_ship',
                'colonist', 'spy')
  count    integer DEFAULT 0
  updatedAt timestamp

  UNIQUE (cityId, type)
  INDEX  (cityId)
}
```

---

### `unit_queues`
Training queue entries.

```ts
unit_queues {
  id           uuid PK
  cityId       uuid FK → cities.id
  unitType     enum(... same as units.type)
  count        integer
  startedAt    timestamp
  endsAt       timestamp
  createdAt    timestamp

  INDEX (cityId)
  INDEX (endsAt)    -- for scheduled processing
}
```

---

### `armies`
Moving armies between locations (attacks, support, returns).

```ts
armies {
  id              uuid PK
  worldId         uuid FK → worlds.id
  ownerPlayerId   uuid FK → players.id
  originCityId    uuid FK → cities.id
  targetCityId    uuid FK → cities.id
  type            enum('attack', 'raid', 'support', 'return', 'colony')
  status          enum('marching', 'arrived', 'returning', 'cancelled')
  departureAt     timestamp
  arrivalAt       timestamp
  returnAt        timestamp nullable
  createdAt       timestamp
  updatedAt       timestamp

  INDEX (worldId)
  INDEX (ownerPlayerId)
  INDEX (arrivalAt)   -- for scheduled processing
  INDEX (targetCityId)
}
```

---

### `army_units`
Unit composition of a moving army.

```ts
army_units {
  id       uuid PK
  armyId   uuid FK → armies.id
  type     enum(... same as units.type)
  count    integer

  INDEX (armyId)
}
```

---

### `battles`
Historical record of all combat events.

```ts
battles {
  id              uuid PK
  worldId         uuid FK → worlds.id
  armyId          uuid FK → armies.id
  attackerPlayerId uuid FK → players.id
  defenderPlayerId uuid FK → players.id nullable
  cityId          uuid FK → cities.id
  type            enum('attack', 'raid', 'naval')
  outcome         enum('attacker_victory', 'defender_victory', 'draw')
  resourcesLooted jsonb nullable
  resolvedAt      timestamp
  createdAt       timestamp

  INDEX (worldId)
  INDEX (attackerPlayerId)
  INDEX (defenderPlayerId)
  INDEX (cityId)
}
```

---

### `alliances`
Player alliance/guild.

```ts
alliances {
  id          uuid PK
  worldId     uuid FK → worlds.id
  name        varchar(100)
  tag         varchar(5)          -- e.g. [HEG]
  description text nullable
  points      integer DEFAULT 0
  createdAt   timestamp
  updatedAt   timestamp

  UNIQUE (worldId, tag)
  INDEX  (worldId)
}
```

---

### `alliance_members`
Player membership in an alliance.

```ts
alliance_members {
  id         uuid PK
  allianceId uuid FK → alliances.id
  playerId   uuid FK → players.id
  role       enum('founder', 'leader', 'officer', 'member')
  joinedAt   timestamp

  UNIQUE (playerId)     -- one alliance per player per world (enforced via player<>world unique)
  INDEX  (allianceId)
}
```

---

### `alliance_diplomacy`
Formal diplomatic agreements between alliances.

```ts
alliance_diplomacy {
  id              uuid PK
  allianceId      uuid FK → alliances.id
  targetAllianceId uuid FK → alliances.id
  type            enum('nap', 'trade', 'alliance', 'war')
  status          enum('pending', 'active', 'rejected', 'cancelled')
  createdAt       timestamp
  updatedAt       timestamp

  UNIQUE (allianceId, targetAllianceId, type)
  INDEX  (allianceId)
}
```

---

### `research`
Completed and in-progress research per player per world.

```ts
research {
  id          uuid PK
  playerId    uuid FK → players.id
  cityId      uuid FK → cities.id   -- research runs in Academy of specific city
  type        enum(... all tech keys)
  level       integer DEFAULT 0
  isResearching boolean DEFAULT false
  researchStartedAt timestamp nullable
  researchEndsAt    timestamp nullable
  createdAt   timestamp
  updatedAt   timestamp

  UNIQUE (playerId, type)
  INDEX  (playerId)
}
```

---

### `spy_missions`
Espionage mission log.

```ts
spy_missions {
  id              uuid PK
  senderPlayerId  uuid FK → players.id
  targetCityId    uuid FK → cities.id
  missionType     enum('scout_resources', 'scout_army', 'scout_buildings', 'full_report', 'sabotage')
  status          enum('in_progress', 'success', 'detected')
  result          jsonb nullable
  departureAt     timestamp
  arrivalAt       timestamp
  createdAt       timestamp

  INDEX (senderPlayerId)
  INDEX (targetCityId)
  INDEX (arrivalAt)
}
```

---

### `messages`
Alliance internal messaging.

```ts
messages {
  id         uuid PK
  allianceId uuid FK → alliances.id
  senderId   uuid FK → players.id
  content    text
  createdAt  timestamp

  INDEX (allianceId, createdAt)
}
```

---

## Migration Strategy

### Development
Use `bun run db:push` to sync schema changes directly. No migration files generated.

### Staging / Production
```bash
# 1. Generate migration from schema diff
bun run db:generate

# 2. Review generated SQL in db/migrations/
# 3. Apply migration
bun run db:migrate
```

### Migration Naming
Drizzle auto-names migrations by timestamp. Add a descriptive comment at the top of every generated file:

```sql
-- Migration: Add espionage system tables
-- Created: 2025-10-01
-- Issue: #87
```

### Rules
- Never edit a migration file after it has been applied to any environment
- Always test migrations on a Neon branch before applying to production
- Include rollback strategy in the PR description for schema-breaking changes

---

## Neon.tech Branching

Use Neon database branches for:
- **PR preview environments** — create a branch per PR, delete after merge
- **Staging** — persistent branch off main
- **Production** — main database branch

```bash
# Create a branch for a PR (via Neon CLI or GitHub Action)
neon branches create --name pr-42-feature-city-system

# Delete after merge
neon branches delete pr-42-feature-city-system
```

---

## Query Patterns

### Prefer `with` for relations

```typescript
// ✅ Single query with relations
const city = await db.query.cities.findFirst({
  where: eq(cities.id, cityId),
  with: {
    buildings: true,
    units: true,
    player: true,
  },
})

// ❌ N+1 pattern
const city = await db.query.cities.findFirst(...)
const buildings = await db.query.buildings.findMany({ where: eq(buildings.cityId, city.id) })
```

### Always paginate lists

```typescript
const cities = await db.query.cities.findMany({
  where: eq(cities.islandId, islandId),
  limit: 20,
  offset: page * 20,
  orderBy: desc(cities.points),
})
```

### Index strategy

Every FK column must have an index. Composite indexes for common query patterns:

```sql
-- Example: frequently queried together
CREATE INDEX idx_cities_player_world ON cities(player_id, island_id);
CREATE INDEX idx_armies_arrival ON armies(arrival_at) WHERE status = 'marching';
```