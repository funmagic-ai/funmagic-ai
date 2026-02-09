import { NButton, NIcon, NEmpty, NSpin, NList, NListItem, NThing, NTime, NPopconfirm } from 'naive-ui';
import { AddOutline, ChatboxOutline, TrashOutline } from '@vicons/ionicons5';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
const { t } = useI18n();
const router = useRouter();
const message = useMessage();
const queryClient = useQueryClient();
const { data, isLoading, isError } = useQuery({
    queryKey: ['ai-studio-chats'],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/ai-studio/chats');
        if (error)
            throw new Error('Failed to fetch chats');
        return data;
    },
});
const createChatMutation = useMutation({
    mutationFn: async () => {
        const { data, error } = await api.POST('/api/admin/ai-studio/chats', {
            body: {},
        });
        if (error)
            throw new Error(error.error ?? 'Failed to create chat');
        return data;
    },
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['ai-studio-chats'] });
        router.push({ name: 'ai-studio-chat', params: { id: data.chat.id } });
    },
    onError: (err) => {
        message.error(err.message);
    },
});
const deleteChatMutation = useMutation({
    mutationFn: async (chatId) => {
        const { error } = await api.DELETE('/api/admin/ai-studio/chats/{chatId}', {
            params: { path: { chatId } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to delete chat');
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['ai-studio-chats'] });
        message.success('Chat deleted');
    },
    onError: (err) => {
        message.error(err.message);
    },
});
const chats = computed(() => data.value?.chats ?? []);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
/** @type {[typeof PageHeader, typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: (__VLS_ctx.t('aiStudio.title')),
    description: "AI image generation playground",
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.t('aiStudio.title')),
    description: "AI image generation playground",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_2.slots.default;
{
    const { actions: __VLS_thisSlot } = __VLS_2.slots;
    const __VLS_3 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.createChatMutation.isPending.value),
    }));
    const __VLS_5 = __VLS_4({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.createChatMutation.isPending.value),
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    let __VLS_7;
    let __VLS_8;
    let __VLS_9;
    const __VLS_10 = {
        onClick: (...[$event]) => {
            __VLS_ctx.createChatMutation.mutate();
        }
    };
    __VLS_6.slots.default;
    {
        const { icon: __VLS_thisSlot } = __VLS_6.slots;
        const __VLS_11 = {}.NIcon;
        /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({}));
        const __VLS_13 = __VLS_12({}, ...__VLS_functionalComponentArgsRest(__VLS_12));
        __VLS_14.slots.default;
        const __VLS_15 = {}.AddOutline;
        /** @type {[typeof __VLS_components.AddOutline, ]} */ ;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({}));
        const __VLS_17 = __VLS_16({}, ...__VLS_functionalComponentArgsRest(__VLS_16));
        var __VLS_14;
    }
    (__VLS_ctx.t('aiStudio.newChat'));
    var __VLS_6;
}
var __VLS_2;
const __VLS_19 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({}));
const __VLS_21 = __VLS_20({}, ...__VLS_functionalComponentArgsRest(__VLS_20));
__VLS_22.slots.default;
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-center py-12" },
    });
    const __VLS_23 = {}.NSpin;
    /** @type {[typeof __VLS_components.NSpin, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
        size: "large",
    }));
    const __VLS_25 = __VLS_24({
        size: "large",
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
}
else if (__VLS_ctx.isError || __VLS_ctx.chats.length === 0) {
    const __VLS_27 = {}.NEmpty;
    /** @type {[typeof __VLS_components.NEmpty, typeof __VLS_components.NEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
        description: (__VLS_ctx.isError ? 'Failed to load chats' : 'No chats yet. Create a new chat to get started.'),
        ...{ class: "py-12" },
    }));
    const __VLS_29 = __VLS_28({
        description: (__VLS_ctx.isError ? 'Failed to load chats' : 'No chats yet. Create a new chat to get started.'),
        ...{ class: "py-12" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
    __VLS_30.slots.default;
    {
        const { extra: __VLS_thisSlot } = __VLS_30.slots;
        const __VLS_31 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
        // @ts-ignore
        const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
            ...{ 'onClick': {} },
            type: "primary",
            loading: (__VLS_ctx.createChatMutation.isPending.value),
        }));
        const __VLS_33 = __VLS_32({
            ...{ 'onClick': {} },
            type: "primary",
            loading: (__VLS_ctx.createChatMutation.isPending.value),
        }, ...__VLS_functionalComponentArgsRest(__VLS_32));
        let __VLS_35;
        let __VLS_36;
        let __VLS_37;
        const __VLS_38 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.isLoading))
                    return;
                if (!(__VLS_ctx.isError || __VLS_ctx.chats.length === 0))
                    return;
                __VLS_ctx.createChatMutation.mutate();
            }
        };
        __VLS_34.slots.default;
        (__VLS_ctx.t('aiStudio.newChat'));
        var __VLS_34;
    }
    var __VLS_30;
}
else {
    const __VLS_39 = {}.NList;
    /** @type {[typeof __VLS_components.NList, typeof __VLS_components.NList, ]} */ ;
    // @ts-ignore
    const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
        hoverable: true,
        clickable: true,
    }));
    const __VLS_41 = __VLS_40({
        hoverable: true,
        clickable: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_40));
    __VLS_42.slots.default;
    for (const [chat] of __VLS_getVForSourceType((__VLS_ctx.chats))) {
        const __VLS_43 = {}.NListItem;
        /** @type {[typeof __VLS_components.NListItem, typeof __VLS_components.NListItem, ]} */ ;
        // @ts-ignore
        const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
            ...{ 'onClick': {} },
            key: (chat.id),
        }));
        const __VLS_45 = __VLS_44({
            ...{ 'onClick': {} },
            key: (chat.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_44));
        let __VLS_47;
        let __VLS_48;
        let __VLS_49;
        const __VLS_50 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.isLoading))
                    return;
                if (!!(__VLS_ctx.isError || __VLS_ctx.chats.length === 0))
                    return;
                __VLS_ctx.router.push({ name: 'ai-studio-chat', params: { id: chat.id } });
            }
        };
        __VLS_46.slots.default;
        const __VLS_51 = {}.NThing;
        /** @type {[typeof __VLS_components.NThing, typeof __VLS_components.NThing, ]} */ ;
        // @ts-ignore
        const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({}));
        const __VLS_53 = __VLS_52({}, ...__VLS_functionalComponentArgsRest(__VLS_52));
        __VLS_54.slots.default;
        {
            const { avatar: __VLS_thisSlot } = __VLS_54.slots;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10" },
            });
            const __VLS_55 = {}.NIcon;
            /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
            // @ts-ignore
            const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({
                size: (20),
                ...{ class: "text-primary" },
            }));
            const __VLS_57 = __VLS_56({
                size: (20),
                ...{ class: "text-primary" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_56));
            __VLS_58.slots.default;
            const __VLS_59 = {}.ChatboxOutline;
            /** @type {[typeof __VLS_components.ChatboxOutline, ]} */ ;
            // @ts-ignore
            const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({}));
            const __VLS_61 = __VLS_60({}, ...__VLS_functionalComponentArgsRest(__VLS_60));
            var __VLS_58;
        }
        {
            const { header: __VLS_thisSlot } = __VLS_54.slots;
            (chat.title || 'Untitled Chat');
        }
        {
            const { description: __VLS_thisSlot } = __VLS_54.slots;
            const __VLS_63 = {}.NTime;
            /** @type {[typeof __VLS_components.NTime, ]} */ ;
            // @ts-ignore
            const __VLS_64 = __VLS_asFunctionalComponent(__VLS_63, new __VLS_63({
                time: (new Date(chat.createdAt)),
                type: "relative",
            }));
            const __VLS_65 = __VLS_64({
                time: (new Date(chat.createdAt)),
                type: "relative",
            }, ...__VLS_functionalComponentArgsRest(__VLS_64));
        }
        {
            const { 'header-extra': __VLS_thisSlot } = __VLS_54.slots;
            const __VLS_67 = {}.NPopconfirm;
            /** @type {[typeof __VLS_components.NPopconfirm, typeof __VLS_components.NPopconfirm, ]} */ ;
            // @ts-ignore
            const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({
                ...{ 'onPositiveClick': {} },
            }));
            const __VLS_69 = __VLS_68({
                ...{ 'onPositiveClick': {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_68));
            let __VLS_71;
            let __VLS_72;
            let __VLS_73;
            const __VLS_74 = {
                onPositiveClick: (...[$event]) => {
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    if (!!(__VLS_ctx.isError || __VLS_ctx.chats.length === 0))
                        return;
                    __VLS_ctx.deleteChatMutation.mutate(chat.id);
                }
            };
            __VLS_70.slots.default;
            {
                const { trigger: __VLS_thisSlot } = __VLS_70.slots;
                const __VLS_75 = {}.NButton;
                /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
                // @ts-ignore
                const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
                    ...{ 'onClick': {} },
                    size: "small",
                    quaternary: true,
                    type: "error",
                }));
                const __VLS_77 = __VLS_76({
                    ...{ 'onClick': {} },
                    size: "small",
                    quaternary: true,
                    type: "error",
                }, ...__VLS_functionalComponentArgsRest(__VLS_76));
                let __VLS_79;
                let __VLS_80;
                let __VLS_81;
                const __VLS_82 = {
                    onClick: () => { }
                };
                __VLS_78.slots.default;
                {
                    const { icon: __VLS_thisSlot } = __VLS_78.slots;
                    const __VLS_83 = {}.NIcon;
                    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
                    // @ts-ignore
                    const __VLS_84 = __VLS_asFunctionalComponent(__VLS_83, new __VLS_83({}));
                    const __VLS_85 = __VLS_84({}, ...__VLS_functionalComponentArgsRest(__VLS_84));
                    __VLS_86.slots.default;
                    const __VLS_87 = {}.TrashOutline;
                    /** @type {[typeof __VLS_components.TrashOutline, ]} */ ;
                    // @ts-ignore
                    const __VLS_88 = __VLS_asFunctionalComponent(__VLS_87, new __VLS_87({}));
                    const __VLS_89 = __VLS_88({}, ...__VLS_functionalComponentArgsRest(__VLS_88));
                    var __VLS_86;
                }
                var __VLS_78;
            }
            var __VLS_70;
        }
        var __VLS_54;
        var __VLS_46;
    }
    var __VLS_42;
}
var __VLS_22;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary/10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NIcon: NIcon,
            NEmpty: NEmpty,
            NSpin: NSpin,
            NList: NList,
            NListItem: NListItem,
            NThing: NThing,
            NTime: NTime,
            NPopconfirm: NPopconfirm,
            AddOutline: AddOutline,
            ChatboxOutline: ChatboxOutline,
            TrashOutline: TrashOutline,
            PageHeader: PageHeader,
            t: t,
            router: router,
            isLoading: isLoading,
            isError: isError,
            createChatMutation: createChatMutation,
            deleteChatMutation: deleteChatMutation,
            chats: chats,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
