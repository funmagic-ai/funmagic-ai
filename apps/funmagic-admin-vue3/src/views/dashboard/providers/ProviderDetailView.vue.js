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
    webhookSecret: '',
    healthCheckUrl: '',
    isActive: true,
});
const rules = {
    name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
    displayName: [{ required: true, message: 'Display name is required', trigger: 'blur' }],
};
const { data, isLoading, isError, error } = useQuery({
    queryKey: ['providers', id],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/providers/{id}', {
            params: { path: { id: id.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to fetch provider');
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
            webhookSecret: '',
            healthCheckUrl: p.healthCheckUrl ?? '',
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
        if (formValue.value.webhookSecret)
            body.webhookSecret = formValue.value.webhookSecret;
        if (formValue.value.healthCheckUrl)
            body.healthCheckUrl = formValue.value.healthCheckUrl;
        const { data, error } = await api.PUT('/api/admin/providers/{id}', {
            params: { path: { id: id.value } },
            body: body,
        });
        if (error)
            throw new Error(error.error ?? 'Failed to update provider');
        return data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['providers'] });
        message.success('Provider updated successfully');
        router.push({ name: 'providers' });
    },
    onError: (err) => {
        message.error(err.message);
    },
});
const deleteMutation = useMutation({
    mutationFn: async () => {
        const { error } = await api.DELETE('/api/admin/providers/{id}', {
            params: { path: { id: id.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to delete provider');
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['providers'] });
        message.success('Provider deleted successfully');
        router.push({ name: 'providers' });
    },
    onError: (err) => {
        message.error(err.message);
        showDeleteDialog.value = false;
    },
});
const healthCheckMutation = useMutation({
    mutationFn: async () => {
        const { data, error } = await api.POST('/api/admin/providers/{id}/health-check', {
            params: { path: { id: id.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Health check failed');
        return data;
    },
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['providers', id] });
        message.success(data.isHealthy ? 'Provider is healthy' : 'Provider is unhealthy');
    },
    onError: (err) => {
        message.error(err.message);
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
    title: (__VLS_ctx.t('common.edit') + ' Provider'),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('common.edit') + ' Provider'),
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
            __VLS_ctx.router.push({ name: 'providers' });
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
        const __VLS_35 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
        // @ts-ignore
        const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
            ...{ 'onClick': {} },
            size: "small",
            loading: (__VLS_ctx.healthCheckMutation.isPending.value),
        }));
        const __VLS_37 = __VLS_36({
            ...{ 'onClick': {} },
            size: "small",
            loading: (__VLS_ctx.healthCheckMutation.isPending.value),
        }, ...__VLS_functionalComponentArgsRest(__VLS_36));
        let __VLS_39;
        let __VLS_40;
        let __VLS_41;
        const __VLS_42 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.isLoading))
                    return;
                if (!!(__VLS_ctx.isError))
                    return;
                if (!(__VLS_ctx.data))
                    return;
                __VLS_ctx.healthCheckMutation.mutate();
            }
        };
        __VLS_38.slots.default;
        var __VLS_38;
    }
    const __VLS_43 = {}.NForm;
    /** @type {[typeof __VLS_components.NForm, typeof __VLS_components.NForm, ]} */ ;
    // @ts-ignore
    const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
        ref: "formRef",
        model: (__VLS_ctx.formValue),
        rules: (__VLS_ctx.rules),
        labelPlacement: "left",
        labelWidth: "160",
    }));
    const __VLS_45 = __VLS_44({
        ref: "formRef",
        model: (__VLS_ctx.formValue),
        rules: (__VLS_ctx.rules),
        labelPlacement: "left",
        labelWidth: "160",
    }, ...__VLS_functionalComponentArgsRest(__VLS_44));
    /** @type {typeof __VLS_ctx.formRef} */ ;
    var __VLS_47 = {};
    __VLS_46.slots.default;
    const __VLS_49 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        label: "Name (slug)",
        path: "name",
    }));
    const __VLS_51 = __VLS_50({
        label: "Name (slug)",
        path: "name",
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    __VLS_52.slots.default;
    const __VLS_53 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
        value: (__VLS_ctx.formValue.name),
        placeholder: "e.g. openai-main",
    }));
    const __VLS_55 = __VLS_54({
        value: (__VLS_ctx.formValue.name),
        placeholder: "e.g. openai-main",
    }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    var __VLS_52;
    const __VLS_57 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
        label: "Display Name",
        path: "displayName",
    }));
    const __VLS_59 = __VLS_58({
        label: "Display Name",
        path: "displayName",
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    __VLS_60.slots.default;
    const __VLS_61 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
        value: (__VLS_ctx.formValue.displayName),
        placeholder: "e.g. OpenAI (Main)",
    }));
    const __VLS_63 = __VLS_62({
        value: (__VLS_ctx.formValue.displayName),
        placeholder: "e.g. OpenAI (Main)",
    }, ...__VLS_functionalComponentArgsRest(__VLS_62));
    var __VLS_60;
    const __VLS_65 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
        label: (__VLS_ctx.t('common.description')),
    }));
    const __VLS_67 = __VLS_66({
        label: (__VLS_ctx.t('common.description')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_66));
    __VLS_68.slots.default;
    const __VLS_69 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
        value: (__VLS_ctx.formValue.description),
        type: "textarea",
        rows: (3),
        placeholder: "Optional description",
    }));
    const __VLS_71 = __VLS_70({
        value: (__VLS_ctx.formValue.description),
        type: "textarea",
        rows: (3),
        placeholder: "Optional description",
    }, ...__VLS_functionalComponentArgsRest(__VLS_70));
    var __VLS_68;
    const __VLS_73 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
        label: (__VLS_ctx.t('providers.apiKey')),
    }));
    const __VLS_75 = __VLS_74({
        label: (__VLS_ctx.t('providers.apiKey')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_74));
    __VLS_76.slots.default;
    const __VLS_77 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({
        value: (__VLS_ctx.formValue.apiKey),
        type: "password",
        showPasswordOn: "click",
        placeholder: "Leave empty to keep current value",
    }));
    const __VLS_79 = __VLS_78({
        value: (__VLS_ctx.formValue.apiKey),
        type: "password",
        showPasswordOn: "click",
        placeholder: "Leave empty to keep current value",
    }, ...__VLS_functionalComponentArgsRest(__VLS_78));
    var __VLS_76;
    const __VLS_81 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
        label: "API Secret",
    }));
    const __VLS_83 = __VLS_82({
        label: "API Secret",
    }, ...__VLS_functionalComponentArgsRest(__VLS_82));
    __VLS_84.slots.default;
    const __VLS_85 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
        value: (__VLS_ctx.formValue.apiSecret),
        type: "password",
        showPasswordOn: "click",
        placeholder: "Leave empty to keep current value",
    }));
    const __VLS_87 = __VLS_86({
        value: (__VLS_ctx.formValue.apiSecret),
        type: "password",
        showPasswordOn: "click",
        placeholder: "Leave empty to keep current value",
    }, ...__VLS_functionalComponentArgsRest(__VLS_86));
    var __VLS_84;
    const __VLS_89 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_90 = __VLS_asFunctionalComponent(__VLS_89, new __VLS_89({
        label: (__VLS_ctx.t('providers.baseUrl')),
    }));
    const __VLS_91 = __VLS_90({
        label: (__VLS_ctx.t('providers.baseUrl')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_90));
    __VLS_92.slots.default;
    const __VLS_93 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
        value: (__VLS_ctx.formValue.baseUrl),
        placeholder: "https://api.example.com",
    }));
    const __VLS_95 = __VLS_94({
        value: (__VLS_ctx.formValue.baseUrl),
        placeholder: "https://api.example.com",
    }, ...__VLS_functionalComponentArgsRest(__VLS_94));
    var __VLS_92;
    const __VLS_97 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({
        label: "Webhook Secret",
    }));
    const __VLS_99 = __VLS_98({
        label: "Webhook Secret",
    }, ...__VLS_functionalComponentArgsRest(__VLS_98));
    __VLS_100.slots.default;
    const __VLS_101 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_102 = __VLS_asFunctionalComponent(__VLS_101, new __VLS_101({
        value: (__VLS_ctx.formValue.webhookSecret),
        type: "password",
        showPasswordOn: "click",
        placeholder: "Leave empty to keep current value",
    }));
    const __VLS_103 = __VLS_102({
        value: (__VLS_ctx.formValue.webhookSecret),
        type: "password",
        showPasswordOn: "click",
        placeholder: "Leave empty to keep current value",
    }, ...__VLS_functionalComponentArgsRest(__VLS_102));
    var __VLS_100;
    const __VLS_105 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_106 = __VLS_asFunctionalComponent(__VLS_105, new __VLS_105({
        label: "Health Check URL",
    }));
    const __VLS_107 = __VLS_106({
        label: "Health Check URL",
    }, ...__VLS_functionalComponentArgsRest(__VLS_106));
    __VLS_108.slots.default;
    const __VLS_109 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_110 = __VLS_asFunctionalComponent(__VLS_109, new __VLS_109({
        value: (__VLS_ctx.formValue.healthCheckUrl),
        placeholder: "https://api.example.com/health",
    }));
    const __VLS_111 = __VLS_110({
        value: (__VLS_ctx.formValue.healthCheckUrl),
        placeholder: "https://api.example.com/health",
    }, ...__VLS_functionalComponentArgsRest(__VLS_110));
    var __VLS_108;
    const __VLS_113 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_114 = __VLS_asFunctionalComponent(__VLS_113, new __VLS_113({
        label: "Active",
    }));
    const __VLS_115 = __VLS_114({
        label: "Active",
    }, ...__VLS_functionalComponentArgsRest(__VLS_114));
    __VLS_116.slots.default;
    const __VLS_117 = {}.NSwitch;
    /** @type {[typeof __VLS_components.NSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_118 = __VLS_asFunctionalComponent(__VLS_117, new __VLS_117({
        value: (__VLS_ctx.formValue.isActive),
    }));
    const __VLS_119 = __VLS_118({
        value: (__VLS_ctx.formValue.isActive),
    }, ...__VLS_functionalComponentArgsRest(__VLS_118));
    var __VLS_116;
    const __VLS_121 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_122 = __VLS_asFunctionalComponent(__VLS_121, new __VLS_121({}));
    const __VLS_123 = __VLS_122({}, ...__VLS_functionalComponentArgsRest(__VLS_122));
    __VLS_124.slots.default;
    const __VLS_125 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_126 = __VLS_asFunctionalComponent(__VLS_125, new __VLS_125({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.updateMutation.isPending.value),
        ...{ class: "mr-3" },
    }));
    const __VLS_127 = __VLS_126({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.updateMutation.isPending.value),
        ...{ class: "mr-3" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_126));
    let __VLS_129;
    let __VLS_130;
    let __VLS_131;
    const __VLS_132 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_128.slots.default;
    (__VLS_ctx.t('common.save'));
    var __VLS_128;
    const __VLS_133 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_134 = __VLS_asFunctionalComponent(__VLS_133, new __VLS_133({
        ...{ 'onClick': {} },
        type: "error",
        ghost: true,
    }));
    const __VLS_135 = __VLS_134({
        ...{ 'onClick': {} },
        type: "error",
        ghost: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_134));
    let __VLS_137;
    let __VLS_138;
    let __VLS_139;
    const __VLS_140 = {
        onClick: (...[$event]) => {
            if (!!(__VLS_ctx.isLoading))
                return;
            if (!!(__VLS_ctx.isError))
                return;
            __VLS_ctx.showDeleteDialog = true;
        }
    };
    __VLS_136.slots.default;
    (__VLS_ctx.t('common.delete'));
    var __VLS_136;
    var __VLS_124;
    var __VLS_46;
}
/** @type {[typeof DeleteConfirmDialog, ]} */ ;
// @ts-ignore
const __VLS_141 = __VLS_asFunctionalComponent(DeleteConfirmDialog, new DeleteConfirmDialog({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: "Delete Provider",
    message: "Are you sure you want to delete this provider? This action cannot be undone.",
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}));
const __VLS_142 = __VLS_141({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: "Delete Provider",
    message: "Are you sure you want to delete this provider? This action cannot be undone.",
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_141));
let __VLS_144;
let __VLS_145;
let __VLS_146;
const __VLS_147 = {
    onConfirm: (...[$event]) => {
        __VLS_ctx.deleteMutation.mutate();
    }
};
var __VLS_143;
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
var __VLS_48 = __VLS_47;
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
            healthCheckMutation: healthCheckMutation,
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
