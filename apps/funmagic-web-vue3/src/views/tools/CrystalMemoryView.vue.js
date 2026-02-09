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
const PointCloudViewer = defineAsyncComponent(() => import('@/components/tools/PointCloudViewer.vue'));
const { t } = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const locale = computed(() => route.params.locale || 'en');
const upload = useUpload({ module: 'crystal-memory' });
const currentStep = ref(0);
// Background removal task
const bgRemoveTaskId = ref(null);
const bgRemovedAssetId = ref(null);
const bgRemovedImageUrl = ref(null);
// Point cloud generation task
const cloudTaskId = ref(null);
const cloudOutput = ref(null);
const resultTab = ref('model');
// Fetch tool config from API
const { data: toolData } = useQuery({
    queryKey: ['tool', 'crystal-memory', locale],
    queryFn: async () => {
        const { data } = await api.GET('/api/tools/{slug}', {
            params: { path: { slug: 'crystal-memory' }, query: { locale: locale.value } },
        });
        return data;
    },
});
const toolInfo = computed(() => toolData.value?.tool);
const toolTitle = computed(() => toolInfo.value?.title ?? 'Crystal Memory');
const toolDescription = computed(() => toolInfo.value?.description ?? toolInfo.value?.shortDescription ?? '');
const toolConfig = computed(() => (toolInfo.value?.config ?? { steps: [] }));
const step0 = computed(() => toolConfig.value.steps[0]);
const step1 = computed(() => toolConfig.value.steps[1]);
const step0Id = computed(() => step0.value?.id ?? 'background-remove');
const step0Name = computed(() => step0.value?.name ?? t('tools.processing'));
const step1Id = computed(() => step1.value?.id ?? 'vggt');
const step1Name = computed(() => step1.value?.name ?? t('tools.processing'));
const totalCost = computed(() => toolConfig.value.steps.reduce((sum, s) => sum + (s.cost ?? 0), 0));
const steps = computed(() => [
    { id: 'upload', label: t('tools.uploadImage') },
    { id: 'removing-bg', label: step0Name.value },
    { id: 'generating-cloud', label: step1Name.value },
    { id: 'result', label: t('tools.result') },
]);
// Background removal progress
const { progress: bgProgress, isFailed: bgFailed } = useTaskProgress(bgRemoveTaskId, {
    onComplete: (output) => {
        // Null out task ID to prevent reconnect from firing onComplete again
        bgRemoveTaskId.value = null;
        const out = output;
        bgRemovedAssetId.value = out?.assetId ?? null;
        bgRemovedImageUrl.value = out?.bgRemovedImageUrl ?? null;
        // Auto-start point cloud generation
        if (bgRemovedAssetId.value && bgRemovedImageUrl.value) {
            startCloudGeneration();
        }
    },
});
// Point cloud generation progress
const { progress: cloudProgress, isFailed: cloudFailed } = useTaskProgress(cloudTaskId, {
    onComplete: (output) => {
        // Null out task ID to prevent reconnect from firing onComplete again
        cloudTaskId.value = null;
        currentStep.value = 3;
        const out = output;
        if (out?.txt) {
            cloudOutput.value = {
                txt: out.txt,
                conf: out.conf ?? [],
                pointCount: out.pointCount ?? 0,
            };
        }
    },
});
const submitMutation = useMutation({
    mutationFn: async () => {
        const uploadResult = await upload.uploadOnSubmit();
        if (!uploadResult)
            throw new Error(upload.error.value ?? 'Upload failed');
        // Start bg-remove task
        const { data, error } = await api.POST('/api/tasks', {
            body: {
                toolSlug: toolInfo.value?.slug ?? 'crystal-memory',
                stepId: step0Id.value,
                input: { imageStorageKey: uploadResult.storageKey },
            },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to create task');
        return data;
    },
    onSuccess: (data) => {
        bgRemoveTaskId.value = data.task?.id ?? data.id;
        currentStep.value = 1;
    },
});
const cloudMutation = useMutation({
    mutationFn: async () => {
        const { data, error } = await api.POST('/api/tasks', {
            body: {
                toolSlug: toolInfo.value?.slug ?? 'crystal-memory',
                stepId: step1Id.value,
                parentTaskId: bgRemoveTaskId.value ?? undefined,
                input: {
                    sourceAssetId: bgRemovedAssetId.value,
                    bgRemovedImageUrl: bgRemovedImageUrl.value,
                },
            },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to create cloud task');
        return data;
    },
    onSuccess: (data) => {
        cloudTaskId.value = data.task?.id ?? data.id;
    },
});
function startCloudGeneration() {
    currentStep.value = 2;
    cloudMutation.mutate();
}
function handleFileSelect(file) {
    upload.setFile(file);
}
function handleSubmit() {
    submitMutation.mutate();
}
function handleReset() {
    upload.reset();
    currentStep.value = 0;
    bgRemoveTaskId.value = null;
    cloudTaskId.value = null;
    bgRemovedAssetId.value = null;
    bgRemovedImageUrl.value = null;
    cloudOutput.value = null;
    resultTab.value = 'model';
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
            disabled: (__VLS_ctx.submitMutation.isPending.value),
        }));
        const __VLS_19 = __VLS_18({
            ...{ 'onFileSelect': {} },
            preview: (__VLS_ctx.upload.preview.value),
            disabled: (__VLS_ctx.submitMutation.isPending.value),
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
            progress: (__VLS_ctx.bgProgress),
        }));
        const __VLS_34 = __VLS_33({
            progress: (__VLS_ctx.bgProgress),
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        if (__VLS_ctx.bgFailed) {
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
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.authStore.isAuthenticated))
                        return;
                    if (!(__VLS_ctx.currentStep === 1))
                        return;
                    if (!(__VLS_ctx.bgFailed))
                        return;
                    __VLS_ctx.currentStep = 0;
                }
            };
            __VLS_39.slots.default;
            (__VLS_ctx.t('tools.tryAgain'));
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
            (__VLS_ctx.t('tools.startOver'));
            var __VLS_47;
        }
    }
    if (__VLS_ctx.currentStep === 2) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        /** @type {[typeof TaskProgressDisplay, ]} */ ;
        // @ts-ignore
        const __VLS_52 = __VLS_asFunctionalComponent(TaskProgressDisplay, new TaskProgressDisplay({
            progress: (__VLS_ctx.cloudProgress),
        }));
        const __VLS_53 = __VLS_52({
            progress: (__VLS_ctx.cloudProgress),
        }, ...__VLS_functionalComponentArgsRest(__VLS_52));
        if (__VLS_ctx.cloudFailed) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex justify-center mt-4 gap-3" },
            });
            const __VLS_55 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({
                ...{ 'onClick': {} },
            }));
            const __VLS_57 = __VLS_56({
                ...{ 'onClick': {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_56));
            let __VLS_59;
            let __VLS_60;
            let __VLS_61;
            const __VLS_62 = {
                onClick: (__VLS_ctx.handleReset)
            };
            __VLS_58.slots.default;
            (__VLS_ctx.t('tools.startOver'));
            var __VLS_58;
        }
    }
    if (__VLS_ctx.currentStep === 3) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-6" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: "text-lg font-semibold" },
        });
        (__VLS_ctx.t('tools.resultReady'));
        if (__VLS_ctx.cloudOutput) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-sm text-muted-foreground" },
            });
            (__VLS_ctx.t('tools.pointCloud.resultDescription', { count: __VLS_ctx.cloudOutput.pointCount.toLocaleString() }));
        }
        const __VLS_63 = {}.NTabs;
        /** @type {[typeof __VLS_components.NTabs, typeof __VLS_components.nTabs, typeof __VLS_components.NTabs, typeof __VLS_components.nTabs, ]} */ ;
        // @ts-ignore
        const __VLS_64 = __VLS_asFunctionalComponent(__VLS_63, new __VLS_63({
            value: (__VLS_ctx.resultTab),
            type: "segment",
        }));
        const __VLS_65 = __VLS_64({
            value: (__VLS_ctx.resultTab),
            type: "segment",
        }, ...__VLS_functionalComponentArgsRest(__VLS_64));
        __VLS_66.slots.default;
        const __VLS_67 = {}.NTabPane;
        /** @type {[typeof __VLS_components.NTabPane, typeof __VLS_components.nTabPane, typeof __VLS_components.NTabPane, typeof __VLS_components.nTabPane, ]} */ ;
        // @ts-ignore
        const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({
            name: "model",
            tab: (__VLS_ctx.t('tools.pointCloud.tab3D')),
        }));
        const __VLS_69 = __VLS_68({
            name: "model",
            tab: (__VLS_ctx.t('tools.pointCloud.tab3D')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_68));
        __VLS_70.slots.default;
        if (__VLS_ctx.cloudOutput) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "pt-4" },
            });
            const __VLS_71 = {}.Suspense;
            /** @type {[typeof __VLS_components.Suspense, typeof __VLS_components.Suspense, ]} */ ;
            // @ts-ignore
            const __VLS_72 = __VLS_asFunctionalComponent(__VLS_71, new __VLS_71({}));
            const __VLS_73 = __VLS_72({}, ...__VLS_functionalComponentArgsRest(__VLS_72));
            __VLS_74.slots.default;
            const __VLS_75 = {}.PointCloudViewer;
            /** @type {[typeof __VLS_components.PointCloudViewer, ]} */ ;
            // @ts-ignore
            const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
                ...{ 'onReset': {} },
                data: ({ txt: __VLS_ctx.cloudOutput.txt, conf: __VLS_ctx.cloudOutput.conf }),
            }));
            const __VLS_77 = __VLS_76({
                ...{ 'onReset': {} },
                data: ({ txt: __VLS_ctx.cloudOutput.txt, conf: __VLS_ctx.cloudOutput.conf }),
            }, ...__VLS_functionalComponentArgsRest(__VLS_76));
            let __VLS_79;
            let __VLS_80;
            let __VLS_81;
            const __VLS_82 = {
                onReset: (__VLS_ctx.handleReset)
            };
            var __VLS_78;
            {
                const { fallback: __VLS_thisSlot } = __VLS_74.slots;
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "rounded-lg bg-zinc-900 h-[500px] flex items-center justify-center" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "text-center text-muted-foreground" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                    ...{ class: "animate-spin w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-2" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "text-sm" },
                });
                (__VLS_ctx.t('tools.pointCloud.loading'));
            }
            var __VLS_74;
        }
        var __VLS_70;
        const __VLS_83 = {}.NTabPane;
        /** @type {[typeof __VLS_components.NTabPane, typeof __VLS_components.nTabPane, typeof __VLS_components.NTabPane, typeof __VLS_components.nTabPane, ]} */ ;
        // @ts-ignore
        const __VLS_84 = __VLS_asFunctionalComponent(__VLS_83, new __VLS_83({
            name: "original",
            tab: (__VLS_ctx.t('tools.original')),
        }));
        const __VLS_85 = __VLS_84({
            name: "original",
            tab: (__VLS_ctx.t('tools.original')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_84));
        __VLS_86.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "pt-4 space-y-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-lg border overflow-hidden bg-muted max-w-lg mx-auto" },
        });
        if (__VLS_ctx.upload.preview.value) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                src: (__VLS_ctx.upload.preview.value),
                alt: (__VLS_ctx.t('tools.original')),
                ...{ class: "w-full object-contain" },
            });
        }
        const __VLS_87 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_88 = __VLS_asFunctionalComponent(__VLS_87, new __VLS_87({
            ...{ 'onClick': {} },
        }));
        const __VLS_89 = __VLS_88({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_88));
        let __VLS_91;
        let __VLS_92;
        let __VLS_93;
        const __VLS_94 = {
            onClick: (__VLS_ctx.handleReset)
        };
        __VLS_90.slots.default;
        (__VLS_ctx.t('tools.processAnother'));
        var __VLS_90;
        var __VLS_86;
        var __VLS_66;
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
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-900']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[500px]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            ImagePicker: ImagePicker,
            StepIndicator: StepIndicator,
            ToolBreadcrumb: ToolBreadcrumb,
            TaskProgressDisplay: TaskProgressDisplay,
            PointCloudViewer: PointCloudViewer,
            t: t,
            authStore: authStore,
            locale: locale,
            upload: upload,
            currentStep: currentStep,
            cloudOutput: cloudOutput,
            resultTab: resultTab,
            toolTitle: toolTitle,
            toolDescription: toolDescription,
            totalCost: totalCost,
            steps: steps,
            bgProgress: bgProgress,
            bgFailed: bgFailed,
            cloudProgress: cloudProgress,
            cloudFailed: cloudFailed,
            submitMutation: submitMutation,
            handleFileSelect: handleFileSelect,
            handleSubmit: handleSubmit,
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
