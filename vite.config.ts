import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import faroUploader from '@grafana/faro-rollup-plugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const plugins: PluginOption[] = [
    vue(),
    vueJsx(),
    vueDevTools(),
    tailwindcss(),
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
