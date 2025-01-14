export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();
    const userStore = useUserStore();

    const $request = $fetch.create({
        baseURL: config.public.apiBase,
        
        /** 请求拦截器 */
        onRequest: ({ options }) => {
            if (userStore.token) {
                options.headers = options.headers || {};
                (options.headers as Record<string, string>).Authorization = `Bearer ${userStore.token}`;
            }
        },
        
        /** 响应拦截器 */
        onResponse({ response }) {
            if (response.status >= 200 && response.status < 300) {
                response._data = response._data ?? null;
            }
        },
        
        /** 错误处理 */
        onResponseError({ response }) {
            console.error('请求错误:', response._data);
        }
    });

    return {
        provide: {
            request: $request
        }
    };
}); 