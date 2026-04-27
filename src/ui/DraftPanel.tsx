import { useGameStore } from '../store/gameStore'
import type { Ingredient, Rarity } from '../core/types'
import { INGREDIENT_EMOJI, DRAFT_SELECT_MAX } from '../core/logic'
import { validateSlotMatch } from '../core/cooking'

const RARITY_STYLES: Record<Rarity, { border: string; bg: string; label: string; labelColor: string }> = {
  common:   { border: 'border-[#8a9a58]', bg: 'bg-[#f0f4e0]', label: 'コモン',    labelColor: 'text-[#8a9a58]' },
  uncommon: { border: 'border-[#2c6090]', bg: 'bg-[#e0eaf4]', label: 'アンコモン', labelColor: 'text-[#2c6090]' },
  rare:     { border: 'border-[#8b4513]', bg: 'bg-[#f4e8d0]', label: 'レア',      labelColor: 'text-[#8b4513]' },
  epic:     { border: 'border-[#6a0dad]', bg: 'bg-[#f0e0f8]', label: 'エピック',   labelColor: 'text-[#6a0dad]' },
}

// ── 朝市モード ──────────────────────────────────────────────────────────────

function DraftCard({
  ingredient, selected, affordable, onClick,
}: {
  ingredient: Ingredient; selected: boolean; affordable: boolean; onClick: () => void
}) {
  const style = RARITY_STYLES[ingredient.rarity]
  const disabled = !selected && !affordable
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${ingredient.name}を${selected ? '選択解除' : '選択'}`}
      className={[
        'flex flex-col gap-1 p-3 rounded-lg border-2 transition-all duration-150 select-none min-w-[100px]',
        style.border,
        selected ? 'bg-[#2c1a0e] scale-105 shadow-lg' : style.bg,
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold ${selected ? 'text-[#c8b89a]' : style.labelColor}`}>{style.label}</span>
        <span className={`text-[10px] ${selected ? 'text-[#f0d060]' : 'text-[#8b7355]'}`}>¥{ingredient.basePrice.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-center text-3xl py-1" aria-hidden="true">{INGREDIENT_EMOJI[ingredient.type] ?? '🍣'}</div>
      <div className={`text-center font-bold text-sm ${selected ? 'text-[#f0d060]' : 'text-[#2c1a0e]'}`}>{ingredient.name}</div>
      {ingredient.tags.length > 0 && (
        <div className="flex flex-wrap gap-0.5 justify-center">
          {ingredient.tags.slice(0, 2).map((tag) => (
            <span key={tag} className={`text-[8px] px-1 py-0.5 rounded ${selected ? 'bg-white/20 text-[#c8b89a]' : 'bg-[#2c1a0e]/10 text-[#5c3d1e]'}`}>{tag}</span>
          ))}
        </div>
      )}
      {selected && <div className="text-center text-[10px] text-[#2ecc71] font-bold">✓ 選択中</div>}
    </button>
  )
}

function MorningMarketPanel() {
  const { run, draftHand, draftSelectedIds, toggleDraftCard, confirmDraft } = useGameStore()
  if (!run) return null

  const usedBudget = draftHand.filter((ing) => draftSelectedIds.includes(ing.id)).reduce((sum, ing) => sum + ing.basePrice, 0)
  const remaining = run.cash - usedBudget
  const canSelect = draftSelectedIds.length < DRAFT_SELECT_MAX
  const readyToStart = draftSelectedIds.length === DRAFT_SELECT_MAX

  return (
    <section className="shrink-0 px-4 py-3 bg-[#f5f0e8] border-b border-[#c8b89a]" aria-label="朝市ドラフトパネル">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-[#5c3d1e] tracking-wider">── 朝市 ── 食材を {DRAFT_SELECT_MAX} 枚選んでください</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8b7355]">残予算：<span className={remaining < 0 ? 'text-[#c0392b]' : 'text-[#2c1a0e]'}>¥{remaining.toLocaleString()}</span></span>
          <span className="text-xs text-[#8b7355]">{draftSelectedIds.length} / {DRAFT_SELECT_MAX} 枚</span>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {draftHand.map((ing) => {
          const selected = draftSelectedIds.includes(ing.id)
          const affordable = selected || (canSelect && ing.basePrice <= remaining)
          return <DraftCard key={ing.id} ingredient={ing} selected={selected} affordable={affordable} onClick={() => toggleDraftCard(ing.id)} />
        })}
      </div>
      {readyToStart && (
        <div className="flex justify-center mt-3">
          <button onClick={confirmDraft} className="px-8 py-2 bg-[#c0392b] text-white font-bold rounded-lg hover:bg-[#a93226] transition-colors text-sm tracking-wider shadow-md">
            営業開始 →
          </button>
        </div>
      )}
    </section>
  )
}

// ── 営業モード（握りシーケンス） ──────────────────────────────────────────────

function NetaCard({
  ingredient, canServe, isNeta, onClick,
}: {
  ingredient: Ingredient; canServe: boolean; isNeta: boolean; onClick: () => void
}) {
  const style = RARITY_STYLES[ingredient.rarity]
  return (
    <button
      onClick={onClick}
      disabled={!canServe && !isNeta}
      aria-label={`${ingredient.name}${isNeta ? '（選択中）' : canServe ? '（一致）' : '（不一致）'}`}
      className={[
        'flex flex-col gap-1 p-3 rounded-lg border-2 transition-all duration-150 select-none min-w-[90px]',
        isNeta
          ? 'border-[#f0d060] bg-[#2c1a0e] scale-105 shadow-lg cursor-pointer'
          : canServe
          ? 'border-[#2ecc71] bg-[#e8f8ee] cursor-pointer hover:scale-105 shadow-[0_0_8px_#2ecc7160]'
          : `${style.border} ${style.bg} opacity-40 cursor-not-allowed`,
      ].join(' ')}
    >
      <div className="flex items-center justify-center text-2xl py-1" aria-hidden="true">{INGREDIENT_EMOJI[ingredient.type] ?? '🍣'}</div>
      <div className={`text-center font-bold text-xs ${isNeta ? 'text-[#f0d060]' : 'text-[#2c1a0e]'}`}>{ingredient.name}</div>
      {isNeta && <div className="text-center text-[9px] text-[#f0d060]">ネタ選択中</div>}
      {canServe && !isNeta && <div className="text-center text-[9px] text-[#2ecc71] font-bold">← 選択</div>}
    </button>
  )
}

function WipStatus({ hasRice, netaName }: { hasRice: boolean; netaName: string | null }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ede5d0] rounded-lg border border-[#c8b89a] text-xs">
      <span className="text-[#8b7355]">製作中：</span>
      <span className={`font-bold ${hasRice ? 'text-[#2c1a0e]' : 'text-[#c8b89a]'}`}>シャリ {hasRice ? '✓' : '○'}</span>
      <span className="text-[#c8b89a]">+</span>
      <span className={`font-bold ${netaName ? 'text-[#2c6090]' : 'text-[#c8b89a]'}`}>ネタ {netaName ?? '○'}</span>
    </div>
  )
}

function ServicePanel() {
  const {
    run, serviceOrders, currentOrderIdx, currentSlotIdx,
    cookingSession, placeRice, placeNetaAction, serveSushi, cancelCooking,
  } = useGameStore()

  if (!run) return null
  const order = serviceOrders[currentOrderIdx]
  const slot = order?.slots[currentSlotIdx]
  const inventory = run.inventory

  const hasRice = cookingSession !== null
  const netaId = cookingSession?.netaId ?? null
  const netaIngredient = netaId ? inventory.find((i) => i.id === netaId) : null
  const canServe = hasRice && netaId !== null

  // スロットに合う食材があるか
  const hasAnyMatch = slot ? inventory.some((ing) => validateSlotMatch(slot, ing.tags)) : false

  return (
    <section className="shrink-0 px-4 py-3 bg-[#f5f0e8] border-b border-[#c8b89a]" aria-label="握りシーケンスパネル">
      {/* ステータス行 */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h2 className="text-sm font-bold text-[#5c3d1e] tracking-wider shrink-0">── 営業中 ──</h2>

        <WipStatus hasRice={hasRice} netaName={netaIngredient?.name ?? null} />

        <div className="flex gap-2 ml-auto">
          {/* シャリボタン */}
          {!hasRice && (
            <button
              onClick={placeRice}
              className="px-4 py-1.5 bg-[#f5f5f0] border-2 border-[#c8b89a] text-[#5c3d1e] font-bold rounded-lg hover:bg-[#ede5d0] transition-colors text-sm"
            >
              🍚 シャリ
            </button>
          )}

          {/* 提供ボタン */}
          {canServe && (
            <button
              onClick={serveSushi}
              className="px-4 py-1.5 bg-[#2ecc71] text-white font-bold rounded-lg hover:bg-[#27ae60] transition-colors text-sm shadow-[0_0_10px_#2ecc7180] animate-pulse"
            >
              提供 ▶
            </button>
          )}

          {/* やり直しボタン */}
          {hasRice && (
            <button
              onClick={cancelCooking}
              className="px-3 py-1.5 bg-[#e8e0d0] border border-[#c8b89a] text-[#8b7355] rounded-lg hover:bg-[#d8d0c0] transition-colors text-xs"
            >
              やり直し
            </button>
          )}
        </div>
      </div>

      {/* 手持ちネタカード */}
      {inventory.length === 0 ? (
        <p className="text-sm text-[#8b7355] py-2">手持ちの食材がありません</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {inventory.map((ing) => {
            const matchesSlot = slot ? validateSlotMatch(slot, ing.tags) : false
            // シャリ置き済みかつネタ未設定の場合のみクリック可
            const clickable = hasRice && netaId === null
            return (
              <NetaCard
                key={ing.id}
                ingredient={ing}
                canServe={clickable && matchesSlot}
                isNeta={netaId === ing.id}
                onClick={() => placeNetaAction(ing.id)}
              />
            )
          })}
        </div>
      )}

      {/* 合う食材なし警告 */}
      {slot && !hasAnyMatch && inventory.length > 0 && (
        <p className="text-xs text-[#c0392b] mt-1">⚠ このオーダーに合う食材がありません。時間切れを待ちます…</p>
      )}

      {/* シャリを先に指示 */}
      {!hasRice && (
        <p className="text-xs text-[#8b7355] mt-1">シャリを準備してからネタを選んでください</p>
      )}
    </section>
  )
}

// ── エクスポート ────────────────────────────────────────────────────────────

export default function DraftPanel() {
  const phase = useGameStore((s) => s.phase)
  if (phase === 'service') return <ServicePanel />
  return <MorningMarketPanel />
}
