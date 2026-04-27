import { useGameStore } from '../store/gameStore'

function Row({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#8b7355]">{label}</span>
      <span className={`text-sm font-bold ${danger ? 'text-[#c0392b]' : highlight ? 'text-[#f0d060]' : 'text-[#2c1a0e]'}`}>
        {value}
      </span>
    </div>
  )
}

export default function ResultScreen() {
  const { runResult, returnToTitle, restartRun } = useGameStore()
  if (!runResult) return null

  const { passed, bossResult } = runResult

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0500]/95">
      <div className="bg-[#f5f0e8] rounded-2xl shadow-2xl p-8 w-[28rem] flex flex-col gap-5 border-2 border-[#8b4513]">
        {/* タイトル */}
        <div className="text-center">
          <div className="text-4xl mb-2">{passed ? '🍱' : '🌙'}</div>
          <h1 className="text-2xl font-bold text-[#2c1a0e] tracking-widest">
            {passed ? 'シーズン達成' : 'シーズン未達'}
          </h1>
          <p className="text-sm text-[#8b7355] mt-1">
            ★ {bossResult.totalStars} / 4 ── 30 日間お疲れさまでした
          </p>
        </div>

        {/* 数値サマリー */}
        <div className="flex flex-col gap-2 bg-[#ede5d0] rounded-lg p-4">
          <Row label="総売上" value={`¥${runResult.totalRevenue.toLocaleString()}`} />
          <Row
            label="最高売上日"
            value={runResult.bestDay > 0
              ? `${runResult.bestDay}日目 ¥${runResult.bestDayRevenue.toLocaleString()}`
              : '—'}
          />
          <Row
            label="達成コンボ"
            value={`${runResult.totalCombos} 回（${runResult.uniqueCombos} 種類）`}
            highlight={runResult.uniqueCombos > 0}
          />
          <Row label="最終評判" value={`${runResult.finalReputation} / 100`} danger={!passed} />
          <Row label="残金" value={`¥${runResult.finalCash.toLocaleString()}`} />
          <div className="border-t border-[#c8b89a] pt-2 mt-1">
            <Row
              label="獲得のれん値"
              value={`+${runResult.norenGained}`}
              highlight
            />
          </div>
        </div>

        {/* 調査員コメント抜粋 */}
        <div className="bg-[#fdf6e3] rounded-lg p-3 border border-[#f0d060] flex flex-col gap-1">
          <span className="text-[10px] text-[#8b7355] font-bold tracking-wider">覆面調査員の総評</span>
          {bossResult.comments.slice(0, 2).map((c, i) => (
            <p key={i} className="text-xs text-[#5c3d1e] leading-relaxed">「{c}」</p>
          ))}
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          <button
            onClick={returnToTitle}
            className="flex-1 py-3 bg-[#5c3d1e] text-[#f5f0e8] font-bold rounded-lg hover:bg-[#4a2e1a] transition-colors tracking-widest text-sm"
          >
            タイトルへ
          </button>
          <button
            onClick={restartRun}
            className="flex-1 py-3 bg-[#c0392b] text-white font-bold rounded-lg hover:bg-[#a93226] transition-colors tracking-widest text-sm"
          >
            もう一度
          </button>
        </div>
      </div>
    </div>
  )
}
