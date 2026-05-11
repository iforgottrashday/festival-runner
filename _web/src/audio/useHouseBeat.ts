import { useEffect, useRef } from 'react'
import { HouseBeat, type Intensity } from './HouseBeat'

export function useHouseBeat() {
  const beatRef = useRef<HouseBeat | null>(null)
  if (!beatRef.current) beatRef.current = new HouseBeat()

  useEffect(() => {
    const beat = beatRef.current!
    return () => beat.stop()
  }, [])

  return {
    start: () => beatRef.current!.start(),
    stop: () => beatRef.current!.stop(),
    setIntensity: (i: Intensity) => beatRef.current!.setIntensity(i),
    setTripMode: (b: boolean) => beatRef.current!.setTripMode(b),
    playGameOver: () => beatRef.current!.playGameOver(),
  }
}
