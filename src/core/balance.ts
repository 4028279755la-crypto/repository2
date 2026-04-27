/**
 * 全ゲームバランス定数の中央集権ファイル。
 *
 * 数値の調整はここを書き換えるだけで全体に伝播するように、
 * 各 core/ ファイルは BALANCE から再エクスポートする形にしている。
 *
 * 既存挙動を保つため、Phase 7 着手時点での values はリファクタ前と同値。
 * Section 2-5 の明示的なバランス調整のみ反映している。
 */

export const BALANCE = {
  // ── 朝市 / ドラフト ─────────────────────────────────────────────
  STARTING_CASH: 3_000,
  STARTING_REPUTATION: 50,
  /** 朝市で並ぶカードの枚数（手札サイズ） */
  DRAFT_HAND_SIZE: 6,
  /** 1回の朝市で取得できる最大食材数 */
  DRAFT_SELECT_MAX: 4,
  /** Day×100 で増える朝市予算（基底 + 上限） */
  DRAFT_BUDGET_BASE: 2_000,
  DRAFT_BUDGET_PER_DAY: 100,
  DRAFT_BUDGET_CAP: 5_000,

  // ── 営業 / クッキング ─────────────────────────────────────────
  /** オーダー1件の制限時間（ms） */
  BASE_TIME_PER_ORDER_MS: 30_000,
  /** 客の忍耐ハート数（基準値） */
  PATIENCE_HEARTS: 3,
  /** チップ加算の閾値（残時間比率） */
  TIP_THRESHOLD_HIGH: 0.6,
  TIP_THRESHOLD_MID: 0.3,
  TIP_RATE_HIGH: 0.5,
  TIP_RATE_MID: 0.2,
  /** 順序ミス時の残時間ペナルティ（ms） */
  MISTAKE_TIME_PENALTY_MS: 3_000,
  /** 1セッションで握れる最大ネタ数 */
  MAX_NETAS_PER_SUSHI: 3,
  /** 強制終了時に客1人あたりに発生する評判ペナルティ */
  FORCE_CLOSE_REPUTATION_PER_CUSTOMER: 1,

  // ── 評判 ──────────────────────────────────────────────────────
  REPUTATION_MIN: 0,
  REPUTATION_MAX: 100,
  REPUTATION_TIMEOUT: -1, // タイムアウト時の評判変動（現状は walkout 判定のみ）
  REPUTATION_ANGRY: -2,   // 怒り退店時の評判ペナルティ

  // ── 評判ティア閾値（高い順） ──────────────────────────────────
  TIER_T5: 80,
  TIER_T4: 60,
  TIER_T3: 40,
  TIER_T2: 20,

  // ── 日数 ──────────────────────────────────────────────────────
  MAX_DAY: 30,
  SEGMENT_LENGTH: 5,

  // ── ボス審査 ───────────────────────────────────────────────────
  /** 平均販売価格（円/スロット） */
  BOSS_MIN_AVG_PRICE: 800,
  /** コンボ種類数 */
  BOSS_MIN_COMBO_TYPES: 4,
  /** スロット成功率 */
  BOSS_MIN_SUCCESS_RATE: 0.7,
  /** もてなし率（退店なし客比率） */
  BOSS_MIN_HOSPITALITY_RATE: 0.8,
  /** 合格に必要な星数 */
  BOSS_PASS_STARS: 2,

  // ── コンボ ─────────────────────────────────────────────────────
  /** preferredCustomerType と一致した時の倍率上乗せ */
  COMBO_PREFERRED_BONUS: 0.5,

  // ── イベント ─────────────────────────────────────────────────
  /** 朝市前のイベント発生確率（35% → 25% に下げて落ち着かせる） */
  EVENT_TRIGGER_PROBABILITY: 0.25,
  /** 食中毒の噂が発生する評判上限（50 → 30 に厳格化） */
  EVENT_FOOD_POISON_REP_CEILING: 30,

  // ── ドラフト出現重み（Phase 7 §3） ───────────────────────────
  RARITY_WEIGHTS: {
    common: 0.50,
    uncommon: 0.30,
    rare: 0.15,
    epic: 0.05,
  },
  /** Day20 以降の rare/epic 補正 */
  RARITY_LATE_GAME_DAY: 20,
  RARITY_LATE_RARE_BOOST: 0.05,
  RARITY_LATE_EPIC_BOOST: 0.03,

  // ── 詰み警告 / 緊急補助金（Phase 7 §5） ─────────────────────
  /** Day10 時点で売上累計がこの金額を下回ると警告 */
  DAY10_REVENUE_THRESHOLD: 30_000,
  WARNING_CHECK_DAY: 10,
  /** 警告発令翌日に支給される緊急補助金 */
  EMERGENCY_SUBSIDY: 1_000,

  // ── のれん値スコア（参考値） ───────────────────────────────────
  NORENWAGE_BASE_MULTIPLIER: 2,
  NORENWAGE_COMBO_BONUS: 5,
} as const

export type BalanceKey = keyof typeof BALANCE
