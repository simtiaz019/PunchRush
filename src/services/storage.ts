import type { Character, Difficulty, GameMode } from '../types'

const keys = { character: 'punchrush.character', scores: 'punchrush.scores', settings: 'punchrush.settings' }
export const getCharacter = (): Character | null => { try { const value = localStorage.getItem(keys.character); return value ? JSON.parse(value) : null } catch { return null } }
export const saveCharacter = (character: Character) => localStorage.setItem(keys.character, JSON.stringify(character))
export const removeCharacter = () => localStorage.removeItem(keys.character)
type Scores = Record<string, number>
const scores = (): Scores => { try { return JSON.parse(localStorage.getItem(keys.scores) || '{}') } catch { return {} } }
export const scoreKey = (mode: GameMode, difficulty: Difficulty) => `${mode}:${difficulty}`
export const highScore = (mode: GameMode, difficulty: Difficulty) => scores()[scoreKey(mode, difficulty)] || 0
export const saveHighScore = (mode: GameMode, difficulty: Difficulty, value: number) => { const s = scores(); const k = scoreKey(mode, difficulty); const before = s[k] || 0; if (value > before) { s[k] = value; localStorage.setItem(keys.scores, JSON.stringify(s)); return true } return false }
export type Preferences = { sound: boolean; music: boolean; vibration: boolean; volume: number }
const defaultPrefs: Preferences = { sound: true, music: true, vibration: true, volume: .6 }
export const getPreferences = (): Preferences => { try { return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(keys.settings) || '{}') } } catch { return defaultPrefs } }
export const savePreferences = (p: Preferences) => localStorage.setItem(keys.settings, JSON.stringify(p))
export const deleteAllData = () => Object.values(keys).forEach(k => localStorage.removeItem(k))
