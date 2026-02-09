import { NIcon, NDropdown } from 'naive-ui';
import { MenuOutline, PersonCircleOutline, LogOutOutline, MoonOutline, SunnyOutline, LanguageOutline, } from '@vicons/ionicons5';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { SUPPORTED_LOCALES, LOCALE_LABELS, setLocale, } from '@/lib/i18n';
import { useI18n } from 'vue-i18n';
import ThemeSwitcher from './ThemeSwitcher.vue';
const appStore = useAppStore();
const authStore = useAuthStore();
const router = useRouter();
const { locale, t } = useI18n();
// Injected from DashboardLayout for responsive sidebar toggle
const toggleSidebar = inject('toggleSidebar', () => appStore.toggleSidebar());
// Locale switcher options
const localeOptions = SUPPORTED_LOCALES.map((loc) => ({
    key: loc,
    label: LOCALE_LABELS[loc],
}));
async function handleLocaleSelect(key) {
    await setLocale(key);
}
// User dropdown options
const userOptions = computed(() => [
    {
        key: 'logout',
        label: t('nav.logout'),
        icon: () => h(NIcon, null, { default: () => h(LogOutOutline) }),
    },
]);
async function handleUserSelect(key) {
    if (key === 'logout') {
        await authStore.signOut();
        router.push('/login');
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.toggleSidebar();
        } },
    ...{ class: "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-accent" },
});
const __VLS_0 = {}.NIcon;
/** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    size: (20),
}));
const __VLS_2 = __VLS_1({
    size: (20),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.MenuOutline;
/** @type {[typeof __VLS_components.MenuOutline, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-1" },
});
const __VLS_8 = {}.NDropdown;
/** @type {[typeof __VLS_components.NDropdown, typeof __VLS_components.NDropdown, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.localeOptions),
    value: (__VLS_ctx.locale),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.localeOptions),
    value: (__VLS_ctx.locale),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onSelect: (__VLS_ctx.handleLocaleSelect)
};
__VLS_11.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-accent" },
});
const __VLS_16 = {}.NIcon;
/** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    size: (20),
}));
const __VLS_18 = __VLS_17({
    size: (20),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
const __VLS_20 = {}.LanguageOutline;
/** @type {[typeof __VLS_components.LanguageOutline, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({}));
const __VLS_22 = __VLS_21({}, ...__VLS_functionalComponentArgsRest(__VLS_21));
var __VLS_19;
var __VLS_11;
/** @type {[typeof ThemeSwitcher, ]} */ ;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent(ThemeSwitcher, new ThemeSwitcher({}));
const __VLS_25 = __VLS_24({}, ...__VLS_functionalComponentArgsRest(__VLS_24));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.appStore.toggleDark();
        } },
    ...{ class: "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-accent" },
});
const __VLS_27 = {}.NIcon;
/** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
    size: (20),
}));
const __VLS_29 = __VLS_28({
    size: (20),
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
__VLS_30.slots.default;
if (!__VLS_ctx.appStore.isDark) {
    const __VLS_31 = {}.MoonOutline;
    /** @type {[typeof __VLS_components.MoonOutline, ]} */ ;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({}));
    const __VLS_33 = __VLS_32({}, ...__VLS_functionalComponentArgsRest(__VLS_32));
}
else {
    const __VLS_35 = {}.SunnyOutline;
    /** @type {[typeof __VLS_components.SunnyOutline, ]} */ ;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({}));
    const __VLS_37 = __VLS_36({}, ...__VLS_functionalComponentArgsRest(__VLS_36));
}
var __VLS_30;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "mx-1 h-6 w-px bg-border" },
});
const __VLS_39 = {}.NDropdown;
/** @type {[typeof __VLS_components.NDropdown, typeof __VLS_components.NDropdown, ]} */ ;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.userOptions),
}));
const __VLS_41 = __VLS_40({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.userOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
let __VLS_43;
let __VLS_44;
let __VLS_45;
const __VLS_46 = {
    onSelect: (__VLS_ctx.handleUserSelect)
};
__VLS_42.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-accent" },
});
const __VLS_47 = {}.NIcon;
/** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
// @ts-ignore
const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
    size: (20),
}));
const __VLS_49 = __VLS_48({
    size: (20),
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
__VLS_50.slots.default;
const __VLS_51 = {}.PersonCircleOutline;
/** @type {[typeof __VLS_components.PersonCircleOutline, ]} */ ;
// @ts-ignore
const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({}));
const __VLS_53 = __VLS_52({}, ...__VLS_functionalComponentArgsRest(__VLS_52));
var __VLS_50;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "hidden text-sm font-medium sm:inline" },
});
(__VLS_ctx.authStore.user?.name || __VLS_ctx.authStore.user?.email || 'Admin');
var __VLS_42;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-16']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-card']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
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
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-9']} */ ;
/** @type {__VLS_StyleScopedClasses['w-9']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-accent']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-9']} */ ;
/** @type {__VLS_StyleScopedClasses['w-9']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-accent']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-px']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-border']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-accent']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:inline']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NIcon: NIcon,
            NDropdown: NDropdown,
            MenuOutline: MenuOutline,
            PersonCircleOutline: PersonCircleOutline,
            MoonOutline: MoonOutline,
            SunnyOutline: SunnyOutline,
            LanguageOutline: LanguageOutline,
            ThemeSwitcher: ThemeSwitcher,
            appStore: appStore,
            authStore: authStore,
            locale: locale,
            toggleSidebar: toggleSidebar,
            localeOptions: localeOptions,
            handleLocaleSelect: handleLocaleSelect,
            userOptions: userOptions,
            handleUserSelect: handleUserSelect,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
