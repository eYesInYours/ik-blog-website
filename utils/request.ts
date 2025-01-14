import type { UseFetchOptions } from "nuxt/app";

// HTTP 请求的方法类型
type Methods = "GET" | "POST" | "DELETE" | "PUT";

// 请求结果数据格式
export interface IResultData<T> {
    code: number;
    data: T;
    msg: string;
}

/**
 * api请求封装
 */
class HttpRequest {
    request<T = any>(url: string, method: Methods, data?: any, options?: UseFetchOptions<T>) {
        const config = useRuntimeConfig();
        const userStore = useUserStore();
        
        // 继承UseFetchOptions类型
        const newOptions: UseFetchOptions<T> = {
            baseURL: config.public.apiBase,
            method,
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: userStore.token ? `Bearer ${userStore.token}` : '',
                ...options?.headers
            }
        };

        // 根据请求方法处理数据
        if (method === "GET" || method === "DELETE") {
            newOptions.params = data;
        }
        if (method === "POST" || method === "PUT") {
            newOptions.body = data;
        }

        // 发送请求
        return useFetch(url, newOptions);
    }

    // 封装常用方法
    get<T = any>(url: string, params?: any, options?: UseFetchOptions<T>) {
        return this.request<T>(url, "GET", params, options);
    }

    post<T = any>(url: string, data?: any, options?: UseFetchOptions<T>) {
        return this.request<T>(url, "POST", data, options);
    }

    put<T = any>(url: string, data?: any, options?: UseFetchOptions<T>) {
        return this.request<T>(url, "PUT", data, options);
    }

    delete<T = any>(url: string, params?: any, options?: UseFetchOptions<T>) {
        return this.request<T>(url, "DELETE", params, options);
    }
}

export default new HttpRequest(); 