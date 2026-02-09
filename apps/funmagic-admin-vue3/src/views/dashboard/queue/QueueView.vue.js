import { NIcon, NSpin, NEmpty, NButton } from 'naive-ui';
import { HourglassOutline, FlashOutline, CheckmarkCircleOutline, CloseCircleOutline, TimeOutline, RefreshOutline, } from '@vicons/ionicons5';
import { useQuery } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import PageHeader from '@/components/shared/PageHeader.vue';
const { t } = useI18n();
// Queue stats API may not exist - we'll handle gracefully
const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: async () => {
        // Placeholder: the /api/admin/queue/stats endpoint may not exist
        // If it doesn't, we'll catch the error and show a placeholder
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/queue/stats`, { credentials: 'include' });
            if (!response.ok)
                throw new Error('API not available');
            return await response.json();
        }
        catch {
            throw new Error('Queue API is not available');
        }
    },
    retry: false,
});
const stats = computed(() => [
    {
        label: t('queue.waiting'),
        value: data.value?.waiting ?? 0,
        icon: HourglassOutline,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
    },
    {
        label: t('queue.active'),
        value: data.value?.active ?? 0,
        icon: FlashOutline,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
    },
    {
        label: t('queue.completed'),
        value: data.value?.completed ?? 0,
        icon: CheckmarkCircleOutline,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
    },
    {
        label: t('queue.failed'),
        value: data.value?.failed ?? 0,
        icon: CloseCircleOutline,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
    },
    {
        label: t('queue.delayed'),
        value: data.value?.delayed ?? 0,
        icon: TimeOutline,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
    },
]);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: (__VLS_ctx.t('queue.title')),
    description: "Monitor background job processing",
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('queue.title')),
    description: "Monitor background job processing",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_2.slots.default;
{
    const { actions: __VLS_thisSlot } = __VLS_2.slots;
    const __VLS_3 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.isLoading),
    }));
    const __VLS_5 = __VLS_4({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.isLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    let __VLS_7;
    let __VLS_8;
    let __VLS_9;
    const __VLS_10 = {
        onClick: (() => __VLS_ctx.refetch())
    };
    __VLS_6.slots.default;
    {
        const { icon: __VLS_thisSlot } = __VLS_6.slots;
        const __VLS_11 = {}.NIcon;
        /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({}));
        const __VLS_13 = __VLS_12({}, ...__VLS_functionalComponentArgsRest(__VLS_12));
        __VLS_14.slots.default;
        const __VLS_15 = {}.RefreshOutline;
        /** @type {[typeof __VLS_components.RefreshOutline, ]} */ ;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({}));
        const __VLS_17 = __VLS_16({}, ...__VLS_functionalComponentArgsRest(__VLS_16));
        var __VLS_14;
    }
    var __VLS_6;
}
var __VLS_2;
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-center py-12" },
    });
    const __VLS_19 = {}.NSpin;
    /** @type {[typeof __VLS_components.NSpin, ]} */ ;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
        size: "large",
    }));
    const __VLS_21 = __VLS_20({
        size: "large",
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
}
else if (__VLS_ctx.isError) {
    const __VLS_23 = {}.NCard;
    /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({}));
    const __VLS_25 = __VLS_24({}, ...__VLS_functionalComponentArgsRest(__VLS_24));
    __VLS_26.slots.default;
    const __VLS_27 = {}.NEmpty;
    /** @type {[typeof __VLS_components.NEmpty, typeof __VLS_components.NEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
        description: "Queue stats API is not yet available.",
        ...{ class: "py-12" },
    }));
    const __VLS_29 = __VLS_28({
        description: "Queue stats API is not yet available.",
        ...{ class: "py-12" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
    __VLS_30.slots.default;
    {
        const { extra: __VLS_thisSlot } = __VLS_30.slots;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm text-muted-foreground" },
        });
    }
    var __VLS_30;
    var __VLS_26;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5" },
    });
    for (const [stat] of __VLS_getVForSourceType((__VLS_ctx.stats))) {
        const __VLS_31 = {}.NCard;
        /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
        // @ts-ignore
        const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
            key: (stat.label),
            size: "small",
        }));
        const __VLS_33 = __VLS_32({
            key: (stat.label),
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_32));
        __VLS_34.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex h-10 w-10 items-center justify-center rounded-lg" },
            ...{ class: (stat.bg) },
        });
        const __VLS_35 = {}.NIcon;
        /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
        // @ts-ignore
        const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
            size: (24),
            ...{ class: (stat.color) },
        }));
        const __VLS_37 = __VLS_36({
            size: (24),
            ...{ class: (stat.color) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_36));
        __VLS_38.slots.default;
        const __VLS_39 = ((stat.icon));
        // @ts-ignore
        const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({}));
        const __VLS_41 = __VLS_40({}, ...__VLS_functionalComponentArgsRest(__VLS_40));
        var __VLS_38;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm text-muted-foreground" },
        });
        (stat.label);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-xl font-bold text-foreground" },
        });
        var __VLS_34;
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5" },
    });
    for (const [stat] of __VLS_getVForSourceType((__VLS_ctx.stats))) {
        const __VLS_43 = {}.NCard;
        /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
        // @ts-ignore
        const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
            key: (stat.label),
            size: "small",
        }));
        const __VLS_45 = __VLS_44({
            key: (stat.label),
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_44));
        __VLS_46.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex h-10 w-10 items-center justify-center rounded-lg" },
            ...{ class: (stat.bg) },
        });
        const __VLS_47 = {}.NIcon;
        /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
        // @ts-ignore
        const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
            size: (24),
            ...{ class: (stat.color) },
        }));
        const __VLS_49 = __VLS_48({
            size: (24),
            ...{ class: (stat.color) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_48));
        __VLS_50.slots.default;
        const __VLS_51 = ((stat.icon));
        // @ts-ignore
        const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({}));
        const __VLS_53 = __VLS_52({}, ...__VLS_functionalComponentArgsRest(__VLS_52));
        var __VLS_50;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm text-muted-foreground" },
        });
        (stat.label);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-xl font-bold text-foreground" },
        });
        (stat.value.toLocaleString());
        var __VLS_46;
    }
}
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NIcon: NIcon,
            NSpin: NSpin,
            NEmpty: NEmpty,
            NButton: NButton,
            RefreshOutline: RefreshOutline,
            PageHeader: PageHeader,
            t: t,
            isLoading: isLoading,
            isError: isError,
            refetch: refetch,
            stats: stats,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
