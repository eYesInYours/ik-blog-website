import { defineStore } from 'pinia'
import type { UserInfo, ApiResponse } from '~/types'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: null as string | null,
    userInfo: null as UserInfo | null,
  }),

  getters: {
    // 获取用户信息
    getUserInfo: (state) => state.userInfo,
    // 获取token
    getToken: (state) => state.token,
  },

  actions: {
    // 设置登录状态
    setLoginState(token: string, userInfo: UserInfo) {
      this.token = token
      this.userInfo = userInfo
      // 存储token到本地
      localStorage.setItem('token', token)
    },

    // 清除登录状态
    clearLoginState() {
      this.token = null
      this.userInfo = null
      localStorage.removeItem('token')
    },

    // 更新用户信息
    updateUserInfo(userInfo: Partial<UserInfo>) {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...userInfo }
      }
    },

    // 初始化状态
    async initializeState() {
      const token = localStorage.getItem('token')
      if (token) {
        this.token = token
        try {
          const { fetchApi } = useApi()
          const response = await fetchApi<ApiResponse<UserInfo>>('/users/info')
          if (response.code === 200 && response.data) {
            this.userInfo = response.data
          }
        } catch (error) {
          this.clearLoginState()
        }
      }
    },
  },
}) 