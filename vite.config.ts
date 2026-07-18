import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import faroUploader from '@grafana/faro-rollup-plugin'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'

// The web app manifest is authored as a standalone file for readability, then
// generated into the build and injected by vite-plugin-pwa under its default
// name (manifest.webmanifest). It lives outside public/ so it isn't also copied
// verbatim into the output; nginx mirrors it at the manifest.json URL too.
const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const plugins: PluginOption[] = [
    vue(),
    vueJsx(),
    vueDevTools(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      manifest,
      injectManifest: {
        globPatterns: ['**/*.{js,wasm,css,html,json,webp,m4a}'],
        globDirectory: 'dist', // default is `dist`, override if needed
        // Keep release- and Play-related files out of the precache so the
        // service worker never pins an installed app to a stale copy (see the
        // routes in service-worker.ts):
        //   version.json         — reports the live deployed version
        //   manifest.webmanifest — app/store metadata, changes every release
        //                          (manifest.json is nginx-mirrored from it)
        //   assetlinks.json      — TWA Digital Asset Links, must reflect current
        //                          signing-key fingerprints (already skipped as
        //                          a dotfile; listed here to make intent explicit)
        globIgnores: [
          'version.json',
          'manifest.webmanifest',
          'manifest.json',
          '.well-known/assetlinks.json',
        ],
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
