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
  | 'shop_select'
  | 'school_select'
  | 'unlock_menu'
  | 'apprentice_menu'
  | 'record_menu'
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
  /** セリフ（演出用） */
  dialogue?: {
    onArrive: string[]
    onServe: string[]
    onLeave: string[]
  }
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
  /** 強制終了で未接客になった客数 */
  skippedCustomers?: number
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
  shopId: ShopId
  /** 流派ID（このランで選択） */
  schoolId: SchoolId
  /** 雇用中の弟子（このラン開始時のスナップショット） */
  apprentices: ApprenticeId[]
  /** 手持ち資金（円） */
  cash: number
  /** 評判値（0〜100） */
  reputation: number
  /** 評判の上限（店舗修飾子で制限される場合あり） */
  reputationCap: number
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

/** 店舗ID */
export type ShopId = 'yatai' | 'rojiura' | 'ekimae' | 'ginza' | 'overseas'

/** 流派ID */
export type SchoolId = 'edomae' | 'sosaku' | 'taishu'

/** 弟子ID */
export type ApprenticeId = 'taro' | 'hanako' | 'kenichi' | 'miki' | 'daigoro'

/** 永続バフのスタックレベル */
export interface PermanentBuffs {
  /** 初期資金ボーナス（最大3段階：+500/+1000/+1500） */
  startingCashLevel: number
  /** 朝市の手札+1（0/1） */
  largerHand: boolean
  /** 開始評判+5（最大3段階） */
  startingRepLevel: number
  /** 客の忍耐+1（0/1） */
  patienceBonus: boolean
  /** 月末ボスの評価項目1つ自動合格（0/1） */
  bossExempt: boolean
}

/** メタ進行（ランをまたいで保持されるデータ） */
export interface MetaState {
  /** スキーマバージョン（マイグレーション用） */
  version: number
  /** のれん値（ランクイン評価指標） */
  norenValue: number
  /** 解放済みの店IDリスト */
  unlockedShops: ShopId[]
  /** 解放済みの食材IDリスト */
  unlockedIngredients: string[]
  /** 解放済みのコンボIDリスト */
  unlockedCombos: string[]
  /** 解放済みの流派IDリスト */
  unlockedSchools: SchoolId[]
  /** 解放済みの弟子IDリスト（購入済みでまだ装着していなくても入る） */
  unlockedApprentices: ApprenticeId[]
  /** 雇用中の弟子IDリスト（最大3） */
  hiredApprentices: ApprenticeId[]
  /** 永続バフ */
  permanentBuffs: PermanentBuffs
  /** 記録 */
  records: {
    /** 最高売上（円） */
    bestRevenue: number
    /** 総ラン数 */
    totalRuns: number
    /** 完了したシーズン数（合格） */
    completedSeasons: number
    /** 最高評判 */
    bestReputation: number
    /** 達成したコンボIDの累積セット */
    discoveredCombos: string[]
  }
  /** チュートリアルを表示済みか */
  tutorialSeen: boolean
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
  | 'emergency_subsidy'

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
  /** 即時の現金加算（緊急補助金など） */
  cashBonus?: number
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

// ─── Phase 5: メタ進行 ───────────────────────────────────────────────────

/** 店舗定義 */
export interface ShopDef {
  id: ShopId
  name: string
  description: string
  /** 解放に必要なのれん値（0=初期解放） */
  unlockNoren: number
  /** 難易度の星 */
  difficultyStars: 1 | 2 | 3 | 4 | 5
  /** 修飾子 */
  modifiers: ShopModifiers
}

export interface ShopModifiers {
  /** 初期所持金加算 */
  startingCashBonus?: number
  /** 評判の上限 */
  reputationCap?: number
  /** 客数倍率 */
  customerCountMultiplier?: number
  /** 観光客の支払い倍率 */
  touristPayoutMultiplier?: number
  /** 富裕層必須コンボの倍率追加 */
  wealthyComboBonus?: number
  /** 創作タグコンボの倍率追加 */
  fusionComboBonus?: number
  /** 伝統客の有無減少（0で無効化、未指定で通常） */
  traditionalCustomerPenalty?: number
  /** 客の忍耐加算 */
  patienceBonus?: number
  /** 競合店イベントが頻発 */
  rivalShopFrequent?: boolean
}

/** 流派定義 */
export interface SchoolDef {
  id: SchoolId
  name: string
  description: string
  unlockNoren: number
  modifiers: SchoolModifiers
}

export interface SchoolModifiers {
  /** タグごとの報酬倍率（コンボ成立時に該当タグ含むなら適用） */
  tagBonus: Record<string, number>
  /** 客単価倍率（全体） */
  payoutMultiplier?: number
  /** 客数倍率 */
  customerCountMultiplier?: number
}

/** 弟子定義 */
export interface ApprenticeDef {
  id: ApprenticeId
  name: string
  description: string
  unlockNoren: number
  /** 装着時の効果 */
  effect: ApprenticeEffect
}

export interface ApprenticeEffect {
  /** 朝市の予算ボーナス */
  morningBudgetBonus?: number
  /** 忍耐回復が早い（実装は注釈、本番では細やかな効果調整に） */
  patienceTickFaster?: boolean
  /** コンボ報酬倍率追加 */
  comboBonus?: number
  /** 月初に新規食材1個ランダム入手 */
  monthlyBonusIngredient?: boolean
  /** 月末ボスの効率項目を自動合格 */
  bossEfficiencyExempt?: boolean
}

/** アンロック可能な食材エントリ（カタログ） */
export interface IngredientUnlock {
  id: string
  name: string
  cost: number
  description: string
}

/** 永続バフのアンロックエントリ */
export interface BuffUnlock {
  id: keyof PermanentBuffs
  name: string
  description: string
  /** レベル制バフの場合、各段階のコスト（startingCashLevel/startingRepLevelで使用） */
  costs: number[]
  maxLevel: number
}

/** 永続的に集計するスナップショット（記録画面用） */
export interface MetaRecords {
  totalRuns: number
  successfulRuns: number
  bestRevenue: number
  bestReputation: number
  longestSeason: number
  discoveredCombos: string[]
}
