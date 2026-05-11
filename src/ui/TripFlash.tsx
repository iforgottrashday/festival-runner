import { useIsTurning } from '../game/store'
import './TripFlash.css'

export function TripFlash() {
  const isTurning = useIsTurning()
  return <div className={`trip-flash${isTurning ? ' on' : ''}`} />
}
