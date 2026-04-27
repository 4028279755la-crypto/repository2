import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { ALL_APPRENTICES, APPRENTICE_SLOT_MAX } from '../core/apprentices'

interface PendingPurchase {
  label: string
  cost: number
  confirm: () => void
}

export default function ApprenticeScreen() {
  const {
    meta, backToTitle, purchaseApprenticeUnlock, toggleApprenticeHire,
  } = useGameStore()
  const [pending, setPending] = useState<PendingPurchase | null>(null)

  const requestPurchase = (label: string, cost: number, action: () => void) => {
    setPending({ label, cost, confirm: () => { action(); setPending(null) } })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0500]/95 overflow-y-auto py-8">
      <div className="w-[44rem] max-w-[95vw] bg-[#1a0e05] rounded-2xl border-2 border-[#8b4513] p-6 flex flex-col gap-4 max-h-[90vh]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#f0d060] tracking-widest">弟子部屋</h2>
          <span className="text-xs text-[#c8b89a]">のれん値 <span className="text-[#e67e22] font-bold text-base">{meta.norenValue}</span></span>
        </div>

        <p className="text-xs text-[#c8b89a]">
          雇用中の弟子はラン中に効果を発揮します。最大 {APPRENTICE_SLOT_MAX} 人まで装着可能。
          現在 <span className="text-[#f0d060] font-bold">{meta.hiredApprentices.length}/{APPRENTICE_SLOT_MAX}</span> 人
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-1">
          {ALL_APPRENTICES.map((a) => {
            const owned = meta.unlockedApprentices.includes(a.id)
            const hired = meta.hiredApprentices.includes(a.id)
            const slotsFull = !hired && meta.hiredApprentices.length >= APPRENTICE_SLOT_MAX
            const affordable = meta.norenValue >= a.unlockNoren
            return (
              <div
                key={a.id}
                className={[
                  'flex flex-col items-start gap-2 p-4 rounded-lg border-2',
                  hired
                    ? 'border-[#2ecc71] bg-[#1a3d24]'
                    : owned
                    ? 'border-[#5c3d1e] bg-[#1a0e05]'
                    : 'border-[#8b4513] bg-[#1a0e05]',
                ].join(' ')}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-[#f5f0e8]">弟子・{a.name}</span>
                  {!owned && <span className="text-xs text-[#e67e22]">のれん{a.unlockNoren}</span>}
                  {hired && <span className="text-xs text-[#2ecc71] font-bold">✓ 雇用中</span>}
                </div>
                <p className="text-[11px] text-[#c8b89a] leading-relaxed">{a.description}</p>
                <div className="flex gap-2 self-end">
                  {!owned && (
                    <button
                      disabled={!affordable}
                      onClick={() => requestPurchase(a.name, a.unlockNoren, () => purchaseApprenticeUnlock(a.id))}
                      className={[
                        'px-3 py-1 rounded text-xs font-bold',
                        affordable
                          ? 'bg-[#c0392b] text-white hover:bg-[#a93226]'
                          : 'bg-[#3a2410] text-[#5c3d1e] cursor-not-allowed',
                      ].join(' ')}
                    >
                      解放する
                    </button>
                  )}
                  {owned && (
                    <button
                      disabled={slotsFull}
                      onClick={() => toggleApprenticeHire(a.id)}
                      className={[
                        'px-3 py-1 rounded text-xs font-bold',
                        hired
                          ? 'bg-[#5c3d1e] text-[#c8b89a] hover:bg-[#4a2e1a]'
                          : slotsFull
                          ? 'bg-[#3a2410] text-[#5c3d1e] cursor-not-allowed'
                          : 'bg-[#2ecc71] text-white hover:bg-[#27ae60]',
                      ].join(' ')}
                    >
                      {hired ? '解雇する' : slotsFull ? 'スロット満杯' : '雇用する'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
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

      {pending && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70">
          <div className="bg-[#f5f0e8] rounded-lg p-6 w-72 flex flex-col gap-4 border-2 border-[#8b4513]">
            <h3 className="font-bold text-[#2c1a0e] text-center">弟子の解放</h3>
            <p className="text-sm text-[#5c3d1e] text-center">
              <span className="font-bold">{pending.label}</span> を解放しますか？<br />
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
                解放する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
