// https://nuxt.com/docs/api/configuration/nuxt-config
import { createResolver } from '@nuxt/kit'
import type { NuxtConfig } from '@nuxt/schema'
const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@nuxt/ui',
    '@nuxtjs/color-mode',
    '@nuxt/content',
  ],

  app: {
    // global transition
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

  // module::pinia
  pinia: {
    storesDirs: ['~/stores/**', '#/stores/**', '@/stores/**'],
  },

  // module::headlessui
  headlessui: {
    prefix: 'Headless',
  },

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
    icons: ['ph'],
    notifications: {
      position: 'top-right'
    }
  },

  runtimeConfig: {
    // 私有配置（仅在服务端可用）
    apiSecret: '',
    // 公共配置（客户端可用）
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      env: process.env.NODE_ENV || 'development',
      weatherApiKey: process.env.NUXT_PUBLIC_WEATHER_API_KEY
    },
  },

  compatibilityDate: '2025-01-10',
})