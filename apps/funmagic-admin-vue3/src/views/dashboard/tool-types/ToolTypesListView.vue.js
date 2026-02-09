import { NButton, NDataTable, NIcon, NSwitch } from 'naive-ui';
import { AddOutline, CreateOutline } from '@vicons/ionicons5';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
const { t } = useI18n();
const router = useRouter();
const message = useMessage();
const queryClient = useQueryClient();
const { data, isLoading, isError, error } = useQuery({
    queryKey: ['tool-types'],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/tool-types');
        if (error)
            throw new Error(error.error ?? 'Failed to fetch tool types');
        return data;
    },
});
const toggleActiveMutation = useMutation({
    mutationFn: async (id) => {
        const { data, error } = await api.PATCH('/api/admin/tool-types/{id}/toggle-active', {
            params: { path: { id } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to toggle status');
        return data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tool-types'] });
        message.success('Status updated');
    },
    onError: (err) => {
        message.error(err.message);
    },
});
const toolTypes = computed(() => data.value?.toolTypes ?? []);
const columns = computed(() => [
    {
        title: t('common.name'),
        key: 'displayName',
        ellipsis: { tooltip: true },
    },
    {
        title: 'Slug',
        key: 'name',
        ellipsis: { tooltip: true },
    },
    {
        title: t('common.description'),
        key: 'description',
        ellipsis: { tooltip: true },
        render: (row) => row.description || '-',
    },
    {
        title: t('common.status'),
        key: 'isActive',
        width: 120,
        render: (row) => {
            return h(NSwitch, {
                value: row.isActive,
                loading: toggleActiveMutation.isPending.value,
                onUpdateValue: () => toggleActiveMutation.mutate(row.id),
            });
        },
    },
    {
        title: t('common.actions'),
        key: 'actions',
        width: 100,
        render: (row) => {
            return h(NButton, {
                size: 'small',
                quaternary: true,
                onClick: () => router.push({ name: 'tool-types-detail', params: { id: row.id } }),
            }, {
                icon: () => h(NIcon, null, { default: () => h(CreateOutline) }),
                default: () => t('common.edit'),
            });
        },
    },
]);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: (__VLS_ctx.t('nav.toolTypes')),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('nav.toolTypes')),
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
            __VLS_ctx.router.push({ name: 'tool-types-create' });
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
    (__VLS_ctx.t('common.create'));
    var __VLS_6;
}
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
if (__VLS_ctx.isError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "py-8 text-center text-destructive" },
    });
    (__VLS_ctx.error?.message || __VLS_ctx.t('common.error'));
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
        data: (__VLS_ctx.toolTypes),
        loading: (__VLS_ctx.isLoading),
        bordered: (false),
        rowKey: ((row) => row.id),
    }));
    const __VLS_21 = __VLS_20({
        columns: (__VLS_ctx.columns),
        data: (__VLS_ctx.toolTypes),
        loading: (__VLS_ctx.isLoading),
        bordered: (false),
        rowKey: ((row) => row.id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
}
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NDataTable: NDataTable,
            NIcon: NIcon,
            AddOutline: AddOutline,
            PageHeader: PageHeader,
            t: t,
            router: router,
            isLoading: isLoading,
            isError: isError,
            error: error,
            toolTypes: toolTypes,
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
