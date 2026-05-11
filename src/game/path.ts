// A path is a queue of segments. Each segment is a straight run of some
// length that ends with a 90° turn left or right. The player must trigger
// the turn (matching the segment's turnDir) within the turn window before
// hitting the wall at the end.

export type TurnDir = 'left' | 'right'

export type Segment = {
  length: number
  turnDir: TurnDir
}

const MIN_LEN = 55
const MAX_LEN = 95

export function makeSegment(prev?: Segment): Segment {
  // Bias toward alternating directions so the player doesn't get the
  // same turn twice in a row — keeps the rhythm interesting.
  const flipChance = prev ? 0.7 : 0.5
  const turnDir: TurnDir = prev
    ? Math.random() < flipChance
      ? prev.turnDir === 'left'
        ? 'right'
        : 'left'
      : prev.turnDir
    : Math.random() < 0.5
      ? 'left'
      : 'right'
  return {
    length: MIN_LEN + Math.random() * (MAX_LEN - MIN_LEN),
    turnDir,
  }
}

export function makeInitialPath(count = 4): Segment[] {
  const out: Segment[] = []
  for (let i = 0; i < count; i++) out.push(makeSegment(out[i - 1]))
  return out
}

// Last N units of a segment count as the turn window — the player must
// press the matching direction key (or swipe) during this band.
export const TURN_WINDOW_DIST = 14

// Duration of the "trip" flash effect during a successful turn (seconds).
export const TURN_FLASH_DURATION = 0.28
