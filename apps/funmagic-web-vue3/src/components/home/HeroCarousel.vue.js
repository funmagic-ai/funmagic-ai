import emblaCarouselVue from 'embla-carousel-vue';
const props = withDefaults(defineProps(), {
    featuredLabel: 'Featured',
});
const [emblaRef, emblaApi] = emblaCarouselVue({ loop: true });
const selectedIndex = ref(0);
function scrollPrev() {
    emblaApi.value?.scrollPrev();
}
function scrollNext() {
    emblaApi.value?.scrollNext();
}
function scrollTo(index) {
    emblaApi.value?.scrollTo(index);
}
watch(emblaApi, (api) => {
    if (!api)
        return;
    api.on('select', () => {
        selectedIndex.value = api.selectedScrollSnap();
    });
    // Auto-scroll
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
        const interval = setInterval(() => {
            api.scrollNext();
        }, 5000);
        onUnmounted(() => clearInterval(interval));
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    featuredLabel: 'Featured',
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.slides.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "relative aspect-[21/9] overflow-hidden rounded-2xl bg-muted animate-pulse" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative aspect-[21/9] overflow-hidden rounded-2xl group cursor-pointer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ref: "emblaRef",
        ...{ class: "h-full overflow-hidden" },
    });
    /** @type {typeof __VLS_ctx.emblaRef} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex h-full" },
    });
    for (const [slide] of __VLS_getVForSourceType((__VLS_ctx.slides))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (slide.id),
            ...{ class: "relative h-full min-w-0 flex-[0_0_100%]" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" },
            ...{ style: ({ backgroundImage: `url(${slide.image})` }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-90" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "absolute top-6 left-6 md:top-8 md:left-8 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground border border-primary/50" },
        });
        (__VLS_ctx.featuredLabel);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col gap-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
            ...{ class: "text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight" },
        });
        (slide.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-muted-foreground text-sm md:text-base lg:text-lg max-w-2xl line-clamp-2" },
        });
        (slide.description);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.scrollPrev) },
        type: "button",
        ...{ class: "absolute top-1/2 left-4 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary" },
        'aria-label': "Previous slide",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "m15 18-6-6 6-6",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.scrollNext) },
        type: "button",
        ...{ class: "absolute top-1/2 right-4 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary" },
        'aria-label': "Next slide",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "m9 18 6-6-6-6",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "absolute bottom-4 left-4 md:bottom-6 md:left-6 flex gap-0" },
        role: "tablist",
        'aria-label': "Carousel slides",
    });
    for (const [slide, index] of __VLS_getVForSourceType((__VLS_ctx.slides))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.slides.length === 0))
                        return;
                    __VLS_ctx.scrollTo(index);
                } },
            key: (slide.id),
            type: "button",
            ...{ class: "flex items-center justify-center h-11 w-11 -mx-1" },
            role: "tab",
            'aria-selected': (__VLS_ctx.selectedIndex === index),
            'aria-label': (`Go to slide ${index + 1}`),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
            ...{ class: "h-1.5 rounded-full transition-all" },
            ...{ class: (__VLS_ctx.selectedIndex === index ? 'w-8 bg-primary' : 'w-2 bg-white/20') },
        });
    }
}
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-[21/9]']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-[21/9]']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['group']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-[0_0_100%]']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-center']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-700']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:scale-105']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-t']} */ ;
/** @type {__VLS_StyleScopedClasses['from-background']} */ ;
/** @type {__VLS_StyleScopedClasses['via-background/40']} */ ;
/** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-90']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['top-6']} */ ;
/** @type {__VLS_StyleScopedClasses['left-6']} */ ;
/** @type {__VLS_StyleScopedClasses['md:top-8']} */ ;
/** @type {__VLS_StyleScopedClasses['md:left-8']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary/50']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
/** @type {__VLS_StyleScopedClasses['left-0']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['md:p-8']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['md:text-4xl']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:text-5xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['md:text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['line-clamp-2']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['left-4']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black/30']} */ ;
/** @type {__VLS_StyleScopedClasses['backdrop-blur-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['right-4']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black/30']} */ ;
/** @type {__VLS_StyleScopedClasses['backdrop-blur-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-4']} */ ;
/** @type {__VLS_StyleScopedClasses['left-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:bottom-6']} */ ;
/** @type {__VLS_StyleScopedClasses['md:left-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-11']} */ ;
/** @type {__VLS_StyleScopedClasses['w-11']} */ ;
/** @type {__VLS_StyleScopedClasses['-mx-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emblaRef: emblaRef,
            selectedIndex: selectedIndex,
            scrollPrev: scrollPrev,
            scrollNext: scrollNext,
            scrollTo: scrollTo,
        };
    },
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
