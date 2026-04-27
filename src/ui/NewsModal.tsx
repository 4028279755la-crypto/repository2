import { useGameStore } from '../store/gameStore'
import { reputationTier, TIER_LABELS, TIER_DESCRIPTIONS } from '../core/season'

const EVENT_EMOJI: Record<string, string> = {
  rain: '🌧️',
  festival: '🏮',
  price_surge: '📈',
  good_catch: '🎣',
  food_poison_rumor: '⚠️',
  tour_bus: '🚌',
  rival_shop: '🏪',
  gourmet_blog: '📝',
  edomae_festival: '🎌',
}

export default function NewsModal() {
  const { run, todayEvent, todayDifficulty, confirmNews } = useGameStore()
  if (!run || !todayDifficulty) return null

  const tier = reputationTier(run.reputation)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label="本日のニュース"
    >
      <div className="bg-[#f5f0e8] rounded-2xl shadow-2xl p-6 w-[28rem] flex flex-col gap-4 border-2 border-[#8b4513]">
        {/* タイトル */}
        <div className="text-center">
          <div className="text-3xl mb-1">📰</div>
          <h2 className="text-lg font-bold text-[#2c1a0e] tracking-widest">本日のニュース</h2>
          <p className="text-xs text-[#8b7355] mt-1">
            Day {run.currentDay} / 30 — {todayDifficulty.label}
          </p>
        </div>

        {/* 評判ティア */}
        <div className="bg-[#ede5d0] rounded-lg p-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#8b7355]">店の格</span>
            <span className="font-bold text-[#5c3d1e]">{TIER_LABELS[tier]}</span>
          </div>
          <span className="text-[10px] text-[#8b7355] max-w-[12rem] text-right">{TIER_DESCRIPTIONS[tier]}</span>
        </div>

        {/* 難易度サマリー */}
        <div className="bg-[#ede5d0] rounded-lg p-3 text-xs text-[#5c3d1e] flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-[#8b7355]">客数目安</span>
            <span className="font-bold">{todayDifficulty.customerCountMin}〜{todayDifficulty.customerCountMax} 人</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b7355]">時間制限</span>
            <span className="font-bold">x{todayDifficulty.timeLimitMultiplier.toFixed(2)}</span>
          </div>
          {todayDifficulty.patienceModifier !== 0 && (
            <div className="flex justify-between">
              <span className="text-[#8b7355]">忍耐</span>
              <span className="font-bold text-[#c0392b]">
                {todayDifficulty.patienceModifier > 0 ? '+' : ''}{todayDifficulty.patienceModifier} ハート
              </span>
            </div>
          )}
          {todayDifficulty.slotCountBonus > 0 && (
            <div className="flex justify-between">
              <span className="text-[#8b7355]">注文の貫数</span>
              <span className="font-bold text-[#c0392b]">+{todayDifficulty.slotCountBonus}</span>
            </div>
          )}
        </div>

        {/* 本日のイベント */}
        {todayEvent ? (
          <div className="bg-[#fdf6e3] rounded-lg p-4 border-2 border-[#f0d060]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{EVENT_EMOJI[todayEvent.id] ?? '✨'}</span>
              <span className="font-bold text-[#2c1a0e]">{todayEvent.name}</span>
            </div>
            <p className="text-xs text-[#5c3d1e] leading-relaxed">{todayEvent.description}</p>
          </div>
        ) : (
          <div className="bg-[#ede5d0] rounded-lg p-4 text-center">
            <p className="text-xs text-[#8b7355]">今日は普段通り。落ち着いた一日になりそうだ。</p>
          </div>
        )}

        {/* OKボタン */}
        <button
          onClick={confirmNews}
          className="w-full py-3 bg-[#2c1a0e] text-[#f0d060] font-bold rounded-lg hover:bg-[#4a2e1a] transition-colors tracking-widest text-sm"
        >
          了解 → 朝市へ
        </button>
      </div>
    </div>
  )
}
