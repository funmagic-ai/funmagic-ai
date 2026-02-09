import { NButton, NIcon, NEmpty } from 'naive-ui';
import { EyeOutline } from '@vicons/ionicons5';
import { useQuery } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
const { t } = useI18n();
const router = useRouter();
// Admin tasks uses the same user listing endpoint to get all users' tasks
// Since there's no dedicated /api/admin/admin-tasks endpoint, we use
// /api/admin/users and aggregate tasks from user details
const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/users', {
            params: { query: { limit: '100' } },
        });
        if (error)
            throw new Error('Failed to fetch users');
        return data;
    },
});
// We show a placeholder since there's no dedicated admin-tasks list API
const hasApi = computed(() => false);
const tasks = ref([]);
const columns = computed(() => [
    {
        title: t('tasks.taskId'),
        key: 'id',
        width: 140,
        ellipsis: { tooltip: true },
    },
    {
        title: t('tasks.user'),
        key: 'userId',
        ellipsis: { tooltip: true },
    },
    {
        title: t('tasks.tool'),
        key: 'tool',
        ellipsis: { tooltip: true },
        render: (row) => row.tool?.title || '-',
    },
    {
        title: t('tasks.status'),
        key: 'status',
        width: 120,
        render: (row) => h(StatusBadge, { status: row.status }),
    },
    {
        title: 'Credits',
        key: 'creditsCost',
        width: 100,
    },
    {
        title: t('common.createdAt'),
        key: 'createdAt',
        width: 180,
        render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
        title: t('common.actions'),
        key: 'actions',
        width: 100,
        render: (row) => {
            return h(NButton, {
                size: 'small',
                quaternary: true,
                onClick: () => router.push({ name: 'admin-tasks-detail', params: { id: row.id } }),
            }, {
                icon: () => h(NIcon, null, { default: () => h(EyeOutline) }),
                default: () => 'View',
            });
        },
    },
]);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: (__VLS_ctx.t('nav.adminTasks')),
    description: "View and manage system-wide tasks",
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('nav.adminTasks')),
    description: "View and manage system-wide tasks",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rounded-lg border border-dashed p-8 text-center md:p-12" },
});
const __VLS_3 = {}.NEmpty;
/** @type {[typeof __VLS_components.NEmpty, typeof __VLS_components.NEmpty, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
    description: "Admin Tasks API is not yet available. Tasks can be viewed from individual user detail pages.",
}));
const __VLS_5 = __VLS_4({
    description: "Admin Tasks API is not yet available. Tasks can be viewed from individual user detail pages.",
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
__VLS_6.slots.default;
{
    const { extra: __VLS_thisSlot } = __VLS_6.slots;
    const __VLS_7 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_11;
    let __VLS_12;
    let __VLS_13;
    const __VLS_14 = {
        onClick: (...[$event]) => {
            __VLS_ctx.router.push({ name: 'users' });
        }
    };
    __VLS_10.slots.default;
    var __VLS_10;
}
var __VLS_6;
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
            NButton: NButton,
            NEmpty: NEmpty,
            PageHeader: PageHeader,
            t: t,
            router: router,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
