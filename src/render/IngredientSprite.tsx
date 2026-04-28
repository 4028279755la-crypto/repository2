import React from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface IngredientSpriteProps {
  ingredientId: string
  size?: number
  className?: string
}

type SpriteData = { p: string[]; r: string[] }
type PixelRect = { x: number; y: number; c: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// Row helpers — every string must be exactly 16 chars
// n(s) pads an 11-char neta row:  '..' + s + '...'  (2+11+3=16)
const n = (s: string) => '..' + s + '...'
// g(s) pads a 13-char gunkan row: '.' + s + '..'    (1+13+2=16)
const g = (s: string) => '.' + s + '..'

// ── Shared rows ───────────────────────────────────────────────────────────────
// '3' = shari edge (#c8b89a), '4' = shari white (#fffff0) in EVERY nigiri palette

const EM = '................'          // empty row (16 dots)
const S7 = '.3333333333333..'          // shari top edge  (13 wide, x=1..13)
const S8 = '..344444444443..'          // shari body      (12 wide, x=2..13, 10 whites)
const SC = '..333333333333..'          // shari close     (12 wide)
const SN = '...3333333333...'          // shari narrow    (10 wide)

// Gunkan nori/rice shared rows (UNI/IKURA)
// '1'=nori, '2'=shari edge, '3'=shari white in gunkan palettes
const GB = g('1233333333321')          // gunkan body row (nori|rice inside|nori) ×7
const GN = g('1111111111111')          // gunkan nori base (full-width)
const GF = '...111111111...'           // gunkan foot (narrow nori, 3+9+4=16)

// ── Sprite definitions ────────────────────────────────────────────────────────
// Layout for NIGIRI: [EM,EM, neta×5, S7, S8×4, SC, SN, EM,EM, EM]
// Layout for GUNKAN: [EM, top×4, body×7, GN, GF, EM,EM, EM]
// Palette: p[3]=#c8b89a, p[4]=#fffff0 (shari) for all NIGIRI sprites

const SPRITE_DATA: Record<string, SpriteData> = {

  // ── マグロ (tuna) — deep red with dark veins ───────────────────────────────
  maguro: {
    p: ['#7b241c', '#c0392b', '#e74c3c', '#c8b89a', '#fffff0'],
    r: [EM, EM,
      n('01111111110'),
      n('01100011110'),  // vein at x=4,5
      n('01001101110'),  // crossing veins
      n('01100011110'),
      n('01111111110'),
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },

  // ── サーモン (salmon) — orange with diagonal fat streaks ──────────────────
  salmon: {
    p: ['#d35400', '#e67e22', '#f39c12', '#c8b89a', '#fffff0'],
    r: [EM, EM,
      n('01111111110'),
      n('01212121210'),  // fat streaks
      n('01121212110'),
      n('01212121210'),
      n('01111111110'),
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },

  // ── ヒラメ (flounder) — pale white ────────────────────────────────────────
  hirame: {
    p: ['#7f8c8d', '#bdc3c7', '#d5d8dc', '#c8b89a', '#fffff0', '#ecf0f1'],
    r: [EM, EM,
      n('01111111110'),
      n('01255552210'),  // almost-white interior (5=lightest)
      n('01522222510'),
      n('01255552210'),
      n('01111111110'),
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },

  // ── 玉子 (egg) — yellow with nori band ───────────────────────────────────
  tamago: {
    p: ['#c49a06', '#f1c40f', '#f7dc6f', '#c8b89a', '#fffff0', '#1a3a10'],
    r: [EM, EM,
      n('01222222210'),
      n('01222222210'),
      n('05555555550'),  // nori band (5=dark green)
      n('01222222210'),
      n('01222222210'),
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },

  // ── ウニ (uni) — gunkan: orange-gold sea urchin cluster ───────────────────
  uni: {
    p: ['#0a1f05', '#1a3a10', '#c8b89a', '#fffff0', '#d35400', '#e67e22', '#f39c12'],
    r: [EM,
      g('5665566556655'),  // uni fingers
      g('6556655665566'),
      g('5665566556655'),
      g('4444444444444'),  // dark base of uni
      GB, GB, GB, GB, GB, GB, GB,
      GN, GF, EM, EM],
  },

  // ── イカ (squid) — near-white with faint surface marks ───────────────────
  ika: {
    p: ['#85929e', '#b2babb', '#d5d8dc', '#c8b89a', '#fffff0', '#ecf0f1'],
    r: [EM, EM,
      n('01111111110'),
      n('01255552210'),
      n('01252255210'),
      n('01255552210'),
      n('01111111110'),
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },

  // ── アナゴ (conger eel) — brown with tare glaze crosshatch ───────────────
  anago: {
    p: ['#3d2006', '#8b4513', '#c8a882', '#c8b89a', '#fffff0'],
    r: [EM, EM,
      n('01111111110'),
      n('01212121210'),  // crosshatch
      n('01121212110'),
      n('01212121210'),
      n('01111111110'),
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },

  // ── 車エビ (shrimp) — coral-pink ─────────────────────────────────────────
  ebi: {
    p: ['#c0392b', '#e07060', '#f4b8b0', '#c8b89a', '#fffff0'],
    r: [EM, EM,
      n('01111111110'),
      n('01222111110'),
      n('01222211110'),
      n('01222111110'),
      n('01111111110'),
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },

  // ── いくら (salmon roe) — gunkan: red-orange roe spheres ─────────────────
  ikura: {
    p: ['#0a1f05', '#1a3a10', '#c8b89a', '#fffff0', '#7b241c', '#e74c3c', '#f39c12'],
    r: [EM,
      g('5554555455545'),  // roe groups (3px per roe)
      g('5665556655665'),  // roe with highlight
      g('5554555455545'),
      g('4444444444444'),  // dark flat base
      GB, GB, GB, GB, GB, GB, GB,
      GN, GF, EM, EM],
  },

  // ── 海苔 (nori) — dark green sheet on rice ────────────────────────────────
  nori: {
    p: ['#0a1f05', '#1a3a10', '#2d5a1e', '#c8b89a', '#fffff0'],
    r: [EM, EM,
      n('00000000000'),
      n('01222222210'),
      n('01221122210'),
      n('01222222210'),
      n('00000000000'),
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },

  // ── きゅうり (cucumber) — green cross-section with seeds ──────────────────
  kyuri: {
    p: ['#1a5e20', '#27ae60', '#82e0aa', '#c8b89a', '#fffff0', '#ffffff'],
    r: [EM, EM,
      n('00000000000'),
      n('01252552210'),  // 5=white seeds visible
      n('01225222210'),
      n('01252552210'),
      n('00000000000'),
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },

  // ── アボカド (avocado) — green half with brown pit ────────────────────────
  avocado: {
    p: ['#1e8449', '#27ae60', '#82e0aa', '#c8b89a', '#fffff0', '#784212'],
    r: [EM, EM,
      n('01111111110'),
      n('01222222210'),
      n('01225522210'),  // 5=brown pit
      n('01222222210'),
      n('01111111110'),
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },

  // ── 大トロ (otoro) — fatty tuna with heavy fat marbling ───────────────────
  otoro: {
    p: ['#7b241c', '#c0392b', '#e74c3c', '#c8b89a', '#fffff0', '#f5e8e0'],
    r: [EM, EM,
      n('01511511110'),  // 5=pale fat (#f5e8e0)
      n('05115551110'),
      n('01551155110'),
      n('05115551110'),
      n('01511511110'),
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },

  // ── ウニ特上 (premium uni) — vivid orange, gunkan ─────────────────────────
  uni_premium: {
    p: ['#0a1f05', '#1a3a10', '#c8b89a', '#fffff0', '#c67c2c', '#f39c12', '#f9c840'],
    r: [EM,
      g('6556655665566'),
      g('5665566556655'),
      g('6556655665566'),
      g('4444444444444'),
      GB, GB, GB, GB, GB, GB, GB,
      GN, GF, EM, EM],
  },

  // ── 北海道いくら (hokkaido ikura) — vivid large roe ──────────────────────
  hokkaido_ikura: {
    p: ['#0a1f05', '#1a3a10', '#c8b89a', '#fffff0', '#9b1c1c', '#dc2626', '#f87171'],
    r: [EM,
      g('5556555655565'),
      g('5666566656665'),
      g('5556555655565'),
      g('4444444444444'),
      GB, GB, GB, GB, GB, GB, GB,
      GN, GF, EM, EM],
  },

  // ── アナゴ高級 (premium anago) — dark glaze with gold tare ───────────────
  anago_premium: {
    p: ['#3d2006', '#7d5a30', '#c8a882', '#c8b89a', '#fffff0', '#d4a820'],
    r: [EM, EM,
      n('01111111110'),
      n('05251525210'),  // 5=gold tare highlights
      n('01515151110'),
      n('05251525210'),
      n('01111111110'),
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },

  // ── 昆布締めヒラメ (hirame kobujime) — white fish + kombu layer ──────────
  hirame_kobujime: {
    p: ['#4a6030', '#8faa60', '#d5d8dc', '#c8b89a', '#fffff0', '#1a3a10'],
    r: [EM, EM,
      n('05555555550'),  // kombu strip (5=dark kombu #1a3a10)
      n('01222222210'),  // white flesh
      n('01222222210'),
      n('01222222210'),
      n('05555555550'),  // kombu strip at bottom
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },

  // ── Fallback for unknown IDs ───────────────────────────────────────────────
  unknown: {
    p: ['#5c3d1e', '#8b7355', '#c8b89a', '#c8b89a', '#fffff0'],
    r: [EM, EM,
      n('01111111110'),
      n('01111111110'),
      n('01111111110'),
      n('01111111110'),
      n('01111111110'),
      S7, S8, S8, S8, S8, SC, SN, EM, EM],
  },
}

// ── ID → sprite key mapping ───────────────────────────────────────────────────

const SPRITE_KEY: Record<string, string> = {
  // Standard ingredients (by ID and type)
  ing_maguro:  'maguro',   maguro:  'maguro',
  ing_salmon:  'salmon',   salmon:  'salmon',
  ing_hirame:  'hirame',   hirame:  'hirame',
  ing_tamago:  'tamago',   tamago:  'tamago',
  ing_uni:     'uni',      uni:     'uni',
  ing_ika:     'ika',      ika:     'ika',
  ing_anago:   'anago',    anago:   'anago',
  ing_ebi:     'ebi',      ebi:     'ebi',
  ing_ikura:   'ikura',    ikura:   'ikura',
  ing_nori:    'nori',     nori:    'nori',
  ing_kyuri:   'kyuri',    kyuri:   'kyuri',
  ing_avocado: 'avocado',  avocado: 'avocado',
  // Premium / unlock-exclusive
  ing_otoro:            'otoro',
  ing_uni_premium:      'uni_premium',
  ing_hokkaido_ikura:   'hokkaido_ikura',
  ing_anago_premium:    'anago_premium',
  ing_hirame_kobujime:  'hirame_kobujime',
}

// Ingredients that receive the gold-border treatment
const GOLD_IDS = new Set([
  'ing_anago', 'ing_ikura', 'ing_uni', 'ing_hirame', 'ing_avocado',
  'ing_otoro', 'ing_uni_premium', 'ing_hokkaido_ikura',
  'ing_anago_premium', 'ing_hirame_kobujime',
])

// Gold border dot positions (8 points around the 16×16 perimeter)
const GOLD_DOTS: Array<{ x: number; y: number }> = [
  { x: 0,  y: 0  }, { x: 7,  y: 0  }, { x: 15, y: 0  },
  { x: 0,  y: 7  },                    { x: 15, y: 7  },
  { x: 0,  y: 15 }, { x: 7,  y: 15 }, { x: 15, y: 15 },
]
const GOLD_COLOR = '#f0c040'

// Pre-compute pixel rect lists once at module load
const SPRITE_RECTS: Record<string, PixelRect[]> = Object.fromEntries(
  Object.entries(SPRITE_DATA).map(([k, d]) => [k, buildRects(d)])
)

// ── IngredientSprite ──────────────────────────────────────────────────────────

export const IngredientSprite = React.memo(function IngredientSprite({
  ingredientId,
  size = 64,
  className,
}: IngredientSpriteProps) {
  const key = SPRITE_KEY[ingredientId] ?? 'unknown'
  const rects = SPRITE_RECTS[key] ?? SPRITE_RECTS.unknown
  const showGold = GOLD_IDS.has(ingredientId)

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
      {showGold && GOLD_DOTS.map((d) => (
        <rect key={`g-${d.x}-${d.y}`} x={d.x} y={d.y} width={1} height={1} fill={GOLD_COLOR} />
      ))}
    </svg>
  )
})

// ── WipSushiSprite ────────────────────────────────────────────────────────────
// Composite view: ingredient sprite stacked above a rice oval.

export const WipSushiSprite = React.memo(function WipSushiSprite({
  ingredientId,
  size = 64,
  className,
}: IngredientSpriteProps) {
  const key = SPRITE_KEY[ingredientId] ?? 'unknown'
  const rects = SPRITE_RECTS[key] ?? SPRITE_RECTS.unknown
  const showGold = GOLD_IDS.has(ingredientId)

  return (
    <svg
      width={size}
      height={Math.round(size * 1.1)}
      viewBox="0 0 16 18"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      {/* Ingredient sprite sits at y=0..15 */}
      {rects.map((px) => (
        <rect key={`${px.x}-${px.y}`} x={px.x} y={px.y} width={1} height={1} fill={px.c} />
      ))}
      {showGold && GOLD_DOTS.map((d) => (
        <rect key={`g-${d.x}-${d.y}`} x={d.x} y={d.y} width={1} height={1} fill={GOLD_COLOR} />
      ))}
      {/* Plate rim at y=16..17 */}
      <ellipse cx="8" cy="17" rx="8" ry="1.5" fill="#e8e0c0" stroke="#c8b89a" strokeWidth="0.3" />
    </svg>
  )
})
