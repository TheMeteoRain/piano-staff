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
})
type Settings = z.infer<typeof SettingsSchema>

const initSettings = {
  secondsBetweenNotes: 3,
  questionTimeLimit: 5,
  showLastNoteQuessed: true,
}

export const useSettingsStore = defineStore('settings', () => {
  const localStorage = useLocalStorage()
  localStorage.initializeStorageItems('settings', initSettings)
  const values = ref<Settings>(localStorage.getStorageItem('settings') as Settings)

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

  const computedValue = (key: keyof Settings) =>
    computed({
      get: () => values.value[key],
      set: (value) => set(key, value),
    })
  const secondsBetweenNotes = computedValue('secondsBetweenNotes')
  const questionTimeLimit = computedValue('questionTimeLimit')
  const showLastNoteQuessed = computedValue('showLastNoteQuessed')
  const resolver = zodResolver(SettingsSchema)

  return {
    values,
    set,
    resolver,
    secondsBetweenNotes,
    questionTimeLimit,
    showLastNoteQuessed,
  }
})
