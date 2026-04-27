import { useGameStore } from '../store/gameStore'
import { MAX_DAY } from '../core/logic'

export default function GameOver() {
  const { run, meta, startNewRun } = useGameStore()

  const totalRevenue = run?.history.reduce((s, l) => s + l.revenue, 0) ?? 0
  const bestDay = run?.history.reduce(
    (best, l) => (l.revenue > (best?.revenue ?? 0) ? l : best),
    null as (typeof run.history)[0] | null,
  )
  const totalCombos = run?.comboHistory.length ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a0e05]/90">
      <div className="bg-[#f5f0e8] rounded-2xl shadow-2xl p-8 w-96 flex flex-col gap-6 border-2 border-[#8b4513]">
        {/* ヘッダー */}
        <div className="text-center">
          <div className="text-4xl mb-2">🍱</div>
          <h1 className="text-2xl font-bold text-[#2c1a0e] tracking-widest">シーズン終了</h1>
          <p className="text-sm text-[#8b7355] mt-1">{MAX_DAY} 日間お疲れさまでした</p>
        </div>

        {/* 最終成績 */}
        <div className="flex flex-col gap-3 bg-[#ede5d0] rounded-lg p-4">
          <Row label="総売上" value={`¥${totalRevenue.toLocaleString()}`} />
          <Row label="最終評判" value={`${run?.reputation ?? 0} / 100`} />
          {bestDay && (
            <Row
              label="最高売上日"
              value={`${bestDay.dayNumber}日目 ¥${bestDay.revenue.toLocaleString()}`}
            />
          )}
          <Row label="累計コンボ" value={`${totalCombos} 回`} highlight={totalCombos > 0} />
          <div className="border-t border-[#c8b89a] pt-2 mt-1">
            <Row label="のれん値" value={`${meta.norenValue}`} highlight />
            <Row label="累計ラン数" value={`${meta.records.totalRuns} 回`} />
          </div>
        </div>

        {/* もう一度 */}
        <button
          onClick={startNewRun}
          className="w-full py-3 bg-[#c0392b] text-white font-bold rounded-lg hover:bg-[#a93226] transition-colors tracking-widest text-sm"
        >
          もう一度挑戦する
        </button>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#8b7355]">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-[#e67e22]' : 'text-[#2c1a0e]'}`}>
        {value}
      </span>
    </div>
  )
}
