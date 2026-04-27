import type { Ingredient, Order, Customer, RunState, DayLog, Weather } from './types'
import { MAX_PATIENCE } from './cooking'

export const DRAFT_HAND_SIZE = 4
export const DRAFT_SELECT_MAX = 3
export const ORDER_TIME_MS = 30_000
export const MAX_DAY = 30
export const STARTING_CASH = 3_000
export const STARTING_REPUTATION = 50

export const INGREDIENT_EMOJI: Record<string, string> = {
  maguro: '🐟',
  salmon: '🐠',
  hirame: '🐡',
  tamago: '🥚',
  uni:    '🦔',
  ika:    '🦑',
  anago:  '🐍',
  ebi:    '🦐',
  ikura:  '🟠',
}

/** プールからランダムにN枚の手札を生成 */
export function pickDraftHand(pool: Ingredient[], count = DRAFT_HAND_SIZE): Ingredient[] {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count)
}

/**
 * 今日のオーダーを生成する。
 * wealthy / regular / tourist の順で3客分。
 * 各客の orderSlots 定義をそのまま Order.slots に変換する。
 */
export function generateDayOrders(customers: Customer[]): Order[] {
  const order: Customer['type'][] = ['wealthy', 'regular', 'tourist']
  return order
    .map((type) => customers.find((c) => c.type === type))
    .filter((c): c is Customer => c !== undefined)
    .map((customer, i) => ({
      id: `order_${customer.id}_${i}`,
      customerId: customer.id,
      slots: customer.orderSlots.map((s) => ({
        requiredTags: s.requiredTags,
        baseReward: s.baseReward,
        filledBy: null,
      })),
      timeLimit: ORDER_TIME_MS,
      patience: MAX_PATIENCE,
    }))
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
  revenue: number,
  reputationDelta: number,
  servedCount: number,
  weather: Weather = 'sunny',
): DayLog {
  return {
    dayNumber: run.currentDay,
    season: getSeason(run.currentDay),
    weather,
    customersServed: servedCount,
    revenue,
    reputationDelta,
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
