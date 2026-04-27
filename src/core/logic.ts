import type { Ingredient, Order, Customer, RunState, DayLog, Weather } from './types'

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
 * 客の好みタグに一致する食材ならどれでも提供可。
 * wealthy / regular / tourist の3客分のオーダーを生成する。
 */
export function generateDayOrders(
  customers: Customer[],
  allIngredients: Ingredient[],
): Order[] {
  const targets = customers.filter((c) =>
    (['wealthy', 'regular', 'tourist'] as string[]).includes(c.type),
  )
  return targets.map((customer, i) => {
    const matching = allIngredients.filter((ing) =>
      ing.tags.some((tag) => customer.preferences.includes(tag)),
    )
    const reward =
      matching.length > 0
        ? Math.round(matching.reduce((s, ing) => s + ing.sellValue, 0) / matching.length)
        : 500
    return {
      id: `order_${customer.id}_${i}`,
      customerId: customer.id,
      requiredIngredients: matching.map((ing) => ing.id),
      timeLimit: ORDER_TIME_MS,
      reward,
      remainingMs: ORDER_TIME_MS,
    }
  })
}

/** 手持ち食材でオーダーを満たせるか（タグ一致） */
export function canFulfillOrder(order: Order, inventory: Ingredient[]): boolean {
  return inventory.some((ing) => order.requiredIngredients.includes(ing.id))
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
