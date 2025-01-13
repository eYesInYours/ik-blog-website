import type { UseFetchOptions } from 'nuxt/app'

export const useApi = () => {
  const config = useRuntimeConfig()
  const userStore = useUserStore()
  const { errorToast } = useToastMsg()

  const fetchApi = async <T>(
    url: string,
    opts: UseFetchOptions<any> = {}
  ): Promise<T> => {
    try {
      const { data, error } = await useFetch<T>(url, {
        baseURL: config.public.apiBase,
        method: (opts.method as any) || 'GET',
        ...opts,
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
        onResponseError: ({ response }) => {
          const message = response._data?.message || '请求失败'
          const errorCode = response.status

          // 使用封装的 toast
          errorToast(message)

          switch (errorCode) {
            case 401:
              navigateTo('/login')
              break
            case 403:
              errorToast('无权访问')
              break
            case 404:
              errorToast('资源不存在')
              break
          }

          throw new Error(message)
        }
      })

      if (error.value) throw error.value
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
