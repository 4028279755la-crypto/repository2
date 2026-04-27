import type { SchoolDef, SchoolId } from './types'

export const ALL_SCHOOLS: SchoolDef[] = [
  {
    id: 'edomae',
    name: '江戸前流派',
    description: '伝統の江戸前。江戸前タグのコンボ報酬x1.3。',
    unlockNoren: 0,
    modifiers: { tagBonus: { edomae: 0.3 } },
  },
  {
    id: 'sosaku',
    name: '創作流派',
    description: '攻めた創作寿司。fusionタグの報酬x1.5、伝統タグは-10%。',
    unlockNoren: 200,
    modifiers: { tagBonus: { fusion: 0.5, traditional: -0.1 } },
  },
  {
    id: 'taishu',
    name: '大衆流派',
    description: '大衆向けで薄利多売。全コンボ+10%、客単価-15%だが客数+30%。',
    unlockNoren: 150,
    modifiers: {
      tagBonus: { popular: 0.1, taishu: 0.1 },
      payoutMultiplier: 0.85,
      customerCountMultiplier: 1.3,
    },
  },
]

export function getSchool(id: SchoolId): SchoolDef {
  const school = ALL_SCHOOLS.find((s) => s.id === id)
  if (!school) return ALL_SCHOOLS[0]
  return school
}
