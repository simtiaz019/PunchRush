import type { Difficulty, GameMode } from '../types'

export const modes: Record<GameMode, {label: string; duration: number; description: string}> = {
  classic: { label: 'Classic', duration: 10, description: '10 seconds. Maximum punches.' },
  speed: { label: 'Speed Rush', duration: 5, description: 'Five furious seconds.' },
  marathon: { label: 'Marathon', duration: 30, description: 'Thirty seconds of chaos.' },
  precision: { label: 'Precision', duration: 10, description: 'Misses hurt your arcade score.' },
  survival: { label: 'Survival', duration: 30, description: 'Three misses and you are out.' },
  moving: { label: 'Moving Target', duration: 10, description: 'Extra turbo target.' },
}
export const difficultyConfig: Record<Difficulty, {label: string; speed: number; scale: number; hitbox: number; tint: string}> = {
  easy: { label: 'Easy', speed: 180, scale: 1.12, hitbox: 1.25, tint: '#92f46b' },
  medium: { label: 'Medium', speed: 260, scale: 1, hitbox: 1, tint: '#ffe63b' },
  hard: { label: 'Hard', speed: 355, scale: .82, hitbox: .82, tint: '#ff9a4e' },
  insane: { label: 'Insane', speed: 460, scale: .68, hitbox: .68, tint: '#ff5c9d' },
}
export const rankFor = (punches: number) => {
  if (punches >= 60) return 'Punch Legend'
  if (punches >= 50) return 'Combo Master'
  if (punches >= 40) return 'Lightning Fists'
  if (punches >= 30) return 'Punch Machine'
  if (punches >= 20) return 'Speedy Hands'
  if (punches >= 10) return 'Casual Puncher'
  return 'Sleepy Sloth'
}
