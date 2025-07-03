import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import faroUploader from '@grafana/faro-rollup-plugin'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'

const manifest = JSON.parse(fs.readFileSync('./public/manifest.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const plugins: PluginOption[] = [
    vue(),
    vueJsx(),
    vueDevTools(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      manifest,
      injectManifest: {
        globPatterns: ['**/*.{js,wasm,css,html,json,webp}'], // match what you want cached
        globDirectory: 'dist', // default is `dist`, override if needed
        sourcemap: false,
      },
      injectRegister: null,
      mode: mode === 'production' ? 'production' : 'development',
      devOptions: {
        enabled: mode !== 'production',
        type: 'module',
      },
    }),
  ]

  if (mode === 'production' && env.VITE_FARO_ACTIVE === 'true') {
    plugins.push(
      faroUploader({
        appName: env.VITE_FARO_APP_NAME,
        endpoint: env.VITE_FARO_ENDPOINT,
        appId: env.VITE_FARO_APP_ID,
        stackId: env.VITE_FARO_STACK_ID,
        apiKey: env.VITE_FARO_API_KEY,
        gzipContents: true,
        keepSourcemaps: false,
        verbose: true,
      }),
    )
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      coverage: {
        provider: 'v8',
      },
    },
    build: {
      sourcemap: true,
    },
  }
})
