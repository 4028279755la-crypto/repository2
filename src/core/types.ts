/** 食材のレアリティ */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic'

/** 食材の種類 */
export type IngredientType =
  | 'maguro'
  | 'salmon'
  | 'hirame'
  | 'tamago'
  | 'uni'
  | 'ika'
  | 'anago'
  | 'ebi'
  | 'ikura'
  | 'nori'
  | 'kyuri'
  | 'avocado'

/** 客の種類 */
export type CustomerType = 'tourist' | 'regular' | 'wealthy' | 'student' | 'blogger'

/** 寿司の流派 */
export type School = 'edomae' | 'sosaku' | 'taishu'

/** ゲームのフェーズ */
export type Phase =
  | 'title'
  | 'news'
  | 'morning_market'
  | 'service'
  | 'closing'
  | 'critic_review'
  | 'result'
  | 'gameover'

/** 天気 */
export type Weather = 'sunny' | 'rainy' | 'festival'

/** 評判ティア（1=屋台 〜 5=老舗） */
export type ReputationTier = 1 | 2 | 3 | 4 | 5

/** 食材カード */
export interface Ingredient {
  /** 一意ID */
  id: string
  /** 食材の種類 */
  type: IngredientType
  /** 表示名（日本語） */
  name: string
  /** レアリティ */
  rarity: Rarity
  /** 仕入れ値 */
  basePrice: number
  /** 売値 */
  sellValue: number
  /** 特殊効果リスト */
  effects: string[]
  /** コンボ判定用タグ */
  tags: string[]
}

/** コンボ定義 */
export interface Combo {
  /** 一意ID */
  id: string
  /** コンボ名 */
  name: string
  /** 成立に必要なタグ群（すべて満たす必要あり） */
  requiredTags: string[]
  /** 売上倍率 */
  multiplier: number
  /** コンボの説明文 */
  description: string
  /** 好みの客タイプ（合致時 +50%） */
  preferredCustomerType?: CustomerType
  /** 必須の客タイプ（不一致なら出せない） */
  requiredCustomerType?: CustomerType
  /** 初期解放されているか */
  unlockedByDefault: boolean
}

/** 1貫分のオーダースロット */
export interface OrderSlot {
  /** 必要なタグ（いずれかひとつ一致する食材で提供可） */
  requiredTags: string[]
  /** この貫の基本報酬（円） */
  baseReward: number
  /** この貫を満たした食材ID（null＝未提供） */
  filledBy: string | null
}

/** 客データ */
export interface Customer {
  /** 一意ID */
  id: string
  /** 客の種類 */
  type: CustomerType
  /** 表示名 */
  name: string
  /** 忍耐値（待てる最大ミリ秒） */
  patience: number
  /** 予算（円） */
  budget: number
  /** 好みのタグリスト */
  preferences: string[]
  /** 注文スロット定義（1〜3貫） */
  orderSlots: { requiredTags: string[]; baseReward: number }[]
}

/** 注文（複数貫対応） */
export interface Order {
  /** 一意ID */
  id: string
  /** 注文した客のID */
  customerId: string
  /** 各貫のスロット（1〜3） */
  slots: OrderSlot[]
  /** 1スロットあたりの時間制限（ミリ秒） */
  timeLimit: number
  /** 現在の忍耐ゲージ（0〜MAX_PATIENCE） */
  patience: number
}

/** 1日の記録 */
export interface DayLog {
  /** 日数 */
  dayNumber: number
  /** 季節 */
  season: string
  /** 天気 */
  weather: Weather
  /** 接客した客数（提供成功客数） */
  customersServed: number
  /** その日の客数合計 */
  customersTotal: number
  /** 提供成功スロット数 */
  slotsServed: number
  /** スロット総数 */
  slotsTotal: number
  /** 怒り退店した客数 */
  walkedOut: number
  /** 売上（円） */
  revenue: number
  /** のれん値の変動 */
  reputationDelta: number
  /** 当日達成したコンボのIDリスト */
  achievedCombos: string[]
  /** 当日に発動したイベントID（null＝普段通り） */
  eventId: string | null
}

/** ランをまたいで保持されるコンボ達成記録 */
export interface ComboHistoryEntry {
  comboId: string
  dayNumber: number
}

/** 1ランの状態 */
export interface RunState {
  /** 現在の日数 */
  currentDay: number
  /** 店のID */
  shopId: string
  /** 手持ち資金（円） */
  cash: number
  /** 評判値（0〜100） */
  reputation: number
  /** 手持ち食材リスト */
  inventory: Ingredient[]
  /** 解放済みコンボのIDリスト */
  unlockedCombos: string[]
  /** これまでの日誌リスト */
  history: DayLog[]
  /** これまでのコンボ達成履歴 */
  comboHistory: ComboHistoryEntry[]
  /** ゲームオーバーフラグ */
  isOver: boolean
}

/** メタ進行（ランをまたいで保持されるデータ） */
export interface MetaState {
  /** のれん値（ランクイン評価指標） */
  norenValue: number
  /** 解放済みの店IDリスト */
  unlockedShops: string[]
  /** 解放済みの食材IDリスト */
  unlockedIngredients: string[]
  /** 解放済みのコンボIDリスト */
  unlockedCombos: string[]
  /** 雇用済みの弟子IDリスト */
  hiredApprentices: string[]
  /** 永続バフ */
  permanentBuffs: {
    /** 初期資金ボーナス（円） */
    startingCash: number
    /** 初期手札枚数ボーナス */
    startingHandSize: number
    /** 最大スタミナ */
    maxStamina: number
  }
  /** 記録 */
  records: {
    /** 最高売上（円） */
    bestRevenue: number
    /** 総ラン数 */
    totalRuns: number
    /** 完了したシーズン数 */
    completedSeasons: number
  }
}

/** ゲーム全体の状態 */
export interface GameState {
  /** 現在のフェーズ */
  phase: Phase
  /** 進行中のラン（null＝未開始） */
  run: RunState | null
  /** メタ進行データ */
  meta: MetaState
}

// ─── Phase 4: シーズン構造 ─────────────────────────────────────────────────

/** 1日の難易度パラメータ */
export interface DayDifficulty {
  dayNumber: number
  /** 1〜6（5日刻みのセグメント） */
  segment: 1 | 2 | 3 | 4 | 5 | 6
  /** その日の客数（最小・最大は同じか範囲） */
  customerCountMin: number
  customerCountMax: number
  /** 客の最大忍耐ハート修正（基準値からの差分） */
  patienceModifier: number
  /** 富裕層の出現確率ボーナス（0〜1） */
  wealthyChanceBonus: number
  /** 各客の追加スロット数（0または1） */
  slotCountBonus: number
  /** 1スロットあたりの時間倍率（1.0=通常、0.85=15%短縮） */
  timeLimitMultiplier: number
  /** その日に到達してほしい評判の目安（コメント表示用） */
  reputationTarget: number
  /** 表示用ラベル */
  label: string
}

// ─── Phase 4: イベント ────────────────────────────────────────────────────

/** 日替わりイベントID */
export type EventId =
  | 'rain'
  | 'festival'
  | 'price_surge'
  | 'good_catch'
  | 'food_poison_rumor'
  | 'tour_bus'
  | 'rival_shop'
  | 'gourmet_blog'
  | 'edomae_festival'

/** イベントが当日のパラメータに与える影響 */
export interface EventEffect {
  /** 客数倍率（既存日次客数に乗算） */
  customerCountMultiplier?: number
  /** 客数加算（倍率の後に加算） */
  customerCountBonus?: number
  /** 食材価格倍率（朝市） */
  ingredientPriceMultiplier?: number
  /** レア食材出現倍率 */
  rareIngredientMultiplier?: number
  /** 客の忍耐ハート加算 */
  patienceBonus?: number
  /** 即時の評判変動 */
  reputationDelta?: number
  /** 観光客の比率を強制（0〜1） */
  touristRatio?: number
  /** 富裕層の比率を強制（0〜1） */
  wealthyRatio?: number
  /** 1人だけ評判x2の客が混じる */
  bloggerVisit?: boolean
  /** 江戸前タグのコンボ報酬倍率（既存乗算に上乗せ） */
  edomaeBonus?: number
  /** 評判要求倍率 */
  reputationRequirementMultiplier?: number
}

export interface DailyEvent {
  id: EventId
  name: string
  description: string
  effect: EventEffect
  /** 解放条件（メタ進行） */
  requiresMeta?: 'apprentice'
  /** 評判が指定値以下のときのみ発動 */
  reputationCeiling?: number
  /** 評判が指定値以上のときのみ発動 */
  reputationFloor?: number
}

// ─── Phase 4: 月末ボス ────────────────────────────────────────────────────

export interface BossMetrics {
  /** 平均販売価格（円/スロット） */
  avgSalePrice: number
  /** シーズン中の達成コンボ種類数 */
  comboDiversity: number
  /** スロット成功率（0〜1） */
  successRate: number
  /** 客満足率（退店なしの客数比率、0〜1） */
  hospitalityRate: number
}

export interface BossResult {
  metrics: BossMetrics
  qualityStar: boolean
  diversityStar: boolean
  efficiencyStar: boolean
  hospitalityStar: boolean
  totalStars: number
  passed: boolean
  comments: string[]
  /** ラン中で最も多く出されたコンボのカテゴリ（コメント分岐用） */
  signatureBuild: 'maguro' | 'premium' | 'fusion' | 'traditional' | 'none'
}

// ─── Phase 4: シーズンサマリー ────────────────────────────────────────────

export interface RunResult {
  totalRevenue: number
  bestDayRevenue: number
  bestDay: number
  totalCombos: number
  uniqueCombos: number
  finalReputation: number
  finalCash: number
  norenGained: number
  passed: boolean
  bossResult: BossResult
}
