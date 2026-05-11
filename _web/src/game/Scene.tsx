import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
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

// Ease-in-out cubic — softer start/end than linear, sharper middle.
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function Scene({ audio }: { audio: Audio }) {
  const scoreAccum = useRef(0)
  const lastIntensity = useRef<Intensity>(0)
  const worldRef = useRef<Group>(null!)
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 4.5, 6.5)
    camera.lookAt(0, 1, -8)
  }, [camera])

  useFrame((_state, dt) => {
    const s = gameStore.raw
    if (s.status !== 'playing') {
      if (worldRef.current) worldRef.current.rotation.y = 0
      return
    }
    // Paused freezes motion but leaves current rotation intact so dev
    // inspection can capture mid-turn snapshots.
    if (s.paused) return

    const seg = s.segments[0]

    // Always advance distAlong — including during a turn so the player
    // physically travels through the corner instead of teleporting.
    if (seg) s.distAlong += s.speed * dt

    if (s.isTurning && seg) {
      // Rotation progress is the fraction of the way from turn-start to
      // the corner. Hits 1.0 exactly when distAlong reaches seg.length.
      const turnDist = Math.max(0.001, seg.length - s.turnStartDistAlong)
      const traveled = s.distAlong - s.turnStartDistAlong
      const t = Math.max(0, Math.min(1, traveled / turnDist))
      const turnDir = seg.turnDir
      // right turn = +π/2 (scene-local +X maps to world -Z = camera front),
      // left turn = -π/2.
      const target = turnDir === 'right' ? Math.PI / 2 : -Math.PI / 2
      s.worldRotation = target * easeInOutCubic(t)
      if (worldRef.current) worldRef.current.rotation.y = s.worldRotation

      if (s.distAlong >= seg.length) gameStore.completeTurn()
      return
    }

    // Normal frame — make sure rotation is exactly 0
    if (worldRef.current) worldRef.current.rotation.y = 0

    // Wall collision (player went past the corner without turning)
    if (seg && s.distAlong >= seg.length) {
      audio.playGameOver()
      audio.setIntensity(0)
      gameStore.gameOver()
      return
    }

    // Distance score (passive)
    s.distance += s.speed * dt
    scoreAccum.current += s.speed * dt * 0.5
    if (scoreAccum.current >= 1) {
      const add = Math.floor(scoreAccum.current)
      scoreAccum.current -= add
      s.score += add
    }

    // Intensity ramp from score
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

      {/* World group — rotates ±90° during a turn so the player visually
          experiences a corner. The Player itself sits at the origin so it
          spins in place rather than around any other point. */}
      <group ref={worldRef}>
        <Track />
        <Player />
        <Obstacles onCollide={handleCollide} onScore={handleScore} />
      </group>
    </>
  )
}
