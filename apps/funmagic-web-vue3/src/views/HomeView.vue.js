import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import { api } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout.vue';
import HeroCarousel from '@/components/home/HeroCarousel.vue';
import SideBanner from '@/components/home/SideBanner.vue';
import ToolCard from '@/components/tools/ToolCard.vue';
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const locale = computed(() => route.params.locale || 'en');
// Fetch main banners
const { data: mainBannersData, isLoading: loadingMainBanners } = useQuery({
    queryKey: ['banners', 'main', locale],
    queryFn: async () => {
        const { data } = await api.GET('/api/banners', {
            params: { query: { type: 'main', locale: locale.value } },
        });
        return data;
    },
});
// Fetch side banners
const { data: sideBannersData, isLoading: loadingSideBanners } = useQuery({
    queryKey: ['banners', 'side', locale],
    queryFn: async () => {
        const { data } = await api.GET('/api/banners', {
            params: { query: { type: 'side', locale: locale.value } },
        });
        return data;
    },
});
// Fetch tools
const { data: toolsData, isLoading: loadingTools } = useQuery({
    queryKey: ['featured-tools', locale],
    queryFn: async () => {
        const { data } = await api.GET('/api/tools', {
            params: { query: { limit: 8, locale: locale.value } },
        });
        return data;
    },
});
const mainBanners = computed(() => {
    const banners = mainBannersData.value?.banners ?? [];
    return banners.map((b) => ({
        id: b.id,
        title: b.title,
        description: b.description ?? '',
        image: b.thumbnail,
        badge: b.badge ?? '',
    }));
});
const sideBanners = computed(() => sideBannersData.value?.banners ?? []);
const tools = computed(() => toolsData.value?.tools ?? []);
function getToolPricing(tool) {
    const config = tool.config;
    if (!config?.steps || config.steps.length === 0)
        return 'free';
    const hasPaidStep = config.steps.some((step) => (step.cost ?? 0) > 0);
    return hasPaidStep ? 'paid' : 'free';
}
function getToolPricingLabel(tool) {
    if (tool.pricingLabel)
        return tool.pricingLabel;
    const pricing = getToolPricing(tool);
    return pricing === 'free' ? t('pricing.free') : t('pricing.paid');
}
function navigateToTools() {
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 pt-6 pb-12 md:pt-8 md:pb-16" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "w-full max-w-7xl flex flex-col gap-16" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 lg:grid-cols-12 gap-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "lg:col-span-8" },
});
if (__VLS_ctx.loadingMainBanners) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "aspect-[21/9] rounded-2xl bg-muted animate-pulse" },
    });
}
else {
    /** @type {[typeof HeroCarousel, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(HeroCarousel, new HeroCarousel({
        slides: (__VLS_ctx.mainBanners),
        featuredLabel: (__VLS_ctx.t('home.featuredTools')),
    }));
    const __VLS_5 = __VLS_4({
        slides: (__VLS_ctx.mainBanners),
        featuredLabel: (__VLS_ctx.t('home.featuredTools')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "lg:col-span-4 flex flex-col gap-6" },
});
if (__VLS_ctx.loadingSideBanners) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "aspect-[21/9] lg:flex-1 rounded-2xl bg-muted animate-pulse" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "aspect-[21/9] lg:flex-1 rounded-2xl bg-muted animate-pulse" },
    });
}
else if (__VLS_ctx.sideBanners.length > 0) {
    for (const [banner, idx] of __VLS_getVForSourceType((__VLS_ctx.sideBanners.slice(0, 2)))) {
        /** @type {[typeof SideBanner, ]} */ ;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent(SideBanner, new SideBanner({
            key: (banner.id),
            title: (banner.title),
            description: (banner.description ?? ''),
            label: (banner.badge ?? banner.linkText ?? 'Explore'),
            labelColor: (idx === 0 ? 'primary' : 'teal'),
            image: (banner.thumbnail),
            href: (banner.link || `/${__VLS_ctx.locale}/tools`),
        }));
        const __VLS_8 = __VLS_7({
            key: (banner.id),
            title: (banner.title),
            description: (banner.description ?? ''),
            label: (banner.badge ?? banner.linkText ?? 'Explore'),
            labelColor: (idx === 0 ? 'primary' : 'teal'),
            image: (banner.thumbnail),
            href: (banner.link || `/${__VLS_ctx.locale}/tools`),
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "aspect-[21/9] lg:flex-1 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-end p-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm font-semibold text-primary uppercase tracking-wider" },
    });
    (__VLS_ctx.t('home.getStarted'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-xl font-bold leading-tight mt-1" },
    });
    (__VLS_ctx.t('home.heroTitle'));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between mb-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-2xl font-bold text-foreground sm:text-3xl" },
});
(__VLS_ctx.t('home.featuredTools'));
const __VLS_10 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
    ...{ 'onClick': {} },
    text: true,
    type: "primary",
}));
const __VLS_12 = __VLS_11({
    ...{ 'onClick': {} },
    text: true,
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
let __VLS_14;
let __VLS_15;
let __VLS_16;
const __VLS_17 = {
    onClick: (__VLS_ctx.navigateToTools)
};
__VLS_13.slots.default;
(__VLS_ctx.t('common.viewAll'));
var __VLS_13;
if (__VLS_ctx.loadingTools) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" },
    });
    for (const [i] of __VLS_getVForSourceType((8))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: "rounded-xl border bg-card/50 overflow-hidden" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "aspect-video bg-muted animate-pulse" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "p-5 space-y-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "h-5 bg-muted animate-pulse rounded w-3/4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "h-4 bg-muted animate-pulse rounded w-1/3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "h-4 bg-muted animate-pulse rounded w-full" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "h-4 bg-muted animate-pulse rounded w-2/3" },
        });
    }
}
else if (__VLS_ctx.tools.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-12" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-muted-foreground" },
    });
    (__VLS_ctx.t('tools.noTools'));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" },
    });
    for (const [tool] of __VLS_getVForSourceType((__VLS_ctx.tools))) {
        /** @type {[typeof ToolCard, ]} */ ;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent(ToolCard, new ToolCard({
            key: (tool.id),
            slug: (tool.slug),
            name: (tool.title),
            description: (tool.description ?? ''),
            category: (tool.category ?? ''),
            categoryLabel: (tool.categoryLabel ?? tool.category ?? ''),
            image: (tool.thumbnail ?? ''),
            rating: (tool.rating ?? 0),
            pricing: (__VLS_ctx.getToolPricing(tool)),
            pricingLabel: (__VLS_ctx.getToolPricingLabel(tool)),
            visitLabel: (__VLS_ctx.t('tools.tryNow')),
            locale: (__VLS_ctx.locale),
        }));
        const __VLS_19 = __VLS_18({
            key: (tool.id),
            slug: (tool.slug),
            name: (tool.title),
            description: (tool.description ?? ''),
            category: (tool.category ?? ''),
            categoryLabel: (tool.categoryLabel ?? tool.category ?? ''),
            image: (tool.thumbnail ?? ''),
            rating: (tool.rating ?? 0),
            pricing: (__VLS_ctx.getToolPricing(tool)),
            pricingLabel: (__VLS_ctx.getToolPricingLabel(tool)),
            visitLabel: (__VLS_ctx.t('tools.tryNow')),
            locale: (__VLS_ctx.locale),
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    }
}
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-12']} */ ;
/** @type {__VLS_StyleScopedClasses['md:pt-8']} */ ;
/** @type {__VLS_StyleScopedClasses['md:pb-16']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-7xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-16']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-12']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:col-span-8']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-[21/9]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:col-span-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-[21/9]']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-[21/9]']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-[21/9]']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
/** @type {__VLS_StyleScopedClasses['from-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['to-primary/5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-card/50']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-video']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['p-5']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3/4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['w-2/3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:grid-cols-4']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            HeroCarousel: HeroCarousel,
            SideBanner: SideBanner,
            ToolCard: ToolCard,
            t: t,
            locale: locale,
            loadingMainBanners: loadingMainBanners,
            loadingSideBanners: loadingSideBanners,
            loadingTools: loadingTools,
            mainBanners: mainBanners,
            sideBanners: sideBanners,
            tools: tools,
            getToolPricing: getToolPricing,
            getToolPricingLabel: getToolPricingLabel,
            navigateToTools: navigateToTools,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
