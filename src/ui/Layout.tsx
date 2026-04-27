import { useEffect, useRef, useState } from 'react'
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
import AudioProvider from './AudioProvider'
import TutorialModal from './TutorialModal'
import DebugPanel from './DebugPanel'
import { useGameStore } from '../store/gameStore'

const SHOW_DEBUG = import.meta.env.DEV
  && typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('debug')

function useScreenShake(trigger: number): boolean {
  const [shaking, setShaking] = useState(false)
  const prevTrigger = useRef(trigger)
  useEffect(() => {
    if (trigger > prevTrigger.current) {
      prevTrigger.current = trigger
      setShaking(true)
      const t = setTimeout(() => setShaking(false), 430)
      return () => clearTimeout(t)
    }
    prevTrigger.current = trigger
  }, [trigger])
  return shaking
}

function NorenDropOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none animate-noren-drop-inout"
      aria-hidden="true"
    >
      <div className="w-full h-full bg-[#2c1a0e] flex items-center justify-center">
        <span className="text-[#f0d060] tracking-[0.5em] text-2xl font-bold">── 営業開始 ──</span>
      </div>
    </div>
  )
}

function DayEndBanner({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      <div className="animate-day-end-banner text-center">
        <div className="text-[#f0d060] text-4xl font-bold tracking-widest" style={{ textShadow: '2px 2px 0 #8b4513' }}>
          本日終了
        </div>
        <div className="text-[#c8b89a] text-sm mt-2 tracking-[0.3em]">── お疲れ様でした ──</div>
      </div>
    </div>
  )
}

export default function Layout() {
  const phase = useGameStore((s) => s.phase)
  const meta = useGameStore((s) => s.meta)
  const dailyWalkedOut = useGameStore((s) => s.dailyWalkedOut)

  const shaking = useScreenShake(dailyWalkedOut)

  const [showNorenDrop, setShowNorenDrop] = useState(false)
  const [showDayEnd, setShowDayEnd] = useState(false)
  const prevPhase = useRef(phase)

  useEffect(() => {
    const prev = prevPhase.current
    prevPhase.current = phase
    if (prev === 'morning_market' && phase === 'service') {
      setShowNorenDrop(true)
      setTimeout(() => setShowNorenDrop(false), 1100)
    }
    if (prev === 'service' && phase === 'closing') {
      setShowDayEnd(true)
      setTimeout(() => setShowDayEnd(false), 1300)
    }
  }, [phase])

  // ラン外のメニュー画面はフルスクリーンで占有
  if (phase === 'title') return (
    <>
      <AudioProvider />
      <TitleScreen />
      {SHOW_DEBUG && <DebugPanel />}
    </>
  )
  if (phase === 'shop_select') return <><ShopSelectScreen />{SHOW_DEBUG && <DebugPanel />}</>
  if (phase === 'school_select') return <><SchoolSelectScreen />{SHOW_DEBUG && <DebugPanel />}</>
  if (phase === 'unlock_menu') return <><UnlockScreen />{SHOW_DEBUG && <DebugPanel />}</>
  if (phase === 'apprentice_menu') return <><ApprenticeScreen />{SHOW_DEBUG && <DebugPanel />}</>
  if (phase === 'record_menu') return <><RecordScreen />{SHOW_DEBUG && <DebugPanel />}</>


  return (
    <>
      <AudioProvider />
      <div
        id="game-layout"
        className={`flex flex-col h-screen bg-[#f5f0e8] text-[#1a1a1a] font-['Noto_Sans_JP',sans-serif] overflow-hidden${shaking ? ' animate-screen-shake' : ''}`}
      >
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

      <NorenDropOverlay visible={showNorenDrop} />
      <DayEndBanner visible={showDayEnd} />

      {!meta.tutorialSeen && <TutorialModal />}
      {SHOW_DEBUG && <DebugPanel />}
    </>
  )
}
