import { NButton, NIcon, NInput, NSelect, NSpin, NEmpty, NImage, NTag } from 'naive-ui';
import { ArrowBackOutline, SendOutline } from '@vicons/ionicons5';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { api } from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader.vue';
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const message = useMessage();
const queryClient = useQueryClient();
const chatId = computed(() => route.params.id);
const messageInput = ref('');
const selectedProvider = ref('openai');
const messagesContainer = ref(null);
const providerOptions = [
    { label: 'OpenAI', value: 'openai' },
    { label: 'Google', value: 'google' },
    { label: 'Fal', value: 'fal' },
];
// Fetch available providers
const { data: providersData } = useQuery({
    queryKey: ['ai-studio-providers'],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/ai-studio/providers');
        if (error)
            throw new Error('Failed to fetch providers');
        return data;
    },
});
const availableProviders = computed(() => {
    if (!providersData.value)
        return providerOptions;
    return providerOptions.filter((opt) => providersData.value.providers[opt.value]);
});
// Fetch chat with messages
const { data: chatData, isLoading, isError } = useQuery({
    queryKey: ['ai-studio-chat', chatId],
    queryFn: async () => {
        const { data, error } = await api.GET('/api/admin/ai-studio/chats/{chatId}', {
            params: { path: { chatId: chatId.value } },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to fetch chat');
        return data;
    },
    refetchInterval: 5000, // Poll for status updates
});
const messages = computed(() => chatData.value?.messages ?? []);
const chatTitle = computed(() => chatData.value?.chat?.title || 'Untitled Chat');
// Send message mutation
const sendMessageMutation = useMutation({
    mutationFn: async () => {
        const content = messageInput.value.trim();
        if (!content)
            throw new Error('Message cannot be empty');
        const { data, error } = await api.POST('/api/admin/ai-studio/chats/{chatId}/messages', {
            params: { path: { chatId: chatId.value } },
            body: {
                content,
                provider: selectedProvider.value,
            },
        });
        if (error)
            throw new Error(error.error ?? 'Failed to send message');
        return data;
    },
    onSuccess: () => {
        messageInput.value = '';
        queryClient.invalidateQueries({ queryKey: ['ai-studio-chat', chatId] });
        scrollToBottom();
    },
    onError: (err) => {
        message.error(err.message);
    },
});
function scrollToBottom() {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
    });
}
function handleSend() {
    if (!messageInput.value.trim())
        return;
    sendMessageMutation.mutate();
}
function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
}
function getImageUrl(storageKey) {
    return `${import.meta.env.VITE_API_URL}/api/admin/ai-studio/assets/url?storageKey=${encodeURIComponent(storageKey)}`;
}
// Auto-scroll on initial load
watch(messages, () => {
    scrollToBottom();
}, { once: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex h-[calc(100vh-8rem)] flex-col" },
});
/** @type {[typeof PageHeader, typeof PageHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PageHeader, new PageHeader({
    title: (__VLS_ctx.chatTitle),
}));
const __VLS_1 = __VLS_0({
    title: (__VLS_ctx.chatTitle),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_2.slots.default;
{
    const { actions: __VLS_thisSlot } = __VLS_2.slots;
    const __VLS_3 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        ...{ 'onClick': {} },
    }));
    const __VLS_5 = __VLS_4({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    let __VLS_7;
    let __VLS_8;
    let __VLS_9;
    const __VLS_10 = {
        onClick: (...[$event]) => {
            __VLS_ctx.router.push({ name: 'ai-studio' });
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
        const __VLS_15 = {}.ArrowBackOutline;
        /** @type {[typeof __VLS_components.ArrowBackOutline, ]} */ ;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({}));
        const __VLS_17 = __VLS_16({}, ...__VLS_functionalComponentArgsRest(__VLS_16));
        var __VLS_14;
    }
    (__VLS_ctx.t('common.back'));
    var __VLS_6;
}
var __VLS_2;
const __VLS_19 = {}.NCard;
/** @type {[typeof __VLS_components.NCard, typeof __VLS_components.nCard, typeof __VLS_components.NCard, typeof __VLS_components.nCard, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    ...{ class: "flex-1 overflow-hidden" },
}));
const __VLS_21 = __VLS_20({
    ...{ class: "flex-1 overflow-hidden" },
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
__VLS_22.slots.default;
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex h-full items-center justify-center" },
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
else if (__VLS_ctx.isError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex h-full items-center justify-center" },
    });
    const __VLS_27 = {}.NEmpty;
    /** @type {[typeof __VLS_components.NEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
        description: "Failed to load chat",
    }));
    const __VLS_29 = __VLS_28({
        description: "Failed to load chat",
    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ref: "messagesContainer",
        ...{ class: "flex h-[calc(100vh-20rem)] flex-col gap-4 overflow-y-auto pb-4" },
    });
    /** @type {typeof __VLS_ctx.messagesContainer} */ ;
    if (__VLS_ctx.messages.length === 0) {
        const __VLS_31 = {}.NEmpty;
        /** @type {[typeof __VLS_components.NEmpty, ]} */ ;
        // @ts-ignore
        const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
            description: "No messages yet. Send a prompt to generate an image.",
            ...{ class: "py-12" },
        }));
        const __VLS_33 = __VLS_32({
            description: "No messages yet. Send a prompt to generate an image.",
            ...{ class: "py-12" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    }
    for (const [msg] of __VLS_getVForSourceType((__VLS_ctx.messages))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (msg.id),
            ...{ class: "flex gap-3" },
            ...{ class: (msg.role === 'user' ? 'justify-end' : 'justify-start') },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "max-w-[80%] rounded-lg p-3" },
            ...{ class: (msg.role === 'user'
                    ? 'bg-primary/10 text-foreground'
                    : 'bg-muted text-foreground') },
        });
        if (msg.content) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "whitespace-pre-wrap text-sm" },
            });
            (msg.content);
        }
        if (msg.role === 'assistant' && msg.status !== 'completed') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "mt-2" },
            });
            const __VLS_35 = {}.NTag;
            /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.NTag, ]} */ ;
            // @ts-ignore
            const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
                type: (msg.status === 'failed' ? 'error' : 'info'),
                size: "small",
            }));
            const __VLS_37 = __VLS_36({
                type: (msg.status === 'failed' ? 'error' : 'info'),
                size: "small",
            }, ...__VLS_functionalComponentArgsRest(__VLS_36));
            __VLS_38.slots.default;
            (msg.status);
            var __VLS_38;
            if (msg.status === 'processing' || msg.status === 'pending') {
                const __VLS_39 = {}.NSpin;
                /** @type {[typeof __VLS_components.NSpin, ]} */ ;
                // @ts-ignore
                const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
                    size: "small",
                    ...{ class: "ml-2" },
                }));
                const __VLS_41 = __VLS_40({
                    size: "small",
                    ...{ class: "ml-2" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_40));
            }
        }
        if (msg.error) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "mt-1 text-xs text-red-500" },
            });
            (msg.error);
        }
        if (msg.images && msg.images.length > 0) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "mt-2 flex flex-wrap gap-2" },
            });
            for (const [img, idx] of __VLS_getVForSourceType((msg.images))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (idx),
                    ...{ class: "overflow-hidden rounded" },
                });
                const __VLS_43 = {}.NImage;
                /** @type {[typeof __VLS_components.NImage, ]} */ ;
                // @ts-ignore
                const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
                    src: (__VLS_ctx.getImageUrl(img.storageKey)),
                    width: "200",
                    lazy: true,
                    alt: (`Generated image ${idx + 1}`),
                }));
                const __VLS_45 = __VLS_44({
                    src: (__VLS_ctx.getImageUrl(img.storageKey)),
                    width: "200",
                    lazy: true,
                    alt: (`Generated image ${idx + 1}`),
                }, ...__VLS_functionalComponentArgsRest(__VLS_44));
            }
        }
        if (msg.role === 'assistant' && msg.provider) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "mt-1 text-xs text-muted-foreground" },
            });
            (msg.provider);
            (msg.model ? ` / ${msg.model}` : '');
        }
    }
}
var __VLS_22;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mt-4 flex items-end gap-3" },
});
const __VLS_47 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, ]} */ ;
// @ts-ignore
const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
    value: (__VLS_ctx.selectedProvider),
    options: (__VLS_ctx.availableProviders),
    size: "large",
    ...{ class: "w-36 shrink-0" },
    placeholder: (__VLS_ctx.t('aiStudio.selectProvider')),
}));
const __VLS_49 = __VLS_48({
    value: (__VLS_ctx.selectedProvider),
    options: (__VLS_ctx.availableProviders),
    size: "large",
    ...{ class: "w-36 shrink-0" },
    placeholder: (__VLS_ctx.t('aiStudio.selectProvider')),
}, ...__VLS_functionalComponentArgsRest(__VLS_48));
const __VLS_51 = {}.NInput;
/** @type {[typeof __VLS_components.NInput, ]} */ ;
// @ts-ignore
const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
    ...{ 'onKeydown': {} },
    value: (__VLS_ctx.messageInput),
    type: "textarea",
    size: "large",
    autosize: ({ minRows: 1, maxRows: 4 }),
    placeholder: (__VLS_ctx.t('aiStudio.typeMessage')),
    disabled: (__VLS_ctx.sendMessageMutation.isPending.value),
}));
const __VLS_53 = __VLS_52({
    ...{ 'onKeydown': {} },
    value: (__VLS_ctx.messageInput),
    type: "textarea",
    size: "large",
    autosize: ({ minRows: 1, maxRows: 4 }),
    placeholder: (__VLS_ctx.t('aiStudio.typeMessage')),
    disabled: (__VLS_ctx.sendMessageMutation.isPending.value),
}, ...__VLS_functionalComponentArgsRest(__VLS_52));
let __VLS_55;
let __VLS_56;
let __VLS_57;
const __VLS_58 = {
    onKeydown: (__VLS_ctx.handleKeydown)
};
var __VLS_54;
const __VLS_59 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.NButton, ]} */ ;
// @ts-ignore
const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    loading: (__VLS_ctx.sendMessageMutation.isPending.value),
    disabled: (!__VLS_ctx.messageInput.trim()),
}));
const __VLS_61 = __VLS_60({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    loading: (__VLS_ctx.sendMessageMutation.isPending.value),
    disabled: (!__VLS_ctx.messageInput.trim()),
}, ...__VLS_functionalComponentArgsRest(__VLS_60));
let __VLS_63;
let __VLS_64;
let __VLS_65;
const __VLS_66 = {
    onClick: (__VLS_ctx.handleSend)
};
__VLS_62.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_62.slots;
    const __VLS_67 = {}.NIcon;
    /** @type {[typeof __VLS_components.NIcon, typeof __VLS_components.NIcon, ]} */ ;
    // @ts-ignore
    const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({}));
    const __VLS_69 = __VLS_68({}, ...__VLS_functionalComponentArgsRest(__VLS_68));
    __VLS_70.slots.default;
    const __VLS_71 = {}.SendOutline;
    /** @type {[typeof __VLS_components.SendOutline, ]} */ ;
    // @ts-ignore
    const __VLS_72 = __VLS_asFunctionalComponent(__VLS_71, new __VLS_71({}));
    const __VLS_73 = __VLS_72({}, ...__VLS_functionalComponentArgsRest(__VLS_72));
    var __VLS_70;
}
var __VLS_62;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[calc(100vh-8rem)]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[calc(100vh-20rem)]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-[80%]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-pre-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-muted-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-36']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NIcon: NIcon,
            NInput: NInput,
            NSelect: NSelect,
            NSpin: NSpin,
            NEmpty: NEmpty,
            NImage: NImage,
            NTag: NTag,
            ArrowBackOutline: ArrowBackOutline,
            SendOutline: SendOutline,
            PageHeader: PageHeader,
            t: t,
            router: router,
            messageInput: messageInput,
            selectedProvider: selectedProvider,
            messagesContainer: messagesContainer,
            availableProviders: availableProviders,
            isLoading: isLoading,
            isError: isError,
            messages: messages,
            chatTitle: chatTitle,
            sendMessageMutation: sendMessageMutation,
            handleSend: handleSend,
            handleKeydown: handleKeydown,
            getImageUrl: getImageUrl,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
