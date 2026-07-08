// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { cacheNames, clientsClaim } from 'workbox-core'
import {
  registerRoute,
  setCatchHandler,
  setDefaultHandler,
} from 'workbox-routing'
import { CacheFirst, NetworkFirst, NetworkOnly, Strategy } from 'workbox-strategies'
import type { ManifestEntry } from 'workbox-build'

// Give TypeScript the correct global.
declare let self: ServiceWorkerGlobalScope

const data = {
  debug: import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true',
  credentials: 'same-origin',
  networkTimeoutSeconds: 0,
  fallback: 'index.html',
}
const cacheName = cacheNames.runtime
const SW_VERSION = '1'

function buildStrategy(): Strategy {
  if (data.networkTimeoutSeconds > 0)
    return new NetworkFirst({
      cacheName,
      networkTimeoutSeconds: data.networkTimeoutSeconds,
    })
  return new NetworkFirst({ cacheName })
}
const manifest = self.__WB_MANIFEST as Array<ManifestEntry>
const cacheEntries: RequestInfo[] = []

const manifestURLs = manifest.map((entry) => {
  const url = new URL(entry.url, self.location)
  cacheEntries.push(
    new Request(url.href, {
      credentials: data.credentials,
    }),
  )
  return url.href
})

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(cacheEntries)
    }),
  )
})

self.addEventListener('activate', (event) => {
  // clean up cache entries no longer listed in the precache manifest, and
  // await every deletion so activation doesn't complete before cleanup does
  event.waitUntil(
    caches.open(cacheName).then(async (cache) => {
      const keys = await cache.keys()
      const stale = keys.filter(
        (request) => !manifestURLs.includes(request.url),
      )
      await Promise.all(stale.map((request) => cache.delete(request)))
      if (data.debug && stale.length) {
        console.log(`Removed ${stale.length} stale precache entries`)
      }
    }),
  )
})

self.addEventListener('message', async (event) => {
  if (data.debug) console.log(event)
  if (event.data.type === 'CACHE_UPDATED') {
    const { updatedURL } = event.data.payload

    if (data.debug)
      console.log(`A newer version of ${updatedURL} is available!`)
  } else if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage(SW_VERSION)
  }
})

const fallbackURL = new URL(data.fallback, self.location).href

// The app shell stays network-first so navigations pick up new deployments.
registerRoute(({ url }) => url.href === fallbackURL, buildStrategy())

// Everything else precached is immutable (content-hashed bundles, stable
// piano samples), so serve it cache-first — no network round-trip when the
// asset is already stored locally.
registerRoute(
  ({ url }) => url.href !== fallbackURL && manifestURLs.includes(url.href),
  new CacheFirst({ cacheName }),
)

setDefaultHandler(new NetworkOnly())

// fallback to app-shell for document request
setCatchHandler(({ event }): Promise<Response> => {
  switch (event.request.destination) {
    case 'document':
      return caches.match(data.fallback).then((r) => {
        return r ? Promise.resolve(r) : Promise.resolve(Response.error())
      })
    default:
      return Promise.resolve(Response.error())
  }
})

// this is necessary, since the new service worker will keep on skipWaiting state
// and then, caches will not be cleared since it is not activated
self.skipWaiting()
clientsClaim()
