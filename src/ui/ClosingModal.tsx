import { useGameStore, getAllCombos } from '../store/gameStore'

export default function ClosingModal() {
  const { run, closingSummary, confirmClosing } = useGameStore()

  if (!closingSummary || !run) return null

  const { revenue, reputationDelta, servedSlots, totalSlots, walkedOut, achievedCombos, skippedCustomers, forceClosed } = closingSummary
  const repSign = reputationDelta >= 0 ? '+' : ''
  const combos = getAllCombos()
  const comboCounts = achievedCombos.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label="締め集計"
    >
      <div className="bg-[#f5f0e8] rounded-2xl shadow-2xl p-8 w-96 flex flex-col gap-5 border-2 border-[#8b4513]">
        {/* タイトル */}
        <div className="text-center">
          <div className="text-2xl mb-1">🏮</div>
          <h2 className="text-lg font-bold text-[#2c1a0e] tracking-widest">本日の締め</h2>
          <p className="text-xs text-[#8b7355]">{run.currentDay} 日目 終了</p>
        </div>

        {/* 集計 */}
        <div className="flex flex-col gap-3 bg-[#ede5d0] rounded-lg p-4">
          <Row
            label="提供スロット"
            value={`${servedSlots} / ${totalSlots} 皿`}
            highlight={servedSlots === totalSlots}
          />
          {walkedOut > 0 && (
            <Row label="途中退席" value={`${walkedOut} 客`} danger />
          )}
          {forceClosed && skippedCustomers > 0 && (
            <Row label="強制終了による評判" value={`-${skippedCustomers}`} danger />
          )}
          <Row
            label="本日売上"
            value={`¥${revenue.toLocaleString()}`}
            highlight={revenue > 0}
          />
          <Row
            label="評判変動"
            value={`${repSign}${reputationDelta}`}
            highlight={reputationDelta > 0}
            danger={reputationDelta < 0}
          />
          <Row
            label="達成コンボ"
            value={`${achievedCombos.length} 回`}
            highlight={achievedCombos.length > 0}
          />
          <div className="border-t border-[#c8b89a] pt-2 mt-1">
            <Row
              label="累計資金"
              value={`¥${(run.cash + revenue).toLocaleString()}`}
              highlight
            />
          </div>
        </div>

        {/* コンボ達成リスト */}
        {achievedCombos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 bg-[#fdf6e3] rounded-lg p-3 border border-[#f0d060]">
            <span className="w-full text-[10px] text-[#8b7355] font-bold tracking-wider">★ 本日のコンボ</span>
            {Object.entries(comboCounts).map(([id, count]) => {
              const combo = combos.find((c) => c.id === id)
              if (!combo) return null
              return (
                <span
                  key={id}
                  className="px-2 py-0.5 rounded bg-[#f0d060]/40 border border-[#c8b89a] text-xs font-bold text-[#5c3d1e]"
                  title={combo.description}
                >
                  {combo.name}{count > 1 ? ` ×${count}` : ''} <span className="text-[#c0392b]">x{combo.multiplier}</span>
                </span>
              )
            })}
          </div>
        )}

        {/* 翌日へボタン */}
        <button
          onClick={confirmClosing}
          className="w-full py-3 bg-[#2c1a0e] text-[#f0d060] font-bold rounded-lg hover:bg-[#4a2e1a] transition-colors tracking-widest text-sm"
        >
          翌日へ →
        </button>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight = false,
  danger = false,
}: {
  label: string
  value: string
  highlight?: boolean
  danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#8b7355]">{label}</span>
      <span
        className={`text-sm font-bold ${
          danger ? 'text-[#c0392b]' : highlight ? 'text-[#2c1a0e]' : 'text-[#5c3d1e]'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
