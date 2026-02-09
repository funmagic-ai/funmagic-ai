import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { NIcon } from 'naive-ui';
import { PersonOutline, ImagesOutline, LogOutOutline, ChevronDownOutline, } from '@vicons/ionicons5';
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const currentLocale = computed(() => route.params.locale || 'en');
const userInitial = computed(() => {
    const name = authStore.user?.name;
    if (!name)
        return '?';
    return name.charAt(0).toUpperCase();
});
// Fetch credit balance
const { data: balanceData } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: async () => {
        const { data } = await api.GET('/api/credits/balance');
        return data;
    },
    enabled: computed(() => authStore.isAuthenticated),
});
const creditBalance = computed(() => {
    const bal = balanceData.value;
    return bal?.balance ?? 0;
});
const menuOptions = computed(() => [
    // Email header (non-clickable)
    {
        key: 'user-info',
        type: 'render',
        render: () => h('div', { class: 'px-3 py-2' }, [
            h('p', { class: 'text-sm font-medium text-foreground' }, authStore.user?.name || ''),
            h('p', { class: 'text-xs text-muted-foreground mt-0.5' }, authStore.user?.email || ''),
        ]),
    },
    { type: 'divider', key: 'd0' },
    {
        label: t('nav.profile'),
        key: 'profile',
        icon: () => h(NIcon, null, { default: () => h(PersonOutline) }),
    },
    {
        label: t('nav.assets'),
        key: 'assets',
        icon: () => h(NIcon, null, { default: () => h(ImagesOutline) }),
    },
    { type: 'divider', key: 'd1' },
    {
        label: t('nav.logout'),
        key: 'logout',
        icon: () => h(NIcon, null, { default: () => h(LogOutOutline) }),
    },
]);
async function handleSelect(key) {
    if (key === 'user-info')
        return;
    if (key === 'logout') {
        await authStore.signOut();
        router.push({ name: 'home', params: { locale: currentLocale.value } });
    }
    else {
        router.push({ name: key, params: { locale: currentLocale.value } });
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "hidden items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 md:flex" },
});
(__VLS_ctx.creditBalance);
(__VLS_ctx.t('tools.credits'));
const __VLS_0 = {}.NDropdown;
/** @type {[typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onSelect': {} },
    options: (__VLS_ctx.menuOptions),
    trigger: "click",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSelect': {} },
    options: (__VLS_ctx.menuOptions),
    trigger: "click",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onSelect: (__VLS_ctx.handleSelect)
};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-transparent p-0.5 transition-colors hover:bg-accent" },
});
const __VLS_8 = {}.NAvatar;
/** @type {[typeof __VLS_components.NAvatar, typeof __VLS_components.nAvatar, typeof __VLS_components.NAvatar, typeof __VLS_components.nAvatar, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    round: true,
    size: (28),
    src: (__VLS_ctx.authStore.user?.image ?? undefined),
}));
const __VLS_10 = __VLS_9({
    round: true,
    size: (28),
    src: (__VLS_ctx.authStore.user?.image ?? undefined),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
if (!__VLS_ctx.authStore.user?.image) {
    (__VLS_ctx.userInitial);
}
var __VLS_11;
const __VLS_12 = {}.NIcon;
/** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    size: (14),
    ...{ class: "hidden text-muted-foreground md:block" },
}));
const __VLS_14 = __VLS_13({
    size: (14),
    ...{ class: "hidden text-muted-foreground md:block" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
const __VLS_16 = {}.ChevronDownOutline;
/** @type {[typeof __VLS_components.ChevronDownOutline, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({}));
const __VLS_18 = __VLS_17({}, ...__VLS_functionalComponentArgsRest(__VLS_17));
var __VLS_15;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-amber-100']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-amber-700']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-amber-900/30']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-amber-400']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['p-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-accent']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['md:block']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NIcon: NIcon,
            ChevronDownOutline: ChevronDownOutline,
            t: t,
            authStore: authStore,
            userInitial: userInitial,
            creditBalance: creditBalance,
            menuOptions: menuOptions,
            handleSelect: handleSelect,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
