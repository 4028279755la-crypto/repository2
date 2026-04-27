import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { BOSS_THRESHOLDS } from '../core/boss'

function StarBadge({ filled, label, value }: { filled: boolean; label: string; value: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 ${
      filled ? 'border-[#f0d060] bg-[#2c1a0e]' : 'border-[#5c3d1e] bg-[#1a0e05]'
    }`}>
      <span className={`text-3xl ${filled ? 'text-[#f0d060]' : 'text-[#5c3d1e]'}`}>
        {filled ? '★' : '☆'}
      </span>
      <span className="text-[10px] text-[#c8b89a] font-bold">{label}</span>
      <span className={`text-xs font-bold ${filled ? 'text-[#f0d060]' : 'text-[#8b7355]'}`}>
        {value}
      </span>
    </div>
  )
}

export default function CriticReview() {
  const { bossResult, confirmCriticReview } = useGameStore()
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    if (!bossResult) return
    const interval = setInterval(() => {
      setRevealed((r) => (r < 4 ? r + 1 : r))
    }, 600)
    return () => clearInterval(interval)
  }, [bossResult])

  if (!bossResult) return null

  const m = bossResult.metrics
  const stars = [
    { filled: bossResult.qualityStar, label: '品質', value: `¥${Math.round(m.avgSalePrice).toLocaleString()}/貫`, threshold: `要 ¥${BOSS_THRESHOLDS.quality}` },
    { filled: bossResult.diversityStar, label: '多様性', value: `${m.comboDiversity}種コンボ`, threshold: `要 ${BOSS_THRESHOLDS.diversity}種` },
    { filled: bossResult.efficiencyStar, label: '効率', value: `${Math.round(m.successRate * 100)}%成功`, threshold: `要 ${Math.round(BOSS_THRESHOLDS.efficiency * 100)}%` },
    { filled: bossResult.hospitalityStar, label: 'もてなし', value: `${Math.round(m.hospitalityRate * 100)}%満足`, threshold: `要 ${Math.round(BOSS_THRESHOLDS.hospitality * 100)}%` },
  ]
  const allRevealed = revealed >= 4

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0500]/95"
      role="dialog"
      aria-modal="true"
      aria-label="覆面調査員の評価"
    >
      <div className="bg-[#1a0e05] rounded-2xl shadow-2xl p-8 w-[36rem] flex flex-col gap-5 border-2 border-[#8b4513]">
        {/* 調査員の影 */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-5xl">🕵️</div>
          <h2 className="text-xl font-bold text-[#f0d060] tracking-widest">覆面調査員の評価</h2>
          <p className="text-xs text-[#c8b89a]">シーズン総評</p>
        </div>

        {/* 4つの星 */}
        <div className="grid grid-cols-4 gap-3">
          {stars.map((s, i) => (
            <div key={i} className={i >= revealed ? 'opacity-30' : 'opacity-100 transition-opacity duration-500'}>
              <StarBadge filled={i < revealed && s.filled} label={s.label} value={i < revealed ? s.value : '???'} />
              <p className="text-[9px] text-[#8b7355] text-center mt-1">{s.threshold}</p>
            </div>
          ))}
        </div>

        {/* コメント（全星表示後） */}
        {allRevealed && (
          <div className="bg-[#2c1a0e] rounded-lg p-4 border border-[#5c3d1e] flex flex-col gap-2">
            {bossResult.comments.map((c, i) => (
              <p key={i} className="text-xs text-[#c8b89a] leading-relaxed">「{c}」</p>
            ))}
          </div>
        )}

        {/* 合否 */}
        {allRevealed && (
          <div className={`text-center py-3 rounded-lg ${
            bossResult.passed ? 'bg-[#1a4d2e] text-[#2ecc71]' : 'bg-[#3d1a1a] text-[#c0392b]'
          }`}>
            <div className="text-2xl font-bold tracking-widest">
              {bossResult.passed ? `★ ${bossResult.totalStars} / 4 ── 合格` : `★ ${bossResult.totalStars} / 4 ── 不合格`}
            </div>
          </div>
        )}

        {/* OKボタン */}
        {allRevealed && (
          <button
            onClick={confirmCriticReview}
            className="w-full py-3 bg-[#c0392b] text-white font-bold rounded-lg hover:bg-[#a93226] transition-colors tracking-widest text-sm"
          >
            結果を見る →
          </button>
        )}
      </div>
    </div>
  )
}
