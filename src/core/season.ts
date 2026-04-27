import type { DayDifficulty, ReputationTier } from './types'

export const SEASON_LENGTH = 30
export const SEGMENT_LENGTH = 5

export const TIER_LABELS: Record<ReputationTier, string> = {
  1: '★ 屋台',
  2: '★★ 路地裏',
  3: '★★★ 駅前',
  4: '★★★★ 銀座',
  5: '★★★★★ 老舗',
}

export const TIER_DESCRIPTIONS: Record<ReputationTier, string> = {
  1: '駆け出しの店。学生と観光客がたまに立ち寄る。',
  2: '路地裏の常連が増え始める。',
  3: '駅前店として知られる。富裕層もちらほら。',
  4: '銀座の名店候補。富裕層中心の客層。',
  5: '老舗。グルメブロガーが頻繁に来店する。',
}

/** 評判値からティアを返す */
export function reputationTier(reputation: number): ReputationTier {
  if (reputation >= 80) return 5
  if (reputation >= 60) return 4
  if (reputation >= 40) return 3
  if (reputation >= 20) return 2
  return 1
}

/** 1〜30 日に対する難易度パラメータを返す */
export function getDifficulty(day: number): DayDifficulty {
  const seg = (Math.min(Math.ceil(day / SEGMENT_LENGTH), 6) || 1) as 1 | 2 | 3 | 4 | 5 | 6

  switch (seg) {
    case 1:
      return {
        dayNumber: day, segment: 1,
        customerCountMin: 3, customerCountMax: 4,
        patienceModifier: 0,
        wealthyChanceBonus: 0,
        slotCountBonus: 0,
        timeLimitMultiplier: 1.0,
        reputationTarget: 50,
        label: '導入期',
      }
    case 2:
      return {
        dayNumber: day, segment: 2,
        customerCountMin: 5, customerCountMax: 6,
        patienceModifier: -1,
        wealthyChanceBonus: 0,
        slotCountBonus: 0,
        timeLimitMultiplier: 1.0,
        reputationTarget: 55,
        label: '常連増加期',
      }
    case 3:
      return {
        dayNumber: day, segment: 3,
        customerCountMin: 6, customerCountMax: 7,
        patienceModifier: -1,
        wealthyChanceBonus: 0.2,
        slotCountBonus: 0,
        timeLimitMultiplier: 0.95,
        reputationTarget: 60,
        label: '富裕層登場期',
      }
    case 4:
      return {
        dayNumber: day, segment: 4,
        customerCountMin: 7, customerCountMax: 8,
        patienceModifier: -1,
        wealthyChanceBonus: 0.25,
        slotCountBonus: 1,
        timeLimitMultiplier: 0.9,
        reputationTarget: 65,
        label: '注文複雑化期',
      }
    case 5:
      return {
        dayNumber: day, segment: 5,
        customerCountMin: 8, customerCountMax: 10,
        patienceModifier: -1,
        wealthyChanceBonus: 0.3,
        slotCountBonus: 1,
        timeLimitMultiplier: 0.85,
        reputationTarget: 70,
        label: '繁忙期',
      }
    case 6:
    default:
      return {
        dayNumber: day, segment: 6,
        customerCountMin: 10, customerCountMax: 10,
        patienceModifier: -2,
        wealthyChanceBonus: 0.35,
        slotCountBonus: 1,
        timeLimitMultiplier: 0.85,
        reputationTarget: 80,
        label: '決戦期',
      }
  }
}
