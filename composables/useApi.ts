export const useApi = () => {
  const { apiBaseUrl } = useEnvironment()
  const baseURL = apiBaseUrl.value as string
  const userStore = useUserStore()

  const fetchApi = $fetch.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    onRequest({ options }) {
      // 添加 token 到请求头
      const token = userStore.getToken
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
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