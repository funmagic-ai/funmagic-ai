import { NButton, NCard, NDescriptions, NDescriptionsItem, NCode, NSpin, NEmpty, NIcon, } from 'naive-ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { ArrowBackOutline, RefreshOutline } from '@vicons/ionicons5';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const message = useMessage();
const queryClient = useQueryClient();
const taskId = computed(() => route.params.id);
// Fetch task detail
const { data: taskData, isLoading, isError, refetch, } = useQuery({
    queryKey: computed(() => ['task', taskId.value]),
    queryFn: async () => {
        const { data, error } = await api.GET('/api/tasks/{taskId}', {
            params: { path: { taskId: taskId.value } },
        });
        if (error)
            throw new Error('Failed to fetch task');
        return data;
    },
    enabled: computed(() => !!taskId.value),
});
const task = computed(() => taskData.value?.task ?? null);
const isFailed = computed(() => task.value?.status === 'failed');
// Format JSON for display
function formatJson(data) {
    if (data === null || data === undefined)
        return 'null';
    try {
        return JSON.stringify(data, null, 2);
    }
    catch {
        return String(data);
    }
}
// Retry mutation -- re-create the task with same input
const retryMutation = useMutation({
    mutationFn: async () => {
        if (!task.value?.payload?.input) {
            throw new Error('No input data available for retry');
        }
        // For retry, we would typically call a dedicated retry endpoint.
        // Since the API has POST /api/tasks for creating tasks,
        // we'd need the tool slug. As a workaround, we just refetch.
        // In production, you'd have an admin retry endpoint.
        message.info('Retry functionality requires a dedicated admin endpoint');
        throw new Error('Retry endpoint not implemented');
    },
    onError: (err) => {
        message.warning(err.message);
    },
});
function handleRetry() {
    retryMutation.mutate();
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: (`Task ${__VLS_ctx.task?.id?.substring(0, 8) ?? ''}...`),
}));
const __VLS_1 = __VLS_0({
    title: (`Task ${__VLS_ctx.task?.id?.substring(0, 8) ?? ''}...`),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_2.slots.default;
{
    const { actions: __VLS_thisSlot } = __VLS_2.slots;
    const __VLS_3 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        ...{ 'onClick': {} },
        quaternary: true,
    }));
    const __VLS_5 = __VLS_4({
        ...{ 'onClick': {} },
        quaternary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    let __VLS_7;
    let __VLS_8;
    let __VLS_9;
    const __VLS_10 = {
        onClick: (...[$event]) => {
            __VLS_ctx.router.back();
        }
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
        const __VLS_15 = {}.ArrowBackOutline;
        /** @type {[typeof __VLS_components.ArrowBackOutline, ]} */ ;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({}));
        const __VLS_17 = __VLS_16({}, ...__VLS_functionalComponentArgsRest(__VLS_16));
        var __VLS_14;
    }
    (__VLS_ctx.t('common.back'));
    var __VLS_6;
    if (__VLS_ctx.isFailed) {
        const __VLS_19 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
        // @ts-ignore
        const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
            ...{ 'onClick': {} },
            type: "warning",
            ghost: true,
            loading: (__VLS_ctx.retryMutation.isPending.value),
        }));
        const __VLS_21 = __VLS_20({
            ...{ 'onClick': {} },
            type: "warning",
            ghost: true,
            loading: (__VLS_ctx.retryMutation.isPending.value),
        }, ...__VLS_functionalComponentArgsRest(__VLS_20));
        let __VLS_23;
        let __VLS_24;
        let __VLS_25;
        const __VLS_26 = {
            onClick: (__VLS_ctx.handleRetry)
        };
        __VLS_22.slots.default;
        {
            const { icon: __VLS_thisSlot } = __VLS_22.slots;
            const __VLS_27 = {}.NIcon;
            /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
            // @ts-ignore
            const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({}));
            const __VLS_29 = __VLS_28({}, ...__VLS_functionalComponentArgsRest(__VLS_28));
            __VLS_30.slots.default;
            const __VLS_31 = {}.RefreshOutline;
            /** @type {[typeof __VLS_components.RefreshOutline, ]} */ ;
            // @ts-ignore
            const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({}));
            const __VLS_33 = __VLS_32({}, ...__VLS_functionalComponentArgsRest(__VLS_32));
            var __VLS_30;
        }
        (__VLS_ctx.t('tasks.retryTask'));
        var __VLS_22;
    }
}
var __VLS_2;
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-center py-12" },
    });
    const __VLS_35 = {}.NSpin;
    /** @type {[typeof __VLS_components.NSpin, ]} */ ;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
        size: "large",
    }));
    const __VLS_37 = __VLS_36({
        size: "large",
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
}
else if (__VLS_ctx.isError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "py-12 text-center" },
    });
    const __VLS_39 = {}.NEmpty;
    /** @type {[typeof __VLS_components.NEmpty, typeof __VLS_components.NEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
        description: "Task not found or failed to load",
    }));
    const __VLS_41 = __VLS_40({
        description: "Task not found or failed to load",
    }, ...__VLS_functionalComponentArgsRest(__VLS_40));
    __VLS_42.slots.default;
    {
        const { extra: __VLS_thisSlot } = __VLS_42.slots;
        const __VLS_43 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
        // @ts-ignore
        const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
            ...{ 'onClick': {} },
        }));
        const __VLS_45 = __VLS_44({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_44));
        let __VLS_47;
        let __VLS_48;
        let __VLS_49;
        const __VLS_50 = {
            onClick: (() => __VLS_ctx.refetch())
        };
        __VLS_46.slots.default;
        (__VLS_ctx.t('common.retry'));
        var __VLS_46;
    }
    var __VLS_42;
}
else if (__VLS_ctx.task) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 gap-6 lg:grid-cols-2" },
    });
    const __VLS_51 = {}.NCard;
    /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.NCard, ]} */ ;
    // @ts-ignore
    const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
        title: "Task Information",
        size: "small",
    }));
    const __VLS_53 = __VLS_52({
        title: "Task Information",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_52));
    __VLS_54.slots.default;
    const __VLS_55 = {}.NDescriptions;
    /** @type {[typeof __VLS_components.NDescriptions, typeof __VLS_components.NDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({
        labelPlacement: "left",
        column: (1),
        bordered: true,
    }));
    const __VLS_57 = __VLS_56({
        labelPlacement: "left",
        column: (1),
        bordered: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_56));
    __VLS_58.slots.default;
    const __VLS_59 = {}.NDescriptionsItem;
    /** @type {[typeof __VLS_components.NDescriptionsItem, typeof __VLS_components.NDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
        label: (__VLS_ctx.t('tasks.taskId')),
    }));
    const __VLS_61 = __VLS_60({
        label: (__VLS_ctx.t('tasks.taskId')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_60));
    __VLS_62.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({
        ...{ class: "text-xs" },
    });
    (__VLS_ctx.task.id);
    var __VLS_62;
    const __VLS_63 = {}.NDescriptionsItem;
    /** @type {[typeof __VLS_components.NDescriptionsItem, typeof __VLS_components.NDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_64 = __VLS_asFunctionalComponent(__VLS_63, new __VLS_63({
        label: (__VLS_ctx.t('tasks.user')),
    }));
    const __VLS_65 = __VLS_64({
        label: (__VLS_ctx.t('tasks.user')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_64));
    __VLS_66.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({
        ...{ class: "text-xs" },
    });
    (__VLS_ctx.task.userId);
    var __VLS_66;
    const __VLS_67 = {}.NDescriptionsItem;
    /** @type {[typeof __VLS_components.NDescriptionsItem, typeof __VLS_components.NDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({
        label: (__VLS_ctx.t('tasks.tool')),
    }));
    const __VLS_69 = __VLS_68({
        label: (__VLS_ctx.t('tasks.tool')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_68));
    __VLS_70.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({
        ...{ class: "text-xs" },
    });
    (__VLS_ctx.task.toolId);
    var __VLS_70;
    const __VLS_71 = {}.NDescriptionsItem;
    /** @type {[typeof __VLS_components.NDescriptionsItem, typeof __VLS_components.NDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_72 = __VLS_asFunctionalComponent(__VLS_71, new __VLS_71({
        label: (__VLS_ctx.t('tasks.status')),
    }));
    const __VLS_73 = __VLS_72({
        label: (__VLS_ctx.t('tasks.status')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_72));
    __VLS_74.slots.default;
    /** @type {[typeof StatusBadge, ]} */ ;
    // @ts-ignore
    const __VLS_75 = __VLS_asFunctionalComponent(StatusBadge, new StatusBadge({
        status: (__VLS_ctx.task.status),
    }));
    const __VLS_76 = __VLS_75({
        status: (__VLS_ctx.task.status),
    }, ...__VLS_functionalComponentArgsRest(__VLS_75));
    var __VLS_74;
    const __VLS_78 = {}.NDescriptionsItem;
    /** @type {[typeof __VLS_components.NDescriptionsItem, typeof __VLS_components.NDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_79 = __VLS_asFunctionalComponent(__VLS_78, new __VLS_78({
        label: "Credits Cost",
    }));
    const __VLS_80 = __VLS_79({
        label: "Credits Cost",
    }, ...__VLS_functionalComponentArgsRest(__VLS_79));
    __VLS_81.slots.default;
    (__VLS_ctx.task.creditsCost ?? '--');
    var __VLS_81;
    const __VLS_82 = {}.NDescriptionsItem;
    /** @type {[typeof __VLS_components.NDescriptionsItem, typeof __VLS_components.NDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_83 = __VLS_asFunctionalComponent(__VLS_82, new __VLS_82({
        label: (__VLS_ctx.t('common.createdAt')),
    }));
    const __VLS_84 = __VLS_83({
        label: (__VLS_ctx.t('common.createdAt')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_83));
    __VLS_85.slots.default;
    (new Date(__VLS_ctx.task.createdAt).toLocaleString());
    var __VLS_85;
    const __VLS_86 = {}.NDescriptionsItem;
    /** @type {[typeof __VLS_components.NDescriptionsItem, typeof __VLS_components.NDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_87 = __VLS_asFunctionalComponent(__VLS_86, new __VLS_86({
        label: (__VLS_ctx.t('common.updatedAt')),
    }));
    const __VLS_88 = __VLS_87({
        label: (__VLS_ctx.t('common.updatedAt')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_87));
    __VLS_89.slots.default;
    (new Date(__VLS_ctx.task.updatedAt).toLocaleString());
    var __VLS_89;
    var __VLS_58;
    var __VLS_54;
    const __VLS_90 = {}.NCard;
    /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.NCard, ]} */ ;
    // @ts-ignore
    const __VLS_91 = __VLS_asFunctionalComponent(__VLS_90, new __VLS_90({
        title: "Timeline",
        size: "small",
    }));
    const __VLS_92 = __VLS_91({
        title: "Timeline",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_91));
    __VLS_93.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "h-3 w-3 rounded-full bg-blue-500" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm font-medium text-foreground" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-xs text-muted-foreground" },
    });
    (new Date(__VLS_ctx.task.createdAt).toLocaleString());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "h-3 w-3 rounded-full" },
        ...{ class: (__VLS_ctx.task.status === 'completed' ? 'bg-green-500' : __VLS_ctx.task.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500') },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm font-medium text-foreground" },
    });
    (__VLS_ctx.task.status.charAt(0).toUpperCase() + __VLS_ctx.task.status.slice(1));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-xs text-muted-foreground" },
    });
    (new Date(__VLS_ctx.task.updatedAt).toLocaleString());
    var __VLS_93;
    const __VLS_94 = {}.NCard;
    /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.NCard, ]} */ ;
    // @ts-ignore
    const __VLS_95 = __VLS_asFunctionalComponent(__VLS_94, new __VLS_94({
        title: (__VLS_ctx.t('tasks.input')),
        size: "small",
        ...{ class: "mt-6" },
    }));
    const __VLS_96 = __VLS_95({
        title: (__VLS_ctx.t('tasks.input')),
        size: "small",
        ...{ class: "mt-6" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_95));
    __VLS_97.slots.default;
    if (!__VLS_ctx.task.payload?.input) {
        const __VLS_98 = {}.NEmpty;
        /** @type {[typeof __VLS_components.NEmpty, ]} */ ;
        // @ts-ignore
        const __VLS_99 = __VLS_asFunctionalComponent(__VLS_98, new __VLS_98({
            description: "No input data",
            ...{ class: "py-6" },
        }));
        const __VLS_100 = __VLS_99({
            description: "No input data",
            ...{ class: "py-6" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_99));
    }
    else {
        const __VLS_102 = {}.NCode;
        /** @type {[typeof __VLS_components.NCode, ]} */ ;
        // @ts-ignore
        const __VLS_103 = __VLS_asFunctionalComponent(__VLS_102, new __VLS_102({
            code: (__VLS_ctx.formatJson(__VLS_ctx.task.payload.input)),
            language: "json",
            wordWrap: true,
        }));
        const __VLS_104 = __VLS_103({
            code: (__VLS_ctx.formatJson(__VLS_ctx.task.payload.input)),
            language: "json",
            wordWrap: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_103));
    }
    var __VLS_97;
    const __VLS_106 = {}.NCard;
    /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.NCard, ]} */ ;
    // @ts-ignore
    const __VLS_107 = __VLS_asFunctionalComponent(__VLS_106, new __VLS_106({
        title: (__VLS_ctx.t('tasks.output')),
        size: "small",
        ...{ class: "mt-6" },
    }));
    const __VLS_108 = __VLS_107({
        title: (__VLS_ctx.t('tasks.output')),
        size: "small",
        ...{ class: "mt-6" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_107));
    __VLS_109.slots.default;
    if (!__VLS_ctx.task.payload?.output) {
        const __VLS_110 = {}.NEmpty;
        /** @type {[typeof __VLS_components.NEmpty, ]} */ ;
        // @ts-ignore
        const __VLS_111 = __VLS_asFunctionalComponent(__VLS_110, new __VLS_110({
            description: "No output data",
            ...{ class: "py-6" },
        }));
        const __VLS_112 = __VLS_111({
            description: "No output data",
            ...{ class: "py-6" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_111));
    }
    else {
        const __VLS_114 = {}.NCode;
        /** @type {[typeof __VLS_components.NCode, ]} */ ;
        // @ts-ignore
        const __VLS_115 = __VLS_asFunctionalComponent(__VLS_114, new __VLS_114({
            code: (__VLS_ctx.formatJson(__VLS_ctx.task.payload.output)),
            language: "json",
            wordWrap: true,
        }));
        const __VLS_116 = __VLS_115({
            code: (__VLS_ctx.formatJson(__VLS_ctx.task.payload.output)),
            language: "json",
            wordWrap: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_115));
    }
    var __VLS_109;
}
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-blue-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-6']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-6']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NCard: NCard,
            NDescriptions: NDescriptions,
            NDescriptionsItem: NDescriptionsItem,
            NCode: NCode,
            NSpin: NSpin,
            NEmpty: NEmpty,
            NIcon: NIcon,
            ArrowBackOutline: ArrowBackOutline,
            RefreshOutline: RefreshOutline,
            PageHeader: PageHeader,
            StatusBadge: StatusBadge,
            t: t,
            router: router,
            isLoading: isLoading,
            isError: isError,
            refetch: refetch,
            task: task,
            isFailed: isFailed,
            formatJson: formatJson,
            retryMutation: retryMutation,
            handleRetry: handleRetry,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
