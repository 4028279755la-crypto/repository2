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
import ShopSelectScreen from './ShopSelectScreen'
import SchoolSelectScreen from './SchoolSelectScreen'
import UnlockScreen from './UnlockScreen'
import ApprenticeScreen from './ApprenticeScreen'
import RecordScreen from './RecordScreen'
import EarlyCloseButton from './EarlyCloseButton'
import { useGameStore } from '../store/gameStore'

export default function Layout() {
  const phase = useGameStore((s) => s.phase)

  // ラン外のメニュー画面はフルスクリーンで占有
  if (phase === 'title') return <TitleScreen />
  if (phase === 'shop_select') return <ShopSelectScreen />
  if (phase === 'school_select') return <SchoolSelectScreen />
  if (phase === 'unlock_menu') return <UnlockScreen />
  if (phase === 'apprentice_menu') return <ApprenticeScreen />
  if (phase === 'record_menu') return <RecordScreen />

  return (
    <div className="flex flex-col h-screen bg-[#f5f0e8] text-[#1a1a1a] font-['Noto_Sans_JP',sans-serif] overflow-hidden">
      <HUD />
      <ShopView />
      <DraftPanel />
      <OrderTicker />

      <EarlyCloseButton />
      {phase === 'news' && <NewsModal />}
      {phase === 'closing' && <ClosingModal />}
      {phase === 'critic_review' && <CriticReview />}
      {phase === 'result' && <ResultScreen />}
      {phase === 'gameover' && <GameOver />}
    </div>
  )
}
