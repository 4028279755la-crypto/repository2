import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { ORDER_TIME_MS, INGREDIENT_EMOJI } from '../core/logic'
import type { Customer, Ingredient } from '../core/types'
import customersData from '../data/customers.json'
import ingredientsData from '../data/ingredients.json'

const allCustomers = customersData as unknown as Customer[]
const allIngredients = ingredientsData as unknown as Ingredient[]

export default function OrderTicker() {
  const phase = useGameStore((s) => s.phase)
  const serviceOrders = useGameStore((s) => s.serviceOrders)
  const currentOrderIdx = useGameStore((s) => s.currentOrderIdx)
  const orderStartedAt = useGameStore((s) => s.orderStartedAt)
  const timeoutCurrentOrder = useGameStore((s) => s.timeoutCurrentOrder)

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
        timeoutCurrentOrder()
      }
    }
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [phase, orderStartedAt, timeoutCurrentOrder])

  const currentOrder = serviceOrders[currentOrderIdx]
  const customer = currentOrder
    ? allCustomers.find((c) => c.id === currentOrder.customerId)
    : null

  const progressPct = Math.round((remainingMs / ORDER_TIME_MS) * 100)
  const barColor =
    progressPct > 60 ? 'bg-[#2ecc71]' : progressPct > 30 ? 'bg-[#e67e22]' : 'bg-[#c0392b]'
  const remainingSec = Math.ceil(remainingMs / 1000)

  // 朝市・締め・ゲームオーバー時はプレースホルダー表示
  if (phase === 'morning_market' || !currentOrder) {
    return (
      <footer
        className="shrink-0 px-4 py-3 bg-[#2c1a0e] text-[#f5f0e8]"
        aria-label="オーダーティッカー"
      >
        <div className="flex items-center gap-2 text-sm text-[#8b7355]">
          <span>── 営業前 ──</span>
          {phase === 'morning_market' && (
            <span className="text-xs">食材を選んで営業を開始してください</span>
          )}
        </div>
      </footer>
    )
  }

  const requiredNames = currentOrder.requiredIngredients
    .map((id) => {
      const ing = allIngredients.find((i) => i.id === id)
      return ing ? `${INGREDIENT_EMOJI[ing.type] ?? '🍣'}${ing.name}` : id
    })
    .join(' or ')

  return (
    <footer
      className="shrink-0 px-4 py-3 bg-[#2c1a0e] text-[#f5f0e8]"
      aria-label="オーダーティッカー"
    >
      <div className="flex items-center gap-4 flex-wrap">
        {/* 客名 */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[#c8b89a] text-xs">注文</span>
          <span className="font-bold text-[#f0d060] text-sm">
            {customer?.name ?? currentOrder.customerId}
          </span>
        </div>

        {/* 要求食材 */}
        <div className="flex items-center gap-1 text-xs text-[#c8b89a] min-w-0">
          <span className="shrink-0">必要:</span>
          <span className="text-[#f5f0e8] truncate">{requiredNames}</span>
        </div>

        {/* 報酬 + タイマー */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <span className="text-[#2ecc71] font-bold text-sm">
            ¥{currentOrder.reward.toLocaleString()}
          </span>
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
            <span
              className={`text-xs tabular-nums w-8 text-right ${
                progressPct <= 30 ? 'text-[#c0392b] font-bold' : 'text-[#c8b89a]'
              }`}
            >
              {remainingSec}s
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
