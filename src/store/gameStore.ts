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
} from '../core/logic'

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
  servedCount: number
  totalOrders: number
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
  /** 現在のオーダーが開始された timestamp */
  orderStartedAt: number
  /** 本日の累計売上 */
  dailyRevenue: number
  /** 本日の評判変動 */
  dailyReputationDelta: number
  /** 本日の提供成功件数 */
  dailyServedCount: number

  /** 締めフェーズ用サマリー */
  closingSummary: ClosingSummary | null
}

interface GameActions {
  startNewRun: () => void
  toggleDraftCard: (ingredientId: string) => void
  confirmDraft: () => void
  serveCurrentOrder: (ingredientId: string) => void
  timeoutCurrentOrder: () => void
  confirmClosing: () => void
  endRun: () => void
}

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
  orderStartedAt: 0,
  dailyRevenue: 0,
  dailyReputationDelta: 0,
  dailyServedCount: 0,

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
      dailyRevenue: 0,
      dailyReputationDelta: 0,
      dailyServedCount: 0,
      closingSummary: null,
      meta: {
        ...s.meta,
        records: {
          ...s.meta.records,
          totalRuns: s.meta.records.totalRuns + 1,
        },
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
    const orders = generateDayOrders(allCustomers, allIngredients)

    set({
      run: { ...run, inventory: selected, cash: run.cash - cost },
      phase: 'service',
      serviceOrders: orders,
      currentOrderIdx: 0,
      orderStartedAt: Date.now(),
      dailyRevenue: 0,
      dailyReputationDelta: 0,
      dailyServedCount: 0,
    })
  },

  serveCurrentOrder: (ingredientId) => {
    const {
      run, serviceOrders, currentOrderIdx,
      dailyRevenue, dailyReputationDelta, dailyServedCount,
    } = get()
    if (!run) return
    const order = serviceOrders[currentOrderIdx]
    if (!order) return
    if (!order.requiredIngredients.includes(ingredientId)) return
    if (!run.inventory.some((ing) => ing.id === ingredientId)) return

    const newInventory = consumeIngredient(ingredientId, run.inventory)
    const newRevenue = dailyRevenue + order.reward
    const newRepDelta = dailyReputationDelta + 1
    const newServedCount = dailyServedCount + 1
    const nextIdx = currentOrderIdx + 1

    if (nextIdx >= serviceOrders.length) {
      set({
        run: { ...run, inventory: newInventory },
        phase: 'closing',
        dailyRevenue: newRevenue,
        dailyReputationDelta: newRepDelta,
        dailyServedCount: newServedCount,
        closingSummary: {
          revenue: newRevenue,
          reputationDelta: newRepDelta,
          servedCount: newServedCount,
          totalOrders: serviceOrders.length,
        },
      })
    } else {
      set({
        run: { ...run, inventory: newInventory },
        currentOrderIdx: nextIdx,
        orderStartedAt: Date.now(),
        dailyRevenue: newRevenue,
        dailyReputationDelta: newRepDelta,
        dailyServedCount: newServedCount,
      })
    }
  },

  timeoutCurrentOrder: () => {
    const {
      run, serviceOrders, currentOrderIdx,
      dailyRevenue, dailyReputationDelta, dailyServedCount,
    } = get()
    if (!run) return

    const newRepDelta = dailyReputationDelta - 1
    const nextIdx = currentOrderIdx + 1

    if (nextIdx >= serviceOrders.length) {
      set({
        phase: 'closing',
        dailyReputationDelta: newRepDelta,
        closingSummary: {
          revenue: dailyRevenue,
          reputationDelta: newRepDelta,
          servedCount: dailyServedCount,
          totalOrders: serviceOrders.length,
        },
      })
    } else {
      set({
        currentOrderIdx: nextIdx,
        orderStartedAt: Date.now(),
        dailyReputationDelta: newRepDelta,
      })
    }
  },

  confirmClosing: () => {
    const { run, dailyRevenue, dailyReputationDelta, dailyServedCount, meta } = get()
    if (!run) return

    const log = buildDayLog(run, dailyRevenue, dailyReputationDelta, dailyServedCount)
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
        dailyRevenue: 0,
        dailyReputationDelta: 0,
        dailyServedCount: 0,
        closingSummary: null,
      })
    }
  },

  endRun: () => {
    set({ phase: 'gameover' })
  },
}))
