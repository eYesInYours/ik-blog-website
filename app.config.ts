import type { RouteLocationRaw } from 'vue-router'
import type { NuxtApp } from 'nuxt/app'
import {
  AwesomeLayoutPageNavbarMenu,
} from './types'

export interface NuxtAwesomeAppConfig {
  /** title name */
  name?: string
  /** description */
  description?: string

  /** project config */
  project?: {
    /** links */
    links?: {
      /** project github link */
      github?: string
    }
  }

  /** layout config */
  layout?: {
    /** page layout */
    page?: {
      /** navbar */
      navbar?: {
        /** menus in navbar */
        menus?: AwesomeLayoutPageNavbarMenu[]
      }
    }
    /** footer */
    footer?: {
      /** footer year */
      year?: number
    }
    /** welcome component page */
    welcome?: {
      title?: string
      disableInfoReplaceIndexInWelcomePage?: boolean
      primaryActionButton?: {
        title?: string
        to?: RouteLocationRaw | ((nuxt: NuxtApp) => RouteLocationRaw)
      }
      secondaryActionButton?: {
        title?: string
        to?: RouteLocationRaw | ((nuxt: NuxtApp) => RouteLocationRaw)
      }
    }
  }

  /** author config */
  author?: {
    /** author name */
    name?: string
    /** author links */
    links?: {
      /** author github link */
      github?: string
      /** author medium link */
      medium?: string
      /** author website link */
      website?: string
    }
  }

  /** author config */
  disableInfoReplaceIndexInWelcomePage?: boolean

  /** admin layout config */
  admin?: {
    /** admin menus */
    menus?: {
      /** top navigation */
      nav?: Array<{
        key: string
        title: string
        to?: string
      }>
      /** side menus */
      side?: Array<{
        key: string
        title: string
        icon?: string
        children?: Array<{
          key: string
          title: string
          to: string
        }>
      }>
    }
  }
}

declare module '@nuxt/schema' {
  interface AppConfigInput {
    awesome?: NuxtAwesomeAppConfig
  }
}

export default defineAppConfig({
  awesome: {
    name: '小书斋',
    description:
      '个人博客',
    project: {
      links: {
        github: 'https://github.com/viandwi24/nuxt3-awesome-starter',
      },
    },
    layout: {
      page: {
        navbar: {
          menus: [
            { type: 'link', title: '首页', to: { name: 'index' } },
            { type: 'link', title: '朋友圈', to: { name: 'diary' } },
            { type: 'link', title: '归档', to: { name: 'archive' } },
            // { type: 'link', title: 'Post', to: { name: 'post' } },
            { type: 'link', title: '消息', to: { name: 'comments' } },
            { type: 'button', title: '个人中心', to: { name: 'setting' } },
            // {
            //   type: 'dropdown',
            //   title: 'Documentations',
            //   children: [
            //     {
            //       type: 'link',
            //       title: 'Components',
            //       to: { name: 'components' },
            //     },
            //   ],
            // },
            // dynamic title
            // {
            //   type: 'button',
            //   title: (nuxt) =>
            //     (nuxt._appConfig as AppConfigInput)?.awesome?.name || '',
            //   to: (nuxt) => (nuxt._appConfig as AppConfigInput)?.awesome?.name || '',
            // },
          ],
        },
      },
      footer: {
        year: new Date().getFullYear(),
      },
      welcome: {
        title: 'Nuxt&nbsp;3 Awesome Starter',
        disableInfoReplaceIndexInWelcomePage: true,
        primaryActionButton: {
          title: 'Nuxt 3',
          to: 'https://nuxt.com/',
        },
        secondaryActionButton: {
          title: 'Github',
          to: 'https://github.com/viandwi24/nuxt3-awesome-starter',
        },
      },
    },
    author: {
      name: 'viandwi24',
      links: {
        github: 'https://github.com/viandwi24',
        medium: 'https://viandwi24.medium.com',
        website: 'https://viandwi24.site',
      },
    },
    disableInfoReplaceIndexInWelcomePage: false,
  } as NuxtAwesomeAppConfig,
  nuxtIcon: {
    aliases: {},
    class: '',
    size: '1em',
  },
})
