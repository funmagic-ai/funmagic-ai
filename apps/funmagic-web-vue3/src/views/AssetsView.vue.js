import { useI18n } from 'vue-i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { api } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout.vue';
const { t } = useI18n();
const route = useRoute();
const dialog = useDialog();
const message = useMessage();
const queryClient = useQueryClient();
const locale = computed(() => route.params.locale || 'en');
const currentPage = ref(1);
const pageSize = 12;
const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['user-assets', currentPage],
    queryFn: async () => {
        const { data } = await api.GET('/api/assets', {
            params: {
                query: {
                    limit: pageSize,
                    offset: (currentPage.value - 1) * pageSize,
                },
            },
        });
        return data;
    },
});
const assets = computed(() => data.value?.assets ?? []);
const pagination = computed(() => data.value?.pagination);
const totalPages = computed(() => {
    if (!pagination.value)
        return 1;
    return Math.ceil(pagination.value.total / pageSize);
});
// Delete mutation
const deleteMutation = useMutation({
    mutationFn: async (id) => {
        const { error } = await api.DELETE('/api/assets/{id}', {
            params: { path: { id } },
        });
        if (error)
            throw new Error(error.error);
    },
    onSuccess: () => {
        message.success(t('assets.deleted'));
        queryClient.invalidateQueries({ queryKey: ['user-assets'] });
    },
    onError: (err) => {
        message.error(err.message || t('assets.deleteFailed'));
    },
});
function handleDelete(id) {
    dialog.warning({
        title: t('common.confirm'),
        content: t('assets.deleteConfirm'),
        positiveText: t('common.delete'),
        negativeText: t('common.cancel'),
        onPositiveClick: () => {
            deleteMutation.mutate(id);
        },
    });
}
async function handleDownload(id, filename) {
    try {
        const { data, error } = await api.GET('/api/assets/{id}/url', {
            params: { path: { id } },
        });
        if (error) {
            message.error(t('assets.downloadUrlFailed'));
            return;
        }
        if (data?.url) {
            const link = document.createElement('a');
            link.href = data.url;
            link.download = filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    catch {
        message.error(t('assets.downloadFailed'));
    }
}
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString(locale.value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
function formatFileSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function isImage(mimeType) {
    return mimeType.startsWith('image/');
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-3xl font-bold text-foreground mb-8" },
});
(__VLS_ctx.t('assets.title'));
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" },
    });
    for (const [i] of __VLS_getVForSourceType((8))) {
        const __VLS_4 = {}.NCard;
        /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
        // @ts-ignore
        const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
            key: (i),
        }));
        const __VLS_6 = __VLS_5({
            key: (i),
        }, ...__VLS_functionalComponentArgsRest(__VLS_5));
        __VLS_7.slots.default;
        const __VLS_8 = {}.NSkeleton;
        /** @type {[typeof __VLS_components.NSkeleton, typeof __VLS_components.nSkeleton, ]} */ ;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
            height: "160px",
        }));
        const __VLS_10 = __VLS_9({
            height: "160px",
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        {
            const { footer: __VLS_thisSlot } = __VLS_7.slots;
            const __VLS_12 = {}.NSkeleton;
            /** @type {[typeof __VLS_components.NSkeleton, typeof __VLS_components.nSkeleton, ]} */ ;
            // @ts-ignore
            const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
                text: true,
            }));
            const __VLS_14 = __VLS_13({
                text: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        }
        var __VLS_7;
    }
}
else if (__VLS_ctx.isError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-col items-center justify-center py-20" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-muted-foreground mb-4" },
    });
    (__VLS_ctx.t('common.error'));
    const __VLS_16 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_20;
    let __VLS_21;
    let __VLS_22;
    const __VLS_23 = {
        onClick: (() => __VLS_ctx.refetch())
    };
    __VLS_19.slots.default;
    (__VLS_ctx.t('common.retry'));
    var __VLS_19;
}
else if (__VLS_ctx.assets.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-col items-center justify-center py-20" },
    });
    const __VLS_24 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        size: (64),
        ...{ class: "text-muted-foreground/30 mb-4" },
    }));
    const __VLS_26 = __VLS_25({
        size: (64),
        ...{ class: "text-muted-foreground/30 mb-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_27.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "1.5",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
        points: "13 2 13 9 20 9",
    });
    var __VLS_27;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-lg text-muted-foreground" },
    });
    (__VLS_ctx.t('assets.noAssets'));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" },
    });
    for (const [asset] of __VLS_getVForSourceType((__VLS_ctx.assets))) {
        const __VLS_28 = {}.NCard;
        /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            key: (asset.id),
            ...{ class: "overflow-hidden" },
        }));
        const __VLS_30 = __VLS_29({
            key: (asset.id),
            ...{ class: "overflow-hidden" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        __VLS_31.slots.default;
        {
            const { cover: __VLS_thisSlot } = __VLS_31.slots;
            if (__VLS_ctx.isImage(asset.mimeType)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "flex h-40 items-center justify-center bg-muted/50 overflow-hidden" },
                });
                const __VLS_32 = {}.NIcon;
                /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
                // @ts-ignore
                const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
                    size: (48),
                    ...{ class: "text-muted-foreground/30" },
                }));
                const __VLS_34 = __VLS_33({
                    size: (48),
                    ...{ class: "text-muted-foreground/30" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_33));
                __VLS_35.slots.default;
                __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                    xmlns: "http://www.w3.org/2000/svg",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    'stroke-width': "1.5",
                    'stroke-linecap': "round",
                    'stroke-linejoin': "round",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
                    x: "3",
                    y: "3",
                    width: "18",
                    height: "18",
                    rx: "2",
                    ry: "2",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
                    cx: "8.5",
                    cy: "8.5",
                    r: "1.5",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
                    points: "21 15 16 10 5 21",
                });
                var __VLS_35;
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "flex h-40 items-center justify-center bg-muted/50" },
                });
                const __VLS_36 = {}.NIcon;
                /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
                // @ts-ignore
                const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
                    size: (48),
                    ...{ class: "text-muted-foreground/30" },
                }));
                const __VLS_38 = __VLS_37({
                    size: (48),
                    ...{ class: "text-muted-foreground/30" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_37));
                __VLS_39.slots.default;
                __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                    xmlns: "http://www.w3.org/2000/svg",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    'stroke-width': "1.5",
                    'stroke-linecap': "round",
                    'stroke-linejoin': "round",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                    d: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
                    points: "13 2 13 9 20 9",
                });
                var __VLS_39;
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm font-medium text-foreground truncate" },
            title: (asset.filename),
        });
        (asset.filename);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-between text-xs text-muted-foreground" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.formatFileSize(asset.size));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.formatDate(asset.createdAt));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-2 pt-2" },
        });
        const __VLS_40 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
            ...{ 'onClick': {} },
            size: "small",
            type: "primary",
            secondary: true,
        }));
        const __VLS_42 = __VLS_41({
            ...{ 'onClick': {} },
            size: "small",
            type: "primary",
            secondary: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_41));
        let __VLS_44;
        let __VLS_45;
        let __VLS_46;
        const __VLS_47 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.isLoading))
                    return;
                if (!!(__VLS_ctx.isError))
                    return;
                if (!!(__VLS_ctx.assets.length === 0))
                    return;
                __VLS_ctx.handleDownload(asset.id, asset.filename);
            }
        };
        __VLS_43.slots.default;
        (__VLS_ctx.t('tools.download'));
        var __VLS_43;
        const __VLS_48 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
            ...{ 'onClick': {} },
            size: "small",
            type: "error",
            quaternary: true,
        }));
        const __VLS_50 = __VLS_49({
            ...{ 'onClick': {} },
            size: "small",
            type: "error",
            quaternary: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        let __VLS_52;
        let __VLS_53;
        let __VLS_54;
        const __VLS_55 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.isLoading))
                    return;
                if (!!(__VLS_ctx.isError))
                    return;
                if (!!(__VLS_ctx.assets.length === 0))
                    return;
                __VLS_ctx.handleDelete(asset.id);
            }
        };
        __VLS_51.slots.default;
        (__VLS_ctx.t('common.delete'));
        var __VLS_51;
        var __VLS_31;
    }
}
if (__VLS_ctx.totalPages > 1) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-10 flex justify-center" },
    });
    const __VLS_56 = {}.NPagination;
    /** @type {[typeof __VLS_components.NPagination, typeof __VLS_components.nPagination, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        page: (__VLS_ctx.currentPage),
        pageCount: (__VLS_ctx.totalPages),
    }));
    const __VLS_58 = __VLS_57({
        page: (__VLS_ctx.currentPage),
        pageCount: (__VLS_ctx.totalPages),
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
}
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-7xl']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-20']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-20']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground/30']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-40']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted/50']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground/30']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-40']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted/50']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground/30']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-10']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            t: t,
            currentPage: currentPage,
            isLoading: isLoading,
            isError: isError,
            refetch: refetch,
            assets: assets,
            totalPages: totalPages,
            handleDelete: handleDelete,
            handleDownload: handleDownload,
            formatDate: formatDate,
            formatFileSize: formatFileSize,
            isImage: isImage,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
