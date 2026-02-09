import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import AppLayout from '@/components/layout/AppLayout.vue';
const { t } = useI18n();
const route = useRoute();
const authStore = useAuthStore();
const locale = computed(() => route.params.locale || 'en');
const transactionPage = ref(1);
const transactionLimit = 10;
// Fetch credit balance
const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: async () => {
        const { data } = await api.GET('/api/credits/balance');
        return data;
    },
});
// Fetch transactions
const { data: transactionsData, isLoading: transactionsLoading, } = useQuery({
    queryKey: ['credit-transactions', transactionPage],
    queryFn: async () => {
        const { data } = await api.GET('/api/credits/transactions', {
            params: {
                query: {
                    limit: transactionLimit,
                    offset: (transactionPage.value - 1) * transactionLimit,
                },
            },
        });
        return data;
    },
});
const transactions = computed(() => transactionsData.value?.transactions ?? []);
const transactionPagination = computed(() => transactionsData.value?.pagination);
const totalTransactionPages = computed(() => {
    if (!transactionPagination.value)
        return 1;
    return Math.ceil(transactionPagination.value.total / transactionLimit);
});
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString(locale.value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function getTransactionTypeTag(type) {
    const typeMap = {
        purchase: { type: 'success', labelKey: 'profile.types.purchase' },
        bonus: { type: 'success', labelKey: 'profile.types.bonus' },
        welcome: { type: 'success', labelKey: 'profile.types.welcome' },
        usage: { type: 'error', labelKey: 'profile.types.usage' },
        refund: { type: 'warning', labelKey: 'profile.types.refund' },
        reservation: { type: 'info', labelKey: 'profile.types.reservation' },
        release: { type: 'info', labelKey: 'profile.types.release' },
        admin_adjust: { type: 'warning', labelKey: 'profile.types.admin_adjust' },
        expiry: { type: 'error', labelKey: 'profile.types.expiry' },
    };
    return typeMap[type] || { type: 'default', labelKey: '' };
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
    ...{ class: "mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-3xl font-bold text-foreground mb-8" },
});
(__VLS_ctx.t('profile.title'));
const __VLS_4 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ class: "mb-6" },
}));
const __VLS_6 = __VLS_5({
    ...{ class: "mb-6" },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-6" },
});
const __VLS_8 = {}.NAvatar;
/** @type {[typeof __VLS_components.NAvatar, typeof __VLS_components.nAvatar, typeof __VLS_components.NAvatar, typeof __VLS_components.nAvatar, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    size: (72),
    round: true,
}));
const __VLS_10 = __VLS_9({
    size: (72),
    round: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
(__VLS_ctx.authStore.user?.name?.charAt(0)?.toUpperCase() || '?');
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-xl font-semibold text-foreground" },
});
(__VLS_ctx.authStore.user?.name || 'User');
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-muted-foreground" },
});
(__VLS_ctx.authStore.user?.email);
const __VLS_12 = {}.NTag;
/** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    type: (__VLS_ctx.authStore.isAdmin ? 'warning' : 'info'),
    size: "small",
    ...{ class: "mt-2" },
}));
const __VLS_14 = __VLS_13({
    type: (__VLS_ctx.authStore.isAdmin ? 'warning' : 'info'),
    size: "small",
    ...{ class: "mt-2" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
(__VLS_ctx.authStore.userRole);
var __VLS_15;
var __VLS_7;
const __VLS_16 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    title: (__VLS_ctx.t('profile.credits')),
    ...{ class: "mb-6" },
}));
const __VLS_18 = __VLS_17({
    title: (__VLS_ctx.t('profile.credits')),
    ...{ class: "mb-6" },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
if (__VLS_ctx.balanceLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-3" },
    });
    const __VLS_20 = {}.NSkeleton;
    /** @type {[typeof __VLS_components.NSkeleton, typeof __VLS_components.nSkeleton, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        text: true,
        repeat: (2),
    }));
    const __VLS_22 = __VLS_21({
        text: true,
        repeat: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
}
else if (__VLS_ctx.balanceData) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-2 gap-4 sm:grid-cols-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-2xl font-bold text-primary" },
    });
    (__VLS_ctx.balanceData.balance);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-xs text-muted-foreground" },
    });
    (__VLS_ctx.t('profile.totalBalance'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-2xl font-bold text-green-600" },
    });
    (__VLS_ctx.balanceData.availableBalance);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-xs text-muted-foreground" },
    });
    (__VLS_ctx.t('profile.available'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-2xl font-bold text-orange-500" },
    });
    (__VLS_ctx.balanceData.reservedBalance);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-xs text-muted-foreground" },
    });
    (__VLS_ctx.t('profile.reserved'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-2xl font-bold text-muted-foreground" },
    });
    (__VLS_ctx.balanceData.lifetimeUsed);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-xs text-muted-foreground" },
    });
    (__VLS_ctx.t('profile.lifetimeUsed'));
}
var __VLS_19;
const __VLS_24 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    title: (__VLS_ctx.t('profile.transactions')),
}));
const __VLS_26 = __VLS_25({
    title: (__VLS_ctx.t('profile.transactions')),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
if (__VLS_ctx.transactionsLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-3" },
    });
    const __VLS_28 = {}.NSkeleton;
    /** @type {[typeof __VLS_components.NSkeleton, typeof __VLS_components.nSkeleton, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        text: true,
        repeat: (5),
    }));
    const __VLS_30 = __VLS_29({
        text: true,
        repeat: (5),
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
}
else if (__VLS_ctx.transactions.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "py-8 text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-muted-foreground" },
    });
    (__VLS_ctx.t('profile.noTransactions'));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    const __VLS_32 = {}.NTable;
    /** @type {[typeof __VLS_components.NTable, typeof __VLS_components.nTable, typeof __VLS_components.NTable, typeof __VLS_components.nTable, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        bordered: (false),
        singleLine: (false),
    }));
    const __VLS_34 = __VLS_33({
        bordered: (false),
        singleLine: (false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_35.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    (__VLS_ctx.t('profile.date'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    (__VLS_ctx.t('profile.type'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    (__VLS_ctx.t('profile.amount'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    (__VLS_ctx.t('profile.balanceAfter'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    (__VLS_ctx.t('profile.description'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
    for (const [tx] of __VLS_getVForSourceType((__VLS_ctx.transactions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
            key: (tx.id),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "text-sm text-muted-foreground whitespace-nowrap" },
        });
        (__VLS_ctx.formatDate(tx.createdAt));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        const __VLS_36 = {}.NTag;
        /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            type: (__VLS_ctx.getTransactionTypeTag(tx.type).type),
            size: "small",
        }));
        const __VLS_38 = __VLS_37({
            type: (__VLS_ctx.getTransactionTypeTag(tx.type).type),
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        __VLS_39.slots.default;
        (__VLS_ctx.getTransactionTypeTag(tx.type).labelKey ? __VLS_ctx.t(__VLS_ctx.getTransactionTypeTag(tx.type).labelKey) : tx.type);
        var __VLS_39;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: (tx.amount >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium') },
        });
        (tx.amount >= 0 ? '+' : '');
        (tx.amount);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "text-sm" },
        });
        (tx.balanceAfter);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "text-sm text-muted-foreground max-w-[200px] truncate" },
        });
        (tx.description || '-');
    }
    var __VLS_35;
    if (__VLS_ctx.totalTransactionPages > 1) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mt-6 flex justify-center" },
        });
        const __VLS_40 = {}.NPagination;
        /** @type {[typeof __VLS_components.NPagination, typeof __VLS_components.nPagination, ]} */ ;
        // @ts-ignore
        const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
            page: (__VLS_ctx.transactionPage),
            pageCount: (__VLS_ctx.totalTransactionPages),
        }));
        const __VLS_42 = __VLS_41({
            page: (__VLS_ctx.transactionPage),
            pageCount: (__VLS_ctx.totalTransactionPages),
        }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    }
}
var __VLS_27;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-4xl']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-orange-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-[200px]']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            t: t,
            authStore: authStore,
            transactionPage: transactionPage,
            balanceData: balanceData,
            balanceLoading: balanceLoading,
            transactionsLoading: transactionsLoading,
            transactions: transactions,
            totalTransactionPages: totalTransactionPages,
            formatDate: formatDate,
            getTransactionTypeTag: getTransactionTypeTag,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
