import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { BALANCE } from '../core/balance'

/**
 * 開発用デバッグパネル。
 * `?debug=1` クエリ + DEV ビルド時のみ表示される。
 * 本番ビルドでは Layout 側で完全に分岐されるためバンドルにすら含まれないよう
 * dynamic import するのが理想だが、簡易のため import.meta.env.DEV で判定する。
 */
export default function DebugPanel() {
  const run = useGameStore((s) => s.run)
  const phase = useGameStore((s) => s.phase)
  const meta = useGameStore((s) => s.meta)
  const todayDifficulty = useGameStore((s) => s.todayDifficulty)
  const todayEvent = useGameStore((s) => s.todayEvent)
  const draftHand = useGameStore((s) => s.draftHand)
  const serviceOrders = useGameStore((s) => s.serviceOrders)
  const debugAddCash = useGameStore((s) => s.debugAddCash)
  const debugAddReputation = useGameStore((s) => s.debugAddReputation)
  const debugSkipDay = useGameStore((s) => s.debugSkipDay)
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-2 right-2 z-[100] bg-[#c0392b] text-white text-xs font-bold rounded px-2 py-1 shadow-lg"
      >
        🛠 DEBUG
      </button>
    )
  }

  const cumulativeRevenue = run?.history.reduce((s, h) => s + h.revenue, 0) ?? 0

  return (
    <div className="fixed top-2 right-2 z-[100] w-80 max-h-[90vh] overflow-y-auto bg-black/85 text-[#7afc7a] text-[10px] font-mono p-3 rounded-lg border border-[#7afc7a] shadow-2xl">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-[#f0d060]">🛠 DEBUG PANEL</span>
        <button onClick={() => setCollapsed(true)} className="text-[#f0d060]">－</button>
      </div>

      <Section title="STATE">
        <Row k="phase" v={phase} />
        <Row k="day" v={`${run?.currentDay ?? 0}/${BALANCE.MAX_DAY}`} />
        <Row k="cash" v={`¥${run?.cash.toLocaleString() ?? 0}`} />
        <Row k="reputation" v={`${run?.reputation ?? 0}/${BALANCE.REPUTATION_MAX}`} />
        <Row k="cumulative ¥" v={`¥${cumulativeRevenue.toLocaleString()}`} />
        <Row k="norenValue" v={meta.norenValue} />
      </Section>

      {todayDifficulty && (
        <Section title="DIFFICULTY">
          <Row k="segment" v={`${todayDifficulty.segment} (${todayDifficulty.label})`} />
          <Row k="客数" v={`${todayDifficulty.customerCountMin}-${todayDifficulty.customerCountMax}`} />
          <Row k="patienceMod" v={todayDifficulty.patienceModifier} />
          <Row k="timeMul" v={todayDifficulty.timeLimitMultiplier} />
          <Row k="wealthyBonus" v={todayDifficulty.wealthyChanceBonus} />
        </Section>
      )}

      {todayEvent && (
        <Section title="TODAY EVENT">
          <Row k="id" v={todayEvent.id} />
          <Row k="effect" v={JSON.stringify(todayEvent.effect)} />
        </Section>
      )}

      {draftHand.length > 0 && (
        <Section title="DRAFT HAND">
          {draftHand.map((ing) => (
            <Row key={ing.id} k={ing.name} v={`${ing.rarity} ¥${ing.basePrice}`} />
          ))}
        </Section>
      )}

      {serviceOrders.length > 0 && (
        <Section title="SERVICE ORDERS">
          {serviceOrders.slice(0, 5).map((o, i) => (
            <Row key={o.id} k={`#${i + 1} ${o.customerId.replace('cus_', '')}`} v={`忍耐${o.patience} ${Math.round(o.timeLimit / 1000)}s`} />
          ))}
          {serviceOrders.length > 5 && <Row k="..." v={`+${serviceOrders.length - 5}`} />}
        </Section>
      )}

      <Section title="CHEATS">
        <div className="grid grid-cols-2 gap-1 mt-1">
          <CheatBtn label="+¥10,000" onClick={() => debugAddCash(10_000)} />
          <CheatBtn label="+¥1,000" onClick={() => debugAddCash(1_000)} />
          <CheatBtn label="評判+10" onClick={() => debugAddReputation(10)} />
          <CheatBtn label="評判-10" onClick={() => debugAddReputation(-10)} />
          <CheatBtn label="翌日スキップ" onClick={debugSkipDay} />
          <CheatBtn label="再読込" onClick={() => location.reload()} />
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 border-t border-[#3a6a3a] pt-1">
      <div className="text-[#f0d060] font-bold mb-0.5">{title}</div>
      {children}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between gap-2 leading-tight">
      <span className="text-[#7afc7a]/70 truncate">{k}</span>
      <span className="text-[#7afc7a] truncate">{String(v)}</span>
    </div>
  )
}

function CheatBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#3a6a3a] hover:bg-[#5a8a5a] text-[#f0d060] text-[10px] font-bold py-1 rounded transition-colors"
    >
      {label}
    </button>
  )
}
