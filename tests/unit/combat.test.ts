import { describe, expect, it } from 'vitest'
import {
  resolveCombat,
  calculateLoot,
  calculateTravelTime,
} from '../../src/lib/combat'

describe('resolveCombat', () => {
  const defaultModifiers = {
    wallLevel: 0,
    researchBonusAttack: 0,
    researchBonusDefense: 0,
  }

  it('attacker wins when much stronger', () => {
    const result = resolveCombat(
      [{ type: 'swordsman', count: 100 }],
      [{ type: 'swordsman', count: 10 }],
      defaultModifiers,
    )
    expect(result.outcome).toBe('attacker_victory')
    expect(result.attackerSurvivors.length).toBeGreaterThan(0)
  })

  it('defender wins when much stronger', () => {
    const result = resolveCombat(
      [{ type: 'swordsman', count: 10 }],
      [{ type: 'hoplite', count: 100 }],
      defaultModifiers,
    )
    expect(result.outcome).toBe('defender_victory')
    expect(result.defenderSurvivors.length).toBeGreaterThan(0)
  })

  it('both sides take losses', () => {
    const result = resolveCombat(
      [{ type: 'swordsman', count: 50 }],
      [{ type: 'swordsman', count: 50 }],
      defaultModifiers,
    )
    expect(result.attackerLosses.length).toBeGreaterThan(0)
    expect(result.defenderLosses.length).toBeGreaterThan(0)
  })

  it('wall bonus benefits defender', () => {
    const withoutWall = resolveCombat(
      [{ type: 'swordsman', count: 50 }],
      [{ type: 'swordsman', count: 50 }],
      { ...defaultModifiers, wallLevel: 0 },
    )
    const withWall = resolveCombat(
      [{ type: 'swordsman', count: 50 }],
      [{ type: 'swordsman', count: 50 }],
      { ...defaultModifiers, wallLevel: 10 },
    )

    const attackerLossesWithoutWall = withoutWall.attackerLosses.reduce(
      (sum, u) => sum + u.count,
      0,
    )
    const attackerLossesWithWall = withWall.attackerLosses.reduce(
      (sum, u) => sum + u.count,
      0,
    )
    // More attacker losses when defender has walls
    expect(attackerLossesWithWall).toBeGreaterThanOrEqual(attackerLossesWithoutWall)
  })

  it('handles empty defender army (undefended city)', () => {
    const result = resolveCombat(
      [{ type: 'swordsman', count: 50 }],
      [],
      defaultModifiers,
    )
    expect(result.outcome).toBe('attacker_victory')
    expect(result.attackerLosses).toHaveLength(0)
  })

  it('handles empty attacker army', () => {
    const result = resolveCombat(
      [],
      [{ type: 'swordsman', count: 50 }],
      defaultModifiers,
    )
    expect(result.outcome).toBe('defender_victory')
    expect(result.defenderLosses).toHaveLength(0)
  })

  it('handles mixed unit types', () => {
    const result = resolveCombat(
      [
        { type: 'swordsman', count: 30 },
        { type: 'horseman', count: 20 },
        { type: 'archer', count: 25 },
      ],
      [
        { type: 'hoplite', count: 40 },
        { type: 'archer', count: 20 },
      ],
      defaultModifiers,
    )
    expect(result.outcome).toBeDefined()
    // Total survivors + losses should equal original count for each side
    const totalAttackerSurvivors = result.attackerSurvivors.reduce((s, u) => s + u.count, 0)
    const totalAttackerLosses = result.attackerLosses.reduce((s, u) => s + u.count, 0)
    expect(totalAttackerSurvivors + totalAttackerLosses).toBe(75) // 30+20+25
  })
})

describe('calculateLoot', () => {
  it('takes 20% of defender resources when capacity allows', () => {
    const loot = calculateLoot(
      { food: 1000, wood: 1000, stone: 1000, gold: 1000 },
      10000,
    )
    expect(loot.food).toBe(200)
    expect(loot.wood).toBe(200)
    expect(loot.stone).toBe(200)
    expect(loot.gold).toBe(200)
  })

  it('limits loot to carry capacity', () => {
    const loot = calculateLoot(
      { food: 10000, wood: 10000, stone: 10000, gold: 10000 },
      100,
    )
    const totalLoot = loot.food + loot.wood + loot.stone + loot.gold
    expect(totalLoot).toBeLessThanOrEqual(100)
  })

  it('distributes proportionally when capacity limited', () => {
    const loot = calculateLoot(
      { food: 1000, wood: 0, stone: 0, gold: 0 },
      50,
    )
    expect(loot.food).toBe(50)
    expect(loot.wood).toBe(0)
  })
})

describe('calculateTravelTime', () => {
  it('returns minimum time for same island', () => {
    const time = calculateTravelTime(0, 0, 0, 0, [{ type: 'swordsman', count: 10 }], 1)
    expect(time).toBe(60) // 1 minute minimum
  })

  it('increases with distance', () => {
    const near = calculateTravelTime(0, 0, 1, 0, [{ type: 'swordsman', count: 10 }], 1)
    const far = calculateTravelTime(0, 0, 5, 0, [{ type: 'swordsman', count: 10 }], 1)
    expect(far).toBeGreaterThan(near)
  })

  it('uses slowest unit speed', () => {
    const fastArmy = calculateTravelTime(
      0, 0, 5, 0,
      [{ type: 'scout', count: 10 }],
      1,
    )
    const mixedArmy = calculateTravelTime(
      0, 0, 5, 0,
      [{ type: 'scout', count: 10 }, { type: 'battering_ram', count: 5 }],
      1,
    )
    expect(mixedArmy).toBeGreaterThan(fastArmy)
  })

  it('decreases with world speed multiplier', () => {
    const standard = calculateTravelTime(0, 0, 5, 0, [{ type: 'swordsman', count: 10 }], 1)
    const speed = calculateTravelTime(0, 0, 5, 0, [{ type: 'swordsman', count: 10 }], 3)
    expect(speed).toBeLessThan(standard)
  })
})
