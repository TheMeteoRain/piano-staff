<script setup lang="ts">
import Button from '@/volt/Button.vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

/** A vertical list of navigation buttons — shared by the training category and
 * exercise-selection pages. */
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
        <Button
          :href="href"
          @click="navigate"
          :label="item.label"
          class="w-full h-24"
        >
          <template #icon>
            <Icon
              v-for="icon in item.icons"
              :key="icon"
              :icon="icon"
              width="20"
            />
          </template>
        </Button>
      </router-link>
    </nav>
  </section>
</template>
