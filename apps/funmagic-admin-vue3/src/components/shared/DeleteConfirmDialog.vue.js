import { NModal } from 'naive-ui';
import { useI18n } from 'vue-i18n';
const props = withDefaults(defineProps(), {
    title: undefined,
    message: undefined,
    loading: false,
});
const emit = defineEmits();
const { t } = useI18n();
const displayTitle = computed(() => props.title ?? t('common.confirm'));
const displayMessage = computed(() => props.message ?? 'Are you sure you want to delete this item? This action cannot be undone.');
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    title: undefined,
    message: undefined,
    loading: false,
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.NModal;
/** @type {[typeof __VLS_components.NModal, typeof __VLS_components.NModal, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onPositiveClick': {} },
    ...{ 'onNegativeClick': {} },
    ...{ 'onClose': {} },
    ...{ 'onMaskClick': {} },
    show: (__VLS_ctx.show),
    preset: "dialog",
    type: "error",
    title: (__VLS_ctx.displayTitle),
    positiveText: (__VLS_ctx.t('common.delete')),
    negativeText: (__VLS_ctx.t('common.cancel')),
    positiveButtonProps: ({ type: 'error', loading: __VLS_ctx.loading }),
    loading: (__VLS_ctx.loading),
    maskClosable: (!__VLS_ctx.loading),
    closable: (!__VLS_ctx.loading),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onPositiveClick': {} },
    ...{ 'onNegativeClick': {} },
    ...{ 'onClose': {} },
    ...{ 'onMaskClick': {} },
    show: (__VLS_ctx.show),
    preset: "dialog",
    type: "error",
    title: (__VLS_ctx.displayTitle),
    positiveText: (__VLS_ctx.t('common.delete')),
    negativeText: (__VLS_ctx.t('common.cancel')),
    positiveButtonProps: ({ type: 'error', loading: __VLS_ctx.loading }),
    loading: (__VLS_ctx.loading),
    maskClosable: (!__VLS_ctx.loading),
    closable: (!__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onPositiveClick: (...[$event]) => {
        __VLS_ctx.emit('confirm');
    }
};
const __VLS_8 = {
    onNegativeClick: (...[$event]) => {
        __VLS_ctx.emit('update:show', false);
    }
};
const __VLS_9 = {
    onClose: (...[$event]) => {
        __VLS_ctx.emit('update:show', false);
    }
};
const __VLS_10 = {
    onMaskClick: (...[$event]) => {
        __VLS_ctx.emit('update:show', false);
    }
};
var __VLS_11 = {};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-sm text-muted-foreground" },
});
(__VLS_ctx.displayMessage);
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NModal: NModal,
            emit: emit,
            t: t,
            displayTitle: displayTitle,
            displayMessage: displayMessage,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
