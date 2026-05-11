import { useSyncExternalStore } from 'react'
import {
  makeInitialPath,
  makeSegment,
  TURN_FLASH_DURATION,
  TURN_WINDOW_DIST,
  type Segment,
  type TurnDir,
} from './path'

export type GameStatus = 'idle' | 'playing' | 'gameover'
export type Lane = -1 | 0 | 1

export const LANE_WIDTH = 2.2

interface GameState {
  status: GameStatus
  score: number
  highScore: number
  lane: Lane
  // visual-only mutable fields (mutated in useFrame; do NOT notify on these)
  laneX: number
  jumpY: number
  isJumping: boolean
  jumpStart: number
  speed: number
  distance: number
  tripMode: boolean
  tripEnd: number
  // path state
  segments: Segment[]
  distAlong: number
  isTurning: boolean
  turnFlashEnd: number // performance.now()/1000 timestamp
  // distAlong value when the active turn was triggered — drives the
  // rotation progress so the camera reaches ±π/2 exactly when the player
  // reaches the corner.
  turnStartDistAlong: number
  turnsCompleted: number
  // Camera/world rotation around Y axis. Animates ±π/2 during a turn,
  // snaps back to 0 when the new segment loads.
  worldRotation: number
  // Dev/test only — freezes all game motion when true. Set via window.gs in
  // the browser console for inspection.
  paused: boolean
}

const state: GameState = {
  status: 'idle',
  score: 0,
  highScore: Number(localStorage.getItem('fr.highScore') ?? '0'),
  lane: 0,
  laneX: 0,
  jumpY: 0,
  isJumping: false,
  jumpStart: 0,
  speed: 12,
  distance: 0,
  tripMode: false,
  tripEnd: 0,
  segments: makeInitialPath(),
  distAlong: 0,
  isTurning: false,
  turnFlashEnd: 0,
  turnStartDistAlong: 0,
  turnsCompleted: 0,
  worldRotation: 0,
  paused: false,
}

const listeners = new Set<() => void>()
function notify() {
  listeners.forEach((l) => l())
}

export const gameStore = {
  raw: state,
  subscribe(cb: () => void) {
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  },

  start() {
    state.status = 'playing'
    state.score = 0
    state.lane = 0
    state.laneX = 0
    state.jumpY = 0
    state.isJumping = false
    state.speed = 12
    state.distance = 0
    state.tripMode = false
    state.segments = makeInitialPath()
    state.distAlong = 0
    state.isTurning = false
    state.turnFlashEnd = 0
    state.turnsCompleted = 0
    state.worldRotation = 0
    notify()
  },

  gameOver() {
    if (state.status !== 'playing') return
    state.status = 'gameover'
    if (state.score > state.highScore) {
      state.highScore = state.score
      localStorage.setItem('fr.highScore', String(state.score))
    }
    notify()
  },

  toIdle() {
    state.status = 'idle'
    notify()
  },

  moveLeft() {
    if (state.status !== 'playing' || state.isTurning) return
    if (state.lane > -1) {
      state.lane = (state.lane - 1) as Lane
      notify()
    }
  },

  moveRight() {
    if (state.status !== 'playing' || state.isTurning) return
    if (state.lane < 1) {
      state.lane = (state.lane + 1) as Lane
      notify()
    }
  },

  jump(now: number) {
    if (state.status !== 'playing' || state.isJumping || state.isTurning) return
    state.isJumping = true
    state.jumpStart = now
    notify()
  },

  /** Returns true if the input was consumed as a turn. */
  tryTurn(dir: TurnDir, now: number): boolean {
    if (state.status !== 'playing' || state.isTurning) return false
    const seg = state.segments[0]
    if (!seg) return false
    const distRemaining = seg.length - state.distAlong
    if (distRemaining > TURN_WINDOW_DIST) return false
    if (seg.turnDir !== dir) return false
    // Successful turn. Rotation is driven by distance traveled (not time)
    // so the camera reaches 90° exactly when the player reaches the corner.
    state.isTurning = true
    state.turnFlashEnd = now + TURN_FLASH_DURATION
    state.turnStartDistAlong = state.distAlong
    notify()
    return true
  },

  /** Called after the trip-flash completes — snap to the next segment. */
  completeTurn() {
    if (!state.isTurning) return
    state.segments.shift()
    state.segments.push(makeSegment(state.segments[state.segments.length - 1]))
    state.distAlong = 0
    state.isTurning = false
    state.lane = 0
    state.laneX = 0
    state.worldRotation = 0
    state.turnsCompleted += 1
    state.score += 50 // bonus for nailing the turn
    notify()
  },

  triggerTrip(now: number) {
    state.tripMode = true
    state.tripEnd = now + 4
    notify()
  },

  endTripIfDue(now: number) {
    if (state.tripMode && now >= state.tripEnd) {
      state.tripMode = false
      notify()
    }
  },
}

export function useGameStatus() {
  return useSyncExternalStore(
    gameStore.subscribe,
    () => state.status,
    () => state.status,
  )
}
export function useScore() {
  return useSyncExternalStore(
    gameStore.subscribe,
    () => state.score,
    () => state.score,
  )
}
export function useHighScore() {
  return useSyncExternalStore(
    gameStore.subscribe,
    () => state.highScore,
    () => state.highScore,
  )
}
export function useTripMode() {
  return useSyncExternalStore(
    gameStore.subscribe,
    () => state.tripMode,
    () => state.tripMode,
  )
}
export function useIsTurning() {
  return useSyncExternalStore(
    gameStore.subscribe,
    () => state.isTurning,
    () => state.isTurning,
  )
}
