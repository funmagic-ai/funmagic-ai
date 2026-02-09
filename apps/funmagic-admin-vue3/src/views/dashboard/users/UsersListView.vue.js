import { NButton, NInput, NDataTable, NSpin, NEmpty, NIcon, NSelect, NPagination, } from 'naive-ui';
import { useQuery } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { EyeOutline, SearchOutline } from '@vicons/ionicons5';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
const { t } = useI18n();
const router = useRouter();
const search = ref('');
const roleFilter = ref(null);
const currentPage = ref(1);
const pageSize = ref(20);
const roleOptions = [
    { label: 'All Roles', value: null },
    { label: 'User', value: 'user' },
    { label: 'Admin', value: 'admin' },
    { label: 'Super Admin', value: 'super_admin' },
];
// Fetch users
const { data, isLoading, isError, refetch } = useQuery({
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
// Filtered users
const filteredUsers = computed(() => {
    let users = data.value?.users ?? [];
    // Filter by role
    if (roleFilter.value) {
        users = users.filter((u) => u.role === roleFilter.value);
    }
    // Filter by search
    if (search.value.trim()) {
        const q = search.value.toLowerCase();
        users = users.filter((u) => (u.name?.toLowerCase().includes(q) ?? false) ||
            u.email.toLowerCase().includes(q));
    }
    return users;
});
const totalItems = computed(() => filteredUsers.value.length);
const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredUsers.value.slice(start, start + pageSize.value);
});
// Table columns
const columns = [
    {
        title: t('common.name'),
        key: 'name',
        minWidth: 140,
        ellipsis: { tooltip: true },
        render(row) {
            return row.name || '--';
        },
    },
    {
        title: t('users.email'),
        key: 'email',
        minWidth: 200,
        ellipsis: { tooltip: true },
    },
    {
        title: t('users.role'),
        key: 'role',
        width: 120,
        render(row) {
            return h(StatusBadge, { status: row.role === 'super_admin' ? 'active' : row.role === 'admin' ? 'processing' : 'default' });
        },
    },
    {
        title: t('users.credits'),
        key: 'credits',
        width: 100,
        render(row) {
            return row.credits?.balance ?? 0;
        },
        sorter: (a, b) => (a.credits?.balance ?? 0) - (b.credits?.balance ?? 0),
    },
    {
        title: t('common.createdAt'),
        key: 'createdAt',
        width: 140,
        sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        render(row) {
            return new Date(row.createdAt).toLocaleDateString();
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
                    router.push({ name: 'users-detail', params: { id: row.id } });
                },
            }, {
                icon: () => h(NIcon, null, { default: () => h(EyeOutline) }),
            });
        },
    },
];
// Reset page on filter change
watch([search, roleFilter], () => {
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
    title: (__VLS_ctx.t('users.title')),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('users.title')),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col gap-3 sm:flex-row sm:items-center" },
});
const __VLS_3 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.NInput, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
    value: (__VLS_ctx.search),
    placeholder: (__VLS_ctx.t('common.search')),
    clearable: true,
    ...{ class: "w-full sm:max-w-xs" },
}));
const __VLS_5 = __VLS_4({
    value: (__VLS_ctx.search),
    placeholder: (__VLS_ctx.t('common.search')),
    clearable: true,
    ...{ class: "w-full sm:max-w-xs" },
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
__VLS_6.slots.default;
{
    const { prefix: __VLS_thisSlot } = __VLS_6.slots;
    const __VLS_7 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({}));
    const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
    __VLS_10.slots.default;
    const __VLS_11 = {}.SearchOutline;
    /** @type {[typeof __VLS_components.SearchOutline, ]} */ ;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({}));
    const __VLS_13 = __VLS_12({}, ...__VLS_functionalComponentArgsRest(__VLS_12));
    var __VLS_10;
}
var __VLS_6;
const __VLS_15 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, ]} */ ;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
    value: (__VLS_ctx.roleFilter),
    options: (__VLS_ctx.roleOptions),
    placeholder: "Filter by role",
    clearable: true,
    ...{ class: "w-full sm:w-40" },
}));
const __VLS_17 = __VLS_16({
    value: (__VLS_ctx.roleFilter),
    options: (__VLS_ctx.roleOptions),
    placeholder: "Filter by role",
    clearable: true,
    ...{ class: "w-full sm:w-40" },
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-center py-12" },
    });
    const __VLS_19 = {}.NSpin;
    /** @type {[typeof __VLS_components.NSpin, ]} */ ;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
        size: "large",
    }));
    const __VLS_21 = __VLS_20({
        size: "large",
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
}
else if (__VLS_ctx.isError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "py-12 text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "mb-4 text-sm text-destructive" },
    });
    (__VLS_ctx.t('common.error'));
    const __VLS_23 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
        ...{ 'onClick': {} },
    }));
    const __VLS_25 = __VLS_24({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    let __VLS_27;
    let __VLS_28;
    let __VLS_29;
    const __VLS_30 = {
        onClick: (() => __VLS_ctx.refetch())
    };
    __VLS_26.slots.default;
    (__VLS_ctx.t('common.retry'));
    var __VLS_26;
}
else if (__VLS_ctx.filteredUsers.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rounded-lg border border-dashed p-8 text-center md:p-12" },
    });
    const __VLS_31 = {}.NEmpty;
    /** @type {[typeof __VLS_components.NEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
        description: (__VLS_ctx.t('common.noResults')),
    }));
    const __VLS_33 = __VLS_32({
        description: (__VLS_ctx.t('common.noResults')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "overflow-hidden rounded-md border" },
    });
    const __VLS_35 = {}.NDataTable;
    /** @type {[typeof __VLS_components.NDataTable, ]} */ ;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
        columns: (__VLS_ctx.columns),
        data: (__VLS_ctx.paginatedUsers),
        bordered: (false),
        singleLine: (false),
        size: "small",
        rowProps: ((row) => ({ style: 'cursor: pointer;', onClick: () => __VLS_ctx.router.push({ name: 'users-detail', params: { id: row.id } }) })),
    }));
    const __VLS_37 = __VLS_36({
        columns: (__VLS_ctx.columns),
        data: (__VLS_ctx.paginatedUsers),
        bordered: (false),
        singleLine: (false),
        size: "small",
        rowProps: ((row) => ({ style: 'cursor: pointer;', onClick: () => __VLS_ctx.router.push({ name: 'users-detail', params: { id: row.id } }) })),
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    if (__VLS_ctx.totalItems > __VLS_ctx.pageSize) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex justify-end" },
        });
        const __VLS_39 = {}.NPagination;
        /** @type {[typeof __VLS_components.NPagination, ]} */ ;
        // @ts-ignore
        const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
            page: (__VLS_ctx.currentPage),
            pageSize: (__VLS_ctx.pageSize),
            itemCount: (__VLS_ctx.totalItems),
            showQuickJumper: true,
        }));
        const __VLS_41 = __VLS_40({
            page: (__VLS_ctx.currentPage),
            pageSize: (__VLS_ctx.pageSize),
            itemCount: (__VLS_ctx.totalItems),
            showQuickJumper: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_40));
    }
}
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:max-w-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:w-40']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
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
            NButton: NButton,
            NInput: NInput,
            NDataTable: NDataTable,
            NSpin: NSpin,
            NEmpty: NEmpty,
            NIcon: NIcon,
            NSelect: NSelect,
            NPagination: NPagination,
            SearchOutline: SearchOutline,
            PageHeader: PageHeader,
            t: t,
            router: router,
            search: search,
            roleFilter: roleFilter,
            currentPage: currentPage,
            pageSize: pageSize,
            roleOptions: roleOptions,
            isLoading: isLoading,
            isError: isError,
            refetch: refetch,
            filteredUsers: filteredUsers,
            totalItems: totalItems,
            paginatedUsers: paginatedUsers,
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
