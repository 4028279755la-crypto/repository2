// ピクセルアート画像パスマップ（public/art/ingredients/ の PNG ファイル）
// ingredients.json の ID をキーに使用。
// 該当する PNG がない食材は getIngredientArt が null を返し、フォールバック表示になる。

export const INGREDIENT_ART: Record<string, string> = {
  // ── ベース食材 ──────────────────────────────────────────────────────────────
  ing_maguro:  '/art/ingredients/maguro.png',
  ing_salmon:  '/art/ingredients/salmon.png',
  ing_hirame:  '/art/ingredients/hirame.png',
  ing_tamago:  '/art/ingredients/tamago.png',
  ing_uni:     '/art/ingredients/uni.png',
  ing_ika:     '/art/ingredients/ika.png',
  ing_nori:    '/art/ingredients/nori.png',
  ing_kyuri:   '/art/ingredients/kyuri.png',
  ing_anago:   '/art/ingredients/anago.png',
  ing_ikura:   '/art/ingredients/ikura.png',

  // ── プレミアム / 将来追加予定食材 ────────────────────────────────────────
  ing_otoro:            '/art/ingredients/otoro.png',
  ing_uni_premium:      '/art/ingredients/uni_premium.png',
  ing_hokkaido_ikura:   '/art/ingredients/hokkaido_ikura.png',
  ing_anago_premium:    '/art/ingredients/anago_premium.png',
  ing_hirame_kobujime:  '/art/ingredients/hirame_kobujime.png',
}

export function getIngredientArt(ingredientId: string): string | null {
  return INGREDIENT_ART[ingredientId] ?? null
}
