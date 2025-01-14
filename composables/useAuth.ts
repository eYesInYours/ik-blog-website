import type { LoginCredentials, RegisterCredentials, UserInfo, AuthResponse, ApiResponse } from '~/types'
import { logger } from '~/utils/logger'

export const useAuth = () => {
  const userStore = useUserStore()
  const { $request } = useNuxtApp()
  const { successToast } = useToastMsg()

  // 登录
  const login = async (credentials: { email: string; password: string }) => {
    try {
      const { data, error } = await $request.post('/auth/login', credentials)
      if (error.value) throw error.value
      
      if (data.value?.code === 200) {
        userStore.setLoginState(data.value.data.token, data.value.data.user)
        successToast('登录成功')
        return true
      }
      return false
    } catch (err) {
      console.error('登录失败:', err)
      throw err
    }
  }

  // 注册
  const register = async (credentials: RegisterCredentials) => {
    try {
      const response = await request.post<ApiResponse>('/auth/register', credentials)

      if (response.code === 200) {
        return true
      }

      throw new Error(response.message)
    } catch (error) {
      logger.error('注册失败', error)
      return false
    }
  }

  // 登出
  const logout = () => {
    userStore.logout()
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const response = await request.get<ApiResponse<UserInfo>>('/auth/user')
      if (response.code === 200 && response.data) {
        userStore.updateUserInfo(response.data)
        return response.data
      }
      return null
    } catch (error) {
      logger.error('获取用户信息失败', error)
      return null
    }
  }

  // 检查登录状态
  const checkAuth = async () => {
    await userStore.initializeState()
  }

  // 初始化时检查登录状态
  onMounted(() => {
    checkAuth()
  })

  return {
    userInfo: computed(() => userStore.getUserInfo),
    token: computed(() => userStore.getToken),
    login,
    register,
    logout,
    checkAuth,
    fetchUserInfo,
  }
}
