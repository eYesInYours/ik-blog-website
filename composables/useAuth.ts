import type { LoginCredentials, RegisterCredentials, UserInfo, AuthResponse, ApiResponse } from '~/types'
import { logger } from '~/utils/logger'
import { useUserStore } from '~/stores/user'

export const useAuth = () => {
  const { fetchApi } = useApi()
  const userStore = useUserStore()

  // 登录
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await fetchApi<ApiResponse<AuthResponse>>('/auth/login', {
        method: 'POST',
        body: credentials,
      })

      if (response.code === 200 && response.data) {
        userStore.setLoginState(response.data.token, response.data.user)
        logger.info('用户登录成功', userStore.getUserInfo)
        return true
      }
      
      throw new Error(response.message)
    } catch (error) {
      logger.error('登录失败', error)
      return false
    }
  }

  // 注册
  const register = async (credentials: RegisterCredentials) => {
    try {
      const response = await fetchApi<ApiResponse>('/auth/register', {
        method: 'POST',
        body: credentials,
      })

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
  const logout = async () => {
    try {
      const response = await fetchApi<ApiResponse>('/auth/logout', {
        method: 'POST',
      })

      if (response.code === 200) {
        userStore.clearLoginState()
      }
    } catch (error) {
      logger.error('登出失败', error)
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const response = await fetchApi<ApiResponse<UserInfo>>('/auth/user')
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
    isLoggedIn: computed(() => userStore.getIsLoggedIn),
    userInfo: computed(() => userStore.getUserInfo),
    token: computed(() => userStore.getToken),
    login,
    register,
    logout,
    checkAuth,
    fetchUserInfo,
  }
} 