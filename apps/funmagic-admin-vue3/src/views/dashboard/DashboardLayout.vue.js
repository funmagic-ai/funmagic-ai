import AdminSidebar from '@/components/layout/AdminSidebar.vue';
import AdminHeader from '@/components/layout/AdminHeader.vue';
import { useAppStore } from '@/stores/app';
import { useMediaQuery } from '@vueuse/core';
const appStore = useAppStore();
const route = useRoute();
const isMobile = useMediaQuery('(max-width: 767px)');
const mobileOpen = ref(false);
// Close mobile overlay when navigating
watch(() => route.path, () => {
    if (isMobile.value) {
        mobileOpen.value = false;
    }
});
// Provide toggle function so AdminHeader can call it
function toggleSidebar() {
    if (isMobile.value) {
        mobileOpen.value = !mobileOpen.value;
    }
    else {
        appStore.toggleSidebar();
    }
}
provide('toggleSidebar', toggleSidebar);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex h-screen w-screen overflow-hidden bg-background" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hidden md:flex shrink-0" },
});
/** @type {[typeof AdminSidebar, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AdminSidebar, new AdminSidebar({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
const __VLS_3 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
    to: "body",
}));
const __VLS_5 = __VLS_4({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
__VLS_6.slots.default;
const __VLS_7 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
    name: "overlay",
}));
const __VLS_9 = __VLS_8({
    name: "overlay",
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
__VLS_10.slots.default;
if (__VLS_ctx.mobileOpen && __VLS_ctx.isMobile) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mobileOpen && __VLS_ctx.isMobile))
                    return;
                __VLS_ctx.mobileOpen = false;
            } },
        ...{ class: "fixed inset-0 z-40 bg-black/50 md:hidden" },
    });
}
var __VLS_10;
const __VLS_11 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
    name: "slide",
}));
const __VLS_13 = __VLS_12({
    name: "slide",
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
__VLS_14.slots.default;
if (__VLS_ctx.mobileOpen && __VLS_ctx.isMobile) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-y-0 left-0 z-50 w-64 md:hidden" },
    });
    /** @type {[typeof AdminSidebar, ]} */ ;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent(AdminSidebar, new AdminSidebar({}));
    const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
}
var __VLS_14;
var __VLS_6;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-1 flex-col overflow-hidden" },
});
/** @type {[typeof AdminHeader, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(AdminHeader, new AdminHeader({}));
const __VLS_19 = __VLS_18({}, ...__VLS_functionalComponentArgsRest(__VLS_18));
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "flex-1 overflow-y-auto px-4 pb-4 pt-4 md:px-8 md:pb-8 md:pt-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mx-auto max-w-7xl" },
});
const __VLS_21 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({}));
const __VLS_23 = __VLS_22({}, ...__VLS_functionalComponentArgsRest(__VLS_22));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['w-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-background']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-40']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black/50']} */ ;
/** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-y-0']} */ ;
/** @type {__VLS_StyleScopedClasses['left-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['w-64']} */ ;
/** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['md:pb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['md:pt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-7xl']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AdminSidebar: AdminSidebar,
            AdminHeader: AdminHeader,
            isMobile: isMobile,
            mobileOpen: mobileOpen,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
