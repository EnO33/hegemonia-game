import type { ResourceAmounts } from './resources'

interface UnitConfig {
  requiredBuilding: string
  requiredBuildingLevel: number
  cost: ResourceAmounts
  baseTrainingTime: number // seconds per unit
}

const UNIT_CONFIGS: Record<string, UnitConfig> = {
  // Infantry (Barracks)
  swordsman: {
    requiredBuilding: 'barracks',
    requiredBuildingLevel: 1,
    cost: { food: 10, wood: 0, stone: 0, gold: 50 },
    baseTrainingTime: 120,
  },
  hoplite: {
    requiredBuilding: 'barracks',
    requiredBuildingLevel: 5,
    cost: { food: 12, wood: 0, stone: 0, gold: 80 },
    baseTrainingTime: 180,
  },
  archer: {
    requiredBuilding: 'barracks',
    requiredBuildingLevel: 3,
    cost: { food: 8, wood: 20, stone: 0, gold: 70 },
    baseTrainingTime: 150,
  },
  // Cavalry (Stable)
  scout: {
    requiredBuilding: 'stable',
    requiredBuildingLevel: 1,
    cost: { food: 5, wood: 0, stone: 0, gold: 40 },
    baseTrainingTime: 90,
  },
  horseman: {
    requiredBuilding: 'stable',
    requiredBuildingLevel: 5,
    cost: { food: 20, wood: 0, stone: 0, gold: 150 },
    baseTrainingTime: 300,
  },
  cataphract: {
    requiredBuilding: 'stable',
    requiredBuildingLevel: 10,
    cost: { food: 25, wood: 0, stone: 0, gold: 200 },
    baseTrainingTime: 450,
  },
  // Siege (Siege Workshop)
  battering_ram: {
    requiredBuilding: 'siege_workshop',
    requiredBuildingLevel: 1,
    cost: { food: 0, wood: 100, stone: 50, gold: 80 },
    baseTrainingTime: 600,
  },
  catapult: {
    requiredBuilding: 'siege_workshop',
    requiredBuildingLevel: 5,
    cost: { food: 0, wood: 150, stone: 100, gold: 120 },
    baseTrainingTime: 900,
  },
  trebuchet: {
    requiredBuilding: 'siege_workshop',
    requiredBuildingLevel: 10,
    cost: { food: 0, wood: 200, stone: 150, gold: 200 },
    baseTrainingTime: 1200,
  },
  // Naval (Harbor)
  scout_ship: {
    requiredBuilding: 'harbor',
    requiredBuildingLevel: 1,
    cost: { food: 0, wood: 80, stone: 0, gold: 60 },
    baseTrainingTime: 300,
  },
  warship: {
    requiredBuilding: 'harbor',
    requiredBuildingLevel: 5,
    cost: { food: 0, wood: 200, stone: 0, gold: 150 },
    baseTrainingTime: 600,
  },
  transport: {
    requiredBuilding: 'harbor',
    requiredBuildingLevel: 3,
    cost: { food: 0, wood: 120, stone: 0, gold: 80 },
    baseTrainingTime: 450,
  },
  fire_ship: {
    requiredBuilding: 'harbor',
    requiredBuildingLevel: 10,
    cost: { food: 0, wood: 150, stone: 0, gold: 200 },
    baseTrainingTime: 750,
  },
  // Special (Tavern / Senate)
  colonist: {
    requiredBuilding: 'senate',
    requiredBuildingLevel: 10,
    cost: { food: 500, wood: 500, stone: 500, gold: 500 },
    baseTrainingTime: 3600,
  },
  spy: {
    requiredBuilding: 'tavern',
    requiredBuildingLevel: 1,
    cost: { food: 0, wood: 0, stone: 0, gold: 100 },
    baseTrainingTime: 300,
  },
}

export function getUnitConfig(type: string): UnitConfig | undefined {
  return UNIT_CONFIGS[type]
}

/**
 * Get total cost to recruit N units.
 */
export function getRecruitmentCost(unitType: string, count: number): ResourceAmounts | null {
  const config = UNIT_CONFIGS[unitType]
  if (!config || count <= 0) return null
  return {
    food: config.cost.food * count,
    wood: config.cost.wood * count,
    stone: config.cost.stone * count,
    gold: config.cost.gold * count,
  }
}

/**
 * Get training time in seconds for N units.
 * Training time decreases by 2% per building level.
 */
export function getTrainingTime(
  unitType: string,
  count: number,
  buildingLevel: number,
  worldSpeedMultiplier: number,
): number | null {
  const config = UNIT_CONFIGS[unitType]
  if (!config || count <= 0) return null
  const levelReduction = Math.pow(0.98, buildingLevel)
  return Math.round(config.baseTrainingTime * count * levelReduction * (1 / worldSpeedMultiplier))
}

/**
 * Get available unit types based on current building levels.
 */
export function getAvailableUnits(
  buildings: Array<{ type: string; level: number }>,
): string[] {
  return Object.entries(UNIT_CONFIGS)
    .filter(([, config]) => {
      const building = buildings.find((b) => b.type === config.requiredBuilding)
      return building && building.level >= config.requiredBuildingLevel
    })
    .map(([type]) => type)
}
