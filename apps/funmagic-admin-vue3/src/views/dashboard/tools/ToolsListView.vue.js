import { NButton, NInput, NDataTable, NSpin, NEmpty, NIcon, NPagination } from 'naive-ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { TrashOutline, CreateOutline, AddOutline, SearchOutline } from '@vicons/ionicons5';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue';
const { t } = useI18n();
const router = useRouter();
const message = useMessage();
const queryClient = useQueryClient();
const search = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
// Fetch tools
const { data, isLoading, isError, refetch } = useQuery({
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
// Filtered and paginated tools
const filteredTools = computed(() => {
    const tools = data.value?.tools ?? [];
    if (!search.value.trim())
        return tools;
    const q = search.value.toLowerCase();
    return tools.filter((tool) => tool.title.toLowerCase().includes(q) ||
        tool.slug.toLowerCase().includes(q) ||
        (tool.toolType?.displayName?.toLowerCase().includes(q) ?? false));
});
const totalItems = computed(() => filteredTools.value.length);
const paginatedTools = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredTools.value.slice(start, start + pageSize.value);
});
// Delete tool
const showDeleteDialog = ref(false);
const deleteTarget = ref(null);
const deleteMutation = useMutation({
    mutationFn: async (id) => {
        const { error } = await api.DELETE('/api/admin/tools/{id}', {
            params: { path: { id } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to delete tool');
    },
    onSuccess: () => {
        message.success('Tool deleted successfully');
        showDeleteDialog.value = false;
        deleteTarget.value = null;
        queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] });
    },
    onError: (err) => {
        message.error(err.message);
    },
});
function openDeleteDialog(tool) {
    deleteTarget.value = tool;
    showDeleteDialog.value = true;
}
function confirmDelete() {
    if (deleteTarget.value) {
        deleteMutation.mutate(deleteTarget.value.id);
    }
}
// Table columns
const columns = [
    {
        title: t('common.name'),
        key: 'title',
        ellipsis: { tooltip: true },
        minWidth: 160,
    },
    {
        title: t('tools.slug'),
        key: 'slug',
        width: 160,
        ellipsis: { tooltip: true },
    },
    {
        title: t('tools.toolType'),
        key: 'toolType',
        width: 140,
        render(row) {
            return row.toolType?.displayName ?? '--';
        },
    },
    {
        title: 'Usage',
        key: 'usageCount',
        width: 80,
        sorter: (a, b) => a.usageCount - b.usageCount,
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
        title: t('common.actions'),
        key: 'actions',
        width: 120,
        fixed: 'right',
        render(row) {
            return h('div', { class: 'flex items-center gap-1' }, [
                h(NButton, {
                    size: 'small',
                    quaternary: true,
                    onClick: (e) => {
                        e.stopPropagation();
                        router.push({ name: 'tools-detail', params: { id: row.id } });
                    },
                }, {
                    icon: () => h(NIcon, null, { default: () => h(CreateOutline) }),
                }),
                h(NButton, {
                    size: 'small',
                    quaternary: true,
                    type: 'error',
                    onClick: (e) => {
                        e.stopPropagation();
                        openDeleteDialog({ id: row.id, title: row.title });
                    },
                }, {
                    icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
                }),
            ]);
        },
    },
];
// Reset page on search
watch(search, () => {
    currentPage.value = 1;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: (__VLS_ctx.t('tools.title')),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('tools.title')),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_2.slots.default;
{
    const { actions: __VLS_thisSlot } = __VLS_2.slots;
    const __VLS_3 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_5 = __VLS_4({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    let __VLS_7;
    let __VLS_8;
    let __VLS_9;
    const __VLS_10 = {
        onClick: (...[$event]) => {
            __VLS_ctx.router.push({ name: 'tools-create' });
        }
    };
    __VLS_6.slots.default;
    {
        const { icon: __VLS_thisSlot } = __VLS_6.slots;
        const __VLS_11 = {}.NIcon;
        /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({}));
        const __VLS_13 = __VLS_12({}, ...__VLS_functionalComponentArgsRest(__VLS_12));
        __VLS_14.slots.default;
        const __VLS_15 = {}.AddOutline;
        /** @type {[typeof __VLS_components.AddOutline, ]} */ ;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({}));
        const __VLS_17 = __VLS_16({}, ...__VLS_functionalComponentArgsRest(__VLS_16));
        var __VLS_14;
    }
    (__VLS_ctx.t('tools.create'));
    var __VLS_6;
}
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col gap-3 sm:flex-row sm:items-center" },
});
const __VLS_19 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.NInput, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    value: (__VLS_ctx.search),
    placeholder: (__VLS_ctx.t('common.search')),
    clearable: true,
    ...{ class: "w-full sm:max-w-xs" },
}));
const __VLS_21 = __VLS_20({
    value: (__VLS_ctx.search),
    placeholder: (__VLS_ctx.t('common.search')),
    clearable: true,
    ...{ class: "w-full sm:max-w-xs" },
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
__VLS_22.slots.default;
{
    const { prefix: __VLS_thisSlot } = __VLS_22.slots;
    const __VLS_23 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({}));
    const __VLS_25 = __VLS_24({}, ...__VLS_functionalComponentArgsRest(__VLS_24));
    __VLS_26.slots.default;
    const __VLS_27 = {}.SearchOutline;
    /** @type {[typeof __VLS_components.SearchOutline, ]} */ ;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({}));
    const __VLS_29 = __VLS_28({}, ...__VLS_functionalComponentArgsRest(__VLS_28));
    var __VLS_26;
}
var __VLS_22;
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-center py-12" },
    });
    const __VLS_31 = {}.NSpin;
    /** @type {[typeof __VLS_components.NSpin, ]} */ ;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
        size: "large",
    }));
    const __VLS_33 = __VLS_32({
        size: "large",
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
}
else if (__VLS_ctx.isError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "py-12 text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "mb-4 text-sm text-destructive" },
    });
    (__VLS_ctx.t('common.error'));
    const __VLS_35 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
        ...{ 'onClick': {} },
    }));
    const __VLS_37 = __VLS_36({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    let __VLS_39;
    let __VLS_40;
    let __VLS_41;
    const __VLS_42 = {
        onClick: (() => __VLS_ctx.refetch())
    };
    __VLS_38.slots.default;
    (__VLS_ctx.t('common.retry'));
    var __VLS_38;
}
else if (__VLS_ctx.filteredTools.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rounded-lg border border-dashed p-8 text-center md:p-12" },
    });
    const __VLS_43 = {}.NEmpty;
    /** @type {[typeof __VLS_components.NEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
        description: (__VLS_ctx.t('common.noResults')),
    }));
    const __VLS_45 = __VLS_44({
        description: (__VLS_ctx.t('common.noResults')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_44));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "overflow-hidden rounded-md border" },
    });
    const __VLS_47 = {}.NDataTable;
    /** @type {[typeof __VLS_components.NDataTable, ]} */ ;
    // @ts-ignore
    const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
        columns: (__VLS_ctx.columns),
        data: (__VLS_ctx.paginatedTools),
        bordered: (false),
        singleLine: (false),
        size: "small",
        rowProps: ((row) => ({ style: 'cursor: pointer;', onClick: () => __VLS_ctx.router.push({ name: 'tools-detail', params: { id: row.id } }) })),
    }));
    const __VLS_49 = __VLS_48({
        columns: (__VLS_ctx.columns),
        data: (__VLS_ctx.paginatedTools),
        bordered: (false),
        singleLine: (false),
        size: "small",
        rowProps: ((row) => ({ style: 'cursor: pointer;', onClick: () => __VLS_ctx.router.push({ name: 'tools-detail', params: { id: row.id } }) })),
    }, ...__VLS_functionalComponentArgsRest(__VLS_48));
    if (__VLS_ctx.totalItems > __VLS_ctx.pageSize) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex justify-end" },
        });
        const __VLS_51 = {}.NPagination;
        /** @type {[typeof __VLS_components.NPagination, ]} */ ;
        // @ts-ignore
        const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
            page: (__VLS_ctx.currentPage),
            pageSize: (__VLS_ctx.pageSize),
            itemCount: (__VLS_ctx.totalItems),
            showQuickJumper: true,
        }));
        const __VLS_53 = __VLS_52({
            page: (__VLS_ctx.currentPage),
            pageSize: (__VLS_ctx.pageSize),
            itemCount: (__VLS_ctx.totalItems),
            showQuickJumper: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_52));
    }
}
/** @type {[typeof DeleteConfirmDialog, ]} */ ;
// @ts-ignore
const __VLS_55 = __VLS_asFunctionalComponent(DeleteConfirmDialog, new DeleteConfirmDialog({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: (`Delete &quot;${__VLS_ctx.deleteTarget?.title ?? ''}&quot;?`),
    message: (__VLS_ctx.t('tools.deleteConfirm')),
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}));
const __VLS_56 = __VLS_55({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: (`Delete &quot;${__VLS_ctx.deleteTarget?.title ?? ''}&quot;?`),
    message: (__VLS_ctx.t('tools.deleteConfirm')),
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_55));
let __VLS_58;
let __VLS_59;
let __VLS_60;
const __VLS_61 = {
    onConfirm: (__VLS_ctx.confirmDelete)
};
var __VLS_57;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:max-w-xs']} */ ;
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
            NPagination: NPagination,
            AddOutline: AddOutline,
            SearchOutline: SearchOutline,
            PageHeader: PageHeader,
            DeleteConfirmDialog: DeleteConfirmDialog,
            t: t,
            router: router,
            search: search,
            currentPage: currentPage,
            pageSize: pageSize,
            isLoading: isLoading,
            isError: isError,
            refetch: refetch,
            filteredTools: filteredTools,
            totalItems: totalItems,
            paginatedTools: paginatedTools,
            showDeleteDialog: showDeleteDialog,
            deleteTarget: deleteTarget,
            deleteMutation: deleteMutation,
            confirmDelete: confirmDelete,
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
