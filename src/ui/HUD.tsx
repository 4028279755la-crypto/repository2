import { useGameStore } from '../store/gameStore'
import { MAX_DAY } from '../core/logic'
import { reputationTier, TIER_LABELS } from '../core/season'

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  news:           { label: 'ニュース', color: 'text-[#3498db]' },
  morning_market: { label: '朝市',   color: 'text-[#f0d060]' },
  service:        { label: '営業中', color: 'text-[#2ecc71]' },
  closing:        { label: '締め',   color: 'text-[#e67e22]' },
  critic_review:  { label: '審査',   color: 'text-[#9b59b6]' },
  result:         { label: '結果',   color: 'text-[#e67e22]' },
  gameover:       { label: '終了',   color: 'text-[#c0392b]' },
  title:          { label: 'タイトル', color: 'text-[#c8b89a]' },
}

function ReputationStars({ value }: { value: number }) {
  const stars = Math.round((value / 100) * 5)
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < stars ? 'text-[#c0392b]' : 'text-[#c8b89a]'} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  )
}

export default function HUD() {
  const { run, meta, phase, dailyRevenue, dailyAchievedCombos } = useGameStore()

  const day = run?.currentDay ?? 0
  const cash = run?.cash ?? 0
  const reputation = run?.reputation ?? 0
  const norenValue = meta.norenValue
  const phaseInfo = PHASE_LABELS[phase] ?? { label: phase, color: 'text-[#c8b89a]' }
  const comboCount = dailyAchievedCombos.length
  const tier = reputationTier(reputation)
  const totalCombos = run?.comboHistory.length ?? 0

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-[#2c1a0e] text-[#f5f0e8] shrink-0 border-b-2 border-[#8b4513]">
      <div className="flex items-center gap-4">
        <div className="text-lg font-bold tracking-widest">🍣 寿司ドラフト</div>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-[#c8b89a]">Day</span>
          <span className="font-bold text-[#f0d060]">{day}</span>
          <span className="text-[#c8b89a]">/ {MAX_DAY}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded border border-current ${phaseInfo.color}`}>
          {phaseInfo.label}
        </span>
        {run && (
          <span className="text-xs text-[#f0d060] font-bold tracking-wider hidden md:inline">
            {TIER_LABELS[tier]}
          </span>
        )}
      </div>

      <div className="flex items-center gap-5 text-sm">
        {phase === 'service' && (
          <div className="flex items-center gap-1">
            <span className="text-[#c8b89a] text-xs">本日売上</span>
            <span className="font-bold text-[#2ecc71]">¥{dailyRevenue.toLocaleString()}</span>
          </div>
        )}
        {phase === 'service' && (
          <div className="flex items-center gap-1" aria-label={`本日のコンボ達成数 ${comboCount}`}>
            <span className="text-[#c8b89a] text-xs">コンボ</span>
            <span className={`font-bold ${comboCount > 0 ? 'text-[#f0d060]' : 'text-[#c8b89a]'}`}>
              ★{comboCount}
            </span>
          </div>
        )}
        {run && phase !== 'service' && phase !== 'title' && totalCombos > 0 && (
          <div className="flex items-center gap-1" aria-label={`シーズン累計コンボ ${totalCombos}`}>
            <span className="text-[#c8b89a] text-xs">累計</span>
            <span className="font-bold text-[#f0d060]">★{totalCombos}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="text-[#c8b89a] text-xs">資金</span>
          <span className="font-bold text-[#f5f0e8]">¥{cash.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#c8b89a] text-xs">のれん</span>
          <span className="font-bold text-[#e67e22]">{norenValue}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#c8b89a] text-xs">評判</span>
          <ReputationStars value={reputation} />
        </div>
      </div>
    </header>
  )
}
