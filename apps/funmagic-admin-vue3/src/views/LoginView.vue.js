import { NForm, NFormItem, NInput, NButton, NCard, NIcon } from 'naive-ui';
import { SpeedometerOutline } from '@vicons/ionicons5';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';
const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n();
const formRef = ref(null);
const isSubmitting = ref(false);
const errorMessage = ref('');
const model = reactive({
    email: '',
    password: '',
});
const rules = {
    email: [
        {
            required: true,
            message: 'Email is required',
            trigger: 'blur',
        },
        {
            type: 'email',
            message: 'Please enter a valid email',
            trigger: ['blur', 'input'],
        },
    ],
    password: [
        {
            required: true,
            message: 'Password is required',
            trigger: 'blur',
        },
        {
            min: 6,
            message: 'Password must be at least 6 characters',
            trigger: 'blur',
        },
    ],
};
async function handleSubmit() {
    try {
        await formRef.value?.validate();
    }
    catch {
        return;
    }
    isSubmitting.value = true;
    errorMessage.value = '';
    try {
        const result = await authStore.signIn(model.email, model.password);
        if (result.error) {
            errorMessage.value = t('auth.loginError');
            return;
        }
        // Wait briefly for session to update
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!authStore.isAdmin) {
            errorMessage.value = t('auth.loginError');
            await authStore.signOut();
            return;
        }
        router.push('/dashboard');
    }
    catch {
        errorMessage.value = t('auth.loginError');
    }
    finally {
        isSubmitting.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex min-h-screen items-center justify-center bg-background px-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "w-full max-w-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mb-8 flex flex-col items-center gap-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground" },
});
const __VLS_0 = {}.NIcon;
/** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    size: (28),
}));
const __VLS_2 = __VLS_1({
    size: (28),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.SpeedometerOutline;
/** @type {[typeof __VLS_components.SpeedometerOutline, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-center" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-2xl font-bold text-foreground" },
});
(__VLS_ctx.t('common.appName'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "mt-1 text-sm text-muted-foreground" },
});
(__VLS_ctx.t('auth.loginSubtitle'));
const __VLS_8 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.NCard, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
const __VLS_12 = {}.NForm;
/** @type {[typeof __VLS_components.NForm, typeof __VLS_components.NForm, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onKeyup': {} },
    ref: "formRef",
    model: (__VLS_ctx.model),
    rules: (__VLS_ctx.rules),
    labelPlacement: "top",
    requireMarkPlacement: "right-hanging",
}));
const __VLS_14 = __VLS_13({
    ...{ 'onKeyup': {} },
    ref: "formRef",
    model: (__VLS_ctx.model),
    rules: (__VLS_ctx.rules),
    labelPlacement: "top",
    requireMarkPlacement: "right-hanging",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onKeyup: (__VLS_ctx.handleSubmit)
};
/** @type {typeof __VLS_ctx.formRef} */ ;
var __VLS_20 = {};
__VLS_15.slots.default;
const __VLS_22 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_23 = __VLS_asFunctionalComponent(__VLS_22, new __VLS_22({
    label: (__VLS_ctx.t('auth.email')),
    path: "email",
}));
const __VLS_24 = __VLS_23({
    label: (__VLS_ctx.t('auth.email')),
    path: "email",
}, ...__VLS_functionalComponentArgsRest(__VLS_23));
__VLS_25.slots.default;
const __VLS_26 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, ]} */ ;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
    value: (__VLS_ctx.model.email),
    type: "text",
    placeholder: (__VLS_ctx.t('auth.email')),
    inputProps: ({ autocomplete: 'email' }),
}));
const __VLS_28 = __VLS_27({
    value: (__VLS_ctx.model.email),
    type: "text",
    placeholder: (__VLS_ctx.t('auth.email')),
    inputProps: ({ autocomplete: 'email' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
var __VLS_25;
const __VLS_30 = {}.NFormItem;
/** @type {[typeof __VLS_components.NFormItem, typeof __VLS_components.NFormItem, ]} */ ;
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent(__VLS_30, new __VLS_30({
    label: (__VLS_ctx.t('auth.password')),
    path: "password",
}));
const __VLS_32 = __VLS_31({
    label: (__VLS_ctx.t('auth.password')),
    path: "password",
}, ...__VLS_functionalComponentArgsRest(__VLS_31));
__VLS_33.slots.default;
const __VLS_34 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, ]} */ ;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent(__VLS_34, new __VLS_34({
    value: (__VLS_ctx.model.password),
    type: "password",
    showPasswordOn: "click",
    placeholder: (__VLS_ctx.t('auth.password')),
    inputProps: ({ autocomplete: 'current-password' }),
}));
const __VLS_36 = __VLS_35({
    value: (__VLS_ctx.model.password),
    type: "password",
    showPasswordOn: "click",
    placeholder: (__VLS_ctx.t('auth.password')),
    inputProps: ({ autocomplete: 'current-password' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_35));
var __VLS_33;
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" },
    });
    (__VLS_ctx.errorMessage);
}
const __VLS_38 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent(__VLS_38, new __VLS_38({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    strong: true,
    loading: (__VLS_ctx.isSubmitting),
    disabled: (__VLS_ctx.isSubmitting),
}));
const __VLS_40 = __VLS_39({
    ...{ 'onClick': {} },
    type: "primary",
    block: true,
    strong: true,
    loading: (__VLS_ctx.isSubmitting),
    disabled: (__VLS_ctx.isSubmitting),
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
let __VLS_42;
let __VLS_43;
let __VLS_44;
const __VLS_45 = {
    onClick: (__VLS_ctx.handleSubmit)
};
__VLS_41.slots.default;
(__VLS_ctx.t('auth.signIn'));
var __VLS_41;
var __VLS_15;
var __VLS_11;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-background']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-14']} */ ;
/** @type {__VLS_StyleScopedClasses['w-14']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-destructive/10']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
// @ts-ignore
var __VLS_21 = __VLS_20;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NForm: NForm,
            NFormItem: NFormItem,
            NInput: NInput,
            NButton: NButton,
            NCard: NCard,
            NIcon: NIcon,
            SpeedometerOutline: SpeedometerOutline,
            t: t,
            formRef: formRef,
            isSubmitting: isSubmitting,
            errorMessage: errorMessage,
            model: model,
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
