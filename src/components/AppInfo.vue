<script setup lang="ts">
import { getCurrentInstance } from 'vue'
import { Icon } from '@iconify/vue'
import Button from '@/volt/Button.vue'
import AppLink from '@/components/AppLink.vue'
const versionInfo =
  getCurrentInstance()?.appContext.config.globalProperties.$versionInfo
const githubLink =
  getCurrentInstance()?.appContext.config.globalProperties.$github
</script>

<template>
  <div
    class="text-base sm:text-lg text-gray-500 text-center mt-8 grid grid-cols-2 grid-rows-2 gap-2 wrap-anywhere items-center"
  >
    <AppLink :to="githubLink">
      <Button
        variant="outlined"
        :label="`Version: ${versionInfo.version}`"
        class="h-[75px] w-[100%]"
      >
        <template #icon>
          <Icon icon="mdi:information-variant" width="30" /></template
      ></Button>
    </AppLink>
    <AppLink :to="githubLink">
      <Button variant="outlined" label="Github" class="h-[75px] w-[100%]">
        <template #icon> <Icon icon="mdi:github" width="20" /></template
      ></Button>
    </AppLink>

    <AppLink :to="`${githubLink}/commit/${versionInfo.sha}`">
      <Button
        variant="outlined"
        :label="`${versionInfo.sha.slice(0, 7)}...`"
        class="h-[75px] w-[100%]"
      >
        <template #icon> <Icon icon="mdi:source-commit" width="20" /></template
      ></Button>
    </AppLink>

    <AppLink :to="`${githubLink}/discussions`">
      <Button
        variant="outlined"
        label="Share your ideas"
        class="h-[75px] w-[100%]"
      >
        <template #icon> <Icon icon="mdi:discussion" width="20" /></template
      ></Button>
    </AppLink>
    <AppLink to="/licenses">
      <Button variant="outlined" label="Licenses" class="h-[75px] w-[100%]">
        <template #icon> <Icon icon="mdi:license" width="20" /></template
      ></Button>
    </AppLink>
  </div>
</template>

<style scoped>
.version-footer {
  margin-top: 3rem;
  font-size: 0.75rem;
  color: #666;
  text-align: center;
}
.version-footer a {
  color: #0353a4;
  text-decoration: none;
}
.version-footer a:hover {
  text-decoration: underline;
}

.icon-inline {
  display: inline;
}

a:hover {
  text-decoration: underline;
}
</style>
