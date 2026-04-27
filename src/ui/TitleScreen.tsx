import { useGameStore } from '../store/gameStore'

const MENU = [
  { key: 'start',      label: 'のれんをくぐる', description: 'ラン開始：店舗 → 流派を選んで30日間の挑戦' },
  { key: 'unlock',     label: 'のれん工房',     description: 'のれん値で食材・コンボ・店舗・バフを開放' },
  { key: 'apprentice', label: '弟子部屋',       description: '解放した弟子を最大3人まで装着' },
  { key: 'record',     label: '実績の間',       description: '達成記録とコンボ図鑑を閲覧' },
] as const

export default function TitleScreen() {
  const {
    meta, startNewRun, goToUnlockMenu, goToApprenticeMenu, goToRecordMenu,
  } = useGameStore()

  const handlers: Record<typeof MENU[number]['key'], () => void> = {
    start: startNewRun,
    unlock: goToUnlockMenu,
    apprentice: goToApprenticeMenu,
    record: goToRecordMenu,
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a0e05] to-[#3d1a1a] overflow-hidden">
      {/* 暖簾風ヘッダー */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-[#2c1a0e] flex items-center justify-center border-b-2 border-[#8b4513]">
        <div className="text-[#f0d060] tracking-[0.5em] text-xs">── 寿司ドラフト ──</div>
      </div>

      <div className="flex flex-col items-center gap-6 text-[#f5f0e8] mt-8">
        <div className="text-center">
          <div className="text-6xl mb-2">🍣</div>
          <h1
            className="text-4xl font-bold tracking-[0.3em] text-[#f0d060]"
            style={{ fontFamily: '"Courier New", monospace', textShadow: '2px 2px 0 #8b4513' }}
          >
            寿司ドラフト
          </h1>
          <p className="text-[10px] text-[#c8b89a] tracking-[0.5em] mt-2">SUSHI DRAFT</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-1.5 bg-[#2c1a0e]/60 rounded-full border border-[#8b4513]">
          <span className="text-[#c8b89a] text-xs">のれん値</span>
          <span className="text-2xl font-bold text-[#e67e22]">{meta.norenValue}</span>
        </div>

        <div className="flex flex-col gap-2 w-80">
          {MENU.map((item) => (
            <button
              key={item.key}
              onClick={handlers[item.key]}
              className="group flex flex-col items-start px-6 py-3 bg-[#2c1a0e] border-2 border-[#8b4513] rounded-lg hover:border-[#f0d060] hover:bg-[#3a2410] transition-colors text-left"
            >
              <span className="font-bold text-[#f0d060] tracking-widest text-sm">{item.label}</span>
              <span className="text-[10px] text-[#c8b89a] group-hover:text-[#f5f0e8]">{item.description}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-1 text-[10px] text-[#8b7355] mt-2">
          <span>累計ラン {meta.records.totalRuns} ／ 完了シーズン {meta.records.completedSeasons}</span>
          <span>最高売上 ¥{meta.records.bestRevenue.toLocaleString()} ／ 最高評判 {meta.records.bestReputation}</span>
        </div>
      </div>
    </div>
  )
}
