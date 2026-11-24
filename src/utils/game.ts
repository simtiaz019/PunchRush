import type { RoundStats } from '../types'
export const blankStats = (duration: number, mode: RoundStats['mode'], difficulty: RoundStats['difficulty']): RoundStats => ({ punches: 0, misses: 0, attempts: 0, combo: 0, longestCombo: 0, arcadeScore: 0, duration, mode, difficulty })
export const registerHit = (s: RoundStats): RoundStats => { const combo=s.combo+1; return {...s,punches:s.punches+1,attempts:s.attempts+1,combo,longestCombo:Math.max(s.longestCombo,combo),arcadeScore:s.arcadeScore+1+Math.floor(combo/10)} }
export const registerMiss = (s: RoundStats): RoundStats => ({...s, misses:s.misses+1, attempts:s.attempts+1, combo:0, arcadeScore: Math.max(0,s.arcadeScore-(s.mode==='precision'?2:0))})
export const accuracy = (s: Pick<RoundStats,'punches'|'attempts'>) => s.attempts ? Math.round(s.punches / s.attempts * 100) : 0
export const allowedImage = (file: File) => ['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(file.type) || /\.(jpe?g|png|webp|hei[cf])$/i.test(file.name)
export const validateImage = (file: File) => !allowedImage(file) ? 'Choose a JPEG, PNG, WebP, or HEIC image.' : file.size > 10 * 1024 * 1024 ? 'Images must be 10 MB or smaller.' : null
export const createLocalId = () => globalThis.crypto?.randomUUID?.() || `punchrush-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
