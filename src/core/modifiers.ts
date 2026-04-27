import type {
  ApprenticeId, Combo, MetaState, RunState, SchoolId, ShopId,
} from './types'
import { getShop } from './shops'
import { getSchool } from './schools'
import { getApprentice } from './apprentices'

/**
 * ラン中に適用される修飾子の合算結果。
 * UI/コア計算でこれを参照することで分岐を減らす。
 */
export interface RunModifiers {
  /** 初期所持金加算（メタ＋店舗） */
  startingCashBonus: number
  /** 評判の上限 */
  reputationCap: number
  /** 客数倍率（店舗×流派） */
  customerCountMultiplier: number
  /** 観光客の支払い倍率（店舗） */
  touristPayoutMultiplier: number
  /** 富裕層必須コンボへの追加倍率（店舗） */
  wealthyComboBonus: number
  /** 創作タグコンボへの追加倍率（店舗） */
  fusionComboBonus: number
  /** 流派タグごとの倍率（コンボ報酬計算で参照） */
  schoolTagBonus: Record<string, number>
  /** 全体の客単価倍率（流派） */
  payoutMultiplier: number
  /** 客の忍耐 +N */
  patienceBonus: number
  /** 朝市予算 +N（弟子+メタ） */
  morningBudgetBonus: number
  /** コンボ報酬 +x（弟子） */
  apprenticeComboBonus: number
  /** 月末ボスの効率項目を自動合格（弟子） */
  bossEfficiencyExempt: boolean
  /** 月末ボスの1項目を自動合格（メタバフ） */
  bossOneExempt: boolean
  /** 月初に新規食材1つ追加（弟子） */
  monthlyBonusIngredient: boolean
  /** 伝統客マイナス（店舗） */
  traditionalCustomerPenalty: number
  /** 競合店イベント頻発（店舗） */
  rivalShopFrequent: boolean
}

const DEFAULT_MODIFIERS: RunModifiers = {
  startingCashBonus: 0,
  reputationCap: 100,
  customerCountMultiplier: 1,
  touristPayoutMultiplier: 1,
  wealthyComboBonus: 0,
  fusionComboBonus: 0,
  schoolTagBonus: {},
  payoutMultiplier: 1,
  patienceBonus: 0,
  morningBudgetBonus: 0,
  apprenticeComboBonus: 0,
  bossEfficiencyExempt: false,
  bossOneExempt: false,
  monthlyBonusIngredient: false,
  traditionalCustomerPenalty: 0,
  rivalShopFrequent: false,
}

/** 店舗 + 流派 + 弟子 + 永続バフ から RunModifiers を合成 */
export function buildRunModifiers(
  shopId: ShopId,
  schoolId: SchoolId,
  apprentices: ApprenticeId[],
  meta: MetaState,
): RunModifiers {
  const m = { ...DEFAULT_MODIFIERS }
  const shop = getShop(shopId)
  const school = getSchool(schoolId)

  // 店舗
  m.startingCashBonus += shop.modifiers.startingCashBonus ?? 0
  m.reputationCap = shop.modifiers.reputationCap ?? 100
  m.customerCountMultiplier *= shop.modifiers.customerCountMultiplier ?? 1
  m.touristPayoutMultiplier *= shop.modifiers.touristPayoutMultiplier ?? 1
  m.wealthyComboBonus += shop.modifiers.wealthyComboBonus ?? 0
  m.fusionComboBonus += shop.modifiers.fusionComboBonus ?? 0
  m.patienceBonus += shop.modifiers.patienceBonus ?? 0
  m.traditionalCustomerPenalty += shop.modifiers.traditionalCustomerPenalty ?? 0
  m.rivalShopFrequent ||= shop.modifiers.rivalShopFrequent ?? false

  // 流派
  m.schoolTagBonus = { ...school.modifiers.tagBonus }
  m.payoutMultiplier *= school.modifiers.payoutMultiplier ?? 1
  m.customerCountMultiplier *= school.modifiers.customerCountMultiplier ?? 1

  // 弟子
  for (const id of apprentices) {
    const a = getApprentice(id)
    if (!a) continue
    m.morningBudgetBonus += a.effect.morningBudgetBonus ?? 0
    m.apprenticeComboBonus += a.effect.comboBonus ?? 0
    if (a.effect.bossEfficiencyExempt) m.bossEfficiencyExempt = true
    if (a.effect.monthlyBonusIngredient) m.monthlyBonusIngredient = true
  }

  // 永続バフ（メタ）
  m.startingCashBonus += meta.permanentBuffs.startingCashLevel * 500
  if (meta.permanentBuffs.patienceBonus) m.patienceBonus += 1
  if (meta.permanentBuffs.bossExempt) m.bossOneExempt = true

  return m
}

/** RunState から RunModifiers を再構築（store間で共有） */
export function modifiersOf(run: RunState, meta: MetaState): RunModifiers {
  return buildRunModifiers(run.shopId, run.schoolId, run.apprentices, meta)
}

/**
 * コンボ成立時の追加倍率（モディファイアによる加算）を返す。
 * 既存の comboMultiplier の上に加算する用途。
 */
export function comboBonusMultiplier(combo: Combo, mods: RunModifiers): number {
  let bonus = 0
  // 流派タグ
  for (const tag of combo.requiredTags) {
    bonus += mods.schoolTagBonus[tag] ?? 0
  }
  // 弟子コンボボーナス
  bonus += mods.apprenticeComboBonus
  // 富裕層必須コンボへの追加（銀座）
  if (combo.requiredCustomerType === 'wealthy') bonus += mods.wealthyComboBonus
  // 創作タグへの追加（NYC）
  if (combo.requiredTags.includes('fusion')) bonus += mods.fusionComboBonus
  return bonus
}

/** ラン総決算でも使う「客単価倍率」 */
export function payoutMultiplierFor(_combo: Combo | null, mods: RunModifiers): number {
  return mods.payoutMultiplier
}
