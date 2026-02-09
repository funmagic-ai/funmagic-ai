const __VLS_props = defineProps();
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2" },
});
for (const [step, idx] of __VLS_getVForSourceType((__VLS_ctx.steps))) {
    (step.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors" },
        ...{ class: ([
                idx < __VLS_ctx.currentStep || (idx === __VLS_ctx.currentStep && idx === __VLS_ctx.steps.length - 1)
                    ? 'border-green-500 bg-green-500 text-white'
                    : idx === __VLS_ctx.currentStep
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30 text-muted-foreground'
            ]) },
    });
    if (idx < __VLS_ctx.currentStep || (idx === __VLS_ctx.currentStep && idx === __VLS_ctx.steps.length - 1)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "3",
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
            points: "20 6 9 17 4 12",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (idx + 1);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm font-medium hidden sm:inline" },
        ...{ class: (idx <= __VLS_ctx.currentStep ? 'text-foreground' : 'text-muted-foreground') },
    });
    (step.label);
    if (idx < __VLS_ctx.steps.length - 1) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "flex-1 h-0.5 min-w-4" },
            ...{ class: (idx < __VLS_ctx.currentStep ? 'bg-green-500' : 'bg-muted-foreground/20') },
        });
    }
}
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:inline']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-4']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
