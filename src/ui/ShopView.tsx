import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { INGREDIENT_EMOJI } from '../core/logic'
import type { Ingredient } from '../core/types'
import ingredientsData from '../data/ingredients.json'

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
      {/* ネタ（最大3層に積む） */}
      {netas.map((neta, i) => {
        const yOffset = -6 - i * 4
        return (
          <g key={i}>
            <rect
              x="-13"
              y={yOffset}
              width="26"
              height="6"
              rx="2"
              fill={getNetaColor(neta.type)}
              stroke="#00000022"
              strokeWidth="0.5"
            />
            {i === 0 && (
              <text x="0" y={yOffset + 4.5} textAnchor="middle" fontSize="5" fill="#ffffff" fontWeight="bold">
                {neta.name}
              </text>
            )}
          </g>
        )
      })}
      {/* WIPラベル */}
      <text x="0" y="22" textAnchor="middle" fontSize="6" fill="#8b7355">
        {netas.length === 0
          ? 'シャリ準備'
          : `${INGREDIENT_EMOJI[netas[0].type] ?? '🍣'}握り中 (${netas.length}貫)`}
      </text>
    </g>
  )
}

// ── コンボテロップ ──────────────────────────────────────────────────────────

function ComboFlashOverlay() {
  const comboFlash = useGameStore((s) => s.comboFlash)
  const clearComboFlash = useGameStore((s) => s.clearComboFlash)

  useEffect(() => {
    if (!comboFlash) return
    const id = setTimeout(() => clearComboFlash(), COMBO_FLASH_DURATION_MS)
    return () => clearTimeout(id)
  }, [comboFlash, clearComboFlash])

  if (!comboFlash) return null

  return (
    <g transform="translate(240, 110)" aria-live="polite" pointerEvents="none">
      <rect x="-110" y="-22" width="220" height="44" rx="8" fill="#2c1a0e" stroke="#f0d060" strokeWidth="2" opacity="0.95" />
      <text x="0" y="-2" textAnchor="middle" fontSize="14" fill="#f0d060" fontWeight="bold">
        ★ {comboFlash.comboName}
      </text>
      <text x="0" y="14" textAnchor="middle" fontSize="11" fill="#c0392b" fontWeight="bold">
        x{comboFlash.multiplier.toFixed(1)} コンボ成立！
      </text>
    </g>
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

  const showWip = phase === 'service' && cookingSession !== null

  return (
    <section
      className="flex-1 flex items-center justify-center bg-[#ede5d0] border-b border-[#c8b89a] overflow-hidden"
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

        {/* コンボ成立テロップ（一定時間で消える） */}
        <ComboFlashOverlay />

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

        {/* 暖簾 */}
        <rect x="0" y="0" width="480" height="18" fill="#2c1a0e" />
        <text x="240" y="13" textAnchor="middle" fontSize="10" fill="#f0d060" fontFamily="sans-serif">
          ── 寿司ドラフト ──
        </text>
        <rect x="60"  y="0" width="20" height="22" fill="#c0392b" />
        <rect x="180" y="0" width="20" height="22" fill="#c0392b" />
        <rect x="280" y="0" width="20" height="22" fill="#c0392b" />
        <rect x="400" y="0" width="20" height="22" fill="#c0392b" />
      </svg>
    </section>
  )
}
