<template>
  <div class="progress-bar">
    <div class="progress-bar__fill" :style="{ width: progress + '%' }"></div>
    <div
      class="progress-bar__overlay"
      :style="{ width: overlayProgress + '%' }"
    ></div>
  </div>
</template>

<script lang="ts">
/**
 * Stacked layers:
 * 1. the track — always visible so the bar's full length reads even when empty
 * 2. `progress` — the primary fill (info color); the exercise fills it during
 *    a question and drains it back to zero during the pause
 * 3. `overlayProgress` — optional track-colored overlay drawn on top, for
 *    wipe-style effects
 */
export default {
  name: 'ProgressBar',
  props: {
    progress: {
      type: Number,
      required: true,
      default: 0,
      validator: (value: number) => value >= 0 && value <= 100,
    },
    overlayProgress: {
      type: Number,
      required: false,
      default: 0,
      validator: (value: number) => value >= 0 && value <= 100,
    },
  },
}
</script>

<style scoped>
.progress-bar {
  position: relative;
  width: 100%;
  height: 5px;
  border-radius: 9999px;
  /* visible track: one ramp step off the page background in both themes */
  background-color: var(--background-100);
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background-color: var(--p-info);
}

.progress-bar__overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--background-100);
}
</style>
