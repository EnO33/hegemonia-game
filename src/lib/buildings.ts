import type { ResourceAmounts } from './resources'

const WORLD_SPEED_MULTIPLIERS: Record<string, number> = {
  standard: 1,
  speed: 3,
  casual: 0.5,
}

export function getWorldSpeedMultiplier(speed: string): number {
  return WORLD_SPEED_MULTIPLIERS[speed] ?? 1
}

interface BuildingConfig {
  maxLevel: number
  baseCost: ResourceAmounts
  baseTime: number // seconds
}

const BUILDING_CONFIGS: Record<string, BuildingConfig> = {
  farm: {
    maxLevel: 30,
    baseCost: { food: 50, wood: 80, stone: 40, gold: 20 },
    baseTime: 300,
  },
  lumber_mill: {
    maxLevel: 30,
    baseCost: { food: 40, wood: 50, stone: 60, gold: 20 },
    baseTime: 300,
  },
  quarry: {
    maxLevel: 30,
    baseCost: { food: 40, wood: 60, stone: 50, gold: 20 },
    baseTime: 300,
  },
  market: {
    maxLevel: 20,
    baseCost: { food: 60, wood: 100, stone: 80, gold: 50 },
    baseTime: 450,
  },
  barracks: {
    maxLevel: 25,
    baseCost: { food: 80, wood: 120, stone: 100, gold: 60 },
    baseTime: 600,
  },
  stable: {
    maxLevel: 20,
    baseCost: { food: 100, wood: 150, stone: 120, gold: 80 },
    baseTime: 900,
  },
  siege_workshop: {
    maxLevel: 20,
    baseCost: { food: 120, wood: 200, stone: 180, gold: 100 },
    baseTime: 1200,
  },
  harbor: {
    maxLevel: 20,
    baseCost: { food: 100, wood: 180, stone: 150, gold: 100 },
    baseTime: 900,
  },
  wall: {
    maxLevel: 25,
    baseCost: { food: 60, wood: 100, stone: 200, gold: 40 },
    baseTime: 600,
  },
  senate: {
    maxLevel: 15,
    baseCost: { food: 100, wood: 150, stone: 120, gold: 80 },
    baseTime: 900,
  },
  academy: {
    maxLevel: 20,
    baseCost: { food: 80, wood: 120, stone: 100, gold: 120 },
    baseTime: 900,
  },
  warehouse: {
    maxLevel: 20,
    baseCost: { food: 60, wood: 100, stone: 80, gold: 40 },
    baseTime: 450,
  },
  tavern: {
    maxLevel: 15,
    baseCost: { food: 80, wood: 100, stone: 60, gold: 100 },
    baseTime: 600,
  },
  temple: {
    maxLevel: 20,
    baseCost: { food: 100, wood: 120, stone: 150, gold: 100 },
    baseTime: 900,
  },
}

/**
 * Get the config for a building type.
 */
export function getBuildingConfig(type: string): BuildingConfig | undefined {
  return BUILDING_CONFIGS[type]
}

/**
 * Calculate the resource cost to upgrade a building to the next level.
 * Cost scales by 1.5x per level.
 */
export function getUpgradeCost(type: string, currentLevel: number): ResourceAmounts | null {
  const config = BUILDING_CONFIGS[type]
  if (!config) return null

  const nextLevel = currentLevel + 1
  if (nextLevel > config.maxLevel) return null

  const multiplier = Math.pow(1.5, currentLevel)
  return {
    food: Math.round(config.baseCost.food * multiplier),
    wood: Math.round(config.baseCost.wood * multiplier),
    stone: Math.round(config.baseCost.stone * multiplier),
    gold: Math.round(config.baseCost.gold * multiplier),
  }
}

/**
 * Calculate construction time in seconds for the next level.
 * Formula: baseTime * 1.4^level * (0.95^senateLevel) * worldSpeedMultiplier
 */
export function getConstructionTime(
  type: string,
  currentLevel: number,
  senateLevel: number,
  worldSpeedMultiplier: number,
): number | null {
  const config = BUILDING_CONFIGS[type]
  if (!config) return null

  const nextLevel = currentLevel + 1
  if (nextLevel > config.maxLevel) return null

  const baseTime = config.baseTime * Math.pow(1.4, currentLevel)
  const senateReduction = Math.pow(0.95, senateLevel)
  return Math.round(baseTime * senateReduction * (1 / worldSpeedMultiplier))
}

/**
 * Check if a player can afford the upgrade cost.
 */
export function canAffordUpgrade(
  currentResources: ResourceAmounts,
  cost: ResourceAmounts,
): boolean {
  return (
    currentResources.food >= cost.food &&
    currentResources.wood >= cost.wood &&
    currentResources.stone >= cost.stone &&
    currentResources.gold >= cost.gold
  )
}
