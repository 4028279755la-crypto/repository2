import type { DailyEvent, RunState } from './types'

/** 朝市前にイベントが発動する確率 */
export const EVENT_TRIGGER_PROBABILITY = 0.35

export const ALL_EVENTS: DailyEvent[] = [
  {
    id: 'rain',
    name: '雨の日',
    description: '雨が強い。来店客は減るが、常連は変わらず通ってくる。',
    effect: { customerCountMultiplier: 0.7 },
  },
  {
    id: 'festival',
    name: '近所で祭り',
    description: '神社の祭りで観光客と冷やかし客が大挙到来。捌き切れるか？',
    effect: {
      customerCountMultiplier: 1.4,
      touristRatio: 0.6,
    },
  },
  {
    id: 'price_surge',
    name: '仕入れ高騰',
    description: '築地で仕入れ値が跳ね上がっている。今日の朝市は1.5倍。',
    effect: { ingredientPriceMultiplier: 1.5 },
  },
  {
    id: 'good_catch',
    name: '豊漁',
    description: '今朝は豊漁。レアな食材が安く手に入りやすい。',
    effect: {
      ingredientPriceMultiplier: 0.8,
      rareIngredientMultiplier: 2.0,
    },
  },
  {
    id: 'food_poison_rumor',
    name: '食中毒の噂',
    description: '近隣の店で食中毒の噂が広がっている。客足が遠のき評判も下がる。',
    effect: {
      customerCountMultiplier: 0.5,
      reputationDelta: -3,
    },
    reputationCeiling: 50,
  },
  {
    id: 'tour_bus',
    name: '観光バス到着',
    description: '観光バスから5人の観光客が一気に降りてきた！',
    effect: {
      customerCountBonus: 5,
      touristRatio: 0.7,
    },
  },
  {
    id: 'rival_shop',
    name: '競合店オープン',
    description: '駅前に新店オープン。今後3日間、客数-20%。',
    effect: { customerCountMultiplier: 0.8 },
  },
  {
    id: 'gourmet_blog',
    name: 'グルメブロガー来店',
    description: '今日の客に1人、ブロガーが混じる。出来不出来で評判が大きく動く。',
    effect: { bloggerVisit: true },
  },
  {
    id: 'edomae_festival',
    name: '江戸前祭り',
    description: '今日は江戸前タグのコンボに +50% のボーナス。',
    effect: { edomaeBonus: 0.5 },
  },
]

/** 朝市前のランダムイベント抽選。発生しない日は null。 */
export function rollDailyEvent(run: RunState): DailyEvent | null {
  if (Math.random() >= EVENT_TRIGGER_PROBABILITY) return null

  const candidates = ALL_EVENTS.filter((e) => {
    if (e.reputationCeiling !== undefined && run.reputation > e.reputationCeiling) return false
    if (e.reputationFloor !== undefined && run.reputation < e.reputationFloor) return false
    // requiresMeta は今は未使用（メタアンロック未実装のため弾く）
    if (e.requiresMeta) return false
    return true
  })

  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/** 指定IDのイベントを取得 */
export function getEvent(id: string): DailyEvent | undefined {
  return ALL_EVENTS.find((e) => e.id === id)
}
