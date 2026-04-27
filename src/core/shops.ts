import type { ShopDef, ShopId } from './types'

export const ALL_SHOPS: ShopDef[] = [
  {
    id: 'yatai',
    name: '屋台',
    description: '駆け出しの店。客数は少ないが、初期所持金にボーナス。評判の上限は60。',
    unlockNoren: 0,
    difficultyStars: 1,
    modifiers: {
      startingCashBonus: 500,
      reputationCap: 60,
      customerCountMultiplier: 0.85,
    },
  },
  {
    id: 'rojiura',
    name: '路地裏',
    description: '常連が高頻度で通う店。客の忍耐+1で落ち着いた営業ができる。',
    unlockNoren: 50,
    difficultyStars: 2,
    modifiers: {
      patienceBonus: 1,
    },
  },
  {
    id: 'ekimae',
    name: '駅前',
    description: '客数多く回転重視。観光客の支払いに+20%。',
    unlockNoren: 150,
    difficultyStars: 3,
    modifiers: {
      customerCountMultiplier: 1.15,
      touristPayoutMultiplier: 1.2,
    },
  },
  {
    id: 'ginza',
    name: '銀座',
    description: '富裕層メインの高級店。富裕層必須コンボの報酬x1.5。競合店イベントが頻発する。',
    unlockNoren: 400,
    difficultyStars: 4,
    modifiers: {
      wealthyComboBonus: 0.5,
      rivalShopFrequent: true,
    },
  },
  {
    id: 'overseas',
    name: '海外NYC',
    description: '創作流派が映える舞台。創作タグコンボに大きなボーナス、伝統客は減る。',
    unlockNoren: 1000,
    difficultyStars: 5,
    modifiers: {
      fusionComboBonus: 1.0,
      traditionalCustomerPenalty: 0.5,
    },
  },
]

export function getShop(id: ShopId): ShopDef {
  const shop = ALL_SHOPS.find((s) => s.id === id)
  if (!shop) return ALL_SHOPS[0]
  return shop
}
