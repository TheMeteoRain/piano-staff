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

// main-nav order, left to right; deep pages inherit their section's index
const NAV_ORDER = ['', 'training', 'settings']
const navIndex = (path: string) => NAV_ORDER.indexOf(path.split('/')[1] ?? '')

router.beforeResolve((to, from, next) => {
  if (!document.startViewTransition) {
    // fallback - just navigate normally
    return next()
  }

  // slide direction follows nav order: going backward (e.g. Training -> Home)
  // reverses the default left-to-right slide
  const goingBack = navIndex(to.path) < navIndex(from.path)
  document.documentElement.classList.toggle('back-transition', goingBack)

  const transition = document.startViewTransition(() => {
    next()
  })
  transition.finished.finally(() => {
    document.documentElement.classList.remove('back-transition')
  })
})

export default router
