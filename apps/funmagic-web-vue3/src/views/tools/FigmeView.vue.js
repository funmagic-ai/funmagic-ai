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
const upload = useUpload({ module: 'figme' });
const currentStep = ref(0);
const taskId = ref(null);
const imageResult = ref(null);
const imageAssetId = ref(null);
const imageResultUrl = ref(null);
const threeDTaskId = ref(null);
const threeDResult = ref(null);
const selectedStyle = ref(null);
// Fetch tool config from API
const { data: toolData } = useQuery({
    queryKey: ['tool', 'figme', locale],
    queryFn: async () => {
        const { data } = await api.GET('/api/tools/{slug}', {
            params: { path: { slug: 'figme' }, query: { locale: locale.value } },
        });
        return data;
    },
});
const toolInfo = computed(() => toolData.value?.tool);
const toolTitle = computed(() => toolInfo.value?.title ?? 'FigMe');
const toolDescription = computed(() => toolInfo.value?.description ?? toolInfo.value?.shortDescription ?? '');
const toolConfig = computed(() => (toolInfo.value?.config ?? { steps: [] }));
const step0 = computed(() => toolConfig.value.steps[0]);
const step1 = computed(() => toolConfig.value.steps[1]);
const totalCost = computed(() => toolConfig.value.steps.reduce((sum, s) => sum + (s.cost ?? 0), 0));
const step0Id = computed(() => step0.value?.id ?? 'image-gen');
const step0Name = computed(() => step0.value?.name ?? t('tools.generateImage'));
const step1Id = computed(() => step1.value?.id ?? '3d-gen');
const step1Name = computed(() => step1.value?.name ?? t('tools.generate3D'));
const steps = computed(() => [
    { id: 'style-upload', label: t('tools.selectStyle') },
    { id: 'generating-image', label: step0Name.value },
    { id: 'image-result', label: t('tools.result') },
    { id: 'generating-3d', label: step1Name.value },
    { id: '3d-result', label: t('tools.result') },
]);
const availableStyles = computed(() => {
    const s0 = toolConfig.value.steps[0];
    const rawStyles = (s0?.styleReferences ?? []);
    return rawStyles.map((s, i) => ({
        id: s.id || `style-${i}`,
        name: s.name || `Style ${i + 1}`,
        imageUrl: s.imageUrl || '',
        prompt: s.prompt,
    }));
});
// Image generation progress
const { progress: imageProgress, isCompleted: imageCompleted, isFailed: imageFailed } = useTaskProgress(taskId, {
    onComplete: (output) => {
        currentStep.value = 2;
        const out = output;
        imageAssetId.value = out?.assetId ?? null;
        imageResultUrl.value = out?.imageUrl ?? out?.url ?? null;
        imageResult.value = imageResultUrl.value ?? out?.storageKey ?? null;
    },
});
// 3D generation progress
const { progress: threeDProgress, isCompleted: threeDCompleted, isFailed: threeDFailed } = useTaskProgress(threeDTaskId, {
    onComplete: (output) => {
        currentStep.value = 4;
        const out = output;
        if (out?.url)
            threeDResult.value = out.url;
        else if (out?.storageKey)
            threeDResult.value = out.storageKey;
    },
});
const submitMutation = useMutation({
    mutationFn: async () => {
        const uploadResult = await upload.uploadOnSubmit();
        if (!uploadResult)
            throw new Error(upload.error.value ?? 'Upload failed');
        const { data, error } = await api.POST('/api/tasks', {
            body: {
                toolSlug: toolInfo.value?.slug ?? 'figme',
                stepId: step0Id.value,
                input: {
                    imageStorageKey: uploadResult.storageKey,
                    styleReferenceId: selectedStyle.value,
                },
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
const generate3DMutation = useMutation({
    mutationFn: async () => {
        const { data, error } = await api.POST('/api/tasks', {
            body: {
                toolSlug: toolInfo.value?.slug ?? 'figme',
                stepId: step1Id.value,
                parentTaskId: taskId.value ?? undefined,
                input: {
                    sourceAssetId: imageAssetId.value,
                    sourceImageUrl: imageResultUrl.value,
                },
            },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to create 3D task');
        return data;
    },
    onSuccess: (data) => {
        threeDTaskId.value = data.task?.id ?? data.id;
        currentStep.value = 3;
    },
});
function handleFileSelect(file) {
    upload.setFile(file);
}
function handleSubmit() {
    submitMutation.mutate();
}
function handleGenerate3D() {
    generate3DMutation.mutate();
}
function handleReset() {
    upload.reset();
    currentStep.value = 0;
    taskId.value = null;
    threeDTaskId.value = null;
    imageResult.value = null;
    imageAssetId.value = null;
    imageResultUrl.value = null;
    threeDResult.value = null;
    selectedStyle.value = null;
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
        if (__VLS_ctx.availableStyles.length > 0) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "rounded-xl border bg-card p-6 space-y-4" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                ...{ class: "font-medium" },
            });
            (__VLS_ctx.t('tools.selectStyle'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "grid grid-cols-2 sm:grid-cols-3 gap-3" },
            });
            for (const [style] of __VLS_getVForSourceType((__VLS_ctx.availableStyles))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(!__VLS_ctx.authStore.isAuthenticated))
                                return;
                            if (!(__VLS_ctx.currentStep === 0))
                                return;
                            if (!(__VLS_ctx.availableStyles.length > 0))
                                return;
                            __VLS_ctx.selectedStyle = style.id;
                        } },
                    key: (style.id),
                    type: "button",
                    ...{ class: "rounded-lg border p-3 text-center text-sm transition-colors" },
                    ...{ class: (__VLS_ctx.selectedStyle === style.id ? 'border-primary bg-primary/10' : 'hover:border-primary/50') },
                });
                if (style.imageUrl) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                        src: (style.imageUrl),
                        alt: (style.name),
                        ...{ class: "w-full aspect-square object-cover rounded mb-2" },
                    });
                }
                (style.name);
            }
        }
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
        (__VLS_ctx.t('tools.generateImage'));
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
            progress: (__VLS_ctx.imageProgress),
        }));
        const __VLS_34 = __VLS_33({
            progress: (__VLS_ctx.imageProgress),
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        if (__VLS_ctx.imageFailed) {
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
                    if (!(__VLS_ctx.imageFailed))
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
        (__VLS_ctx.t('tools.generated'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-lg border overflow-hidden bg-muted" },
        });
        if (__VLS_ctx.imageResult) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                src: (__VLS_ctx.imageResult),
                alt: (__VLS_ctx.t('tools.generated')),
                ...{ class: "w-full object-contain max-h-64" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex justify-center gap-3" },
        });
        if (__VLS_ctx.imageResult) {
            const __VLS_52 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
                tag: "a",
                href: (__VLS_ctx.imageResult),
                download: true,
            }));
            const __VLS_54 = __VLS_53({
                tag: "a",
                href: (__VLS_ctx.imageResult),
                download: true,
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
            type: "primary",
            loading: (__VLS_ctx.generate3DMutation.isPending.value),
        }));
        const __VLS_58 = __VLS_57({
            ...{ 'onClick': {} },
            type: "primary",
            loading: (__VLS_ctx.generate3DMutation.isPending.value),
        }, ...__VLS_functionalComponentArgsRest(__VLS_57));
        let __VLS_60;
        let __VLS_61;
        let __VLS_62;
        const __VLS_63 = {
            onClick: (__VLS_ctx.handleGenerate3D)
        };
        __VLS_59.slots.default;
        (__VLS_ctx.t('tools.generate3D'));
        var __VLS_59;
        const __VLS_64 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
            ...{ 'onClick': {} },
        }));
        const __VLS_66 = __VLS_65({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_65));
        let __VLS_68;
        let __VLS_69;
        let __VLS_70;
        const __VLS_71 = {
            onClick: (__VLS_ctx.handleReset)
        };
        __VLS_67.slots.default;
        (__VLS_ctx.t('tools.startOver'));
        var __VLS_67;
    }
    if (__VLS_ctx.currentStep === 3) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        /** @type {[typeof TaskProgressDisplay, ]} */ ;
        // @ts-ignore
        const __VLS_72 = __VLS_asFunctionalComponent(TaskProgressDisplay, new TaskProgressDisplay({
            progress: (__VLS_ctx.threeDProgress),
        }));
        const __VLS_73 = __VLS_72({
            progress: (__VLS_ctx.threeDProgress),
        }, ...__VLS_functionalComponentArgsRest(__VLS_72));
        if (__VLS_ctx.threeDFailed) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex justify-center mt-4 gap-3" },
            });
            const __VLS_75 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
                ...{ 'onClick': {} },
            }));
            const __VLS_77 = __VLS_76({
                ...{ 'onClick': {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_76));
            let __VLS_79;
            let __VLS_80;
            let __VLS_81;
            const __VLS_82 = {
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.authStore.isAuthenticated))
                        return;
                    if (!(__VLS_ctx.currentStep === 3))
                        return;
                    if (!(__VLS_ctx.threeDFailed))
                        return;
                    __VLS_ctx.currentStep = 2;
                }
            };
            __VLS_78.slots.default;
            (__VLS_ctx.t('tools.backToImage'));
            var __VLS_78;
            const __VLS_83 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_84 = __VLS_asFunctionalComponent(__VLS_83, new __VLS_83({
                ...{ 'onClick': {} },
            }));
            const __VLS_85 = __VLS_84({
                ...{ 'onClick': {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_84));
            let __VLS_87;
            let __VLS_88;
            let __VLS_89;
            const __VLS_90 = {
                onClick: (__VLS_ctx.handleReset)
            };
            __VLS_86.slots.default;
            (__VLS_ctx.t('tools.startOver'));
            var __VLS_86;
        }
    }
    if (__VLS_ctx.currentStep === 4) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-6" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-xl border bg-card p-6 space-y-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-center space-y-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: "text-lg font-semibold" },
        });
        (__VLS_ctx.t('tools.resultReady'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm text-muted-foreground" },
        });
        (__VLS_ctx.t('tools.3dPointCloud'));
        if (__VLS_ctx.threeDResult) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "rounded-lg border overflow-hidden bg-zinc-900 aspect-video flex items-center justify-center" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "text-center space-y-2 p-6" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                xmlns: "http://www.w3.org/2000/svg",
                ...{ class: "mx-auto h-10 w-10 text-zinc-500" },
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                'stroke-width': "1.5",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                d: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-sm text-zinc-400" },
            });
            (__VLS_ctx.t('tools.3dViewerComingSoon'));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex justify-center gap-3" },
        });
        if (__VLS_ctx.threeDResult) {
            const __VLS_91 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_92 = __VLS_asFunctionalComponent(__VLS_91, new __VLS_91({
                tag: "a",
                href: (__VLS_ctx.threeDResult),
                download: true,
                type: "primary",
            }));
            const __VLS_93 = __VLS_92({
                tag: "a",
                href: (__VLS_ctx.threeDResult),
                download: true,
                type: "primary",
            }, ...__VLS_functionalComponentArgsRest(__VLS_92));
            __VLS_94.slots.default;
            (__VLS_ctx.t('tools.download'));
            var __VLS_94;
        }
        const __VLS_95 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_96 = __VLS_asFunctionalComponent(__VLS_95, new __VLS_95({
            ...{ 'onClick': {} },
        }));
        const __VLS_97 = __VLS_96({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_96));
        let __VLS_99;
        let __VLS_100;
        let __VLS_101;
        const __VLS_102 = {
            onClick: (__VLS_ctx.handleReset)
        };
        __VLS_98.slots.default;
        (__VLS_ctx.t('tools.processAnother'));
        var __VLS_98;
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
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-square']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
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
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-64']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-900']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-video']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-400']} */ ;
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
            imageResult: imageResult,
            threeDResult: threeDResult,
            selectedStyle: selectedStyle,
            toolTitle: toolTitle,
            toolDescription: toolDescription,
            totalCost: totalCost,
            steps: steps,
            availableStyles: availableStyles,
            imageProgress: imageProgress,
            imageFailed: imageFailed,
            threeDProgress: threeDProgress,
            threeDFailed: threeDFailed,
            submitMutation: submitMutation,
            generate3DMutation: generate3DMutation,
            handleFileSelect: handleFileSelect,
            handleSubmit: handleSubmit,
            handleGenerate3D: handleGenerate3D,
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
