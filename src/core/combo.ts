import type { Combo, Ingredient, CustomerType } from './types'

/** 客タイプとの相性で +50% するボーナス倍率 */
export const COMBO_PREFERRED_BONUS = 0.5

/**
 * 与えられた食材集合から、コンボのrequiredTagsをすべて満たせるかを判定。
 * 各タグに対して未使用の食材を1つずつ割り当てる必要がある。
 */
export function canMakeCombo(combo: Combo, ingredients: Ingredient[]): boolean {
  return assignIngredientsToTags(combo.requiredTags, ingredients) !== null
}

/**
 * バックトラッキングで「タグ→食材」の重複なしマッピングを探す。
 * 見つかれば割り当てられた食材ID配列を返す。なければ null。
 */
function assignIngredientsToTags(
  tags: string[],
  ingredients: Ingredient[],
): string[] | null {
  if (tags.length === 0) return []
  const [head, ...rest] = tags
  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i]
    if (!ing.tags.includes(head)) continue
    const remaining = ingredients.filter((_, j) => j !== i)
    const sub = assignIngredientsToTags(rest, remaining)
    if (sub !== null) return [ing.id, ...sub]
  }
  return null
}

/**
 * 与えられた食材で組めるコンボを抽出。
 * - unlockedCombos が指定されていれば: unlockedByDefault または unlockedCombos に含まれるもののみ。
 * - customerType が指定されていれば requiredCustomerType の制約をフィルタ。
 *   preferredCustomerType は除外しない（合致時の表示判断は呼び出し側）。
 */
export function detectAvailableCombos(
  inventory: Ingredient[],
  allCombos: Combo[],
  unlockedCombos: string[],
  customerType?: CustomerType,
): Combo[] {
  return allCombos.filter((combo) => {
    if (!combo.unlockedByDefault && !unlockedCombos.includes(combo.id)) return false
    if (combo.requiredCustomerType && customerType && combo.requiredCustomerType !== customerType) {
      return false
    }
    return canMakeCombo(combo, inventory)
  })
}

/**
 * 「食材集合がコンボを成立させているか」を判定。
 * このコンボのために選ばれた食材一式がそのまま要件を満たすか確認する。
 */
export function ingredientsMatchCombo(combo: Combo, ingredients: Ingredient[]): boolean {
  if (ingredients.length !== combo.requiredTags.length) return false
  const assigned = assignIngredientsToTags(combo.requiredTags, ingredients)
  return assigned !== null
}

/**
 * 与えられたネタ集合に対して「成立しているコンボ」のうち最高倍率を返す。
 * 解放済みかつ requiredCustomerType を満たすもののみ対象。
 */
export function findBestCombo(
  netas: Ingredient[],
  allCombos: Combo[],
  unlockedCombos: string[],
  customerType: CustomerType,
): Combo | null {
  const candidates = allCombos
    .filter((combo) => combo.unlockedByDefault || unlockedCombos.includes(combo.id))
    .filter((combo) => !combo.requiredCustomerType || combo.requiredCustomerType === customerType)
    .filter((combo) => ingredientsMatchCombo(combo, netas))

  if (candidates.length === 0) return null
  return candidates.reduce((best, c) => (c.multiplier > best.multiplier ? c : best))
}

/**
 * コンボに必要な食材を在庫から除外した新しい配列を返す。
 * 同タグの食材が複数ある場合は重複なしで割り当て、同じインスタンスは1つだけ消費。
 */
export function consumeIngredientsForCombo(
  inventory: Ingredient[],
  combo: Combo,
): Ingredient[] {
  const assigned = assignIngredientsToTags(combo.requiredTags, inventory)
  if (assigned === null) return inventory
  // assigned に含まれるIDを順に1つずつ消費する
  const result = [...inventory]
  for (const id of assigned) {
    const idx = result.findIndex((i) => i.id === id)
    if (idx !== -1) result.splice(idx, 1)
  }
  return result
}

/**
 * コンボ成立時の最終報酬倍率を計算。
 * preferredCustomerType と一致すれば +COMBO_PREFERRED_BONUS。
 */
export function comboMultiplier(combo: Combo, customerType: CustomerType): number {
  let m = combo.multiplier
  if (combo.preferredCustomerType === customerType) m += COMBO_PREFERRED_BONUS
  return m
}
