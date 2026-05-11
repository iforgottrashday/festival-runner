import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { gameStore, LANE_WIDTH, useGameStatus, type Lane } from './store'

const POOL_SIZE = 16
const SPAWN_Z = -80
const KILL_Z = 8
const MIN_GAP = 14

type ObstacleType = 'block' | 'jumpable'

type Obstacle = {
  active: boolean
  lane: Lane
  z: number
  type: ObstacleType
  scored: boolean
}

export function Obstacles({
  onCollide,
  onScore,
}: {
  onCollide: () => void
  onScore: (n: number) => void
}) {
  const groupRef = useRef<Group>(null!)
  const pool = useMemo<Obstacle[]>(
    () =>
      Array.from({ length: POOL_SIZE }, () => ({
        active: false,
        lane: 0,
        z: 0,
        type: 'block',
        scored: false,
      })),
    [],
  )
  const status = useGameStatus()

  // Clear pool whenever a new run begins so stale obstacles from a previous
  // game don't instantly collide with the respawned player.
  useEffect(() => {
    if (status === 'playing') {
      for (const o of pool) {
        o.active = false
        o.z = 0
        o.scored = false
      }
    }
  }, [status, pool])

  useFrame((_state, deltaSec) => {
    const s = gameStore.raw
    if (s.status !== 'playing') return

    const meshes = groupRef.current.children
    let furthest = 0
    const dt = Math.min(0.05, deltaSec)

    for (let i = 0; i < pool.length; i++) {
      const o = pool[i]
      const mesh = meshes[i]
      if (!o.active) {
        mesh.visible = false
        continue
      }
      o.z += s.speed * dt
      mesh.position.x = o.lane * LANE_WIDTH
      mesh.position.z = o.z
      // Encode type via scale.y: jumpable = short box, block = tall
      mesh.scale.y = o.type === 'jumpable' ? 0.5 : 1.4
      mesh.position.y = mesh.scale.y / 2
      // Color via material — set in render, but tweak via emissive intensity if needed
      mesh.visible = true

      if (o.z < furthest) furthest = o.z

      // collision at player z ~= 0
      if (o.z > -0.7 && o.z < 0.7) {
        const playerX = s.laneX
        const obsX = o.lane * LANE_WIDTH
        const dx = Math.abs(playerX - obsX)
        const jumpClear = o.type === 'jumpable' && s.jumpY > 0.55
        if (dx < 0.7 && !jumpClear) {
          onCollide()
          return
        }
      }

      // score when passed
      if (!o.scored && o.z > 1.5) {
        o.scored = true
        onScore(10)
      }

      if (o.z > KILL_Z) {
        o.active = false
      }
    }

    if (furthest > SPAWN_Z + MIN_GAP) {
      const free = pool.find((o) => !o.active)
      if (free) {
        free.active = true
        free.lane = ([-1, 0, 1] as Lane[])[Math.floor(Math.random() * 3)]
        free.z = SPAWN_Z
        free.type = Math.random() < 0.3 ? 'jumpable' : 'block'
        free.scored = false
      }
    }
  })

  return (
    <group ref={groupRef}>
      {pool.map((_, i) => (
        <mesh key={i} visible={false} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#ffd400"
            emissive="#ff5500"
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}
