import type { MetaState, ShopId, SchoolId, ApprenticeId, PermanentBuffs } from '../core/types'

const STORAGE_KEY = 'sushi-draft-meta'
const SCHEMA_VERSION = 1

/** デフォルトのメタ状態 */
export function defaultMetaState(): MetaState {
  return {
    version: SCHEMA_VERSION,
    norenValue: 0,
    unlockedShops: ['yatai'] as ShopId[],
    unlockedIngredients: [
      'ing_maguro', 'ing_salmon', 'ing_tamago', 'ing_ika', 'ing_ebi', 'ing_nori', 'ing_kyuri',
    ],
    unlockedCombos: [],
    unlockedSchools: ['edomae'] as SchoolId[],
    unlockedApprentices: [] as ApprenticeId[],
    hiredApprentices: [] as ApprenticeId[],
    permanentBuffs: defaultPermanentBuffs(),
    records: {
      bestRevenue: 0,
      totalRuns: 0,
      completedSeasons: 0,
      bestReputation: 0,
      discoveredCombos: [],
    },
    tutorialSeen: false,
  }
}

function defaultPermanentBuffs(): PermanentBuffs {
  return {
    startingCashLevel: 0,
    largerHand: false,
    startingRepLevel: 0,
    patienceBonus: false,
    bossExempt: false,
  }
}

/** LocalStorage から MetaState を読み込む。失敗したらデフォルトを返す。 */
export function loadMeta(): MetaState {
  if (typeof localStorage === 'undefined') return defaultMetaState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultMetaState()
    const parsed = JSON.parse(raw) as MetaState
    return migrate(parsed)
  } catch (err) {
    console.warn('[persistence] failed to load meta:', err)
    return defaultMetaState()
  }
}

/** LocalStorage へ MetaState を書き込む */
export function saveMeta(meta: MetaState): void {
  if (typeof localStorage === 'undefined') return
  try {
    const payload: MetaState = { ...meta, version: SCHEMA_VERSION }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (err) {
    console.warn('[persistence] failed to save meta:', err)
  }
}

/** メタを完全リセット（デバッグ用） */
export function clearMeta(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * 古いスキーマからの単純なマイグレーション。
 * 不足フィールドはデフォルトで補う。
 */
function migrate(raw: Partial<MetaState> & { version?: number }): MetaState {
  const def = defaultMetaState()
  const buffs = { ...def.permanentBuffs, ...(raw.permanentBuffs ?? {}) } as PermanentBuffs
  const records = { ...def.records, ...(raw.records ?? {}) }
  return {
    version: SCHEMA_VERSION,
    norenValue: raw.norenValue ?? 0,
    unlockedShops: (raw.unlockedShops as ShopId[]) ?? def.unlockedShops,
    unlockedIngredients: raw.unlockedIngredients ?? def.unlockedIngredients,
    unlockedCombos: raw.unlockedCombos ?? def.unlockedCombos,
    unlockedSchools: (raw.unlockedSchools as SchoolId[]) ?? def.unlockedSchools,
    unlockedApprentices: (raw.unlockedApprentices as ApprenticeId[]) ?? def.unlockedApprentices,
    hiredApprentices: (raw.hiredApprentices as ApprenticeId[]) ?? def.hiredApprentices,
    permanentBuffs: buffs,
    records,
    tutorialSeen: raw.tutorialSeen ?? false,
  }
}
