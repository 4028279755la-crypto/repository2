import type { BuffUnlock, IngredientUnlock } from './types'

/** のれん値で開放できる食材カタログ（既存ingredients.jsonのIDを参照） */
export const INGREDIENT_UNLOCKS: IngredientUnlock[] = [
  { id: 'ing_anago', name: 'アナゴ', cost: 60, description: 'ふっくら煮上げた江戸前の真髄。' },
  { id: 'ing_ikura', name: '北海道いくら', cost: 100, description: '宝石のような輝きの高級ロー。' },
  { id: 'ing_uni', name: 'ウニ特上', cost: 120, description: '極上のうに軍艦の主役。' },
  { id: 'ing_hirame', name: '鮃の昆布締め', cost: 150, description: '上品な味わいの白身。' },
  { id: 'ing_avocado', name: 'アボカド', cost: 80, description: '創作流派には欠かせないfusionタグ素材。' },
]

/** のれん値で開放できる永続バフ */
export const BUFF_UNLOCKS: BuffUnlock[] = [
  {
    id: 'startingCashLevel',
    name: '初期所持金 +¥500',
    description: 'ラン開始時の所持金が段階的に増える（最大3段階で +¥1500）。',
    costs: [40, 80, 160],
    maxLevel: 3,
  },
  {
    id: 'largerHand',
    name: '朝市の手札 +1',
    description: '朝市で表示される候補が1枚増える。',
    costs: [100],
    maxLevel: 1,
  },
  {
    id: 'startingRepLevel',
    name: '開始評判 +5',
    description: 'ラン開始時の評判が段階的に上がる（最大3段階で +15）。',
    costs: [60, 120, 240],
    maxLevel: 3,
  },
  {
    id: 'patienceBonus',
    name: '客の忍耐 +1',
    description: '全ての客の最大忍耐が常に+1される。',
    costs: [150],
    maxLevel: 1,
  },
  {
    id: 'bossExempt',
    name: '月末ボス：1項目自動合格',
    description: '覆面調査員の評価項目を1つ自動的に通過する（最も低い項目に適用）。',
    costs: [300],
    maxLevel: 1,
  },
]

/** バフの現在レベルから次のコストを返す */
export function nextBuffCost(buff: BuffUnlock, currentLevel: number): number | null {
  if (currentLevel >= buff.maxLevel) return null
  return buff.costs[currentLevel] ?? null
}

/** コンボIDごとのアンロック価格（unlockedByDefault: false のものに対応） */
export const COMBO_UNLOCK_COSTS: Record<string, number> = {
  combo_kobujime: 80,
  combo_california: 120,
  combo_uni_gunkan: 200,
  combo_otoro: 280,
  combo_dragon_roll: 180,
}

