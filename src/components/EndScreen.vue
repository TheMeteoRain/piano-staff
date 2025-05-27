<template>
  <div class="result grid" @click="animate">
    <div
      class="result__content end-screen relative transition-transform duration-1000 cursor-pointer"
    >
      <div
        class="result__front absolute grid content-center gap-5 top-0 bottom-0 right-0 left-0"
      >
        <h1 class="text-center text-3xl font-bold">Try again!</h1>
        <p class="text-center text-lg">Tap to show statistics.</p>
      </div>
      <div
        class="result__back absolute content-center gap-5 top-0 bottom-0 right-0 left-0"
      >
        <h1 class="text-center text-3xl font-bold">Statistics</h1>
        <h2 class="text-center text-2xl font-bold mt-10">Overall</h2>
        <div class="stat">
          <div class="stat_item text-right">Correct Guesses</div>
          <div class="stat_item text-left">
            {{
              Object.entries(stats.guesses).reduce(
                (prev, [key, guess]) => prev + guess.correctGuesses,
                0
              )
            }}
          </div>
        </div>
        <div class="stat">
          <div class="stat_item text-right">Incorrect Guesses</div>
          <div class="stat_item text-left">
            {{
              Object.entries(stats.guesses).reduce(
                (prev, [key, guess]) => prev + guess.incorrectGuesses,
                0
              )
            }}
          </div>
        </div>
        <div class="stat">
          <div class="stat_item text-right">Total Guesses</div>
          <div class="stat_item text-left">
            {{
              Object.entries(stats.guesses).reduce(
                (prev, [key, guess]) => prev + guess.totalGuesses,
                0
              )
            }}
          </div>
        </div>

        <h2 class="text-center text-2xl font-bold mt-10">Per note accuracy</h2>
        <div
          v-for="(guess, key, _index) in stats.guesses"
          :key="key"
          class="stat"
        >
          <div class="stat_item text-right">{{ key }}</div>
          <div class="stat_item text-left">{{ guess.guessRate }}%</div>
        </div>
      </div>
    </div>
    <button
      @click="reset"
      class="bg-[#0466c8] text-white px-4 py-2 rounded hover:bg-[#023e7d] transition-colors cursor-pointer"
    >
      Retry
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Stats } from "@/utils/stats";

type EndScreenProps = {
  reset: (event: MouseEvent) => void;
  stats: Stats;
};
const { reset, stats } = defineProps<EndScreenProps>();

function animate(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const result__content = target.querySelector(
    ".result__content"
  ) as HTMLElement;
  result__content.classList.toggle("animate");
}
</script>

<style scoped>
.end-screen {
  height: calc(100vh - 150px);
}

.result {
  perspective: 500px;
}
.result__content {
  transform-style: preserve-3d;
}
.animate {
  transform: rotateY(0.5turn);
}

.stat {
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-self: center;
  grid-gap: calc(var(--spacing) * 20);
}
.stat_item {
}

.result__front,
.result__back {
  backface-visibility: hidden;
}
.result__back {
  transform: rotateY(0.5turn);
}
</style>
