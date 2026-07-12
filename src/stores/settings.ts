import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { z } from 'zod'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { useLocalStorage } from '@/stores/localStorage'

const SettingsSchema = z.object({
  secondsBetweenNotes: z.coerce
    .number()
    .min(1)
    .max(10)
    .transform((v) => Math.min(10, Math.max(1, v))),
  questionTimeLimit: z.coerce.number().min(1).max(10),
  showLastNoteQuessed: z.coerce.boolean().default(true),
  /** wrong answers before the exercise ends; 0 means unlimited */
  errorsAllowed: z.coerce.number().int().min(0).max(100),
  /** play a piano sound when a note is answered */
  soundEnabled: z.coerce.boolean().default(true),
  /** seconds the game waits after an answer before the next note starts; 0 = none */
  pauseDuration: z.coerce.number().min(0).max(10),
})
type Settings = z.infer<typeof SettingsSchema>

const initSettings = {
  secondsBetweenNotes: 3,
  questionTimeLimit: 5,
  soundEnabled: true,
  showLastNoteQuessed: true,
  errorsAllowed: 3,
  pauseDuration: 1,
}

export const useSettingsStore = defineStore('settings', () => {
  const localStorage = useLocalStorage()
  localStorage.initializeStorageItems('settings', initSettings)
  // merge onto defaults so settings saved before a new key existed still get
  // that key's default instead of undefined
  const values = ref<Settings>({
    ...initSettings,
    ...(localStorage.getStorageItem('settings') as Partial<Settings>),
  })

  function set<K extends keyof Settings>(key: K, rawValue: unknown) {
    const result = SettingsSchema.safeParse({
      ...values.value,
      [key]: rawValue,
    })

    if (result.success) {
      values.value[key] = result.data[key]
      localStorage.updateStorageItem('settings', (_old) => {
        return [true, values.value]
      })
      // const settingsStorage = localStorage.getItem('settings')
    }
  }

  const computedValue = <K extends keyof Settings>(key: K) =>
    computed({
      get: () => values.value[key],
      set: (value: Settings[K]) => set(key, value),
    })
  const secondsBetweenNotes = computedValue('secondsBetweenNotes')
  const questionTimeLimit = computedValue('questionTimeLimit')
  const showLastNoteQuessed = computedValue('showLastNoteQuessed')
  const errorsAllowed = computedValue('errorsAllowed')
  const soundEnabled = computedValue('soundEnabled')
  const pauseDuration = computedValue('pauseDuration')
  const resolver = zodResolver(SettingsSchema)

  return {
    values,
    set,
    resolver,
    secondsBetweenNotes,
    questionTimeLimit,
    showLastNoteQuessed,
    errorsAllowed,
    soundEnabled,
    pauseDuration,
  }
})
