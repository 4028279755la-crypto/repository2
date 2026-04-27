import { useGameStore } from '../store/gameStore'
import type { Ingredient, Rarity } from '../core/types'
import { INGREDIENT_EMOJI, DRAFT_SELECT_MAX, canFulfillOrder } from '../core/logic'

const RARITY_STYLES: Record<Rarity, { border: string; bg: string; label: string; labelColor: string }> = {
  common:   { border: 'border-[#8a9a58]', bg: 'bg-[#f0f4e0]', label: 'コモン',    labelColor: 'text-[#8a9a58]' },
  uncommon: { border: 'border-[#2c6090]', bg: 'bg-[#e0eaf4]', label: 'アンコモン', labelColor: 'text-[#2c6090]' },
  rare:     { border: 'border-[#8b4513]', bg: 'bg-[#f4e8d0]', label: 'レア',      labelColor: 'text-[#8b4513]' },
  epic:     { border: 'border-[#6a0dad]', bg: 'bg-[#f0e0f8]', label: 'エピック',   labelColor: 'text-[#6a0dad]' },
}

// ── 朝市モード ──────────────────────────────────────────────────────────────

function DraftCard({
  ingredient,
  selected,
  affordable,
  onClick,
}: {
  ingredient: Ingredient
  selected: boolean
  affordable: boolean
  onClick: () => void
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
        selected ? 'bg-[#2c1a0e] text-[#f5f0e8] scale-105 shadow-lg' : style.bg,
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold ${selected ? 'text-[#c8b89a]' : style.labelColor}`}>
          {style.label}
        </span>
        <span className={`text-[10px] ${selected ? 'text-[#f0d060]' : 'text-[#8b7355]'}`}>
          ¥{ingredient.basePrice.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center justify-center text-3xl py-1" aria-hidden="true">
        {INGREDIENT_EMOJI[ingredient.type] ?? '🍣'}
      </div>

      <div className={`text-center font-bold text-sm ${selected ? 'text-[#f0d060]' : 'text-[#2c1a0e]'}`}>
        {ingredient.name}
      </div>

      {ingredient.tags.length > 0 && (
        <div className="flex flex-wrap gap-0.5 justify-center">
          {ingredient.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className={`text-[8px] px-1 py-0.5 rounded ${
                selected ? 'bg-white/20 text-[#c8b89a]' : 'bg-[#2c1a0e]/10 text-[#5c3d1e]'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {selected && (
        <div className="text-center text-[10px] text-[#2ecc71] font-bold">✓ 選択中</div>
      )}
    </button>
  )
}

function MorningMarketPanel() {
  const { run, draftHand, draftSelectedIds, toggleDraftCard, confirmDraft } = useGameStore()

  if (!run) return null

  const usedBudget = draftHand
    .filter((ing) => draftSelectedIds.includes(ing.id))
    .reduce((sum, ing) => sum + ing.basePrice, 0)
  const remaining = run.cash - usedBudget
  const canSelect = draftSelectedIds.length < DRAFT_SELECT_MAX
  const readyToStart = draftSelectedIds.length === DRAFT_SELECT_MAX

  return (
    <section
      className="shrink-0 px-4 py-3 bg-[#f5f0e8] border-b border-[#c8b89a]"
      aria-label="朝市ドラフトパネル"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-[#5c3d1e] tracking-wider">
          ── 朝市 ── 食材を {DRAFT_SELECT_MAX} 枚選んでください
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8b7355]">
            残予算：<span className={remaining < 0 ? 'text-[#c0392b]' : 'text-[#2c1a0e]'}>
              ¥{remaining.toLocaleString()}
            </span>
          </span>
          <span className="text-xs text-[#8b7355]">
            {draftSelectedIds.length} / {DRAFT_SELECT_MAX} 枚
          </span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {draftHand.map((ing) => {
          const selected = draftSelectedIds.includes(ing.id)
          const affordable = selected || (canSelect && ing.basePrice <= remaining)
          return (
            <DraftCard
              key={ing.id}
              ingredient={ing}
              selected={selected}
              affordable={affordable}
              onClick={() => toggleDraftCard(ing.id)}
            />
          )
        })}
      </div>

      {readyToStart && (
        <div className="flex justify-center mt-3">
          <button
            onClick={confirmDraft}
            className="px-8 py-2 bg-[#c0392b] text-white font-bold rounded-lg hover:bg-[#a93226] transition-colors text-sm tracking-wider shadow-md"
          >
            営業開始 →
          </button>
        </div>
      )}
    </section>
  )
}

// ── 営業モード ──────────────────────────────────────────────────────────────

function ServiceCard({
  ingredient,
  canServe,
  onClick,
}: {
  ingredient: Ingredient
  canServe: boolean
  onClick: () => void
}) {
  const style = RARITY_STYLES[ingredient.rarity]

  return (
    <button
      onClick={onClick}
      disabled={!canServe}
      aria-label={`${ingredient.name}を提供${canServe ? '（オーダーに一致）' : '（一致しない）'}`}
      className={[
        'flex flex-col gap-1 p-3 rounded-lg border-2 transition-all duration-150 select-none min-w-[100px]',
        canServe
          ? 'border-[#2ecc71] bg-[#e8f8ee] cursor-pointer hover:scale-105 shadow-[0_0_8px_#2ecc7160] animate-pulse'
          : `${style.border} ${style.bg} opacity-50 cursor-not-allowed`,
      ].join(' ')}
    >
      <div className="flex items-center justify-center text-3xl py-1" aria-hidden="true">
        {INGREDIENT_EMOJI[ingredient.type] ?? '🍣'}
      </div>
      <div className="text-center font-bold text-sm text-[#2c1a0e]">{ingredient.name}</div>
      {canServe && (
        <div className="text-center text-[10px] text-[#2ecc71] font-bold">提供 ▶</div>
      )}
    </button>
  )
}

function ServicePanel() {
  const { run, serviceOrders, currentOrderIdx, serveCurrentOrder } = useGameStore()

  if (!run) return null
  const currentOrder = serviceOrders[currentOrderIdx]
  const inventory = run.inventory

  return (
    <section
      className="shrink-0 px-4 py-3 bg-[#f5f0e8] border-b border-[#c8b89a]"
      aria-label="手持ち食材パネル"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-[#5c3d1e] tracking-wider">
          ── 手持ち食材 ── オーダーに合う食材を提供してください
        </h2>
        {currentOrder && (
          <span className="text-xs text-[#8b7355]">
            オーダー {currentOrderIdx + 1} / {serviceOrders.length}
          </span>
        )}
      </div>

      {inventory.length === 0 ? (
        <p className="text-sm text-[#8b7355] py-2">手持ちの食材がありません</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {inventory.map((ing) => {
            const canServe = currentOrder
              ? currentOrder.requiredIngredients.includes(ing.id)
              : false
            return (
              <ServiceCard
                key={ing.id}
                ingredient={ing}
                canServe={canServe}
                onClick={() => serveCurrentOrder(ing.id)}
              />
            )
          })}
        </div>
      )}

      {currentOrder && !canFulfillOrder(currentOrder, inventory) && inventory.length > 0 && (
        <p className="text-xs text-[#c0392b] mt-1">
          ⚠ このオーダーに合う食材がありません。時間切れを待ちます…
        </p>
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
