import { create, type StoreApi } from 'zustand'
import type {
  GameState, Ingredient, RunState, MetaState, Order, Customer, Combo, CustomerType,
  DailyEvent, DayDifficulty, BossResult, RunResult,
  ShopId, SchoolId, ApprenticeId, PermanentBuffs,
} from '../core/types'
import ingredientsData from '../data/ingredients.json'
import customersData from '../data/customers.json'
import combosData from '../data/combos.json'
import {
  generateDayOrders,
  buildDayLog,
  advanceToNextDay,
  DRAFT_HAND_SIZE,
  DRAFT_SELECT_MAX,
  STARTING_CASH,
  STARTING_REPUTATION,
  ORDER_TIME_MS,
  MAX_DAY,
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
import { getDifficulty } from '../core/season'
import { rollDailyEvent } from '../core/events'
import { evaluateRun } from '../core/boss'
import { buildRunModifiers, comboBonusMultiplier, type RunModifiers } from '../core/modifiers'
import { ALL_SHOPS } from '../core/shops'
import { ALL_SCHOOLS } from '../core/schools'
import { ALL_APPRENTICES, APPRENTICE_SLOT_MAX } from '../core/apprentices'
import { INGREDIENT_UNLOCKS, BUFF_UNLOCKS, COMBO_UNLOCK_COSTS, nextBuffCost } from '../core/unlocks'
import { loadMeta, saveMeta, clearMeta, defaultMetaState } from './persistence'

const allIngredients = ingredientsData as unknown as Ingredient[]
const allCustomers = customersData as unknown as Customer[]
const allCombos = combosData as unknown as Combo[]

function applyStartingRep(meta: MetaState): number {
  return Math.min(100, STARTING_REPUTATION + meta.permanentBuffs.startingRepLevel * 5)
}

function makeNewRun(
  meta: MetaState,
  shopId: ShopId,
  schoolId: SchoolId,
  apprentices: ApprenticeId[],
): RunState {
  const mods = buildRunModifiers(shopId, schoolId, apprentices, meta)
  const startingCash = STARTING_CASH + mods.startingCashBonus
  const startingRep = Math.min(mods.reputationCap, applyStartingRep(meta))
  return {
    currentDay: 1,
    shopId,
    schoolId,
    apprentices: [...apprentices],
    cash: startingCash,
    reputation: startingRep,
    reputationCap: mods.reputationCap,
    inventory: [],
    unlockedCombos: [...meta.unlockedCombos],
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
  skippedCustomers: number
  forceClosed: boolean
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
  /** 確認モーダル表示中はゲーム時間を停止 */
  isServicePaused: boolean

  // ── Phase 4 ──
  /** 本日の難易度（朝市開始時に確定） */
  todayDifficulty: DayDifficulty | null
  /** 本日のイベント（null＝普段通り） */
  todayEvent: DailyEvent | null
  /** 本日の客数合計（generateDayOrdersで生成された数） */
  dailyCustomersTotal: number
  /** 本日のスロット合計（生成時の総数） */
  dailySlotsTotal: number
  /** 月末ボスの結果（critic_review/result フェーズ用） */
  bossResult: BossResult | null
  /** ラン終了時の集計結果（result フェーズ用） */
  runResult: RunResult | null

  // ── Phase 5 ──
  /** ラン開始フローで選択中の店舗（仮選択） */
  selectedShopId: ShopId | null
  /** ラン開始フローで選択中の流派 */
  selectedSchoolId: SchoolId | null
  /** 修飾子（ラン中のみ非null） */
  runModifiers: RunModifiers | null
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
  forceCloseDay: () => void
  setServicePaused: (v: boolean) => void
  confirmClosing: () => void
  confirmNews: () => void
  confirmCriticReview: () => void
  returnToTitle: () => void
  restartRun: () => void
  endRun: () => void

  // ── Phase 5: メニュー遷移 ──
  goToShopSelect: () => void
  goToSchoolSelect: () => void
  goToUnlockMenu: () => void
  goToApprenticeMenu: () => void
  goToRecordMenu: () => void
  /** 任意のメニューからタイトルへ */
  backToTitle: () => void

  // ── Phase 5: 選択 ──
  selectShop: (id: ShopId) => void
  confirmShop: () => void
  selectSchool: (id: SchoolId) => void
  /** 流派選択完了 → 実際にランを開始する */
  startRunWithSelection: () => void

  // ── Phase 5: アンロック購入 ──
  purchaseIngredientUnlock: (ingId: string) => void
  purchaseComboUnlock: (comboId: string) => void
  purchaseShopUnlock: (shopId: ShopId) => void
  purchaseSchoolUnlock: (schoolId: SchoolId) => void
  purchaseApprenticeUnlock: (apprenticeId: ApprenticeId) => void
  purchaseBuff: (buffId: keyof PermanentBuffs) => void

  // ── Phase 5: 弟子装着 ──
  toggleApprenticeHire: (apprenticeId: ApprenticeId) => void

  /** メタを永続化 */
  persistMeta: () => void
  /** チュートリアル閲覧済みにする */
  markTutorialSeen: () => void
  /** チュートリアルをもう一度表示する */
  resetTutorial: () => void
  /** メタ進行を完全リセット（のれん値・解放等すべて消える） */
  resetMeta: () => void
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
  skippedCustomers = 0,
  forceClosed = false,
): ClosingSummary {
  return { revenue, reputationDelta: repDelta, servedSlots, totalSlots, walkedOut, achievedCombos, skippedCustomers, forceClosed }
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

/** すべての客定義を返す（UI参照用） */
export function getAllCustomers(): Customer[] {
  return allCustomers
}

/**
 * イベントの食材価格倍率と、メタの解放済み食材プールを反映した手札を生成。
 * largerHand バフが立っていれば手札を1枚増やす。
 */
function makeDraftHand(event: DailyEvent | null, meta: MetaState): Ingredient[] {
  const priceMul = event?.effect.ingredientPriceMultiplier ?? 1
  const rareMul = event?.effect.rareIngredientMultiplier ?? 1

  const pool = allIngredients.filter((i) => meta.unlockedIngredients.includes(i.id))
  const source = pool.length > 0 ? pool : allIngredients

  // レア優遇: rare/epic を重み付けして並べ替え
  const weighted = [...source].sort(() => Math.random() - 0.5)
  if (rareMul > 1) {
    weighted.sort((a, b) => {
      const score = (i: Ingredient) =>
        (i.rarity === 'epic' ? 3 : i.rarity === 'rare' ? 2 : i.rarity === 'uncommon' ? 1 : 0) * rareMul
      return score(b) - score(a) + (Math.random() - 0.5)
    })
  }

  const handSize = DRAFT_HAND_SIZE + (meta.permanentBuffs.largerHand ? 1 : 0)
  const hand = weighted.slice(0, handSize)
  return hand.map((ing) => ({
    ...ing,
    basePrice: Math.max(1, Math.round(ing.basePrice * priceMul)),
  }))
}

// ── ストア ────────────────────────────────────────────────────────────────────

const initialMeta = loadMeta()

export const useGameStore = create<GameState & StoreExtras & GameActions>((set, get) => ({
  // ── GameState ──
  phase: 'title',
  run: null,
  meta: initialMeta,

  // ── Draft state ──
  draftHand: [],
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
  isServicePaused: false,

  // ── Phase 4 ──
  todayDifficulty: null,
  todayEvent: null,
  dailyCustomersTotal: 0,
  dailySlotsTotal: 0,
  bossResult: null,
  runResult: null,

  // ── Phase 5 ──
  selectedShopId: null,
  selectedSchoolId: null,
  runModifiers: null,

  // ── Actions ──

  /**
   * Phase 5: タイトルから店舗選択へ。
   * 実際のラン開始は startRunWithSelection で行う。
   */
  startNewRun: () => {
    set({ phase: 'shop_select', selectedShopId: null, selectedSchoolId: null })
  },

  confirmNews: () => {
    const { phase, todayEvent, run } = get()
    if (phase !== 'news' || !run) return
    // ニュースの即時評判効果を即適用（dailyReputationDeltaには反映しない＝重複防止）
    const eventRepDelta = todayEvent?.effect.reputationDelta ?? 0
    set({
      phase: 'morning_market',
      run: { ...run, reputation: Math.max(0, Math.min(100, run.reputation + eventRepDelta)) },
    })
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
    const { run, draftHand, draftSelectedIds, todayDifficulty, todayEvent, runModifiers } = get()
    if (!run || draftSelectedIds.length < DRAFT_SELECT_MAX) return
    if (!todayDifficulty) return

    const selected = draftHand.filter((ing) => draftSelectedIds.includes(ing.id))
    const cost = selected.reduce((sum, ing) => sum + ing.basePrice, 0)
    const orders = generateDayOrders(
      allCustomers, todayDifficulty, todayEvent, run.reputation,
      {
        customerCountMultiplier: runModifiers?.customerCountMultiplier,
        patienceBonus: runModifiers?.patienceBonus,
        traditionalCustomerPenalty: runModifiers?.traditionalCustomerPenalty,
      },
    )
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
      dailyCustomersTotal: orders.length,
      dailySlotsTotal: totalSlots,
      closingSummary: makeClosingSummary(0, 0, 0, totalSlots, 0, []),
      isServicePaused: false,
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
      dailyWalkedOut, dailyAchievedCombos, todayEvent, todayDifficulty,
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

    // タイマーは難易度で短縮された timeLimit を採用
    const timeLimit = order.timeLimit || ORDER_TIME_MS
    const remaining = timeLimit - (Date.now() - orderStartedAt)
    const ratio = Math.max(0, remaining) / timeLimit
    const baseRewardWithTip = calculateReward(slot.baseReward, ratio)
    let multiplier = combo ? comboMultiplier(combo, customerType) : 1
    // 江戸前祭りイベント: 江戸前タグを含むコンボに +edomaeBonus
    if (combo && todayEvent?.effect.edomaeBonus !== undefined && combo.requiredTags.includes('edomae')) {
      multiplier += todayEvent.effect.edomaeBonus
    }
    // 修飾子（流派・店舗・弟子）からの加算倍率
    const mods = get().runModifiers
    if (mods && combo) {
      multiplier += comboBonusMultiplier(combo, mods)
    }
    // 観光客の支払い倍率（駅前店舗）
    let touristMul = 1
    if (mods && customerType === 'tourist') touristMul = mods.touristPayoutMultiplier
    // 流派の payoutMultiplier（全体）
    const payoutMul = mods?.payoutMultiplier ?? 1
    const reward = Math.round(baseRewardWithTip * multiplier * touristMul * payoutMul)
    void todayDifficulty

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

  setServicePaused: (v) => set({ isServicePaused: v }),

  forceCloseDay: () => {
    const {
      serviceOrders, currentOrderIdx,
      dailyRevenue, dailyReputationDelta, dailyServedSlots,
      dailyWalkedOut, dailyAchievedCombos, dailySlotsTotal,
    } = get()

    const skippedCustomers = Math.max(0, serviceOrders.length - currentOrderIdx - 1)
    const newRepDelta = dailyReputationDelta - skippedCustomers

    set({
      phase: 'closing',
      cookingSession: null,
      isServicePaused: false,
      dailyReputationDelta: newRepDelta,
      closingSummary: makeClosingSummary(
        dailyRevenue, newRepDelta, dailyServedSlots, dailySlotsTotal,
        dailyWalkedOut, dailyAchievedCombos, skippedCustomers, true,
      ),
    })
  },

  confirmClosing: () => {
    const {
      run, dailyRevenue, dailyReputationDelta, dailyServedSlots, dailyAchievedCombos,
      dailyCustomersTotal, dailySlotsTotal, dailyWalkedOut, todayEvent, meta, closingSummary,
    } = get()
    if (!run) return

    const skippedCustomers = closingSummary?.skippedCustomers ?? 0
    const log = buildDayLog(run, {
      revenue: dailyRevenue,
      reputationDelta: dailyReputationDelta,
      customersServed: dailyCustomersTotal - dailyWalkedOut - skippedCustomers,
      customersTotal: dailyCustomersTotal,
      slotsServed: dailyServedSlots,
      slotsTotal: dailySlotsTotal,
      walkedOut: dailyWalkedOut,
      achievedCombos: dailyAchievedCombos,
      eventId: todayEvent?.id ?? null,
      skippedCustomers,
    })
    const nextRun = advanceToNextDay(run, log)

    // Day 30 を完了したら覆面調査員へ。それ以外は次の日のニュースへ。
    if (run.currentDay >= MAX_DAY) {
      const result = evaluateRun(nextRun, allCombos)
      set({
        run: nextRun,
        phase: 'critic_review',
        bossResult: result,
        closingSummary: null,
        comboFlash: null,
        meta: {
          ...meta,
          records: {
            ...meta.records,
            bestRevenue: Math.max(meta.records.bestRevenue, dailyRevenue),
          },
        },
      })
      return
    }

    // 翌日のニュース＋難易度を準備
    const nextDifficulty = getDifficulty(nextRun.currentDay)
    const nextEvent = rollDailyEvent(nextRun)

    set({
      run: nextRun,
      phase: 'news',
      draftHand: makeDraftHand(nextEvent, meta),
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
      todayDifficulty: nextDifficulty,
      todayEvent: nextEvent,
      dailyCustomersTotal: 0,
      dailySlotsTotal: 0,
    })
  },

  confirmCriticReview: () => {
    const { run, bossResult, meta, runModifiers } = get()
    if (!run || !bossResult) return

    // 弟子の効率自動合格 / メタの1項目自動合格 を後乗せで適用
    let result = bossResult
    if (runModifiers?.bossEfficiencyExempt && !result.efficiencyStar) {
      const stars = result.totalStars + 1
      result = { ...result, efficiencyStar: true, totalStars: stars, passed: stars >= 2 }
    }
    if (runModifiers?.bossOneExempt) {
      // 最も低い未達項目を1つ加点（quality > diversity > efficiency > hospitality の順で見る）
      const order: Array<keyof BossResult> = ['qualityStar', 'diversityStar', 'efficiencyStar', 'hospitalityStar']
      for (const key of order) {
        if (!(result as unknown as Record<string, boolean>)[key]) {
          const stars = result.totalStars + 1
          result = { ...result, [key]: true, totalStars: stars, passed: stars >= 2 } as BossResult
          break
        }
      }
    }

    // のれん値計算
    const uniqueCombos = new Set(run.comboHistory.map((e) => e.comboId))
    const norenGained = result.passed
      ? run.reputation * 2 + run.comboHistory.length * 5
      : run.reputation
    const finalReputation = result.passed
      ? run.reputation
      : Math.max(0, run.reputation - 30)

    const totalRevenue = run.history.reduce((s, l) => s + l.revenue, 0)
    const bestDay = run.history.reduce(
      (best, l) => (l.revenue > (best?.revenue ?? 0) ? l : best),
      null as (typeof run.history)[0] | null,
    )

    const runResultObj: RunResult = {
      totalRevenue,
      bestDayRevenue: bestDay?.revenue ?? 0,
      bestDay: bestDay?.dayNumber ?? 0,
      totalCombos: run.comboHistory.length,
      uniqueCombos: uniqueCombos.size,
      finalReputation,
      finalCash: run.cash,
      norenGained,
      passed: result.passed,
      bossResult: result,
    }

    // 達成コンボの累積記録（重複除外）
    const newDiscovered = new Set([
      ...meta.records.discoveredCombos,
      ...run.comboHistory.map((e) => e.comboId),
    ])

    const newMeta: MetaState = {
      ...meta,
      norenValue: meta.norenValue + norenGained,
      records: {
        ...meta.records,
        bestRevenue: Math.max(meta.records.bestRevenue, totalRevenue),
        bestReputation: Math.max(meta.records.bestReputation, run.reputation),
        completedSeasons: result.passed
          ? meta.records.completedSeasons + 1
          : meta.records.completedSeasons,
        discoveredCombos: Array.from(newDiscovered),
      },
    }
    saveMeta(newMeta)

    set({
      phase: 'result',
      runResult: runResultObj,
      bossResult: result,
      run: { ...run, reputation: finalReputation, isOver: true },
      meta: newMeta,
      runModifiers: null,
    })
  },

  returnToTitle: () => {
    set({
      phase: 'title',
      run: null,
      runResult: null,
      bossResult: null,
      todayEvent: null,
      todayDifficulty: null,
      draftSelectedIds: [],
      draftHand: [],
      serviceOrders: [],
      cookingSession: null,
      closingSummary: null,
      comboFlash: null,
      dailyAchievedCombos: [],
      dailyCustomersTotal: 0,
      dailySlotsTotal: 0,
      isServicePaused: false,
    })
  },

  restartRun: () => {
    set({ phase: 'shop_select', selectedShopId: null, selectedSchoolId: null, runResult: null, run: null, runModifiers: null })
  },

  endRun: () => {
    set({ phase: 'gameover' })
  },

  // ── Phase 5: メニュー遷移 ──
  goToShopSelect: () => set({ phase: 'shop_select', selectedShopId: null, selectedSchoolId: null }),
  goToSchoolSelect: () => set({ phase: 'school_select' }),
  goToUnlockMenu: () => set({ phase: 'unlock_menu' }),
  goToApprenticeMenu: () => set({ phase: 'apprentice_menu' }),
  goToRecordMenu: () => set({ phase: 'record_menu' }),
  backToTitle: () => set({ phase: 'title' }),

  // ── Phase 5: 選択 ──
  selectShop: (id) => {
    const { meta } = get()
    if (!meta.unlockedShops.includes(id)) return
    set({ selectedShopId: id })
  },
  confirmShop: () => {
    const { selectedShopId } = get()
    if (!selectedShopId) return
    set({ phase: 'school_select' })
  },
  selectSchool: (id) => {
    const { meta } = get()
    if (!meta.unlockedSchools.includes(id)) return
    set({ selectedSchoolId: id })
  },
  startRunWithSelection: () => {
    set((s) => {
      const shopId = s.selectedShopId ?? 'yatai'
      const schoolId = s.selectedSchoolId ?? 'edomae'
      const apprentices = [...s.meta.hiredApprentices]
      const newMeta: MetaState = {
        ...s.meta,
        records: { ...s.meta.records, totalRuns: s.meta.records.totalRuns + 1 },
      }
      saveMeta(newMeta)

      const run = makeNewRun(newMeta, shopId, schoolId, apprentices)
      const mods = buildRunModifiers(shopId, schoolId, apprentices, newMeta)
      const difficulty = getDifficulty(1)
      const event = rollDailyEvent(run)
      // 朝市予算ボーナス（弟子の太郎など）はここで cash に加算
      const runWithBudget: RunState = {
        ...run,
        cash: run.cash + mods.morningBudgetBonus,
      }

      return {
        run: runWithBudget,
        phase: 'news',
        meta: newMeta,
        draftHand: makeDraftHand(event, newMeta),
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
        todayDifficulty: difficulty,
        todayEvent: event,
        dailyCustomersTotal: 0,
        dailySlotsTotal: 0,
        bossResult: null,
        runResult: null,
        runModifiers: mods,
      }
    })
  },

  // ── Phase 5: アンロック購入 ──
  purchaseIngredientUnlock: (ingId) => {
    set((s) => {
      const entry = INGREDIENT_UNLOCKS.find((e) => e.id === ingId)
      if (!entry) return s
      if (s.meta.unlockedIngredients.includes(ingId)) return s
      if (s.meta.norenValue < entry.cost) return s
      const newMeta: MetaState = {
        ...s.meta,
        norenValue: s.meta.norenValue - entry.cost,
        unlockedIngredients: [...s.meta.unlockedIngredients, ingId],
      }
      saveMeta(newMeta)
      return { meta: newMeta }
    })
  },
  purchaseComboUnlock: (comboId) => {
    set((s) => {
      const cost = COMBO_UNLOCK_COSTS[comboId]
      if (cost === undefined) return s
      if (s.meta.unlockedCombos.includes(comboId)) return s
      if (s.meta.norenValue < cost) return s
      const newMeta: MetaState = {
        ...s.meta,
        norenValue: s.meta.norenValue - cost,
        unlockedCombos: [...s.meta.unlockedCombos, comboId],
      }
      saveMeta(newMeta)
      return { meta: newMeta }
    })
  },
  purchaseShopUnlock: (shopId) => {
    set((s) => {
      const shop = ALL_SHOPS.find((sh) => sh.id === shopId)
      if (!shop) return s
      if (s.meta.unlockedShops.includes(shopId)) return s
      if (s.meta.norenValue < shop.unlockNoren) return s
      const newMeta: MetaState = {
        ...s.meta,
        norenValue: s.meta.norenValue - shop.unlockNoren,
        unlockedShops: [...s.meta.unlockedShops, shopId],
      }
      saveMeta(newMeta)
      return { meta: newMeta }
    })
  },
  purchaseSchoolUnlock: (schoolId) => {
    set((s) => {
      const school = ALL_SCHOOLS.find((sc) => sc.id === schoolId)
      if (!school) return s
      if (s.meta.unlockedSchools.includes(schoolId)) return s
      if (s.meta.norenValue < school.unlockNoren) return s
      const newMeta: MetaState = {
        ...s.meta,
        norenValue: s.meta.norenValue - school.unlockNoren,
        unlockedSchools: [...s.meta.unlockedSchools, schoolId],
      }
      saveMeta(newMeta)
      return { meta: newMeta }
    })
  },
  purchaseApprenticeUnlock: (apprenticeId) => {
    set((s) => {
      const a = ALL_APPRENTICES.find((x) => x.id === apprenticeId)
      if (!a) return s
      if (s.meta.unlockedApprentices.includes(apprenticeId)) return s
      if (s.meta.norenValue < a.unlockNoren) return s
      const newMeta: MetaState = {
        ...s.meta,
        norenValue: s.meta.norenValue - a.unlockNoren,
        unlockedApprentices: [...s.meta.unlockedApprentices, apprenticeId],
      }
      saveMeta(newMeta)
      return { meta: newMeta }
    })
  },
  purchaseBuff: (buffId) => {
    set((s) => {
      const buff = BUFF_UNLOCKS.find((b) => b.id === buffId)
      if (!buff) return s
      const buffs = s.meta.permanentBuffs
      // 現在のレベル（boolean は 0/1、レベル制は数値）
      let currentLevel: number
      if (buffId === 'startingCashLevel') currentLevel = buffs.startingCashLevel
      else if (buffId === 'startingRepLevel') currentLevel = buffs.startingRepLevel
      else currentLevel = buffs[buffId] ? 1 : 0

      const cost = nextBuffCost(buff, currentLevel)
      if (cost === null) return s
      if (s.meta.norenValue < cost) return s

      const newBuffs: PermanentBuffs = { ...buffs }
      if (buffId === 'startingCashLevel') newBuffs.startingCashLevel = currentLevel + 1
      else if (buffId === 'startingRepLevel') newBuffs.startingRepLevel = currentLevel + 1
      else if (buffId === 'largerHand') newBuffs.largerHand = true
      else if (buffId === 'patienceBonus') newBuffs.patienceBonus = true
      else if (buffId === 'bossExempt') newBuffs.bossExempt = true

      const newMeta: MetaState = {
        ...s.meta,
        norenValue: s.meta.norenValue - cost,
        permanentBuffs: newBuffs,
      }
      saveMeta(newMeta)
      return { meta: newMeta }
    })
  },

  // ── Phase 5: 弟子装着 ──
  toggleApprenticeHire: (apprenticeId) => {
    set((s) => {
      if (!s.meta.unlockedApprentices.includes(apprenticeId)) return s
      const hired = s.meta.hiredApprentices
      const isHired = hired.includes(apprenticeId)
      let next: ApprenticeId[]
      if (isHired) {
        next = hired.filter((x) => x !== apprenticeId)
      } else {
        if (hired.length >= APPRENTICE_SLOT_MAX) return s
        next = [...hired, apprenticeId]
      }
      const newMeta: MetaState = { ...s.meta, hiredApprentices: next }
      saveMeta(newMeta)
      return { meta: newMeta }
    })
  },

  persistMeta: () => {
    saveMeta(get().meta)
  },

  markTutorialSeen: () => {
    set((s) => {
      const newMeta: MetaState = { ...s.meta, tutorialSeen: true }
      saveMeta(newMeta)
      return { meta: newMeta }
    })
  },

  resetTutorial: () => {
    set((s) => {
      const newMeta: MetaState = { ...s.meta, tutorialSeen: false }
      saveMeta(newMeta)
      return { meta: newMeta }
    })
  },

  resetMeta: () => {
    clearMeta()
    set({ meta: defaultMetaState() })
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
