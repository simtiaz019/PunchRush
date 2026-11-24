let context: AudioContext | null = null
const getContext = () => context ||= new AudioContext()
export const tone = (frequency: number, duration = .08, type: OscillatorType = 'square', volume = .06) => {
  try { const c = getContext(); const o = c.createOscillator(), g = c.createGain(); o.type=type; o.frequency.setValueAtTime(frequency,c.currentTime); g.gain.setValueAtTime(volume,c.currentTime); g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration); o.connect(g).connect(c.destination); o.start();o.stop(c.currentTime+duration) } catch { /* audio is optional */ }
}
export const punchSound = () => tone([110,145,190,250][Math.floor(Math.random()*4)], .09, 'sawtooth')
export const countdownSound = (last = false) => tone(last ? 620 : 360, .12, 'square', .05)
export const endSound = () => { tone(190,.15,'triangle'); setTimeout(() => tone(130,.22,'triangle'), 120) }
let musicTimer: number | undefined
export const startMusic = (volume = .6) => {
  if (musicTimer) return
  const notes = [165, 220, 247, 330, 247, 220, 196, 220]; let step = 0
  musicTimer = window.setInterval(() => tone(notes[step++ % notes.length], .09, 'square', .018 * volume), 145)
}
export const stopMusic = () => { if (musicTimer) window.clearInterval(musicTimer); musicTimer = undefined }
