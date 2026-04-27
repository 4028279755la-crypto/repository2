import { useGameStore } from '../store/gameStore'

function ReputationStars({ value }: { value: number }) {
  const stars = Math.round((value / 100) * 5)
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < stars ? 'text-[#c0392b]' : 'text-[#c8b89a]'}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default function HUD() {
  const { run, meta } = useGameStore()

  const day = run?.currentDay ?? 0
  const cash = run?.cash ?? 0
  const reputation = run?.reputation ?? 0
  const norenValue = meta.norenValue

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-[#2c1a0e] text-[#f5f0e8] shrink-0 border-b-2 border-[#8b4513]">
      <div className="flex items-center gap-6">
        <div className="text-lg font-bold tracking-widest">🍣 寿司ドラフト</div>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-[#c8b89a]">営業日</span>
          <span className="font-bold text-[#f0d060]">{day}</span>
          <span className="text-[#c8b89a]">日目</span>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-[#c8b89a]">売上</span>
          <span className="font-bold text-[#2ecc71]">¥{cash.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#c8b89a]">のれん値</span>
          <span className="font-bold text-[#e67e22]">{norenValue}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#c8b89a]">評判</span>
          <ReputationStars value={reputation} />
        </div>
      </div>
    </header>
  )
}
