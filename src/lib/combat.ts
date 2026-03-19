/**
 * Combat resolution system.
 *
 * Combat is simultaneous — attacker and defender deal damage at the same time.
 * Formula from GAME_DESIGN.md:
 *   attacker_power = Σ(unit.attack × unit.count × modifiers)
 *   defender_power = Σ(unit.defense × unit.count × modifiers)
 *   attacker_losses = (defender_power / attacker_power) × attacker_count × loss_factor
 *   defender_losses = (attacker_power / defender_power) × defender_count × loss_factor
 */

const LOSS_FACTOR = 0.3

interface UnitStats {
  attack: number
  defense: number
}

const UNIT_STATS: Record<string, UnitStats> = {
  swordsman: { attack: 12, defense: 8 },
  hoplite: { attack: 8, defense: 18 },
  archer: { attack: 10, defense: 6 },
  scout: { attack: 5, defense: 4 },
  horseman: { attack: 20, defense: 10 },
  cataphract: { attack: 15, defense: 25 },
  battering_ram: { attack: 5, defense: 3 },
  catapult: { attack: 8, defense: 4 },
  trebuchet: { attack: 12, defense: 3 },
  scout_ship: { attack: 10, defense: 5 },
  warship: { attack: 25, defense: 15 },
  transport: { attack: 5, defense: 10 },
  fire_ship: { attack: 40, defense: 5 },
  colonist: { attack: 0, defense: 1 },
  spy: { attack: 0, defense: 1 },
}

const UNIT_SPEED: Record<string, number> = {
  swordsman: 1,
  hoplite: 1,
  archer: 1,
  scout: 4,
  horseman: 3,
  cataphract: 2,
  battering_ram: 0.5,
  catapult: 0.5,
  trebuchet: 0.3,
  scout_ship: 5,
  warship: 3,
  transport: 2,
  fire_ship: 2,
  colonist: 0.5,
  spy: 3,
}

export interface ArmyComposition {
  type: string
  count: number
}

export interface CombatModifiers {
  wallLevel: number
  researchBonusAttack: number // percentage, e.g. 0.1 = 10%
  researchBonusDefense: number
}

export interface CombatResult {
  outcome: 'attacker_victory' | 'defender_victory' | 'draw'
  attackerLosses: ArmyComposition[]
  defenderLosses: ArmyComposition[]
  attackerSurvivors: ArmyComposition[]
  defenderSurvivors: ArmyComposition[]
}

export interface LootResult {
  food: number
  wood: number
  stone: number
  gold: number
}

/**
 * Calculate total attack/defense power for an army.
 */
function calculatePower(
  army: ArmyComposition[],
  side: 'attack' | 'defense',
  modifier: number,
): number {
  return army.reduce((total, unit) => {
    const stats = UNIT_STATS[unit.type]
    if (!stats) return total
    const stat = side === 'attack' ? stats.attack : stats.defense
    return total + stat * unit.count * (1 + modifier)
  }, 0)
}

/**
 * Resolve combat between attacker and defender armies.
 */
export function resolveCombat(
  attackerArmy: ArmyComposition[],
  defenderArmy: ArmyComposition[],
  modifiers: CombatModifiers,
): CombatResult {
  const wallBonus = 1 + modifiers.wallLevel * 0.05

  const attackerPower = calculatePower(attackerArmy, 'attack', modifiers.researchBonusAttack)
  const defenderPower = calculatePower(defenderArmy, 'defense', modifiers.researchBonusDefense) * wallBonus

  if (attackerPower === 0 && defenderPower === 0) {
    return {
      outcome: 'draw',
      attackerLosses: [],
      defenderLosses: [],
      attackerSurvivors: attackerArmy.map((u) => ({ ...u })),
      defenderSurvivors: defenderArmy.map((u) => ({ ...u })),
    }
  }

  const attackerLossRatio = defenderPower > 0
    ? Math.min(1, (defenderPower / Math.max(1, attackerPower)) * LOSS_FACTOR)
    : 0

  const defenderLossRatio = attackerPower > 0
    ? Math.min(1, (attackerPower / Math.max(1, defenderPower)) * LOSS_FACTOR)
    : 0

  const attackerLosses: ArmyComposition[] = []
  const attackerSurvivors: ArmyComposition[] = []
  const defenderLosses: ArmyComposition[] = []
  const defenderSurvivors: ArmyComposition[] = []

  for (const unit of attackerArmy) {
    const lost = Math.min(unit.count, Math.round(unit.count * attackerLossRatio))
    const survived = unit.count - lost
    if (lost > 0) attackerLosses.push({ type: unit.type, count: lost })
    if (survived > 0) attackerSurvivors.push({ type: unit.type, count: survived })
  }

  for (const unit of defenderArmy) {
    const lost = Math.min(unit.count, Math.round(unit.count * defenderLossRatio))
    const survived = unit.count - lost
    if (lost > 0) defenderLosses.push({ type: unit.type, count: lost })
    if (survived > 0) defenderSurvivors.push({ type: unit.type, count: survived })
  }

  const totalAttackerSurvivors = attackerSurvivors.reduce((sum, u) => sum + u.count, 0)
  const totalDefenderSurvivors = defenderSurvivors.reduce((sum, u) => sum + u.count, 0)

  let outcome: CombatResult['outcome']
  if (totalAttackerSurvivors > 0 && totalDefenderSurvivors === 0) {
    outcome = 'attacker_victory'
  } else if (totalDefenderSurvivors > 0 && totalAttackerSurvivors === 0) {
    outcome = 'defender_victory'
  } else if (attackerPower > defenderPower) {
    outcome = 'attacker_victory'
  } else if (defenderPower > attackerPower) {
    outcome = 'defender_victory'
  } else {
    outcome = 'draw'
  }

  return {
    outcome,
    attackerLosses,
    defenderLosses,
    attackerSurvivors,
    defenderSurvivors,
  }
}

/**
 * Calculate loot from a successful raid/attack.
 * Attacker takes up to 20% of defender's resources.
 */
export function calculateLoot(
  defenderResources: { food: number; wood: number; stone: number; gold: number },
  carryCapacity: number,
): LootResult {
  const maxLoot = {
    food: Math.floor(defenderResources.food * 0.2),
    wood: Math.floor(defenderResources.wood * 0.2),
    stone: Math.floor(defenderResources.stone * 0.2),
    gold: Math.floor(defenderResources.gold * 0.2),
  }

  const totalAvailable = maxLoot.food + maxLoot.wood + maxLoot.stone + maxLoot.gold
  if (totalAvailable <= carryCapacity) {
    return maxLoot
  }

  // Proportional distribution
  const ratio = carryCapacity / totalAvailable
  return {
    food: Math.floor(maxLoot.food * ratio),
    wood: Math.floor(maxLoot.wood * ratio),
    stone: Math.floor(maxLoot.stone * ratio),
    gold: Math.floor(maxLoot.gold * ratio),
  }
}

/**
 * Calculate travel time in seconds between two islands.
 * Uses Manhattan distance. Speed = slowest unit.
 */
export function calculateTravelTime(
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
  army: ArmyComposition[],
  worldSpeedMultiplier: number,
): number {
  const distance = Math.abs(targetX - originX) + Math.abs(targetY - originY)
  if (distance === 0) return 60 // same island, minimum 1 minute

  const slowestSpeed = army.reduce((min, unit) => {
    const speed = UNIT_SPEED[unit.type] ?? 1
    return Math.min(min, speed)
  }, Infinity)

  const effectiveSpeed = Math.max(0.1, slowestSpeed)
  return Math.round((distance / effectiveSpeed) * 3600 * (1 / worldSpeedMultiplier))
}

export function getUnitStats(type: string): UnitStats | undefined {
  return UNIT_STATS[type]
}
