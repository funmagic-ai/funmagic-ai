import { NDropdown, NIcon } from 'naive-ui';
import { ColorPaletteOutline } from '@vicons/ionicons5';
import { useAppStore, THEMES } from '@/stores/app';
const appStore = useAppStore();
const THEME_COLORS = {
    purple: '#7c3aed',
    blue: '#2563eb',
    green: '#16a34a',
    orange: '#ea580c',
    red: '#dc2626',
    teal: '#0d9488',
    indigo: '#4f46e5',
    slate: '#475569',
};
const options = THEMES.map((theme) => ({
    key: theme,
    label: theme.charAt(0).toUpperCase() + theme.slice(1),
}));
function handleSelect(key) {
    appStore.setTheme(key);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.NDropdown;
/** @type {[typeof __VLS_components.NDropdown, typeof __VLS_components.NDropdown, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.options),
    value: (__VLS_ctx.appStore.currentTheme),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.options),
    value: (__VLS_ctx.appStore.currentTheme),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onSelect: (__VLS_ctx.handleSelect)
};
var __VLS_8 = {};
__VLS_3.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_3.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ class: "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-accent" },
    });
    const __VLS_9 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
    // @ts-ignore
    const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
        size: (20),
    }));
    const __VLS_11 = __VLS_10({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
    __VLS_12.slots.default;
    const __VLS_13 = {}.ColorPaletteOutline;
    /** @type {[typeof __VLS_components.ColorPaletteOutline, ]} */ ;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({}));
    const __VLS_15 = __VLS_14({}, ...__VLS_functionalComponentArgsRest(__VLS_14));
    var __VLS_12;
}
{
    const { renderLabel: __VLS_thisSlot } = __VLS_3.slots;
    const [{ option }] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2.5 py-0.5" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
        ...{ class: "inline-block h-4 w-4 rounded-full border border-border" },
        ...{ style: ({ backgroundColor: __VLS_ctx.THEME_COLORS[option.key] }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: ([
                'text-sm',
                option.key === __VLS_ctx.appStore.currentTheme ? 'font-semibold text-primary' : '',
            ]) },
    });
    (option.label);
    if (option.key === __VLS_ctx.appStore.currentTheme) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "ml-auto text-xs text-primary" },
        });
    }
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-9']} */ ;
/** @type {__VLS_StyleScopedClasses['w-9']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-accent']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NDropdown: NDropdown,
            NIcon: NIcon,
            ColorPaletteOutline: ColorPaletteOutline,
            appStore: appStore,
            THEME_COLORS: THEME_COLORS,
            options: options,
            handleSelect: handleSelect,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
