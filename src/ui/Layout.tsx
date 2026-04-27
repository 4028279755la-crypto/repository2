import HUD from './HUD'
import ShopView from './ShopView'
import DraftPanel from './DraftPanel'
import OrderTicker from './OrderTicker'
import ClosingModal from './ClosingModal'
import GameOver from './GameOver'
import { useGameStore } from '../store/gameStore'

export default function Layout() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="flex flex-col h-screen bg-[#f5f0e8] text-[#1a1a1a] font-['Noto_Sans_JP',sans-serif] overflow-hidden">
      <HUD />
      <ShopView />
      <DraftPanel />
      <OrderTicker />

      {phase === 'closing' && <ClosingModal />}
      {phase === 'gameover' && <GameOver />}
    </div>
  )
}
