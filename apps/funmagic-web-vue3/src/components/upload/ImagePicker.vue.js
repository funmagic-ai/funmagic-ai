import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const props = withDefaults(defineProps(), {
    maxSize: 20 * 1024 * 1024,
    accept: 'image/*',
});
const emit = defineEmits();
const fileInputRef = ref(null);
const isDragOver = ref(false);
const error = ref(null);
function validateFile(file) {
    error.value = null;
    if (!file.type.startsWith('image/')) {
        error.value = t('tools.upload.invalidType');
        return false;
    }
    if (file.size > props.maxSize) {
        error.value = t('tools.upload.sizeExceeded', { size: Math.round(props.maxSize / 1024 / 1024) });
        return false;
    }
    return true;
}
function handleFileSelect(event) {
    const input = event.target;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (validateFile(file)) {
            emit('file-select', file);
        }
    }
}
function handleDrop(event) {
    isDragOver.value = false;
    if (props.disabled)
        return;
    const file = event.dataTransfer?.files?.[0];
    if (file && validateFile(file)) {
        emit('file-select', file);
    }
}
function handleDragOver(event) {
    event.preventDefault();
    if (!props.disabled)
        isDragOver.value = true;
}
function handleDragLeave() {
    isDragOver.value = false;
}
function triggerInput() {
    if (!props.disabled)
        fileInputRef.value?.click();
}
function clearFile() {
    emit('file-select', null);
    if (fileInputRef.value)
        fileInputRef.value.value = '';
    error.value = null;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    maxSize: 20 * 1024 * 1024,
    accept: 'image/*',
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "w-full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.handleFileSelect) },
    ref: "fileInputRef",
    type: "file",
    accept: (__VLS_ctx.accept),
    ...{ class: "hidden" },
    disabled: (__VLS_ctx.disabled),
});
/** @type {typeof __VLS_ctx.fileInputRef} */ ;
if (__VLS_ctx.preview) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative rounded-xl overflow-hidden border bg-muted" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (__VLS_ctx.preview),
        alt: (__VLS_ctx.t('tools.preview')),
        ...{ class: "w-full max-h-80 object-contain" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.clearFile) },
        type: "button",
        ...{ class: "absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 text-white backdrop-blur flex items-center justify-center hover:bg-red-500 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M18 6 6 18",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "m6 6 12 12",
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.triggerInput) },
        ...{ onDrop: (__VLS_ctx.handleDrop) },
        ...{ onDragover: (__VLS_ctx.handleDragOver) },
        ...{ onDragleave: (__VLS_ctx.handleDragLeave) },
        ...{ class: "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer" },
        ...{ class: ([
                __VLS_ctx.isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50',
                __VLS_ctx.disabled ? 'opacity-50 cursor-not-allowed' : ''
            ]) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex h-16 w-16 items-center justify-center rounded-full bg-muted" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        width: "28",
        height: "28",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "1.5",
        ...{ class: "text-muted-foreground" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
        points: "17 8 12 3 7 8",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "12",
        x2: "12",
        y1: "3",
        y2: "15",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p)({
        ...{ class: "text-sm font-medium" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.t('tools.upload.dropOrBrowse')) }, null, null);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-xs text-muted-foreground mt-1" },
    });
    (__VLS_ctx.t('tools.upload.formats', { size: Math.round(__VLS_ctx.maxSize / 1024 / 1024) }));
}
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-red-500 mt-2" },
    });
    (__VLS_ctx.error);
}
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-80']} */ ;
/** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['top-3']} */ ;
/** @type {__VLS_StyleScopedClasses['right-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black/60']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['backdrop-blur']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
/** @type {__VLS_StyleScopedClasses['p-8']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-16']} */ ;
/** @type {__VLS_StyleScopedClasses['w-16']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            t: t,
            fileInputRef: fileInputRef,
            isDragOver: isDragOver,
            error: error,
            handleFileSelect: handleFileSelect,
            handleDrop: handleDrop,
            handleDragOver: handleDragOver,
            handleDragLeave: handleDragLeave,
            triggerInput: triggerInput,
            clearFile: clearFile,
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
