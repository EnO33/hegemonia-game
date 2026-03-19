import { describe, expect, it } from 'vitest'
import {
  getBuildingConfig,
  getUpgradeCost,
  getConstructionTime,
  canAffordUpgrade,
  getWorldSpeedMultiplier,
} from '../../src/lib/buildings'

describe('getBuildingConfig', () => {
  it('returns config for known building types', () => {
    const config = getBuildingConfig('farm')
    expect(config).toBeDefined()
    expect(config?.maxLevel).toBe(30)
  })

  it('returns undefined for unknown types', () => {
    expect(getBuildingConfig('unknown')).toBeUndefined()
  })
})

describe('getUpgradeCost', () => {
  it('returns base cost at level 0', () => {
    const cost = getUpgradeCost('farm', 0)
    expect(cost).toEqual({ food: 50, wood: 80, stone: 40, gold: 20 })
  })

  it('scales cost by 1.5x per level', () => {
    const cost = getUpgradeCost('farm', 1)
    expect(cost).toEqual({
      food: Math.round(50 * 1.5),
      wood: Math.round(80 * 1.5),
      stone: Math.round(40 * 1.5),
      gold: Math.round(20 * 1.5),
    })
  })

  it('returns null at max level', () => {
    expect(getUpgradeCost('farm', 30)).toBeNull()
  })

  it('returns null for unknown types', () => {
    expect(getUpgradeCost('unknown', 0)).toBeNull()
  })
})

describe('getConstructionTime', () => {
  it('returns base time at level 0 with standard speed', () => {
    const time = getConstructionTime('farm', 0, 0, 1)
    expect(time).toBe(300)
  })

  it('increases time with level', () => {
    const time = getConstructionTime('farm', 5, 0, 1)
    expect(time).toBeGreaterThan(300)
    // 300 * 1.4^5 = 300 * 5.378 ≈ 1613
    expect(time).toBe(Math.round(300 * Math.pow(1.4, 5)))
  })

  it('reduces time with senate level', () => {
    const withoutSenate = getConstructionTime('farm', 0, 0, 1)
    const withSenate = getConstructionTime('farm', 0, 10, 1)
    expect(withSenate).toBeLessThan(withoutSenate!)
    // 300 * 0.95^10 ≈ 179
    expect(withSenate).toBe(Math.round(300 * Math.pow(0.95, 10)))
  })

  it('reduces time with speed multiplier', () => {
    const standard = getConstructionTime('farm', 0, 0, 1)
    const speed = getConstructionTime('farm', 0, 0, 3)
    expect(speed).toBe(Math.round(standard! / 3))
  })

  it('returns null at max level', () => {
    expect(getConstructionTime('farm', 30, 0, 1)).toBeNull()
  })
})

describe('canAffordUpgrade', () => {
  it('returns true when resources are sufficient', () => {
    expect(
      canAffordUpgrade(
        { food: 100, wood: 100, stone: 100, gold: 100 },
        { food: 50, wood: 80, stone: 40, gold: 20 },
      ),
    ).toBe(true)
  })

  it('returns false when any resource is insufficient', () => {
    expect(
      canAffordUpgrade(
        { food: 10, wood: 100, stone: 100, gold: 100 },
        { food: 50, wood: 80, stone: 40, gold: 20 },
      ),
    ).toBe(false)
  })

  it('returns true when resources exactly match cost', () => {
    expect(
      canAffordUpgrade(
        { food: 50, wood: 80, stone: 40, gold: 20 },
        { food: 50, wood: 80, stone: 40, gold: 20 },
      ),
    ).toBe(true)
  })
})

describe('getWorldSpeedMultiplier', () => {
  it('returns correct multipliers', () => {
    expect(getWorldSpeedMultiplier('standard')).toBe(1)
    expect(getWorldSpeedMultiplier('speed')).toBe(3)
    expect(getWorldSpeedMultiplier('casual')).toBe(0.5)
  })

  it('returns 1 for unknown speeds', () => {
    expect(getWorldSpeedMultiplier('unknown')).toBe(1)
  })
})
