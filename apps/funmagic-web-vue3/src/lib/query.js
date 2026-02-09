export const queryClientConfig = {
    queryClientConfig: {
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                gcTime: 30 * 60 * 1000,
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    },
};
