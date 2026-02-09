import { NButton, NInput, NForm, NFormItem, NSwitch, NSelect, NIcon, NSpin, NEmpty, } from 'naive-ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { ArrowBackOutline, TrashOutline } from '@vicons/ionicons5';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue';
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const message = useMessage();
const queryClient = useQueryClient();
const toolId = computed(() => route.params.id);
const formRef = ref(null);
const showDeleteDialog = ref(false);
// Fetch tool detail
const { data: toolData, isLoading, isError, refetch, } = useQuery({
    queryKey: computed(() => ['admin', 'tools', toolId.value]),
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/tools/{id}', {
            params: { path: { id: toolId.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to fetch tool');
        return data;
    },
    enabled: computed(() => !!toolId.value),
});
// Fetch tool types for the select
const { data: toolTypesData } = useQuery({
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
// Populate form when data arrives
watch(() => toolData.value, (tool) => {
    if (tool?.tool) {
        formData.title = tool.tool.title;
        formData.slug = tool.tool.slug;
        formData.description = tool.tool.description ?? '';
        formData.shortDescription = tool.tool.shortDescription ?? '';
        formData.toolTypeId = tool.tool.toolTypeId;
        formData.isActive = tool.tool.isActive;
        formData.isFeatured = tool.tool.isFeatured;
    }
}, { immediate: true });
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
// Update mutation
const updateMutation = useMutation({
    mutationFn: async () => {
        const body = {
            title: formData.title,
            slug: formData.slug,
            description: formData.description || undefined,
            shortDescription: formData.shortDescription || undefined,
            toolTypeId: formData.toolTypeId ?? undefined,
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
        const { data, error } = await api.PUT('/api/admin/tools/{id}', {
            params: { path: { id: toolId.value } },
            body,
        });
        if (error)
            throw new Error(error.error ?? 'Failed to update tool');
        return data;
    },
    onSuccess: () => {
        message.success('Tool updated successfully');
        queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] });
    },
    onError: (err) => {
        message.error(err.message);
    },
});
// Delete mutation
const deleteMutation = useMutation({
    mutationFn: async () => {
        const { error } = await api.DELETE('/api/admin/tools/{id}', {
            params: { path: { id: toolId.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to delete tool');
    },
    onSuccess: () => {
        message.success('Tool deleted successfully');
        showDeleteDialog.value = false;
        queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] });
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
    updateMutation.mutate();
}
function confirmDelete() {
    deleteMutation.mutate();
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: (__VLS_ctx.t('tools.editTool')),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('tools.editTool')),
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
    const __VLS_19 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
        ...{ 'onClick': {} },
        type: "error",
        ghost: true,
    }));
    const __VLS_21 = __VLS_20({
        ...{ 'onClick': {} },
        type: "error",
        ghost: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    let __VLS_23;
    let __VLS_24;
    let __VLS_25;
    const __VLS_26 = {
        onClick: (...[$event]) => {
            __VLS_ctx.showDeleteDialog = true;
        }
    };
    __VLS_22.slots.default;
    {
        const { icon: __VLS_thisSlot } = __VLS_22.slots;
        const __VLS_27 = {}.NIcon;
        /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
        // @ts-ignore
        const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({}));
        const __VLS_29 = __VLS_28({}, ...__VLS_functionalComponentArgsRest(__VLS_28));
        __VLS_30.slots.default;
        const __VLS_31 = {}.TrashOutline;
        /** @type {[typeof __VLS_components.TrashOutline, ]} */ ;
        // @ts-ignore
        const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({}));
        const __VLS_33 = __VLS_32({}, ...__VLS_functionalComponentArgsRest(__VLS_32));
        var __VLS_30;
    }
    (__VLS_ctx.t('common.delete'));
    var __VLS_22;
}
var __VLS_2;
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-center py-12" },
    });
    const __VLS_35 = {}.NSpin;
    /** @type {[typeof __VLS_components.NSpin, ]} */ ;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
        size: "large",
    }));
    const __VLS_37 = __VLS_36({
        size: "large",
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
}
else if (__VLS_ctx.isError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "py-12 text-center" },
    });
    const __VLS_39 = {}.NEmpty;
    /** @type {[typeof __VLS_components.NEmpty, typeof __VLS_components.NEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
        description: "Tool not found or failed to load",
    }));
    const __VLS_41 = __VLS_40({
        description: "Tool not found or failed to load",
    }, ...__VLS_functionalComponentArgsRest(__VLS_40));
    __VLS_42.slots.default;
    {
        const { extra: __VLS_thisSlot } = __VLS_42.slots;
        const __VLS_43 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
        // @ts-ignore
        const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
            ...{ 'onClick': {} },
        }));
        const __VLS_45 = __VLS_44({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_44));
        let __VLS_47;
        let __VLS_48;
        let __VLS_49;
        const __VLS_50 = {
            onClick: (() => __VLS_ctx.refetch())
        };
        __VLS_46.slots.default;
        (__VLS_ctx.t('common.retry'));
        var __VLS_46;
    }
    var __VLS_42;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mx-auto max-w-2xl rounded-xl border bg-card py-6 shadow-sm" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "px-6" },
    });
    const __VLS_51 = {}.NForm;
    /** @type {[typeof __VLS_components.NForm, typeof __VLS_components.NForm, ]} */ ;
    // @ts-ignore
    const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
        ref: "formRef",
        model: (__VLS_ctx.formData),
        rules: (__VLS_ctx.rules),
        labelPlacement: "top",
        requireMarkPlacement: "right-hanging",
    }));
    const __VLS_53 = __VLS_52({
        ref: "formRef",
        model: (__VLS_ctx.formData),
        rules: (__VLS_ctx.rules),
        labelPlacement: "top",
        requireMarkPlacement: "right-hanging",
    }, ...__VLS_functionalComponentArgsRest(__VLS_52));
    /** @type {typeof __VLS_ctx.formRef} */ ;
    var __VLS_55 = {};
    __VLS_54.slots.default;
    const __VLS_57 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
        label: (__VLS_ctx.t('common.name')),
        path: "title",
    }));
    const __VLS_59 = __VLS_58({
        label: (__VLS_ctx.t('common.name')),
        path: "title",
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    __VLS_60.slots.default;
    const __VLS_61 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
        value: (__VLS_ctx.formData.title),
        placeholder: "Enter tool title",
    }));
    const __VLS_63 = __VLS_62({
        value: (__VLS_ctx.formData.title),
        placeholder: "Enter tool title",
    }, ...__VLS_functionalComponentArgsRest(__VLS_62));
    var __VLS_60;
    const __VLS_65 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
        label: (__VLS_ctx.t('tools.slug')),
        path: "slug",
    }));
    const __VLS_67 = __VLS_66({
        label: (__VLS_ctx.t('tools.slug')),
        path: "slug",
    }, ...__VLS_functionalComponentArgsRest(__VLS_66));
    __VLS_68.slots.default;
    const __VLS_69 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
        value: (__VLS_ctx.formData.slug),
        placeholder: "tool-slug",
    }));
    const __VLS_71 = __VLS_70({
        value: (__VLS_ctx.formData.slug),
        placeholder: "tool-slug",
    }, ...__VLS_functionalComponentArgsRest(__VLS_70));
    var __VLS_68;
    const __VLS_73 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
        label: (__VLS_ctx.t('common.description')),
        path: "description",
    }));
    const __VLS_75 = __VLS_74({
        label: (__VLS_ctx.t('common.description')),
        path: "description",
    }, ...__VLS_functionalComponentArgsRest(__VLS_74));
    __VLS_76.slots.default;
    const __VLS_77 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({
        value: (__VLS_ctx.formData.description),
        type: "textarea",
        rows: (3),
        placeholder: "Enter description",
    }));
    const __VLS_79 = __VLS_78({
        value: (__VLS_ctx.formData.description),
        type: "textarea",
        rows: (3),
        placeholder: "Enter description",
    }, ...__VLS_functionalComponentArgsRest(__VLS_78));
    var __VLS_76;
    const __VLS_81 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
        label: "Short Description",
        path: "shortDescription",
    }));
    const __VLS_83 = __VLS_82({
        label: "Short Description",
        path: "shortDescription",
    }, ...__VLS_functionalComponentArgsRest(__VLS_82));
    __VLS_84.slots.default;
    const __VLS_85 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
        value: (__VLS_ctx.formData.shortDescription),
        placeholder: "Brief description",
    }));
    const __VLS_87 = __VLS_86({
        value: (__VLS_ctx.formData.shortDescription),
        placeholder: "Brief description",
    }, ...__VLS_functionalComponentArgsRest(__VLS_86));
    var __VLS_84;
    const __VLS_89 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_90 = __VLS_asFunctionalComponent(__VLS_89, new __VLS_89({
        label: (__VLS_ctx.t('tools.toolType')),
        path: "toolTypeId",
    }));
    const __VLS_91 = __VLS_90({
        label: (__VLS_ctx.t('tools.toolType')),
        path: "toolTypeId",
    }, ...__VLS_functionalComponentArgsRest(__VLS_90));
    __VLS_92.slots.default;
    const __VLS_93 = {}.NSelect;
    /** @type {[typeof __VLS_components.NSelect, ]} */ ;
    // @ts-ignore
    const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
        value: (__VLS_ctx.formData.toolTypeId),
        options: (__VLS_ctx.toolTypeOptions),
        placeholder: "Select tool type",
        filterable: true,
    }));
    const __VLS_95 = __VLS_94({
        value: (__VLS_ctx.formData.toolTypeId),
        options: (__VLS_ctx.toolTypeOptions),
        placeholder: "Select tool type",
        filterable: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_94));
    var __VLS_92;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-2 gap-4" },
    });
    const __VLS_97 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({
        label: (__VLS_ctx.t('common.active')),
        path: "isActive",
    }));
    const __VLS_99 = __VLS_98({
        label: (__VLS_ctx.t('common.active')),
        path: "isActive",
    }, ...__VLS_functionalComponentArgsRest(__VLS_98));
    __VLS_100.slots.default;
    const __VLS_101 = {}.NSwitch;
    /** @type {[typeof __VLS_components.NSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_102 = __VLS_asFunctionalComponent(__VLS_101, new __VLS_101({
        value: (__VLS_ctx.formData.isActive),
    }));
    const __VLS_103 = __VLS_102({
        value: (__VLS_ctx.formData.isActive),
    }, ...__VLS_functionalComponentArgsRest(__VLS_102));
    var __VLS_100;
    const __VLS_105 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_106 = __VLS_asFunctionalComponent(__VLS_105, new __VLS_105({
        label: "Featured",
        path: "isFeatured",
    }));
    const __VLS_107 = __VLS_106({
        label: "Featured",
        path: "isFeatured",
    }, ...__VLS_functionalComponentArgsRest(__VLS_106));
    __VLS_108.slots.default;
    const __VLS_109 = {}.NSwitch;
    /** @type {[typeof __VLS_components.NSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_110 = __VLS_asFunctionalComponent(__VLS_109, new __VLS_109({
        value: (__VLS_ctx.formData.isFeatured),
    }));
    const __VLS_111 = __VLS_110({
        value: (__VLS_ctx.formData.isFeatured),
    }, ...__VLS_functionalComponentArgsRest(__VLS_110));
    var __VLS_108;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-end gap-2 pt-4" },
    });
    const __VLS_113 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_114 = __VLS_asFunctionalComponent(__VLS_113, new __VLS_113({
        ...{ 'onClick': {} },
    }));
    const __VLS_115 = __VLS_114({
        ...{ 'onClick': {} },
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
            __VLS_ctx.router.push({ name: 'tools' });
        }
    };
    __VLS_116.slots.default;
    (__VLS_ctx.t('common.cancel'));
    var __VLS_116;
    const __VLS_121 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_122 = __VLS_asFunctionalComponent(__VLS_121, new __VLS_121({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.updateMutation.isPending.value),
        disabled: (__VLS_ctx.updateMutation.isPending.value),
    }));
    const __VLS_123 = __VLS_122({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.updateMutation.isPending.value),
        disabled: (__VLS_ctx.updateMutation.isPending.value),
    }, ...__VLS_functionalComponentArgsRest(__VLS_122));
    let __VLS_125;
    let __VLS_126;
    let __VLS_127;
    const __VLS_128 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_124.slots.default;
    (__VLS_ctx.t('common.save'));
    var __VLS_124;
    var __VLS_54;
}
/** @type {[typeof DeleteConfirmDialog, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(DeleteConfirmDialog, new DeleteConfirmDialog({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: (`Delete &quot;${__VLS_ctx.toolData?.tool?.title ?? ''}&quot;?`),
    message: (__VLS_ctx.t('tools.deleteConfirm')),
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}));
const __VLS_130 = __VLS_129({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: (`Delete &quot;${__VLS_ctx.toolData?.tool?.title ?? ''}&quot;?`),
    message: (__VLS_ctx.t('tools.deleteConfirm')),
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
let __VLS_132;
let __VLS_133;
let __VLS_134;
const __VLS_135 = {
    onConfirm: (__VLS_ctx.confirmDelete)
};
var __VLS_131;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['py-6']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
// @ts-ignore
var __VLS_56 = __VLS_55;
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
            NEmpty: NEmpty,
            ArrowBackOutline: ArrowBackOutline,
            TrashOutline: TrashOutline,
            PageHeader: PageHeader,
            DeleteConfirmDialog: DeleteConfirmDialog,
            t: t,
            router: router,
            formRef: formRef,
            showDeleteDialog: showDeleteDialog,
            toolData: toolData,
            isLoading: isLoading,
            isError: isError,
            refetch: refetch,
            toolTypeOptions: toolTypeOptions,
            formData: formData,
            rules: rules,
            updateMutation: updateMutation,
            deleteMutation: deleteMutation,
            handleSubmit: handleSubmit,
            confirmDelete: confirmDelete,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
