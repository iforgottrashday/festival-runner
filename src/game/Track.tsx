import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh, Group } from 'three'
import { gameStore } from './store'

const TILE_LENGTH = 8
const TILE_COUNT = 14

export function Track() {
  const tiles = useRef<Mesh[]>([])
  const wallGroup = useRef<Group>(null!)
  const arrowGroup = useRef<Group>(null!)

  useFrame((_state, dt) => {
    const s = gameStore.raw
    if (s.status !== 'playing') {
      // keep wall hidden when idle/gameover
      if (wallGroup.current) wallGroup.current.visible = false
      return
    }
    if (s.paused) {
      // Still render the wall in its current position so screenshots work,
      // but skip all motion updates.
      const seg = s.segments[0]
      if (wallGroup.current && seg) {
        wallGroup.current.visible = true
        wallGroup.current.position.z = -(seg.length - s.distAlong)
        if (arrowGroup.current) {
          arrowGroup.current.position.x = seg.turnDir === 'left' ? -2.2 : 2.2
          arrowGroup.current.rotation.y = seg.turnDir === 'left' ? Math.PI : 0
        }
      }
      return
    }

    // gentle speed ramp
    s.speed = Math.min(30, 12 + s.distance / 80)

    // tiles loop endlessly
    const totalLen = TILE_LENGTH * TILE_COUNT
    for (let i = 0; i < tiles.current.length; i++) {
      const tile = tiles.current[i]
      if (!tile) continue
      tile.position.z += s.speed * dt
      if (tile.position.z > 6) tile.position.z -= totalLen
    }

    // end-of-segment wall position
    const seg = s.segments[0]
    if (wallGroup.current && seg) {
      wallGroup.current.visible = true
      const wallZ = -(seg.length - s.distAlong)
      wallGroup.current.position.z = wallZ
      // hide once we're past the wall (transition snap)
      if (wallZ > 4) wallGroup.current.visible = false

      // arrow lives on the side of the turn direction and points outward
      if (arrowGroup.current) {
        arrowGroup.current.position.x = seg.turnDir === 'left' ? -2.2 : 2.2
        arrowGroup.current.rotation.y = seg.turnDir === 'left' ? Math.PI : 0

        // pulse the arrow when in the turn window — the player has to react now
        const distRemaining = seg.length - s.distAlong
        const inWindow = distRemaining < 14
        const pulse = inWindow
          ? 1.0 + Math.sin(performance.now() / 80) * 0.35
          : 0.7
        arrowGroup.current.scale.setScalar(0.9 + pulse * 0.12)
      }
    }
  })

  return (
    <group>
      {/* Looping ground tiles */}
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

      {/* Lane dividers */}
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

      {/* End-of-segment wall + turn arrow */}
      <group ref={wallGroup} position={[0, 0, -50]} visible={false}>
        {/* Main wall slab */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[7, 2.8, 0.4]} />
          <meshStandardMaterial
            color="#ff00aa"
            emissive="#ff00aa"
            emissiveIntensity={1.6}
            roughness={0.4}
          />
        </mesh>
        {/* Top neon strip */}
        <mesh position={[0, 2.85, 0]}>
          <boxGeometry args={[7.2, 0.18, 0.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Bottom neon strip */}
        <mesh position={[0, 0.05, 0.3]}>
          <boxGeometry args={[7.2, 0.1, 0.4]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
        {/* Arrow group — chevron pointing right by default ">". For a
            left turn we rotate the group 180° around Y so it points "<". */}
        <group ref={arrowGroup} position={[2.2, 4.4, 0]}>
          <mesh position={[0, 0.75, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[2.1, 0.45, 0.3]} />
            <meshBasicMaterial color="#ffd400" />
          </mesh>
          <mesh position={[0, -0.75, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[2.1, 0.45, 0.3]} />
            <meshBasicMaterial color="#ffd400" />
          </mesh>
        </group>
      </group>
    </group>
  )
}
