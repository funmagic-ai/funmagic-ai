import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import { api } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout.vue';
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const locale = computed(() => route.params.locale || 'en');
// URL-driven state
const search = computed({
    get: () => route.query.q || '',
    set: (val) => {
        router.replace({
            query: { ...route.query, q: val || undefined, page: undefined },
        });
    },
});
const selectedCategory = computed({
    get: () => route.query.category || '',
    set: (val) => {
        router.replace({
            query: { ...route.query, category: val || undefined, page: undefined },
        });
    },
});
const currentPage = computed({
    get: () => Number(route.query.page) || 1,
    set: (val) => {
        router.replace({
            query: { ...route.query, page: val > 1 ? String(val) : undefined },
        });
    },
});
const pageSize = 12;
// Debounced search value
const debouncedSearch = ref(search.value);
let searchTimer = null;
watch(search, (val) => {
    if (searchTimer)
        clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        debouncedSearch.value = val;
    }, 300);
});
// Fetch tools
const { data: toolsData, isLoading: toolsLoading, isError: toolsError, } = useQuery({
    queryKey: ['tools', locale, debouncedSearch, selectedCategory, currentPage],
    queryFn: async () => {
        const { data } = await api.GET('/api/tools', {
            params: {
                query: {
                    q: debouncedSearch.value || undefined,
                    category: selectedCategory.value || undefined,
                    page: currentPage.value,
                    limit: pageSize,
                    locale: locale.value,
                },
            },
        });
        return data;
    },
});
const tools = computed(() => toolsData.value?.tools ?? []);
const pagination = computed(() => toolsData.value?.pagination);
const categories = computed(() => toolsData.value?.categories ?? []);
function handleSearch(val) {
    search.value = val;
}
function handleCategoryChange(category) {
    selectedCategory.value = category;
}
function handlePageChange(page) {
    currentPage.value = page;
}
function navigateToTool(slug) {
    router.push({ name: 'tool-detail', params: { locale: locale.value, slug } });
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mb-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-3xl font-bold text-foreground" },
});
(__VLS_ctx.t('tools.allTools'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mb-6" },
});
const __VLS_4 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onUpdate:value': {} },
    value: (__VLS_ctx.search),
    placeholder: (__VLS_ctx.t('tools.searchPlaceholder')),
    size: "large",
    clearable: true,
}));
const __VLS_6 = __VLS_5({
    ...{ 'onUpdate:value': {} },
    value: (__VLS_ctx.search),
    placeholder: (__VLS_ctx.t('tools.searchPlaceholder')),
    size: "large",
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    'onUpdate:value': (__VLS_ctx.handleSearch)
};
__VLS_7.slots.default;
{
    const { prefix: __VLS_thisSlot } = __VLS_7.slots;
    const __VLS_12 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        size: (20),
    }));
    const __VLS_14 = __VLS_13({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    __VLS_15.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
        cx: "11",
        cy: "11",
        r: "8",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "m21 21-4.3-4.3",
    });
    var __VLS_15;
}
var __VLS_7;
if (__VLS_ctx.categories.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-8" },
    });
    const __VLS_16 = {}.NSpace;
    /** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({}));
    const __VLS_18 = __VLS_17({}, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_19.slots.default;
    const __VLS_20 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        ...{ 'onClick': {} },
        type: (!__VLS_ctx.selectedCategory ? 'primary' : 'default'),
        secondary: (!!__VLS_ctx.selectedCategory),
        size: "small",
    }));
    const __VLS_22 = __VLS_21({
        ...{ 'onClick': {} },
        type: (!__VLS_ctx.selectedCategory ? 'primary' : 'default'),
        secondary: (!!__VLS_ctx.selectedCategory),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    let __VLS_24;
    let __VLS_25;
    let __VLS_26;
    const __VLS_27 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.categories.length > 0))
                return;
            __VLS_ctx.handleCategoryChange('');
        }
    };
    __VLS_23.slots.default;
    (__VLS_ctx.t('tools.allTools'));
    var __VLS_23;
    for (const [cat] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
        const __VLS_28 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            ...{ 'onClick': {} },
            key: (cat.id),
            type: (__VLS_ctx.selectedCategory === cat.name ? 'primary' : 'default'),
            secondary: (__VLS_ctx.selectedCategory !== cat.name),
            size: "small",
        }));
        const __VLS_30 = __VLS_29({
            ...{ 'onClick': {} },
            key: (cat.id),
            type: (__VLS_ctx.selectedCategory === cat.name ? 'primary' : 'default'),
            secondary: (__VLS_ctx.selectedCategory !== cat.name),
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        let __VLS_32;
        let __VLS_33;
        let __VLS_34;
        const __VLS_35 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.categories.length > 0))
                    return;
                __VLS_ctx.handleCategoryChange(cat.name);
            }
        };
        __VLS_31.slots.default;
        (cat.displayName);
        var __VLS_31;
    }
    var __VLS_19;
}
if (__VLS_ctx.toolsLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" },
    });
    for (const [i] of __VLS_getVForSourceType((8))) {
        const __VLS_36 = {}.NCard;
        /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            key: (i),
        }));
        const __VLS_38 = __VLS_37({
            key: (i),
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        __VLS_39.slots.default;
        const __VLS_40 = {}.NSkeleton;
        /** @type {[typeof __VLS_components.NSkeleton, typeof __VLS_components.nSkeleton, ]} */ ;
        // @ts-ignore
        const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
            text: true,
            repeat: (3),
        }));
        const __VLS_42 = __VLS_41({
            text: true,
            repeat: (3),
        }, ...__VLS_functionalComponentArgsRest(__VLS_41));
        var __VLS_39;
    }
}
else if (__VLS_ctx.toolsError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-col items-center justify-center py-20" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-muted-foreground mb-4" },
    });
    (__VLS_ctx.t('common.error'));
    const __VLS_44 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_46 = __VLS_45({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    let __VLS_48;
    let __VLS_49;
    let __VLS_50;
    const __VLS_51 = {
        onClick: (() => { })
    };
    __VLS_47.slots.default;
    (__VLS_ctx.t('common.retry'));
    var __VLS_47;
}
else if (__VLS_ctx.tools.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-col items-center justify-center py-20" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-lg text-muted-foreground" },
    });
    (__VLS_ctx.t('common.noResults'));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" },
    });
    for (const [tool] of __VLS_getVForSourceType((__VLS_ctx.tools))) {
        const __VLS_52 = {}.NCard;
        /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
        // @ts-ignore
        const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
            ...{ 'onClick': {} },
            key: (tool.id),
            hoverable: true,
            ...{ class: "cursor-pointer transition-all hover:shadow-lg" },
        }));
        const __VLS_54 = __VLS_53({
            ...{ 'onClick': {} },
            key: (tool.id),
            hoverable: true,
            ...{ class: "cursor-pointer transition-all hover:shadow-lg" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_53));
        let __VLS_56;
        let __VLS_57;
        let __VLS_58;
        const __VLS_59 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.toolsLoading))
                    return;
                if (!!(__VLS_ctx.toolsError))
                    return;
                if (!!(__VLS_ctx.tools.length === 0))
                    return;
                __VLS_ctx.navigateToTool(tool.slug);
            }
        };
        __VLS_55.slots.default;
        {
            const { cover: __VLS_thisSlot } = __VLS_55.slots;
            if (tool.thumbnail) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "h-40 overflow-hidden" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                    src: (tool.thumbnail),
                    alt: (tool.title),
                    ...{ class: "h-full w-full object-cover transition-transform hover:scale-105" },
                });
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "flex h-40 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10" },
                });
                const __VLS_60 = {}.NIcon;
                /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
                // @ts-ignore
                const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
                    size: (40),
                    ...{ class: "text-primary/40" },
                }));
                const __VLS_62 = __VLS_61({
                    size: (40),
                    ...{ class: "text-primary/40" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_61));
                __VLS_63.slots.default;
                __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                    xmlns: "http://www.w3.org/2000/svg",
                    viewBox: "0 0 24 24",
                    fill: "currentColor",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                    d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
                });
                var __VLS_63;
            }
        }
        const __VLS_64 = {}.NSpace;
        /** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
        // @ts-ignore
        const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
            vertical: true,
            size: (4),
        }));
        const __VLS_66 = __VLS_65({
            vertical: true,
            size: (4),
        }, ...__VLS_functionalComponentArgsRest(__VLS_65));
        __VLS_67.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: "text-base font-semibold text-foreground" },
        });
        (tool.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm text-muted-foreground line-clamp-2" },
        });
        (tool.description || '');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mt-2 flex items-center gap-2" },
        });
        if (tool.category) {
            const __VLS_68 = {}.NTag;
            /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
            // @ts-ignore
            const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
                size: "tiny",
                bordered: (false),
                type: "info",
            }));
            const __VLS_70 = __VLS_69({
                size: "tiny",
                bordered: (false),
                type: "info",
            }, ...__VLS_functionalComponentArgsRest(__VLS_69));
            __VLS_71.slots.default;
            (tool.category);
            var __VLS_71;
        }
        var __VLS_67;
        var __VLS_55;
    }
}
if (__VLS_ctx.pagination && __VLS_ctx.pagination.totalPages > 1) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-10 flex justify-center" },
    });
    const __VLS_72 = {}.NPagination;
    /** @type {[typeof __VLS_components.NPagination, typeof __VLS_components.nPagination, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        ...{ 'onUpdate:page': {} },
        page: (__VLS_ctx.currentPage),
        pageCount: (__VLS_ctx.pagination.totalPages),
        pageSize: (__VLS_ctx.pageSize),
        showQuickJumper: true,
    }));
    const __VLS_74 = __VLS_73({
        ...{ 'onUpdate:page': {} },
        page: (__VLS_ctx.currentPage),
        pageCount: (__VLS_ctx.pagination.totalPages),
        pageSize: (__VLS_ctx.pageSize),
        showQuickJumper: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    let __VLS_76;
    let __VLS_77;
    let __VLS_78;
    const __VLS_79 = {
        'onUpdate:page': (__VLS_ctx.handlePageChange)
    };
    var __VLS_75;
}
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-7xl']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
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
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['xl:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['h-40']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:scale-105']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-40']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
/** @type {__VLS_StyleScopedClasses['from-primary/10']} */ ;
/** @type {__VLS_StyleScopedClasses['to-accent/10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary/40']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['line-clamp-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-10']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            t: t,
            search: search,
            selectedCategory: selectedCategory,
            currentPage: currentPage,
            pageSize: pageSize,
            toolsLoading: toolsLoading,
            toolsError: toolsError,
            tools: tools,
            pagination: pagination,
            categories: categories,
            handleSearch: handleSearch,
            handleCategoryChange: handleCategoryChange,
            handlePageChange: handlePageChange,
            navigateToTool: navigateToTool,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
