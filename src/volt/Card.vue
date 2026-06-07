<template>
  <Card
    unstyled
    :pt="theme"
    :ptOptions="{
      mergeProps: ptViewMerge,
    }"
  >
    <template v-for="(_, slotName) in $slots" v-slot:[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
  </Card>
</template>

<script setup lang="ts">
import Card, {
  type CardPassThroughOptions,
  type CardProps,
} from 'primevue/card'
import { ref } from 'vue'
import { ptViewMerge } from './utils'

interface Props extends /* @vue-ignore */ CardProps {}
defineProps<Props>()

const theme = ref<CardPassThroughOptions>({
  root: `flex flex-col rounded-2xl
        bg-surface-0 dark:bg-surface-900
        text-surface-700 dark:text-surface-0
        border border-(--border-subtle)
        shadow-[0_8px_24px_-12px_var(--shadow-color)] dark:shadow-[0_4px_16px_-10px_var(--shadow-color)]`,
  header: ``,
  body: `p-5 flex flex-col gap-2`,
  caption: `flex flex-col gap-2`,
  title: `font-semibold text-xl text-(--primary-600) dark:text-(--primary-700)!`,
  subtitle: `text-surface-500 dark:text-surface-400`,
  content: ``,
  footer: ``,
})
</script>
