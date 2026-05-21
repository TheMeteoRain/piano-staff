import type { StorageTypes } from '@/types/global'

export function resetLocalStorageItem(storage: StorageTypes, data: unknown) {
  cleanLocalStorageItem(storage)
  initializeStorageItem(storage, data)
}

export function cleanLocalStorageItem(storage: StorageTypes) {
  localStorage.removeItem(storage)
}

export function initializeStorageItem(storage: StorageTypes, data: unknown) {
  if (!localStorage.getItem(storage)) {
    saveStorage(storage, data)
    return true
  }
  return false
}

export function saveStorage(storage: StorageTypes, data: unknown) {
  localStorage.setItem(storage, JSON.stringify(data))
}

export function getStorage(storage: StorageTypes) {
  const item = localStorage.getItem(storage)
  if (!item) {
    return item
  }

  return JSON.parse(item)
}
