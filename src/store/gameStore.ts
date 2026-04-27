import { create } from 'zustand'
import type { GameState, Ingredient, RunState, MetaState } from '../core/types'
import ingredientsData from '../data/ingredients.json'

const defaultMeta: MetaState = {
  norenValue: 0,
  unlockedShops: ['shop_default'],
  unlockedIngredients: ['ing_maguro', 'ing_salmon', 'ing_hirame', 'ing_tamago', 'ing_uni', 'ing_ika'],
  unlockedCombos: [],
  hiredApprentices: [],
  permanentBuffs: {
    startingCash: 0,
    startingHandSize: 0,
    maxStamina: 100,
  },
  records: {
    bestRevenue: 0,
    totalRuns: 0,
    completedSeasons: 0,
  },
}

const mockRun: RunState = {
  currentDay: 12,
  shopId: 'shop_default',
  cash: 15400,
  reputation: 60,
  inventory: ingredientsData as Ingredient[],
  unlockedCombos: ['combo_zuke'],
  history: [
    {
      dayNumber: 11,
      season: '春',
      weather: 'sunny',
      customersServed: 8,
      revenue: 12300,
      reputationDelta: 3,
    },
  ],
  isOver: false,
}

interface GameActions {
  startNewRun: () => void
  selectIngredient: (ingredientId: string) => void
  advanceDay: () => void
  endRun: () => void
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  phase: 'morning_market',
  run: mockRun,
  meta: defaultMeta,

  startNewRun: () => {
    // TODO: 新しいランを初期化してフェーズを morning_market に移行する
    set((state) => ({
      run: mockRun,
      meta: {
        ...state.meta,
        records: {
          ...state.meta.records,
          totalRuns: state.meta.records.totalRuns + 1,
        },
      },
      phase: 'morning_market',
    }))
  },

  selectIngredient: (_id: string) => {
    // TODO: 朝市フェーズで食材を選択し手持ちに加える
  },

  advanceDay: () => {
    // TODO: 営業フェーズを終了して翌日の朝市フェーズへ進む
    // TODO: DayLog を history に追記し cash / reputation を更新する
    set((state) => {
      if (!state.run) return {}
      return {
        run: {
          ...state.run,
          currentDay: state.run.currentDay + 1,
        },
      }
    })
  },

  endRun: () => {
    // TODO: ラン終了処理。MetaState の records を更新し phase を gameover に変える
    set({ phase: 'gameover', run: null })
  },
}))
