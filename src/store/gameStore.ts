import { create, type StoreApi } from 'zustand'
import type { GameState, Ingredient, RunState, MetaState, Order, Customer, Combo, CustomerType } from '../core/types'
import ingredientsData from '../data/ingredients.json'
import customersData from '../data/customers.json'
import combosData from '../data/combos.json'
import {
  pickDraftHand,
  generateDayOrders,
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
  popNeta,
  validateSlotMatch,
  calculateReward,
  MISTAKE_TIME_PENALTY_MS,
  WALKOUT_REP_PENALTY,
} from '../core/cooking'
import {
  findBestCombo,
  detectAvailableCombos,
  comboMultiplier,
} from '../core/combo'

const allIngredients = ingredientsData as unknown as Ingredient[]
const allCustomers = customersData as unknown as Customer[]
const allCombos = combosData as unknown as Combo[]

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
    comboHistory: [],
    isOver: false,
  }
}

export interface ClosingSummary {
  revenue: number
  reputationDelta: number
  servedSlots: number
  totalSlots: number
  walkedOut: number
  achievedCombos: string[]
}

/** 提供成功時に画面表示する直近のコンボ情報 */
export interface ComboFlash {
  comboId: string
  comboName: string
  multiplier: number
  /** 表示開始時刻 */
  shownAt: number
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

  /** 本日達成済みのコンボIDリスト */
  dailyAchievedCombos: string[]
  /** 直近の成立コンボ（画面表示用、自動的に消える） */
  comboFlash: ComboFlash | null

  /** 締めフェーズ用サマリー */
  closingSummary: ClosingSummary | null
}

interface GameActions {
  startNewRun: () => void
  toggleDraftCard: (ingredientId: string) => void
  confirmDraft: () => void
  placeRice: () => void
  placeNetaAction: (ingredientId: string) => void
  popNetaAction: () => void
  serveSushi: () => void
  cancelCooking: () => void
  timeoutCurrentSlot: () => void
  clearComboFlash: () => void
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
  achievedCombos: string[] = [],
): ClosingSummary {
  return { revenue, reputationDelta: repDelta, servedSlots, totalSlots, walkedOut, achievedCombos }
}

/**
 * 在庫から有効に握れるコンボ集合を、現在処理中の客タイプで絞って返す。
 * UIの「コンボ可能」表示に使う。
 */
export function listAvailableCombos(
  inventory: Ingredient[],
  unlockedCombos: string[],
  customerType?: CustomerType,
): Combo[] {
  return detectAvailableCombos(inventory, allCombos, unlockedCombos, customerType)
}

/** すべてのコンボ定義を返す（UI参照用） */
export function getAllCombos(): Combo[] {
  return allCombos
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
  dailyAchievedCombos: [],
  comboFlash: null,

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
      dailyAchievedCombos: [],
      comboFlash: null,
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
      dailyAchievedCombos: [],
      comboFlash: null,
      closingSummary: makeClosingSummary(0, 0, 0, totalSlots, 0, []),
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
    const { cookingSession, run, orderStartedAt } = get()
    if (!run) return

    // シャリなしでネタ → 順序ミス
    if (cookingSession === null) {
      set({ orderStartedAt: orderStartedAt - MISTAKE_TIME_PENALTY_MS })
      applyPatience(set, get, 'mistake')
      return
    }

    const ingredient = run.inventory.find((ing) => ing.id === ingredientId)
    if (!ingredient) return
    // すでに最大数なら無視
    if (cookingSession.netaIds.length >= 3) return
    // 同じインスタンスの再選択は無視（同じIDでも別個体ならOKだが、今回は単純化）
    if (cookingSession.netaIds.includes(ingredientId)) return

    set({ cookingSession: placeNeta(cookingSession, ingredientId) })
  },

  popNetaAction: () => {
    const { cookingSession } = get()
    if (!cookingSession) return
    set({ cookingSession: popNeta(cookingSession) })
  },

  serveSushi: () => {
    const {
      cookingSession, run, serviceOrders, currentOrderIdx, currentSlotIdx,
      orderStartedAt, dailyRevenue, dailyReputationDelta, dailyServedSlots,
      dailyWalkedOut, dailyAchievedCombos,
    } = get()
    if (!run || !cookingSession || cookingSession.netaIds.length === 0) return

    const order = serviceOrders[currentOrderIdx]
    if (!order) return
    const slot = order.slots[currentSlotIdx]
    if (!slot) return

    const netas = cookingSession.netaIds
      .map((id) => run.inventory.find((ing) => ing.id === id))
      .filter((i): i is Ingredient => i !== undefined)
    if (netas.length === 0) return

    // スロット要件: いずれかのネタがslotに合致する必要あり
    const slotMatched = netas.some((n) => validateSlotMatch(slot, n.tags))
    if (!slotMatched) return

    const customer = allCustomers.find((c) => c.id === order.customerId)
    const customerType = customer?.type
    if (!customerType) return

    // コンボ判定
    const combo = findBestCombo(netas, allCombos, run.unlockedCombos, customerType)

    const remaining = ORDER_TIME_MS - (Date.now() - orderStartedAt)
    const ratio = Math.max(0, remaining) / ORDER_TIME_MS
    const baseRewardWithTip = calculateReward(slot.baseReward, ratio)
    const multiplier = combo ? comboMultiplier(combo, customerType) : 1
    const reward = Math.round(baseRewardWithTip * multiplier)

    // 在庫から消費。
    // - コンボ成立: 置いたネタすべて消費（ユーザーの意図どおり）
    // - 単独提供: 置いたネタのうちスロット一致する1個を消費（残りはWIPごと破棄＝消費しない）
    let newInventory = run.inventory
    if (combo) {
      // 置いたネタIDを順に1つずつ inventory から取り除く
      for (const id of cookingSession.netaIds) {
        const idx = newInventory.findIndex((i) => i.id === id)
        if (idx !== -1) newInventory = [...newInventory.slice(0, idx), ...newInventory.slice(idx + 1)]
      }
    } else {
      const used = netas.find((n) => validateSlotMatch(slot, n.tags))
      if (used) {
        const idx = newInventory.findIndex((i) => i.id === used.id)
        if (idx !== -1) newInventory = [...newInventory.slice(0, idx), ...newInventory.slice(idx + 1)]
      }
    }

    const updatedSlot: typeof slot = { ...slot, filledBy: netas[0].id }
    const updatedSlots = order.slots.map((s, i) => (i === currentSlotIdx ? updatedSlot : s))
    const updatedOrder: Order = { ...order, slots: updatedSlots }
    const updatedOrders = updateOrder(serviceOrders, currentOrderIdx, updatedOrder)

    const newRevenue = dailyRevenue + reward
    const newServedSlots = dailyServedSlots + 1
    const totalSlots = updatedOrders.reduce((s, o) => s + o.slots.length, 0)
    const newAchievedCombos = combo ? [...dailyAchievedCombos, combo.id] : dailyAchievedCombos
    const newComboHistory = combo
      ? [...run.comboHistory, { comboId: combo.id, dayNumber: run.currentDay }]
      : run.comboHistory

    const flash: ComboFlash | null = combo
      ? { comboId: combo.id, comboName: combo.name, multiplier, shownAt: Date.now() }
      : null

    const next = resolveNext(updatedOrders, currentOrderIdx, currentSlotIdx, false)

    if (next === 'done') {
      set({
        run: { ...run, inventory: newInventory, comboHistory: newComboHistory },
        serviceOrders: updatedOrders,
        phase: 'closing',
        dailyRevenue: newRevenue,
        dailyServedSlots: newServedSlots,
        dailyAchievedCombos: newAchievedCombos,
        cookingSession: null,
        comboFlash: flash,
        closingSummary: makeClosingSummary(
          newRevenue, dailyReputationDelta, newServedSlots, totalSlots, dailyWalkedOut, newAchievedCombos,
        ),
      })
    } else {
      set({
        run: { ...run, inventory: newInventory, comboHistory: newComboHistory },
        serviceOrders: updatedOrders,
        currentOrderIdx: next.orderIdx,
        currentSlotIdx: next.slotIdx,
        orderStartedAt: Date.now(),
        dailyRevenue: newRevenue,
        dailyServedSlots: newServedSlots,
        dailyAchievedCombos: newAchievedCombos,
        cookingSession: null,
        comboFlash: flash,
      })
    }
  },

  cancelCooking: () => {
    set({ cookingSession: null })
  },

  timeoutCurrentSlot: () => {
    applyPatience(set, get, 'timeout')
  },

  clearComboFlash: () => {
    set({ comboFlash: null })
  },

  confirmClosing: () => {
    const { run, dailyRevenue, dailyReputationDelta, dailyServedSlots, dailyAchievedCombos, meta } = get()
    if (!run) return

    const log = buildDayLog(run, dailyRevenue, dailyReputationDelta, dailyServedSlots, dailyAchievedCombos)
    const nextRun = advanceToNextDay(run, log)

    if (nextRun.isOver) {
      set({
        run: nextRun,
        phase: 'gameover',
        closingSummary: null,
        comboFlash: null,
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
        dailyAchievedCombos: [],
        comboFlash: null,
        closingSummary: null,
      })
    }
  },

  endRun: () => {
    set({ phase: 'gameover' })
  },
}))

// ── 忍耐ペナルティ共通処理 ───────────────────────────────────────────────────

type StoreT = GameState & StoreExtras & GameActions
type SetFn = StoreApi<StoreT>['setState']
type GetFn = StoreApi<StoreT>['getState']

function applyPatience(
  set: SetFn,
  get: GetFn,
  reason: 'timeout' | 'mistake',
) {
  const {
    run, serviceOrders, currentOrderIdx, currentSlotIdx,
    dailyRevenue, dailyReputationDelta, dailyServedSlots, dailyWalkedOut,
    dailyAchievedCombos,
  } = get()

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
        closingSummary: makeClosingSummary(
          dailyRevenue, newRepDelta, dailyServedSlots, totalSlots, newWalkedOut, dailyAchievedCombos,
        ),
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
      closingSummary: makeClosingSummary(
        dailyRevenue, repDelta, dailyServedSlots, totalSlots, dailyWalkedOut, dailyAchievedCombos,
      ),
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
