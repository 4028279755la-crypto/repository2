import HUD from './HUD'
import ShopView from './ShopView'
import DraftPanel from './DraftPanel'
import OrderTicker from './OrderTicker'
import ClosingModal from './ClosingModal'
import GameOver from './GameOver'
import NewsModal from './NewsModal'
import CriticReview from './CriticReview'
import ResultScreen from './ResultScreen'
import TitleScreen from './TitleScreen'
import { useGameStore } from '../store/gameStore'

export default function Layout() {
  const phase = useGameStore((s) => s.phase)

  if (phase === 'title') return <TitleScreen />

  return (
    <div className="flex flex-col h-screen bg-[#f5f0e8] text-[#1a1a1a] font-['Noto_Sans_JP',sans-serif] overflow-hidden">
      <HUD />
      <ShopView />
      <DraftPanel />
      <OrderTicker />

      {phase === 'news' && <NewsModal />}
      {phase === 'closing' && <ClosingModal />}
      {phase === 'critic_review' && <CriticReview />}
      {phase === 'result' && <ResultScreen />}
      {phase === 'gameover' && <GameOver />}
    </div>
  )
}
