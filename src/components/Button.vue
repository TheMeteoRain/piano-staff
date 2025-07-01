<script setup lang="ts">
import { computed } from 'vue'
import Button from '@/volt/Button.vue'
import {
  type ButtonPassThroughOptions,
  type ButtonProps,
} from 'primevue/button'

interface Props extends /* @vue-ignore */ ButtonProps {
  pt?: ButtonPassThroughOptions<unknown>
}

const props = defineProps</* @vue-ignore */ Props>()

const mergedClasses = computed(() => {
  const baseClass = 'rounded-none'
  // @ts-expect-error: TODO
  const userClass = props.pt?.root?.class || ''
  return `${baseClass} ${userClass}`.trim()
})
</script>

<template>
  <Button v-bind="$attrs" :pt:root:class="mergedClasses">
    <slot></slot>
  </Button>
</template>
