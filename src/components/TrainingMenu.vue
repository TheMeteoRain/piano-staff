<script setup lang="ts">
import Button from '@/volt/Button.vue'
import { Icon } from '@iconify/vue'
import { RouterLink, useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { useMidiNavStore, VIEW_KEYS, midiKeyName } from '@/stores/midiNav'
import MidiKeyBadge from '@/components/MidiKeyBadge.vue'

/** A 2-column grid of card-style navigation tiles — shared by the training
 * category and exercise-selection pages. Each tile shows its symbol(s) above a
 * stylized label. When MIDI navigation is on, each tile is also reachable by a
 * key (C2, D2, … in tile order) and shows that key as a badge. */
const props = defineProps<{
  items: { to: string; label: string; icons: string[] }[]
}>()

const router = useRouter()
const navStore = useMidiNavStore()

// each tile gets a view key (C2, D2, …) in order for MIDI, plus a keyboard digit
// (4, 5, … after the footer nav's 1–3) so the nav can be debugged without a
// device. Badge shows whichever input set is active.
function kbdFor(i: number): string | undefined {
  return 4 + i <= 9 ? String(4 + i) : undefined
}
function tileBadge(i: number): string {
  return navStore.navVia === 'keyboard' ? (kbdFor(i) ?? '') : midiKeyName(VIEW_KEYS[i])
}

onMounted(() => {
  props.items.forEach((item, i) => {
    const k = VIEW_KEYS[i]
    if (k != null) navStore.register(k, () => router.push(item.to), kbdFor(i))
  })
})
onUnmounted(() => {
  props.items.forEach((_, i) => {
    const k = VIEW_KEYS[i]
    if (k != null) navStore.unregister(k)
  })
})
</script>

<template>
  <section>
    <nav class="grid grid-cols-2 gap-4">
      <router-link
        v-for="(item, i) in items"
        :key="item.to"
        :to="item.to"
        v-slot="{ href, navigate }"
        class="relative"
      >
        <MidiKeyBadge
          v-if="navStore.active && VIEW_KEYS[i] != null"
          :label="tileBadge(i)"
          class="tile-key"
        />
        <Button :href="href" @click="navigate" class="w-full h-36">
          <span class="flex flex-col items-center justify-center gap-3">
            <span class="flex items-center gap-2 text-4xl leading-none">
              <Icon
                v-for="icon in item.icons"
                :key="icon"
                :icon="icon"
                width="36"
                height="36"
              />
            </span>
            <span class="text-base font-semibold tracking-wide">
              {{ item.label }}
            </span>
          </span>
        </Button>
      </router-link>
    </nav>
  </section>
</template>

<style scoped>
.tile-key {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
}
</style>
