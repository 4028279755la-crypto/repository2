import { create } from 'zustand'
import type { GameState, Ingredient, RunState, MetaState, Order, Customer } from '../core/types'
import ingredientsData from '../data/ingredients.json'
import customersData from '../data/customers.json'
import {
  pickDraftHand,
  generateDayOrders,
  consumeIngredient,
  buildDayLog,
  advanceToNextDay,
  DRAFT_SELECT_MAX,
  STARTING_CASH,
  STARTING_REPUTATION,
  ORDER_TIME_MS,
} from '../core/logic'
import {
  type CookingSession,
  startCooking,
  placeNeta,
  validateSlotMatch,
  calculateReward,
  MISTAKE_TIME_PENALTY_MS,
  WALKOUT_REP_PENALTY,
} from '../core/cooking'

const allIngredients = ingredientsData as unknown as Ingredient[]
const allCustomers = customersData as unknown as Customer[]

const defaultMeta: MetaState = {
  norenValue: 0,
  unlockedShops: ['shop_default'],
  unlockedIngredients: allIngredients.map((i) => i.id),
  unlockedCombos: [],
  hiredApprentices: [],
  permanentBuffs: { startingCash: 0, startingHandSize: 0, maxStamina: 100 },
  records: { bestRevenue: 0, totalRuns: 0, completedSeasons: 0 },
}

function makeNewRun(): RunState {
  return {
    currentDay: 1,
    shopId: 'shop_default',
    cash: STARTING_CASH,
    reputation: STARTING_REPUTATION,
    inventory: [],
    unlockedCombos: [],
    history: [],
    isOver: false,
  }
}

export interface ClosingSummary {
  revenue: number
  reputationDelta: number
  servedSlots: number
  totalSlots: number
  walkedOut: number
}

interface StoreExtras {
  /** 朝市で表示される候補カード */
  draftHand: Ingredient[]
  /** 選択中の食材ID */
  draftSelectedIds: string[]

  /** 本日の全オーダー */
  serviceOrders: Order[]
  /** 現在処理中のオーダーインデックス */
  currentOrderIdx: number
  /** 現在処理中のスロットインデックス */
  currentSlotIdx: number
  /** 現在のスロットが開始された timestamp */
  orderStartedAt: number
  /** 本日の累計売上 */
  dailyRevenue: number
  /** 本日の評判変動 */
  dailyReputationDelta: number
  /** 本日の提供成功スロット数 */
  dailyServedSlots: number
  /** 本日の怒り退店客数 */
  dailyWalkedOut: number

  /** 製作中の寿司セッション（null＝未着手） */
  cookingSession: CookingSession | null

  /** 締めフェーズ用サマリー */
  closingSummary: ClosingSummary | null
}

interface GameActions {
  startNewRun: () => void
  toggleDraftCard: (ingredientId: string) => void
  confirmDraft: () => void
  placeRice: () => void
  placeNetaAction: (ingredientId: string) => void
  serveSushi: () => void
  cancelCooking: () => void
  timeoutCurrentSlot: () => void
  confirmClosing: () => void
  endRun: () => void
}

// ── 内部ヘルパー ──────────────────────────────────────────────────────────────

/** orders の指定インデックスを部分更新した新しい配列を返す */
function updateOrder(orders: Order[], idx: number, patch: Partial<Order>): Order[] {
  return orders.map((o, i) => (i === idx ? { ...o, ...patch } : o))
}

/** 次に処理すべき {orderIdx, slotIdx} を返す。全オーダー終了なら 'done' */
function resolveNext(
  orders: Order[],
  orderIdx: number,
  slotIdx: number,
  skipWholeOrder: boolean,
): { orderIdx: number; slotIdx: number } | 'done' {
  let nextOrder = orderIdx
  let nextSlot = slotIdx + 1

  if (skipWholeOrder || nextSlot >= orders[orderIdx].slots.length) {
    nextOrder = orderIdx + 1
    nextSlot = 0
  }

  if (nextOrder >= orders.length) return 'done'
  return { orderIdx: nextOrder, slotIdx: nextSlot }
}

function makeClosingSummary(
  revenue: number,
  repDelta: number,
  servedSlots: number,
  totalSlots: number,
  walkedOut: number,
): ClosingSummary {
  return { revenue, reputationDelta: repDelta, servedSlots, totalSlots, walkedOut }
}

// ── ストア ────────────────────────────────────────────────────────────────────

const initialRun = makeNewRun()

export const useGameStore = create<GameState & StoreExtras & GameActions>((set, get) => ({
  // ── GameState ──
  phase: 'morning_market',
  run: initialRun,
  meta: defaultMeta,

  // ── Draft state ──
  draftHand: pickDraftHand(allIngredients),
  draftSelectedIds: [],

  // ── Service state ──
  serviceOrders: [],
  currentOrderIdx: 0,
  currentSlotIdx: 0,
  orderStartedAt: 0,
  dailyRevenue: 0,
  dailyReputationDelta: 0,
  dailyServedSlots: 0,
  dailyWalkedOut: 0,

  // ── Cooking state ──
  cookingSession: null,

  // ── Closing state ──
  closingSummary: null,

  // ── Actions ──

  startNewRun: () => {
    const run = makeNewRun()
    set((s) => ({
      run,
      phase: 'morning_market',
      draftHand: pickDraftHand(allIngredients),
      draftSelectedIds: [],
      serviceOrders: [],
      currentOrderIdx: 0,
      currentSlotIdx: 0,
      orderStartedAt: 0,
      dailyRevenue: 0,
      dailyReputationDelta: 0,
      dailyServedSlots: 0,
      dailyWalkedOut: 0,
      cookingSession: null,
      closingSummary: null,
      meta: {
        ...s.meta,
        records: { ...s.meta.records, totalRuns: s.meta.records.totalRuns + 1 },
      },
    }))
  },

  toggleDraftCard: (id) => {
    const { draftSelectedIds, draftHand, run } = get()
    if (!run) return

    const isSelected = draftSelectedIds.includes(id)
    if (isSelected) {
      set({ draftSelectedIds: draftSelectedIds.filter((sid) => sid !== id) })
      return
    }
    if (draftSelectedIds.length >= DRAFT_SELECT_MAX) return

    const card = draftHand.find((ing) => ing.id === id)
    if (!card) return
    const usedBudget = draftHand
      .filter((ing) => draftSelectedIds.includes(ing.id))
      .reduce((sum, ing) => sum + ing.basePrice, 0)
    if (usedBudget + card.basePrice > run.cash) return

    set({ draftSelectedIds: [...draftSelectedIds, id] })
  },

  confirmDraft: () => {
    const { run, draftHand, draftSelectedIds } = get()
    if (!run || draftSelectedIds.length < DRAFT_SELECT_MAX) return

    const selected = draftHand.filter((ing) => draftSelectedIds.includes(ing.id))
    const cost = selected.reduce((sum, ing) => sum + ing.basePrice, 0)
    const orders = generateDayOrders(allCustomers)
    const totalSlots = orders.reduce((s, o) => s + o.slots.length, 0)

    set({
      run: { ...run, inventory: selected, cash: run.cash - cost },
      phase: 'service',
      serviceOrders: orders,
      currentOrderIdx: 0,
      currentSlotIdx: 0,
      orderStartedAt: Date.now(),
      dailyRevenue: 0,
      dailyReputationDelta: 0,
      dailyServedSlots: 0,
      dailyWalkedOut: 0,
      cookingSession: null,
      closingSummary: makeClosingSummary(0, 0, 0, totalSlots, 0),
    })
  },

  // ── Cooking actions ──

  placeRice: () => {
    const { phase, cookingSession } = get()
    if (phase !== 'service') return
    if (cookingSession !== null) return
    set({ cookingSession: startCooking() })
  },

  placeNetaAction: (ingredientId) => {
    const {
      cookingSession, run, serviceOrders, currentOrderIdx, currentSlotIdx,
      orderStartedAt, dailyReputationDelta, dailyWalkedOut, closingSummary,
    } = get()
    if (!run) return

    // シャリなしでネタ → 順序ミス
    if (cookingSession === null) {
      set({
        orderStartedAt: orderStartedAt - MISTAKE_TIME_PENALTY_MS,
      })
      applyPatience(set, get, 'mistake')
      return
    }

    const ingredient = run.inventory.find((ing) => ing.id === ingredientId)
    if (!ingredient) return

    const order = serviceOrders[currentOrderIdx]
    if (!order) return
    const slot = order.slots[currentSlotIdx]
    if (!slot) return

    // 合わないネタ → 順序ミス
    if (!validateSlotMatch(slot, ingredient.tags)) {
      set({
        cookingSession: null,
        orderStartedAt: orderStartedAt - MISTAKE_TIME_PENALTY_MS,
      })
      applyPatience(set, get, 'mistake')
      return
    }

    // 正しいネタ → セット
    set({ cookingSession: placeNeta(cookingSession, ingredientId) })

    // 副作用なし: 参照のみで警告を抑制
    void dailyReputationDelta
    void dailyWalkedOut
    void closingSummary
  },

  serveSushi: () => {
    const {
      cookingSession, run, serviceOrders, currentOrderIdx, currentSlotIdx,
      orderStartedAt, dailyRevenue, dailyReputationDelta, dailyServedSlots,
      dailyWalkedOut, closingSummary,
    } = get()
    if (!run || !cookingSession || cookingSession.netaId === null) return

    const order = serviceOrders[currentOrderIdx]
    if (!order) return
    const slot = order.slots[currentSlotIdx]
    if (!slot) return

    const ingredient = run.inventory.find((ing) => ing.id === cookingSession.netaId)
    if (!ingredient) return

    // 提供直前の最終チェック（二重安全）
    if (!validateSlotMatch(slot, ingredient.tags)) return

    const remaining = ORDER_TIME_MS - (Date.now() - orderStartedAt)
    const ratio = Math.max(0, remaining) / ORDER_TIME_MS
    const reward = calculateReward(slot.baseReward, ratio)

    const newInventory = consumeIngredient(ingredient.id, run.inventory)
    const updatedSlot: typeof slot = { ...slot, filledBy: ingredient.id }
    const updatedSlots = order.slots.map((s, i) => (i === currentSlotIdx ? updatedSlot : s))
    const updatedOrder: Order = { ...order, slots: updatedSlots }
    const updatedOrders = updateOrder(serviceOrders, currentOrderIdx, updatedOrder)

    const newRevenue = dailyRevenue + reward
    const newServedSlots = dailyServedSlots + 1
    const totalSlots = updatedOrders.reduce((s, o) => s + o.slots.length, 0)

    const next = resolveNext(updatedOrders, currentOrderIdx, currentSlotIdx, false)

    if (next === 'done') {
      set({
        run: { ...run, inventory: newInventory },
        serviceOrders: updatedOrders,
        phase: 'closing',
        dailyRevenue: newRevenue,
        dailyServedSlots: newServedSlots,
        cookingSession: null,
        closingSummary: makeClosingSummary(newRevenue, dailyReputationDelta, newServedSlots, totalSlots, dailyWalkedOut),
      })
    } else {
      set({
        run: { ...run, inventory: newInventory },
        serviceOrders: updatedOrders,
        currentOrderIdx: next.orderIdx,
        currentSlotIdx: next.slotIdx,
        orderStartedAt: Date.now(),
        dailyRevenue: newRevenue,
        dailyServedSlots: newServedSlots,
        cookingSession: null,
      })
    }

    // 参照のみ
    void closingSummary
  },

  cancelCooking: () => {
    set({ cookingSession: null })
  },

  timeoutCurrentSlot: () => {
    applyPatience(set, get, 'timeout')
  },

  confirmClosing: () => {
    const { run, dailyRevenue, dailyReputationDelta, dailyServedSlots, meta } = get()
    if (!run) return

    const log = buildDayLog(run, dailyRevenue, dailyReputationDelta, dailyServedSlots)
    const nextRun = advanceToNextDay(run, log)

    if (nextRun.isOver) {
      set({
        run: nextRun,
        phase: 'gameover',
        closingSummary: null,
        meta: {
          ...meta,
          norenValue: meta.norenValue + nextRun.reputation,
          records: {
            ...meta.records,
            bestRevenue: Math.max(meta.records.bestRevenue, dailyRevenue),
            completedSeasons: meta.records.completedSeasons + 1,
          },
        },
      })
    } else {
      set({
        run: nextRun,
        phase: 'morning_market',
        draftHand: pickDraftHand(allIngredients),
        draftSelectedIds: [],
        serviceOrders: [],
        currentOrderIdx: 0,
        currentSlotIdx: 0,
        orderStartedAt: 0,
        dailyRevenue: 0,
        dailyReputationDelta: 0,
        dailyServedSlots: 0,
        dailyWalkedOut: 0,
        cookingSession: null,
        closingSummary: null,
      })
    }
  },

  endRun: () => {
    set({ phase: 'gameover' })
  },
}))

// ── 忍耐ペナルティ共通処理 ───────────────────────────────────────────────────

type SetFn = Parameters<Parameters<typeof create>[0]>[0]
type GetFn = Parameters<Parameters<typeof create>[0]>[1]

function applyPatience(
  set: SetFn,
  get: GetFn,
  reason: 'timeout' | 'mistake',
) {
  const {
    run, serviceOrders, currentOrderIdx, currentSlotIdx,
    dailyRevenue, dailyReputationDelta, dailyServedSlots, dailyWalkedOut,
  } = get() as GameState & StoreExtras & GameActions

  if (!run) return
  const order = serviceOrders[currentOrderIdx]
  if (!order) return

  const newPatience = order.patience - 1
  const updatedOrders = updateOrder(serviceOrders, currentOrderIdx, { patience: newPatience })
  const totalSlots = updatedOrders.reduce((s, o) => s + o.slots.length, 0)

  if (newPatience <= 0) {
    // 怒り退店
    const newRepDelta = dailyReputationDelta + WALKOUT_REP_PENALTY
    const newWalkedOut = dailyWalkedOut + 1
    const next = resolveNext(updatedOrders, currentOrderIdx, currentSlotIdx, true)

    if (next === 'done') {
      set({
        serviceOrders: updatedOrders,
        phase: 'closing',
        dailyReputationDelta: newRepDelta,
        dailyWalkedOut: newWalkedOut,
        cookingSession: null,
        closingSummary: makeClosingSummary(dailyRevenue, newRepDelta, dailyServedSlots, totalSlots, newWalkedOut),
      })
    } else {
      set({
        serviceOrders: updatedOrders,
        currentOrderIdx: next.orderIdx,
        currentSlotIdx: next.slotIdx,
        orderStartedAt: Date.now(),
        dailyReputationDelta: newRepDelta,
        dailyWalkedOut: newWalkedOut,
        cookingSession: null,
      })
    }
    return
  }

  // 忍耐が残っている場合: 次のスロットへ（or 次の客へ）
  const repDelta = reason === 'timeout' ? dailyReputationDelta - 1 : dailyReputationDelta
  const next = resolveNext(updatedOrders, currentOrderIdx, currentSlotIdx, false)

  if (next === 'done') {
    set({
      serviceOrders: updatedOrders,
      phase: 'closing',
      dailyReputationDelta: repDelta,
      cookingSession: null,
      closingSummary: makeClosingSummary(dailyRevenue, repDelta, dailyServedSlots, totalSlots, dailyWalkedOut),
    })
  } else {
    set({
      serviceOrders: updatedOrders,
      currentOrderIdx: next.orderIdx,
      currentSlotIdx: next.slotIdx,
      orderStartedAt: Date.now(),
      dailyReputationDelta: repDelta,
      cookingSession: null,
    })
  }
}
