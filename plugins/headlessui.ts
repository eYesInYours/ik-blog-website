import { Menu, Dialog, Disclosure, Popover } from '@headlessui/vue'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('Menu', Menu)
  nuxtApp.vueApp.component('Dialog', Dialog)
  nuxtApp.vueApp.component('Disclosure', Disclosure)
  nuxtApp.vueApp.component('Popover', Popover)
}) 