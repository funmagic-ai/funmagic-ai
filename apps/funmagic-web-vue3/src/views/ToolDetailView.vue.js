import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import { api } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout.vue';
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const locale = computed(() => route.params.locale || 'en');
const slug = computed(() => route.params.slug);
const { data, isLoading, isError } = useQuery({
    queryKey: ['tool-detail', slug],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/tools/{slug}', {
            params: {
                path: { slug: slug.value },
                query: { locale: locale.value },
            },
        });
        if (error)
            throw new Error(error.error);
        return data;
    },
    enabled: computed(() => !!slug.value),
});
const tool = computed(() => data.value?.tool ?? null);
const fileInputRef = ref(null);
const selectedFile = ref(null);
const previewUrl = ref(null);
function handleFileSelect(event) {
    const input = event.target;
    if (input.files && input.files[0]) {
        selectedFile.value = input.files[0];
        previewUrl.value = URL.createObjectURL(input.files[0]);
    }
}
function triggerFileInput() {
    fileInputRef.value?.click();
}
function goBack() {
    router.push({ name: 'tools', params: { locale: locale.value } });
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
    ...{ class: "mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" },
});
const __VLS_4 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onClick': {} },
    text: true,
    ...{ class: "mb-6" },
}));
const __VLS_6 = __VLS_5({
    ...{ 'onClick': {} },
    text: true,
    ...{ class: "mb-6" },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onClick: (__VLS_ctx.goBack)
};
__VLS_7.slots.default;
(__VLS_ctx.t('common.back'));
var __VLS_7;
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-6" },
    });
    const __VLS_12 = {}.NSkeleton;
    /** @type {[typeof __VLS_components.NSkeleton, typeof __VLS_components.nSkeleton, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        text: true,
        ...{ style: {} },
    }));
    const __VLS_14 = __VLS_13({
        text: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    const __VLS_16 = {}.NSkeleton;
    /** @type {[typeof __VLS_components.NSkeleton, typeof __VLS_components.nSkeleton, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        text: true,
        repeat: (3),
    }));
    const __VLS_18 = __VLS_17({
        text: true,
        repeat: (3),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    const __VLS_20 = {}.NSkeleton;
    /** @type {[typeof __VLS_components.NSkeleton, typeof __VLS_components.nSkeleton, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        height: "300px",
    }));
    const __VLS_22 = __VLS_21({
        height: "300px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
}
else if (__VLS_ctx.isError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-col items-center justify-center py-20" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-lg text-muted-foreground mb-4" },
    });
    (__VLS_ctx.t('common.error'));
    const __VLS_24 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_26 = __VLS_25({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    let __VLS_28;
    let __VLS_29;
    let __VLS_30;
    const __VLS_31 = {
        onClick: (__VLS_ctx.goBack)
    };
    __VLS_27.slots.default;
    (__VLS_ctx.t('common.back'));
    var __VLS_27;
}
else if (__VLS_ctx.tool) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-8" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-start gap-6" },
    });
    if (__VLS_ctx.tool.thumbnail) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (__VLS_ctx.tool.thumbnail),
            alt: (__VLS_ctx.tool.title),
            ...{ class: "h-full w-full object-cover" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20" },
        });
        const __VLS_32 = {}.NIcon;
        /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
            size: (36),
            ...{ class: "text-primary" },
        }));
        const __VLS_34 = __VLS_33({
            size: (36),
            ...{ class: "text-primary" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
        __VLS_35.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
        });
        var __VLS_35;
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
        ...{ class: "text-3xl font-bold text-foreground" },
    });
    (__VLS_ctx.tool.title);
    if (__VLS_ctx.tool.shortDescription) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "mt-2 text-muted-foreground" },
        });
        (__VLS_ctx.tool.shortDescription);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-3 flex items-center gap-3" },
    });
    if (__VLS_ctx.tool.isFeatured) {
        const __VLS_36 = {}.NTag;
        /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            type: "warning",
            size: "small",
        }));
        const __VLS_38 = __VLS_37({
            type: "warning",
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        __VLS_39.slots.default;
        (__VLS_ctx.t('tools.featured'));
        var __VLS_39;
    }
    const __VLS_40 = {}.NTag;
    /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        type: "info",
        size: "small",
    }));
    const __VLS_42 = __VLS_41({
        type: "info",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_43.slots.default;
    (__VLS_ctx.tool.usageCount);
    (__VLS_ctx.t('tools.uses'));
    var __VLS_43;
    if (__VLS_ctx.tool.description) {
        const __VLS_44 = {}.NCard;
        /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
        // @ts-ignore
        const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
            ...{ class: "mb-8" },
        }));
        const __VLS_46 = __VLS_45({
            ...{ class: "mb-8" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_45));
        __VLS_47.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-foreground whitespace-pre-line" },
        });
        (__VLS_ctx.tool.description);
        var __VLS_47;
    }
    const __VLS_48 = {}.NCard;
    /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        title: (__VLS_ctx.t('tools.tryNow')),
    }));
    const __VLS_50 = __VLS_49({
        title: (__VLS_ctx.t('tools.tryNow')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    __VLS_51.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-6" },
    });
    const __VLS_52 = {}.NAlert;
    /** @type {[typeof __VLS_components.NAlert, typeof __VLS_components.nAlert, typeof __VLS_components.NAlert, typeof __VLS_components.nAlert, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        type: "info",
        bordered: (false),
    }));
    const __VLS_54 = __VLS_53({
        type: "info",
        bordered: (false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    __VLS_55.slots.default;
    (__VLS_ctx.t('tools.workspacePlaceholder'));
    var __VLS_55;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-muted-foreground" },
    });
    (__VLS_ctx.t('tools.uploadImage'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (__VLS_ctx.handleFileSelect) },
        ref: "fileInputRef",
        type: "file",
        accept: "image/*",
        ...{ class: "hidden" },
    });
    /** @type {typeof __VLS_ctx.fileInputRef} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.triggerFileInput) },
        ...{ class: "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-10 transition-colors hover:border-primary/50 hover:bg-primary/5" },
    });
    const __VLS_56 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        size: (48),
        ...{ class: "text-muted-foreground mb-3" },
    }));
    const __VLS_58 = __VLS_57({
        size: (48),
        ...{ class: "text-muted-foreground mb-3" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_59.slots.default;
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
        d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
        points: "17 8 12 3 7 8",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "12",
        y1: "3",
        x2: "12",
        y2: "15",
    });
    var __VLS_59;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm text-muted-foreground" },
    });
    (__VLS_ctx.t('tools.clickToUpload'));
    if (__VLS_ctx.previewUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mt-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm font-medium text-foreground mb-2" },
        });
        (__VLS_ctx.t('tools.preview'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (__VLS_ctx.previewUrl),
            alt: (__VLS_ctx.selectedFile?.name),
            ...{ class: "max-h-64 rounded-lg border border-border" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "mt-2 text-xs text-muted-foreground" },
        });
        (__VLS_ctx.selectedFile?.name);
        (((__VLS_ctx.selectedFile?.size ?? 0) / 1024).toFixed(1));
    }
    const __VLS_60 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        type: "primary",
        size: "large",
        block: true,
        disabled: (!__VLS_ctx.selectedFile),
    }));
    const __VLS_62 = __VLS_61({
        type: "primary",
        size: "large",
        block: true,
        disabled: (!__VLS_ctx.selectedFile),
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    __VLS_63.slots.default;
    (__VLS_ctx.t('tools.processing'));
    var __VLS_63;
    var __VLS_51;
}
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-4xl']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-20']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-24']} */ ;
/** @type {__VLS_StyleScopedClasses['w-24']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-24']} */ ;
/** @type {__VLS_StyleScopedClasses['w-24']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
/** @type {__VLS_StyleScopedClasses['from-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['to-accent/20']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-pre-line']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['p-10']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:border-primary/50']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-primary/5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-64']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            t: t,
            isLoading: isLoading,
            isError: isError,
            tool: tool,
            fileInputRef: fileInputRef,
            selectedFile: selectedFile,
            previewUrl: previewUrl,
            handleFileSelect: handleFileSelect,
            triggerFileInput: triggerFileInput,
            goBack: goBack,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
