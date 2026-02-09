import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import AppLogo from './AppLogo.vue';
import LocaleSwitcher from './LocaleSwitcher.vue';
import UserMenu from './UserMenu.vue';
import { SunnyOutline, MoonOutline, MenuOutline, CloseOutline, } from '@vicons/ionicons5';
const { t } = useI18n();
const route = useRoute();
const authStore = useAuthStore();
const appStore = useAppStore();
const mobileMenuOpen = ref(false);
const currentLocale = computed(() => route.params.locale || 'en');
const navLinks = [
    { name: 'home', labelKey: 'nav.home', pathPrefix: '' },
    { name: 'tools', labelKey: 'nav.tools', pathPrefix: '/tools' },
    { name: 'pricing', labelKey: 'nav.pricing', pathPrefix: '/pricing' },
];
/** Strip locale prefix from path to get the clean path for comparison */
function stripLocale(path) {
    const segments = path.split('/').filter(Boolean);
    // If first segment looks like a locale (2-char), strip it
    if (segments.length > 0 && /^[a-z]{2}$/.test(segments[0])) {
        return '/' + segments.slice(1).join('/');
    }
    return '/' + segments.join('/');
}
function isNavActive(link) {
    const cleanPath = stripLocale(route.path);
    if (link.pathPrefix === '') {
        // Home: only active on exact root
        return cleanPath === '/' || cleanPath === '';
    }
    return cleanPath === link.pathPrefix || cleanPath.startsWith(link.pathPrefix + '/');
}
function closeMobileMenu() {
    mobileMenuOpen.value = false;
}
// Close mobile menu on route change
watch(() => route.fullPath, () => {
    mobileMenuOpen.value = false;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.NLayoutHeader;
/** @type {[typeof __VLS_components.NLayoutHeader, typeof __VLS_components.nLayoutHeader, typeof __VLS_components.NLayoutHeader, typeof __VLS_components.nLayoutHeader, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    bordered: true,
    ...{ class: "sticky top-0 z-50 bg-background/80 backdrop-blur-md" },
}));
const __VLS_2 = __VLS_1({
    bordered: true,
    ...{ class: "sticky top-0 z-50 bg-background/80 backdrop-blur-md" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" },
});
const __VLS_5 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    to: ({ name: 'home', params: { locale: __VLS_ctx.currentLocale } }),
    ...{ class: "flex items-center gap-2 text-xl font-bold text-foreground no-underline" },
}));
const __VLS_7 = __VLS_6({
    to: ({ name: 'home', params: { locale: __VLS_ctx.currentLocale } }),
    ...{ class: "flex items-center gap-2 text-xl font-bold text-foreground no-underline" },
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_8.slots.default;
/** @type {[typeof AppLogo, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(AppLogo, new AppLogo({}));
const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "hidden sm:inline" },
});
var __VLS_8;
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "hidden items-center gap-1 md:flex" },
});
for (const [link] of __VLS_getVForSourceType((__VLS_ctx.navLinks))) {
    const __VLS_12 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        key: (link.name),
        to: ({ name: link.name, params: { locale: __VLS_ctx.currentLocale } }),
        ...{ class: "rounded-lg px-4 py-2 text-sm font-medium no-underline transition-colors" },
        ...{ class: (__VLS_ctx.isNavActive(link) ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-accent hover:text-foreground') },
    }));
    const __VLS_14 = __VLS_13({
        key: (link.name),
        to: ({ name: link.name, params: { locale: __VLS_ctx.currentLocale } }),
        ...{ class: "rounded-lg px-4 py-2 text-sm font-medium no-underline transition-colors" },
        ...{ class: (__VLS_ctx.isNavActive(link) ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-accent hover:text-foreground') },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    __VLS_15.slots.default;
    (__VLS_ctx.t(link.labelKey));
    var __VLS_15;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-1" },
});
/** @type {[typeof LocaleSwitcher, ]} */ ;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(LocaleSwitcher, new LocaleSwitcher({}));
const __VLS_17 = __VLS_16({}, ...__VLS_functionalComponentArgsRest(__VLS_16));
const __VLS_19 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    ...{ 'onClick': {} },
    quaternary: true,
    circle: true,
}));
const __VLS_21 = __VLS_20({
    ...{ 'onClick': {} },
    quaternary: true,
    circle: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
let __VLS_23;
let __VLS_24;
let __VLS_25;
const __VLS_26 = {
    onClick: (__VLS_ctx.appStore.toggleDark)
};
__VLS_22.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_22.slots;
    const __VLS_27 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
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
}
var __VLS_22;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hidden items-center gap-2 md:flex" },
});
if (__VLS_ctx.authStore.isAuthenticated) {
    /** @type {[typeof UserMenu, ]} */ ;
    // @ts-ignore
    const __VLS_39 = __VLS_asFunctionalComponent(UserMenu, new UserMenu({}));
    const __VLS_40 = __VLS_39({}, ...__VLS_functionalComponentArgsRest(__VLS_39));
}
else {
    const __VLS_42 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
    // @ts-ignore
    const __VLS_43 = __VLS_asFunctionalComponent(__VLS_42, new __VLS_42({
        to: ({ name: 'login', params: { locale: __VLS_ctx.currentLocale } }),
        ...{ class: "no-underline" },
    }));
    const __VLS_44 = __VLS_43({
        to: ({ name: 'login', params: { locale: __VLS_ctx.currentLocale } }),
        ...{ class: "no-underline" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_43));
    __VLS_45.slots.default;
    const __VLS_46 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({
        quaternary: true,
        size: "small",
    }));
    const __VLS_48 = __VLS_47({
        quaternary: true,
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
    __VLS_49.slots.default;
    (__VLS_ctx.t('nav.login'));
    var __VLS_49;
    var __VLS_45;
    const __VLS_50 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
    // @ts-ignore
    const __VLS_51 = __VLS_asFunctionalComponent(__VLS_50, new __VLS_50({
        to: ({ name: 'register', params: { locale: __VLS_ctx.currentLocale } }),
        ...{ class: "no-underline" },
    }));
    const __VLS_52 = __VLS_51({
        to: ({ name: 'register', params: { locale: __VLS_ctx.currentLocale } }),
        ...{ class: "no-underline" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
    __VLS_53.slots.default;
    const __VLS_54 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_55 = __VLS_asFunctionalComponent(__VLS_54, new __VLS_54({
        type: "primary",
        size: "small",
    }));
    const __VLS_56 = __VLS_55({
        type: "primary",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_55));
    __VLS_57.slots.default;
    (__VLS_ctx.t('nav.register'));
    var __VLS_57;
    var __VLS_53;
}
const __VLS_58 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_59 = __VLS_asFunctionalComponent(__VLS_58, new __VLS_58({
    ...{ 'onClick': {} },
    quaternary: true,
    circle: true,
    ...{ class: "md:hidden" },
}));
const __VLS_60 = __VLS_59({
    ...{ 'onClick': {} },
    quaternary: true,
    circle: true,
    ...{ class: "md:hidden" },
}, ...__VLS_functionalComponentArgsRest(__VLS_59));
let __VLS_62;
let __VLS_63;
let __VLS_64;
const __VLS_65 = {
    onClick: (...[$event]) => {
        __VLS_ctx.mobileMenuOpen = !__VLS_ctx.mobileMenuOpen;
    }
};
__VLS_61.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_61.slots;
    const __VLS_66 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, typeof __VLS_components.NIcon, typeof __VLS_components.nIcon, ]} */ ;
    // @ts-ignore
    const __VLS_67 = __VLS_asFunctionalComponent(__VLS_66, new __VLS_66({
        size: (22),
    }));
    const __VLS_68 = __VLS_67({
        size: (22),
    }, ...__VLS_functionalComponentArgsRest(__VLS_67));
    __VLS_69.slots.default;
    if (__VLS_ctx.mobileMenuOpen) {
        const __VLS_70 = {}.CloseOutline;
        /** @type {[typeof __VLS_components.CloseOutline, ]} */ ;
        // @ts-ignore
        const __VLS_71 = __VLS_asFunctionalComponent(__VLS_70, new __VLS_70({}));
        const __VLS_72 = __VLS_71({}, ...__VLS_functionalComponentArgsRest(__VLS_71));
    }
    else {
        const __VLS_74 = {}.MenuOutline;
        /** @type {[typeof __VLS_components.MenuOutline, ]} */ ;
        // @ts-ignore
        const __VLS_75 = __VLS_asFunctionalComponent(__VLS_74, new __VLS_74({}));
        const __VLS_76 = __VLS_75({}, ...__VLS_functionalComponentArgsRest(__VLS_75));
    }
    var __VLS_69;
}
var __VLS_61;
const __VLS_78 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_79 = __VLS_asFunctionalComponent(__VLS_78, new __VLS_78({
    enterActiveClass: "transition-all duration-200 ease-out",
    enterFromClass: "max-h-0 opacity-0",
    enterToClass: "max-h-96 opacity-100",
    leaveActiveClass: "transition-all duration-150 ease-in",
    leaveFromClass: "max-h-96 opacity-100",
    leaveToClass: "max-h-0 opacity-0",
}));
const __VLS_80 = __VLS_79({
    enterActiveClass: "transition-all duration-200 ease-out",
    enterFromClass: "max-h-0 opacity-0",
    enterToClass: "max-h-96 opacity-100",
    leaveActiveClass: "transition-all duration-150 ease-in",
    leaveFromClass: "max-h-96 opacity-100",
    leaveToClass: "max-h-0 opacity-0",
}, ...__VLS_functionalComponentArgsRest(__VLS_79));
__VLS_81.slots.default;
if (__VLS_ctx.mobileMenuOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "overflow-hidden border-t border-border md:hidden" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
        ...{ class: "flex flex-col gap-1 px-4 py-3" },
    });
    for (const [link] of __VLS_getVForSourceType((__VLS_ctx.navLinks))) {
        const __VLS_82 = {}.RouterLink;
        /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
        // @ts-ignore
        const __VLS_83 = __VLS_asFunctionalComponent(__VLS_82, new __VLS_82({
            ...{ 'onClick': {} },
            key: (link.name),
            to: ({ name: link.name, params: { locale: __VLS_ctx.currentLocale } }),
            ...{ class: "rounded-lg px-4 py-2.5 text-sm font-medium no-underline transition-colors" },
            ...{ class: (__VLS_ctx.isNavActive(link) ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-accent hover:text-foreground') },
        }));
        const __VLS_84 = __VLS_83({
            ...{ 'onClick': {} },
            key: (link.name),
            to: ({ name: link.name, params: { locale: __VLS_ctx.currentLocale } }),
            ...{ class: "rounded-lg px-4 py-2.5 text-sm font-medium no-underline transition-colors" },
            ...{ class: (__VLS_ctx.isNavActive(link) ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-accent hover:text-foreground') },
        }, ...__VLS_functionalComponentArgsRest(__VLS_83));
        let __VLS_86;
        let __VLS_87;
        let __VLS_88;
        const __VLS_89 = {
            onClick: (__VLS_ctx.closeMobileMenu)
        };
        __VLS_85.slots.default;
        (__VLS_ctx.t(link.labelKey));
        var __VLS_85;
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-2 border-t border-border pt-3" },
    });
    if (__VLS_ctx.authStore.isAuthenticated) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mb-2 flex items-center gap-3 px-4" },
        });
        const __VLS_90 = {}.NAvatar;
        /** @type {[typeof __VLS_components.NAvatar, typeof __VLS_components.nAvatar, typeof __VLS_components.NAvatar, typeof __VLS_components.nAvatar, ]} */ ;
        // @ts-ignore
        const __VLS_91 = __VLS_asFunctionalComponent(__VLS_90, new __VLS_90({
            round: true,
            size: (28),
            src: (__VLS_ctx.authStore.user?.image ?? undefined),
        }));
        const __VLS_92 = __VLS_91({
            round: true,
            size: (28),
            src: (__VLS_ctx.authStore.user?.image ?? undefined),
        }, ...__VLS_functionalComponentArgsRest(__VLS_91));
        __VLS_93.slots.default;
        if (!__VLS_ctx.authStore.user?.image) {
            (__VLS_ctx.authStore.user?.name?.charAt(0)?.toUpperCase() ?? '?');
        }
        var __VLS_93;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "text-sm font-medium" },
        });
        (__VLS_ctx.authStore.user?.name);
        const __VLS_94 = {}.RouterLink;
        /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
        // @ts-ignore
        const __VLS_95 = __VLS_asFunctionalComponent(__VLS_94, new __VLS_94({
            ...{ 'onClick': {} },
            to: ({ name: 'profile', params: { locale: __VLS_ctx.currentLocale } }),
            ...{ class: "rounded-lg px-4 py-2.5 text-sm font-medium text-foreground/70 no-underline transition-colors hover:bg-accent" },
        }));
        const __VLS_96 = __VLS_95({
            ...{ 'onClick': {} },
            to: ({ name: 'profile', params: { locale: __VLS_ctx.currentLocale } }),
            ...{ class: "rounded-lg px-4 py-2.5 text-sm font-medium text-foreground/70 no-underline transition-colors hover:bg-accent" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_95));
        let __VLS_98;
        let __VLS_99;
        let __VLS_100;
        const __VLS_101 = {
            onClick: (__VLS_ctx.closeMobileMenu)
        };
        __VLS_97.slots.default;
        (__VLS_ctx.t('nav.profile'));
        var __VLS_97;
        const __VLS_102 = {}.RouterLink;
        /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
        // @ts-ignore
        const __VLS_103 = __VLS_asFunctionalComponent(__VLS_102, new __VLS_102({
            ...{ 'onClick': {} },
            to: ({ name: 'assets', params: { locale: __VLS_ctx.currentLocale } }),
            ...{ class: "rounded-lg px-4 py-2.5 text-sm font-medium text-foreground/70 no-underline transition-colors hover:bg-accent" },
        }));
        const __VLS_104 = __VLS_103({
            ...{ 'onClick': {} },
            to: ({ name: 'assets', params: { locale: __VLS_ctx.currentLocale } }),
            ...{ class: "rounded-lg px-4 py-2.5 text-sm font-medium text-foreground/70 no-underline transition-colors hover:bg-accent" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_103));
        let __VLS_106;
        let __VLS_107;
        let __VLS_108;
        const __VLS_109 = {
            onClick: (__VLS_ctx.closeMobileMenu)
        };
        __VLS_105.slots.default;
        (__VLS_ctx.t('nav.assets'));
        var __VLS_105;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (async () => { await __VLS_ctx.authStore.signOut(); __VLS_ctx.closeMobileMenu(); }) },
            ...{ class: "w-full cursor-pointer rounded-lg border-0 bg-transparent px-4 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-accent" },
        });
        (__VLS_ctx.t('nav.logout'));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex gap-2 px-4" },
        });
        const __VLS_110 = {}.RouterLink;
        /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
        // @ts-ignore
        const __VLS_111 = __VLS_asFunctionalComponent(__VLS_110, new __VLS_110({
            ...{ 'onClick': {} },
            to: ({ name: 'login', params: { locale: __VLS_ctx.currentLocale } }),
            ...{ class: "flex-1 no-underline" },
        }));
        const __VLS_112 = __VLS_111({
            ...{ 'onClick': {} },
            to: ({ name: 'login', params: { locale: __VLS_ctx.currentLocale } }),
            ...{ class: "flex-1 no-underline" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_111));
        let __VLS_114;
        let __VLS_115;
        let __VLS_116;
        const __VLS_117 = {
            onClick: (__VLS_ctx.closeMobileMenu)
        };
        __VLS_113.slots.default;
        const __VLS_118 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_119 = __VLS_asFunctionalComponent(__VLS_118, new __VLS_118({
            block: true,
        }));
        const __VLS_120 = __VLS_119({
            block: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_119));
        __VLS_121.slots.default;
        (__VLS_ctx.t('nav.login'));
        var __VLS_121;
        var __VLS_113;
        const __VLS_122 = {}.RouterLink;
        /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
        // @ts-ignore
        const __VLS_123 = __VLS_asFunctionalComponent(__VLS_122, new __VLS_122({
            ...{ 'onClick': {} },
            to: ({ name: 'register', params: { locale: __VLS_ctx.currentLocale } }),
            ...{ class: "flex-1 no-underline" },
        }));
        const __VLS_124 = __VLS_123({
            ...{ 'onClick': {} },
            to: ({ name: 'register', params: { locale: __VLS_ctx.currentLocale } }),
            ...{ class: "flex-1 no-underline" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_123));
        let __VLS_126;
        let __VLS_127;
        let __VLS_128;
        const __VLS_129 = {
            onClick: (__VLS_ctx.closeMobileMenu)
        };
        __VLS_125.slots.default;
        const __VLS_130 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_131 = __VLS_asFunctionalComponent(__VLS_130, new __VLS_130({
            type: "primary",
            block: true,
        }));
        const __VLS_132 = __VLS_131({
            type: "primary",
            block: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_131));
        __VLS_133.slots.default;
        (__VLS_ctx.t('nav.register'));
        var __VLS_133;
        var __VLS_125;
    }
}
var __VLS_81;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['sticky']} */ ;
/** @type {__VLS_StyleScopedClasses['top-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-background/80']} */ ;
/** @type {__VLS_StyleScopedClasses['backdrop-blur-md']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-16']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-7xl']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['no-underline']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:inline']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['no-underline']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex']} */ ;
/** @type {__VLS_StyleScopedClasses['no-underline']} */ ;
/** @type {__VLS_StyleScopedClasses['no-underline']} */ ;
/** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['no-underline']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground/70']} */ ;
/** @type {__VLS_StyleScopedClasses['no-underline']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-accent']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground/70']} */ ;
/** @type {__VLS_StyleScopedClasses['no-underline']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-accent']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-accent']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['no-underline']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['no-underline']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AppLogo: AppLogo,
            LocaleSwitcher: LocaleSwitcher,
            UserMenu: UserMenu,
            SunnyOutline: SunnyOutline,
            MoonOutline: MoonOutline,
            MenuOutline: MenuOutline,
            CloseOutline: CloseOutline,
            t: t,
            authStore: authStore,
            appStore: appStore,
            mobileMenuOpen: mobileMenuOpen,
            currentLocale: currentLocale,
            navLinks: navLinks,
            isNavActive: isNavActive,
            closeMobileMenu: closeMobileMenu,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
