import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

export default function EarlyCloseButton() {
  const phase = useGameStore((s) => s.phase)
  const serviceOrders = useGameStore((s) => s.serviceOrders)
  const currentOrderIdx = useGameStore((s) => s.currentOrderIdx)
  const setServicePaused = useGameStore((s) => s.setServicePaused)
  const forceCloseDay = useGameStore((s) => s.forceCloseDay)

  const [showModal, setShowModal] = useState(false)

  const skippedCustomers = Math.max(0, serviceOrders.length - currentOrderIdx - 1)

  const openModal = () => {
    setShowModal(true)
    setServicePaused(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setServicePaused(false)
  }

  const confirm = () => {
    setShowModal(false)
    forceCloseDay()
  }

  useEffect(() => {
    if (!showModal) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal])

  if (phase !== 'service') return null

  return (
    <>
      <button
        onClick={openModal}
        className="fixed bottom-20 right-4 z-30 px-3 py-1.5 bg-[#2c1a0e]/80 text-[#8b7355] border border-[#5c3d1e] rounded text-xs hover:bg-[#3a2410] hover:text-[#c8b89a] transition-colors"
        aria-label="本日の営業を終了する"
      >
        本日の営業を終了する
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-label="営業終了確認"
        >
          <div className="bg-[#f5f0e8] rounded-2xl shadow-2xl p-8 w-96 flex flex-col gap-5 border-2 border-[#8b4513]">
            <div className="text-center">
              <div className="text-2xl mb-1">🏮</div>
              <h2 className="text-lg font-bold text-[#2c1a0e] tracking-widest">本日の営業を終了しますか？</h2>
            </div>

            <p className="text-sm text-[#5c3d1e] text-center leading-relaxed">
              未接客のお客様{' '}
              <span className="font-bold text-[#c0392b]">{skippedCustomers}</span>{' '}
              名がお帰りになります。
              <br />
              評判{' '}
              <span className="font-bold text-[#c0392b]">-{skippedCustomers}</span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-2 bg-[#5c3d1e] text-[#f5f0e8] rounded-lg text-sm hover:bg-[#4a2e1a] transition-colors"
              >
                営業を続ける
              </button>
              <button
                onClick={confirm}
                className="flex-1 py-2 bg-[#c0392b] text-white font-bold rounded-lg text-sm hover:bg-[#a93226] transition-colors"
              >
                終了する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
