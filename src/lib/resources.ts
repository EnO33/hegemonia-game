import type { Building } from '../../db/schema/buildings'
import type { City } from '../../db/schema/cities'
import type { Island } from '../../db/schema/islands'
import type { Research } from '../../db/schema/research'

// Base production rate per hour at level 1
const BASE_RATES: Record<string, number> = {
  farm: 100,
  lumber_mill: 80,
  quarry: 60,
  market: 40,
}

// Building type → resource mapping
const BUILDING_RESOURCE_MAP: Record<string, keyof ResourceAmounts> = {
  farm: 'food',
  lumber_mill: 'wood',
  quarry: 'stone',
  market: 'gold',
}

// Terrain bonus field → resource mapping
const TERRAIN_BONUS_MAP: Record<string, keyof ResourceAmounts> = {
  foodBonus: 'food',
  woodBonus: 'wood',
  stoneBonus: 'stone',
}

// Research type → resource bonus mapping
const RESEARCH_BONUS_MAP: Record<string, keyof ResourceAmounts> = {
  improved_farming: 'food',
  advanced_mining: 'stone',
  trading_routes: 'gold',
}

// Research bonus per level (10% per level)
const RESEARCH_BONUS_PER_LEVEL = 0.1

// Base warehouse capacity + per-level increase
const BASE_STORAGE_CAP = 1000
const STORAGE_PER_LEVEL = 500

export interface ResourceAmounts {
  food: number
  wood: number
  stone: number
  gold: number
}

export interface ProductionRates {
  food: number
  wood: number
  stone: number
  gold: number
}

export interface ResourceCalculationResult {
  currentResources: ResourceAmounts
  productionRates: ProductionRates
  storageCap: number
}

/**
 * Calculate production rate per hour for a given building.
 * Formula: base_rate × level × 1.15 (compound per level)
 */
export function getBuildingProductionRate(buildingType: string, level: number): number {
  const baseRate = BASE_RATES[buildingType]
  if (!baseRate || level === 0) return 0
  return Math.round(baseRate * Math.pow(1.15, level - 1))
}

/**
 * Get terrain bonus multiplier for a resource.
 * Terrain bonus is a percentage (e.g., 20 = +20%).
 */
function getTerrainMultiplier(island: Island, resource: keyof ResourceAmounts): number {
  for (const [bonusField, res] of Object.entries(TERRAIN_BONUS_MAP)) {
    if (res === resource) {
      const bonus = island[bonusField as keyof Island]
      if (typeof bonus === 'number') {
        return 1 + bonus / 100
      }
    }
  }
  return 1
}

/**
 * Get research bonus multiplier for a resource.
 */
function getResearchMultiplier(
  researchList: Research[],
  resource: keyof ResourceAmounts,
): number {
  let bonus = 0
  for (const [researchType, res] of Object.entries(RESEARCH_BONUS_MAP)) {
    if (res === resource) {
      const r = researchList.find((research) => research.type === researchType)
      if (r) {
        bonus += r.level * RESEARCH_BONUS_PER_LEVEL
      }
    }
  }
  return 1 + bonus
}

/**
 * Calculate the storage cap based on warehouse level.
 */
export function getStorageCap(warehouseLevel: number): number {
  return BASE_STORAGE_CAP + warehouseLevel * STORAGE_PER_LEVEL
}

/**
 * Calculate production rates per hour for all resources.
 */
export function calculateProductionRates(
  buildings: Building[],
  island: Island,
  researchList: Research[],
): ProductionRates {
  const rates: ProductionRates = { food: 0, wood: 0, stone: 0, gold: 0 }

  for (const building of buildings) {
    const resource = BUILDING_RESOURCE_MAP[building.type]
    if (!resource) continue

    const baseProduction = getBuildingProductionRate(building.type, building.level)
    const terrainMultiplier = getTerrainMultiplier(island, resource)
    const researchMultiplier = getResearchMultiplier(researchList, resource)

    rates[resource] += Math.round(baseProduction * terrainMultiplier * researchMultiplier)
  }

  return rates
}

/**
 * Calculate current resource amounts based on snapshot + production over time.
 * Clamps to storage cap.
 */
export function calculateCurrentResources(
  city: City,
  productionRates: ProductionRates,
  storageCap: number,
  now?: Date,
): ResourceAmounts {
  const currentTime = now ?? new Date()
  const hoursSinceSnapshot =
    (currentTime.getTime() - new Date(city.lastResourceSnapshotAt).getTime()) / 3600000

  if (hoursSinceSnapshot < 0) {
    return {
      food: clampResource(parseFloat(String(city.food)), storageCap),
      wood: clampResource(parseFloat(String(city.wood)), storageCap),
      stone: clampResource(parseFloat(String(city.stone)), storageCap),
      gold: clampResource(parseFloat(String(city.gold)), storageCap),
    }
  }

  return {
    food: clampResource(
      parseFloat(String(city.food)) + productionRates.food * hoursSinceSnapshot,
      storageCap,
    ),
    wood: clampResource(
      parseFloat(String(city.wood)) + productionRates.wood * hoursSinceSnapshot,
      storageCap,
    ),
    stone: clampResource(
      parseFloat(String(city.stone)) + productionRates.stone * hoursSinceSnapshot,
      storageCap,
    ),
    gold: clampResource(
      parseFloat(String(city.gold)) + productionRates.gold * hoursSinceSnapshot,
      storageCap,
    ),
  }
}

function clampResource(amount: number, cap: number): number {
  return Math.min(Math.max(0, amount), cap)
}
