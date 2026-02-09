import { NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider, NLoadingBarProvider, darkTheme, } from 'naive-ui';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
const appStore = useAppStore();
const authStore = useAuthStore();
const THEME_PRIMARY_COLORS = {
    purple: '#9333ea',
    blue: '#3b82f6',
    green: '#22c55e',
    orange: '#f97316',
    red: '#ef4444',
    teal: '#14b8a6',
    indigo: '#6366f1',
    slate: '#64748b',
};
const themeOverrides = computed(() => {
    const primary = THEME_PRIMARY_COLORS[appStore.currentTheme] || '#9333ea';
    return {
        common: {
            primaryColor: primary,
            primaryColorHover: primary,
            primaryColorPressed: primary,
            primaryColorSuppl: primary,
        },
        Card: {
            borderRadius: '0.75rem',
        },
    };
});
const theme = computed(() => (appStore.isDark ? darkTheme : null));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.NConfigProvider;
/** @type {[typeof __VLS_components.NConfigProvider, typeof __VLS_components.NConfigProvider, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    theme: (__VLS_ctx.theme),
    themeOverrides: (__VLS_ctx.themeOverrides),
}));
const __VLS_2 = __VLS_1({
    theme: (__VLS_ctx.theme),
    themeOverrides: (__VLS_ctx.themeOverrides),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
const __VLS_5 = {}.NLoadingBarProvider;
/** @type {[typeof __VLS_components.NLoadingBarProvider, typeof __VLS_components.NLoadingBarProvider, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_8.slots.default;
const __VLS_9 = {}.NMessageProvider;
/** @type {[typeof __VLS_components.NMessageProvider, typeof __VLS_components.NMessageProvider, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({}));
const __VLS_11 = __VLS_10({}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
const __VLS_13 = {}.NDialogProvider;
/** @type {[typeof __VLS_components.NDialogProvider, typeof __VLS_components.NDialogProvider, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({}));
const __VLS_15 = __VLS_14({}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
const __VLS_17 = {}.NNotificationProvider;
/** @type {[typeof __VLS_components.NNotificationProvider, typeof __VLS_components.NNotificationProvider, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({}));
const __VLS_19 = __VLS_18({}, ...__VLS_functionalComponentArgsRest(__VLS_18));
__VLS_20.slots.default;
if (__VLS_ctx.authStore.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex h-screen items-center justify-center" },
    });
    const __VLS_21 = {}.NSpin;
    /** @type {[typeof __VLS_components.NSpin, typeof __VLS_components.nSpin, ]} */ ;
    // @ts-ignore
    const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
        size: "large",
    }));
    const __VLS_23 = __VLS_22({
        size: "large",
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
}
else {
    const __VLS_25 = {}.RouterView;
    /** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({}));
    const __VLS_27 = __VLS_26({}, ...__VLS_functionalComponentArgsRest(__VLS_26));
}
var __VLS_20;
var __VLS_16;
var __VLS_12;
var __VLS_8;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NConfigProvider: NConfigProvider,
            NMessageProvider: NMessageProvider,
            NDialogProvider: NDialogProvider,
            NNotificationProvider: NNotificationProvider,
            NLoadingBarProvider: NLoadingBarProvider,
            authStore: authStore,
            themeOverrides: themeOverrides,
            theme: theme,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
