import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const props = defineProps();
const friendlyMessages = {
    // Background removal step
    'Preparing image': 'Preparing your image...',
    'Uploading to processing server': 'Processing your image...',
    'Starting background removal': 'Removing background...',
    'Processing background removal...': 'Removing background...',
    'Processing...': 'Working on it...',
    'Saving result': 'Almost done...',
    'Complete': 'Done!',
    // VGGT step
    'Preparing image for VGGT': 'Preparing for 3D generation...',
    'Initializing Replicate client': 'Initializing 3D engine...',
    'Calling VGGT API': 'Generating 3D point cloud...',
    'Processing VGGT output': 'Processing 3D data...',
    'Processing point cloud data': 'Building point cloud...',
    'Extracting colors': 'Extracting colors...',
    'Generating output': 'Finalizing...',
};
const friendlySteps = {
    'Remove Background': 'Removing Background',
    'Generate Point Cloud': 'Creating 3D Model',
};
const displayMessage = computed(() => {
    const raw = props.progress?.message;
    if (!raw)
        return null;
    return friendlyMessages[raw] ?? raw;
});
const displayStep = computed(() => {
    const raw = props.progress?.currentStep;
    if (!raw)
        return null;
    return friendlySteps[raw] ?? raw;
});
const statusColor = computed(() => {
    switch (props.progress?.status) {
        case 'processing': return 'text-blue-500';
        case 'completed': return 'text-green-500';
        case 'failed': return 'text-red-500';
        default: return 'text-muted-foreground';
    }
});
const progressBarColor = computed(() => {
    switch (props.progress?.status) {
        case 'processing': return 'bg-primary';
        case 'completed': return 'bg-green-500';
        case 'failed': return 'bg-red-500';
        default: return 'bg-muted-foreground';
    }
});
const statusLabel = computed(() => {
    switch (props.progress?.status) {
        case 'connecting': return t('tools.progress.connecting');
        case 'connected': return t('tools.progress.connected');
        case 'pending': return t('tools.progress.pending');
        case 'queued': return t('tools.progress.queued');
        case 'processing': return t('tools.progress.processing');
        case 'completed': return t('tools.progress.completed');
        case 'failed': return t('tools.progress.failed');
        default: return '';
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.progress) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rounded-xl border bg-card p-6 space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-3" },
    });
    if (__VLS_ctx.progress.status === 'processing' || __VLS_ctx.progress.status === 'connecting') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "h-5 w-5" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            ...{ class: "animate-spin h-5 w-5 text-primary" },
            xmlns: "http://www.w3.org/2000/svg",
            fill: "none",
            viewBox: "0 0 24 24",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
            ...{ class: "opacity-25" },
            cx: "12",
            cy: "12",
            r: "10",
            stroke: "currentColor",
            'stroke-width': "4",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            ...{ class: "opacity-75" },
            fill: "currentColor",
            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z",
        });
    }
    else if (__VLS_ctx.progress.status === 'completed') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "h-5 w-5 text-green-500" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            width: "20",
            height: "20",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2.5",
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M22 11.08V12a10 10 0 1 1-5.93-9.14",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
            points: "22 4 12 14.01 9 11.01",
        });
    }
    else if (__VLS_ctx.progress.status === 'failed') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "h-5 w-5 text-red-500" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            width: "20",
            height: "20",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2.5",
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
            cx: "12",
            cy: "12",
            r: "10",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "m15 9-6 6",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "m9 9 6 6",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "font-medium" },
        ...{ class: (__VLS_ctx.statusColor) },
    });
    (__VLS_ctx.statusLabel);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm tabular-nums text-muted-foreground" },
    });
    (__VLS_ctx.progress.progress);
    if (__VLS_ctx.displayStep || __VLS_ctx.displayMessage) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-1" },
        });
        if (__VLS_ctx.displayStep) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-sm font-medium text-muted-foreground" },
            });
            (__VLS_ctx.displayStep);
        }
        if (__VLS_ctx.displayMessage) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-xs text-muted-foreground" },
            });
            (__VLS_ctx.displayMessage);
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h-2 rounded-full bg-muted overflow-hidden" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "h-full rounded-full transition-all duration-500 ease-out" },
        ...{ class: (__VLS_ctx.progressBarColor) },
        ...{ style: ({ width: `${__VLS_ctx.progress.progress}%` }) },
    });
    if (__VLS_ctx.progress.error) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm text-red-600 dark:text-red-400" },
        });
        (__VLS_ctx.progress.error);
    }
}
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-500']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['h-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-500']} */ ;
/** @type {__VLS_StyleScopedClasses['ease-out']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-50']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-red-950/20']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-red-200']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-red-800']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-red-400']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            displayMessage: displayMessage,
            displayStep: displayStep,
            statusColor: statusColor,
            progressBarColor: progressBarColor,
            statusLabel: statusLabel,
        };
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
