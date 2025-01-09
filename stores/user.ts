import { defineStore } from 'pinia'
import type { UserInfo, ApiResponse } from '~/types'
import { computed } from 'vue'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: process.client ? localStorage.getItem('token') : null as string | null,
    userInfo: null as UserInfo | null,
  }),

  getters: {
    // 获取用户信息
    getUserInfo: (state) => computed(() => state.userInfo),
    // 获取token
    getToken: (state) => computed(() => state.token),
  },

  actions: {
    // 设置登录状态
    setLoginState(token: string, userInfo: UserInfo) {
      this.token = token
      this.userInfo = userInfo
      // 仅在客户端存储token
      if (process.client) {
        localStorage.setItem('token', token)
      }
    },

    // 清除登录状态
    clearLoginState() {
      this.token = null
      this.userInfo = null
      if (process.client) {
        localStorage.removeItem('token')
      }
    },

    // 更新用户信息
    updateUserInfo(userInfo: Partial<UserInfo>) {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...userInfo }
      }
    },

    // 初始化状态
    async initializeState() {
      const token = process.client ? localStorage.getItem('token') : null
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
