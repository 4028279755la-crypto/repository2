export type SeName =
  | 'ui_click' | 'ui_select' | 'ui_modal'
  | 'coin_pickup' | 'rice_place' | 'neta_place'
  | 'sushi_serve' | 'combo_success' | 'mistake'
  | 'timeout' | 'customer_arrive' | 'customer_angry'
  | 'day_start' | 'day_end' | 'boss_appear' | 'unlock'

interface NoteParams {
  freq: number
  endFreq?: number
  duration: number
  type: OscillatorType
  gain: number
}

interface SeDef {
  notes: NoteParams[]
  /** ms delay between notes */
  stagger?: number
}

const SE_DEFS: Record<SeName, SeDef> = {
  ui_click:        { notes: [{ freq: 900,  duration: 0.05, type: 'square',   gain: 0.22 }] },
  ui_select:       { notes: [{ freq: 480,  endFreq: 640, duration: 0.1,  type: 'sine',     gain: 0.32 }] },
  ui_modal:        { notes: [{ freq: 660,  duration: 0.18, type: 'sine',     gain: 0.28 }] },
  coin_pickup: {
    notes: [
      { freq: 660,  duration: 0.08, type: 'sine', gain: 0.32 },
      { freq: 880,  duration: 0.13, type: 'sine', gain: 0.32 },
    ],
    stagger: 70,
  },
  rice_place:      { notes: [{ freq: 220,  duration: 0.1,  type: 'triangle', gain: 0.38 }] },
  neta_place:      { notes: [{ freq: 540,  duration: 0.1,  type: 'sine',     gain: 0.32 }] },
  sushi_serve: {
    notes: [
      { freq: 660,  duration: 0.1,  type: 'sine', gain: 0.35 },
      { freq: 880,  duration: 0.18, type: 'sine', gain: 0.35 },
    ],
    stagger: 80,
  },
  combo_success: {
    notes: [
      { freq: 523,  duration: 0.12, type: 'sine', gain: 0.42 },
      { freq: 659,  duration: 0.12, type: 'sine', gain: 0.42 },
      { freq: 784,  duration: 0.2,  type: 'sine', gain: 0.42 },
      { freq: 1047, duration: 0.4,  type: 'sine', gain: 0.48 },
    ],
    stagger: 90,
  },
  mistake:         { notes: [{ freq: 280, endFreq: 100, duration: 0.18, type: 'sawtooth', gain: 0.22 }] },
  timeout: {
    notes: [
      { freq: 440,  duration: 0.09, type: 'square', gain: 0.28 },
      { freq: 330,  duration: 0.14, type: 'square', gain: 0.24 },
    ],
    stagger: 110,
  },
  customer_arrive: { notes: [{ freq: 440, endFreq: 550, duration: 0.14, type: 'sine',     gain: 0.25 }] },
  customer_angry: {
    notes: [
      { freq: 200, endFreq: 100, duration: 0.22, type: 'sawtooth', gain: 0.25 },
      { freq: 150,               duration: 0.22, type: 'sawtooth', gain: 0.2 },
    ],
    stagger: 180,
  },
  day_start: {
    notes: [
      { freq: 523,  duration: 0.15, type: 'sine', gain: 0.36 },
      { freq: 659,  duration: 0.15, type: 'sine', gain: 0.36 },
      { freq: 784,  duration: 0.3,  type: 'sine', gain: 0.4 },
    ],
    stagger: 100,
  },
  day_end: {
    notes: [
      { freq: 440,  duration: 0.25, type: 'sine', gain: 0.36 },
      { freq: 370,  duration: 0.5,  type: 'sine', gain: 0.3 },
    ],
    stagger: 200,
  },
  boss_appear: {
    notes: [
      { freq: 110, duration: 0.4, type: 'square', gain: 0.32 },
      { freq: 80,  endFreq: 60, duration: 0.7, type: 'square', gain: 0.28 },
    ],
    stagger: 80,
  },
  unlock: {
    notes: [
      { freq: 523,  duration: 0.09, type: 'sine', gain: 0.38 },
      { freq: 659,  duration: 0.09, type: 'sine', gain: 0.38 },
      { freq: 784,  duration: 0.09, type: 'sine', gain: 0.38 },
      { freq: 1047, duration: 0.25, type: 'sine', gain: 0.42 },
      { freq: 1319, duration: 0.4,  type: 'sine', gain: 0.48 },
    ],
    stagger: 75,
  },
}

const AUDIO_STORAGE_KEY = 'sushi-draft-audio'

export interface AudioSettings {
  seVolume: number
  bgmVolume: number
  muted: boolean
  reduceMotion: boolean
}

class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private settings: AudioSettings = {
    seVolume: 0.5,
    bgmVolume: 0.3,
    muted: false,
    reduceMotion: false,
  }
  private changeListeners: (() => void)[] = []

  constructor() {
    try {
      const raw = localStorage.getItem(AUDIO_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AudioSettings>
        this.settings = { ...this.settings, ...parsed }
      }
    } catch { /* ignore */ }
  }

  private ensureCtx(): AudioContext | null {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext()
        this.masterGain = this.ctx.createGain()
        this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.seVolume
        this.masterGain.connect(this.ctx.destination)
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return this.ctx
    } catch {
      return null
    }
  }

  playSe(name: SeName): void {
    if (this.settings.muted) return
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const def = SE_DEFS[name]
    const stagger = def.stagger ?? 0

    def.notes.forEach((note, i) => {
      const t = ctx.currentTime + (i * stagger) / 1000

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = note.type
      osc.frequency.setValueAtTime(note.freq, t)
      if (note.endFreq !== undefined) {
        osc.frequency.linearRampToValueAtTime(note.endFreq, t + note.duration)
      }

      const vol = note.gain * this.settings.seVolume
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(vol, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + note.duration)

      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start(t)
      osc.stop(t + note.duration + 0.02)
    })
  }

  getSettings(): AudioSettings {
    return { ...this.settings }
  }

  updateSettings(patch: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...patch }
    if (this.masterGain) {
      this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.seVolume
    }
    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(this.settings))
    } catch { /* ignore */ }
    this.changeListeners.forEach((fn) => fn())
  }

  subscribe(fn: () => void): () => void {
    this.changeListeners.push(fn)
    return () => {
      this.changeListeners = this.changeListeners.filter((l) => l !== fn)
    }
  }

  get reduceMotion(): boolean { return this.settings.reduceMotion }
  get muted(): boolean { return this.settings.muted }
}

export const audioManager = new AudioManager()
