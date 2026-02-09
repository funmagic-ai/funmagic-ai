import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import AppLayout from '@/components/layout/AppLayout.vue';
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const message = useMessage();
const locale = computed(() => route.params.locale || 'en');
const formRef = ref(null);
const loading = ref(false);
const errorMsg = ref('');
const formValue = ref({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
});
const rules = computed(() => ({
    name: [
        { required: true, message: t('auth.validation.nameRequired'), trigger: 'blur' },
        { min: 2, message: t('auth.validation.nameMin2'), trigger: 'blur' },
    ],
    email: [
        { required: true, message: t('auth.validation.emailRequired'), trigger: 'blur' },
        { type: 'email', message: t('auth.validation.emailInvalid'), trigger: 'blur' },
    ],
    password: [
        { required: true, message: t('auth.validation.passwordRequired'), trigger: 'blur' },
        { min: 8, message: t('auth.validation.passwordMin8'), trigger: 'blur' },
    ],
    confirmPassword: [
        { required: true, message: t('auth.validation.confirmPasswordRequired'), trigger: 'blur' },
        {
            validator: (_rule, value) => {
                if (value !== formValue.value.password) {
                    return new Error(t('auth.validation.passwordsMismatch'));
                }
                return true;
            },
            trigger: 'blur',
        },
    ],
}));
async function handleSubmit() {
    try {
        await formRef.value?.validate();
    }
    catch {
        return;
    }
    loading.value = true;
    errorMsg.value = '';
    try {
        const result = await authStore.signUp(formValue.value.name, formValue.value.email, formValue.value.password);
        if (result.error) {
            errorMsg.value = result.error.message || t('auth.registerError');
            return;
        }
        message.success(t('auth.accountCreated'));
        router.push({ name: 'home', params: { locale: locale.value } });
    }
    catch (err) {
        const e = err;
        errorMsg.value = e?.message || t('auth.registerError');
    }
    finally {
        loading.value = false;
    }
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
    ...{ class: "flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "w-full max-w-md" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-center mb-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-3xl font-bold text-foreground" },
});
(__VLS_ctx.t('auth.registerTitle'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "mt-2 text-muted-foreground" },
});
(__VLS_ctx.t('auth.registerSubtitle'));
const __VLS_4 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
const __VLS_8 = {}.NForm;
/** @type {[typeof __VLS_components.NForm, typeof __VLS_components.nForm, typeof __VLS_components.NForm, typeof __VLS_components.nForm, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    model: (__VLS_ctx.formValue),
    rules: (__VLS_ctx.rules),
    labelPlacement: "top",
}));
const __VLS_10 = __VLS_9({
    ...{ 'onSubmit': {} },
    ref: "formRef",
    model: (__VLS_ctx.formValue),
    rules: (__VLS_ctx.rules),
    labelPlacement: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onSubmit: (__VLS_ctx.handleSubmit)
};
/** @type {typeof __VLS_ctx.formRef} */ ;
var __VLS_16 = {};
__VLS_11.slots.default;
const __VLS_18 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({
    label: (__VLS_ctx.t('auth.name')),
    path: "name",
}));
const __VLS_20 = __VLS_19({
    label: (__VLS_ctx.t('auth.name')),
    path: "name",
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
__VLS_21.slots.default;
const __VLS_22 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_23 = __VLS_asFunctionalComponent(__VLS_22, new __VLS_22({
    value: (__VLS_ctx.formValue.name),
    placeholder: (__VLS_ctx.t('auth.name')),
    size: "large",
}));
const __VLS_24 = __VLS_23({
    value: (__VLS_ctx.formValue.name),
    placeholder: (__VLS_ctx.t('auth.name')),
    size: "large",
}, ...__VLS_functionalComponentArgsRest(__VLS_23));
var __VLS_21;
const __VLS_26 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
    label: (__VLS_ctx.t('auth.email')),
    path: "email",
}));
const __VLS_28 = __VLS_27({
    label: (__VLS_ctx.t('auth.email')),
    path: "email",
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
__VLS_29.slots.default;
const __VLS_30 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent(__VLS_30, new __VLS_30({
    value: (__VLS_ctx.formValue.email),
    type: "text",
    placeholder: (__VLS_ctx.t('auth.email')),
    size: "large",
}));
const __VLS_32 = __VLS_31({
    value: (__VLS_ctx.formValue.email),
    type: "text",
    placeholder: (__VLS_ctx.t('auth.email')),
    size: "large",
}, ...__VLS_functionalComponentArgsRest(__VLS_31));
var __VLS_29;
const __VLS_34 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent(__VLS_34, new __VLS_34({
    label: (__VLS_ctx.t('auth.password')),
    path: "password",
}));
const __VLS_36 = __VLS_35({
    label: (__VLS_ctx.t('auth.password')),
    path: "password",
}, ...__VLS_functionalComponentArgsRest(__VLS_35));
__VLS_37.slots.default;
const __VLS_38 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent(__VLS_38, new __VLS_38({
    value: (__VLS_ctx.formValue.password),
    type: "password",
    showPasswordOn: "click",
    placeholder: (__VLS_ctx.t('auth.password')),
    size: "large",
}));
const __VLS_40 = __VLS_39({
    value: (__VLS_ctx.formValue.password),
    type: "password",
    showPasswordOn: "click",
    placeholder: (__VLS_ctx.t('auth.password')),
    size: "large",
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
var __VLS_37;
const __VLS_42 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, typeof __VLS_components.NFormItem, typeof __VLS_components.nFormItem, ]} */ ;
// @ts-ignore
const __VLS_43 = __VLS_asFunctionalComponent(__VLS_42, new __VLS_42({
    label: (__VLS_ctx.t('auth.confirmPassword')),
    path: "confirmPassword",
}));
const __VLS_44 = __VLS_43({
    label: (__VLS_ctx.t('auth.confirmPassword')),
    path: "confirmPassword",
}, ...__VLS_functionalComponentArgsRest(__VLS_43));
__VLS_45.slots.default;
const __VLS_46 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
// @ts-ignore
const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({
    value: (__VLS_ctx.formValue.confirmPassword),
    type: "password",
    showPasswordOn: "click",
    placeholder: (__VLS_ctx.t('auth.confirmPassword')),
    size: "large",
}));
const __VLS_48 = __VLS_47({
    value: (__VLS_ctx.formValue.confirmPassword),
    type: "password",
    showPasswordOn: "click",
    placeholder: (__VLS_ctx.t('auth.confirmPassword')),
    size: "large",
}, ...__VLS_functionalComponentArgsRest(__VLS_47));
var __VLS_45;
if (__VLS_ctx.errorMsg) {
    const __VLS_50 = {}.NAlert;
    /** @type {[typeof __VLS_components.NAlert, typeof __VLS_components.nAlert, typeof __VLS_components.NAlert, typeof __VLS_components.nAlert, ]} */ ;
    // @ts-ignore
    const __VLS_51 = __VLS_asFunctionalComponent(__VLS_50, new __VLS_50({
        ...{ 'onClose': {} },
        type: "error",
        bordered: (false),
        closable: true,
        ...{ class: "mb-4" },
    }));
    const __VLS_52 = __VLS_51({
        ...{ 'onClose': {} },
        type: "error",
        bordered: (false),
        closable: true,
        ...{ class: "mb-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
    let __VLS_54;
    let __VLS_55;
    let __VLS_56;
    const __VLS_57 = {
        onClose: (...[$event]) => {
            if (!(__VLS_ctx.errorMsg))
                return;
            __VLS_ctx.errorMsg = '';
        }
    };
    __VLS_53.slots.default;
    (__VLS_ctx.errorMsg);
    var __VLS_53;
}
const __VLS_58 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_59 = __VLS_asFunctionalComponent(__VLS_58, new __VLS_58({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    block: true,
    loading: (__VLS_ctx.loading),
    disabled: (__VLS_ctx.loading),
    attrType: "submit",
}));
const __VLS_60 = __VLS_59({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    block: true,
    loading: (__VLS_ctx.loading),
    disabled: (__VLS_ctx.loading),
    attrType: "submit",
}, ...__VLS_functionalComponentArgsRest(__VLS_59));
let __VLS_62;
let __VLS_63;
let __VLS_64;
const __VLS_65 = {
    onClick: (__VLS_ctx.handleSubmit)
};
__VLS_61.slots.default;
(__VLS_ctx.t('auth.signUp'));
var __VLS_61;
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mt-6 text-center text-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-muted-foreground" },
});
(__VLS_ctx.t('auth.hasAccount'));
const __VLS_66 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_67 = __VLS_asFunctionalComponent(__VLS_66, new __VLS_66({
    to: ({ name: 'login', params: { locale: __VLS_ctx.locale } }),
    ...{ class: "text-primary font-medium hover:underline" },
}));
const __VLS_68 = __VLS_67({
    to: ({ name: 'login', params: { locale: __VLS_ctx.locale } }),
    ...{ class: "text-primary font-medium hover:underline" },
}, ...__VLS_functionalComponentArgsRest(__VLS_67));
__VLS_69.slots.default;
(__VLS_ctx.t('auth.signIn'));
var __VLS_69;
var __VLS_7;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-[calc(100vh-200px)]']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:underline']} */ ;
// @ts-ignore
var __VLS_17 = __VLS_16;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLayout: AppLayout,
            t: t,
            locale: locale,
            formRef: formRef,
            loading: loading,
            errorMsg: errorMsg,
            formValue: formValue,
            rules: rules,
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
