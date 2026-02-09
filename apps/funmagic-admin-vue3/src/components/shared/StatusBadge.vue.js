import { NTag } from 'naive-ui';
const props = defineProps();
const typeMap = {
    pending: 'warning',
    queued: 'info',
    processing: 'info',
    completed: 'success',
    failed: 'error',
    active: 'success',
    inactive: 'default',
};
const tagType = computed(() => typeMap[props.status.toLowerCase()] ?? 'default');
const label = computed(() => {
    const s = props.status;
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.NTag;
/** @type {[typeof __VLS_components.NTag, typeof __VLS_components.NTag, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    type: (__VLS_ctx.tagType),
    size: "small",
    round: true,
}));
const __VLS_2 = __VLS_1({
    type: (__VLS_ctx.tagType),
    size: "small",
    round: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
(__VLS_ctx.label);
var __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NTag: NTag,
            tagType: tagType,
            label: label,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
