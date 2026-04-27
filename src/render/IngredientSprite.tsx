import React from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface IngredientSpriteProps {
  ingredientId: string
  size?: number
  className?: string
}

type SpriteData = { p: string[]; r: string[] }
type PixelRect = { x: number; y: number; c: string }

// ── Helpers ──────────────────────────────────────────────────────────────────

// Center a pattern string within a 16-char row, padding with '.' on both sides
function pad(s: string): string {
  if (s.length >= 16) return s.slice(0, 16)
  const total = 16 - s.length
  const l = Math.floor(total / 2)
  return '.'.repeat(l) + s + '.'.repeat(total - l)
}

function buildRects(sprite: SpriteData): PixelRect[] {
  const result: PixelRect[] = []
  for (let y = 0; y < sprite.r.length; y++) {
    const row = sprite.r[y]
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch !== '.') {
        const idx = parseInt(ch, 16)
        const color = sprite.p[idx]
        if (color !== undefined) result.push({ x, y, c: color })
      }
    }
  }
  return result
}

// ── Sprite definitions (16 rows × 16 cols) ───────────────────────────────────
// Palette slots: '0'–'f' hex index, '.' = transparent

const SPRITE_DATA: Record<string, SpriteData> = {
  // ── Tuna (マグロ) — deep red slab ──
  maguro: {
    p: ['#7b241c', '#c0392b', '#e74c3c'],
    r: [
      pad(''), pad(''),
      pad('0000000'),
      pad('011111110'),
      pad('01111111110'),
      pad('01100111110'),
      pad('01001011110'),
      pad('01001011110'),
      pad('01100111110'),
      pad('01111111110'),
      pad('011111110'),
      pad('0000000'),
      pad(''), pad(''), pad(''), pad(''),
    ],
  },

  // ── Salmon (サーモン) — orange with diagonal streaks ──
  salmon: {
    p: ['#d35400', '#e67e22', '#f39c12'],
    r: [
      pad(''), pad(''),
      pad('0000000'),
      pad('011111110'),
      pad('01212121110'),
      pad('01121212110'),
      pad('01212121110'),
      pad('01121212110'),
      pad('01212121110'),
      pad('01121212110'),
      pad('011111110'),
      pad('0000000'),
      pad(''), pad(''), pad(''), pad(''),
    ],
  },

  // ── Flounder (ヒラメ) — pale white with subtle marks ──
  hirame: {
    p: ['#7f8c8d', '#bdc3c7', '#d5d8dc', '#ecf0f1'],
    r: [
      pad(''), pad(''),
      pad('0000000'),
      pad('011111110'),
      pad('01233321110'),
      pad('01233321110'),
      pad('01222222110'),
      pad('01222222110'),
      pad('01233321110'),
      pad('01233321110'),
      pad('011111110'),
      pad('0000000'),
      pad(''), pad(''), pad(''), pad(''),
    ],
  },

  // ── Egg omelette (玉子) — bright yellow rectangle ──
  tamago: {
    p: ['#c49a06', '#f1c40f', '#f7dc6f'],
    r: [
      pad(''),
      pad('00000000000'),
      pad('01111111110'),
      pad('01222222210'),
      pad('01222222210'),
      pad('01222222210'),
      pad('01222222210'),
      pad('01222222210'),
      pad('01222222210'),
      pad('01222222210'),
      pad('01222222210'),
      pad('01111111110'),
      pad('00000000000'),
      pad(''), pad(''), pad(''),
    ],
  },

  // ── Sea urchin (ウニ) — spiky orange-gold cluster ──
  uni: {
    p: ['#d35400', '#e67e22', '#f39c12', '#f9c840'],
    r: [
      pad(''),
      pad('0.0.0.0.0'),
      pad('000000000'),
      pad('022222220'),
      pad('01222212110'),
      pad('01221312110'),
      pad('01213121110'),
      pad('01221312110'),
      pad('01222212110'),
      pad('022222220'),
      pad('000000000'),
      pad(''),
      pad(''), pad(''), pad(''), pad(''),
    ],
  },

  // ── Squid (イカ) — near-white with faint markings ──
  ika: {
    p: ['#7f8c8d', '#b2babb', '#d5d8dc', '#ecf0f1'],
    r: [
      pad(''), pad(''),
      pad('0000000'),
      pad('011111110'),
      pad('01233321110'),
      pad('01322232110'),
      pad('01232232110'),
      pad('01232232110'),
      pad('01322232110'),
      pad('01233321110'),
      pad('011111110'),
      pad('0000000'),
      pad(''), pad(''), pad(''), pad(''),
    ],
  },

  // ── Conger eel (アナゴ) — caramel-glazed brown crosshatch ──
  anago: {
    p: ['#3d2006', '#8b4513', '#c8a882'],
    r: [
      pad(''), pad(''),
      pad('00000000000'),
      pad('012222222210'),
      pad('012121211210'),
      pad('012212121210'),
      pad('012121211210'),
      pad('012212121210'),
      pad('012121211210'),
      pad('012212121210'),
      pad('012222222210'),
      pad('00000000000'),
      pad(''), pad(''), pad(''), pad(''),
    ],
  },

  // ── Shrimp (車エビ) — coral-pink slab ──
  ebi: {
    p: ['#c0392b', '#e07060', '#f4b8b0'],
    r: [
      pad(''), pad(''),
      pad('0000000'),
      pad('011111110'),
      pad('01221222110'),
      pad('01212122110'),
      pad('01221222110'),
      pad('01212122110'),
      pad('01221222110'),
      pad('01111122110'),
      pad('011111110'),
      pad('0000000'),
      pad(''), pad(''), pad(''), pad(''),
    ],
  },

  // ── Salmon roe (いくら) — cluster of red spheres ──
  ikura: {
    p: ['#7b241c', '#e74c3c', '#f39c12'],
    r: [
      pad(''), pad(''),
      pad('.00..00.'),
      pad('01100110'),
      pad('01200120'),
      pad('.00..00.'),
      pad(''),
      pad('.00..00.'),
      pad('01100110'),
      pad('01200120'),
      pad('.00..00.'),
      pad(''),
      pad(''), pad(''), pad(''), pad(''),
    ],
  },

  // ── Nori (海苔) — dark green seaweed strip ──
  nori: {
    p: ['#0a1f05', '#1a3a10', '#2d5a1e'],
    r: [
      pad(''), pad(''),
      pad('00000000000'),
      pad('01111111110'),
      pad('01212121210'),
      pad('01121212110'),
      pad('01212121210'),
      pad('01121212110'),
      pad('01212121210'),
      pad('01121212110'),
      pad('01111111110'),
      pad('00000000000'),
      pad(''), pad(''), pad(''), pad(''),
    ],
  },

  // ── Cucumber (きゅうり) — green cross-section with seeds ──
  kyuri: {
    p: ['#1a5e20', '#27ae60', '#82e0aa', '#ffffff'],
    r: [
      pad(''), pad(''),
      pad('0000000'),
      pad('011111110'),
      pad('01233221110'),
      pad('01323232110'),
      pad('01232232110'),
      pad('01232232110'),
      pad('01323232110'),
      pad('01233221110'),
      pad('011111110'),
      pad('0000000'),
      pad(''), pad(''), pad(''), pad(''),
    ],
  },

  // ── Avocado (アボカド) — green half with brown pit ──
  avocado: {
    p: ['#1e8449', '#27ae60', '#82e0aa', '#784212', '#c19060'],
    r: [
      pad(''), pad(''),
      pad('0000000'),
      pad('011111110'),
      pad('01222222110'),
      pad('01223332210'),
      pad('01234432210'),
      pad('01234432210'),
      pad('01223332210'),
      pad('01222222110'),
      pad('011111110'),
      pad('0000000'),
      pad(''), pad(''), pad(''), pad(''),
    ],
  },

  // ── Fallback for unknown types ──
  unknown: {
    p: ['#5c3d1e', '#8b7355', '#c8b89a'],
    r: [
      pad(''), pad(''),
      pad('0000000'),
      pad('011111110'),
      pad('01222222110'),
      pad('01221122110'),
      pad('01222212110'),
      pad('01222112110'),
      pad('01222212110'),
      pad('01222222110'),
      pad('011111110'),
      pad('0000000'),
      pad(''), pad(''), pad(''), pad(''),
    ],
  },
}

// Map ingredient IDs and type names to sprite keys
const SPRITE_KEY: Record<string, string> = {
  ing_maguro:  'maguro',  maguro:  'maguro',
  ing_salmon:  'salmon',  salmon:  'salmon',
  ing_hirame:  'hirame',  hirame:  'hirame',
  ing_tamago:  'tamago',  tamago:  'tamago',
  ing_uni:     'uni',     uni:     'uni',
  ing_ika:     'ika',     ika:     'ika',
  ing_anago:   'anago',   anago:   'anago',
  ing_ebi:     'ebi',     ebi:     'ebi',
  ing_ikura:   'ikura',   ikura:   'ikura',
  ing_nori:    'nori',    nori:    'nori',
  ing_kyuri:   'kyuri',   kyuri:   'kyuri',
  ing_avocado: 'avocado', avocado: 'avocado',
}

// Pre-compute pixel rect lists once at module load
const SPRITE_RECTS: Record<string, PixelRect[]> = Object.fromEntries(
  Object.entries(SPRITE_DATA).map(([k, d]) => [k, buildRects(d)])
)

// ── IngredientSprite ─────────────────────────────────────────────────────────

export const IngredientSprite = React.memo(function IngredientSprite({
  ingredientId,
  size = 48,
  className,
}: IngredientSpriteProps) {
  const key = SPRITE_KEY[ingredientId] ?? 'unknown'
  const rects = SPRITE_RECTS[key]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      {rects.map((px) => (
        <rect key={`${px.x}-${px.y}`} x={px.x} y={px.y} width={1} height={1} fill={px.c} />
      ))}
    </svg>
  )
})

// ── WipSushiSprite ───────────────────────────────────────────────────────────
// Shows a nigiri in progress: ingredient pixels on top of a white rice oval.

export const WipSushiSprite = React.memo(function WipSushiSprite({
  ingredientId,
  size = 48,
  className,
}: IngredientSpriteProps) {
  const key = SPRITE_KEY[ingredientId] ?? 'unknown'
  const rects = SPRITE_RECTS[key]

  // Crop: show only rows 2–11 of the ingredient sprite (the actual food portion)
  const topRects = rects.filter((px) => px.y >= 2 && px.y <= 11)

  return (
    <svg
      width={size}
      height={Math.round(size * 1.25)}
      viewBox="0 0 16 20"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      {/* Rice (shari) oval */}
      <ellipse cx="8" cy="17" rx="7" ry="3" fill="#fffff0" stroke="#c8b89a" strokeWidth="0.5" />
      {/* Plate rim */}
      <ellipse cx="8" cy="18" rx="8" ry="2" fill="none" stroke="#d5c9a0" strokeWidth="0.4" />
      {/* Ingredient pixels offset down by 2 rows to sit on the rice */}
      {topRects.map((px) => (
        <rect key={`${px.x}-${px.y}`} x={px.x} y={px.y} width={1} height={1} fill={px.c} />
      ))}
    </svg>
  )
})
