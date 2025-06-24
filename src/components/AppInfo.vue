<script setup lang="ts">
import { getCurrentInstance } from 'vue'
import { Icon } from '@iconify/vue'
const versionInfo =
  getCurrentInstance()?.appContext.config.globalProperties.$versionInfo
const githubLink =
  getCurrentInstance()?.appContext.config.globalProperties.$github
</script>

<template>
  <footer
    class="text-base sm:text-lg text-gray-500 text-center mt-8 grid grid-cols-2 grid-rows-2 gap-2 wrap-anywhere items-center"
  >
    <div>
      <a
        :href="`${githubLink}/releases/tag/v${versionInfo.version}`"
        target="_blank"
        >Version: {{ versionInfo.version }}</a
      >
    </div>
    <div>
      <a :href="githubLink" target="_blank"
        >Github
        <Icon icon="mdi:github" width="20" :inline="true" class="icon-inline"
      /></a>
    </div>
    <div>
      <a :href="`${githubLink}/commit/${versionInfo.sha}`" target="_blank">
        {{ versionInfo.sha.slice(0, 7) }}...
        <Icon
          icon="mdi:source-commit"
          width="20"
          :inline="true"
          class="icon-inline"
        />
      </a>
    </div>
    <div>
      <a :href="`${githubLink}/discussions`" target="_blank">
        Share your ideas
        <Icon
          icon="mdi:open-in-new"
          width="20"
          :inline="true"
          class="icon-inline"
        />
      </a>
    </div>
  </footer>
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
