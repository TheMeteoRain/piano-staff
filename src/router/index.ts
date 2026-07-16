import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { withLayout } from '@/layouts/withDefaultLayout'

const router = createRouter({
  scrollBehavior(_to, _from, _savedPosition) {
    // always scroll to top when navigating
    return { top: 0 }
  },
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: withLayout(HomeView),
      props: { header: 'Musical Sight' },
    },
    {
      path: '/training',
      children: [
        {
          path: '',
          name: 'training-overview',
          component: withLayout(() => import('../views/TrainingView.vue')),
          props: { header: 'Training' },
        },
        {
          path: 'clef-treble',
          name: 'clef-treble',
          component: () => import('../views/TrebleView.vue'),
        },
        {
          path: 'clef-bass',
          name: 'clef-bass',
          component: () => import('../views/BassView.vue'),
        },
        {
          path: 'mixed',
          name: 'mixed',
          component: () => import('../views/MixedView.vue'),
        },
        {
          path: 'notes',
          name: 'note-reading',
          component: withLayout(() => import('../views/NoteReadingView.vue')),
          props: { header: 'Sight reading' },
        },
        {
          path: 'keys',
          name: 'key-signatures',
          component: withLayout(
            () => import('../views/KeySignatureCategoryView.vue'),
          ),
          props: { header: 'Key signatures' },
        },
        {
          path: 'keys/flat',
          name: 'keys-flat',
          component: () => import('../views/KeySignatureView.vue'),
          props: { mode: 'flat' },
        },
        {
          path: 'keys/sharp',
          name: 'keys-sharp',
          component: () => import('../views/KeySignatureView.vue'),
          props: { mode: 'sharp' },
        },
        {
          path: 'keys/mixed',
          name: 'keys-mixed',
          component: () => import('../views/KeySignatureView.vue'),
          props: { mode: 'mixed' },
        },
        {
          path: 'chords',
          name: 'chords',
          component: () => import('../views/ChordsView.vue'),
        },
        {
          path: 'settings',
          redirect: { name: 'exercise-settings' },
        },
      ],
    },
    {
      path: '/settings',
      name: 'settings',
      component: withLayout(() => import('../views/SettingsView.vue')),
      props: { header: 'Settings' },
    },
    {
      path: '/settings/exercise',
      name: 'exercise-settings',
      component: withLayout(() => import('../views/ExerciseSettingsView.vue')),
      props: { header: 'Exercise Settings' },
    },
    {
      path: '/settings/about',
      name: 'app-info',
      component: withLayout(() => import('../views/AboutView.vue')),
      props: { header: 'App Info' },
    },
    {
      path: '/licenses',
      name: 'licenses',
      component: () => import('../views/LicensesView.vue'),
    },
  ],
})

/** Resolved when the navigation that is currently inside a view transition
 * has finished patching the DOM — so the browser snapshots the real new page
 * instead of the stale old one. */
let domUpdated: (() => void) | null = null
router.afterEach(() => {
  nextTick(() => {
    domUpdated?.()
    domUpdated = null
  })
})

router.beforeResolve((to, from, next) => {
  if (!document.startViewTransition) {
    // fallback - just navigate normally
    return next()
  }

  // Secondary navigation animates vertically; main-nav navigation keeps the
  // horizontal slide. Secondary = the TARGET is a deep page, reached from
  // its own section or from another deep page (e.g. exercise -> exercise
  // settings). Navigating to a section root is always main-nav motion.
  const section = (path: string) => path.split('/')[1] ?? ''
  const depth = (path: string) => path.split('/').filter(Boolean).length
  const vertical =
    from.matched.length > 0 &&
    depth(to.path) >= 2 &&
    (section(to.path) === section(from.path) || depth(from.path) >= 2)
  // data attribute, NOT a class — the theme system keys off html classes
  if (vertical) {
    document.documentElement.setAttribute('data-transition', 'vertical')
  } else {
    document.documentElement.removeAttribute('data-transition')
  }

  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        domUpdated = resolve
        next()
      }),
  )
  transition.finished.finally(() => {
    document.documentElement.removeAttribute('data-transition')
  })
})

export default router
