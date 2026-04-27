import { useState } from 'react'
import { useGameStore, getAllCombos } from '../store/gameStore'
import { INGREDIENT_UNLOCKS, BUFF_UNLOCKS, COMBO_UNLOCK_COSTS, nextBuffCost } from '../core/unlocks'
import { ALL_SHOPS } from '../core/shops'
import { ALL_SCHOOLS } from '../core/schools'
import type { PermanentBuffs } from '../core/types'

type Tab = 'ingredient' | 'combo' | 'shop' | 'school' | 'buff'

const TABS: { id: Tab; label: string }[] = [
  { id: 'ingredient', label: '食材' },
  { id: 'combo',      label: 'コンボ' },
  { id: 'shop',       label: '店舗' },
  { id: 'school',     label: '流派' },
  { id: 'buff',       label: '永続バフ' },
]

interface ConfirmDialog {
  label: string
  cost: number
  confirm: () => void
}

export default function UnlockScreen() {
  const {
    meta, backToTitle, purchaseIngredientUnlock, purchaseComboUnlock,
    purchaseShopUnlock, purchaseSchoolUnlock, purchaseBuff,
  } = useGameStore()
  const [tab, setTab] = useState<Tab>('ingredient')
  const [pending, setPending] = useState<ConfirmDialog | null>(null)

  const confirmPurchase = (label: string, cost: number, action: () => void) => {
    setPending({ label, cost, confirm: () => { action(); setPending(null) } })
  }

  const allCombos = getAllCombos()

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0500]/95 overflow-y-auto py-8">
      <div className="w-[48rem] max-w-[95vw] bg-[#1a0e05] rounded-2xl border-2 border-[#8b4513] p-6 flex flex-col gap-4 max-h-[90vh]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#f0d060] tracking-widest">のれん工房</h2>
          <span className="text-xs text-[#c8b89a]">のれん値 <span className="text-[#e67e22] font-bold text-base">{meta.norenValue}</span></span>
        </div>

        {/* タブ */}
        <div className="flex gap-1 border-b border-[#5c3d1e]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'px-4 py-1.5 text-xs font-bold border-b-2 transition-colors',
                tab === t.id
                  ? 'border-[#f0d060] text-[#f0d060]'
                  : 'border-transparent text-[#c8b89a] hover:text-[#f5f0e8]',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto pr-2">
          {tab === 'ingredient' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {INGREDIENT_UNLOCKS.map((u) => {
                const unlocked = meta.unlockedIngredients.includes(u.id)
                const affordable = meta.norenValue >= u.cost
                return (
                  <UnlockCard
                    key={u.id}
                    title={u.name}
                    desc={u.description}
                    cost={u.cost}
                    unlocked={unlocked}
                    affordable={affordable}
                    onClick={() => confirmPurchase(u.name, u.cost, () => purchaseIngredientUnlock(u.id))}
                  />
                )
              })}
            </div>
          )}

          {tab === 'combo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(COMBO_UNLOCK_COSTS).map(([id, cost]) => {
                const combo = allCombos.find((c) => c.id === id)
                if (!combo) return null
                const unlocked = meta.unlockedCombos.includes(id)
                const affordable = meta.norenValue >= cost
                return (
                  <UnlockCard
                    key={id}
                    title={`★ ${combo.name} x${combo.multiplier}`}
                    desc={combo.description}
                    cost={cost}
                    unlocked={unlocked}
                    affordable={affordable}
                    onClick={() => confirmPurchase(combo.name, cost, () => purchaseComboUnlock(id))}
                  />
                )
              })}
            </div>
          )}

          {tab === 'shop' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ALL_SHOPS.filter((s) => s.unlockNoren > 0).map((shop) => {
                const unlocked = meta.unlockedShops.includes(shop.id)
                const affordable = meta.norenValue >= shop.unlockNoren
                return (
                  <UnlockCard
                    key={shop.id}
                    title={`${shop.name} ${'★'.repeat(shop.difficultyStars)}`}
                    desc={shop.description}
                    cost={shop.unlockNoren}
                    unlocked={unlocked}
                    affordable={affordable}
                    onClick={() => confirmPurchase(shop.name, shop.unlockNoren, () => purchaseShopUnlock(shop.id))}
                  />
                )
              })}
            </div>
          )}

          {tab === 'school' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ALL_SCHOOLS.filter((s) => s.unlockNoren > 0).map((school) => {
                const unlocked = meta.unlockedSchools.includes(school.id)
                const affordable = meta.norenValue >= school.unlockNoren
                return (
                  <UnlockCard
                    key={school.id}
                    title={school.name}
                    desc={school.description}
                    cost={school.unlockNoren}
                    unlocked={unlocked}
                    affordable={affordable}
                    onClick={() => confirmPurchase(school.name, school.unlockNoren, () => purchaseSchoolUnlock(school.id))}
                  />
                )
              })}
            </div>
          )}

          {tab === 'buff' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {BUFF_UNLOCKS.map((b) => {
                const buffs = meta.permanentBuffs
                let level: number
                if (b.id === 'startingCashLevel') level = buffs.startingCashLevel
                else if (b.id === 'startingRepLevel') level = buffs.startingRepLevel
                else level = buffs[b.id as keyof PermanentBuffs] ? 1 : 0
                const cost = nextBuffCost(b, level)
                const maxed = cost === null
                const affordable = !maxed && meta.norenValue >= cost
                return (
                  <UnlockCard
                    key={b.id as string}
                    title={`${b.name}${b.maxLevel > 1 ? ` (Lv ${level}/${b.maxLevel})` : ''}`}
                    desc={b.description}
                    cost={cost ?? 0}
                    unlocked={maxed}
                    affordable={affordable}
                    onClick={() => cost !== null && confirmPurchase(b.name, cost, () => purchaseBuff(b.id))}
                  />
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-2">
          <button
            onClick={backToTitle}
            className="px-4 py-2 bg-[#5c3d1e] text-[#c8b89a] rounded-lg hover:bg-[#4a2e1a] text-xs"
          >
            ← タイトルへ
          </button>
        </div>
      </div>

      {/* 確認モーダル */}
      {pending && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70">
          <div className="bg-[#f5f0e8] rounded-lg p-6 w-72 flex flex-col gap-4 border-2 border-[#8b4513]">
            <h3 className="font-bold text-[#2c1a0e] text-center">購入確認</h3>
            <p className="text-sm text-[#5c3d1e] text-center">
              <span className="font-bold">{pending.label}</span><br />
              のれん値 <span className="text-[#c0392b] font-bold">{pending.cost}</span> を消費します。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPending(null)}
                className="flex-1 py-2 bg-[#5c3d1e] text-[#f5f0e8] rounded text-sm"
              >
                キャンセル
              </button>
              <button
                onClick={pending.confirm}
                className="flex-1 py-2 bg-[#c0392b] text-white font-bold rounded text-sm"
              >
                購入する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function UnlockCard({
  title, desc, cost, unlocked, affordable, onClick,
}: {
  title: string; desc: string; cost: number; unlocked: boolean; affordable: boolean; onClick: () => void
}) {
  return (
    <div
      className={[
        'flex flex-col items-start gap-1 p-3 rounded-lg border-2',
        unlocked
          ? 'border-[#2ecc71] bg-[#1a3d24]'
          : affordable
          ? 'border-[#f0d060] bg-[#2c1a0e]'
          : 'border-[#5c3d1e] bg-[#1a0e05] opacity-60',
      ].join(' ')}
    >
      <div className="flex items-center justify-between w-full">
        <span className="font-bold text-[#f5f0e8] text-sm">{title}</span>
        <span className={`text-xs font-bold ${unlocked ? 'text-[#2ecc71]' : 'text-[#e67e22]'}`}>
          {unlocked ? '✓ 解放済み' : `のれん${cost}`}
        </span>
      </div>
      <p className="text-[10px] text-[#c8b89a] leading-relaxed">{desc}</p>
      {!unlocked && (
        <button
          onClick={onClick}
          disabled={!affordable}
          className={[
            'self-end mt-1 px-3 py-1 rounded text-xs font-bold',
            affordable
              ? 'bg-[#c0392b] text-white hover:bg-[#a93226]'
              : 'bg-[#3a2410] text-[#5c3d1e] cursor-not-allowed',
          ].join(' ')}
        >
          {affordable ? '購入' : '不足'}
        </button>
      )}
    </div>
  )
}
