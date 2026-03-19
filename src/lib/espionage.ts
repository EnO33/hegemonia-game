/**
 * Espionage system.
 *
 * Mission types:
 * - scout_resources: reveal target city's resource amounts
 * - scout_army: reveal target city's unit counts
 * - scout_buildings: reveal target city's building levels
 * - full_report: all of the above
 * - sabotage: destroy a portion of resources
 *
 * Detection chance depends on attacker spies vs defender spies.
 */

type MissionType = 'scout_resources' | 'scout_army' | 'scout_buildings' | 'full_report' | 'sabotage'

interface SpyMissionConfig {
  baseDurationSeconds: number
  baseDetectionChance: number // 0-1
}

const MISSION_CONFIGS: Record<MissionType, SpyMissionConfig> = {
  scout_resources: {
    baseDurationSeconds: 300,
    baseDetectionChance: 0.1,
  },
  scout_army: {
    baseDurationSeconds: 300,
    baseDetectionChance: 0.15,
  },
  scout_buildings: {
    baseDurationSeconds: 300,
    baseDetectionChance: 0.1,
  },
  full_report: {
    baseDurationSeconds: 600,
    baseDetectionChance: 0.3,
  },
  sabotage: {
    baseDurationSeconds: 900,
    baseDetectionChance: 0.5,
  },
}

/**
 * Calculate detection chance based on attacker/defender spy counts.
 * More defender spies = higher detection chance.
 * More attacker spies = lower detection chance.
 */
export function calculateDetectionChance(
  missionType: string,
  attackerSpyCount: number,
  defenderSpyCount: number,
): number {
  const config = MISSION_CONFIGS[missionType as MissionType]
  if (!config) return 1

  const spyRatio = defenderSpyCount > 0
    ? defenderSpyCount / Math.max(1, attackerSpyCount)
    : 0

  // Base detection + spy ratio modifier
  const chance = config.baseDetectionChance + spyRatio * 0.1
  return Math.min(1, Math.max(0, chance))
}

/**
 * Determine if a spy mission is detected.
 */
export function isMissionDetected(detectionChance: number): boolean {
  return Math.random() < detectionChance
}

/**
 * Calculate mission duration in seconds.
 */
export function getMissionDuration(
  missionType: string,
  worldSpeedMultiplier: number,
): number {
  const config = MISSION_CONFIGS[missionType as MissionType]
  if (!config) return 600
  return Math.round(config.baseDurationSeconds * (1 / worldSpeedMultiplier))
}

/**
 * Calculate sabotage damage (percentage of resources destroyed).
 * Returns a value between 0.05 and 0.15 (5% to 15%).
 */
export function calculateSabotageDamage(): number {
  return 0.05 + Math.random() * 0.1
}

export function getMissionConfig(type: string): SpyMissionConfig | undefined {
  return MISSION_CONFIGS[type as MissionType]
}
