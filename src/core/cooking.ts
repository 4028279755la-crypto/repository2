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

/** 1セッションで握れる最大ネタ数（コンボ用） */
export const MAX_NETAS_PER_SESSION = 3

/**
 * 製作中の寿司セッション。
 * null でなければシャリ置き済み。netaIds の長さでネタの数が決まる。
 */
export interface CookingSession {
  /** 選んだネタのIDリスト（0..MAX_NETAS_PER_SESSION） */
  netaIds: string[]
}

/** シャリを置いてセッション開始 */
export function startCooking(): CookingSession {
  return { netaIds: [] }
}

/** ネタを追加（上限に達していれば変化なし） */
export function placeNeta(session: CookingSession, ingredientId: string): CookingSession {
  if (session.netaIds.length >= MAX_NETAS_PER_SESSION) return session
  return { ...session, netaIds: [...session.netaIds, ingredientId] }
}

/** ネタを最後の1個だけ取り消す */
export function popNeta(session: CookingSession): CookingSession {
  if (session.netaIds.length === 0) return session
  return { ...session, netaIds: session.netaIds.slice(0, -1) }
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
 * WIPが対象スロットに合致するかを検証。
 * いずれかのネタがslotのタグに合致すれば真。
 */
export function validateServeSushi(
  session: CookingSession,
  slot: Pick<OrderSlot, 'requiredTags'>,
  netaTagsList: string[][],
): boolean {
  if (session.netaIds.length === 0) return false
  return netaTagsList.some((tags) => validateSlotMatch(slot, tags))
}
