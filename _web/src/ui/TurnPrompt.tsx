import { useEffect, useState } from 'react'
import { gameStore } from '../game/store'
import { TURN_WINDOW_DIST } from '../game/path'
import './TurnPrompt.css'

type PromptState = {
  visible: boolean
  turnDir: 'left' | 'right'
}

// distAlong is mutated outside React, so we poll once per frame and only
// re-render the prompt when its visibility or direction changes.
function useTurnPromptState(): PromptState {
  const [s, setS] = useState<PromptState>({ visible: false, turnDir: 'right' })
  useEffect(() => {
    let id: number
    const tick = () => {
      const g = gameStore.raw
      const seg = g.segments[0]
      const visible =
        g.status === 'playing' && !g.isTurning && !!seg &&
        seg.length - g.distAlong < TURN_WINDOW_DIST
      const turnDir = seg?.turnDir ?? 'right'
      setS((prev) =>
        prev.visible === visible && prev.turnDir === turnDir ? prev : { visible, turnDir },
      )
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])
  return s
}

export function TurnPrompt() {
  const { visible, turnDir } = useTurnPromptState()
  return (
    <div className={`turn-prompt${visible ? ' show' : ''} dir-${turnDir}`}>
      {turnDir === 'left' ? (
        <>
          <span className="arrow">←</span>
          <span className="word">TURN LEFT</span>
        </>
      ) : (
        <>
          <span className="word">TURN RIGHT</span>
          <span className="arrow">→</span>
        </>
      )}
    </div>
  )
}
