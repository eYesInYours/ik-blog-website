export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();
    const userStore = useUserStore();
    const { errorToast } = useToastMsg();

    console.log('request plugin 初始化:', {
        baseURL: config.public.apiBase,
        access_token: userStore.getAccessToken.value,
        refresh_token: userStore.getRefreshToken.value
    });

    // 通用配置和拦截器
    const defaultOptions = {
        baseURL: config.public.apiBase,
        // 请求拦截器
        onRequest({ options }) {
            // 添加认证头
            options.headers = {
                Authorization: userStore.getAccessToken.value ? `Bearer ${userStore.getAccessToken.value}` : '',
                'RefreshToken': userStore.getRefreshToken.value ? `Bearer ${userStore.getRefreshToken.value}` : '',
                ...options.headers
            };
        },
        // 响应拦截器
        onResponse({ response }) {
            if (response.status >= 200 && response.status < 300) {
                response._data = response._data.data
                console.log('response processed:', response._data)
            }
        },
        // 错误处理器
        onResponseError: async (error: any) => {
            const { response } = error
            const { code, message } = response._data
            console.log('response:', response._data)

            switch (code) {
                case 419:
                    // 令牌过期，尝试刷新
                    const refreshToken = userStore.getRefreshToken.value
                    if (refreshToken) {
                        try {
                            const { data } = await request.post('/auth/refresh')
                            // 更新 token
                            userStore.setLoginState({ access_token: data.value.access_token, refresh_token: data.value.refresh_token }, data.value.user)
                        } catch (refreshError: any) {
                            console.log('refreshError:', refreshError)
                            // 如果是 refresh_token 过期
                            if (refreshError._data.code === 401) {
                                userStore.clearLoginState()
                                navigateTo('/login')
                                return Promise.reject(new Error('登录已过期，请重新登录'))
                            }
                            return Promise.reject(refreshError)
                        }
                    }
                    break
                case 401:
                    // 未授权（未登录）
                    userStore.clearLoginState()
                    navigateTo('/login')
                    return Promise.reject(new Error('请先登录'))
                default:
                    return Promise.reject(error)
            }
        }
    };

    // 封装请求方法
    const request = {
        get: <T = any>(url: string, params?: any, options: any = {}) => {
            console.log('GET 请求:', url, params);
            return useFetch<T>(url, {
                ...defaultOptions,
                method: 'GET',
                params,
                ...options
            });
        },

        post: <T = any>(url: string, data?: any, options: any = {}) => {
            console.log('POST 请求:', url, data);
            return useFetch<T>(url, {
                ...defaultOptions,
                method: 'POST',
                body: data,
                ...options
            });
        },

        put: <T = any>(url: string, data?: any, options: any = {}) => {
            console.log('PUT 请求:', url, data);
            return useFetch<T>(url, {
                ...defaultOptions,
                method: 'PUT',
                body: data,
                ...options
            });
        },

        delete: <T = any>(url: string, params?: any, options: any = {}) => {
            console.log('DELETE 请求:', url, params);
            return useFetch<T>(url, {
                ...defaultOptions,
                method: 'DELETE',
                params,
                ...options
            });
        }
    };

    return {
        provide: {
            request
        }
    };
});

// 声明模块扩展类型
declare module '#app' {
    interface NuxtApp {
        $request: {
            get: <T = any>(url: string, params?: any, options?: any) => ReturnType<typeof useFetch<T>>;
            post: <T = any>(url: string, data?: any, options?: any) => ReturnType<typeof useFetch<T>>;
            put: <T = any>(url: string, data?: any, options?: any) => ReturnType<typeof useFetch<T>>;
            delete: <T = any>(url: string, params?: any, options?: any) => ReturnType<typeof useFetch<T>>;
        }
    }
}
