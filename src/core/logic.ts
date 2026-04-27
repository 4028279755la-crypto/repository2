import type {
  Ingredient, Order, Customer, RunState, DayLog, Weather,
  CustomerType, DayDifficulty, DailyEvent,
} from './types'
import { MAX_PATIENCE } from './cooking'
import { reputationTier } from './season'

export const DRAFT_HAND_SIZE = 6
export const DRAFT_SELECT_MAX = 4
export const ORDER_TIME_MS = 30_000
export const MAX_DAY = 30
export const STARTING_CASH = 3_000
export const STARTING_REPUTATION = 50

export const INGREDIENT_EMOJI: Record<string, string> = {
  maguro:  '🐟',
  salmon:  '🐠',
  hirame:  '🐡',
  tamago:  '🥚',
  uni:     '🦔',
  ika:     '🦑',
  anago:   '🐍',
  ebi:     '🦐',
  ikura:   '🟠',
  nori:    '🌿',
  kyuri:   '🥒',
  avocado: '🥑',
}

/** プールからランダムにN枚の手札を生成 */
export function pickDraftHand(pool: Ingredient[], count = DRAFT_HAND_SIZE): Ingredient[] {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count)
}

/**
 * 評判ティアごとに来店しうる客タイプ。
 * インデックスがティア-1。
 */
const TIER_ROSTER: Record<number, CustomerType[]> = {
  1: ['student', 'tourist'],
  2: ['student', 'tourist', 'regular'],
  3: ['student', 'tourist', 'regular', 'wealthy'],
  4: ['tourist', 'regular', 'wealthy'],
  5: ['regular', 'wealthy', 'blogger'],
}

/** ティア×重みでランダムに1人ピック */
function pickCustomerType(
  tier: number,
  difficulty: DayDifficulty,
  event: DailyEvent | null,
): CustomerType {
  const roster = TIER_ROSTER[tier] ?? TIER_ROSTER[1]
  const weights: Record<CustomerType, number> = {
    student: 0, tourist: 0, regular: 0, wealthy: 0, blogger: 0,
  }
  // 基本重み
  for (const t of roster) weights[t] = 1
  // ティア4以上は富裕層比率UP
  if (tier >= 4) weights.wealthy += 1
  if (tier >= 5) {
    weights.wealthy += 1
    weights.blogger = Math.max(weights.blogger, 0.5)
  }
  // 難易度の富裕層ボーナス
  if (weights.wealthy > 0) weights.wealthy += difficulty.wealthyChanceBonus * 2

  // イベント影響
  if (event?.effect.touristRatio !== undefined) {
    const target = event.effect.touristRatio
    // tourist の重みを target/(1-target) に底上げ
    weights.tourist = Math.max(weights.tourist, (target / Math.max(1 - target, 0.01)) * 2)
  }
  if (event?.effect.wealthyRatio !== undefined && weights.wealthy > 0) {
    const target = event.effect.wealthyRatio
    weights.wealthy = Math.max(weights.wealthy, (target / Math.max(1 - target, 0.01)) * 2)
  }

  const total = Object.values(weights).reduce((s, v) => s + v, 0)
  if (total <= 0) return roster[0]
  let r = Math.random() * total
  for (const t of Object.keys(weights) as CustomerType[]) {
    if (weights[t] <= 0) continue
    r -= weights[t]
    if (r <= 0) return t
  }
  return roster[roster.length - 1]
}

/** 1日の客数を難易度+イベントから決定 */
export function computeDailyCustomerCount(
  difficulty: DayDifficulty,
  event: DailyEvent | null,
): number {
  const base = randInt(difficulty.customerCountMin, difficulty.customerCountMax)
  let n = base
  if (event?.effect.customerCountMultiplier !== undefined) {
    n = Math.round(n * event.effect.customerCountMultiplier)
  }
  if (event?.effect.customerCountBonus !== undefined) {
    n += event.effect.customerCountBonus
  }
  return Math.max(1, n)
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/**
 * 今日のオーダーを生成する。
 * 評判ティアと難易度・イベントを反映して客を決める。
 */
export function generateDayOrders(
  customers: Customer[],
  difficulty: DayDifficulty,
  event: DailyEvent | null,
  reputation: number,
): Order[] {
  const tier = reputationTier(reputation)
  const count = computeDailyCustomerCount(difficulty, event)

  const orders: Order[] = []
  for (let i = 0; i < count; i++) {
    const type = pickCustomerType(tier, difficulty, event)
    const customer = customers.find((c) => c.type === type) ?? customers[0]
    if (!customer) continue

    // 注文スロット: 難易度ボーナスで1スロット追加（最大3）
    let slots = customer.orderSlots.map((s) => ({
      requiredTags: [...s.requiredTags],
      baseReward: s.baseReward,
      filledBy: null as string | null,
    }))
    if (difficulty.slotCountBonus > 0 && slots.length < 3) {
      // 同客の最初のスロットを複製して追加
      const extra = { ...slots[0], baseReward: Math.round(slots[0].baseReward * 0.8) }
      slots = [...slots, extra]
    }

    // 忍耐: 既定値 + 難易度修正 + イベント
    const patience = Math.max(
      1,
      MAX_PATIENCE + difficulty.patienceModifier + (event?.effect.patienceBonus ?? 0),
    )

    orders.push({
      id: `order_${customer.id}_${i}`,
      customerId: customer.id,
      slots,
      timeLimit: Math.round(ORDER_TIME_MS * difficulty.timeLimitMultiplier),
      patience,
    })
  }

  // ブロガー来訪イベント: 1人ブロガーに置き換え（重複していなければ追加）
  if (event?.effect.bloggerVisit && !orders.some((o) => o.customerId === 'cus_blogger')) {
    const blogger = customers.find((c) => c.type === 'blogger')
    if (blogger && orders.length > 0) {
      const idx = Math.floor(Math.random() * orders.length)
      orders[idx] = {
        id: `order_${blogger.id}_${idx}`,
        customerId: blogger.id,
        slots: blogger.orderSlots.map((s) => ({
          requiredTags: [...s.requiredTags],
          baseReward: s.baseReward,
          filledBy: null,
        })),
        timeLimit: Math.round(ORDER_TIME_MS * difficulty.timeLimitMultiplier),
        patience: Math.max(1, MAX_PATIENCE + difficulty.patienceModifier),
      }
    }
  }

  return orders
}

/** 指定食材を1つ消費した新しい inventory を返す */
export function consumeIngredient(id: string, inventory: Ingredient[]): Ingredient[] {
  const idx = inventory.findIndex((ing) => ing.id === id)
  if (idx === -1) return inventory
  return [...inventory.slice(0, idx), ...inventory.slice(idx + 1)]
}

/** 1日分のログを生成 */
export function buildDayLog(
  run: RunState,
  data: {
    revenue: number
    reputationDelta: number
    customersServed: number
    customersTotal: number
    slotsServed: number
    slotsTotal: number
    walkedOut: number
    achievedCombos: string[]
    eventId: string | null
    weather?: Weather
  },
): DayLog {
  return {
    dayNumber: run.currentDay,
    season: getSeason(run.currentDay),
    weather: data.weather ?? 'sunny',
    customersServed: data.customersServed,
    customersTotal: data.customersTotal,
    slotsServed: data.slotsServed,
    slotsTotal: data.slotsTotal,
    walkedOut: data.walkedOut,
    revenue: data.revenue,
    reputationDelta: data.reputationDelta,
    achievedCombos: data.achievedCombos,
    eventId: data.eventId,
  }
}

/** ログを適用して翌日に進んだ RunState を返す */
export function advanceToNextDay(run: RunState, log: DayLog): RunState {
  return {
    ...run,
    cash: run.cash + log.revenue,
    reputation: Math.max(0, Math.min(100, run.reputation + log.reputationDelta)),
    inventory: [],
    currentDay: run.currentDay + 1,
    history: [...run.history, log],
    isOver: run.currentDay >= MAX_DAY,
  }
}

function getSeason(day: number): string {
  if (day <= 10) return '春'
  if (day <= 20) return '夏'
  return '秋'
}
