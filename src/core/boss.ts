import type { RunState, BossResult, BossMetrics, Combo } from './types'

/** 各審査項目の閾値（クリア = 星1個） */
export const BOSS_THRESHOLDS = {
  /** 平均販売価格（円/スロット） */
  quality: 800,
  /** コンボ種類数 */
  diversity: 4,
  /** スロット成功率 */
  efficiency: 0.7,
  /** もてなし率（退店なし客比率） */
  hospitality: 0.8,
}

/** 合格に必要な星数 */
export const BOSS_PASS_STARS = 2

/** ラン全体の指標を集計 */
export function computeBossMetrics(run: RunState): BossMetrics {
  let revenue = 0
  let slotsServed = 0
  let slotsTotal = 0
  let customersTotal = 0
  let walkedOut = 0

  for (const log of run.history) {
    revenue += log.revenue
    slotsServed += log.slotsServed
    slotsTotal += log.slotsTotal
    customersTotal += log.customersTotal
    walkedOut += log.walkedOut
  }

  const avgSalePrice = slotsServed > 0 ? revenue / slotsServed : 0
  const successRate = slotsTotal > 0 ? slotsServed / slotsTotal : 0
  const hospitalityRate = customersTotal > 0 ? 1 - walkedOut / customersTotal : 0

  // 達成コンボ種類数
  const uniqueCombos = new Set(run.comboHistory.map((e) => e.comboId))
  const comboDiversity = uniqueCombos.size

  return { avgSalePrice, comboDiversity, successRate, hospitalityRate }
}

/** ラン中で最も多用されたコンボから「ビルドの個性」を判定 */
export function detectSignatureBuild(
  run: RunState,
  allCombos: Combo[],
): BossResult['signatureBuild'] {
  if (run.comboHistory.length === 0) return 'none'

  // 最頻コンボID
  const counts: Record<string, number> = {}
  for (const e of run.comboHistory) counts[e.comboId] = (counts[e.comboId] ?? 0) + 1
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const topId = sorted[0][0]
  const top = allCombos.find((c) => c.id === topId)
  if (!top) return 'none'

  if (top.requiredTags.includes('marinated') || top.requiredTags.includes('red_fish')) return 'maguro'
  if (top.requiredTags.includes('luxury') || top.requiredTags.includes('premium')) return 'premium'
  if (top.requiredTags.includes('fusion')) return 'fusion'
  if (top.requiredTags.includes('traditional') || top.requiredTags.includes('edomae')) return 'traditional'
  return 'none'
}

/** 評価コメントを生成 */
function buildComments(
  metrics: BossMetrics,
  stars: { quality: boolean; diversity: boolean; efficiency: boolean; hospitality: boolean },
  signature: BossResult['signatureBuild'],
  passed: boolean,
): string[] {
  const comments: string[] = []

  // ビルド固有のセリフ
  switch (signature) {
    case 'maguro':
      comments.push('「マグロの目利き、見事。江戸前の良さが出ている。」')
      break
    case 'premium':
      comments.push('「高級素材を惜しまぬ姿勢、潔し。」')
      break
    case 'fusion':
      comments.push('「攻めた一皿、若手の意気を感じる。」')
      break
    case 'traditional':
      comments.push('「古き良き仕事を守っている。安定感がある。」')
      break
    default:
      comments.push('「個性的なビルドに行き着いていない印象だ。」')
  }

  // 各項目への寸評
  if (stars.quality) comments.push(`平均価格 ¥${Math.round(metrics.avgSalePrice).toLocaleString()}。値段相応の仕事だ。`)
  else comments.push(`平均価格 ¥${Math.round(metrics.avgSalePrice).toLocaleString()}。もう一段、付加価値が欲しい。`)

  if (stars.diversity) comments.push(`${metrics.comboDiversity}種のコンボを成立させた。引き出しの多さは強みだ。`)
  else comments.push(`コンボ${metrics.comboDiversity}種では、メニューの幅が狭く感じる。`)

  if (stars.efficiency) comments.push(`成功率 ${Math.round(metrics.successRate * 100)}%。捌きは確かだ。`)
  else comments.push(`成功率 ${Math.round(metrics.successRate * 100)}%。注文を取りこぼし過ぎている。`)

  if (stars.hospitality) comments.push(`客の${Math.round(metrics.hospitalityRate * 100)}%を満足させた。礼儀正しい仕事だ。`)
  else comments.push(`帰した客が多い。${Math.round(metrics.hospitalityRate * 100)}%では、もてなしの心が足りぬ。`)

  // 総評
  if (passed) comments.push('「合格としよう。また腕を磨いてくれ。」')
  else comments.push('「修練を要する。また来ます。」')

  return comments
}

/** ランを評価して BossResult を返す */
export function evaluateRun(run: RunState, allCombos: Combo[]): BossResult {
  const metrics = computeBossMetrics(run)

  const qualityStar = metrics.avgSalePrice >= BOSS_THRESHOLDS.quality
  const diversityStar = metrics.comboDiversity >= BOSS_THRESHOLDS.diversity
  const efficiencyStar = metrics.successRate >= BOSS_THRESHOLDS.efficiency
  const hospitalityStar = metrics.hospitalityRate >= BOSS_THRESHOLDS.hospitality

  const totalStars =
    Number(qualityStar) + Number(diversityStar) + Number(efficiencyStar) + Number(hospitalityStar)
  const passed = totalStars >= BOSS_PASS_STARS

  const signatureBuild = detectSignatureBuild(run, allCombos)
  const comments = buildComments(
    metrics,
    { quality: qualityStar, diversity: diversityStar, efficiency: efficiencyStar, hospitality: hospitalityStar },
    signatureBuild,
    passed,
  )

  return {
    metrics,
    qualityStar, diversityStar, efficiencyStar, hospitalityStar,
    totalStars, passed, comments, signatureBuild,
  }
}
