import type { UseFetchOptions } from 'nuxt/app'

export const useApi = () => {
  const config = useRuntimeConfig()
  const { showError } = useError()
  const toast = useToast()

  const fetchApi = async <T>(
    url: string,
    opts: UseFetchOptions<any> = {}
  ): Promise<T> => {
    try {
      const { data, error } = await useFetch<T>(url, {
        baseURL: config.public.apiBase,
        method: (opts.method as any) || 'GET',
        ...opts,
        // 统一错误处理
        onResponseError: ({ response }) => {
          const message = response._data?.message || '请求失败'
          const errorCode = response.status

          // 显示错误通知
          toast.add({
            title: '错误提示',
            description: message,
            color: 'red',
            icon: 'i-carbon-warning-alt',
            timeout: 5000
          })

          // 特殊错误处理
          switch (errorCode) {
            case 401:
              // 未登录或 token 失效
              navigateTo('/login')
              break
            case 403:
              // 无权限
              showError({
                statusCode: 403,
                message: '无权访问'
              })
              break
            case 404:
              // 资源不存在
              showError({
                statusCode: 404,
                message: '资源不存在'
              })
              break
          }

          throw new Error(message)
        },
        // 响应拦截
        transform: (response) => {
          // 成功消息提示（可选）
          if (opts.method && opts.method !== 'GET' && response?.message) {
            notification.add({
              title: '操作成功',
              description: response.message,
              type: 'success',
              icon: 'i-heroicons-check-circle',
              timeout: 3000
            })
          }
          return response
        }
      })

      if (error.value) {
        throw error.value
      }

      return data.value as T
    } catch (err: any) {
      console.error('API 请求错误:', err)
      throw err
    }
  }

  return {
    fetchApi
  }
}
