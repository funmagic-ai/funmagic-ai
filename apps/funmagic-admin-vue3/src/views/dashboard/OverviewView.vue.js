import { NDataTable, NSpin, NEmpty } from 'naive-ui';
import { useQuery } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
const { t } = useI18n();
const router = useRouter();
// Fetch tools list to get total count
const { data: toolsData, isLoading: toolsLoading } = useQuery({
    queryKey: ['admin', 'tools'],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/tools', {
            params: { query: { includeInactive: 'true' } },
        });
        if (error)
            throw new Error('Failed to fetch tools');
        return data;
    },
});
// Fetch users list
const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/users', {
            params: { query: { limit: '100' } },
        });
        if (error)
            throw new Error('Failed to fetch users');
        return data;
    },
});
const totalTools = computed(() => toolsData.value?.tools?.length ?? 0);
const totalUsers = computed(() => usersData.value?.users?.length ?? 0);
const activeTools = computed(() => toolsData.value?.tools?.filter((tool) => tool.isActive).length ?? 0);
// Build recent tasks from users' data -- we don't have a dedicated admin tasks endpoint,
// so we show a placeholder stats view
const isLoading = computed(() => toolsLoading.value || usersLoading.value);
// Stat cards definition
const stats = computed(() => [
    {
        label: t('dashboard.totalUsers'),
        value: totalUsers.value,
        loading: usersLoading.value,
    },
    {
        label: t('dashboard.totalTools'),
        value: totalTools.value,
        loading: toolsLoading.value,
    },
    {
        label: 'Active Tools',
        value: activeTools.value,
        loading: toolsLoading.value,
    },
    {
        label: t('dashboard.totalRevenue'),
        value: '--',
        loading: false,
    },
]);
// Recent tools table columns
const toolColumns = [
    {
        title: t('common.name'),
        key: 'title',
        ellipsis: { tooltip: true },
    },
    {
        title: 'Slug',
        key: 'slug',
        width: 180,
        ellipsis: { tooltip: true },
    },
    {
        title: 'Type',
        key: 'toolType',
        width: 140,
        render(row) {
            return row.toolType?.displayName ?? '--';
        },
    },
    {
        title: t('common.status'),
        key: 'isActive',
        width: 100,
        render(row) {
            return h(StatusBadge, { status: row.isActive ? 'active' : 'inactive' });
        },
    },
    {
        title: 'Usage',
        key: 'usageCount',
        width: 80,
    },
    {
        title: t('common.createdAt'),
        key: 'createdAt',
        width: 160,
        render(row) {
            return new Date(row.createdAt).toLocaleDateString();
        },
    },
];
const recentTools = computed(() => {
    const tools = toolsData.value?.tools ?? [];
    return [...tools].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
});
function handleToolRowClick(row) {
    router.push({ name: 'tools-detail', params: { id: row.id } });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-6" },
});
/** @type {[typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: (__VLS_ctx.t('dashboard.title')),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('dashboard.title')),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" },
});
for (const [stat] of __VLS_getVForSourceType((__VLS_ctx.stats))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (stat.label),
        ...{ class: "rounded-xl border bg-card p-6 shadow-sm" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm font-medium text-muted-foreground" },
    });
    (stat.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-2" },
    });
    if (stat.loading) {
        const __VLS_3 = {}.NSpin;
        /** @type {[typeof __VLS_components.NSpin, ]} */ ;
        // @ts-ignore
        const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
            size: "small",
        }));
        const __VLS_5 = __VLS_4({
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-2xl font-bold tabular-nums text-foreground" },
        });
        (stat.value);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rounded-xl border bg-card py-6 shadow-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "px-6 pb-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "text-lg font-semibold text-foreground" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "px-6" },
});
if (__VLS_ctx.isLoading) {
    const __VLS_7 = {}.NSpin;
    /** @type {[typeof __VLS_components.NSpin, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
        ...{ class: "flex justify-center py-8" },
    }));
    const __VLS_9 = __VLS_8({
        ...{ class: "flex justify-center py-8" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
}
else if (__VLS_ctx.recentTools.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rounded-lg border border-dashed p-8 text-center md:p-12" },
    });
    const __VLS_11 = {}.NEmpty;
    /** @type {[typeof __VLS_components.NEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
        description: (__VLS_ctx.t('common.noResults')),
    }));
    const __VLS_13 = __VLS_12({
        description: (__VLS_ctx.t('common.noResults')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
}
else {
    const __VLS_15 = {}.NDataTable;
    /** @type {[typeof __VLS_components.NDataTable, ]} */ ;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
        columns: (__VLS_ctx.toolColumns),
        data: (__VLS_ctx.recentTools),
        bordered: (false),
        singleLine: (false),
        size: "small",
        rowProps: ((row) => ({ style: 'cursor: pointer;', onClick: () => __VLS_ctx.handleToolRowClick(row) })),
    }));
    const __VLS_17 = __VLS_16({
        columns: (__VLS_ctx.toolColumns),
        data: (__VLS_ctx.recentTools),
        bordered: (false),
        singleLine: (false),
        size: "small",
        rowProps: ((row) => ({ style: 'cursor: pointer;', onClick: () => __VLS_ctx.handleToolRowClick(row) })),
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
}
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['py-6']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
/** @type {__VLS_StyleScopedClasses['p-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['md:p-12']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NDataTable: NDataTable,
            NSpin: NSpin,
            NEmpty: NEmpty,
            PageHeader: PageHeader,
            t: t,
            isLoading: isLoading,
            stats: stats,
            toolColumns: toolColumns,
            recentTools: recentTools,
            handleToolRowClick: handleToolRowClick,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
