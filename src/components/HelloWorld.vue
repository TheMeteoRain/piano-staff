<script setup lang="ts">
import { resetLocalStorage } from "@/utils/stats";

defineProps<{
  msg: string;
}>();
</script>

<template>
  <h1 class="text-3xl mt-20">Piano Note Accuracy Exercises</h1>
  <p>Click one of the navigation links to start.</p>
  <h2 class="text-2xl mt-10">Miscellaneous</h2>
  <button
    @click="resetLocalStorage"
    class="border-color-[#0353a4] border-1 cursor-pointer px-4 py-2 text-black hover:bg-[#0353a4] hover:text-white transition-colors"
  >
    Reset Stats
  </button>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>
