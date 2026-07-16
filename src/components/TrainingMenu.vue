<script setup lang="ts">
import Button from '@/volt/Button.vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

/** A 2-column grid of card-style navigation tiles — shared by the training
 * category and exercise-selection pages. Each tile shows its symbol(s) above a
 * stylized label. */
defineProps<{
  items: { to: string; label: string; icons: string[] }[]
}>()
</script>

<template>
  <section>
    <nav class="grid grid-cols-2 gap-4">
      <router-link
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        v-slot="{ href, navigate }"
      >
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
