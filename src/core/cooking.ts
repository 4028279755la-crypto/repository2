import type { OrderSlot } from './types'

export const MAX_PATIENCE = 3
/** 順序ミス時の残時間ペナルティ（ミリ秒） */
export const MISTAKE_TIME_PENALTY_MS = 3_000
/** 怒り退店時の評判ペナルティ */
export const WALKOUT_REP_PENALTY = -2

/** チップ加算の閾値・倍率 */
export const TIP_HIGH_THRESHOLD = 0.6
export const TIP_LOW_THRESHOLD = 0.3
export const TIP_HIGH_RATE = 0.5
export const TIP_LOW_RATE = 0.2

/**
 * 製作中の寿司セッション。
 * null でなければシャリ置き済み。netaId があれば握り完了状態。
 */
export interface CookingSession {
  /** 選んだネタのID（null＝シャリのみ） */
  netaId: string | null
}

/** シャリを置いてセッション開始 */
export function startCooking(): CookingSession {
  return { netaId: null }
}

/** ネタをセット */
export function placeNeta(session: CookingSession, ingredientId: string): CookingSession {
  return { ...session, netaId: ingredientId }
}

/** スロットとネタが一致するか（タグ一致判定） */
export function validateSlotMatch(
  slot: Pick<OrderSlot, 'requiredTags'>,
  ingredientTags: string[],
): boolean {
  return slot.requiredTags.some((tag) => ingredientTags.includes(tag))
}

/** チップ計算 */
export function calculateTip(baseReward: number, timeRemainingRatio: number): number {
  if (timeRemainingRatio >= TIP_HIGH_THRESHOLD) return Math.round(baseReward * TIP_HIGH_RATE)
  if (timeRemainingRatio >= TIP_LOW_THRESHOLD) return Math.round(baseReward * TIP_LOW_RATE)
  return 0
}

/** 基本報酬＋チップの合計 */
export function calculateReward(baseReward: number, timeRemainingRatio: number): number {
  return baseReward + calculateTip(baseReward, timeRemainingRatio)
}

/**
 * WIPが対象スロットに合致し、かつ提供可能な状態かを検証。
 * true を返せば serveSushi を実行してよい。
 */
export function validateServeSushi(
  session: CookingSession,
  slot: Pick<OrderSlot, 'requiredTags'>,
  ingredientTags: string[],
): boolean {
  if (session.netaId === null) return false
  return validateSlotMatch(slot, ingredientTags)
}
