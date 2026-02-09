import { NMenu, NIcon } from 'naive-ui';
import { HomeOutline, BuildOutline, ListOutline, ServerOutline, ShieldCheckmarkOutline, PeopleOutline, ClipboardOutline, DocumentTextOutline, WalletOutline, ImagesOutline, LayersOutline, ChatboxOutline, SpeedometerOutline, } from '@vicons/ionicons5';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';
const appStore = useAppStore();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();
function renderIcon(icon) {
    return () => h(NIcon, null, { default: () => h(icon) });
}
const menuOptions = computed(() => {
    const items = [
        // Main
        {
            type: 'group',
            label: 'Main',
            key: 'main-group',
            children: [
                {
                    label: t('nav.dashboard'),
                    key: 'dashboard',
                    icon: renderIcon(HomeOutline),
                },
            ],
        },
        // Content
        {
            type: 'group',
            label: 'Content',
            key: 'content-group',
            children: [
                {
                    label: t('nav.tools'),
                    key: 'tools',
                    icon: renderIcon(BuildOutline),
                },
                {
                    label: t('nav.toolTypes'),
                    key: 'tool-types',
                    icon: renderIcon(ListOutline),
                },
            ],
        },
        // Infrastructure
        {
            type: 'group',
            label: 'Infrastructure',
            key: 'infra-group',
            children: [
                {
                    label: t('nav.providers'),
                    key: 'providers',
                    icon: renderIcon(ServerOutline),
                },
                ...(authStore.isSuperAdmin
                    ? [
                        {
                            label: t('nav.adminProviders'),
                            key: 'admin-providers',
                            icon: renderIcon(ShieldCheckmarkOutline),
                        },
                    ]
                    : []),
            ],
        },
        // Users & Tasks
        {
            type: 'group',
            label: 'Users & Tasks',
            key: 'users-tasks-group',
            children: [
                {
                    label: t('nav.users'),
                    key: 'users',
                    icon: renderIcon(PeopleOutline),
                },
                {
                    label: t('nav.tasks'),
                    key: 'tasks',
                    icon: renderIcon(ClipboardOutline),
                },
                {
                    label: t('nav.adminTasks'),
                    key: 'admin-tasks',
                    icon: renderIcon(DocumentTextOutline),
                },
            ],
        },
        // Business
        {
            type: 'group',
            label: 'Business',
            key: 'business-group',
            children: [
                {
                    label: t('nav.packages'),
                    key: 'packages',
                    icon: renderIcon(WalletOutline),
                },
                {
                    label: t('nav.banners'),
                    key: 'banners',
                    icon: renderIcon(ImagesOutline),
                },
            ],
        },
        // System
        {
            type: 'group',
            label: 'System',
            key: 'system-group',
            children: [
                {
                    label: t('nav.queue'),
                    key: 'queue',
                    icon: renderIcon(LayersOutline),
                },
                {
                    label: t('nav.aiStudio'),
                    key: 'ai-studio',
                    icon: renderIcon(ChatboxOutline),
                },
            ],
        },
    ];
    return items;
});
const activeKey = computed(() => {
    const name = route.name;
    if (!name)
        return 'dashboard';
    // Map route names to menu keys
    if (name.startsWith('packages') || name === 'packages')
        return 'packages';
    if (name.startsWith('banners') || name === 'banners')
        return 'banners';
    if (name.startsWith('tool-types'))
        return 'tool-types';
    if (name.startsWith('admin-providers'))
        return 'admin-providers';
    if (name.startsWith('admin-tasks'))
        return 'admin-tasks';
    if (name.startsWith('ai-studio'))
        return 'ai-studio';
    if (name.startsWith('tools'))
        return 'tools';
    if (name.startsWith('providers'))
        return 'providers';
    if (name.startsWith('users'))
        return 'users';
    if (name.startsWith('tasks'))
        return 'tasks';
    if (name === 'queue')
        return 'queue';
    return 'dashboard';
});
const ROUTE_MAP = {
    dashboard: '/dashboard',
    tools: '/dashboard/tools',
    'tool-types': '/dashboard/tool-types',
    providers: '/dashboard/providers',
    'admin-providers': '/dashboard/admin-providers',
    users: '/dashboard/users',
    tasks: '/dashboard/tasks',
    'admin-tasks': '/dashboard/admin-tasks',
    packages: '/dashboard/billing/packages',
    banners: '/dashboard/content/banners',
    queue: '/dashboard/queue',
    'ai-studio': '/dashboard/ai-studio',
};
function handleUpdateValue(key) {
    const path = ROUTE_MAP[key];
    if (path) {
        router.push(path);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200" },
    ...{ class: (__VLS_ctx.appStore.sidebarCollapsed ? 'w-16' : 'w-64') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex h-16 items-center border-b border-sidebar-border px-4" },
});
const __VLS_0 = {}.NIcon;
/** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    size: (24),
    ...{ class: "text-primary shrink-0" },
}));
const __VLS_2 = __VLS_1({
    size: (24),
    ...{ class: "text-primary shrink-0" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.SpeedometerOutline;
/** @type {[typeof __VLS_components.SpeedometerOutline, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
var __VLS_3;
const __VLS_8 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    name: "fade",
}));
const __VLS_10 = __VLS_9({
    name: "fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
if (!__VLS_ctx.appStore.sidebarCollapsed) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "ml-2.5 text-base font-bold text-sidebar-foreground whitespace-nowrap" },
    });
    (__VLS_ctx.t('common.appName'));
}
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-1 overflow-y-auto overflow-x-hidden py-2" },
});
const __VLS_12 = {}.NMenu;
/** @type {[typeof __VLS_components.NMenu, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onUpdate:value': {} },
    value: (__VLS_ctx.activeKey),
    collapsed: (__VLS_ctx.appStore.sidebarCollapsed),
    collapsedWidth: (64),
    collapsedIconSize: (20),
    options: (__VLS_ctx.menuOptions),
    indent: (20),
}));
const __VLS_14 = __VLS_13({
    ...{ 'onUpdate:value': {} },
    value: (__VLS_ctx.activeKey),
    collapsed: (__VLS_ctx.appStore.sidebarCollapsed),
    collapsedWidth: (64),
    collapsedIconSize: (20),
    options: (__VLS_ctx.menuOptions),
    indent: (20),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    'onUpdate:value': (__VLS_ctx.handleUpdateValue)
};
var __VLS_15;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['border-r']} */ ;
/** @type {__VLS_StyleScopedClasses['border-sidebar-border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-[width]']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-16']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-sidebar-border']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sidebar-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-x-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NMenu: NMenu,
            NIcon: NIcon,
            SpeedometerOutline: SpeedometerOutline,
            appStore: appStore,
            t: t,
            menuOptions: menuOptions,
            activeKey: activeKey,
            handleUpdateValue: handleUpdateValue,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
