import { storeToRefs } from 'pinia'

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string
  const userStore = useUserStore()

  const fetchApi = $fetch.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    onRequest({ options }) {
      // 添加 token 到请求头
      const { token } = storeToRefs(userStore)
      if (token.value) {
        console.log(token.value)
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`,
        }
      }
    },
    onResponseError({ response }) {
      const data = response._data
      const error = data?.message || '请求失败'

      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', {
          status: response.status,
          data: data,
          error,
        })
      }

      // 处理 401 未授权错误
      if (response.status === 401) {
        localStorage.removeItem('token')
        navigateTo('/login')
      }

      throw new Error(error)
    },
  })

  return {
    fetchApi,
  }
}
