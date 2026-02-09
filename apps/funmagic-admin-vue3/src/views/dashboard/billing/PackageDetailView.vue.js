import { NButton, NForm, NFormItem, NInput, NInputNumber, NIcon, NSwitch, NSelect, NSpin } from 'naive-ui';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue';
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const message = useMessage();
const queryClient = useQueryClient();
const id = computed(() => route.params.id);
const formRef = ref(null);
const showDeleteDialog = ref(false);
const formValue = ref({
    name: '',
    description: '',
    credits: 100,
    bonusCredits: 0,
    price: 9.99,
    currency: 'usd',
    isPopular: false,
    isActive: true,
    sortOrder: 0,
});
const rules = {
    name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
    credits: [{ required: true, type: 'number', message: 'Credits is required', trigger: 'blur' }],
    price: [{ required: true, type: 'number', message: 'Price is required', trigger: 'blur' }],
};
const currencyOptions = [
    { label: 'USD', value: 'usd' },
    { label: 'EUR', value: 'eur' },
    { label: 'GBP', value: 'gbp' },
    { label: 'CNY', value: 'cny' },
    { label: 'JPY', value: 'jpy' },
];
const { isLoading, isError, error } = useQuery({
    queryKey: ['packages', id],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/packages/{id}', {
            params: { path: { id: id.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to fetch package');
        return data;
    },
    select: (data) => {
        const pkg = data.package;
        formValue.value = {
            name: pkg.name,
            description: pkg.description ?? '',
            credits: pkg.credits,
            bonusCredits: pkg.bonusCredits,
            price: parseFloat(pkg.price),
            currency: pkg.currency,
            isPopular: pkg.isPopular,
            isActive: pkg.isActive,
            sortOrder: pkg.sortOrder,
        };
        return pkg;
    },
});
const updateMutation = useMutation({
    mutationFn: async () => {
        const { data, error } = await api.PUT('/api/admin/packages/{id}', {
            params: { path: { id: id.value } },
            body: {
                name: formValue.value.name,
                description: formValue.value.description || undefined,
                credits: formValue.value.credits,
                bonusCredits: formValue.value.bonusCredits,
                price: formValue.value.price,
                currency: formValue.value.currency,
                isPopular: formValue.value.isPopular,
                isActive: formValue.value.isActive,
                sortOrder: formValue.value.sortOrder,
            },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to update package');
        return data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['packages'] });
        message.success('Package updated successfully');
        router.push({ name: 'packages' });
    },
    onError: (err) => {
        message.error(err.message);
    },
});
const deleteMutation = useMutation({
    mutationFn: async () => {
        const { error } = await api.DELETE('/api/admin/packages/{id}', {
            params: { path: { id: id.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to delete package');
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['packages'] });
        message.success('Package deleted successfully');
        router.push({ name: 'packages' });
    },
    onError: (err) => {
        message.error(err.message);
        showDeleteDialog.value = false;
    },
});
async function handleSubmit() {
    try {
        await formRef.value?.validate();
        updateMutation.mutate();
    }
    catch {
        // validation failed
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: (__VLS_ctx.t('common.edit') + ' Package'),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('common.edit') + ' Package'),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_2.slots.default;
{
    const { actions: __VLS_thisSlot } = __VLS_2.slots;
    const __VLS_3 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        ...{ 'onClick': {} },
    }));
    const __VLS_5 = __VLS_4({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    let __VLS_7;
    let __VLS_8;
    let __VLS_9;
    const __VLS_10 = {
        onClick: (...[$event]) => {
            __VLS_ctx.router.push({ name: 'packages' });
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mx-auto max-w-2xl rounded-xl border bg-card py-6 shadow-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "px-6" },
});
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
        ...{ class: "py-8 text-center text-destructive" },
    });
    (__VLS_ctx.error?.message || __VLS_ctx.t('common.error'));
}
else {
    const __VLS_23 = {}.NForm;
    /** @type {[typeof __VLS_components.NForm, typeof __VLS_components.NForm, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
        ref: "formRef",
        model: (__VLS_ctx.formValue),
        rules: (__VLS_ctx.rules),
        labelPlacement: "left",
        labelWidth: "140",
    }));
    const __VLS_25 = __VLS_24({
        ref: "formRef",
        model: (__VLS_ctx.formValue),
        rules: (__VLS_ctx.rules),
        labelPlacement: "left",
        labelWidth: "140",
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    /** @type {typeof __VLS_ctx.formRef} */ ;
    var __VLS_27 = {};
    __VLS_26.slots.default;
    const __VLS_29 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
        label: (__VLS_ctx.t('common.name')),
        path: "name",
    }));
    const __VLS_31 = __VLS_30({
        label: (__VLS_ctx.t('common.name')),
        path: "name",
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    __VLS_32.slots.default;
    const __VLS_33 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
        value: (__VLS_ctx.formValue.name),
        placeholder: "e.g. Starter Pack",
    }));
    const __VLS_35 = __VLS_34({
        value: (__VLS_ctx.formValue.name),
        placeholder: "e.g. Starter Pack",
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    var __VLS_32;
    const __VLS_37 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
        label: (__VLS_ctx.t('common.description')),
    }));
    const __VLS_39 = __VLS_38({
        label: (__VLS_ctx.t('common.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    __VLS_40.slots.default;
    const __VLS_41 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
        value: (__VLS_ctx.formValue.description),
        type: "textarea",
        rows: (3),
        placeholder: "Optional description",
    }));
    const __VLS_43 = __VLS_42({
        value: (__VLS_ctx.formValue.description),
        type: "textarea",
        rows: (3),
        placeholder: "Optional description",
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    var __VLS_40;
    const __VLS_45 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
        label: (__VLS_ctx.t('billing.credits')),
        path: "credits",
    }));
    const __VLS_47 = __VLS_46({
        label: (__VLS_ctx.t('billing.credits')),
        path: "credits",
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    __VLS_48.slots.default;
    const __VLS_49 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        value: (__VLS_ctx.formValue.credits),
        min: (1),
        ...{ class: "w-full" },
    }));
    const __VLS_51 = __VLS_50({
        value: (__VLS_ctx.formValue.credits),
        min: (1),
        ...{ class: "w-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    var __VLS_48;
    const __VLS_53 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
        label: "Bonus Credits",
    }));
    const __VLS_55 = __VLS_54({
        label: "Bonus Credits",
    }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    __VLS_56.slots.default;
    const __VLS_57 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
        value: (__VLS_ctx.formValue.bonusCredits),
        min: (0),
        ...{ class: "w-full" },
    }));
    const __VLS_59 = __VLS_58({
        value: (__VLS_ctx.formValue.bonusCredits),
        min: (0),
        ...{ class: "w-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    var __VLS_56;
    const __VLS_61 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
        label: (__VLS_ctx.t('billing.price')),
        path: "price",
    }));
    const __VLS_63 = __VLS_62({
        label: (__VLS_ctx.t('billing.price')),
        path: "price",
    }, ...__VLS_functionalComponentArgsRest(__VLS_62));
    __VLS_64.slots.default;
    const __VLS_65 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
        value: (__VLS_ctx.formValue.price),
        min: (0),
        precision: (2),
        ...{ class: "w-full" },
    }));
    const __VLS_67 = __VLS_66({
        value: (__VLS_ctx.formValue.price),
        min: (0),
        precision: (2),
        ...{ class: "w-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_66));
    var __VLS_64;
    const __VLS_69 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
        label: (__VLS_ctx.t('billing.currency')),
    }));
    const __VLS_71 = __VLS_70({
        label: (__VLS_ctx.t('billing.currency')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_70));
    __VLS_72.slots.default;
    const __VLS_73 = {}.NSelect;
    /** @type {[typeof __VLS_components.NSelect, ]} */ ;
    // @ts-ignore
    const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
        value: (__VLS_ctx.formValue.currency),
        options: (__VLS_ctx.currencyOptions),
    }));
    const __VLS_75 = __VLS_74({
        value: (__VLS_ctx.formValue.currency),
        options: (__VLS_ctx.currencyOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_74));
    var __VLS_72;
    const __VLS_77 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({
        label: "Popular",
    }));
    const __VLS_79 = __VLS_78({
        label: "Popular",
    }, ...__VLS_functionalComponentArgsRest(__VLS_78));
    __VLS_80.slots.default;
    const __VLS_81 = {}.NSwitch;
    /** @type {[typeof __VLS_components.NSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
        value: (__VLS_ctx.formValue.isPopular),
    }));
    const __VLS_83 = __VLS_82({
        value: (__VLS_ctx.formValue.isPopular),
    }, ...__VLS_functionalComponentArgsRest(__VLS_82));
    var __VLS_80;
    const __VLS_85 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
        label: "Active",
    }));
    const __VLS_87 = __VLS_86({
        label: "Active",
    }, ...__VLS_functionalComponentArgsRest(__VLS_86));
    __VLS_88.slots.default;
    const __VLS_89 = {}.NSwitch;
    /** @type {[typeof __VLS_components.NSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_90 = __VLS_asFunctionalComponent(__VLS_89, new __VLS_89({
        value: (__VLS_ctx.formValue.isActive),
    }));
    const __VLS_91 = __VLS_90({
        value: (__VLS_ctx.formValue.isActive),
    }, ...__VLS_functionalComponentArgsRest(__VLS_90));
    var __VLS_88;
    const __VLS_93 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
        label: "Sort Order",
    }));
    const __VLS_95 = __VLS_94({
        label: "Sort Order",
    }, ...__VLS_functionalComponentArgsRest(__VLS_94));
    __VLS_96.slots.default;
    const __VLS_97 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({
        value: (__VLS_ctx.formValue.sortOrder),
        min: (0),
        ...{ class: "w-full" },
    }));
    const __VLS_99 = __VLS_98({
        value: (__VLS_ctx.formValue.sortOrder),
        min: (0),
        ...{ class: "w-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_98));
    var __VLS_96;
    const __VLS_101 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_102 = __VLS_asFunctionalComponent(__VLS_101, new __VLS_101({}));
    const __VLS_103 = __VLS_102({}, ...__VLS_functionalComponentArgsRest(__VLS_102));
    __VLS_104.slots.default;
    const __VLS_105 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_106 = __VLS_asFunctionalComponent(__VLS_105, new __VLS_105({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.updateMutation.isPending.value),
        ...{ class: "mr-3" },
    }));
    const __VLS_107 = __VLS_106({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.updateMutation.isPending.value),
        ...{ class: "mr-3" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_106));
    let __VLS_109;
    let __VLS_110;
    let __VLS_111;
    const __VLS_112 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_108.slots.default;
    (__VLS_ctx.t('common.save'));
    var __VLS_108;
    const __VLS_113 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_114 = __VLS_asFunctionalComponent(__VLS_113, new __VLS_113({
        ...{ 'onClick': {} },
        type: "error",
        ghost: true,
    }));
    const __VLS_115 = __VLS_114({
        ...{ 'onClick': {} },
        type: "error",
        ghost: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_114));
    let __VLS_117;
    let __VLS_118;
    let __VLS_119;
    const __VLS_120 = {
        onClick: (...[$event]) => {
            if (!!(__VLS_ctx.isLoading))
                return;
            if (!!(__VLS_ctx.isError))
                return;
            __VLS_ctx.showDeleteDialog = true;
        }
    };
    __VLS_116.slots.default;
    (__VLS_ctx.t('common.delete'));
    var __VLS_116;
    var __VLS_104;
    var __VLS_26;
}
/** @type {[typeof DeleteConfirmDialog, ]} */ ;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent(DeleteConfirmDialog, new DeleteConfirmDialog({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: "Delete Package",
    message: "Are you sure you want to delete this credit package? This action cannot be undone.",
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}));
const __VLS_122 = __VLS_121({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: "Delete Package",
    message: "Are you sure you want to delete this credit package? This action cannot be undone.",
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
let __VLS_124;
let __VLS_125;
let __VLS_126;
const __VLS_127 = {
    onConfirm: (...[$event]) => {
        __VLS_ctx.deleteMutation.mutate();
    }
};
var __VLS_123;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['py-6']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-3']} */ ;
// @ts-ignore
var __VLS_28 = __VLS_27;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NForm: NForm,
            NFormItem: NFormItem,
            NInput: NInput,
            NInputNumber: NInputNumber,
            NIcon: NIcon,
            NSwitch: NSwitch,
            NSelect: NSelect,
            NSpin: NSpin,
            ArrowBackOutline: ArrowBackOutline,
            PageHeader: PageHeader,
            DeleteConfirmDialog: DeleteConfirmDialog,
            t: t,
            router: router,
            formRef: formRef,
            showDeleteDialog: showDeleteDialog,
            formValue: formValue,
            rules: rules,
            currencyOptions: currencyOptions,
            isLoading: isLoading,
            isError: isError,
            error: error,
            updateMutation: updateMutation,
            deleteMutation: deleteMutation,
            handleSubmit: handleSubmit,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
