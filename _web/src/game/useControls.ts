import { useEffect } from 'react'
import { gameStore } from './store'

function nowSec() {
  return performance.now() / 1000
}

function pressLeft() {
  // In the turn window, left = turn left. Otherwise, left = lane switch.
  if (!gameStore.tryTurn('left', nowSec())) gameStore.moveLeft()
}
function pressRight() {
  if (!gameStore.tryTurn('right', nowSec())) gameStore.moveRight()
}
function pressJump() {
  gameStore.jump(nowSec())
}

export function useControls() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          pressLeft()
          break
        case 'ArrowRight':
        case 'KeyD':
          pressRight()
          break
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault()
          pressJump()
          break
      }
    }
    window.addEventListener('keydown', onKey)

    // touch swipe
    let touchStartX = 0
    let touchStartY = 0
    let touchStartT = 0
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      touchStartX = t.clientX
      touchStartY = t.clientY
      touchStartT = performance.now()
    }
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      const dx = t.clientX - touchStartX
      const dy = t.clientY - touchStartY
      const dt = performance.now() - touchStartT
      if (dt > 600) return
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      if (Math.max(absX, absY) < 30) return
      if (absX > absY) {
        if (dx > 0) pressRight()
        else pressLeft()
      } else if (dy < 0) {
        pressJump()
      }
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])
}
