import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh, Group } from 'three'
import { gameStore } from './store'

const TILE_LENGTH = 8
const TILE_COUNT = 14
const TOTAL_TILE_LEN = TILE_LENGTH * TILE_COUNT
const PREVIEW_TILE_COUNT = 12 // enough to cover ~95 units (max segment length)

// Looping floor tiles for the current corridor — animated each frame.
function CurrentFloor({ tilesRef }: { tilesRef: { current: Mesh[] } }) {
  return (
    <>
      {Array.from({ length: TILE_COUNT }).map((_, i) => (
        <mesh
          key={`tile-${i}`}
          ref={(el) => {
            if (el) tilesRef.current[i] = el
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
    </>
  )
}

// Side rails belong only to the current corridor — they don't render
// well when seen edge-on as the perpendicular preview.
function CurrentSideRails() {
  return (
    <>
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
    </>
  )
}

// Static spur of floor tiles extending only IN FRONT of the corner in the
// next corridor's local frame. Brighter than the current corridor so the
// player can see the road continues even before they turn.
function PreviewSpur() {
  const spurLength = PREVIEW_TILE_COUNT * TILE_LENGTH
  return (
    <>
      {Array.from({ length: PREVIEW_TILE_COUNT }).map((_, i) => (
        <mesh
          key={`spur-tile-${i}`}
          position={[0, -0.01, -(i + 0.5) * TILE_LENGTH]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[7, TILE_LENGTH]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#260a4a' : '#1a063a'}
            emissive={i % 2 === 0 ? '#6a1abf' : '#3a0a66'}
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}
      {/* Bright center stripe along the spur to read clearly as "road continues" */}
      <mesh
        position={[0, 0.01, -spurLength / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.18, spurLength]} />
        <meshBasicMaterial color="#ffd400" />
      </mesh>
      {/* Outer edge stripes */}
      {[-1, 1].map((x) => (
        <mesh
          key={`spur-edge-${x}`}
          position={[x * 3.3, 0.01, -spurLength / 2]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.1, spurLength]} />
          <meshBasicMaterial color={x < 0 ? '#ff00ff' : '#00ffff'} />
        </mesh>
      ))}
    </>
  )
}

function TurnMarker({
  groupRef,
  arrowGroupRef,
}: {
  groupRef: React.RefObject<Group | null>
  arrowGroupRef: React.RefObject<Group | null>
}) {
  return (
    <group ref={groupRef} position={[0, 0, -50]} visible={false}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[7, 1.4, 0.3]} />
        <meshStandardMaterial
          color="#ff00aa"
          emissive="#ff00aa"
          emissiveIntensity={1.4}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <boxGeometry args={[7.2, 0.12, 0.4]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.02, 0.25]}>
        <boxGeometry args={[7.2, 0.08, 0.35]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
      <group ref={arrowGroupRef} position={[2.2, 3.4, 0]}>
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
  )
}

export function Track() {
  const tiles = useRef<Mesh[]>([])
  const markerGroup = useRef<Group>(null)
  const arrowGroup = useRef<Group>(null)
  const nextGroup = useRef<Group>(null!)

  useFrame((_state, dt) => {
    const s = gameStore.raw
    if (s.status !== 'playing') {
      if (markerGroup.current) markerGroup.current.visible = false
      if (nextGroup.current) nextGroup.current.visible = false
      return
    }
    if (s.paused) return

    s.speed = Math.min(30, 12 + s.distance / 80)

    for (let i = 0; i < tiles.current.length; i++) {
      const tile = tiles.current[i]
      if (!tile) continue
      tile.position.z += s.speed * dt
      if (tile.position.z > 6) tile.position.z -= TOTAL_TILE_LEN
    }

    const seg = s.segments[0]
    if (markerGroup.current && seg) {
      const cornerZ = -(seg.length - s.distAlong)
      markerGroup.current.position.z = cornerZ
      markerGroup.current.visible = cornerZ < 4

      if (arrowGroup.current) {
        arrowGroup.current.position.x = seg.turnDir === 'left' ? -2.2 : 2.2
        arrowGroup.current.rotation.y = seg.turnDir === 'left' ? Math.PI : 0
        const distRemaining = seg.length - s.distAlong
        const inWindow = distRemaining < 14
        const pulse = inWindow
          ? 1.0 + Math.sin(performance.now() / 80) * 0.35
          : 0.7
        arrowGroup.current.scale.setScalar(0.9 + pulse * 0.12)
      }
    }

    if (nextGroup.current && seg) {
      const cornerZ = -(seg.length - s.distAlong)
      nextGroup.current.position.set(0, 0, cornerZ)
      nextGroup.current.rotation.y =
        seg.turnDir === 'right' ? -Math.PI / 2 : Math.PI / 2
      nextGroup.current.visible = cornerZ < 4
    }
  })

  return (
    <group>
      <CurrentFloor tilesRef={tiles} />
      <CurrentSideRails />
      <TurnMarker groupRef={markerGroup} arrowGroupRef={arrowGroup} />

      <group ref={nextGroup} visible={false}>
        <PreviewSpur />
      </group>
    </group>
  )
}
