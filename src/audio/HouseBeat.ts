// Procedural 128 BPM house beat synthesized via Web Audio API.
// Placeholder for MVP — swap to file-based playback later by dropping
// loops into public/audio/music/ and pointing a new loader at them.

export type Intensity = 0 | 1 | 2

export class HouseBeat {
  private ctx: AudioContext | null = null
  private bpm = 128
  private lookaheadMs = 25
  private scheduleAheadSec = 0.1
  private nextNoteTime = 0
  private current16th = 0
  private timerId: number | null = null
  private intensity: Intensity = 0
  private masterGain: GainNode | null = null
  private filter: BiquadFilterNode | null = null

  private get secondsPer16th() {
    return 60 / this.bpm / 4
  }

  async start() {
    if (this.ctx) return
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.55
    this.filter = this.ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.value = 20000
    this.masterGain.connect(this.filter)
    this.filter.connect(this.ctx.destination)
    this.nextNoteTime = this.ctx.currentTime + 0.05
    this.current16th = 0
    this.scheduler()
  }

  stop() {
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }

  setIntensity(i: Intensity) {
    this.intensity = i
  }

  setTripMode(enabled: boolean) {
    if (!this.filter || !this.ctx) return
    const now = this.ctx.currentTime
    this.filter.frequency.cancelScheduledValues(now)
    this.filter.frequency.linearRampToValueAtTime(
      enabled ? 600 : 20000,
      now + 0.25,
    )
  }

  playGameOver() {
    if (!this.ctx) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const noise = ctx.createBufferSource()
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    noise.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(2200, t)
    bp.frequency.exponentialRampToValueAtTime(180, t + 0.45)
    bp.Q.value = 8
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.6, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
    noise.connect(bp).connect(g).connect(ctx.destination)
    noise.start(t)
    noise.stop(t + 0.55)
  }

  private scheduler = () => {
    if (!this.ctx) return
    while (
      this.nextNoteTime <
      this.ctx.currentTime + this.scheduleAheadSec
    ) {
      this.scheduleNote(this.current16th, this.nextNoteTime)
      this.nextNoteTime += this.secondsPer16th
      this.current16th = (this.current16th + 1) % 16
    }
    this.timerId = window.setTimeout(this.scheduler, this.lookaheadMs)
  }

  private scheduleNote(step: number, time: number) {
    // 4-on-the-floor kick
    if (step % 4 === 0) this.kick(time)
    // open hat on off-8ths
    if (step % 4 === 2) this.hat(time, true)
    // closed hat sixteenths (intensity 1+)
    if (this.intensity >= 1 && step % 2 === 1) this.hat(time, false)
    // clap on 2 and 4
    if (this.intensity >= 1 && (step === 4 || step === 12)) this.clap(time)
    // acid bass pattern
    if (step === 0 || step === 3 || step === 6 || step === 10) {
      this.bass(time, step)
    }
    // lead stab (intensity 2)
    if (this.intensity >= 2 && step === 12) this.lead(time)
  }

  private kick(time: number) {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.frequency.setValueAtTime(150, time)
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1)
    g.gain.setValueAtTime(1, time)
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.3)
    osc.connect(g).connect(this.masterGain!)
    osc.start(time)
    osc.stop(time + 0.3)
  }

  private hat(time: number, open: boolean) {
    const ctx = this.ctx!
    const noise = ctx.createBufferSource()
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    noise.buffer = buf
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 7000
    const g = ctx.createGain()
    const dur = open ? 0.12 : 0.04
    g.gain.setValueAtTime(open ? 0.25 : 0.15, time)
    g.gain.exponentialRampToValueAtTime(0.001, time + dur)
    noise.connect(hp).connect(g).connect(this.masterGain!)
    noise.start(time)
    noise.stop(time + dur)
  }

  private clap(time: number) {
    const ctx = this.ctx!
    const noise = ctx.createBufferSource()
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    noise.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1500
    bp.Q.value = 1.5
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.35, time)
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.08)
    noise.connect(bp).connect(g).connect(this.masterGain!)
    noise.start(time)
    noise.stop(time + 0.15)
  }

  private bass(time: number, step: number) {
    const ctx = this.ctx!
    // A minor: A1, A1, E1, G1
    const freqs: Record<number, number> = { 0: 55, 3: 55, 6: 41.2, 10: 49 }
    const freq = freqs[step] ?? 55
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(900, time)
    lp.frequency.exponentialRampToValueAtTime(180, time + 0.22)
    lp.Q.value = 6
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.28, time)
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.27)
    osc.connect(lp).connect(g).connect(this.masterGain!)
    osc.start(time)
    osc.stop(time + 0.3)
  }

  private lead(time: number) {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = 220
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(4500, time)
    lp.frequency.exponentialRampToValueAtTime(600, time + 0.35)
    lp.Q.value = 3
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.12, time)
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.4)
    osc.connect(lp).connect(g).connect(this.masterGain!)
    osc.start(time)
    osc.stop(time + 0.4)
  }
}
