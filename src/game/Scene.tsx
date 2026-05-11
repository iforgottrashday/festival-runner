import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Player } from './Player'
import { Track } from './Track'
import { Obstacles } from './Obstacles'
import { gameStore } from './store'
import type { Intensity } from '../audio/HouseBeat'

type Audio = {
  setIntensity: (i: Intensity) => void
  setTripMode: (b: boolean) => void
  playGameOver: () => void
}

export function Scene({ audio }: { audio: Audio }) {
  const scoreAccum = useRef(0)
  const lastIntensity = useRef<Intensity>(0)
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 4.5, 6.5)
    camera.lookAt(0, 1, -8)
  }, [camera])

  useFrame((_state, dt) => {
    const s = gameStore.raw
    if (s.status !== 'playing') return
    // distance-based passive score
    scoreAccum.current += s.speed * dt * 0.5
    if (scoreAccum.current >= 1) {
      const add = Math.floor(scoreAccum.current)
      scoreAccum.current -= add
      s.score += add
    }
    // intensity ramp
    const intensity: Intensity =
      s.score > 1500 ? 2 : s.score > 500 ? 1 : 0
    if (intensity !== lastIntensity.current) {
      lastIntensity.current = intensity
      audio.setIntensity(intensity)
    }
  })

  const handleCollide = () => {
    audio.playGameOver()
    audio.setIntensity(0)
    gameStore.gameOver()
  }
  const handleScore = (n: number) => {
    if (gameStore.raw.status === 'playing') gameStore.raw.score += n
  }

  return (
    <>
      <fog attach="fog" args={['#1a0633', 18, 60]} />
      <color attach="background" args={['#0a0118']} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} castShadow />
      <pointLight position={[0, 4, 4]} color="#ff2bd6" intensity={3} distance={12} />
      <pointLight position={[-4, 3, -10]} color="#00ffff" intensity={2.5} distance={15} />
      <pointLight position={[4, 3, -20]} color="#ffd400" intensity={2.5} distance={15} />

      <Track />
      <Player />
      <Obstacles onCollide={handleCollide} onScore={handleScore} />
    </>
  )
}
