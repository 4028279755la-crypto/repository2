import { useGameStore, listAvailableCombos, getAllCombos } from '../store/gameStore'
import type { Ingredient, Rarity, Combo, Customer } from '../core/types'
import { INGREDIENT_EMOJI, DRAFT_SELECT_MAX } from '../core/logic'
import { validateSlotMatch, MAX_NETAS_PER_SESSION } from '../core/cooking'
import customersData from '../data/customers.json'

const allCustomers = customersData as unknown as Customer[]

const RARITY_STYLES: Record<Rarity, { border: string; bg: string; label: string; labelColor: string }> = {
  common:   { border: 'border-[#8a9a58]', bg: 'bg-[#f0f4e0]', label: 'コモン',    labelColor: 'text-[#8a9a58]' },
  uncommon: { border: 'border-[#2c6090]', bg: 'bg-[#e0eaf4]', label: 'アンコモン', labelColor: 'text-[#2c6090]' },
  rare:     { border: 'border-[#8b4513]', bg: 'bg-[#f4e8d0]', label: 'レア',      labelColor: 'text-[#8b4513]' },
  epic:     { border: 'border-[#6a0dad]', bg: 'bg-[#f0e0f8]', label: 'エピック',   labelColor: 'text-[#6a0dad]' },
}

// ── 朝市モード ──────────────────────────────────────────────────────────────

/** ある食材を含むコンボ候補（その食材のタグで何らかが満たせる） */
function combosUsingIngredient(ing: Ingredient, allCombos: Combo[]): Combo[] {
  return allCombos.filter((c) => c.requiredTags.some((tag) => ing.tags.includes(tag)))
}

function DraftCard({
  ingredient, selected, affordable, hintCombos, onClick,
}: {
  ingredient: Ingredient
  selected: boolean
  affordable: boolean
  hintCombos: Combo[]
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
        'flex flex-col gap-1 p-3 rounded-lg border-2 transition-all duration-150 select-none min-w-[110px]',
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
          {ingredient.tags.slice(0, 3).map((tag) => (
            <span key={tag} className={`text-[8px] px-1 py-0.5 rounded ${selected ? 'bg-white/20 text-[#c8b89a]' : 'bg-[#2c1a0e]/10 text-[#5c3d1e]'}`}>{tag}</span>
          ))}
        </div>
      )}
      {hintCombos.length > 0 && (
        <div
          className={`flex flex-wrap gap-0.5 justify-center mt-1 pt-1 border-t ${selected ? 'border-[#f0d060]/40' : 'border-[#c8b89a]'}`}
          title={hintCombos.map((c) => `${c.name} x${c.multiplier}`).join('\n')}
        >
          {hintCombos.slice(0, 2).map((c) => (
            <span
              key={c.id}
              className={`text-[8px] px-1 py-0.5 rounded ${selected ? 'bg-[#f0d060]/30 text-[#f0d060]' : 'bg-[#f0d060]/40 text-[#5c3d1e]'}`}
            >
              ★{c.name}
            </span>
          ))}
          {hintCombos.length > 2 && (
            <span className={`text-[8px] ${selected ? 'text-[#f0d060]' : 'text-[#5c3d1e]'}`}>+{hintCombos.length - 2}</span>
          )}
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

  // 選択中の食材で組めるコンボのプレビュー
  const selected = draftHand.filter((ing) => draftSelectedIds.includes(ing.id))
  const previewCombos = listAvailableCombos(selected, run.unlockedCombos)
  const allCombos = getAllCombos()

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
          const isSelected = draftSelectedIds.includes(ing.id)
          const affordable = isSelected || (canSelect && ing.basePrice <= remaining)
          const hints = combosUsingIngredient(ing, allCombos)
          return (
            <DraftCard
              key={ing.id}
              ingredient={ing}
              selected={isSelected}
              affordable={affordable}
              hintCombos={hints}
              onClick={() => toggleDraftCard(ing.id)}
            />
          )
        })}
      </div>
      {previewCombos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#5c3d1e]">
          <span className="text-[#8b7355]">この組合せで成立可能：</span>
          {previewCombos.map((c) => (
            <span key={c.id} className="px-2 py-0.5 rounded bg-[#f0d060]/40 border border-[#c8b89a] font-bold">
              {c.name} <span className="text-[#c0392b]">x{c.multiplier}</span>
            </span>
          ))}
        </div>
      )}
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
  ingredient, slotMatched, isPlaced, onClick,
}: {
  ingredient: Ingredient
  slotMatched: boolean
  isPlaced: boolean
  onClick: () => void
}) {
  const style = RARITY_STYLES[ingredient.rarity]
  return (
    <button
      onClick={onClick}
      disabled={isPlaced}
      aria-label={`${ingredient.name}${isPlaced ? '（製作中）' : slotMatched ? '（注文と一致）' : ''}`}
      className={[
        'flex flex-col gap-1 p-3 rounded-lg border-2 transition-all duration-150 select-none min-w-[90px]',
        isPlaced
          ? 'border-[#f0d060] bg-[#2c1a0e] scale-105 shadow-lg cursor-not-allowed opacity-70'
          : slotMatched
          ? 'border-[#2ecc71] bg-[#e8f8ee] cursor-pointer hover:scale-105 shadow-[0_0_8px_#2ecc7160]'
          : `${style.border} ${style.bg} cursor-pointer hover:scale-105`,
      ].join(' ')}
    >
      <div className="flex items-center justify-center text-2xl py-1" aria-hidden="true">{INGREDIENT_EMOJI[ingredient.type] ?? '🍣'}</div>
      <div className={`text-center font-bold text-xs ${isPlaced ? 'text-[#f0d060]' : 'text-[#2c1a0e]'}`}>{ingredient.name}</div>
      {ingredient.tags.length > 0 && (
        <div className="flex flex-wrap gap-0.5 justify-center">
          {ingredient.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className={`text-[8px] px-1 py-0.5 rounded ${isPlaced ? 'bg-white/20 text-[#c8b89a]' : 'bg-[#2c1a0e]/10 text-[#5c3d1e]'}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {isPlaced && <div className="text-center text-[9px] text-[#f0d060]">製作中</div>}
      {slotMatched && !isPlaced && <div className="text-center text-[9px] text-[#2ecc71] font-bold">← 一致</div>}
    </button>
  )
}

function WipStatus({ hasRice, netaNames }: { hasRice: boolean; netaNames: string[] }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ede5d0] rounded-lg border border-[#c8b89a] text-xs">
      <span className="text-[#8b7355]">製作中：</span>
      <span className={`font-bold ${hasRice ? 'text-[#2c1a0e]' : 'text-[#c8b89a]'}`}>シャリ {hasRice ? '✓' : '○'}</span>
      <span className="text-[#c8b89a]">+</span>
      {netaNames.length === 0 ? (
        <span className="font-bold text-[#c8b89a]">ネタ ○</span>
      ) : (
        netaNames.map((name, i) => (
          <span key={i} className="font-bold text-[#2c6090]">{name}</span>
        ))
      )}
      <span className="text-[#8b7355]">({netaNames.length}/{MAX_NETAS_PER_SESSION})</span>
    </div>
  )
}

function ServicePanel() {
  const {
    run, serviceOrders, currentOrderIdx, currentSlotIdx,
    cookingSession, placeRice, placeNetaAction, popNetaAction, serveSushi, cancelCooking,
  } = useGameStore()

  if (!run) return null
  const order = serviceOrders[currentOrderIdx]
  const slot = order?.slots[currentSlotIdx]
  const inventory = run.inventory

  const hasRice = cookingSession !== null
  const placedIds = cookingSession?.netaIds ?? []
  const placedNetas = placedIds
    .map((id) => inventory.find((i) => i.id === id))
    .filter((i): i is Ingredient => i !== undefined)
  const slotMatched = slot ? placedNetas.some((n) => validateSlotMatch(slot, n.tags)) : false
  const canServe = hasRice && placedNetas.length > 0 && slotMatched
  const canAddMore = hasRice && placedIds.length < MAX_NETAS_PER_SESSION

  // スロットに合う食材があるか
  const hasAnyMatch = slot ? inventory.some((ing) => validateSlotMatch(slot, ing.tags)) : false

  // 客のタイプから現在組めるコンボ候補
  const customer = order ? allCustomers.find((c) => c.id === order.customerId) : null
  const availableCombos = listAvailableCombos(inventory, run.unlockedCombos, customer?.type)

  // 現在のWIPで成立中のコンボがあるか
  const allCombos = getAllCombos()
  const wipCombo =
    customer && placedNetas.length > 0
      ? allCombos.find(
          (c) =>
            (c.unlockedByDefault || run.unlockedCombos.includes(c.id)) &&
            (!c.requiredCustomerType || c.requiredCustomerType === customer.type) &&
            c.requiredTags.length === placedNetas.length &&
            c.requiredTags.every((t) => placedNetas.some((n) => n.tags.includes(t))),
        )
      : null

  return (
    <section className="shrink-0 px-4 py-3 bg-[#f5f0e8] border-b border-[#c8b89a]" aria-label="握りシーケンスパネル">
      {/* ステータス行 */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h2 className="text-sm font-bold text-[#5c3d1e] tracking-wider shrink-0">── 営業中 ──</h2>

        <WipStatus hasRice={hasRice} netaNames={placedNetas.map((n) => n.name)} />

        {wipCombo && (
          <span className="px-2 py-0.5 rounded bg-[#f0d060] border-2 border-[#c0392b] text-[#2c1a0e] text-xs font-bold animate-pulse">
            ★ {wipCombo.name} 成立！ x{wipCombo.multiplier}
          </span>
        )}

        <div className="flex gap-2 ml-auto">
          {!hasRice && (
            <button
              onClick={placeRice}
              className="px-4 py-1.5 bg-[#f5f5f0] border-2 border-[#c8b89a] text-[#5c3d1e] font-bold rounded-lg hover:bg-[#ede5d0] transition-colors text-sm"
            >
              🍚 シャリ
            </button>
          )}

          {hasRice && placedIds.length > 0 && (
            <button
              onClick={popNetaAction}
              className="px-3 py-1.5 bg-[#e8e0d0] border border-[#c8b89a] text-[#8b7355] rounded-lg hover:bg-[#d8d0c0] transition-colors text-xs"
            >
              ← 1個戻す
            </button>
          )}

          {canServe && (
            <button
              onClick={serveSushi}
              className="px-4 py-1.5 bg-[#2ecc71] text-white font-bold rounded-lg hover:bg-[#27ae60] transition-colors text-sm shadow-[0_0_10px_#2ecc7180] animate-pulse"
            >
              提供 ▶
            </button>
          )}

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
            const isPlaced = placedIds.includes(ing.id)
            return (
              <NetaCard
                key={ing.id}
                ingredient={ing}
                slotMatched={matchesSlot && canAddMore}
                isPlaced={isPlaced}
                onClick={() => placeNetaAction(ing.id)}
              />
            )
          })}
        </div>
      )}

      {/* 現在の客に出せるコンボ候補 */}
      {customer && availableCombos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#5c3d1e]">
          <span className="text-[#8b7355]">この客に出せるコンボ：</span>
          {availableCombos.map((c) => (
            <span
              key={c.id}
              title={c.description}
              className="px-2 py-0.5 rounded bg-[#f0d060]/40 border border-[#c8b89a] font-bold"
            >
              ★ {c.name} <span className="text-[#c0392b]">x{c.multiplier}</span>
            </span>
          ))}
        </div>
      )}

      {/* 合う食材なし警告 */}
      {slot && !hasAnyMatch && inventory.length > 0 && (
        <p className="text-xs text-[#c0392b] mt-1">⚠ このオーダーに合う食材がありません。時間切れを待ちます…</p>
      )}

      {/* シャリを先に指示 */}
      {!hasRice && (
        <p className="text-xs text-[#8b7355] mt-1">シャリを準備してからネタを選んでください（最大{MAX_NETAS_PER_SESSION}貫でコンボ成立）</p>
      )}

      {/* スロット未一致の警告 */}
      {hasRice && placedIds.length > 0 && !slotMatched && (
        <p className="text-xs text-[#e67e22] mt-1">⚠ このスロットに合うネタを最低1つ含めてください</p>
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
