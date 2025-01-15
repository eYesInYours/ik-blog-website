import type { RouteLocationRaw } from 'vue-router'

export interface AwesomeLayoutPageNavbarMenu {
  type: 'link' | 'button' | 'icon' | 'dropdown'
  title: string | ((nuxt: any) => string)
  to?: RouteLocationRaw | ((nuxt: any) => RouteLocationRaw)
  icon?: string
  children?: AwesomeLayoutPageNavbarMenu[]
  requireAuth?: boolean
}

export interface AwesomeLayoutPageNavbarMenuDropdownItem {
  type: 'link'
  title: string
  to: RouteLocationRaw
} 