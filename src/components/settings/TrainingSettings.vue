<script setup lang="ts">
import InputNumber from '@/volt/InputNumber.vue'
import ToggleSwitch from '@/volt/ToggleSwitch.vue'
import { Form } from '@primevue/forms'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <Form class="grid lg:grid-cols-2 gap-4 w-full items-center">
    <div>
      <label for="secondsBetweenNotes" class="font-bold block mb-1">
        Note travel time (seconds)
      </label>
      <small id="secondsBetweenNotes-help" class="block text-(--text-muted)">
        How long a note takes to reach the question spot. Lower is faster and
        harder.
      </small>
    </div>
    <InputNumber
      size="large"
      inputId="secondsBetweenNotes"
      name="secondsBetweenNotes"
      aria-describedby="secondsBetweenNotes-help"
      :min="1"
      :max="10"
      v-model="settings.secondsBetweenNotes"
    />
    <div>
      <label for="pauseDuration" class="font-bold block mb-1">
        Wait between notes (seconds)
      </label>
      <small id="pauseDuration-help" class="block text-(--text-muted)">
        Pause after you answer before the next note starts moving. 0 for no
        wait.
      </small>
    </div>
    <InputNumber
      size="large"
      inputId="pauseDuration"
      name="pauseDuration"
      aria-describedby="pauseDuration-help"
      :min="0"
      :max="10"
      :disabled="settings.answerInLine"
      v-model="settings.pauseDuration"
    />
    <div>
      <label for="answerInLine" class="font-bold block mb-1">
        Answer at your own pace
      </label>
      <small id="answerInLine-help" class="block text-(--text-muted)">
        Answer the next note right away without waiting for it to reach the
        question spot. No time limit or wait between notes.
      </small>
    </div>
    <ToggleSwitch
      inputId="answerInLine"
      aria-describedby="answerInLine-help"
      v-model="settings.answerInLine"
    />
    <div>
      <label for="questionTimeLimit" class="font-bold block mb-1">
        Question time limit (seconds)
      </label>
      <small id="questionTimeLimit-help" class="block text-(--text-muted)">
        How long you have to answer before the note counts as missed.
      </small>
    </div>
    <InputNumber
      size="large"
      inputId="questionTimeLimit"
      name="questionTimeLimit"
      aria-describedby="questionTimeLimit-help"
      :min="1"
      :max="10"
      v-model="settings.questionTimeLimit"
    />
    <div>
      <label for="errorsAllowed" class="font-bold block mb-1">
        Mistakes allowed
      </label>
      <small id="errorsAllowed-help" class="block text-(--text-muted)">
        Wrong answers before the exercise ends. 0 is unlimited.
      </small>
    </div>
    <InputNumber
      size="large"
      inputId="errorsAllowed"
      name="errorsAllowed"
      aria-describedby="errorsAllowed-help"
      :min="0"
      :max="100"
      v-model="settings.errorsAllowed"
    />
    <div>
      <label for="showLastNoteQuessed" class="font-bold block mb-1">
        Show last note quessed
      </label>
      <small id="showLastNoteQuessed-help" class="block text-(--text-muted)">
        Keep the note on the staff after answering so you can see what it was.
      </small>
    </div>
    <ToggleSwitch
      inputId="showLastNoteQuessed"
      aria-describedby="showLastNoteQuessed-help"
      v-model="settings.showLastNoteQuessed"
    />
    <div>
      <label for="soundEnabled" class="font-bold block mb-1">
        Note sounds
      </label>
      <small id="soundEnabled-help" class="block text-(--text-muted)">
        Play a piano sound when a note is answered.
      </small>
    </div>
    <ToggleSwitch
      inputId="soundEnabled"
      aria-describedby="soundEnabled-help"
      v-model="settings.soundEnabled"
    />
  </Form>
</template>
