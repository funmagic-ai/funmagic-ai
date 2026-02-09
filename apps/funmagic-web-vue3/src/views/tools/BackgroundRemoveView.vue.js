import { useI18n } from 'vue-i18n';
import { useMutation, useQuery } from '@tanstack/vue-query';
import { api } from '@/lib/api';
import { useUpload } from '@/composables/useUpload';
import { useTaskProgress } from '@/composables/useTaskProgress';
import { useAuthStore } from '@/stores/auth';
import AppLayout from '@/components/layout/AppLayout.vue';
import ImagePicker from '@/components/upload/ImagePicker.vue';
import StepIndicator from '@/components/tools/StepIndicator.vue';
import ToolBreadcrumb from '@/components/tools/ToolBreadcrumb.vue';
import TaskProgressDisplay from '@/components/tools/TaskProgressDisplay.vue';
const { t } = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const locale = computed(() => route.params.locale || 'en');
const upload = useUpload({ module: 'background-remove' });
const currentStep = ref(0);
const taskId = ref(null);
const resultUrl = ref(null);
// Fetch tool config from API
const { data: toolData } = useQuery({
    queryKey: ['tool', 'background-remove', locale],
    queryFn: async () => {
        const { data } = await api.GET('/api/tools/{slug}', {
            params: { path: { slug: 'background-remove' }, query: { locale: locale.value } },
        });
        return data;
    },
});
const toolInfo = computed(() => toolData.value?.tool);
const toolTitle = computed(() => toolInfo.value?.title ?? 'Background Remover');
const toolDescription = computed(() => toolInfo.value?.description ?? toolInfo.value?.shortDescription ?? '');
const toolConfig = computed(() => (toolInfo.value?.config ?? { steps: [] }));
const firstStep = computed(() => toolConfig.value.steps[0]);
const totalCost = computed(() => toolConfig.value.steps.reduce((sum, s) => sum + (s.cost ?? 0), 0));
const steps = computed(() => [
    { id: 'upload', label: t('tools.uploadImage') },
    { id: 'processing', label: firstStep.value?.name ?? t('tools.processing') },
    { id: 'result', label: t('tools.result') },
]);
const { progress, isProcessing, isCompleted, isFailed } = useTaskProgress(taskId, {
    onComplete: (output) => {
        // Null out task ID to prevent reconnect from firing onComplete again
        taskId.value = null;
        currentStep.value = 2;
        const out = output;
        if (out?.url)
            resultUrl.value = out.url;
        else if (out?.storageKey)
            resultUrl.value = out.storageKey;
    },
    onFailed: () => {
        // Stay on processing step but show error
    },
});
const submitMutation = useMutation({
    mutationFn: async () => {
        // Upload file
        const uploadResult = await upload.uploadOnSubmit();
        if (!uploadResult)
            throw new Error(upload.error.value ?? 'Upload failed');
        // Create task
        const { data, error } = await api.POST('/api/tasks', {
            body: {
                toolSlug: toolInfo.value?.slug ?? 'background-remove',
                stepId: firstStep.value?.id ?? 'remove-bg',
                input: { imageStorageKey: uploadResult.storageKey },
            },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to create task');
        return data;
    },
    onSuccess: (data) => {
        taskId.value = data.task?.id ?? data.id;
        currentStep.value = 1;
    },
});
function handleFileSelect(file) {
    upload.setFile(file);
}
function handleSubmit() {
    submitMutation.mutate();
}
function handleRetry() {
    currentStep.value = 0;
    taskId.value = null;
    resultUrl.value = null;
}
function handleReset() {
    upload.reset();
    currentStep.value = 0;
    taskId.value = null;
    resultUrl.value = null;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {[typeof AppLayout, typeof AppLayout, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppLayout, new AppLayout({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-8" },
});
/** @type {[typeof ToolBreadcrumb, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(ToolBreadcrumb, new ToolBreadcrumb({
    toolName: (__VLS_ctx.toolTitle),
}));
const __VLS_5 = __VLS_4({
    toolName: (__VLS_ctx.toolTitle),
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-3xl sm:text-4xl font-bold" },
});
(__VLS_ctx.toolTitle);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-muted-foreground" },
});
(__VLS_ctx.toolDescription);
if (!__VLS_ctx.authStore.isAuthenticated) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rounded-xl border bg-card p-8 text-center space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-muted-foreground" },
    });
    (__VLS_ctx.t('tools.signInRequired'));
    const __VLS_7 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_11;
    let __VLS_12;
    let __VLS_13;
    const __VLS_14 = {
        onClick: (...[$event]) => {
            if (!(!__VLS_ctx.authStore.isAuthenticated))
                return;
            __VLS_ctx.$router.push({ name: 'login', params: { locale: __VLS_ctx.locale } });
        }
    };
    __VLS_10.slots.default;
    (__VLS_ctx.t('auth.signIn'));
    var __VLS_10;
}
else {
    /** @type {[typeof StepIndicator, ]} */ ;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent(StepIndicator, new StepIndicator({
        steps: (__VLS_ctx.steps),
        currentStep: (__VLS_ctx.currentStep),
    }));
    const __VLS_16 = __VLS_15({
        steps: (__VLS_ctx.steps),
        currentStep: (__VLS_ctx.currentStep),
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    if (__VLS_ctx.currentStep === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-6" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-xl border bg-card p-6" },
        });
        /** @type {[typeof ImagePicker, ]} */ ;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent(ImagePicker, new ImagePicker({
            ...{ 'onFileSelect': {} },
            preview: (__VLS_ctx.upload.preview.value),
            disabled: (__VLS_ctx.submitMutation.isPending.value || __VLS_ctx.upload.isUploading.value),
        }));
        const __VLS_19 = __VLS_18({
            ...{ 'onFileSelect': {} },
            preview: (__VLS_ctx.upload.preview.value),
            disabled: (__VLS_ctx.submitMutation.isPending.value || __VLS_ctx.upload.isUploading.value),
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        let __VLS_21;
        let __VLS_22;
        let __VLS_23;
        const __VLS_24 = {
            onFileSelect: (__VLS_ctx.handleFileSelect)
        };
        var __VLS_20;
        const __VLS_25 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
            ...{ 'onClick': {} },
            type: "primary",
            size: "large",
            block: true,
            disabled: (!__VLS_ctx.upload.pendingFile.value),
            loading: (__VLS_ctx.submitMutation.isPending.value || __VLS_ctx.upload.isUploading.value),
        }));
        const __VLS_27 = __VLS_26({
            ...{ 'onClick': {} },
            type: "primary",
            size: "large",
            block: true,
            disabled: (!__VLS_ctx.upload.pendingFile.value),
            loading: (__VLS_ctx.submitMutation.isPending.value || __VLS_ctx.upload.isUploading.value),
        }, ...__VLS_functionalComponentArgsRest(__VLS_26));
        let __VLS_29;
        let __VLS_30;
        let __VLS_31;
        const __VLS_32 = {
            onClick: (__VLS_ctx.handleSubmit)
        };
        __VLS_28.slots.default;
        (__VLS_ctx.t('tools.startProcessing'));
        if (__VLS_ctx.totalCost > 0) {
            (__VLS_ctx.totalCost);
            (__VLS_ctx.t('tools.credits'));
        }
        var __VLS_28;
    }
    if (__VLS_ctx.currentStep === 1) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        /** @type {[typeof TaskProgressDisplay, ]} */ ;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent(TaskProgressDisplay, new TaskProgressDisplay({
            progress: (__VLS_ctx.progress),
        }));
        const __VLS_34 = __VLS_33({
            progress: (__VLS_ctx.progress),
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        if (__VLS_ctx.isFailed) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex justify-center mt-4 gap-3" },
            });
            const __VLS_36 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
                ...{ 'onClick': {} },
            }));
            const __VLS_38 = __VLS_37({
                ...{ 'onClick': {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_37));
            let __VLS_40;
            let __VLS_41;
            let __VLS_42;
            const __VLS_43 = {
                onClick: (__VLS_ctx.handleRetry)
            };
            __VLS_39.slots.default;
            (__VLS_ctx.t('common.retry'));
            var __VLS_39;
            const __VLS_44 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
                ...{ 'onClick': {} },
            }));
            const __VLS_46 = __VLS_45({
                ...{ 'onClick': {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_45));
            let __VLS_48;
            let __VLS_49;
            let __VLS_50;
            const __VLS_51 = {
                onClick: (__VLS_ctx.handleReset)
            };
            __VLS_47.slots.default;
            (__VLS_ctx.t('tools.processAnother'));
            var __VLS_47;
        }
    }
    if (__VLS_ctx.currentStep === 2) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-6" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-xl border bg-card p-6" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "grid grid-cols-1 sm:grid-cols-2 gap-6" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm font-medium text-muted-foreground" },
        });
        (__VLS_ctx.t('tools.original'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-lg border overflow-hidden bg-muted" },
        });
        if (__VLS_ctx.upload.preview.value) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                src: (__VLS_ctx.upload.preview.value),
                alt: (__VLS_ctx.t('tools.original')),
                ...{ class: "w-full object-contain max-h-64" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm font-medium text-muted-foreground" },
        });
        (__VLS_ctx.t('tools.result'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-lg border overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZGRkIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNkZGQiLz48L3N2Zz4=')]" },
        });
        if (__VLS_ctx.resultUrl) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                src: (__VLS_ctx.resultUrl),
                alt: (__VLS_ctx.t('tools.result')),
                ...{ class: "w-full object-contain max-h-64" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex justify-center gap-3" },
        });
        if (__VLS_ctx.resultUrl) {
            const __VLS_52 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
                tag: "a",
                href: (__VLS_ctx.resultUrl),
                download: true,
                type: "primary",
            }));
            const __VLS_54 = __VLS_53({
                tag: "a",
                href: (__VLS_ctx.resultUrl),
                download: true,
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_53));
            __VLS_55.slots.default;
            (__VLS_ctx.t('tools.download'));
            var __VLS_55;
        }
        const __VLS_56 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
            ...{ 'onClick': {} },
        }));
        const __VLS_58 = __VLS_57({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_57));
        let __VLS_60;
        let __VLS_61;
        let __VLS_62;
        const __VLS_63 = {
            onClick: (__VLS_ctx.handleReset)
        };
        __VLS_59.slots.default;
        (__VLS_ctx.t('tools.processAnother'));
        var __VLS_59;
    }
}
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-[1200px]']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-8']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:text-4xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['p-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-64']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[url(\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZGRkIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNkZGQiLz48L3N2Zz4=\')]']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-64']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            ImagePicker: ImagePicker,
            StepIndicator: StepIndicator,
            ToolBreadcrumb: ToolBreadcrumb,
            TaskProgressDisplay: TaskProgressDisplay,
            t: t,
            authStore: authStore,
            locale: locale,
            upload: upload,
            currentStep: currentStep,
            resultUrl: resultUrl,
            toolTitle: toolTitle,
            toolDescription: toolDescription,
            totalCost: totalCost,
            steps: steps,
            progress: progress,
            isFailed: isFailed,
            submitMutation: submitMutation,
            handleFileSelect: handleFileSelect,
            handleSubmit: handleSubmit,
            handleRetry: handleRetry,
            handleReset: handleReset,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
