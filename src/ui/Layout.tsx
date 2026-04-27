import HUD from './HUD'
import ShopView from './ShopView'
import DraftPanel from './DraftPanel'
import OrderTicker from './OrderTicker'

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-[#f5f0e8] text-[#1a1a1a] font-['Noto_Sans_JP',sans-serif] overflow-hidden">
      <HUD />
      <ShopView />
      <DraftPanel />
      <OrderTicker />
    </div>
  )
}
