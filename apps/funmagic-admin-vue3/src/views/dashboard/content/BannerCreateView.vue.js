import { NButton, NForm, NFormItem, NInput, NInputNumber, NIcon, NSwitch, NSelect } from 'naive-ui';
import { ArrowBackOutline } from '@vicons/ionicons5';
import { useMutation } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
const { t } = useI18n();
const router = useRouter();
const message = useMessage();
const formRef = ref(null);
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
const createMutation = useMutation({
    mutationFn: async () => {
        const { data, error } = await api.POST('/api/admin/banners', {
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
            throw new Error(error.error ?? 'Failed to create banner');
        return data;
    },
    onSuccess: () => {
        message.success('Banner created successfully');
        router.push({ name: 'banners' });
    },
    onError: (err) => {
        message.error(err.message);
    },
});
async function handleSubmit() {
    try {
        await formRef.value?.validate();
        createMutation.mutate();
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
    title: (__VLS_ctx.t('content.createBanner')),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('content.createBanner')),
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
const __VLS_19 = {}.NForm;
/** @type {[typeof __VLS_components.NForm, typeof __VLS_components.NForm, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    ref: "formRef",
    model: (__VLS_ctx.formValue),
    rules: (__VLS_ctx.rules),
    labelPlacement: "left",
    labelWidth: "140",
}));
const __VLS_21 = __VLS_20({
    ref: "formRef",
    model: (__VLS_ctx.formValue),
    rules: (__VLS_ctx.rules),
    labelPlacement: "left",
    labelWidth: "140",
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
/** @type {typeof __VLS_ctx.formRef} */ ;
var __VLS_23 = {};
__VLS_22.slots.default;
const __VLS_25 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    label: "Title",
    path: "title",
}));
const __VLS_27 = __VLS_26({
    label: "Title",
    path: "title",
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
__VLS_28.slots.default;
const __VLS_29 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    value: (__VLS_ctx.formValue.title),
    placeholder: "Banner title",
}));
const __VLS_31 = __VLS_30({
    value: (__VLS_ctx.formValue.title),
    placeholder: "Banner title",
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
var __VLS_28;
const __VLS_33 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    label: (__VLS_ctx.t('common.description')),
}));
const __VLS_35 = __VLS_34({
    label: (__VLS_ctx.t('common.description')),
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
__VLS_36.slots.default;
const __VLS_37 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, ]} */ ;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
    value: (__VLS_ctx.formValue.description),
    type: "textarea",
    rows: (3),
    placeholder: "Optional description",
}));
const __VLS_39 = __VLS_38({
    value: (__VLS_ctx.formValue.description),
    type: "textarea",
    rows: (3),
    placeholder: "Optional description",
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
var __VLS_36;
const __VLS_41 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    label: (__VLS_ctx.t('content.bannerType')),
}));
const __VLS_43 = __VLS_42({
    label: (__VLS_ctx.t('content.bannerType')),
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
__VLS_44.slots.default;
const __VLS_45 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    value: (__VLS_ctx.formValue.type),
    options: (__VLS_ctx.typeOptions),
}));
const __VLS_47 = __VLS_46({
    value: (__VLS_ctx.formValue.type),
    options: (__VLS_ctx.typeOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
var __VLS_44;
const __VLS_49 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    label: (__VLS_ctx.t('content.imageUrl')),
    path: "thumbnail",
}));
const __VLS_51 = __VLS_50({
    label: (__VLS_ctx.t('content.imageUrl')),
    path: "thumbnail",
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
__VLS_52.slots.default;
const __VLS_53 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, ]} */ ;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    value: (__VLS_ctx.formValue.thumbnail),
    placeholder: "https://example.com/image.jpg",
}));
const __VLS_55 = __VLS_54({
    value: (__VLS_ctx.formValue.thumbnail),
    placeholder: "https://example.com/image.jpg",
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
var __VLS_52;
const __VLS_57 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
    label: (__VLS_ctx.t('content.linkUrl')),
}));
const __VLS_59 = __VLS_58({
    label: (__VLS_ctx.t('content.linkUrl')),
}, ...__VLS_functionalComponentArgsRest(__VLS_58));
__VLS_60.slots.default;
const __VLS_61 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, ]} */ ;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
    value: (__VLS_ctx.formValue.link),
    placeholder: "https://example.com",
}));
const __VLS_63 = __VLS_62({
    value: (__VLS_ctx.formValue.link),
    placeholder: "https://example.com",
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
var __VLS_60;
const __VLS_65 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
    label: "Link Text",
}));
const __VLS_67 = __VLS_66({
    label: "Link Text",
}, ...__VLS_functionalComponentArgsRest(__VLS_66));
__VLS_68.slots.default;
const __VLS_69 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, ]} */ ;
// @ts-ignore
const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
    value: (__VLS_ctx.formValue.linkText),
    placeholder: "Learn More",
}));
const __VLS_71 = __VLS_70({
    value: (__VLS_ctx.formValue.linkText),
    placeholder: "Learn More",
}, ...__VLS_functionalComponentArgsRest(__VLS_70));
var __VLS_68;
const __VLS_73 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
    label: "Link Target",
}));
const __VLS_75 = __VLS_74({
    label: "Link Target",
}, ...__VLS_functionalComponentArgsRest(__VLS_74));
__VLS_76.slots.default;
const __VLS_77 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, ]} */ ;
// @ts-ignore
const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({
    value: (__VLS_ctx.formValue.linkTarget),
    options: (__VLS_ctx.targetOptions),
}));
const __VLS_79 = __VLS_78({
    value: (__VLS_ctx.formValue.linkTarget),
    options: (__VLS_ctx.targetOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_78));
var __VLS_76;
const __VLS_81 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
    label: "Position",
}));
const __VLS_83 = __VLS_82({
    label: "Position",
}, ...__VLS_functionalComponentArgsRest(__VLS_82));
__VLS_84.slots.default;
const __VLS_85 = {}.NInputNumber;
/** @type {[typeof __VLS_components.NInputNumber, ]} */ ;
// @ts-ignore
const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
    value: (__VLS_ctx.formValue.position),
    min: (0),
    ...{ class: "w-full" },
}));
const __VLS_87 = __VLS_86({
    value: (__VLS_ctx.formValue.position),
    min: (0),
    ...{ class: "w-full" },
}, ...__VLS_functionalComponentArgsRest(__VLS_86));
var __VLS_84;
const __VLS_89 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_90 = __VLS_asFunctionalComponent(__VLS_89, new __VLS_89({
    label: "Badge",
}));
const __VLS_91 = __VLS_90({
    label: "Badge",
}, ...__VLS_functionalComponentArgsRest(__VLS_90));
__VLS_92.slots.default;
const __VLS_93 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, ]} */ ;
// @ts-ignore
const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
    value: (__VLS_ctx.formValue.badge),
    placeholder: "e.g. New, Hot",
}));
const __VLS_95 = __VLS_94({
    value: (__VLS_ctx.formValue.badge),
    placeholder: "e.g. New, Hot",
}, ...__VLS_functionalComponentArgsRest(__VLS_94));
var __VLS_92;
const __VLS_97 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({
    label: "Badge Color",
}));
const __VLS_99 = __VLS_98({
    label: "Badge Color",
}, ...__VLS_functionalComponentArgsRest(__VLS_98));
__VLS_100.slots.default;
const __VLS_101 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, ]} */ ;
// @ts-ignore
const __VLS_102 = __VLS_asFunctionalComponent(__VLS_101, new __VLS_101({
    value: (__VLS_ctx.formValue.badgeColor),
    placeholder: "e.g. #ff0000",
}));
const __VLS_103 = __VLS_102({
    value: (__VLS_ctx.formValue.badgeColor),
    placeholder: "e.g. #ff0000",
}, ...__VLS_functionalComponentArgsRest(__VLS_102));
var __VLS_100;
const __VLS_105 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_106 = __VLS_asFunctionalComponent(__VLS_105, new __VLS_105({
    label: "Active",
}));
const __VLS_107 = __VLS_106({
    label: "Active",
}, ...__VLS_functionalComponentArgsRest(__VLS_106));
__VLS_108.slots.default;
const __VLS_109 = {}.NSwitch;
/** @type {[typeof __VLS_components.NSwitch, ]} */ ;
// @ts-ignore
const __VLS_110 = __VLS_asFunctionalComponent(__VLS_109, new __VLS_109({
    value: (__VLS_ctx.formValue.isActive),
}));
const __VLS_111 = __VLS_110({
    value: (__VLS_ctx.formValue.isActive),
}, ...__VLS_functionalComponentArgsRest(__VLS_110));
var __VLS_108;
const __VLS_113 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_114 = __VLS_asFunctionalComponent(__VLS_113, new __VLS_113({}));
const __VLS_115 = __VLS_114({}, ...__VLS_functionalComponentArgsRest(__VLS_114));
__VLS_116.slots.default;
const __VLS_117 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
// @ts-ignore
const __VLS_118 = __VLS_asFunctionalComponent(__VLS_117, new __VLS_117({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.createMutation.isPending.value),
}));
const __VLS_119 = __VLS_118({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.createMutation.isPending.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_118));
let __VLS_121;
let __VLS_122;
let __VLS_123;
const __VLS_124 = {
    onClick: (__VLS_ctx.handleSubmit)
};
__VLS_120.slots.default;
(__VLS_ctx.t('common.create'));
var __VLS_120;
var __VLS_116;
var __VLS_22;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['py-6']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
// @ts-ignore
var __VLS_24 = __VLS_23;
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
            ArrowBackOutline: ArrowBackOutline,
            PageHeader: PageHeader,
            t: t,
            router: router,
            formRef: formRef,
            formValue: formValue,
            rules: rules,
            typeOptions: typeOptions,
            targetOptions: targetOptions,
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
