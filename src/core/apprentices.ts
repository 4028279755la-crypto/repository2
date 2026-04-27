import type { ApprenticeDef, ApprenticeId } from './types'

export const APPRENTICE_SLOT_MAX = 3

export const ALL_APPRENTICES: ApprenticeDef[] = [
  {
    id: 'taro',
    name: '太郎',
    description: '朝市の予算 +¥500。仕入れの幅が広がる。',
    unlockNoren: 100,
    effect: { morningBudgetBonus: 500 },
  },
  {
    id: 'hanako',
    name: '花子',
    description: '客の忍耐回復が早い。ピンチを救う気立ての良さ。',
    unlockNoren: 150,
    effect: { patienceTickFaster: true },
  },
  {
    id: 'kenichi',
    name: '健一',
    description: 'コンボ達成時の報酬 +10%。コンボビルドの相棒。',
    unlockNoren: 200,
    effect: { comboBonus: 0.1 },
  },
  {
    id: 'miki',
    name: 'ミキ',
    description: '月初に新規食材1つランダム入手。掘り出し物専門。',
    unlockNoren: 250,
    effect: { monthlyBonusIngredient: true },
  },
  {
    id: 'daigoro',
    name: '大五郎',
    description: '月末ボスの「効率」項目を自動合格。回転の鬼。',
    unlockNoren: 400,
    effect: { bossEfficiencyExempt: true },
  },
]

export function getApprentice(id: ApprenticeId): ApprenticeDef | undefined {
  return ALL_APPRENTICES.find((a) => a.id === id)
}
