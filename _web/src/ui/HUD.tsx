import {
  gameStore,
  useGameStatus,
  useScore,
  useHighScore,
} from '../game/store'
import './HUD.css'

export function HUD({ onStart }: { onStart: () => void }) {
  const status = useGameStatus()
  const score = useScore()
  const highScore = useHighScore()

  return (
    <div className="hud">
      {status === 'playing' && (
        <div className="hud-top">
          <div className="hud-score">{score.toLocaleString()}</div>
          <div className="hud-high">BEST {highScore.toLocaleString()}</div>
        </div>
      )}

      {status === 'idle' && (
        <div className="hud-overlay">
          <h1 className="hud-title">
            FESTIVAL
            <br />
            RUNNER
          </h1>
          <p className="hud-sub">survive the headliner</p>
          <button className="hud-btn" onClick={onStart}>
            PLAY
          </button>
          <div className="hud-controls">
            <div>← → / A D — switch lanes</div>
            <div>SPACE / W / ↑ — jump</div>
            <div>swipe on mobile</div>
          </div>
        </div>
      )}

      {status === 'gameover' && (
        <div className="hud-overlay">
          <h2 className="hud-title hud-title-small">WIPED OUT</h2>
          <div className="hud-final">
            <div className="hud-final-score">
              {score.toLocaleString()}
            </div>
            <div className="hud-final-best">
              BEST {highScore.toLocaleString()}
            </div>
          </div>
          <button className="hud-btn" onClick={() => {
            gameStore.toIdle()
            onStart()
          }}>
            AGAIN
          </button>
        </div>
      )}
    </div>
  )
}
