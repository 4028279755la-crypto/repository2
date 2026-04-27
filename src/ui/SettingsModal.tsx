import { useState, useEffect } from 'react'
import { audioManager, type AudioSettings } from '../core/audio'
import { useGameStore } from '../store/gameStore'

interface Props {
  onClose: () => void
}

export default function SettingsModal({ onClose }: Props) {
  const [settings, setSettings] = useState<AudioSettings>(audioManager.getSettings())
  const resetTutorial = useGameStore((s) => s.resetTutorial)
  const resetMeta = useGameStore((s) => s.resetMeta)
  const [confirmReset, setConfirmReset] = useState(false)

  const update = (patch: Partial<AudioSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    audioManager.updateSettings(patch)
    if (patch.reduceMotion !== undefined) {
      document.documentElement.classList.toggle('reduce-motion', patch.reduceMotion)
    }
  }

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleResetTutorial = () => {
    resetTutorial()
    onClose()
  }

  const handleResetMeta = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    resetMeta()
    setConfirmReset(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label="設定"
    >
      <div className="bg-[#f5f0e8] rounded-2xl shadow-2xl p-6 w-80 flex flex-col gap-4 border-2 border-[#8b4513]">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[#2c1a0e] tracking-widest">⚙️ 設定</h2>
          <button onClick={onClose} className="text-[#8b7355] hover:text-[#2c1a0e] text-xl leading-none">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <SliderRow
            label="SE 音量"
            value={settings.seVolume}
            onChange={(v) => update({ seVolume: v })}
            disabled={settings.muted}
          />
          <SliderRow
            label="BGM 音量"
            value={settings.bgmVolume}
            onChange={(v) => update({ bgmVolume: v })}
            disabled={settings.muted}
          />
          <ToggleRow
            label="🔇 ミュート"
            value={settings.muted}
            onChange={(v) => update({ muted: v })}
          />
          <ToggleRow
            label="♿ モーション軽減"
            value={settings.reduceMotion}
            onChange={(v) => update({ reduceMotion: v })}
          />
        </div>

        <div className="border-t border-[#c8b89a] pt-3 flex flex-col gap-2">
          <span className="text-[10px] text-[#8b7355] tracking-wider">データ管理</span>
          <button
            onClick={handleResetTutorial}
            className="w-full py-2 bg-[#5c3d1e] text-[#f5f0e8] rounded-lg text-xs hover:bg-[#4a2e1a] transition-colors"
          >
            📖 チュートリアルをもう一度見る
          </button>
          <button
            onClick={handleResetMeta}
            className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${
              confirmReset
                ? 'bg-[#c0392b] text-white hover:bg-[#a93226]'
                : 'bg-[#e8e0d0] text-[#5c3d1e] hover:bg-[#d8d0c0]'
            }`}
          >
            {confirmReset ? '⚠ 本当にリセットする？（もう一度押す）' : '🗑 進行データをリセット'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-[#2c1a0e] text-[#f0d060] font-bold rounded-lg text-sm hover:bg-[#4a2e1a] transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}

function SliderRow({
  label, value, onChange, disabled,
}: { label: string; value: number; onChange: (v: number) => void; disabled: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-[#5c3d1e]">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range" min="0" max="1" step="0.05"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#c0392b] disabled:opacity-40"
      />
    </div>
  )
}

function ToggleRow({
  label, value, onChange,
}: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#5c3d1e]">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
          value ? 'bg-[#c0392b] text-white' : 'bg-[#e8e0d0] text-[#5c3d1e] hover:bg-[#d8d0c0]'
        }`}
      >
        {value ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}
