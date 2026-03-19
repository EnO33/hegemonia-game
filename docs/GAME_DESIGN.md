# Game Design Document — Hegemonia

## Vision Statement

Hegemonia is a persistent, real-time, browser-based strategy game where players build city-states, forge alliances, and fight for dominance over a shared world. The game rewards long-term planning, political intelligence, and strategic timing over raw activity.

---

## Core Game Loop

```
Build Resources → Construct Buildings → Recruit Units
       ↑                                      ↓
  Expand Territory ← Conquer Cities ← Launch Attacks
       ↓
  Join/Lead Alliance → Coordinate Wars → Dominate World
```

---

## World Structure

### Worlds
- A **World** is an isolated game instance with its own map, players, and end condition
- Multiple worlds can run simultaneously with different speed settings:
  - **Standard** — 1x speed
  - **Speed** — 3x speed
  - **Casual** — 0.5x speed, no overnight attacks
- Each world has a **Victory Condition** (see Endgame)

### Map
- The world map is a grid of **islands** separated by **sea zones**
- Each island contains a fixed number of **city slots**
- Players found cities in available slots
- Islands have **terrain bonuses** (e.g., Fertile Island: +20% food production)
- Sea zones can be controlled by naval fleets

---

## City System

### Founding a City
- Every player starts with one city (their **capital**)
- Additional cities can be founded by sending a **Colony Ship** to an available slot
- Founding cost: significant resources + a **Colonist** unit

### City Overview
Each city has:
- A **name** (player-defined)
- A **population** cap (grows with city level)
- A **morale** stat (affects production and defense)
- A **wall level** (defensive multiplier)
- A set of **buildings**
- A set of **units** stationed or in training

---

## Resource System

### Four Core Resources

| Resource | Production Source | Primary Use |
|----------|-----------------|-------------|
| **Food** | Farm | Population, unit upkeep |
| **Wood** | Lumber Mill | Construction, ships |
| **Stone** | Quarry | Construction, walls |
| **Gold** | Market, Trade | Units, research, diplomacy |

### Production Formula
```
production_per_hour = base_rate × building_level_multiplier × terrain_bonus × research_bonus
current_amount = last_snapshot + (production_per_hour × hours_since_snapshot)
```

### Storage Cap
Each resource has a cap defined by the **Warehouse** building level. Resources beyond the cap are lost.

### Upkeep
- Each military unit consumes **Food** per hour
- If Food hits 0, unit upkeep draws from Gold
- If Gold hits 0, units begin to desert (random unit removed per hour)

---

## Building System

### Building Categories

#### Resource Buildings
| Building | Resource Produced | Max Level |
|----------|-----------------|-----------|
| Farm | Food | 30 |
| Lumber Mill | Wood | 30 |
| Quarry | Stone | 30 |
| Market | Gold | 20 |

#### Military Buildings
| Building | Purpose | Max Level |
|----------|---------|-----------|
| Barracks | Train infantry units | 25 |
| Stable | Train cavalry units | 20 |
| Siege Workshop | Train siege units | 20 |
| Harbor | Train naval units, manage fleets | 20 |
| Wall | Defensive bonus vs. attacks | 25 |

#### Support Buildings
| Building | Purpose | Max Level |
|----------|---------|-----------|
| Senate | City administration, diplomacy | 15 |
| Academy | Research technologies | 20 |
| Warehouse | Increase resource storage cap | 20 |
| Tavern | Recruit heroes, manage spies | 15 |
| Temple | Generate divine favor, research myths | 20 |

### Construction Rules
- Only **one construction** can run per city at a time (upgradeable via research)
- Construction time decreases with higher **Senate** level
- Cancelling a construction refunds 50% of spent resources
- Each building requires specific prerequisites

### Construction Time Formula
```
base_time × (0.95 ^ senate_level) × world_speed_multiplier
```

---

## Unit System

### Unit Categories

#### Infantry
| Unit | Attack | Defense | Speed | Food Cost | Gold Cost |
|------|--------|---------|-------|-----------|-----------|
| Swordsman | 12 | 8 | 1 | 10 | 50 |
| Hoplite | 8 | 18 | 1 | 12 | 80 |
| Archer | 10 | 6 | 1 | 8 | 70 |

#### Cavalry
| Unit | Attack | Defense | Speed | Food Cost | Gold Cost |
|------|--------|---------|-------|-----------|-----------|
| Scout | 5 | 4 | 4 | 5 | 40 |
| Horseman | 20 | 10 | 3 | 20 | 150 |
| Cataphract | 15 | 25 | 2 | 25 | 200 |

#### Siege
| Unit | Attack | Defense | Speed | Primary Role |
|------|--------|---------|-------|------|
| Battering Ram | 5 | 3 | 0.5 | Destroys walls |
| Catapult | 8 | 4 | 0.5 | Ranged assault |
| Trebuchet | 12 | 3 | 0.3 | Long-range bombardment |

#### Naval
| Unit | Attack | Defense | Speed | Role |
|------|--------|---------|-------|------|
| Scout Ship | 10 | 5 | 5 | Reconnaissance |
| Warship | 25 | 15 | 3 | Naval combat |
| Transport | 5 | 10 | 2 | Carry land units |
| Fire Ship | 40 | 5 | 2 | Anti-fleet specialist |

### Recruitment
- Units are queued at their respective building
- Queue is processed in order; each unit takes a fixed duration
- Multiple units can be queued but trained one at a time
- Training time reduced by building level

### Unit Upkeep
```
total_upkeep_per_hour = Σ (unit_count × unit.food_per_hour)
```

---

## Combat System

### Attack Types

| Type | Purpose | Requires |
|------|---------|----------|
| **Raid** | Steal resources | Land units |
| **Attack** | Capture or destroy city | Land units |
| **Naval Attack** | Destroy enemy fleet | Naval units |
| **Support** | Reinforce ally | Any units |
| **Spy Mission** | Intel gathering | Spies (from Tavern) |

### Movement & Travel Time
```
travel_time = distance(origin, destination) / army_speed × world_speed_multiplier
```

- Distance is calculated in grid cells (Manhattan or Euclidean — TBD)
- Army speed = **slowest unit** in the army
- Naval transport required to cross sea zones

### Combat Resolution

Combat is **simultaneous** — both attacker and defender deal damage at the same time.

```
Phase 1: Ranged phase (archers, catapults fire)
Phase 2: Melee phase (infantry, cavalry engage)
Phase 3: Siege phase (if applicable — wall damage calculated)

For each phase:
  attacker_power = Σ (unit.attack × unit.count × modifiers)
  defender_power = Σ (unit.defense × unit.count × modifiers)

  attacker_losses = (defender_power / attacker_power) × attacker_unit_count × loss_factor
  defender_losses = (attacker_power / defender_power) × defender_unit_count × loss_factor
```

Modifiers include:
- Wall bonus (defender)
- Research bonuses
- Hero skills
- Terrain bonuses

### City Capture
A city is **captured** when:
1. The attacker wins the battle (all defenders eliminated or routed)
2. The attacker has at least one **Colonist** unit in the attacking army

If captured:
- The city changes ownership
- Buildings remain (at reduced durability)
- Resources are partially looted
- Original owner can attempt to recapture

### City Destruction
If attacker wins without a Colonist:
- Buildings are damaged
- Resources are looted
- City remains in original ownership but severely weakened

---

## Alliance System

### Alliance Structure
- Minimum 2 players to found an alliance
- Maximum size: configurable per world (default: 50 players)
- Alliance ranks:
  - **Founder** — full permissions
  - **Leader** — manage members, declare war
  - **Officer** — invite players, manage diplomacy
  - **Member** — participate in alliance actions

### Alliance Features
- **Shared Map Vision** — see all alliance members' cities and army movements
- **Alliance Chat** — real-time internal messaging
- **Alliance Forum** — persistent discussion board
- **Resource Sharing** — send resources to allies
- **Coordinated Attacks** — plan joint attacks with synchronized timers
- **Alliance Treasury** — pooled resources for collective spending

### Diplomacy
Alliances can establish formal agreements:

| Status | Effect |
|--------|--------|
| **War** | Formal declaration, enables alliance leaderboard tracking |
| **Peace** | No formal agreement, attacks still possible |
| **Non-Aggression Pact (NAP)** | Informal agreement, visible on diplomacy screen |
| **Trade Agreement** | Reduced market fees between alliances |
| **Alliance** | Full cooperation — shared map, coordinated defense |

### Alliance Points
Each alliance accumulates **Alliance Points (AP)**:
- AP gained from: holding cities, winning battles, completing quests
- AP lost from: losing cities, failed attacks
- Global Alliance Ranking visible to all players

---

## Research System

### Academy Research Tree
Organized in 5 branches:

#### ⚒️ Economy
- Improved Farming → +Food production per level
- Advanced Mining → +Stone production per level
- Trading Routes → Unlock inter-player trade
- Double Construction → Enable 2 simultaneous builds

#### ⚔️ Military
- Iron Swords → +Attack for infantry
- Hardened Shields → +Defense for infantry
- Cavalry Training → +Speed for mounted units
- Advanced Siege → Unlock Trebuchet

#### 🌊 Naval
- Shipbuilding → Unlock Warship
- Naval Tactics → +Attack for all naval units
- Troop Transport → Unlock Transport Ship

#### 🔬 Espionage
- Basic Espionage → Unlock Spy unit
- Counter-Intelligence → Harder to spy on your cities
- Advanced Intelligence → Reveal enemy unit composition

#### 🏛️ Governance
- Efficient Administration → Reduce construction time
- City Planning → +Population cap
- Colonization → Reduce Colony Ship cost

---

## Espionage System

### Spy Missions
Spies are recruited at the **Tavern**.

| Mission | Info Revealed | Cost |
|---------|--------------|------|
| Scout Resources | Current resource amounts | 1 spy |
| Scout Army | Unit counts in city | 2 spies |
| Scout Buildings | Building levels | 2 spies |
| Full Report | Everything | 5 spies |
| Sabotage | Destroy a random building level | 3 spies |

### Detection
- Each mission has a **detection chance** based on:
  - Your Espionage research level
  - Target's Counter-Intelligence research level
- If detected: spies captured, sender revealed to target

---

## Endgame & Victory

### Victory Conditions (configurable per world)

#### Alliance Dominance
First alliance to accumulate **X Victory Points** wins.
VP sources: city slots held, wonders controlled, battles won.

#### World Wonder
A legendary **Wonder of the World** appears late-game on a neutral island. The alliance that holds it for **48 consecutive hours** wins the world.

#### Points Race
After a set time limit (e.g., 90 days), the alliance with the highest total AP wins.

### World Reset
After a world ends:
- All game data is archived and preserved for historical records
- A new world starts
- Players choose to join the new world or retire

---

## Progression & Retention

### Daily Quests
Simple tasks rewarded with resources or speed-ups:
- "Train 10 infantry units"
- "Upgrade one building"
- "Spy on an enemy city"

### Achievement System
Permanent profile achievements:
- "First Blood" — win your first battle
- "Founder" — found your first alliance
- "Conqueror" — capture 5 cities
- "World Ender" — win a world

### Mythological Events
Time-limited events themed around Greek mythology:
- **Poseidon's Fury** — naval combat bonus week
- **Ares' Blessing** — reduced unit training time
- **Athena's Wisdom** — research speed doubled

Events offer unique rewards and temporary game modifiers.

---

## Monetization (Future)

The game follows a **fair-to-play** model:
- **No pay-to-win** — premium currency cannot buy military advantage
- Premium can unlock: cosmetic city skins, additional world slots, historical stat archive access
- Speed-ups available via in-game quests and achievements, not only purchase

---

## Anti-Cheat & Fair Play

- All game calculations performed **server-side only**
- Rate limiting on all actions
- Server validates every action against game state before applying
- Automated detection for coordinated multi-accounting (IP + behavioral analysis)
- Reported violations reviewed by moderation team