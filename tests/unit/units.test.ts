import { describe, expect, it } from 'vitest'
import {
  getUnitConfig,
  getRecruitmentCost,
  getTrainingTime,
  getAvailableUnits,
} from '../../src/lib/units'

describe('getUnitConfig', () => {
  it('returns config for known unit types', () => {
    const config = getUnitConfig('swordsman')
    expect(config).toBeDefined()
    expect(config?.requiredBuilding).toBe('barracks')
    expect(config?.requiredBuildingLevel).toBe(1)
  })

  it('returns undefined for unknown types', () => {
    expect(getUnitConfig('dragon')).toBeUndefined()
  })
})

describe('getRecruitmentCost', () => {
  it('returns cost for 1 unit', () => {
    const cost = getRecruitmentCost('swordsman', 1)
    expect(cost).toEqual({ food: 10, wood: 0, stone: 0, gold: 50 })
  })

  it('scales cost by count', () => {
    const cost = getRecruitmentCost('swordsman', 5)
    expect(cost).toEqual({ food: 50, wood: 0, stone: 0, gold: 250 })
  })

  it('returns null for zero count', () => {
    expect(getRecruitmentCost('swordsman', 0)).toBeNull()
  })

  it('returns null for unknown types', () => {
    expect(getRecruitmentCost('dragon', 1)).toBeNull()
  })
})

describe('getTrainingTime', () => {
  it('returns base time at level 1 standard speed', () => {
    const time = getTrainingTime('swordsman', 1, 1, 1)
    // 120 * 1 * 0.98^1 * 1 = 118
    expect(time).toBe(Math.round(120 * Math.pow(0.98, 1)))
  })

  it('scales with count', () => {
    const time = getTrainingTime('swordsman', 5, 1, 1)
    expect(time).toBe(Math.round(120 * 5 * Math.pow(0.98, 1)))
  })

  it('decreases with higher building level', () => {
    const lowLevel = getTrainingTime('swordsman', 1, 1, 1)
    const highLevel = getTrainingTime('swordsman', 1, 10, 1)
    expect(highLevel).toBeLessThan(lowLevel!)
  })

  it('decreases with speed multiplier', () => {
    const standard = getTrainingTime('swordsman', 1, 1, 1)
    const speed = getTrainingTime('swordsman', 1, 1, 3)
    expect(speed).toBeLessThan(standard!)
  })

  it('returns null for unknown types', () => {
    expect(getTrainingTime('dragon', 1, 1, 1)).toBeNull()
  })
})

describe('getAvailableUnits', () => {
  it('returns empty array with no buildings', () => {
    expect(getAvailableUnits([])).toEqual([])
  })

  it('returns units matching building requirements', () => {
    const buildings = [
      { type: 'barracks', level: 1 },
    ]
    const available = getAvailableUnits(buildings)
    expect(available).toContain('swordsman')
    expect(available).not.toContain('hoplite') // requires level 5
  })

  it('unlocks more units with higher building levels', () => {
    const buildings = [
      { type: 'barracks', level: 5 },
    ]
    const available = getAvailableUnits(buildings)
    expect(available).toContain('swordsman')
    expect(available).toContain('hoplite')
    expect(available).toContain('archer')
  })

  it('handles multiple building types', () => {
    const buildings = [
      { type: 'barracks', level: 1 },
      { type: 'stable', level: 1 },
      { type: 'harbor', level: 1 },
    ]
    const available = getAvailableUnits(buildings)
    expect(available).toContain('swordsman')
    expect(available).toContain('scout')
    expect(available).toContain('scout_ship')
  })
})
