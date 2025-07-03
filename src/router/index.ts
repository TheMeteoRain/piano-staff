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
      ],
    },
    {
      path: '/settings',
      name: 'settings',
      component: withLayout(() => import('../views/SettingsView.vue')),
      props: { header: 'Settings' },
    },
    {
      path: '/licenses',
      name: 'licenses',
      component: () => import('../views/LicensesView.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  if (!document.startViewTransition) {
    // fallback - just navigate normally
    return next()
  }

  document.startViewTransition(() => {
    next()
  })
})

export default router
