import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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
      component: HomeView,
    },

    {
      path: '/training',
      children: [
        {
          path: '',
          name: 'training-overview',
          component: () => import('../views/TrainingView.vue'),
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
      component: () => import('../views/SettingsView.vue'),
    },
    {
      path: '/licenses',
      name: 'licenses',
      component: () => import('../views/LicensesView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
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
