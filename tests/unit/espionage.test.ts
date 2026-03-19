import { describe, expect, it } from 'vitest'
import {
  calculateDetectionChance,
  getMissionDuration,
  calculateSabotageDamage,
  getMissionConfig,
} from '../../src/lib/espionage'

describe('calculateDetectionChance', () => {
  it('returns base chance with no defender spies', () => {
    const chance = calculateDetectionChance('scout_resources', 1, 0)
    expect(chance).toBe(0.1) // base for scout_resources
  })

  it('increases with more defender spies', () => {
    const lowDefense = calculateDetectionChance('scout_resources', 1, 1)
    const highDefense = calculateDetectionChance('scout_resources', 1, 5)
    expect(highDefense).toBeGreaterThan(lowDefense)
  })

  it('caps at 1', () => {
    const chance = calculateDetectionChance('sabotage', 1, 100)
    expect(chance).toBeLessThanOrEqual(1)
  })

  it('is lower for simple missions', () => {
    const scout = calculateDetectionChance('scout_resources', 1, 1)
    const sabotage = calculateDetectionChance('sabotage', 1, 1)
    expect(sabotage).toBeGreaterThan(scout)
  })

  it('returns 1 for unknown mission types', () => {
    expect(calculateDetectionChance('unknown', 1, 1)).toBe(1)
  })
})

describe('getMissionDuration', () => {
  it('returns base duration at standard speed', () => {
    const duration = getMissionDuration('scout_resources', 1)
    expect(duration).toBe(300)
  })

  it('decreases with speed multiplier', () => {
    const standard = getMissionDuration('scout_resources', 1)
    const speed = getMissionDuration('scout_resources', 3)
    expect(speed).toBeLessThan(standard)
  })

  it('full report takes longer than scouts', () => {
    const scout = getMissionDuration('scout_resources', 1)
    const full = getMissionDuration('full_report', 1)
    expect(full).toBeGreaterThan(scout)
  })
})

describe('calculateSabotageDamage', () => {
  it('returns value between 5% and 15%', () => {
    for (let i = 0; i < 20; i++) {
      const damage = calculateSabotageDamage()
      expect(damage).toBeGreaterThanOrEqual(0.05)
      expect(damage).toBeLessThanOrEqual(0.15)
    }
  })
})

describe('getMissionConfig', () => {
  it('returns config for known types', () => {
    const config = getMissionConfig('scout_resources')
    expect(config).toBeDefined()
    expect(config?.baseDurationSeconds).toBe(300)
  })

  it('returns undefined for unknown types', () => {
    expect(getMissionConfig('unknown')).toBeUndefined()
  })
})
