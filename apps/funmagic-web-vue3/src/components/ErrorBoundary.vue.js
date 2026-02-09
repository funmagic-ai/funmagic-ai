import { NButton, NIcon, NResult } from 'naive-ui';
import { RefreshOutline } from '@vicons/ionicons5';
const props = withDefaults(defineProps(), {
    fallbackTitle: 'Something went wrong',
    fallbackDescription: 'An unexpected error occurred. Please try again.',
});
const error = ref(null);
const errorInfo = ref('');
onErrorCaptured((err, instance, info) => {
    error.value = err;
    errorInfo.value = info;
    console.error('[ErrorBoundary]', info, err);
    return false;
});
function handleRetry() {
    error.value = null;
    errorInfo.value = '';
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    fallbackTitle: 'Something went wrong',
    fallbackDescription: 'An unexpected error occurred. Please try again.',
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (!__VLS_ctx.error) {
    var __VLS_0 = {};
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-center py-16" },
    });
    const __VLS_2 = {}.NResult;
    /** @type {[typeof __VLS_components.NResult, typeof __VLS_components.NResult, ]} */ ;
    // @ts-ignore
    const __VLS_3 = __VLS_asFunctionalComponent(__VLS_2, new __VLS_2({
        status: "error",
        title: (__VLS_ctx.fallbackTitle),
        description: (__VLS_ctx.fallbackDescription),
    }));
    const __VLS_4 = __VLS_3({
        status: "error",
        title: (__VLS_ctx.fallbackTitle),
        description: (__VLS_ctx.fallbackDescription),
    }, ...__VLS_functionalComponentArgsRest(__VLS_3));
    __VLS_5.slots.default;
    {
        const { footer: __VLS_thisSlot } = __VLS_5.slots;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-4" },
        });
        const __VLS_6 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_8 = __VLS_7({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        let __VLS_10;
        let __VLS_11;
        let __VLS_12;
        const __VLS_13 = {
            onClick: (__VLS_ctx.handleRetry)
        };
        __VLS_9.slots.default;
        {
            const { icon: __VLS_thisSlot } = __VLS_9.slots;
            const __VLS_14 = {}.NIcon;
            /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
            // @ts-ignore
            const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({}));
            const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
            __VLS_17.slots.default;
            const __VLS_18 = {}.RefreshOutline;
            /** @type {[typeof __VLS_components.RefreshOutline, ]} */ ;
            // @ts-ignore
            const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({}));
            const __VLS_20 = __VLS_19({}, ...__VLS_functionalComponentArgsRest(__VLS_19));
            var __VLS_17;
        }
        var __VLS_9;
        if (__VLS_ctx.error) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.details, __VLS_intrinsicElements.details)({
                ...{ class: "mt-4 text-left text-sm" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.summary, __VLS_intrinsicElements.summary)({
                ...{ class: "cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
                ...{ class: "mt-2 max-h-48 overflow-auto rounded bg-gray-100 p-3 text-xs dark:bg-gray-800" },
            });
            (__VLS_ctx.error.message);
            (__VLS_ctx.error.stack);
        }
    }
    var __VLS_5;
}
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-16']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:hover:text-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-48']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NIcon: NIcon,
            NResult: NResult,
            RefreshOutline: RefreshOutline,
            error: error,
            handleRetry: handleRetry,
        };
    },
    __typeProps: {},
    props: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
