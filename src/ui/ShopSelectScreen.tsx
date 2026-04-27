import { useGameStore } from '../store/gameStore'
import { ALL_SHOPS } from '../core/shops'

export default function ShopSelectScreen() {
  const { meta, selectedShopId, selectShop, confirmShop, backToTitle } = useGameStore()

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0500]/95 overflow-y-auto py-8">
      <div className="w-[44rem] max-w-[95vw] bg-[#1a0e05] rounded-2xl border-2 border-[#8b4513] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#f0d060] tracking-widest">店舗選択</h2>
          <span className="text-xs text-[#c8b89a]">のれん値 <span className="text-[#e67e22] font-bold">{meta.norenValue}</span></span>
        </div>
        <p className="text-xs text-[#c8b89a]">どの店で30日間を戦うか選んでください。店舗ごとに有利・不利の修飾子があります。</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALL_SHOPS.map((shop) => {
            const unlocked = meta.unlockedShops.includes(shop.id)
            const selected = selectedShopId === shop.id
            return (
              <button
                key={shop.id}
                onClick={() => unlocked && selectShop(shop.id)}
                disabled={!unlocked}
                className={[
                  'flex flex-col items-start gap-1 p-4 rounded-lg border-2 transition-colors text-left',
                  selected
                    ? 'border-[#f0d060] bg-[#2c1a0e]'
                    : unlocked
                    ? 'border-[#5c3d1e] bg-[#1a0e05] hover:border-[#8b4513]'
                    : 'border-[#3a2410] bg-[#1a0e05] opacity-50 cursor-not-allowed',
                ].join(' ')}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-[#f5f0e8]">{shop.name}</span>
                  <span className="text-xs text-[#f0d060]">{'★'.repeat(shop.difficultyStars)}</span>
                </div>
                <p className="text-[10px] text-[#c8b89a] leading-relaxed">{shop.description}</p>
                {!unlocked && (
                  <span className="text-[10px] text-[#e67e22] mt-1">🔒 のれん値 {shop.unlockNoren} で「のれん工房」から解放</span>
                )}
                {selected && <span className="text-[10px] text-[#2ecc71] font-bold mt-1">✓ 選択中</span>}
              </button>
            )
          })}
        </div>

        <div className="flex justify-between items-center mt-2">
          <button
            onClick={backToTitle}
            className="px-4 py-2 bg-[#5c3d1e] text-[#c8b89a] rounded-lg hover:bg-[#4a2e1a] text-xs"
          >
            ← タイトルへ
          </button>
          <button
            onClick={confirmShop}
            disabled={!selectedShopId}
            className={[
              'px-8 py-2 rounded-lg font-bold tracking-widest text-sm',
              selectedShopId
                ? 'bg-[#c0392b] text-white hover:bg-[#a93226]'
                : 'bg-[#3a2410] text-[#5c3d1e] cursor-not-allowed',
            ].join(' ')}
          >
            次へ：流派選択 →
          </button>
        </div>
      </div>
    </div>
  )
}
