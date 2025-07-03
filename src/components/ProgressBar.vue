<template>
  <div class="progress-bar">
    <div class="progress-bar__fill" :style="{ width: progress + '%' }"></div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ProgressBar',
  props: {
    progress: {
      type: Number,
      required: true,
      default: 0,
      validator: (value: number) => value >= 0 && value <= 100,
    },
  },
}
</script>

<style scoped>
.progress-bar {
  width: 100%;
  height: 5px;
  background-color: var(--background);
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background-color: var(--p-info);
  transition: width 0.3s ease;
}
</style>
