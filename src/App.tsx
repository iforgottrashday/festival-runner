import { Canvas } from '@react-three/fiber'
import { Scene } from './game/Scene'
import { HUD } from './ui/HUD'
import { useControls } from './game/useControls'
import { useHouseBeat } from './audio/useHouseBeat'
import { gameStore } from './game/store'
import './App.css'

function App() {
  useControls()
  const audio = useHouseBeat()

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
      <HUD onStart={handleStart} />
    </>
  )
}

export default App
