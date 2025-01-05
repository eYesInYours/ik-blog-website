import { createResolver } from '@nuxt/kit'
import type { NuxtConfig } from '@nuxt/schema'
const { resolve } = createResolver(import.meta.url)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // exp
  experimental: {
    localLayerAliases: true,
  },

  devServer: {
    port: parseInt(process.env.PORT || '3010'),
  },

  // app config
  app: {
    // global transition
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  // typescripts
  // todo: feat/strict-type-check
  // typescript: {
  //   strict: true,
  //   typeCheck: true,
  // },

  // modules
  modules: [// chore
  // ['@nuxtjs/eslint-module', {
  //   // 仅在构建时检查，不在开发时实时检查
  //   lintOnStart: false,
  //   // 关闭开发时的实时检查
  //   cache: false
  // }], // styling & ui
  '@nuxtjs/tailwindcss', 'nuxt-headlessui', 'nuxt-icon', '@nuxtjs/color-mode', // management
  '@pinia/nuxt', '@vueuse/nuxt', // contents,
  // todo: feat/localization
  // '@nuxtjs/i18n'
  '@nuxt/content'],

  css: [
    resolve('./assets/scss/_variables.scss'),
    resolve('./assets/scss/app.scss'),
  ],

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

  // module::color-mode
  colorMode: {
    classSuffix: '',
  },

  // module::content
  // todo: feat/localization
  // module::i18n
  // i18n: {
  //   strategy: 'no_prefix',
  //   defaultLocale: 'en',
  //   langDir: 'locales',
  //   vueI18n: {
  //     fallbackLocale: 'en',
  //   },
  //   detectBrowserLanguage: {
  //     useCookie: true,
  //     fallbackLocale: 'en',
  //     redirectOn: 'root',
  //   },
  //   locales: [
  //     {
  //       code: 'en', // English
  //       iso: 'en-US',
  //       name: 'English',
  //       file: 'en.yml',
  //     },
  //     {
  //       code: 'id', // Indonesia
  //       iso: 'id-ID',
  //       name: 'Indonesia',
  //       file: 'id.yml',
  //     }
  //   ]
  // },
  content: {
    markdown: {
      mdc: true,
    },
    highlight: {
      theme: 'github-dark',
    },
  },

  runtimeConfig: {
    // 私有配置（仅在服务端可用）
    apiSecret: '',
    // 公共配置（客户端可用）
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      env: process.env.NODE_ENV || 'development',
    },
  },

  // 开发环境特定配置
  devtools: {
    enabled: process.env.NODE_ENV === 'development'
  },

  compatibilityDate: '2025-01-03',
})
