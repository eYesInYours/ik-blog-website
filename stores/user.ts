import { defineStore } from 'pinia'
import type { UserInfo, ApiResponse } from '~/types'
import { computed } from 'vue'
import { useNuxtApp } from '#app'

export const useUserStore = defineStore('user', {
  state: () => ({
    access_token: null,
    refresh_token: null,
    userInfo: null as UserInfo | null,
  }),

  getters: {
    // 获取用户信息
    getUserInfo: (state) => computed(() => state.userInfo),
    // 获取token
    getAccessToken: (state) => computed(() => state.access_token),
    getRefreshToken: (state) => computed(() => state.refresh_token),
  },

  actions: {
    // 设置登录状态
    setLoginState(
      token: { access_token: string; refresh_token: string },
      userInfo: UserInfo,
    ) {
      const { access_token, refresh_token } = token
      this.access_token = access_token
      this.refresh_token = refresh_token

      if (import.meta.client) {
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
      }
      this.setUserInfo(userInfo)
    },

    // 清除登录状态
    clearLoginState() {
      this.access_token = this.refresh_token = null
      this.userInfo = null
      if (import.meta.client) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('userInfo')
      }
    },

    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    },

    // 更新用户信息
    updateUserInfo(userInfo: Partial<UserInfo>) {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...userInfo }
      }
    },

    // 初始化状态
    async initializeState() {
      if (!import.meta.client) return

      const access_token = localStorage.getItem('access_token')
      const refresh_token = localStorage.getItem('refresh_token')
      
      if (access_token) {
        this.access_token = access_token
        this.refresh_token = refresh_token
        try {
          const { $request } = useNuxtApp()
          const { data } = await $request.get('/users/info')
          this.setUserInfo(data.value)
        } catch (error) {
          this.clearLoginState()
        }
      }
    },
  },
})
