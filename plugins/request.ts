export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();
    const userStore = useUserStore();
    const { errorToast } = useToastMsg();

    console.log('request plugin 初始化:', {
        baseURL: config.public.apiBase,
        token: userStore.token
    });

    // 通用配置和拦截器
    const defaultOptions = {
        baseURL: config.public.apiBase,
        // 请求拦截器
        onRequest({ options }) {
            // 添加认证头
            options.headers = {
                Authorization: userStore.token ? `Bearer ${userStore.token}` : '',
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
        onResponseError({ response }) {
            console.error('请求错误:', response);
            switch (response._data.code) {
                case 401:
                    errorToast('未登录或登录已过期');
                    userStore.setLoginState('', null);
                    navigateTo('/login');
                    break;
                case 403:
                    errorToast('无权访问');
                    break;
                case 404:
                    errorToast('资源不存在');
                    break;
                default:
                    errorToast(response._data?.message || '请求失败');
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
