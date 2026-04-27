import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { ORDER_TIME_MS, INGREDIENT_EMOJI } from '../core/logic'
import { MAX_PATIENCE } from '../core/cooking'
import type { Customer, Ingredient, OrderSlot } from '../core/types'
import customersData from '../data/customers.json'
import ingredientsData from '../data/ingredients.json'

const allCustomers = customersData as unknown as Customer[]
const allIngredients = ingredientsData as unknown as Ingredient[]

// ── サブコンポーネント ────────────────────────────────────────────────────────

function PatienceHearts({ current, max = MAX_PATIENCE }: { current: number; max?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`忍耐 ${current}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`text-sm ${i < current ? 'text-[#c0392b]' : 'text-[#5c3d1e]'}`} aria-hidden="true">
          {i < current ? '❤' : '🖤'}
        </span>
      ))}
    </div>
  )
}

function SlotBadge({
  slot, isCurrent, slotIdx,
}: {
  slot: OrderSlot; isCurrent: boolean; slotIdx: number
}) {
  const tagLabel = slot.requiredTags[0] ?? '?'
  // 代表食材を探す（タグ一致の最初の1件）
  const repIng = allIngredients.find((ing) => slot.requiredTags.some((t) => ing.tags.includes(t)))
  const emoji = repIng ? (INGREDIENT_EMOJI[repIng.type] ?? '🍣') : '🍣'

  const filled = slot.filledBy !== null
  const filledIng = filled ? allIngredients.find((i) => i.id === slot.filledBy) : null
  const filledEmoji = filledIng ? (INGREDIENT_EMOJI[filledIng.type] ?? '🍣') : null

  return (
    <div
      aria-label={`スロット${slotIdx + 1}: ${filled ? '提供済み' : isCurrent ? '注文中' : '待機'}`}
      className={[
        'flex flex-col items-center justify-center w-10 h-10 rounded border-2 text-xs transition-all',
        filled
          ? 'border-[#2ecc71] bg-[#e8f8ee] text-[#2ecc71]'
          : isCurrent
          ? 'border-[#f0d060] bg-[#2c1a0e] text-[#f0d060] animate-pulse'
          : 'border-[#5c3d1e] bg-[#3a2510] text-[#8b7355]',
      ].join(' ')}
    >
      <span aria-hidden="true">{filled ? (filledEmoji ?? '✓') : emoji}</span>
      {!filled && <span className="text-[8px]">{tagLabel.slice(0, 4)}</span>}
    </div>
  )
}

// ── メインコンポーネント ────────────────────────────────────────────────────

export default function OrderTicker() {
  const phase = useGameStore((s) => s.phase)
  const serviceOrders = useGameStore((s) => s.serviceOrders)
  const currentOrderIdx = useGameStore((s) => s.currentOrderIdx)
  const currentSlotIdx = useGameStore((s) => s.currentSlotIdx)
  const orderStartedAt = useGameStore((s) => s.orderStartedAt)
  const timeoutCurrentSlot = useGameStore((s) => s.timeoutCurrentSlot)

  const [remainingMs, setRemainingMs] = useState(ORDER_TIME_MS)
  const timedOut = useRef(false)

  useEffect(() => {
    if (phase !== 'service') {
      setRemainingMs(ORDER_TIME_MS)
      return
    }
    timedOut.current = false

    const tick = () => {
      const r = ORDER_TIME_MS - (Date.now() - orderStartedAt)
      const clamped = Math.max(0, r)
      setRemainingMs(clamped)
      if (r <= 0 && !timedOut.current) {
        timedOut.current = true
        timeoutCurrentSlot()
      }
    }
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [phase, orderStartedAt, timeoutCurrentSlot])

  const currentOrder = serviceOrders[currentOrderIdx]
  const customer = currentOrder
    ? allCustomers.find((c) => c.id === currentOrder.customerId)
    : null

  const progressPct = Math.round((remainingMs / ORDER_TIME_MS) * 100)
  const barColor =
    progressPct > 60 ? 'bg-[#2ecc71]' : progressPct > 30 ? 'bg-[#e67e22]' : 'bg-[#c0392b]'
  const remainingSec = Math.ceil(remainingMs / 1000)

  if (phase === 'morning_market' || !currentOrder) {
    return (
      <footer className="shrink-0 px-4 py-3 bg-[#2c1a0e] text-[#f5f0e8]" aria-label="オーダーティッカー">
        <div className="flex items-center gap-2 text-sm text-[#8b7355]">
          <span>── 営業前 ──</span>
          {phase === 'morning_market' && <span className="text-xs">食材を選んで営業を開始してください</span>}
        </div>
      </footer>
    )
  }

  const slotReward = currentOrder.slots[currentSlotIdx]?.baseReward ?? 0

  return (
    <footer className="shrink-0 px-4 py-3 bg-[#2c1a0e] text-[#f5f0e8]" aria-label="オーダーティッカー">
      <div className="flex items-center gap-3 flex-wrap">
        {/* 客名 + 忍耐ゲージ */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[#c8b89a] text-xs">注文</span>
            <span className="font-bold text-[#f0d060] text-sm">{customer?.name ?? currentOrder.customerId}</span>
          </div>
          <PatienceHearts current={currentOrder.patience} />
        </div>

        {/* スロット表示 */}
        <div className="flex gap-1.5 items-center">
          {currentOrder.slots.map((slot, i) => (
            <SlotBadge key={i} slot={slot} isCurrent={i === currentSlotIdx} slotIdx={i} />
          ))}
        </div>

        {/* オーダーカウンター */}
        <div className="text-xs text-[#8b7355]">
          {currentOrderIdx + 1}/{serviceOrders.length}客
        </div>

        {/* 報酬 + タイマー */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <span className="text-[#2ecc71] font-bold text-sm">¥{slotReward.toLocaleString()}</span>
          <div className="flex items-center gap-2 w-36">
            <div className="flex-1 h-2 bg-[#5c3d1e] rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-200`}
                style={{ width: `${progressPct}%` }}
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <span className={`text-xs tabular-nums w-8 text-right ${progressPct <= 30 ? 'text-[#c0392b] font-bold' : 'text-[#c8b89a]'}`}>
              {remainingSec}s
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
