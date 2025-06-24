<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import AppVersion from './components/AppInfo.vue'
const route = useRoute()
const isRoot = computed(() => route.path === '/')
</script>

<template>
  <div class="h-screen flex flex-col">
    <header>
      <nav class="grid grid-flow-col">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/clef-treble">Treble</RouterLink>
        <RouterLink to="/clef-bass">Bass</RouterLink>
        <RouterLink to="/mixed">Mixed</RouterLink>
      </nav>
    </header>

    <div class="flex-grow">
      <RouterView />
    </div>

    <AppVersion v-if="isRoot" />
  </div>
</template>

<style scoped>
nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}
nav a:hover {
  /* background-color: blue; */
  background-color: hsl(210, 96%, 40%, 0.8);
  color: var(--color-white);
}

nav a.router-link-exact-active {
  background-color: #0353a4;
  color: var(--color-white);
}

nav a {
  font-weight: bold;
  font-size: var(--text-lg);
  padding: calc(var(--spacing) * 4);
  /* text-decoration: none; */
  transition: 0.4s;
  text-align: center;
}

@media (min-width: 1024px) {
  .logo {
    margin: 0 2rem 0 0;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    margin-top: 1rem;
  }
}
</style>
