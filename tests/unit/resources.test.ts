import { describe, expect, it } from 'vitest'
import {
  getBuildingProductionRate,
  getStorageCap,
  calculateProductionRates,
  calculateCurrentResources,
} from '../../src/lib/resources'
import type { Building } from '../../db/schema/buildings'
import type { City } from '../../db/schema/cities'
import type { Island } from '../../db/schema/islands'
import type { Research } from '../../db/schema/research'

function makeBuilding(overrides: Partial<Building> & { type: string; level: number }): Building {
  return {
    id: 'b-1',
    cityId: 'c-1',
    isUpgrading: false,
    upgradeStartedAt: null,
    upgradeEndsAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Building
}

function makeIsland(overrides?: Partial<Island>): Island {
  return {
    id: 'i-1',
    worldId: 'w-1',
    x: 0,
    y: 0,
    terrainType: 'standard',
    foodBonus: 0,
    woodBonus: 0,
    stoneBonus: 0,
    maxCities: 4,
    createdAt: new Date(),
    ...overrides,
  } as Island
}

function makeCity(overrides?: Partial<City>): City {
  return {
    id: 'c-1',
    playerId: 'p-1',
    islandId: 'i-1',
    name: 'Test City',
    isCapital: true,
    morale: 100,
    population: 100,
    populationCap: 500,
    wallLevel: 0,
    food: '500',
    wood: '300',
    stone: '200',
    gold: '100',
    lastResourceSnapshotAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as City
}

describe('getBuildingProductionRate', () => {
  it('returns 0 for unknown building types', () => {
    expect(getBuildingProductionRate('unknown', 5)).toBe(0)
  })

  it('returns 0 for level 0', () => {
    expect(getBuildingProductionRate('farm', 0)).toBe(0)
  })

  it('returns base rate at level 1', () => {
    expect(getBuildingProductionRate('farm', 1)).toBe(100)
  })

  it('applies compound multiplier at higher levels', () => {
    // Level 2: 100 * 1.15^1 = 115
    expect(getBuildingProductionRate('farm', 2)).toBe(115)
    // Level 3: 100 * 1.15^2 ≈ 132
    expect(getBuildingProductionRate('farm', 3)).toBe(132)
  })

  it('calculates for different building types', () => {
    expect(getBuildingProductionRate('lumber_mill', 1)).toBe(80)
    expect(getBuildingProductionRate('quarry', 1)).toBe(60)
    expect(getBuildingProductionRate('market', 1)).toBe(40)
  })
})

describe('getStorageCap', () => {
  it('returns base cap at level 0', () => {
    expect(getStorageCap(0)).toBe(1000)
  })

  it('increases by 500 per level', () => {
    expect(getStorageCap(1)).toBe(1500)
    expect(getStorageCap(5)).toBe(3500)
    expect(getStorageCap(20)).toBe(11000)
  })
})

describe('calculateProductionRates', () => {
  it('returns zero rates with no buildings', () => {
    const rates = calculateProductionRates([], makeIsland(), [])
    expect(rates).toEqual({ food: 0, wood: 0, stone: 0, gold: 0 })
  })

  it('calculates rates based on building levels', () => {
    const buildings = [
      makeBuilding({ type: 'farm', level: 1 }),
      makeBuilding({ type: 'lumber_mill', level: 2 }),
    ]
    const rates = calculateProductionRates(buildings, makeIsland(), [])
    expect(rates.food).toBe(100)
    expect(rates.wood).toBe(92) // 80 * 1.15^1 = 92
    expect(rates.stone).toBe(0)
    expect(rates.gold).toBe(0)
  })

  it('applies terrain bonuses', () => {
    const buildings = [makeBuilding({ type: 'farm', level: 1 })]
    const island = makeIsland({ foodBonus: 20 })
    const rates = calculateProductionRates(buildings, island, [])
    // 100 * 1.2 = 120
    expect(rates.food).toBe(120)
  })

  it('applies research bonuses', () => {
    const buildings = [makeBuilding({ type: 'farm', level: 1 })]
    const researchList: Research[] = [
      {
        id: 'r-1',
        playerId: 'p-1',
        cityId: 'c-1',
        type: 'improved_farming',
        level: 2,
        isResearching: false,
        researchStartedAt: null,
        researchEndsAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Research,
    ]
    const rates = calculateProductionRates(buildings, makeIsland(), researchList)
    // 100 * 1.0 (terrain) * 1.2 (research: 2 * 0.1) = 120
    expect(rates.food).toBe(120)
  })

  it('ignores non-resource buildings', () => {
    const buildings = [
      makeBuilding({ type: 'barracks', level: 10 }),
      makeBuilding({ type: 'senate', level: 5 }),
    ]
    const rates = calculateProductionRates(buildings, makeIsland(), [])
    expect(rates).toEqual({ food: 0, wood: 0, stone: 0, gold: 0 })
  })
})

describe('calculateCurrentResources', () => {
  it('returns snapshot values when time is zero', () => {
    const now = new Date()
    const city = makeCity({ lastResourceSnapshotAt: now })
    const rates = { food: 100, wood: 80, stone: 60, gold: 40 }
    const result = calculateCurrentResources(city, rates, 10000, now)
    expect(result.food).toBe(500)
    expect(result.wood).toBe(300)
    expect(result.stone).toBe(200)
    expect(result.gold).toBe(100)
  })

  it('adds production over elapsed time', () => {
    const snapshotTime = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-01-01T02:00:00Z') // 2 hours later
    const city = makeCity({ lastResourceSnapshotAt: snapshotTime })
    const rates = { food: 100, wood: 80, stone: 60, gold: 40 }
    const result = calculateCurrentResources(city, rates, 10000, now)
    // food: 500 + 100*2 = 700
    expect(result.food).toBe(700)
    // wood: 300 + 80*2 = 460
    expect(result.wood).toBe(460)
    // stone: 200 + 60*2 = 320
    expect(result.stone).toBe(320)
    // gold: 100 + 40*2 = 180
    expect(result.gold).toBe(180)
  })

  it('clamps resources to storage cap', () => {
    const snapshotTime = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-01-01T10:00:00Z') // 10 hours later
    const city = makeCity({ lastResourceSnapshotAt: snapshotTime })
    const rates = { food: 100, wood: 80, stone: 60, gold: 40 }
    const storageCap = 1000
    const result = calculateCurrentResources(city, rates, storageCap, now)
    // food: 500 + 100*10 = 1500 → clamped to 1000
    expect(result.food).toBe(1000)
    // wood: 300 + 80*10 = 1100 → clamped to 1000
    expect(result.wood).toBe(1000)
    // stone: 200 + 60*10 = 800 → within cap
    expect(result.stone).toBe(800)
    // gold: 100 + 40*10 = 500 → within cap
    expect(result.gold).toBe(500)
  })

  it('handles negative elapsed time gracefully', () => {
    const snapshotTime = new Date('2026-01-01T10:00:00Z')
    const now = new Date('2026-01-01T08:00:00Z') // before snapshot
    const city = makeCity({ lastResourceSnapshotAt: snapshotTime })
    const rates = { food: 100, wood: 80, stone: 60, gold: 40 }
    const result = calculateCurrentResources(city, rates, 10000, now)
    // Should return clamped snapshot values, not subtract
    expect(result.food).toBe(500)
    expect(result.wood).toBe(300)
  })
})
