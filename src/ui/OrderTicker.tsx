import { useMemo } from 'react'
import type { Order } from '../core/types'
import customersData from '../data/customers.json'

const MOCK_ORDER: Order = {
  id: 'order_001',
  customerId: 'cus_wealthy',
  requiredIngredients: ['ing_uni', 'ing_hirame'],
  timeLimit: 60000,
  reward: 4800,
  remainingMs: 38500,
}

export default function OrderTicker() {
  const order = MOCK_ORDER

  const customer = useMemo(
    () => customersData.find((c) => c.id === order.customerId),
    [order.customerId],
  )

  const progressPct = Math.round((order.remainingMs / order.timeLimit) * 100)

  const barColor =
    progressPct > 60
      ? 'bg-[#2ecc71]'
      : progressPct > 30
      ? 'bg-[#e67e22]'
      : 'bg-[#c0392b]'

  const remainingSec = Math.ceil(order.remainingMs / 1000)

  return (
    <footer
      className="shrink-0 px-4 py-3 bg-[#2c1a0e] text-[#f5f0e8]"
      aria-label="オーダーティッカー"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[#c8b89a] text-xs">注文</span>
          <span className="font-bold text-[#f0d060] text-sm">
            {customer?.name ?? order.customerId}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#c8b89a]">
          <span>必要:</span>
          <span className="text-[#f5f0e8]">
            {order.requiredIngredients.join(' + ')}
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[#2ecc71] font-bold text-sm">
            ¥{order.reward.toLocaleString()}
          </span>
          <div className="flex items-center gap-2 w-32">
            <div className="flex-1 h-2 bg-[#5c3d1e] rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-300`}
                style={{ width: `${progressPct}%` }}
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <span className="text-xs text-[#c8b89a] tabular-nums w-8 text-right">
              {remainingSec}s
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
