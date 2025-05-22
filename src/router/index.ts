import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/clef-treble',
      name: 'clef treble',
      component: () => import('../views/TrebleView.vue'),
    },
    {
      path: '/clef-bass',
      name: 'clef bass',
      component: () => import('../views/BassView.vue'),
    },
    {
      path: '/mixed',
      name: 'mixed',
      component: () => import('../views/MixedView.vue'),
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

export default router
