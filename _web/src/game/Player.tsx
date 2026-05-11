import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { gameStore, LANE_WIDTH } from './store'

const JUMP_DURATION = 0.6
const JUMP_HEIGHT = 1.8

export function Player() {
  const ref = useRef<Mesh>(null!)

  useFrame((_state, dt) => {
    const s = gameStore.raw
    // smooth lane interpolation
    const targetX = s.lane * LANE_WIDTH
    s.laneX += (targetX - s.laneX) * Math.min(1, dt * 14)

    // jump arc
    if (s.isJumping) {
      const now = performance.now() / 1000
      const t = (now - s.jumpStart) / JUMP_DURATION
      if (t >= 1) {
        s.isJumping = false
        s.jumpY = 0
      } else {
        s.jumpY = Math.sin(t * Math.PI) * JUMP_HEIGHT
      }
    }

    ref.current.position.x = s.laneX
    ref.current.position.y = 0.5 + s.jumpY
    // slight bob while running
    ref.current.rotation.z = -s.laneX * 0.08
  })

  return (
    <mesh ref={ref} position={[0, 0.5, 0]} castShadow>
      <capsuleGeometry args={[0.4, 0.8, 4, 12]} />
      <meshStandardMaterial
        color="#ff2bd6"
        emissive="#ff2bd6"
        emissiveIntensity={0.7}
        roughness={0.3}
        metalness={0.2}
      />
    </mesh>
  )
}
