import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { gameStore, LANE_WIDTH, type Lane } from './store'

const POOL_SIZE = 16
const SPAWN_Z = -60
const KILL_Z = 8
const MIN_GAP = 14
// Don't spawn within this many units of the end-of-segment wall, so the
// player has clear lanes to focus on the turn cue.
const TURN_CLEARANCE = 22

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
  // Track the last (status, turnsCompleted) tuple. When either changes,
  // we clear the pool synchronously inside useFrame — this avoids the
  // race where a useEffect-driven reset runs *after* the first frame's
  // collision check, leaving stale obstacles to instantly kill the player.
  const lastResetKey = useRef('')

  useFrame((_state, deltaSec) => {
    const s = gameStore.raw

    const resetKey = `${s.status}:${s.turnsCompleted}`
    if (resetKey !== lastResetKey.current) {
      lastResetKey.current = resetKey
      if (s.status === 'playing') {
        for (const o of pool) {
          o.active = false
          o.z = 0
          o.scored = false
        }
      }
    }

    if (s.status !== 'playing' || s.isTurning || s.paused) return

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
      mesh.scale.y = o.type === 'jumpable' ? 0.5 : 1.4
      mesh.position.y = mesh.scale.y / 2
      mesh.visible = true

      if (o.z < furthest) furthest = o.z

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

      if (!o.scored && o.z > 1.5) {
        o.scored = true
        onScore(10)
      }

      if (o.z > KILL_Z) {
        o.active = false
      }
    }

    // Don't spawn obstacles in the lead-up to the wall — the player needs
    // a clean lane to spot the turn arrow and react.
    const seg = s.segments[0]
    const distToWall = seg ? seg.length - s.distAlong : Infinity
    const spawnAllowed = distToWall > TURN_CLEARANCE

    if (spawnAllowed && furthest > SPAWN_Z + MIN_GAP) {
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
