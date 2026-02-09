import { NButton, NForm, NFormItem, NInput, NIcon, NSwitch, NSpin } from 'naive-ui';
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
    isActive: true,
});
const rules = {
    name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
    displayName: [{ required: true, message: 'Display name is required', trigger: 'blur' }],
};
const { isLoading, isError, error } = useQuery({
    queryKey: ['tool-types', id],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/tool-types/{id}', {
            params: { path: { id: id.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to fetch tool type');
        return data;
    },
    select: (data) => {
        const tt = data.toolType;
        formValue.value = {
            name: tt.name,
            displayName: tt.displayName,
            description: tt.description ?? '',
            isActive: tt.isActive,
        };
        return tt;
    },
});
const updateMutation = useMutation({
    mutationFn: async () => {
        const { data, error } = await api.PUT('/api/admin/tool-types/{id}', {
            params: { path: { id: id.value } },
            body: {
                name: formValue.value.name,
                displayName: formValue.value.displayName,
                description: formValue.value.description || undefined,
                isActive: formValue.value.isActive,
            },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to update tool type');
        return data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tool-types'] });
        message.success('Tool type updated successfully');
        router.push({ name: 'tool-types' });
    },
    onError: (err) => {
        message.error(err.message);
    },
});
const deleteMutation = useMutation({
    mutationFn: async () => {
        const { error } = await api.DELETE('/api/admin/tool-types/{id}', {
            params: { path: { id: id.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to delete tool type');
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tool-types'] });
        message.success('Tool type deleted successfully');
        router.push({ name: 'tool-types' });
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
    title: (__VLS_ctx.t('common.edit') + ' ' + __VLS_ctx.t('nav.toolTypes')),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('common.edit') + ' ' + __VLS_ctx.t('nav.toolTypes')),
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
            __VLS_ctx.router.push({ name: 'tool-types' });
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
        label: "Name (slug)",
        path: "name",
    }));
    const __VLS_31 = __VLS_30({
        label: "Name (slug)",
        path: "name",
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    __VLS_32.slots.default;
    const __VLS_33 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
        value: (__VLS_ctx.formValue.name),
        placeholder: "e.g. image-generation",
    }));
    const __VLS_35 = __VLS_34({
        value: (__VLS_ctx.formValue.name),
        placeholder: "e.g. image-generation",
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    var __VLS_32;
    const __VLS_37 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
        label: "Display Name",
        path: "displayName",
    }));
    const __VLS_39 = __VLS_38({
        label: "Display Name",
        path: "displayName",
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    __VLS_40.slots.default;
    const __VLS_41 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
        value: (__VLS_ctx.formValue.displayName),
        placeholder: "e.g. Image Generation",
    }));
    const __VLS_43 = __VLS_42({
        value: (__VLS_ctx.formValue.displayName),
        placeholder: "e.g. Image Generation",
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
        value: (__VLS_ctx.formValue.description),
        type: "textarea",
        rows: (3),
        placeholder: "Optional description",
    }));
    const __VLS_51 = __VLS_50({
        value: (__VLS_ctx.formValue.description),
        type: "textarea",
        rows: (3),
        placeholder: "Optional description",
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    var __VLS_48;
    const __VLS_53 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
        label: "Active",
        path: "isActive",
    }));
    const __VLS_55 = __VLS_54({
        label: "Active",
        path: "isActive",
    }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    __VLS_56.slots.default;
    const __VLS_57 = {}.NSwitch;
    /** @type {[typeof __VLS_components.NSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
        value: (__VLS_ctx.formValue.isActive),
    }));
    const __VLS_59 = __VLS_58({
        value: (__VLS_ctx.formValue.isActive),
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    var __VLS_56;
    const __VLS_61 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({}));
    const __VLS_63 = __VLS_62({}, ...__VLS_functionalComponentArgsRest(__VLS_62));
    __VLS_64.slots.default;
    const __VLS_65 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.updateMutation.isPending.value),
        ...{ class: "mr-3" },
    }));
    const __VLS_67 = __VLS_66({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.updateMutation.isPending.value),
        ...{ class: "mr-3" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_66));
    let __VLS_69;
    let __VLS_70;
    let __VLS_71;
    const __VLS_72 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_68.slots.default;
    (__VLS_ctx.t('common.save'));
    var __VLS_68;
    const __VLS_73 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
        ...{ 'onClick': {} },
        type: "error",
        ghost: true,
    }));
    const __VLS_75 = __VLS_74({
        ...{ 'onClick': {} },
        type: "error",
        ghost: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_74));
    let __VLS_77;
    let __VLS_78;
    let __VLS_79;
    const __VLS_80 = {
        onClick: (...[$event]) => {
            if (!!(__VLS_ctx.isLoading))
                return;
            if (!!(__VLS_ctx.isError))
                return;
            __VLS_ctx.showDeleteDialog = true;
        }
    };
    __VLS_76.slots.default;
    (__VLS_ctx.t('common.delete'));
    var __VLS_76;
    var __VLS_64;
    var __VLS_26;
}
/** @type {[typeof DeleteConfirmDialog, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(DeleteConfirmDialog, new DeleteConfirmDialog({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: "Delete Tool Type",
    message: "Are you sure you want to delete this tool type? This action cannot be undone.",
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}));
const __VLS_82 = __VLS_81({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: "Delete Tool Type",
    message: "Are you sure you want to delete this tool type? This action cannot be undone.",
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
let __VLS_84;
let __VLS_85;
let __VLS_86;
const __VLS_87 = {
    onConfirm: (...[$event]) => {
        __VLS_ctx.deleteMutation.mutate();
    }
};
var __VLS_83;
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
            NIcon: NIcon,
            NSwitch: NSwitch,
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
