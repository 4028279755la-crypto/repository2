import React, { useState } from 'react'
import { getIngredientArt } from '../data/ingredient-art'

// ── IngredientImage ───────────────────────────────────────────────────────────

interface IngredientImageProps {
  ingredientId: string
  size?: number       // px、デフォルト 64
  className?: string
}

export const IngredientImage = React.memo(function IngredientImage({
  ingredientId,
  size = 64,
  className = '',
}: IngredientImageProps) {
  const [failed, setFailed] = useState(false)
  const artPath = getIngredientArt(ingredientId)

  if (!artPath || failed) {
    return (
      <span
        className={`pixel-art-fallback inline-block ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    )
  }

  return (
    <img
      src={artPath}
      alt=""
      width={size}
      height={size}
      className={`pixel-art ${className}`}
      onError={() => setFailed(true)}
      aria-hidden="true"
      draggable={false}
    />
  )
})

// ── WipSushiSprite ────────────────────────────────────────────────────────────
// 製作中の寿司を可視化する div ベースのコンポーネント。
// SVG 外（HTML コンテキスト）で使用する。

interface WipSushiSpriteProps {
  netaIds: string[]
  plateWidth?: number   // px、皿の幅（デフォルト 96）
}

export const WipSushiSprite = React.memo(function WipSushiSprite({
  netaIds,
  plateWidth = 96,
}: WipSushiSpriteProps) {
  const count = netaIds.length
  // ネタ枚数に応じてアイコンサイズを変える
  const imgSize = count === 0 ? 0 : count === 1 ? 56 : count === 2 ? 40 : 32

  return (
    <div
      className="flex flex-col items-center"
      style={{ width: plateWidth }}
      aria-hidden="true"
    >
      {/* ネタ列 */}
      {count > 0 && (
        <div className="flex gap-1 justify-center mb-1">
          {netaIds.map((id) => (
            <IngredientImage key={id} ingredientId={id} size={imgSize} />
          ))}
        </div>
      )}

      {/* シャリ + 皿（SVG 楕円） */}
      <svg
        width={plateWidth}
        height={Math.round(plateWidth * 0.42)}
        viewBox="0 0 100 42"
        aria-hidden="true"
      >
        {/* 皿 */}
        <ellipse cx="50" cy="32" rx="48" ry="10" fill="#f5f0e8" stroke="#c8b89a" strokeWidth="2" />
        {/* シャリ */}
        <ellipse cx="50" cy="24" rx="34" ry="12" fill="#fffff0" stroke="#e8e0d0" strokeWidth="1.5" />
        {count === 0 && (
          <text x="50" y="27" textAnchor="middle" fontSize="8" fill="#c8b89a" fontFamily="sans-serif">
            シャリのみ
          </text>
        )}
      </svg>
    </div>
  )
})
