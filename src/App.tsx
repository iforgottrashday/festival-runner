import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './game/Scene'
import { HUD } from './ui/HUD'
import { TripFlash } from './ui/TripFlash'
import { TurnPrompt } from './ui/TurnPrompt'
import { useControls } from './game/useControls'
import { useHouseBeat } from './audio/useHouseBeat'
import { gameStore, useIsTurning } from './game/store'
import './App.css'

// Expose for dev/debugging — accessible at window.gs in the browser console.
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  ;(window as unknown as { gs: typeof gameStore }).gs = gameStore
}

function App() {
  useControls()
  const audio = useHouseBeat()
  const isTurning = useIsTurning()

  // Filter the music during the trip-flash for a satisfying audio cue.
  useEffect(() => {
    audio.setTripMode(isTurning)
  }, [audio, isTurning])

  const handleStart = async () => {
    await audio.start()
    audio.setIntensity(0)
    gameStore.start()
  }

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <Scene audio={audio} />
      </Canvas>
      <TurnPrompt />
      <TripFlash />
      <HUD onStart={handleStart} />
    </>
  )
}

export default App
