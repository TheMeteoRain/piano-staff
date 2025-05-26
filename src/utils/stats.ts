import type { Clef } from "@/components/NoteExercise.vue";
import { ref } from "vue";

export type Stats = {
  guesses: {
    [key: string]: {
      averageMs: number;
      totalGuesses: number;
      correctGuesses: number;
      incorrectGuesses: number;
      guessRate: number;
    };
  };
  exercise: Clef;
  startTime: string;
  endTime: string | null;
};

export type SavedStats = {
  exercises: {
    treble: Stats[];
    bass: Stats[];
    mixed: Stats[];
  };
};

export function resetLocalStorage() {
  localStorage.removeItem("stats");
}

export function useStats(initial: Stats) {
  const stats = ref<Stats>(structuredClone(initial));
  const lastSavedStats = ref<Stats>(stats.value);

  function resetGameStats() {
    stats.value = structuredClone(initial);
    stats.value.startTime = new Date().toISOString();
  }

  function initializeStats() {
    if (!localStorage.getItem("stats")) {
      localStorage.setItem(
        "stats",
        JSON.stringify({
          exercises: {
            treble: [],
            bass: [],
            mixed: [],
          },
        })
      );
    }
  }

  function saveStats() {
    console.log("Saving stats", stats.value);
    if (
      Object.entries(stats.value.guesses).reduce(
        (prev, [, guess]) => prev + guess.totalGuesses,
        0
      ) === 0
    )
      return;

    const savedStats = localStorage.getItem("stats");
    if (!savedStats) return;

    const parsedStats: SavedStats = JSON.parse(savedStats);
    // Prevent double saving the same exercise
    if (
      parsedStats.exercises[stats.value.exercise].find(
        (s) => s.startTime === stats.value.startTime
      )
    ) {
      return;
    }
    stats.value.endTime = new Date().toISOString();
    parsedStats.exercises[stats.value.exercise].push(stats.value);
    localStorage.setItem("stats", JSON.stringify(parsedStats));
    lastSavedStats.value = stats.value;
    resetGameStats();
  }

  return { stats, resetGameStats, initializeStats, saveStats, lastSavedStats };
}
