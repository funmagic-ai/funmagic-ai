import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: () => import('@/views/UnauthorizedView.vue'),
    },
    {
      path: '/rate-limit',
      name: 'rate-limit',
      component: () => import('@/views/RateLimitView.vue'),
    },
    {
      path: '/dashboard',
      component: () => import('@/views/dashboard/DashboardLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/dashboard/OverviewView.vue'),
        },
        // Tools
        {
          path: 'tools',
          name: 'tools',
          component: () => import('@/views/dashboard/tools/ToolsListView.vue'),
        },
        {
          path: 'tools/new',
          name: 'tools-create',
          component: () => import('@/views/dashboard/tools/ToolCreateView.vue'),
        },
        {
          path: 'tools/:id',
          name: 'tools-detail',
          component: () => import('@/views/dashboard/tools/ToolDetailView.vue'),
        },
        // Tool Types
        {
          path: 'tool-types',
          name: 'tool-types',
          component: () => import('@/views/dashboard/tool-types/ToolTypesListView.vue'),
        },
        {
          path: 'tool-types/new',
          name: 'tool-types-create',
          component: () => import('@/views/dashboard/tool-types/ToolTypeCreateView.vue'),
        },
        {
          path: 'tool-types/:id',
          name: 'tool-types-detail',
          component: () => import('@/views/dashboard/tool-types/ToolTypeDetailView.vue'),
        },
        // Providers
        {
          path: 'providers',
          name: 'providers',
          component: () => import('@/views/dashboard/providers/ProvidersListView.vue'),
        },
        {
          path: 'providers/new',
          name: 'providers-create',
          component: () => import('@/views/dashboard/providers/ProviderCreateView.vue'),
        },
        {
          path: 'providers/:id',
          name: 'providers-detail',
          component: () => import('@/views/dashboard/providers/ProviderDetailView.vue'),
        },
        // Admin Providers
        {
          path: 'admin-providers',
          name: 'admin-providers',
          component: () => import('@/views/dashboard/admin-providers/AdminProvidersListView.vue'),
          meta: { requiresSuperAdmin: true },
        },
        {
          path: 'admin-providers/new',
          name: 'admin-providers-create',
          component: () => import('@/views/dashboard/admin-providers/AdminProviderCreateView.vue'),
          meta: { requiresSuperAdmin: true },
        },
        {
          path: 'admin-providers/:id',
          name: 'admin-providers-detail',
          component: () => import('@/views/dashboard/admin-providers/AdminProviderDetailView.vue'),
          meta: { requiresSuperAdmin: true },
        },
        // Users
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/dashboard/users/UsersListView.vue'),
        },
        {
          path: 'users/:id',
          name: 'users-detail',
          component: () => import('@/views/dashboard/users/UserDetailView.vue'),
        },
        // Tasks
        {
          path: 'tasks',
          name: 'tasks',
          component: () => import('@/views/dashboard/tasks/TasksListView.vue'),
        },
        {
          path: 'tasks/:id',
          name: 'tasks-detail',
          component: () => import('@/views/dashboard/tasks/TaskDetailView.vue'),
        },
        // Studio Projects (overview table)
        {
          path: 'studio/projects',
          name: 'studio-projects',
          component: () => import('@/views/dashboard/studio/StudioProjectsList.vue'),
        },
        {
          path: 'studio/projects/:id',
          name: 'studio-projects-detail',
          component: () => import('@/views/dashboard/studio/StudioProjectDetail.vue'),
        },
        // Billing
        {
          path: 'billing/packages',
          name: 'packages',
          component: () => import('@/views/dashboard/billing/PackagesListView.vue'),
        },
        {
          path: 'billing/packages/new',
          name: 'packages-create',
          component: () => import('@/views/dashboard/billing/PackageCreateView.vue'),
        },
        {
          path: 'billing/packages/:id',
          name: 'packages-detail',
          component: () => import('@/views/dashboard/billing/PackageDetailView.vue'),
        },
        // Content
        {
          path: 'content/banners',
          name: 'banners',
          component: () => import('@/views/dashboard/content/BannersListView.vue'),
        },
        {
          path: 'content/banners/new',
          name: 'banners-create',
          component: () => import('@/views/dashboard/content/BannerCreateView.vue'),
        },
        {
          path: 'content/banners/:id',
          name: 'banners-detail',
          component: () => import('@/views/dashboard/content/BannerDetailView.vue'),
        },
        // Queue
        {
          path: 'queue',
          name: 'queue',
          component: () => import('@/views/dashboard/queue/QueueView.vue'),
        },
        // Settings
        {
          path: 'settings/rate-limits',
          name: 'settings-rate-limits',
          component: () => import('@/views/dashboard/settings/RateLimitSettingsView.vue'),
        },
        // Creative Studio (workspace)
        {
          path: 'studio',
          component: () => import('@/views/dashboard/studio/StudioLayout.vue'),
          children: [
            {
              path: '',
              name: 'studio',
              component: () => import('@/views/dashboard/studio/StudioEmptyState.vue'),
            },
            {
              path: ':id',
              name: 'studio-project',
              component: () => import('@/views/dashboard/studio/StudioWorkspace.vue'),
            },
          ],
        },
      ],
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

setupGuards(router)

export default router
