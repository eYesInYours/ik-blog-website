// https://nuxt.com/docs/api/configuration/nuxt-config
import { createResolver } from '@nuxt/kit'
import type { NuxtConfig } from '@nuxt/schema'
const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  ssr: true,// 是否启用服务器端渲染
  
  modules: [
    '@pinia/nuxt',
    '@nuxt/ui',
    '@nuxtjs/color-mode',
    '@nuxt/content',
  ],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  css: [
    resolve('./assets/scss/_variables.scss'),
    resolve('./assets/scss/app.scss'),
  ],

  devtools: { enabled: true },

  imports: {
    dirs: [resolve('./stores'), '~/stores', '~/composables'],
  },

  pinia: {
    storesDirs: ['~/stores/**', '#/stores/**', '@/stores/**'],
  },

  // 组件配置
  components: [
    {
      prefix: 'Layout',
      path: resolve('./components/layouts'),
      global: true,
    },
    {
      prefix: 'Awesome',
      path: resolve('./components/awesome'),
      global: true,
    },
  ],

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light'
  },

  ui: {
    global: true,
    icons: ['heroicons'],
    notifications: {
      position: 'top-right'
    }
  },

  runtimeConfig: {
    apiSecret: '',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      env: process.env.NODE_ENV || 'development',
      weatherApiKey: process.env.NUXT_PUBLIC_WEATHER_API_KEY
    },
  },

  build: {
    transpile: ['@headlessui/vue']
  },

  compatibilityDate: '2025-01-10',

  plugins: [
    '~/plugins/request.ts'
  ],
})