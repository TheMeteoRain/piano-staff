export type StorageTypes = 'stats' | 'settings'

export type Clef = 'treble' | 'bass' | 'mixed'

export type Stats = {
  guesses: {
    [key: string]: {
      averageMs: number
      totalGuesses: number
      correctGuesses: number
      incorrectGuesses: number
      guessRate: number
    }
  }
  exercise: Clef
  startTime: string
  endTime: string | null
}

export type SavedStats = {
  exercises: {
    treble: Stats[]
    bass: Stats[]
    mixed: Stats[]
  }
}
