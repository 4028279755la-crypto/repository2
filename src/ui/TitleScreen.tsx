import { useGameStore } from '../store/gameStore'

export default function TitleScreen() {
  const { meta, startNewRun } = useGameStore()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#1a0e05] to-[#3d1a1a]">
      <div className="flex flex-col items-center gap-6 text-[#f5f0e8]">
        <div className="text-6xl">🍣</div>
        <h1 className="text-4xl font-bold tracking-[0.4em] text-[#f0d060]">寿司ドラフト</h1>
        <p className="text-sm text-[#c8b89a] tracking-widest">SUSHI DRAFT</p>

        <div className="flex flex-col items-center gap-1 text-xs text-[#c8b89a] mt-4">
          <span>のれん値 <span className="text-[#e67e22] font-bold text-base">{meta.norenValue}</span></span>
          <span>累計ラン数 {meta.records.totalRuns} / 完了シーズン {meta.records.completedSeasons}</span>
        </div>

        <button
          onClick={startNewRun}
          className="mt-6 px-12 py-3 bg-[#c0392b] text-white font-bold rounded-lg hover:bg-[#a93226] transition-colors tracking-widest text-base shadow-lg"
        >
          新しいランを始める
        </button>

        <p className="text-[10px] text-[#8b7355] mt-4 max-w-md text-center leading-relaxed">
          30日間で名店を目指す寿司屋経営ローグライト。<br />
          食材をドラフトし、組み合わせて出し、月末の覆面調査員に挑め。
        </p>
      </div>
    </div>
  )
}
