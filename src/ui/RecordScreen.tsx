import { useGameStore, getAllCombos } from '../store/gameStore'
import { ALL_APPRENTICES } from '../core/apprentices'

export default function RecordScreen() {
  const { meta, backToTitle } = useGameStore()
  const combos = getAllCombos()
  const discovered = new Set(meta.records.discoveredCombos)

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0500]/95 overflow-y-auto py-8">
      <div className="w-[44rem] max-w-[95vw] bg-[#1a0e05] rounded-2xl border-2 border-[#8b4513] p-6 flex flex-col gap-5 max-h-[90vh]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#f0d060] tracking-widest">実績の間</h2>
          <span className="text-xs text-[#c8b89a]">のれん値 <span className="text-[#e67e22] font-bold">{meta.norenValue}</span></span>
        </div>

        {/* 数値記録 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <Stat label="累計ラン" value={`${meta.records.totalRuns}`} />
          <Stat label="完了シーズン" value={`${meta.records.completedSeasons}`} />
          <Stat label="最高売上" value={`¥${meta.records.bestRevenue.toLocaleString()}`} />
          <Stat label="最高評判" value={`${meta.records.bestReputation}`} />
        </div>

        {/* コンボ図鑑 */}
        <div>
          <h3 className="text-sm font-bold text-[#c8b89a] mb-2">コンボ図鑑（{discovered.size}/{combos.length}）</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto max-h-64 pr-1">
            {combos.map((c) => {
              const found = discovered.has(c.id)
              return (
                <div
                  key={c.id}
                  className={[
                    'p-2 rounded border',
                    found ? 'border-[#f0d060] bg-[#2c1a0e]' : 'border-[#3a2410] bg-[#1a0e05]',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${found ? 'text-[#f0d060]' : 'text-[#5c3d1e]'}`}>
                      {found ? c.name : '？？？'}
                    </span>
                    {found && <span className="text-[10px] text-[#c0392b]">x{c.multiplier}</span>}
                  </div>
                  <p className="text-[9px] text-[#8b7355] leading-snug">
                    {found ? c.description : '達成すると解禁'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 弟子コレクション */}
        <div>
          <h3 className="text-sm font-bold text-[#c8b89a] mb-2">弟子コレクション（{meta.unlockedApprentices.length}/{ALL_APPRENTICES.length}）</h3>
          <div className="flex flex-wrap gap-2">
            {ALL_APPRENTICES.map((a) => {
              const owned = meta.unlockedApprentices.includes(a.id)
              const hired = meta.hiredApprentices.includes(a.id)
              return (
                <div
                  key={a.id}
                  className={[
                    'px-3 py-1.5 rounded border text-xs',
                    hired
                      ? 'border-[#2ecc71] bg-[#1a3d24] text-[#2ecc71]'
                      : owned
                      ? 'border-[#f0d060] bg-[#2c1a0e] text-[#f0d060]'
                      : 'border-[#3a2410] bg-[#1a0e05] text-[#5c3d1e]',
                  ].join(' ')}
                >
                  {owned ? a.name : '？？？'}
                  {hired && ' ✓'}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={backToTitle}
            className="px-4 py-2 bg-[#5c3d1e] text-[#c8b89a] rounded-lg hover:bg-[#4a2e1a] text-xs"
          >
            ← タイトルへ
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#2c1a0e] rounded-lg p-3 flex flex-col">
      <span className="text-[10px] text-[#8b7355]">{label}</span>
      <span className="font-bold text-[#f5f0e8]">{value}</span>
    </div>
  )
}
