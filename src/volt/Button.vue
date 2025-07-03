<template>
  <Button
    unstyled
    :pt="theme"
    :ptOptions="{
      mergeProps: ptViewMerge,
    }"
  >
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
  </Button>
</template>

<script setup lang="ts">
import Button, {
  type ButtonPassThroughOptions,
  type ButtonProps,
} from 'primevue/button'
import { ref } from 'vue'
import { ptViewMerge } from './utils'

interface Props extends /* @vue-ignore */ ButtonProps {}
defineProps<Props>()

const theme = ref<ButtonPassThroughOptions>({
  root: `inline-flex cursor-pointer select-none items-center justify-center overflow-hidden relative
        px-3 py-2 gap-2 rounded-md disabled:pointer-events-none disabled:opacity-60 transition-colors duration-200
        bg-(--primary) enabled:hover:bg-(--primary-600) enabled:active:bg-(--primary-700)
        border border-(--primary-700) enabled:hover:border-(--primary-800) enabled:active:border-(--primary-900)
        text-(--text-contrast) enabled:hover:text-(--text-contrast) enabled:active:text-(--text-contrast)
        dark:bg-(--primary) dark:enabled:hover:bg-(--primary-400) dark:enabled:active:bg-(--primary-300)
        dark:border-(--primary-600) dark:enabled:hover:border-(--primary-700) dark:enabled:active:border-(--primary-800)
        dark:text-(--text) dark:enabled:hover:text-(--text) dark:enabled:active:text-(--text)
        focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2
        focus-visible:outline-surface-600 dark:focus-visible:outline-surface-300
        p-vertical:flex-col p-fluid:w-full p-fluid:p-icon-only:w-10
        p-icon-only:w-10 p-icon-only:px-0 p-icon-only:gap-0
        p-icon-only:p-rounded:rounded-full p-icon-only:p-rounded:h-10
        p-small:text-sm p-small:px-[0.625rem] p-small:py-[0.375rem]
        p-large:text-[1.125rem] p-large:px-[0.875rem] p-large:py-[0.625rem]
        p-raised:shadow-sm p-rounded:rounded-[2rem]
        p-outlined:bg-(--background) enabled:hover:p-outlined:bg-surface-100 enabled:active:p-outlined:bg-surface-200
        p-outlined:border-(--primary) enabled:hover:p-outlined:border-(--primary) enabled:active:p-outlined:border-(--primary)
        p-outlined:text-(--text) enabled:hover:p-outlined:text-(--text) enabled:active:p-outlined:text-(--text)
        dark:p-outlined:bg-(--background) dark:enabled:hover:p-outlined:bg-surface-500 dark:enabled:active:p-outlined:bg-surface-600
        dark:p-outlined:border-(--primary) dark:enabled:hover:p-outlined:border-(--primary) dark:enabled:active:p-outlined:border-(--primary)
        dark:p-outlined:text-(--text) dark:enabled:hover:p-outlined:text-(--text) dark:enabled:active:p-outlined:text-(--text)
        p-text:bg-transparent enabled:hover:p-text:bg-surface-50 enabled:active:p-text:bg-surface-100
        p-text:border-transparent enabled:hover:p-text:border-transparent enabled:active:p-text:border-transparent
        p-text:text-(--text-contrast) enabled:hover:p-text:text-(--text-contrast) enabled:active:p-text:text-(--text-contrast)
        dark:p-text:bg-transparent dark:enabled:hover:p-text:bg-surface-800 dark:enabled:active:p-text:bg-surface-700
        dark:p-text:border-transparent dark:enabled:hover:p-text:border-transparent dark:enabled:active:p-text:border-transparent
        dark:p-text:text-(--text-contrast) dark:enabled:hover:p-text:text-(--text-contrast) dark:enabled:active:p-text:text-(--text-contrast)
    `,
  loadingIcon: ``,
  icon: `p-right:order-1 p-bottom:order-2`,
  label: `font-medium p-icon-only:invisible p-icon-only:w-0
        p-small:text-sm p-large:text-[1.125rem]`,
  pcBadge: {
    root: `min-w-4 h-4 leading-4`,
  },
})
</script>
