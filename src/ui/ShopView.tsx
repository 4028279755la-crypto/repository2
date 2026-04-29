import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Ingredient } from '../core/types'
import type { ComboFlash } from '../store/gameStore'
import ingredientsData from '../data/ingredients.json'
import { getIngredientArt } from '../data/ingredient-art'

const allIngredients = ingredientsData as unknown as Ingredient[]

const COMBO_FLASH_DURATION_MS = 1500

// ── WIP プレート ─────────────────────────────────────────────────────────────

function WipPlate({ netaIds }: { netaIds: string[] }) {
  const netas = netaIds
    .map((id) => allIngredients.find((i) => i.id === id))
    .filter((n): n is Ingredient => n !== undefined)
  const label =
    netas.length === 0
      ? '製作中: シャリのみ'
      : `製作中: シャリ+${netas.map((n) => n.name).join('+')}`

  return (
    <g transform="translate(340, 137)" aria-label={label}>
      {/* 皿 */}
      <ellipse cx="0" cy="5" rx="30" ry="10" fill="#f5f0e8" stroke="#c8b89a" strokeWidth="1.5" />
      {/* シャリ */}
      <ellipse cx="0" cy="1" rx="18" ry="7" fill="#fffff0" stroke="#e8e0d0" strokeWidth="1" />
      {/* ネタ（PNG 画像。PNG がない場合はカラーフォールバック） */}
      {netas.length > 0 && (() => {
        const count = netas.length
        const imgSize = count === 1 ? 26 : count === 2 ? 20 : 15
        const gap = 2
        const totalW = count * imgSize + (count - 1) * gap
        const startX = -totalW / 2
        const imgY = -imgSize - 4  // 皿より上に配置

        return netas.map((neta, i) => {
          const artPath = getIngredientArt(neta.id)
          const x = startX + i * (imgSize + gap)
          return artPath ? (
            <image
              key={neta.id}
              href={artPath}
              x={x}
              y={imgY}
              width={imgSize}
              height={imgSize}
              style={{ imageRendering: 'pixelated' } as React.CSSProperties}
            />
          ) : (
            <g key={neta.id}>
              <rect
                x={x}
                y={imgY}
                width={imgSize}
                height={imgSize - 2}
                rx="2"
                fill={getNetaColor(neta.type)}
                stroke="#00000022"
                strokeWidth="0.5"
              />
              <text x={x + imgSize / 2} y={imgY + (imgSize - 2) / 2 + 2} textAnchor="middle" fontSize="4" fill="#ffffff">
                {neta.name}
              </text>
            </g>
          )
        })
      })()}
      {/* WIPラベル */}
      <text x="0" y="22" textAnchor="middle" fontSize="6" fill="#8b7355">
        {netas.length === 0
          ? 'シャリ準備'
          : `${netas[0].name}握り中 (${netas.length}貫)`}
      </text>
    </g>
  )
}

// ── コンボテロップ（div overlay） ─────────────────────────────────────────

const SPARKLE_ANGLES = [0, 60, 120, 180, 240, 300]

function ComboFlashDivOverlay({ flash, onDone }: { flash: ComboFlash; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, COMBO_FLASH_DURATION_MS)
    return () => clearTimeout(id)
  }, [flash, onDone])

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center">
        {/* Sparkles */}
        {SPARKLE_ANGLES.map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          const x = Math.cos(rad) * 110
          const y = Math.sin(rad) * 65
          return (
            <div
              key={i}
              className="absolute animate-sparkle text-2xl select-none"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
                animationDelay: `${i * 55}ms`,
              }}
              aria-hidden="true"
            >
              ✨
            </div>
          )
        })}

        {/* Main panel */}
        <div className="animate-combo-bounce flex flex-col items-center bg-[#2c1a0e]/92 border-2 border-[#f0d060] rounded-xl px-8 py-4 shadow-2xl">
          <span className="text-[#f0d060] font-bold text-xl tracking-widest">★ {flash.comboName}</span>
          <span className="text-[#c0392b] font-bold text-4xl mt-1">x{flash.multiplier.toFixed(1)}</span>
          <span className="text-[#c8b89a] text-sm mt-1">コンボ成立！</span>
        </div>
      </div>
    </div>
  )
}

function getNetaColor(type: string): string {
  const colors: Record<string, string> = {
    maguro: '#c0392b',
    salmon: '#e67e22',
    hirame: '#f5f5dc',
    tamago: '#f0d060',
    uni:    '#8b4513',
    ika:    '#ecf0f1',
    anago:  '#7f6a52',
    ebi:    '#e8a090',
    ikura:  '#c0392b',
  }
  return colors[type] ?? '#95a5a6'
}

// ── メイン ────────────────────────────────────────────────────────────────────

export default function ShopView() {
  const phase = useGameStore((s) => s.phase)
  const cookingSession = useGameStore((s) => s.cookingSession)
  const comboFlash = useGameStore((s) => s.comboFlash)
  const clearComboFlash = useGameStore((s) => s.clearComboFlash)

  const showWip = phase === 'service' && cookingSession !== null

  return (
    <section
      className="flex-1 flex items-center justify-center bg-[#ede5d0] border-b border-[#c8b89a] overflow-hidden relative"
      aria-label="店内見下ろしビュー"
    >
      <svg
        viewBox="0 0 480 240"
        className="w-full max-w-2xl h-auto"
        style={{ imageRendering: 'pixelated' }}
        aria-hidden={!showWip}
      >
        {/* 床 */}
        <rect x="0" y="0" width="480" height="240" fill="#c8a97a" />
        {/* 畳エリア */}
        <rect x="20" y="20" width="440" height="100" fill="#a8b870" rx="4" />
        {/* 畳の線 */}
        <line x1="20" y1="70" x2="460" y2="70" stroke="#8a9a58" strokeWidth="1" />
        <line x1="165" y1="20" x2="165" y2="120" stroke="#8a9a58" strokeWidth="1" />
        <line x1="315" y1="20" x2="315" y2="120" stroke="#8a9a58" strokeWidth="1" />

        {/* カウンター */}
        <rect x="20" y="130" width="440" height="30" fill="#5c3d1e" rx="2" />
        <rect x="20" y="132" width="440" height="4" fill="#7a5230" />

        {/* ネタケース */}
        <rect x="30" y="140" width="420" height="16" fill="#d0eeff" rx="2" opacity="0.7" />
        <rect x="30" y="140" width="420" height="16" fill="none" stroke="#90b8d0" strokeWidth="1" rx="2" />

        {/* WIP プレート（営業中＆シャリ準備後のみ） */}
        {showWip && <WipPlate netaIds={cookingSession.netaIds} />}

        {/* 板前（中央） */}
        <g transform="translate(150, 168)">
          <rect x="-14" y="0" width="28" height="36" fill="#f5f0e8" rx="3" />
          <rect x="-10" y="8" width="20" height="26" fill="#2c6090" rx="2" />
          <ellipse cx="0" cy="-8" rx="12" ry="11" fill="#f5cba7" />
          <rect x="-10" y="-20" width="20" height="14" fill="#f5f0e8" rx="2" />
          <rect x="-22" y="10" width="10" height="6" fill="#f5cba7" rx="2" />
          <rect x="12" y="10" width="10" height="6" fill="#f5cba7" rx="2" />
        </g>

        {/* 客1（左：観光客） */}
        <g transform="translate(90, 70)">
          <ellipse cx="0" cy="-6" rx="10" ry="9" fill="#f5cba7" />
          <rect x="-10" y="2" width="20" height="28" fill="#e74c3c" rx="2" />
          <text x="0" y="48" textAnchor="middle" fontSize="8" fill="#5c3d1e">観光客</text>
        </g>

        {/* 客2（中央：常連） */}
        <g transform="translate(240, 70)">
          <ellipse cx="0" cy="-6" rx="10" ry="9" fill="#e8c99a" />
          <rect x="-10" y="2" width="20" height="28" fill="#3498db" rx="2" />
          <text x="0" y="48" textAnchor="middle" fontSize="8" fill="#5c3d1e">常連</text>
        </g>

        {/* 客3（右：富裕層） */}
        <g transform="translate(390, 70)">
          <ellipse cx="0" cy="-6" rx="10" ry="9" fill="#f5d5a0" />
          <rect x="-10" y="2" width="20" height="28" fill="#8e44ad" rx="2" />
          <text x="0" y="48" textAnchor="middle" fontSize="8" fill="#5c3d1e">富裕層</text>
        </g>

        {/* 暖簾（揺れアニメーション） */}
        <rect x="0" y="0" width="480" height="18" fill="#2c1a0e" />
        <text x="240" y="13" textAnchor="middle" fontSize="10" fill="#f0d060" fontFamily="sans-serif">
          ── 寿司ドラフト ──
        </text>
        <rect x="60"  y="0" width="20" height="22" fill="#c0392b" className="animate-noren-swing" />
        <rect x="180" y="0" width="20" height="22" fill="#c0392b" className="animate-noren-swing" style={{ animationDelay: '0.5s' }} />
        <rect x="280" y="0" width="20" height="22" fill="#c0392b" className="animate-noren-swing" style={{ animationDelay: '1s' }} />
        <rect x="400" y="0" width="20" height="22" fill="#c0392b" className="animate-noren-swing" style={{ animationDelay: '1.5s' }} />
      </svg>

      {/* コンボ達成オーバーレイ（div版・CSS animation） */}
      {comboFlash && (
        <ComboFlashDivOverlay
          flash={comboFlash}
          onDone={clearComboFlash}
        />
      )}
    </section>
  )
}
