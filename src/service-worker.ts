// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { clientsClaim } from 'workbox-core'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

// Give TypeScript the correct global.
declare let self: ServiceWorkerGlobalScope

// Precache every asset in the injected manifest. Workbox keys each entry by its
// content revision, so on update only entries whose revision changed are
// downloaded; unchanged bundles and piano samples are served from cache.
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// version.json and manifest.json must always be fresh — they report the live
// deployed version and app/store metadata. Both are excluded from the precache
// (see globIgnores in vite.config.ts) and served network-first: an
// already-installed app reflects the current release immediately, falling back
// to the runtime-cached copy only when offline. assetlinks.json is likewise not
// precached; it has no route and passes straight through to the network so TWA
// verification always sees the current signing-key fingerprints.
registerRoute(
  ({ url }) =>
    url.pathname === '/version.json' ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/manifest.webmanifest',
  new NetworkFirst({ cacheName: 'app-metadata' }),
)

// SPA navigations — including deep links and offline reloads — resolve to the
// precached app shell. In dev the precache manifest is empty (the vite server
// handles navigation itself), so index.html isn't precached; only register this
// for production builds to avoid a non-precached-url error.
if (import.meta.env.PROD) {
  registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))
}

// registerType: 'autoUpdate' — activate the new worker as soon as it installs
// and take control of open clients; virtual:pwa-register then reloads the page.
self.skipWaiting()
clientsClaim()
