# Hegemonia

> *Build your city. Forge your empire. Dominate the world.*

---

## What is Hegemonia?

**Hegemonia** is a real-time browser-based strategy game set in the ancient Mediterranean world. Players start as the ruler of a fledgling city-state and must develop it into a thriving metropolis — managing resources, constructing buildings, recruiting armies, and ultimately bending other civilizations to their will.

Inspired by the golden age of Greek city-states, Hegemonia combines the depth of empire-building with the tension of persistent multiplayer competition. Every decision matters. Every alliance can be betrayed. Every world has one winner.

---

## Core Pillars

### 🏛️ City Building
Design and grow your city from the ground up. Construct resource buildings, military academies, temples, harbors, and more. Each building unlocks new capabilities and shapes your strategic identity. Your city is never "finished" — there is always something to upgrade, optimize, or rebuild.

### ⚒️ Resource Management
Balance four core resources — **Food**, **Wood**, **Stone**, and **Gold** — to sustain your population, fund your constructions, and fuel your war machine. Scarcity is your constant enemy. Trade routes, raids, and efficient city planning are your tools.

### ⚔️ Military & Combat
Recruit diverse unit types: infantry, archers, cavalry, siege weapons, and naval fleets. Armies move in real-time across the world map. Plan your attacks with intelligence reports, time your assaults, and adapt your composition to your enemy's defenses.

### 🌍 World Map & Conquest
The world is a shared persistent map of islands and seas. Expand by founding new colonies, capturing enemy cities, and controlling strategic chokepoints. Territory means power — and power attracts enemies.

### 🤝 Alliances
No empire is built alone. Form alliances with other players, coordinate joint attacks, share resources, and establish dominance over entire regions. Internal alliance politics — diplomacy, betrayal, power struggles — are as important as battlefield tactics.

### 🏆 World Domination
Every game world has an end condition: a set of victory points to accumulate, or a final battle for world dominance. The alliance or player that reaches the threshold wins the world — and legends are written.

---

## Game Features

| Feature | Description |
|---------|-------------|
| **Real-time gameplay** | No turns. Events unfold continuously. Timers govern construction and movement. |
| **Persistent world** | The world lives 24/7. Attacks can come at any time. |
| **Multiple worlds** | Players can join different game worlds with varying rulesets and speed settings. |
| **Alliance system** | Full guild system: roles, permissions, shared diplomacy, internal messaging. |
| **Espionage** | Spy on enemy cities to gather intel before attacking. |
| **Trade** | Exchange resources with allies or on a global market. |
| **Events & Mythology** | Time-limited events themed around Greek mythology bring unique rewards. |
| **Dark / Light theme** | Full UI theme support — play your way. |
| **Multilingual** | Available in English and French from day one. |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (SSR + Server Functions) |
| Runtime | Bun |
| Language | TypeScript (strict) |
| Validation | Zod |
| UI | ShadCN UI + Tailwind CSS |
| Database | Neon.tech (Serverless PostgreSQL) |
| ORM | Drizzle ORM |
| i18n | English + French |
| Theme | Dark / Light / System |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions |

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/hegemonia.git
cd hegemonia

# Install dependencies
bun install

# Set up environment
cp .env.example .env.local
# Fill in your values in .env.local

# Push database schema
bun run db:push

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Project Structure

```
hegemonia/
├── app/
│   ├── components/       # Reusable UI components
│   ├── features/         # Domain-scoped feature modules
│   ├── routes/           # TanStack Start file-based routes
│   ├── server/           # Server functions & API handlers
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities, constants, helpers
├── db/
│   ├── schema/           # Drizzle schema
│   └── migrations/       # Database migrations
├── locales/              # i18n translation files (en, fr)
├── tests/                # Vitest unit + Playwright E2E
└── .github/              # Workflows & issue templates
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full technical design.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the complete contribution guide, branch strategy, PR process, and coding standards.

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture, data flow, stack decisions |
| [GAME_DESIGN.md](./GAME_DESIGN.md) | Full game design document: mechanics, economy, combat |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development workflow, conventions, PR process |
| [DATABASE.md](./DATABASE.md) | Database schema, relations, migration strategy |
| [API.md](./API.md) | Server functions reference and contracts |

---

## License

Proprietary. All rights reserved.