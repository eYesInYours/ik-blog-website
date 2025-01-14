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
      // 仅在客户端存储token
      if (process.client) {
        localStorage.setItem('token', token)
      }
      this.setUserInfo(userInfo)
    },

    // 清除登录状态
    clearLoginState() {
      this.token = null
      this.userInfo = null
      if (process.client) {
        localStorage.removeItem('token')
      }
    },

    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo
      if (process.client) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
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
          const { $request } = useNuxtApp()
          const response = await $request.get<ApiResponse<UserInfo>>('/users/info')
          if (response.code === 200 && response.data) {
            this.setUserInfo(response.data)
          }
        } catch (error) {
          this.clearLoginState()
        }
      }
    },
  },
})
