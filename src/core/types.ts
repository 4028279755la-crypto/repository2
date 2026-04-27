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
export type CustomerType = 'tourist' | 'regular' | 'wealthy' | 'student'

/** 寿司の流派 */
export type School = 'edomae' | 'sosaku' | 'taishu'

/** ゲームのフェーズ */
export type Phase =
  | 'title'
  | 'morning_market'
  | 'service'
  | 'closing'
  | 'gameover'

/** 天気 */
export type Weather = 'sunny' | 'rainy' | 'festival'

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
  /** 接客した客数 */
  customersServed: number
  /** 売上（円） */
  revenue: number
  /** のれん値の変動 */
  reputationDelta: number
  /** 当日達成したコンボのIDリスト */
  achievedCombos: string[]
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
