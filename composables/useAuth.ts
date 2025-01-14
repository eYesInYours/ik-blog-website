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
      userStore.setLoginState(data.value.token, data.value.user)
      successToast('登录成功')
    } catch (err) {
      console.error('登录失败:', err)
      throw err
    }
  }

  // 注册
  const register = async (credentials: RegisterCredentials) => {
    try {
      const { data, error } = await $request.post('/auth/register', credentials)
      if (error.value) throw error.value
      userStore.setLoginState(data.value.token, data.value.user)
      successToast('注册成功')
    } catch (error) {
      logger.error('注册失败', error)
      throw error
    }
  }

  // 登出
  const logout = () => {
    userStore.clearLoginState()
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const { data } = await $request.get('/auth/user')
      userStore.updateUserInfo(data.value.user)
      return data.value.user
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
