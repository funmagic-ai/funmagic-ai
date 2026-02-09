import { NButton, NInput, NForm, NFormItem, NSwitch, NSelect, NIcon, NSpin, } from 'naive-ui';
import { useQuery, useMutation } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
const { t } = useI18n();
const router = useRouter();
const message = useMessage();
const formRef = ref(null);
// Fetch tool types for the select
const { data: toolTypesData, isLoading: toolTypesLoading } = useQuery({
    queryKey: ['admin', 'tool-types'],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/tool-types');
        if (error)
            throw new Error('Failed to fetch tool types');
        return data;
    },
});
const toolTypeOptions = computed(() => (toolTypesData.value?.toolTypes ?? []).map((tt) => ({
    label: tt.displayName,
    value: tt.id,
})));
// Form model
const formData = reactive({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    toolTypeId: null,
    isActive: true,
    isFeatured: false,
});
const rules = {
    title: [{ required: true, message: 'Title is required', trigger: 'blur' }],
    slug: [
        { required: true, message: 'Slug is required', trigger: 'blur' },
        {
            pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            message: 'Slug must be lowercase with hyphens only',
            trigger: 'blur',
        },
    ],
    toolTypeId: [{ required: true, message: 'Tool type is required', trigger: 'change' }],
};
// Auto-generate slug from title
watch(() => formData.title, (title) => {
    if (title) {
        formData.slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
});
// Create mutation
const createMutation = useMutation({
    mutationFn: async () => {
        const body = {
            title: formData.title,
            slug: formData.slug,
            description: formData.description || undefined,
            shortDescription: formData.shortDescription || undefined,
            toolTypeId: formData.toolTypeId,
            isActive: formData.isActive,
            isFeatured: formData.isFeatured,
            translations: {
                en: {
                    title: formData.title,
                    description: formData.description || undefined,
                    shortDescription: formData.shortDescription || undefined,
                },
            },
        };
        const { data, error } = await api.POST('/api/admin/tools', { body });
        if (error)
            throw new Error(error.error ?? 'Failed to create tool');
        return data;
    },
    onSuccess: () => {
        message.success('Tool created successfully');
        router.push({ name: 'tools' });
    },
    onError: (err) => {
        message.error(err.message);
    },
});
async function handleSubmit() {
    try {
        await formRef.value?.validate();
    }
    catch {
        return;
    }
    createMutation.mutate();
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: (__VLS_ctx.t('tools.create')),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('tools.create')),
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
            __VLS_ctx.router.push({ name: 'tools' });
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
if (__VLS_ctx.toolTypesLoading) {
    const __VLS_19 = {}.NSpin;
    /** @type {[typeof __VLS_components.NSpin, ]} */ ;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
        ...{ class: "flex justify-center py-12" },
    }));
    const __VLS_21 = __VLS_20({
        ...{ class: "flex justify-center py-12" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
}
else {
    const __VLS_23 = {}.NForm;
    /** @type {[typeof __VLS_components.NForm, typeof __VLS_components.NForm, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
        ref: "formRef",
        model: (__VLS_ctx.formData),
        rules: (__VLS_ctx.rules),
        labelPlacement: "top",
        requireMarkPlacement: "right-hanging",
    }));
    const __VLS_25 = __VLS_24({
        ref: "formRef",
        model: (__VLS_ctx.formData),
        rules: (__VLS_ctx.rules),
        labelPlacement: "top",
        requireMarkPlacement: "right-hanging",
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    /** @type {typeof __VLS_ctx.formRef} */ ;
    var __VLS_27 = {};
    __VLS_26.slots.default;
    const __VLS_29 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
        label: (__VLS_ctx.t('common.name')),
        path: "title",
    }));
    const __VLS_31 = __VLS_30({
        label: (__VLS_ctx.t('common.name')),
        path: "title",
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    __VLS_32.slots.default;
    const __VLS_33 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
        value: (__VLS_ctx.formData.title),
        placeholder: "Enter tool title",
    }));
    const __VLS_35 = __VLS_34({
        value: (__VLS_ctx.formData.title),
        placeholder: "Enter tool title",
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    var __VLS_32;
    const __VLS_37 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
        label: (__VLS_ctx.t('tools.slug')),
        path: "slug",
    }));
    const __VLS_39 = __VLS_38({
        label: (__VLS_ctx.t('tools.slug')),
        path: "slug",
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    __VLS_40.slots.default;
    const __VLS_41 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
        value: (__VLS_ctx.formData.slug),
        placeholder: "auto-generated-slug",
    }));
    const __VLS_43 = __VLS_42({
        value: (__VLS_ctx.formData.slug),
        placeholder: "auto-generated-slug",
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    var __VLS_40;
    const __VLS_45 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
        label: (__VLS_ctx.t('common.description')),
        path: "description",
    }));
    const __VLS_47 = __VLS_46({
        label: (__VLS_ctx.t('common.description')),
        path: "description",
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    __VLS_48.slots.default;
    const __VLS_49 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        value: (__VLS_ctx.formData.description),
        type: "textarea",
        rows: (3),
        placeholder: "Enter description",
    }));
    const __VLS_51 = __VLS_50({
        value: (__VLS_ctx.formData.description),
        type: "textarea",
        rows: (3),
        placeholder: "Enter description",
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    var __VLS_48;
    const __VLS_53 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
        label: "Short Description",
        path: "shortDescription",
    }));
    const __VLS_55 = __VLS_54({
        label: "Short Description",
        path: "shortDescription",
    }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    __VLS_56.slots.default;
    const __VLS_57 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
        value: (__VLS_ctx.formData.shortDescription),
        placeholder: "Brief description",
    }));
    const __VLS_59 = __VLS_58({
        value: (__VLS_ctx.formData.shortDescription),
        placeholder: "Brief description",
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    var __VLS_56;
    const __VLS_61 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
        label: (__VLS_ctx.t('tools.toolType')),
        path: "toolTypeId",
    }));
    const __VLS_63 = __VLS_62({
        label: (__VLS_ctx.t('tools.toolType')),
        path: "toolTypeId",
    }, ...__VLS_functionalComponentArgsRest(__VLS_62));
    __VLS_64.slots.default;
    const __VLS_65 = {}.NSelect;
    /** @type {[typeof __VLS_components.NSelect, ]} */ ;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
        value: (__VLS_ctx.formData.toolTypeId),
        options: (__VLS_ctx.toolTypeOptions),
        placeholder: "Select tool type",
        filterable: true,
    }));
    const __VLS_67 = __VLS_66({
        value: (__VLS_ctx.formData.toolTypeId),
        options: (__VLS_ctx.toolTypeOptions),
        placeholder: "Select tool type",
        filterable: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_66));
    var __VLS_64;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-2 gap-4" },
    });
    const __VLS_69 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
        label: (__VLS_ctx.t('common.active')),
        path: "isActive",
    }));
    const __VLS_71 = __VLS_70({
        label: (__VLS_ctx.t('common.active')),
        path: "isActive",
    }, ...__VLS_functionalComponentArgsRest(__VLS_70));
    __VLS_72.slots.default;
    const __VLS_73 = {}.NSwitch;
    /** @type {[typeof __VLS_components.NSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
        value: (__VLS_ctx.formData.isActive),
    }));
    const __VLS_75 = __VLS_74({
        value: (__VLS_ctx.formData.isActive),
    }, ...__VLS_functionalComponentArgsRest(__VLS_74));
    var __VLS_72;
    const __VLS_77 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({
        label: "Featured",
        path: "isFeatured",
    }));
    const __VLS_79 = __VLS_78({
        label: "Featured",
        path: "isFeatured",
    }, ...__VLS_functionalComponentArgsRest(__VLS_78));
    __VLS_80.slots.default;
    const __VLS_81 = {}.NSwitch;
    /** @type {[typeof __VLS_components.NSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
        value: (__VLS_ctx.formData.isFeatured),
    }));
    const __VLS_83 = __VLS_82({
        value: (__VLS_ctx.formData.isFeatured),
    }, ...__VLS_functionalComponentArgsRest(__VLS_82));
    var __VLS_80;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-end gap-2 pt-4" },
    });
    const __VLS_85 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
        ...{ 'onClick': {} },
    }));
    const __VLS_87 = __VLS_86({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_86));
    let __VLS_89;
    let __VLS_90;
    let __VLS_91;
    const __VLS_92 = {
        onClick: (...[$event]) => {
            if (!!(__VLS_ctx.toolTypesLoading))
                return;
            __VLS_ctx.router.push({ name: 'tools' });
        }
    };
    __VLS_88.slots.default;
    (__VLS_ctx.t('common.cancel'));
    var __VLS_88;
    const __VLS_93 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.createMutation.isPending.value),
        disabled: (__VLS_ctx.createMutation.isPending.value),
    }));
    const __VLS_95 = __VLS_94({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.createMutation.isPending.value),
        disabled: (__VLS_ctx.createMutation.isPending.value),
    }, ...__VLS_functionalComponentArgsRest(__VLS_94));
    let __VLS_97;
    let __VLS_98;
    let __VLS_99;
    const __VLS_100 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_96.slots.default;
    (__VLS_ctx.t('common.create'));
    var __VLS_96;
    var __VLS_26;
}
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
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
// @ts-ignore
var __VLS_28 = __VLS_27;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NInput: NInput,
            NForm: NForm,
            NFormItem: NFormItem,
            NSwitch: NSwitch,
            NSelect: NSelect,
            NIcon: NIcon,
            NSpin: NSpin,
            ArrowBackOutline: ArrowBackOutline,
            PageHeader: PageHeader,
            t: t,
            router: router,
            formRef: formRef,
            toolTypesLoading: toolTypesLoading,
            toolTypeOptions: toolTypeOptions,
            formData: formData,
            rules: rules,
            createMutation: createMutation,
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
