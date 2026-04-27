import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { MAX_DAY } from '../core/logic'
import { reputationTier, TIER_LABELS } from '../core/season'
import { BALANCE } from '../core/balance'

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
        <span key={i} className={i < stars ? 'text-[#c0392b]' : 'text-[#c8b89a]'} aria-hidden="true">★</span>
      ))}
    </div>
  )
}

/** ターゲット値に向かって 500ms でカウントアップするフック */
function useCountUp(target: number, durationMs = 500): number {
  const [displayed, setDisplayed] = useState(target)
  const fromRef = useRef(target)
  const animRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    const startTime = performance.now()
    const animate = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed(Math.round(from + (target - from) * eased))
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        fromRef.current = target
      }
    }
    cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [target, durationMs])

  return displayed
}

interface FloatEntry { id: number; amount: number }

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

  // Phase 7 §5: Day10 を過ぎても売上が低調なら経営警告を表示
  const cumulativeRevenue = run?.history.reduce((s, h) => s + h.revenue, 0) ?? 0
  const showWarning = !!run
    && run.currentDay >= BALANCE.WARNING_CHECK_DAY
    && cumulativeRevenue < BALANCE.DAY10_REVENUE_THRESHOLD
    && phase !== 'title' && phase !== 'gameover'

  // Countup animation for revenue
  const animatedRevenue = useCountUp(phase === 'service' ? dailyRevenue : dailyRevenue)

  // +¥N float labels
  const [floats, setFloats] = useState<FloatEntry[]>([])
  const prevRevenue = useRef(dailyRevenue)
  useEffect(() => {
    const diff = dailyRevenue - prevRevenue.current
    if (diff > 0 && phase === 'service') {
      const id = Date.now() + Math.random()
      setFloats((f) => [...f, { id, amount: diff }])
      const t = setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1300)
      prevRevenue.current = dailyRevenue
      return () => clearTimeout(t)
    }
    prevRevenue.current = dailyRevenue
  }, [dailyRevenue, phase])

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
        {showWarning && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#c0392b] text-white animate-pulse"
            title={`Day10 終了時点で売上累計が ¥${BALANCE.DAY10_REVENUE_THRESHOLD.toLocaleString()} 未満です`}
          >
            ⚠ 経営注意
          </span>
        )}
      </div>

      <div className="flex items-center gap-5 text-sm">
        {phase === 'service' && (
          <div className="relative flex items-center gap-1">
            <span className="text-[#c8b89a] text-xs">本日売上</span>
            <span className="font-bold text-[#2ecc71]">¥{animatedRevenue.toLocaleString()}</span>
            {/* +¥N フロートラベル */}
            {floats.map((f) => (
              <span
                key={f.id}
                className="absolute -top-5 right-0 text-xs font-bold text-[#f0d060] animate-float-up pointer-events-none whitespace-nowrap"
              >
                +¥{f.amount.toLocaleString()}
              </span>
            ))}
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
