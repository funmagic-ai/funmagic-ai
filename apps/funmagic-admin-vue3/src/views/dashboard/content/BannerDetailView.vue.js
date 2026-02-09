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
    title: '',
    description: '',
    type: 'main',
    thumbnail: '',
    link: '',
    linkText: 'Learn More',
    linkTarget: '_self',
    position: 0,
    badge: '',
    badgeColor: '',
    isActive: true,
});
const rules = {
    title: [{ required: true, message: 'Title is required', trigger: 'blur' }],
    thumbnail: [{ required: true, message: 'Image URL is required', trigger: 'blur' }],
};
const typeOptions = [
    { label: 'Main', value: 'main' },
    { label: 'Side', value: 'side' },
];
const targetOptions = [
    { label: 'Same Tab (_self)', value: '_self' },
    { label: 'New Tab (_blank)', value: '_blank' },
];
const { isLoading, isError, error } = useQuery({
    queryKey: ['banners', id],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/banners/{id}', {
            params: { path: { id: id.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to fetch banner');
        return data;
    },
    select: (data) => {
        const b = data.banner;
        formValue.value = {
            title: b.title,
            description: b.description ?? '',
            type: b.type || 'main',
            thumbnail: b.thumbnail,
            link: b.link ?? '',
            linkText: b.linkText || 'Learn More',
            linkTarget: b.linkTarget || '_self',
            position: b.position ?? 0,
            badge: b.badge ?? '',
            badgeColor: b.badgeColor ?? '',
            isActive: b.isActive,
        };
        return b;
    },
});
const updateMutation = useMutation({
    mutationFn: async () => {
        const { data, error } = await api.PUT('/api/admin/banners/{id}', {
            params: { path: { id: id.value } },
            body: {
                title: formValue.value.title,
                description: formValue.value.description || undefined,
                type: formValue.value.type,
                thumbnail: formValue.value.thumbnail,
                link: formValue.value.link || undefined,
                linkText: formValue.value.linkText,
                linkTarget: formValue.value.linkTarget,
                position: formValue.value.position,
                badge: formValue.value.badge || undefined,
                badgeColor: formValue.value.badgeColor || undefined,
                isActive: formValue.value.isActive,
            },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to update banner');
        return data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['banners'] });
        message.success('Banner updated successfully');
        router.push({ name: 'banners' });
    },
    onError: (err) => {
        message.error(err.message);
    },
});
const deleteMutation = useMutation({
    mutationFn: async () => {
        const { error } = await api.DELETE('/api/admin/banners/{id}', {
            params: { path: { id: id.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to delete banner');
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['banners'] });
        message.success('Banner deleted successfully');
        router.push({ name: 'banners' });
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
    title: (__VLS_ctx.t('common.edit') + ' Banner'),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('common.edit') + ' Banner'),
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
            __VLS_ctx.router.push({ name: 'banners' });
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
        label: "Title",
        path: "title",
    }));
    const __VLS_31 = __VLS_30({
        label: "Title",
        path: "title",
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    __VLS_32.slots.default;
    const __VLS_33 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
        value: (__VLS_ctx.formValue.title),
        placeholder: "Banner title",
    }));
    const __VLS_35 = __VLS_34({
        value: (__VLS_ctx.formValue.title),
        placeholder: "Banner title",
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
        label: (__VLS_ctx.t('content.bannerType')),
    }));
    const __VLS_47 = __VLS_46({
        label: (__VLS_ctx.t('content.bannerType')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_46));
    __VLS_48.slots.default;
    const __VLS_49 = {}.NSelect;
    /** @type {[typeof __VLS_components.NSelect, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        value: (__VLS_ctx.formValue.type),
        options: (__VLS_ctx.typeOptions),
    }));
    const __VLS_51 = __VLS_50({
        value: (__VLS_ctx.formValue.type),
        options: (__VLS_ctx.typeOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    var __VLS_48;
    const __VLS_53 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
        label: (__VLS_ctx.t('content.imageUrl')),
        path: "thumbnail",
    }));
    const __VLS_55 = __VLS_54({
        label: (__VLS_ctx.t('content.imageUrl')),
        path: "thumbnail",
    }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    __VLS_56.slots.default;
    const __VLS_57 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
        value: (__VLS_ctx.formValue.thumbnail),
        placeholder: "https://example.com/image.jpg",
    }));
    const __VLS_59 = __VLS_58({
        value: (__VLS_ctx.formValue.thumbnail),
        placeholder: "https://example.com/image.jpg",
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
    var __VLS_56;
    const __VLS_61 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
        label: (__VLS_ctx.t('content.linkUrl')),
    }));
    const __VLS_63 = __VLS_62({
        label: (__VLS_ctx.t('content.linkUrl')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_62));
    __VLS_64.slots.default;
    const __VLS_65 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
        value: (__VLS_ctx.formValue.link),
        placeholder: "https://example.com",
    }));
    const __VLS_67 = __VLS_66({
        value: (__VLS_ctx.formValue.link),
        placeholder: "https://example.com",
    }, ...__VLS_functionalComponentArgsRest(__VLS_66));
    var __VLS_64;
    const __VLS_69 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
        label: "Link Text",
    }));
    const __VLS_71 = __VLS_70({
        label: "Link Text",
    }, ...__VLS_functionalComponentArgsRest(__VLS_70));
    __VLS_72.slots.default;
    const __VLS_73 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
        value: (__VLS_ctx.formValue.linkText),
        placeholder: "Learn More",
    }));
    const __VLS_75 = __VLS_74({
        value: (__VLS_ctx.formValue.linkText),
        placeholder: "Learn More",
    }, ...__VLS_functionalComponentArgsRest(__VLS_74));
    var __VLS_72;
    const __VLS_77 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({
        label: "Link Target",
    }));
    const __VLS_79 = __VLS_78({
        label: "Link Target",
    }, ...__VLS_functionalComponentArgsRest(__VLS_78));
    __VLS_80.slots.default;
    const __VLS_81 = {}.NSelect;
    /** @type {[typeof __VLS_components.NSelect, ]} */ ;
    // @ts-ignore
    const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
        value: (__VLS_ctx.formValue.linkTarget),
        options: (__VLS_ctx.targetOptions),
    }));
    const __VLS_83 = __VLS_82({
        value: (__VLS_ctx.formValue.linkTarget),
        options: (__VLS_ctx.targetOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_82));
    var __VLS_80;
    const __VLS_85 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
        label: "Position",
    }));
    const __VLS_87 = __VLS_86({
        label: "Position",
    }, ...__VLS_functionalComponentArgsRest(__VLS_86));
    __VLS_88.slots.default;
    const __VLS_89 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_90 = __VLS_asFunctionalComponent(__VLS_89, new __VLS_89({
        value: (__VLS_ctx.formValue.position),
        min: (0),
        ...{ class: "w-full" },
    }));
    const __VLS_91 = __VLS_90({
        value: (__VLS_ctx.formValue.position),
        min: (0),
        ...{ class: "w-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_90));
    var __VLS_88;
    const __VLS_93 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
        label: "Badge",
    }));
    const __VLS_95 = __VLS_94({
        label: "Badge",
    }, ...__VLS_functionalComponentArgsRest(__VLS_94));
    __VLS_96.slots.default;
    const __VLS_97 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({
        value: (__VLS_ctx.formValue.badge),
        placeholder: "e.g. New, Hot",
    }));
    const __VLS_99 = __VLS_98({
        value: (__VLS_ctx.formValue.badge),
        placeholder: "e.g. New, Hot",
    }, ...__VLS_functionalComponentArgsRest(__VLS_98));
    var __VLS_96;
    const __VLS_101 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_102 = __VLS_asFunctionalComponent(__VLS_101, new __VLS_101({
        label: "Badge Color",
    }));
    const __VLS_103 = __VLS_102({
        label: "Badge Color",
    }, ...__VLS_functionalComponentArgsRest(__VLS_102));
    __VLS_104.slots.default;
    const __VLS_105 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, ]} */ ;
    // @ts-ignore
    const __VLS_106 = __VLS_asFunctionalComponent(__VLS_105, new __VLS_105({
        value: (__VLS_ctx.formValue.badgeColor),
        placeholder: "e.g. #ff0000",
    }));
    const __VLS_107 = __VLS_106({
        value: (__VLS_ctx.formValue.badgeColor),
        placeholder: "e.g. #ff0000",
    }, ...__VLS_functionalComponentArgsRest(__VLS_106));
    var __VLS_104;
    const __VLS_109 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_110 = __VLS_asFunctionalComponent(__VLS_109, new __VLS_109({
        label: "Active",
    }));
    const __VLS_111 = __VLS_110({
        label: "Active",
    }, ...__VLS_functionalComponentArgsRest(__VLS_110));
    __VLS_112.slots.default;
    const __VLS_113 = {}.NSwitch;
    /** @type {[typeof __VLS_components.NSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_114 = __VLS_asFunctionalComponent(__VLS_113, new __VLS_113({
        value: (__VLS_ctx.formValue.isActive),
    }));
    const __VLS_115 = __VLS_114({
        value: (__VLS_ctx.formValue.isActive),
    }, ...__VLS_functionalComponentArgsRest(__VLS_114));
    var __VLS_112;
    const __VLS_117 = {}.NFormItem;
    /** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_118 = __VLS_asFunctionalComponent(__VLS_117, new __VLS_117({}));
    const __VLS_119 = __VLS_118({}, ...__VLS_functionalComponentArgsRest(__VLS_118));
    __VLS_120.slots.default;
    const __VLS_121 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_122 = __VLS_asFunctionalComponent(__VLS_121, new __VLS_121({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.updateMutation.isPending.value),
        ...{ class: "mr-3" },
    }));
    const __VLS_123 = __VLS_122({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.updateMutation.isPending.value),
        ...{ class: "mr-3" },
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
    const __VLS_129 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_130 = __VLS_asFunctionalComponent(__VLS_129, new __VLS_129({
        ...{ 'onClick': {} },
        type: "error",
        ghost: true,
    }));
    const __VLS_131 = __VLS_130({
        ...{ 'onClick': {} },
        type: "error",
        ghost: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_130));
    let __VLS_133;
    let __VLS_134;
    let __VLS_135;
    const __VLS_136 = {
        onClick: (...[$event]) => {
            if (!!(__VLS_ctx.isLoading))
                return;
            if (!!(__VLS_ctx.isError))
                return;
            __VLS_ctx.showDeleteDialog = true;
        }
    };
    __VLS_132.slots.default;
    (__VLS_ctx.t('common.delete'));
    var __VLS_132;
    var __VLS_120;
    var __VLS_26;
}
/** @type {[typeof DeleteConfirmDialog, ]} */ ;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent(DeleteConfirmDialog, new DeleteConfirmDialog({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: "Delete Banner",
    message: "Are you sure you want to delete this banner? This action cannot be undone.",
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}));
const __VLS_138 = __VLS_137({
    ...{ 'onConfirm': {} },
    show: (__VLS_ctx.showDeleteDialog),
    title: "Delete Banner",
    message: "Are you sure you want to delete this banner? This action cannot be undone.",
    loading: (__VLS_ctx.deleteMutation.isPending.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
let __VLS_140;
let __VLS_141;
let __VLS_142;
const __VLS_143 = {
    onConfirm: (...[$event]) => {
        __VLS_ctx.deleteMutation.mutate();
    }
};
var __VLS_139;
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
            typeOptions: typeOptions,
            targetOptions: targetOptions,
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
