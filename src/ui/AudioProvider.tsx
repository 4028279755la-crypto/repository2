import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { audioManager, type SeName } from '../core/audio'
import type { Phase } from '../core/types'

const PHASE_SE: Partial<Record<Phase, SeName>> = {
  service:        'day_start',
  closing:        'day_end',
  critic_review:  'boss_appear',
  morning_market: 'ui_modal',
  news:           'ui_modal',
  result:         'ui_modal',
}

export default function AudioProvider() {
  useEffect(() => {
    const unsub = useGameStore.subscribe((s, prev) => {
      // Phase transitions
      if (s.phase !== prev.phase) {
        const se = PHASE_SE[s.phase]
        if (se) audioManager.playSe(se)
      }

      // Combo flash → combo_success
      if (s.comboFlash && s.comboFlash !== prev.comboFlash) {
        audioManager.playSe('combo_success')
      }

      // Sushi served (no combo → sushi_serve; combo sound already covers it)
      if (s.dailyServedSlots > prev.dailyServedSlots && !s.comboFlash) {
        audioManager.playSe('sushi_serve')
      }

      // Walkout → customer_angry
      if (s.dailyWalkedOut > prev.dailyWalkedOut) {
        audioManager.playSe('customer_angry')
      }

      // Rice placed
      if (s.cookingSession !== null && prev.cookingSession === null) {
        audioManager.playSe('rice_place')
      }

      // Neta added
      if (
        s.cookingSession !== null &&
        prev.cookingSession !== null &&
        s.cookingSession.netaIds.length > prev.cookingSession.netaIds.length
      ) {
        audioManager.playSe('neta_place')
      }

      // Mistake: orderStartedAt decreased (time penalty applied)
      if (s.phase === 'service' && s.orderStartedAt < prev.orderStartedAt && prev.orderStartedAt > 0) {
        audioManager.playSe('mistake')
      }

      // Unlock purchased: norenValue decreased
      if (s.meta.norenValue < prev.meta.norenValue) {
        audioManager.playSe('unlock')
      }

      // New customer started (order index advanced)
      if (s.phase === 'service' && s.currentOrderIdx > prev.currentOrderIdx) {
        audioManager.playSe('customer_arrive')
      }
    })
    return unsub
  }, [])

  return null
}
