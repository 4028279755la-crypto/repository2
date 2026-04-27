import { useGameStore } from '../store/gameStore'
import { ALL_SCHOOLS } from '../core/schools'

export default function SchoolSelectScreen() {
  const {
    meta, selectedShopId, selectedSchoolId, selectSchool, startRunWithSelection, goToShopSelect,
  } = useGameStore()

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0500]/95 overflow-y-auto py-8">
      <div className="w-[44rem] max-w-[95vw] bg-[#1a0e05] rounded-2xl border-2 border-[#8b4513] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#f0d060] tracking-widest">流派選択</h2>
          <span className="text-xs text-[#c8b89a]">店舗: <span className="text-[#f0d060]">{selectedShopId ?? '未選択'}</span></span>
        </div>
        <p className="text-xs text-[#c8b89a]">流派は店舗修飾子と乗算で効きます。ビルドの方向性を決める要素です。</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ALL_SCHOOLS.map((school) => {
            const unlocked = meta.unlockedSchools.includes(school.id)
            const selected = selectedSchoolId === school.id
            const tagBonusEntries = Object.entries(school.modifiers.tagBonus)
            return (
              <button
                key={school.id}
                onClick={() => unlocked && selectSchool(school.id)}
                disabled={!unlocked}
                className={[
                  'flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-colors text-left',
                  selected
                    ? 'border-[#f0d060] bg-[#2c1a0e]'
                    : unlocked
                    ? 'border-[#5c3d1e] bg-[#1a0e05] hover:border-[#8b4513]'
                    : 'border-[#3a2410] bg-[#1a0e05] opacity-50 cursor-not-allowed',
                ].join(' ')}
              >
                <span className="font-bold text-[#f5f0e8]">{school.name}</span>
                <p className="text-[10px] text-[#c8b89a] leading-relaxed flex-1">{school.description}</p>
                <div className="flex flex-wrap gap-1">
                  {tagBonusEntries.map(([tag, bonus]) => (
                    <span
                      key={tag}
                      className={`text-[9px] px-1 py-0.5 rounded ${bonus >= 0 ? 'bg-[#2ecc71]/20 text-[#2ecc71]' : 'bg-[#c0392b]/20 text-[#c0392b]'}`}
                    >
                      {tag} {bonus >= 0 ? '+' : ''}{Math.round(bonus * 100)}%
                    </span>
                  ))}
                </div>
                {!unlocked && (
                  <span className="text-[10px] text-[#e67e22]">🔒 のれん値 {school.unlockNoren}</span>
                )}
                {selected && <span className="text-[10px] text-[#2ecc71] font-bold">✓ 選択中</span>}
              </button>
            )
          })}
        </div>

        <div className="flex justify-between items-center mt-2">
          <button
            onClick={goToShopSelect}
            className="px-4 py-2 bg-[#5c3d1e] text-[#c8b89a] rounded-lg hover:bg-[#4a2e1a] text-xs"
          >
            ← 店舗選択へ戻る
          </button>
          <button
            onClick={startRunWithSelection}
            disabled={!selectedSchoolId}
            className={[
              'px-8 py-2 rounded-lg font-bold tracking-widest text-sm',
              selectedSchoolId
                ? 'bg-[#c0392b] text-white hover:bg-[#a93226]'
                : 'bg-[#3a2410] text-[#5c3d1e] cursor-not-allowed',
            ].join(' ')}
          >
            営業開始 →
          </button>
        </div>
      </div>
    </div>
  )
}
