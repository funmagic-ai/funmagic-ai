import { NButton, NDataTable, NSpin, NEmpty, NIcon, NTabs, NTabPane, NPagination, } from 'naive-ui';
import { useQuery } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { EyeOutline } from '@vicons/ionicons5';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
const { t } = useI18n();
const router = useRouter();
const statusFilter = ref('all');
const currentPage = ref(1);
const pageSize = ref(20);
// Fetch all users to collect their tasks -- there is no dedicated admin tasks list endpoint
// so we pull user details. For a real scenario, a dedicated endpoint would be used.
// We use the users list and their embedded tasks as a workaround.
const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/users', {
            params: { query: { limit: '500' } },
        });
        if (error)
            throw new Error('Failed to fetch users');
        return data;
    },
});
// Since we don't have a dedicated tasks list endpoint, we show the tools
// and provide navigation to detailed views. For demonstration, we build
// a simple list from the first few users' tasks.
const allUserIds = computed(() => (usersData.value?.users ?? []).map((u) => u.id));
// Fetch first 5 users' details to gather tasks
const userDetailQueries = computed(() => allUserIds.value.slice(0, 10));
const { data: userDetailsData, isLoading: detailsLoading } = useQuery({
    queryKey: computed(() => ['admin', 'user-tasks-aggregate', userDetailQueries.value]),
    queryFn: async () => {
        const results = [];
        const userIds = userDetailQueries.value;
        const usersMap = new Map((usersData.value?.users ?? []).map((u) => [u.id, u]));
        for (const userId of userIds) {
            try {
                const { data } = await api.GET('/api/admin/users/{id}', {
                    params: { path: { id: userId } },
                });
                if (data?.recentTasks) {
                    const user = usersMap.get(userId);
                    for (const task of data.recentTasks) {
                        results.push({
                            id: task.id,
                            userId,
                            userName: user?.name ?? '--',
                            userEmail: user?.email ?? '--',
                            tool: task.tool,
                            status: task.status,
                            creditsCost: task.creditsCost,
                            createdAt: task.createdAt,
                        });
                    }
                }
            }
            catch {
                // Skip failed user fetches
            }
        }
        return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    enabled: computed(() => allUserIds.value.length > 0),
});
const isLoading = computed(() => usersLoading.value || detailsLoading.value);
const allTasks = computed(() => userDetailsData.value ?? []);
// Status filter tabs
const statusTabs = [
    { name: 'all', label: 'All' },
    { name: 'pending', label: t('tasks.pending') },
    { name: 'processing', label: t('tasks.processing') },
    { name: 'completed', label: t('tasks.completed') },
    { name: 'failed', label: t('tasks.failed') },
];
const filteredTasks = computed(() => {
    if (statusFilter.value === 'all')
        return allTasks.value;
    return allTasks.value.filter((task) => task.status.toLowerCase() === statusFilter.value);
});
const totalItems = computed(() => filteredTasks.value.length);
const paginatedTasks = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredTasks.value.slice(start, start + pageSize.value);
});
// Table columns
const columns = [
    {
        title: t('tasks.taskId'),
        key: 'id',
        width: 120,
        ellipsis: { tooltip: true },
        render(row) {
            return row.id.substring(0, 8) + '...';
        },
    },
    {
        title: t('tasks.user'),
        key: 'userName',
        width: 140,
        ellipsis: { tooltip: true },
        render(row) {
            return row.userName !== '--' ? row.userName : row.userEmail;
        },
    },
    {
        title: t('tasks.tool'),
        key: 'tool',
        minWidth: 140,
        ellipsis: { tooltip: true },
        render(row) {
            return row.tool?.title ?? '--';
        },
    },
    {
        title: t('tasks.status'),
        key: 'status',
        width: 120,
        render(row) {
            return h(StatusBadge, { status: row.status });
        },
    },
    {
        title: 'Credits',
        key: 'creditsCost',
        width: 80,
    },
    {
        title: t('common.createdAt'),
        key: 'createdAt',
        width: 160,
        render(row) {
            return new Date(row.createdAt).toLocaleString();
        },
    },
    {
        title: t('common.actions'),
        key: 'actions',
        width: 80,
        fixed: 'right',
        render(row) {
            return h(NButton, {
                size: 'small',
                quaternary: true,
                onClick: (e) => {
                    e.stopPropagation();
                    router.push({ name: 'tasks-detail', params: { id: row.id } });
                },
            }, {
                icon: () => h(NIcon, null, { default: () => h(EyeOutline) }),
            });
        },
    },
];
// Reset page on filter change
watch(statusFilter, () => {
    currentPage.value = 1;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: (__VLS_ctx.t('tasks.title')),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('tasks.title')),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
const __VLS_3 = {}.NTabs;
/** @type {[typeof __VLS_components.NTabs, typeof __VLS_components.NTabs, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
    value: (__VLS_ctx.statusFilter),
    type: "line",
}));
const __VLS_5 = __VLS_4({
    value: (__VLS_ctx.statusFilter),
    type: "line",
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
__VLS_6.slots.default;
for (const [tab] of __VLS_getVForSourceType((__VLS_ctx.statusTabs))) {
    const __VLS_7 = {}.NTabPane;
    /** @type {[typeof __VLS_components.NTabPane, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
        key: (tab.name),
        name: (tab.name),
        tab: (tab.label),
    }));
    const __VLS_9 = __VLS_8({
        key: (tab.name),
        name: (tab.name),
        tab: (tab.label),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
}
var __VLS_6;
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-center py-12" },
    });
    const __VLS_11 = {}.NSpin;
    /** @type {[typeof __VLS_components.NSpin, ]} */ ;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
        size: "large",
    }));
    const __VLS_13 = __VLS_12({
        size: "large",
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
}
else if (__VLS_ctx.filteredTasks.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rounded-lg border border-dashed p-8 text-center md:p-12" },
    });
    const __VLS_15 = {}.NEmpty;
    /** @type {[typeof __VLS_components.NEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
        description: (__VLS_ctx.t('common.noResults')),
    }));
    const __VLS_17 = __VLS_16({
        description: (__VLS_ctx.t('common.noResults')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "overflow-hidden rounded-md border" },
    });
    const __VLS_19 = {}.NDataTable;
    /** @type {[typeof __VLS_components.NDataTable, ]} */ ;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
        columns: (__VLS_ctx.columns),
        data: (__VLS_ctx.paginatedTasks),
        bordered: (false),
        singleLine: (false),
        size: "small",
        rowProps: ((row) => ({ style: 'cursor: pointer;', onClick: () => __VLS_ctx.router.push({ name: 'tasks-detail', params: { id: row.id } }) })),
    }));
    const __VLS_21 = __VLS_20({
        columns: (__VLS_ctx.columns),
        data: (__VLS_ctx.paginatedTasks),
        bordered: (false),
        singleLine: (false),
        size: "small",
        rowProps: ((row) => ({ style: 'cursor: pointer;', onClick: () => __VLS_ctx.router.push({ name: 'tasks-detail', params: { id: row.id } }) })),
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    if (__VLS_ctx.totalItems > __VLS_ctx.pageSize) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex justify-end" },
        });
        const __VLS_23 = {}.NPagination;
        /** @type {[typeof __VLS_components.NPagination, ]} */ ;
        // @ts-ignore
        const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
            page: (__VLS_ctx.currentPage),
            pageSize: (__VLS_ctx.pageSize),
            itemCount: (__VLS_ctx.totalItems),
            showQuickJumper: true,
        }));
        const __VLS_25 = __VLS_24({
            page: (__VLS_ctx.currentPage),
            pageSize: (__VLS_ctx.pageSize),
            itemCount: (__VLS_ctx.totalItems),
            showQuickJumper: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    }
}
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
/** @type {__VLS_StyleScopedClasses['p-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['md:p-12']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NDataTable: NDataTable,
            NSpin: NSpin,
            NEmpty: NEmpty,
            NTabs: NTabs,
            NTabPane: NTabPane,
            NPagination: NPagination,
            PageHeader: PageHeader,
            t: t,
            router: router,
            statusFilter: statusFilter,
            currentPage: currentPage,
            pageSize: pageSize,
            isLoading: isLoading,
            statusTabs: statusTabs,
            filteredTasks: filteredTasks,
            totalItems: totalItems,
            paginatedTasks: paginatedTasks,
            columns: columns,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
