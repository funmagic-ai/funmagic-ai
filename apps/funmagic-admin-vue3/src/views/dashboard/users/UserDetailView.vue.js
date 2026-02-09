import { NButton, NInput, NInputNumber, NCard, NDescriptions, NDescriptionsItem, NSelect, NDataTable, NSpin, NEmpty, NIcon, NDivider, } from 'naive-ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const message = useMessage();
const queryClient = useQueryClient();
const userId = computed(() => route.params.id);
// Fetch user detail
const { data: userData, isLoading, isError, refetch, } = useQuery({
    queryKey: computed(() => ['admin', 'users', userId.value]),
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/users/{id}', {
            params: { path: { id: userId.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to fetch user');
        return data;
    },
    enabled: computed(() => !!userId.value),
});
// Role change
const roleOptions = [
    { label: 'User', value: 'user' },
    { label: 'Admin', value: 'admin' },
    { label: 'Super Admin', value: 'super_admin' },
];
const selectedRole = ref('user');
watch(() => userData.value, (data) => {
    if (data?.user) {
        selectedRole.value = data.user.role;
    }
}, { immediate: true });
const roleMutation = useMutation({
    mutationFn: async (role) => {
        const { data, error } = await api.PATCH('/api/admin/users/{id}/role', {
            params: { path: { id: userId.value } },
            body: { role },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to update role');
        return data;
    },
    onSuccess: () => {
        message.success('User role updated');
        queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId.value] });
    },
    onError: (err) => {
        message.error(err.message);
    },
});
function handleRoleChange() {
    roleMutation.mutate(selectedRole.value);
}
// Credit adjustment
const creditAmount = ref(0);
const creditDescription = ref('');
const creditMutation = useMutation({
    mutationFn: async () => {
        const { data, error } = await api.POST('/api/admin/users/{id}/credits', {
            params: { path: { id: userId.value } },
            body: {
                amount: creditAmount.value,
                description: creditDescription.value,
            },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to adjust credits');
        return data;
    },
    onSuccess: () => {
        message.success('Credits adjusted successfully');
        creditAmount.value = 0;
        creditDescription.value = '';
        queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId.value] });
    },
    onError: (err) => {
        message.error(err.message);
    },
});
function handleCreditAdjust() {
    if (!creditAmount.value) {
        message.warning('Please enter a credit amount');
        return;
    }
    if (!creditDescription.value.trim()) {
        message.warning('Please enter a description');
        return;
    }
    creditMutation.mutate();
}
// Transaction history columns
const transactionColumns = [
    {
        title: 'Type',
        key: 'type',
        width: 120,
        render(row) {
            return h(StatusBadge, { status: row.type });
        },
    },
    {
        title: 'Amount',
        key: 'amount',
        width: 100,
        render(row) {
            const isPositive = row.amount > 0;
            return h('span', { class: isPositive ? 'text-green-600 font-medium' : 'text-red-600 font-medium' }, isPositive ? `+${row.amount}` : `${row.amount}`);
        },
    },
    {
        title: 'Balance After',
        key: 'balanceAfter',
        width: 120,
    },
    {
        title: t('common.description'),
        key: 'description',
        ellipsis: { tooltip: true },
        render(row) {
            return row.description || '--';
        },
    },
    {
        title: t('common.createdAt'),
        key: 'createdAt',
        width: 160,
        render(row) {
            return new Date(row.createdAt).toLocaleString();
        },
    },
];
// Recent tasks columns
const taskColumns = [
    {
        title: t('common.id'),
        key: 'id',
        width: 100,
        ellipsis: { tooltip: true },
        render(row) {
            return row.id.substring(0, 8) + '...';
        },
    },
    {
        title: t('tasks.tool'),
        key: 'tool',
        render(row) {
            return row.tool?.title ?? '--';
        },
    },
    {
        title: t('common.status'),
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
];
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: (__VLS_ctx.userData?.user?.name ?? __VLS_ctx.userData?.user?.email ?? 'User Detail'),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.userData?.user?.name ?? __VLS_ctx.userData?.user?.email ?? 'User Detail'),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_2.slots.default;
{
    const { actions: __VLS_thisSlot } = __VLS_2.slots;
    const __VLS_3 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        ...{ 'onClick': {} },
        quaternary: true,
    }));
    const __VLS_5 = __VLS_4({
        ...{ 'onClick': {} },
        quaternary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    let __VLS_7;
    let __VLS_8;
    let __VLS_9;
    const __VLS_10 = {
        onClick: (...[$event]) => {
            __VLS_ctx.router.push({ name: 'users' });
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
        const __VLS_15 = {}.ArrowBackOutline;
        /** @type {[typeof __VLS_components.ArrowBackOutline, ]} */ ;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({}));
        const __VLS_17 = __VLS_16({}, ...__VLS_functionalComponentArgsRest(__VLS_16));
        var __VLS_14;
    }
    (__VLS_ctx.t('common.back'));
    var __VLS_6;
}
var __VLS_2;
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
    const __VLS_23 = {}.NEmpty;
    /** @type {[typeof __VLS_components.NEmpty, typeof __VLS_components.NEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
        description: "User not found or failed to load",
    }));
    const __VLS_25 = __VLS_24({
        description: "User not found or failed to load",
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    __VLS_26.slots.default;
    {
        const { extra: __VLS_thisSlot } = __VLS_26.slots;
        const __VLS_27 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
        // @ts-ignore
        const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
            ...{ 'onClick': {} },
        }));
        const __VLS_29 = __VLS_28({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_28));
        let __VLS_31;
        let __VLS_32;
        let __VLS_33;
        const __VLS_34 = {
            onClick: (() => __VLS_ctx.refetch())
        };
        __VLS_30.slots.default;
        (__VLS_ctx.t('common.retry'));
        var __VLS_30;
    }
    var __VLS_26;
}
else if (__VLS_ctx.userData?.user) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 gap-6 lg:grid-cols-2" },
    });
    const __VLS_35 = {}.NCard;
    /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.NCard, ]} */ ;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
        title: "User Information",
        size: "small",
    }));
    const __VLS_37 = __VLS_36({
        title: "User Information",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    __VLS_38.slots.default;
    const __VLS_39 = {}.NDescriptions;
    /** @type {[typeof __VLS_components.NDescriptions, typeof __VLS_components.NDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
        labelPlacement: "left",
        column: (1),
        bordered: true,
    }));
    const __VLS_41 = __VLS_40({
        labelPlacement: "left",
        column: (1),
        bordered: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_40));
    __VLS_42.slots.default;
    const __VLS_43 = {}.NDescriptionsItem;
    /** @type {[typeof __VLS_components.NDescriptionsItem, typeof __VLS_components.NDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
        label: (__VLS_ctx.t('common.id')),
    }));
    const __VLS_45 = __VLS_44({
        label: (__VLS_ctx.t('common.id')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_44));
    __VLS_46.slots.default;
    (__VLS_ctx.userData.user.id);
    var __VLS_46;
    const __VLS_47 = {}.NDescriptionsItem;
    /** @type {[typeof __VLS_components.NDescriptionsItem, typeof __VLS_components.NDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
        label: (__VLS_ctx.t('common.name')),
    }));
    const __VLS_49 = __VLS_48({
        label: (__VLS_ctx.t('common.name')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_48));
    __VLS_50.slots.default;
    (__VLS_ctx.userData.user.name ?? '--');
    var __VLS_50;
    const __VLS_51 = {}.NDescriptionsItem;
    /** @type {[typeof __VLS_components.NDescriptionsItem, typeof __VLS_components.NDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
        label: (__VLS_ctx.t('users.email')),
    }));
    const __VLS_53 = __VLS_52({
        label: (__VLS_ctx.t('users.email')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_52));
    __VLS_54.slots.default;
    (__VLS_ctx.userData.user.email);
    var __VLS_54;
    const __VLS_55 = {}.NDescriptionsItem;
    /** @type {[typeof __VLS_components.NDescriptionsItem, typeof __VLS_components.NDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({
        label: (__VLS_ctx.t('users.role')),
    }));
    const __VLS_57 = __VLS_56({
        label: (__VLS_ctx.t('users.role')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_56));
    __VLS_58.slots.default;
    (__VLS_ctx.userData.user.role);
    var __VLS_58;
    const __VLS_59 = {}.NDescriptionsItem;
    /** @type {[typeof __VLS_components.NDescriptionsItem, typeof __VLS_components.NDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
        label: "Email Verified",
    }));
    const __VLS_61 = __VLS_60({
        label: "Email Verified",
    }, ...__VLS_functionalComponentArgsRest(__VLS_60));
    __VLS_62.slots.default;
    (__VLS_ctx.userData.user.emailVerified ? 'Yes' : 'No');
    var __VLS_62;
    const __VLS_63 = {}.NDescriptionsItem;
    /** @type {[typeof __VLS_components.NDescriptionsItem, typeof __VLS_components.NDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_64 = __VLS_asFunctionalComponent(__VLS_63, new __VLS_63({
        label: (__VLS_ctx.t('common.createdAt')),
    }));
    const __VLS_65 = __VLS_64({
        label: (__VLS_ctx.t('common.createdAt')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_64));
    __VLS_66.slots.default;
    (new Date(__VLS_ctx.userData.user.createdAt).toLocaleString());
    var __VLS_66;
    var __VLS_42;
    var __VLS_38;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-col gap-6" },
    });
    const __VLS_67 = {}.NCard;
    /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.NCard, ]} */ ;
    // @ts-ignore
    const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({
        title: (__VLS_ctx.t('users.changeRole')),
        size: "small",
    }));
    const __VLS_69 = __VLS_68({
        title: (__VLS_ctx.t('users.changeRole')),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_68));
    __VLS_70.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-end gap-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-1" },
    });
    const __VLS_71 = {}.NSelect;
    /** @type {[typeof __VLS_components.NSelect, ]} */ ;
    // @ts-ignore
    const __VLS_72 = __VLS_asFunctionalComponent(__VLS_71, new __VLS_71({
        value: (__VLS_ctx.selectedRole),
        options: (__VLS_ctx.roleOptions),
    }));
    const __VLS_73 = __VLS_72({
        value: (__VLS_ctx.selectedRole),
        options: (__VLS_ctx.roleOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_72));
    const __VLS_75 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.roleMutation.isPending.value),
        disabled: (__VLS_ctx.selectedRole === __VLS_ctx.userData.user.role),
    }));
    const __VLS_77 = __VLS_76({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.roleMutation.isPending.value),
        disabled: (__VLS_ctx.selectedRole === __VLS_ctx.userData.user.role),
    }, ...__VLS_functionalComponentArgsRest(__VLS_76));
    let __VLS_79;
    let __VLS_80;
    let __VLS_81;
    const __VLS_82 = {
        onClick: (__VLS_ctx.handleRoleChange)
    };
    __VLS_78.slots.default;
    (__VLS_ctx.t('common.save'));
    var __VLS_78;
    var __VLS_70;
    const __VLS_83 = {}.NCard;
    /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.NCard, ]} */ ;
    // @ts-ignore
    const __VLS_84 = __VLS_asFunctionalComponent(__VLS_83, new __VLS_83({
        title: (__VLS_ctx.t('users.adjustCredits')),
        size: "small",
    }));
    const __VLS_85 = __VLS_84({
        title: (__VLS_ctx.t('users.adjustCredits')),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_84));
    __VLS_86.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-4 grid grid-cols-3 gap-4 text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-2xl font-bold text-foreground" },
    });
    (__VLS_ctx.userData.user.credits?.balance ?? 0);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-xs text-muted-foreground" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-2xl font-bold text-green-600" },
    });
    (__VLS_ctx.userData.user.credits?.lifetimePurchased ?? 0);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-xs text-muted-foreground" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-2xl font-bold text-red-600" },
    });
    (__VLS_ctx.userData.user.credits?.lifetimeUsed ?? 0);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-xs text-muted-foreground" },
    });
    const __VLS_87 = {}.NDivider;
    /** @type {[typeof __VLS_components.NDivider, ]} */ ;
    // @ts-ignore
    const __VLS_88 = __VLS_asFunctionalComponent(__VLS_87, new __VLS_87({
        ...{ class: "!my-3" },
    }));
    const __VLS_89 = __VLS_88({
        ...{ class: "!my-3" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_88));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-col gap-3" },
    });
    const __VLS_91 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_92 = __VLS_asFunctionalComponent(__VLS_91, new __VLS_91({
        value: (__VLS_ctx.creditAmount),
        placeholder: "Amount (positive or negative)",
        ...{ class: "w-full" },
    }));
    const __VLS_93 = __VLS_92({
        value: (__VLS_ctx.creditAmount),
        placeholder: "Amount (positive or negative)",
        ...{ class: "w-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_92));
    const __VLS_95 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_96 = __VLS_asFunctionalComponent(__VLS_95, new __VLS_95({
        value: (__VLS_ctx.creditDescription),
        placeholder: "Reason for adjustment",
    }));
    const __VLS_97 = __VLS_96({
        value: (__VLS_ctx.creditDescription),
        placeholder: "Reason for adjustment",
    }, ...__VLS_functionalComponentArgsRest(__VLS_96));
    const __VLS_99 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_100 = __VLS_asFunctionalComponent(__VLS_99, new __VLS_99({
        ...{ 'onClick': {} },
        type: "primary",
        block: true,
        loading: (__VLS_ctx.creditMutation.isPending.value),
        disabled: (!__VLS_ctx.creditAmount || !__VLS_ctx.creditDescription.trim()),
    }));
    const __VLS_101 = __VLS_100({
        ...{ 'onClick': {} },
        type: "primary",
        block: true,
        loading: (__VLS_ctx.creditMutation.isPending.value),
        disabled: (!__VLS_ctx.creditAmount || !__VLS_ctx.creditDescription.trim()),
    }, ...__VLS_functionalComponentArgsRest(__VLS_100));
    let __VLS_103;
    let __VLS_104;
    let __VLS_105;
    const __VLS_106 = {
        onClick: (__VLS_ctx.handleCreditAdjust)
    };
    __VLS_102.slots.default;
    (__VLS_ctx.t('users.adjustCredits'));
    var __VLS_102;
    var __VLS_86;
    const __VLS_107 = {}.NCard;
    /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.NCard, ]} */ ;
    // @ts-ignore
    const __VLS_108 = __VLS_asFunctionalComponent(__VLS_107, new __VLS_107({
        title: "Transaction History",
        size: "small",
        ...{ class: "mt-6" },
    }));
    const __VLS_109 = __VLS_108({
        title: "Transaction History",
        size: "small",
        ...{ class: "mt-6" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_108));
    __VLS_110.slots.default;
    if (!__VLS_ctx.userData.recentTransactions?.length) {
        const __VLS_111 = {}.NEmpty;
        /** @type {[typeof __VLS_components.NEmpty, ]} */ ;
        // @ts-ignore
        const __VLS_112 = __VLS_asFunctionalComponent(__VLS_111, new __VLS_111({
            description: (__VLS_ctx.t('common.noResults')),
            ...{ class: "py-8" },
        }));
        const __VLS_113 = __VLS_112({
            description: (__VLS_ctx.t('common.noResults')),
            ...{ class: "py-8" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_112));
    }
    else {
        const __VLS_115 = {}.NDataTable;
        /** @type {[typeof __VLS_components.NDataTable, ]} */ ;
        // @ts-ignore
        const __VLS_116 = __VLS_asFunctionalComponent(__VLS_115, new __VLS_115({
            columns: (__VLS_ctx.transactionColumns),
            data: (__VLS_ctx.userData.recentTransactions),
            bordered: (false),
            singleLine: (false),
            size: "small",
        }));
        const __VLS_117 = __VLS_116({
            columns: (__VLS_ctx.transactionColumns),
            data: (__VLS_ctx.userData.recentTransactions),
            bordered: (false),
            singleLine: (false),
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_116));
    }
    var __VLS_110;
    const __VLS_119 = {}.NCard;
    /** @type {[typeof __VLS_components.NCard, typeof __VLS_components.NCard, ]} */ ;
    // @ts-ignore
    const __VLS_120 = __VLS_asFunctionalComponent(__VLS_119, new __VLS_119({
        title: "Recent Tasks",
        size: "small",
        ...{ class: "mt-6" },
    }));
    const __VLS_121 = __VLS_120({
        title: "Recent Tasks",
        size: "small",
        ...{ class: "mt-6" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_120));
    __VLS_122.slots.default;
    if (!__VLS_ctx.userData.recentTasks?.length) {
        const __VLS_123 = {}.NEmpty;
        /** @type {[typeof __VLS_components.NEmpty, ]} */ ;
        // @ts-ignore
        const __VLS_124 = __VLS_asFunctionalComponent(__VLS_123, new __VLS_123({
            description: (__VLS_ctx.t('common.noResults')),
            ...{ class: "py-8" },
        }));
        const __VLS_125 = __VLS_124({
            description: (__VLS_ctx.t('common.noResults')),
            ...{ class: "py-8" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_124));
    }
    else {
        const __VLS_127 = {}.NDataTable;
        /** @type {[typeof __VLS_components.NDataTable, ]} */ ;
        // @ts-ignore
        const __VLS_128 = __VLS_asFunctionalComponent(__VLS_127, new __VLS_127({
            columns: (__VLS_ctx.taskColumns),
            data: (__VLS_ctx.userData.recentTasks),
            bordered: (false),
            singleLine: (false),
            size: "small",
            rowProps: ((row) => ({ style: 'cursor: pointer;', onClick: () => __VLS_ctx.router.push({ name: 'tasks-detail', params: { id: row.id } }) })),
        }));
        const __VLS_129 = __VLS_128({
            columns: (__VLS_ctx.taskColumns),
            data: (__VLS_ctx.userData.recentTasks),
            bordered: (false),
            singleLine: (false),
            size: "small",
            rowProps: ((row) => ({ style: 'cursor: pointer;', onClick: () => __VLS_ctx.router.push({ name: 'tasks-detail', params: { id: row.id } }) })),
        }, ...__VLS_functionalComponentArgsRest(__VLS_128));
    }
    var __VLS_122;
}
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['!my-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NInput: NInput,
            NInputNumber: NInputNumber,
            NCard: NCard,
            NDescriptions: NDescriptions,
            NDescriptionsItem: NDescriptionsItem,
            NSelect: NSelect,
            NDataTable: NDataTable,
            NSpin: NSpin,
            NEmpty: NEmpty,
            NIcon: NIcon,
            NDivider: NDivider,
            ArrowBackOutline: ArrowBackOutline,
            PageHeader: PageHeader,
            t: t,
            router: router,
            userData: userData,
            isLoading: isLoading,
            isError: isError,
            refetch: refetch,
            roleOptions: roleOptions,
            selectedRole: selectedRole,
            roleMutation: roleMutation,
            handleRoleChange: handleRoleChange,
            creditAmount: creditAmount,
            creditDescription: creditDescription,
            creditMutation: creditMutation,
            handleCreditAdjust: handleCreditAdjust,
            transactionColumns: transactionColumns,
            taskColumns: taskColumns,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
