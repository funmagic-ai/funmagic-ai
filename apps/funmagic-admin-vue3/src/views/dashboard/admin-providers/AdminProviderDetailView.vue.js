import { NButton, NForm, NFormItem, NInput, NIcon, NSwitch, NSpin, NTag } from 'naive-ui';
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
    displayName: '',
    description: '',
    apiKey: '',
    apiSecret: '',
    baseUrl: '',
    isActive: true,
});
const rules = {
    name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
    displayName: [{ required: true, message: 'Display name is required', trigger: 'blur' }],
};
const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-providers', id],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/admin-providers/{id}', {
            params: { path: { id: id.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to fetch admin provider');
        return data;
    },
    select: (data) => {
        const p = data.provider;
        formValue.value = {
            name: p.name,
            displayName: p.displayName,
            description: p.description ?? '',
            apiKey: '',
            apiSecret: '',
            baseUrl: p.baseUrl ?? '',
            isActive: p.isActive,
        };
        return p;
    },
});
const updateMutation = useMutation({
    mutationFn: async () => {
        const body = {
            name: formValue.value.name,
            displayName: formValue.value.displayName,
            isActive: formValue.value.isActive,
        };
        if (formValue.value.description)
            body.description = formValue.value.description;
        if (formValue.value.apiKey)
            body.apiKey = formValue.value.apiKey;
        if (formValue.value.apiSecret)
            body.apiSecret = formValue.value.apiSecret;
        if (formValue.value.baseUrl)
            body.baseUrl = formValue.value.baseUrl;
        const { data, error } = await api.PUT('/api/admin/admin-providers/{id}', {
            params: { path: { id: id.value } },
            body: body,
        });
        if (error)
            throw new Error(error.error ?? 'Failed to update admin provider');
        return data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
        message.success('Admin provider updated successfully');
        router.push({ name: 'admin-providers' });
    },
    onError: (err) => {
        message.error(err.message);
    },
});
const deleteMutation = useMutation({
    mutationFn: async () => {
        const { error } = await api.DELETE('/api/admin/admin-providers/{id}', {
            params: { path: { id: id.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to delete admin provider');
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
        message.success('Admin provider deleted successfully');
        router.push({ name: 'admin-providers' });
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
    title: ('Edit ' + __VLS_ctx.t('nav.adminProviders')),
}));
const __VLS_1 = __VLS_0({
    title: ('Edit ' + __VLS_ctx.t('nav.adminProviders')),
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
            __VLS_ctx.router.push({ name: 'admin-providers' });
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
    if (__VLS_ctx.data) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mb-4 flex items-center gap-2" },
        });
        if (__VLS_ctx.data.hasApiKey) {
            const __VLS_23 = {}.NTag;
            /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.NTag, ]} */ ;
            // @ts-ignore
            const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
                type: "success",
                size: "small",
            }));
            const __VLS_25 = __VLS_24({
                type: "success",
                size: "small",
            }, ...__VLS_functionalComponentArgsRest(__VLS_24));
            __VLS_26.slots.default;
            var __VLS_26;
        }
        else {
            const __VLS_27 = {}.NTag;
            /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.NTag, ]} */ ;
            // @ts-ignore
            const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
                type: "warning",
                size: "small",
            }));
            const __VLS_29 = __VLS_28({
                type: "warning",
                size: "small",
            }, ...__VLS_functionalComponentArgsRest(__VLS_28));
            __VLS_30.slots.default;
            var __VLS_30;
        }
        if (__VLS_ctx.data.hasApiSecret) {
            const __VLS_31 = {}.NTag;
            /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.NTag, ]} */ ;
            // @ts-ignore
            const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
                type: "success",
                size: "small",
            }));
            const __VLS_33 = __VLS_32({
                type: "success",
                size: "small",
            }, ...__VLS_functionalComponentArgsRest(__VLS_32));
            __VLS_34.slots.default;
            var __VLS_34;
        }
    }
    const __VLS_35 = {}.NForm;
    /** @type {[typeof __VLS_components.NForm, typeof __VLS_components.NForm, ]} */ ;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
        ref: "formRef",
        model: (__VLS_ctx.formValue),
        rules: (__VLS_ctx.rules),
        labelPlacement: "left",
        labelWidth: "160",
    }));
    const __VLS_37 = __VLS_36({
        ref: "formRef",
        model: (__VLS_ctx.formValue),
        rules: (__VLS_ctx.rules),
        labelPlacement: "left",
        labelWidth: "160",
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    /** @type {typeof __VLS_ctx.formRef} */ ;
    var __VLS_39 = {};
    __VLS_38.slots.default;
    const __VLS_41 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
        label: "Name (slug)",
        path: "name",
    }));
    const __VLS_43 = __VLS_42({
        label: "Name (slug)",
        path: "name",
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    __VLS_44.slots.default;
    const __VLS_45 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
        value: (__VLS_ctx.formValue.name),
        placeholder: "e.g. openai-admin",
    }));
    const __VLS_47 = __VLS_46({
        value: (__VLS_ctx.formValue.name),
        placeholder: "e.g. openai-admin",
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    var __VLS_44;
    const __VLS_49 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        label: "Display Name",
        path: "displayName",
    }));
    const __VLS_51 = __VLS_50({
        label: "Display Name",
        path: "displayName",
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    __VLS_52.slots.default;
    const __VLS_53 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
        value: (__VLS_ctx.formValue.displayName),
        placeholder: "e.g. OpenAI Admin",
    }));
    const __VLS_55 = __VLS_54({
        value: (__VLS_ctx.formValue.displayName),
        placeholder: "e.g. OpenAI Admin",
    }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    var __VLS_52;
    const __VLS_57 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
        label: (__VLS_ctx.t('common.description')),
    }));
    const __VLS_59 = __VLS_58({
        label: (__VLS_ctx.t('common.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    __VLS_60.slots.default;
    const __VLS_61 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
        value: (__VLS_ctx.formValue.description),
        type: "textarea",
        rows: (3),
        placeholder: "Optional description",
    }));
    const __VLS_63 = __VLS_62({
        value: (__VLS_ctx.formValue.description),
        type: "textarea",
        rows: (3),
        placeholder: "Optional description",
    }, ...__VLS_functionalComponentArgsRest(__VLS_62));
    var __VLS_60;
    const __VLS_65 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
        label: (__VLS_ctx.t('providers.apiKey')),
    }));
    const __VLS_67 = __VLS_66({
        label: (__VLS_ctx.t('providers.apiKey')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_66));
    __VLS_68.slots.default;
    const __VLS_69 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
        value: (__VLS_ctx.formValue.apiKey),
        type: "password",
        showPasswordOn: "click",
        placeholder: "Leave empty to keep current value",
    }));
    const __VLS_71 = __VLS_70({
        value: (__VLS_ctx.formValue.apiKey),
        type: "password",
        showPasswordOn: "click",
        placeholder: "Leave empty to keep current value",
    }, ...__VLS_functionalComponentArgsRest(__VLS_70));
    var __VLS_68;
    const __VLS_73 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
        label: "API Secret",
    }));
    const __VLS_75 = __VLS_74({
        label: "API Secret",
    }, ...__VLS_functionalComponentArgsRest(__VLS_74));
    __VLS_76.slots.default;
    const __VLS_77 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({
        value: (__VLS_ctx.formValue.apiSecret),
        type: "password",
        showPasswordOn: "click",
        placeholder: "Leave empty to keep current value",
    }));
    const __VLS_79 = __VLS_78({
        value: (__VLS_ctx.formValue.apiSecret),
        type: "password",
        showPasswordOn: "click",
        placeholder: "Leave empty to keep current value",
    }, ...__VLS_functionalComponentArgsRest(__VLS_78));
    var __VLS_76;
    const __VLS_81 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
        label: (__VLS_ctx.t('providers.baseUrl')),
    }));
    const __VLS_83 = __VLS_82({
        label: (__VLS_ctx.t('providers.baseUrl')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_82));
    __VLS_84.slots.default;
    const __VLS_85 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
        value: (__VLS_ctx.formValue.baseUrl),
        placeholder: "https://api.example.com",
    }));
    const __VLS_87 = __VLS_86({
        value: (__VLS_ctx.formValue.baseUrl),
        placeholder: "https://api.example.com",
    }, ...__VLS_functionalComponentArgsRest(__VLS_86));
    var __VLS_84;
    const __VLS_89 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_90 = __VLS_asFunctionalComponent(__VLS_89, new __VLS_89({
        label: "Active",
    }));
    const __VLS_91 = __VLS_90({
        label: "Active",
    }, ...__VLS_functionalComponentArgsRest(__VLS_90));
    __VLS_92.slots.default;
    const __VLS_93 = {}.NSwitch;
    /** @type {[typeof __VLS_components.NSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
        value: (__VLS_ctx.formValue.isActive),
    }));
    const __VLS_95 = __VLS_94({
        value: (__VLS_ctx.formValue.isActive),
    }, ...__VLS_functionalComponentArgsRest(__VLS_94));
    var __VLS_92;
    const __VLS_97 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({}));
    const __VLS_99 = __VLS_98({}, ...__VLS_functionalComponentArgsRest(__VLS_98));
    __VLS_100.slots.default;
    const __VLS_101 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_102 = __VLS_asFunctionalComponent(__VLS_101, new __VLS_101({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.updateMutation.isPending.value),
        ...{ class: "mr-3" },
    }));
    const __VLS_103 = __VLS_102({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.updateMutation.isPending.value),
        ...{ class: "mr-3" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_102));
    let __VLS_105;
    let __VLS_106;
    let __VLS_107;
    const __VLS_108 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_104.slots.default;
    (__VLS_ctx.t('common.save'));
    var __VLS_104;
    const __VLS_109 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_110 = __VLS_asFunctionalComponent(__VLS_109, new __VLS_109({
        ...{ 'onClick': {} },
        type: "error",
        ghost: true,
    }));
    const __VLS_111 = __VLS_110({
        ...{ 'onClick': {} },
        type: "error",
        ghost: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_110));
    let __VLS_113;
    let __VLS_114;
    let __VLS_115;
    const __VLS_116 = {
        onClick: (...[$event]) => {
            if (!!(__VLS_ctx.isLoading))
                return;
            if (!!(__VLS_ctx.isError))
                return;
            __VLS_ctx.showDeleteDialog = true;
        }
    };
    __VLS_112.slots.default;
    (__VLS_ctx.t('common.delete'));
    var __VLS_112;
    var __VLS_100;
    var __VLS_38;
}
/** @type {[typeof DeleteConfirmDialog, ]} */ ;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent(DeleteConfirmDialog, new DeleteConfirmDialog({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: "Delete Admin Provider",
    message: "Are you sure you want to delete this admin provider? This action cannot be undone.",
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}));
const __VLS_118 = __VLS_117({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: "Delete Admin Provider",
    message: "Are you sure you want to delete this admin provider? This action cannot be undone.",
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
let __VLS_120;
let __VLS_121;
let __VLS_122;
const __VLS_123 = {
    onConfirm: (...[$event]) => {
        __VLS_ctx.deleteMutation.mutate();
    }
};
var __VLS_119;
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
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-3']} */ ;
// @ts-ignore
var __VLS_40 = __VLS_39;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NForm: NForm,
            NFormItem: NFormItem,
            NInput: NInput,
            NIcon: NIcon,
            NSwitch: NSwitch,
            NSpin: NSpin,
            NTag: NTag,
            ArrowBackOutline: ArrowBackOutline,
            PageHeader: PageHeader,
            DeleteConfirmDialog: DeleteConfirmDialog,
            t: t,
            router: router,
            formRef: formRef,
            showDeleteDialog: showDeleteDialog,
            formValue: formValue,
            rules: rules,
            data: data,
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
