import { useI18n } from 'vue-i18n';
import { SUPPORTED_LOCALES, LOCALE_LABELS, setLocale } from '@/lib/i18n';
import { GlobeOutline } from '@vicons/ionicons5';
const { locale } = useI18n();
const router = useRouter();
const route = useRoute();
const localeOptions = SUPPORTED_LOCALES.map((loc) => ({
    label: LOCALE_LABELS[loc],
    key: loc,
}));
async function handleSelect(key) {
    const newLocale = key;
    await setLocale(newLocale);
    // Update the locale param in the current route
    router.replace({
        ...route,
        params: { ...route.params, locale: newLocale },
    });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.NDropdown;
/** @type {[typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onSelect': {} },
    options: (__VLS_ctx.localeOptions),
    value: (__VLS_ctx.locale),
    trigger: "click",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSelect': {} },
    options: (__VLS_ctx.localeOptions),
    value: (__VLS_ctx.locale),
    trigger: "click",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onSelect: (__VLS_ctx.handleSelect)
};
var __VLS_8 = {};
__VLS_3.slots.default;
const __VLS_9 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    quaternary: true,
    circle: true,
}));
const __VLS_11 = __VLS_10({
    quaternary: true,
    circle: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_12.slots;
    const __VLS_13 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
        size: (20),
    }));
    const __VLS_15 = __VLS_14({
        size: (20),
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    __VLS_16.slots.default;
    const __VLS_17 = {}.GlobeOutline;
    /** @type {[typeof __VLS_components.GlobeOutline, ]} */ ;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({}));
    const __VLS_19 = __VLS_18({}, ...__VLS_functionalComponentArgsRest(__VLS_18));
    var __VLS_16;
}
var __VLS_12;
var __VLS_3;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            GlobeOutline: GlobeOutline,
            locale: locale,
            localeOptions: localeOptions,
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
