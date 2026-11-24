export type Difficulty = 'easy' | 'medium' | 'hard' | 'insane'
export type GameMode = 'classic' | 'speed' | 'marathon' | 'precision' | 'survival' | 'moving'
export type CartoonStyle = 'classic' | 'comic' | 'bobble' | 'pixel' | 'monster'
export interface Character { id: string; nickname: string; image: string; style: CartoonStyle; createdAt: number }
export interface RoundStats { punches: number; misses: number; attempts: number; combo: number; longestCombo: number; arcadeScore: number; duration: number; mode: GameMode; difficulty: Difficulty }
export interface Result extends RoundStats { accuracy: number; pps: number; personalBest: number; isPersonalBest: boolean }
