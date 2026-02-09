import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import { api } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout.vue';
const { t } = useI18n();
const route = useRoute();
const message = useMessage();
const locale = computed(() => route.params.locale || 'en');
const { data, isLoading, isError } = useQuery({
    queryKey: ['packages', locale],
    queryFn: async () => {
        const { data } = await api.GET('/api/credits/packages', {
            params: { query: { locale: locale.value } },
        });
        return data;
    },
});
const packages = computed(() => {
    const pkgs = data.value?.packages ?? [];
    return [...pkgs].sort((a, b) => a.sortOrder - b.sortOrder);
});
function handleBuy(packageId) {
    message.info(t('pricing.comingSoon'));
}
function formatPrice(price, currency) {
    const num = parseFloat(price);
    return new Intl.NumberFormat(locale.value, {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(num);
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
    ...{ class: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-center mb-12" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-3xl font-bold text-foreground sm:text-4xl" },
});
(__VLS_ctx.t('pricing.title'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "mt-4 text-lg text-muted-foreground" },
});
(__VLS_ctx.t('pricing.subtitle'));
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" },
    });
    for (const [i] of __VLS_getVForSourceType((3))) {
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
            text: true,
            repeat: (5),
        }));
        const __VLS_10 = __VLS_9({
            text: true,
            repeat: (5),
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        var __VLS_7;
    }
}
else if (__VLS_ctx.isError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-12" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-muted-foreground" },
    });
    (__VLS_ctx.t('common.error'));
}
else if (__VLS_ctx.packages.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-12" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-muted-foreground" },
    });
    (__VLS_ctx.t('pricing.noPackages'));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 items-start" },
    });
    for (const [pkg] of __VLS_getVForSourceType((__VLS_ctx.packages))) {
        const __VLS_12 = {}.NCard;
        /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            key: (pkg.id),
            ...{ class: ([
                    'relative transition-all',
                    pkg.isPopular
                        ? 'ring-2 ring-primary shadow-xl scale-105'
                        : 'hover:shadow-lg',
                ]) },
        }));
        const __VLS_14 = __VLS_13({
            key: (pkg.id),
            ...{ class: ([
                    'relative transition-all',
                    pkg.isPopular
                        ? 'ring-2 ring-primary shadow-xl scale-105'
                        : 'hover:shadow-lg',
                ]) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        __VLS_15.slots.default;
        if (pkg.isPopular) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "absolute -top-3 left-1/2 -translate-x-1/2" },
            });
            const __VLS_16 = {}.NTag;
            /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
            // @ts-ignore
            const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
                type: "primary",
                size: "small",
                round: true,
            }));
            const __VLS_18 = __VLS_17({
                type: "primary",
                size: "small",
                round: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_17));
            __VLS_19.slots.default;
            (__VLS_ctx.t('pricing.popular'));
            var __VLS_19;
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-center space-y-6 py-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: "text-xl font-bold text-foreground" },
        });
        (pkg.name);
        if (pkg.description) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "mt-2 text-sm text-muted-foreground" },
            });
            (pkg.description);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text-4xl font-extrabold text-foreground" },
        });
        (__VLS_ctx.formatPrice(pkg.price, pkg.currency));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "space-y-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-center gap-2" },
        });
        const __VLS_20 = {}.NIcon;
        /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
            size: (20),
            ...{ class: "text-primary" },
        }));
        const __VLS_22 = __VLS_21({
            size: (20),
            ...{ class: "text-primary" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        __VLS_23.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
        });
        var __VLS_23;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text-lg font-semibold text-foreground" },
        });
        (pkg.credits);
        (__VLS_ctx.t('tools.credits'));
        if (pkg.bonusCredits > 0) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-sm text-green-600 font-medium" },
            });
            (pkg.bonusCredits);
            (__VLS_ctx.t('pricing.bonusCredits'));
            (__VLS_ctx.t('tools.credits'));
        }
        const __VLS_24 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
            ...{ 'onClick': {} },
            type: (pkg.isPopular ? 'primary' : 'default'),
            size: "large",
            block: true,
        }));
        const __VLS_26 = __VLS_25({
            ...{ 'onClick': {} },
            type: (pkg.isPopular ? 'primary' : 'default'),
            size: "large",
            block: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        let __VLS_28;
        let __VLS_29;
        let __VLS_30;
        const __VLS_31 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.isLoading))
                    return;
                if (!!(__VLS_ctx.isError))
                    return;
                if (!!(__VLS_ctx.packages.length === 0))
                    return;
                __VLS_ctx.handleBuy(pkg.id);
            }
        };
        __VLS_27.slots.default;
        (__VLS_ctx.t('pricing.buy'));
        var __VLS_27;
        var __VLS_15;
    }
}
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-7xl']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-16']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:text-4xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-8']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-8']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['-top-3']} */ ;
/** @type {__VLS_StyleScopedClasses['left-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-x-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-4xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            t: t,
            isLoading: isLoading,
            isError: isError,
            packages: packages,
            handleBuy: handleBuy,
            formatPrice: formatPrice,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
