import { useGameStore } from '../store/gameStore'
import type { Ingredient, Rarity } from '../core/types'

const RARITY_STYLES: Record<Rarity, { border: string; bg: string; label: string; labelColor: string }> = {
  common:   { border: 'border-[#8a9a58]',  bg: 'bg-[#f0f4e0]', label: 'コモン',   labelColor: 'text-[#8a9a58]'  },
  uncommon: { border: 'border-[#2c6090]',  bg: 'bg-[#e0eaf4]', label: 'アンコモン', labelColor: 'text-[#2c6090]'  },
  rare:     { border: 'border-[#8b4513]',  bg: 'bg-[#f4e8d0]', label: 'レア',     labelColor: 'text-[#8b4513]'  },
  epic:     { border: 'border-[#6a0dad]',  bg: 'bg-[#f0e0f8]', label: 'エピック',  labelColor: 'text-[#6a0dad]'  },
}

function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
  const style = RARITY_STYLES[ingredient.rarity]

  return (
    <div
      className={`flex flex-col gap-1 p-3 rounded-lg border-2 ${style.border} ${style.bg} cursor-pointer hover:scale-105 transition-transform duration-150 select-none min-w-[100px]`}
      role="button"
      aria-label={`${ingredient.name}を選択`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold ${style.labelColor}`}>{style.label}</span>
        <span className="text-[10px] text-[#8b7355]">¥{ingredient.sellValue.toLocaleString()}</span>
      </div>

      <div className="flex items-center justify-center text-3xl py-1" aria-hidden="true">
        {INGREDIENT_EMOJI[ingredient.type]}
      </div>

      <div className="text-center font-bold text-sm text-[#2c1a0e]">{ingredient.name}</div>

      {ingredient.tags.length > 0 && (
        <div className="flex flex-wrap gap-0.5 justify-center">
          {ingredient.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[8px] px-1 py-0.5 rounded bg-[#2c1a0e]/10 text-[#5c3d1e]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {ingredient.effects.length > 0 && (
        <div className="text-[9px] text-[#c0392b] text-center">
          {ingredient.effects[0]}
        </div>
      )}
    </div>
  )
}

const INGREDIENT_EMOJI: Record<string, string> = {
  maguro: '🐟',
  salmon: '🐠',
  hirame: '🐡',
  tamago: '🥚',
  uni:    '🦔',
  ika:    '🦑',
  anago:  '🐍',
  ebi:    '🦐',
  ikura:  '🟠',
}

export default function DraftPanel() {
  const inventory = useGameStore((s) => s.run?.inventory ?? [])

  const displayCards = inventory.slice(0, 4)

  return (
    <section
      className="shrink-0 px-4 py-3 bg-[#f5f0e8] border-b border-[#c8b89a]"
      aria-label="食材ドラフトパネル"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-[#5c3d1e] tracking-wider">
          ── 朝市 ── 食材を選んでください
        </h2>
        <span className="text-xs text-[#8b7355]">{displayCards.length} / 4 枚</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {displayCards.map((ing) => (
          <IngredientCard key={ing.id} ingredient={ing} />
        ))}
      </div>
    </section>
  )
}
