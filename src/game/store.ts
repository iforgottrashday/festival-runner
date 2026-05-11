import { useSyncExternalStore } from 'react'

export type GameStatus = 'idle' | 'playing' | 'gameover'
export type Lane = -1 | 0 | 1

export const LANE_WIDTH = 2.2
export const SERVICE_LANES: Lane[] = [-1, 0, 1]

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
    if (state.status !== 'playing') return
    if (state.lane > -1) {
      state.lane = (state.lane - 1) as Lane
      notify()
    }
  },

  moveRight() {
    if (state.status !== 'playing') return
    if (state.lane < 1) {
      state.lane = (state.lane + 1) as Lane
      notify()
    }
  },

  jump(now: number) {
    if (state.status !== 'playing' || state.isJumping) return
    state.isJumping = true
    state.jumpStart = now
    notify()
  },

  triggerTrip(now: number) {
    state.tripMode = true
    state.tripEnd = now + 4 // seconds
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
