import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { gameStore } from './store'

const TILE_LENGTH = 8
const TILE_COUNT = 12

export function Track() {
  const tiles = useRef<Mesh[]>([])

  useFrame((_state, dt) => {
    const s = gameStore.raw
    if (s.status !== 'playing') return
    s.distance += s.speed * dt
    // gentle speed ramp
    s.speed = Math.min(30, 12 + s.distance / 80)

    const totalLen = TILE_LENGTH * TILE_COUNT
    for (let i = 0; i < tiles.current.length; i++) {
      const tile = tiles.current[i]
      if (!tile) continue
      // tiles loop: shift by speed, wrap when past camera
      tile.position.z += s.speed * dt
      if (tile.position.z > 6) {
        tile.position.z -= totalLen
      }
    }
  })

  return (
    <group>
      {Array.from({ length: TILE_COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) tiles.current[i] = el
          }}
          position={[0, -0.01, -i * TILE_LENGTH + 6]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[7, TILE_LENGTH]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#1a0633' : '#0d0322'}
            emissive={i % 2 === 0 ? '#3a0a66' : '#1a0533'}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}

      {/* Lane stripes — emissive neon lines */}
      {[-1, 1].map((x) => (
        <mesh
          key={`stripe-${x}`}
          position={[x * 1.1, 0, -40]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.08, 200]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      ))}

      {/* Side rails */}
      {[-1, 1].map((x) => (
        <mesh key={`rail-${x}`} position={[x * 3.5, 0.5, -40]}>
          <boxGeometry args={[0.15, 1, 200]} />
          <meshStandardMaterial
            color={x < 0 ? '#ff00ff' : '#00ffff'}
            emissive={x < 0 ? '#ff00ff' : '#00ffff'}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}
    </group>
  )
}
