import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as store from '@/utils/localStorage'
import type { StorageTypes } from '@/types/global'

export const useLocalStorage = defineStore('local_storage', () => {
  const storages = ref<Record<StorageTypes | string, unknown>>({})

  function initializeStorageItems(storage: StorageTypes, data: unknown) {
    if (store.initializeStorageItem(storage, data)) {
      storages.value[storage] = data
    }
  }

  function resetStorageItem(storage: StorageTypes, data: unknown) {
    store.resetLocalStorageItem(storage, data)
    storages.value[storage] = structuredClone(data)
  }

  function updateStorageItem(
    storage: StorageTypes,
    fn: (old: unknown) => [boolean, unknown],
  ) {
    let item = storages.value[storage]
    if (!item) {
      item = store.getStorage(storage)
    }

    if (!item) {
      throw Error(`Initialize storage: "${storage}" before updating.`)
    }

    const [save, newStorageItem] = fn(item)

    if (save) {
      store.saveStorage(storage, newStorageItem)
      storages.value[storage] = newStorageItem
    }
  }

  function getStorageItem(storage: StorageTypes) {
    const item = storages.value[storage]
    if (item) {
      return item
    }
    return store.getStorage(storage)
  }

  return {
    storages,
    updateStorageItem,
    getStorageItem,
    initializeStorageItems,
    resetStorageItem,
  }
})
