import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { audioManager } from '../core/audio'

const STEPS = [
  {
    emoji: '🛒',
    title: '朝市で食材を選ぶ',
    desc: '毎朝、手持ち資金で食材を4つ仕入れます。コンボを狙って選ぶのがコツです！',
  },
  {
    emoji: '👥',
    title: '客の注文を見る',
    desc: '今日の客は画面下のオーダーティッカーに表示されます。忍耐ゲージが切れる前に提供しましょう。',
  },
  {
    emoji: '🍣',
    title: 'シャリ → ネタ → 提供',
    desc: '「シャリ」ボタンを押してからネタを選び「提供」を押します。順序を守らないとタイムペナルティです。',
  },
  {
    emoji: '📅',
    title: '30日間生き残ろう',
    desc: '30日後に覆面調査員が来て総評価。評判・売上・コンボ数でのれん値を稼ぎ、店を成長させよう！',
  },
]

export default function TutorialModal() {
  const [step, setStep] = useState(0)
  const markTutorialSeen = useGameStore((s) => s.markTutorialSeen)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const handleNext = () => {
    audioManager.playSe('ui_click')
    if (isLast) markTutorialSeen()
    else setStep((s) => s + 1)
  }

  const handleBack = () => {
    audioManager.playSe('ui_click')
    setStep((s) => s - 1)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-label="チュートリアル"
    >
      <div className="bg-[#f5f0e8] rounded-2xl shadow-2xl p-8 w-[22rem] flex flex-col gap-5 border-2 border-[#8b4513]">
        <div className="text-center">
          <div className="text-5xl mb-2 animate-float">{current.emoji}</div>
          <div className="text-xs text-[#8b7355] mb-1">{step + 1} / {STEPS.length}</div>
          <h2 className="text-lg font-bold text-[#2c1a0e] tracking-widest">{current.title}</h2>
        </div>

        <p className="text-sm text-[#5c3d1e] text-center leading-relaxed">{current.desc}</p>

        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-[#c0392b]' : 'bg-[#c8b89a]'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 py-2 bg-[#5c3d1e] text-[#f5f0e8] rounded-lg text-sm hover:bg-[#4a2e1a] transition-colors"
            >
              ← 戻る
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-2 bg-[#c0392b] text-white font-bold rounded-lg text-sm hover:bg-[#a93226] transition-colors"
          >
            {isLast ? '始める！' : '次へ →'}
          </button>
        </div>
      </div>
    </div>
  )
}
