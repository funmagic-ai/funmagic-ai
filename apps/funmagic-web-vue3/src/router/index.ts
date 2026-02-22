import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/:locale?',
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: 'tools',
          name: 'tools',
          component: () => import('@/views/ToolsView.vue'),
        },
        {
          path: 'tools/background-remove',
          name: 'background-remove',
          component: () => import('@/views/tools/BackgroundRemoveView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'tools/figme',
          name: 'figme',
          component: () => import('@/views/tools/FigmeView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'tools/vintage-trace',
          name: 'vintage-trace',
          component: () => import('@/views/tools/VintageTraceView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'tools/crystal-memory',
          name: 'crystal-memory',
          component: () => import('@/views/tools/CrystalMemoryView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'tools/image-to-3d',
          name: 'image-to-3d',
          component: () => import('@/views/tools/ImageTo3dView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'tools/:slug',
          name: 'tool-detail',
          component: () => import('@/views/ToolDetailView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'pricing',
          name: 'pricing',
          component: () => import('@/views/PricingView.vue'),
        },
        {
          path: 'login',
          name: 'login',
          component: () => import('@/views/LoginView.vue'),
          meta: { guestOnly: true },
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('@/views/RegisterView.vue'),
          meta: { guestOnly: true },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'assets',
          name: 'assets',
          component: () => import('@/views/AssetsView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'terms',
          name: 'terms',
          component: () => import('@/views/TermsView.vue'),
        },
        {
          path: 'privacy',
          name: 'privacy',
          component: () => import('@/views/PrivacyView.vue'),
        },
        {
          path: 'help',
          name: 'help',
          component: () => import('@/views/HelpView.vue'),
        },
        {
          path: 'rate-limit',
          name: 'rate-limit',
          component: () => import('@/views/RateLimitView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

setupGuards(router)

export default router
