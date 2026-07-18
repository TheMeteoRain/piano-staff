<script setup lang="ts">
import Button from '@/volt/Button.vue'
import { Icon } from '@iconify/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import ConfirmDialog from '@/volt/ConfirmDialog.vue'
import Toast from '@/volt/Toast.vue'
import { useToast } from 'primevue/usetoast'
import type { ToastMessageOptions } from 'primevue/toast'
import { usePWA } from './composables/usePWA'
import setTheme from '@/utils/setTheme'
import { useSettingsStore } from '@/stores/settings'
import { useMidiInput } from '@/composables/useMidiInput'
import {
  useMidiNavStore,
  HISTORY_KEYS,
  BOTTOM_KEYS,
  LEADER_KEY,
  midiKeyName,
} from '@/stores/midiNav'
import MidiKeyBadge from '@/components/MidiKeyBadge.vue'

const toast = useToast()
usePWA()
onMounted(() => {
  setTheme()
})

// --- app-wide MIDI navigation ---------------------------------------------
const router = useRouter()
const route = useRoute()
const settings = useSettingsStore()
const midi = useMidiInput()
const navStore = useMidiNavStore()

// leaf training views protect themselves from stray "play-along" notes: they
// capture MIDI (global nav suspended). `midiProtect` also arms the leader to
// toggle nav mode; `midiCapture` (the Reference) owns its leader itself.
watch(
  () => route.meta,
  (m) => {
    navStore.setView({
      captured: !!(m.midiProtect || m.midiCapture),
      leader: !!m.midiProtect,
    })
  },
  { immediate: true },
)

// footer nav routes, in order, each on a fixed low white key + a keyboard key
// (the keyboard set is a simulator, so the MIDI nav can be debugged without a
// device — Space = leader, 1/2/3 = footer nav, arrows = history)
const bottomNav = [
  { to: '/', key: BOTTOM_KEYS[0], kbd: '1' },
  { to: '/training', key: BOTTOM_KEYS[1], kbd: '2' },
  { to: '/settings', key: BOTTOM_KEYS[2], kbd: '3' },
]
const backKey = midiKeyName(HISTORY_KEYS.back)
const forwardKey = midiKeyName(HISTORY_KEYS.forward)
const leaderKey = midiKeyName(LEADER_KEY)
const keyName = midiKeyName

// on a leader-armed training view, advertise the leader key so the user knows
// how to switch from playing along to navigating
const showLeaderHint = computed(
  () => navStore.enabled && navStore.captured && navStore.leaderEnabled,
)

// badges show the keyboard keys once nav is armed by keyboard (the simulator),
// otherwise the MIDI note names
// keyboard labels when armed by keyboard, or when MIDI nav is off but the view
// surfaced its own nav (keyboard-only there, e.g. the Reference)
const navKbd = computed(
  () => !navStore.midiActive || navStore.navVia === 'keyboard',
)
const leaderLabel = computed(() => (navKbd.value ? 'Spc' : leaderKey))
const backLabel = computed(() => (navKbd.value ? '←' : backKey))
const forwardLabel = computed(() => (navKbd.value ? '→' : forwardKey))
function bottomLabel(i: number) {
  return navKbd.value ? bottomNav[i].kbd : keyName(bottomNav[i].key)
}

navStore.register(HISTORY_KEYS.back, () => router.back(), 'ArrowLeft')
navStore.register(HISTORY_KEYS.forward, () => router.forward(), 'ArrowRight')
bottomNav.forEach((b) => navStore.register(b.key, () => router.push(b.to), b.kbd))

// keyboard mirror of the MIDI nav (debug without a device). Space is the leader
// on protected views; the registered shortcut keys drive the same actions.
function onNavKeydown(e: KeyboardEvent) {
  if (!navStore.enabled || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
  const k = e.key
  if (k === ' ' || k === 'Spacebar') {
    if (navStore.captured && navStore.leaderEnabled) {
      e.preventDefault()
      navStore.toggleNavMode('keyboard') // protected: arm / disarm
    } else if (navStore.active && !navStore.captured) {
      e.preventDefault()
      // non-protected menu: no leader to arm — flip the badge labels to the
      // keyboard set so the nav visuals can be debugged without a device.
      // (captured views own Space themselves, so don't touch it there)
      navStore.navVia = navStore.navVia === 'keyboard' ? 'midi' : 'keyboard'
    }
    return
  }
  const key = k.length === 1 ? k.toLowerCase() : k
  if (navStore.dispatchKey(key)) e.preventDefault()
}
onMounted(() => window.addEventListener('keydown', onNavKeydown))
onUnmounted(() => window.removeEventListener('keydown', onNavKeydown))

// keep nav enabled in sync with the MIDI setting; start/stop the app listener
watch(
  () => settings.values.midiInput,
  (on) => {
    const enabled = !!on && midi.supported
    navStore.enabled = enabled
    if (enabled)
      void midi.start({
        onNote: (n) => {
          // on a captured view the leader arms/disarms nav mode instead of
          // firing Back (no-op if that view owns its own leader, e.g. Reference)
          if (n.midi === LEADER_KEY && navStore.captured) {
            navStore.toggleNavMode('midi')
            return
          }
          navStore.dispatch(n.midi)
        },
      })
    else midi.stop()
  },
  { immediate: true },
)
onUnmounted(() => midi.stop())

const visible = ref(false)

const onClose = () => {
  visible.value = false
}
function closeToast(t: ToastMessageOptions) {
  toast.remove(t)
  onClose()
}
</script>

<template>
  <ConfirmDialog />
  <Toast />
  <Toast position="top-center" group="tc" @close="onClose">
    <template #message="slotProps">
      <div
        class="flex flex-col items-start flex-auto"
        @click="() => closeToast(slotProps.message)"
      >
        {{ slotProps.message.summary }}
        <div class="font-medium text-lg my-4">
          {{ slotProps.message.detail }}
        </div>
      </div>
    </template>
  </Toast>

  <div class="h-[calc(100vh-3.5rem)]" id="content">
    <RouterView />
    <div class="box h-[3.5rem]" :data-hidden="false" />
  </div>
  <footer>
    <nav class="box footer-bar fixed bottom-0 left-0 right-0" :data-hidden="false">
      <!-- protected training view: the leader chip lives in the footer chrome so
           it never covers the view's own content -->
      <div
        v-if="showLeaderHint"
        class="footer-midi"
        :class="{ armed: navStore.navMode }"
      >
        <span class="fm-item">
          <MidiKeyBadge :label="leaderLabel" />
          <span>{{ navStore.navMode ? 'exit' : 'navigate' }}</span>
        </span>
        <!-- once armed, back/forward become live too — show them by the leader -->
        <template v-if="navStore.navMode">
          <span class="fm-item"><span class="arrow">◀</span>{{ backLabel }}</span>
          <span class="fm-item"
            ><span class="arrow">▶</span>{{ forwardLabel }}</span
          >
        </template>
      </div>
      <div v-else-if="navStore.active" class="history-keys">
        <span><span class="arrow">◀</span>{{ backLabel }}</span>
        <span><span class="arrow">▶</span>{{ forwardLabel }}</span>
      </div>
      <div class="footer-inner flex">
      <router-link
        to="/"
        v-slot="{ href, navigate, isActive }"
        class="flex-grow relative"
      >
        <MidiKeyBadge
          v-if="navStore.active"
          :label="bottomLabel(0)"
          class="footer-key"
        />
        <Button
          :href="href"
          @click="navigate"
          :variant="isActive ? undefined : 'outlined'"
          label="Home"
          :class="['w-full h-[3.5rem] border-l-0 border-b-0 border-t-0 rounded-none']"
        >
          <template #icon> <Icon icon="mdi:home" width="20" /> </template
        ></Button>
      </router-link>
      <router-link
        to="/training"
        v-slot="{ href, navigate, isExactActive }"
        class="flex-grow relative"
      >
        <MidiKeyBadge
          v-if="navStore.active"
          :label="bottomLabel(1)"
          class="footer-key"
        />
        <Button
          :href="href"
          @click="navigate"
          :variant="isExactActive ? undefined : 'outlined'"
          label="Training"
          :class="['w-full h-[3.5rem] border-l-0 border-b-0 border-t-0 rounded-none']"
        >
          <template #icon>
            <Icon icon="mdi:music-clef-treble" width="20" /> </template
        ></Button>
      </router-link>
      <router-link
        to="/settings"
        v-slot="{ href, navigate, isActive }"
        class="flex-grow relative"
      >
        <MidiKeyBadge
          v-if="navStore.active"
          :label="bottomLabel(2)"
          class="footer-key"
        />
        <Button
          :href="href"
          @click="navigate"
          :variant="isActive ? undefined : 'outlined'"
          label="Settings"
          :class="[
            'w-full h-[3.5rem] border-l-0 border-b-0 border-r-0 border-t-0 rounded-none',
          ]"
        >
          <template #icon> <Icon icon="mdi:settings" width="20" /> </template
        ></Button>
      </router-link>
      </div>
    </nav>
  </footer>
</template>

<style scoped>
@media (min-width: 1024px) {
  .logo {
    margin: 0 2rem 0 0;
  }
}
/* the footer nav is the full-width bar: an opaque background so page content
   doesn't show through the sides, plus a single edge-to-edge top divider. The
   buttons are centered inside via .footer-inner. It's the bottom-nav transition
   group, so it stays stable during navigation (no flash). */
.footer-bar {
  max-width: none;
  display: flex;
  justify-content: center;
  background: var(--background);
  border-top: 1px solid var(--primary);
}
.footer-inner {
  width: 100%;
  max-width: 512px; /* narrower row so the buttons aren't full-width on tablets */
}

/* MIDI key badge pinned to the top-right of each footer nav button */
.footer-key {
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 1;
}
/* history back/forward key hints, pinned to the bar's left edge */
.history-keys {
  position: absolute;
  left: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-family: ui-monospace, monospace;
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--text-muted);
  pointer-events: none;
}
.history-keys .arrow {
  margin-right: 0.15rem;
  color: var(--primary);
}

/* leader-key chip on protected training views, in the footer's left chrome so
   it never overlays the view's content */
.footer-midi {
  position: absolute;
  left: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--text-muted);
  pointer-events: none;
}
.footer-midi.armed {
  color: var(--primary);
}
.footer-midi .fm-item {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}
.footer-midi .arrow {
  color: var(--primary);
}

.box {
  opacity: 1;
  transform: translateY(0);
  transition:
    transform 0.7s ease-out,
    opacity 0.7s ease-out;
}

.box[data-hidden='true'] {
  opacity: 0;
  transform: translateY(100%); /* or scale(0.95) for a shrink effect */
  pointer-events: none;
}
</style>
