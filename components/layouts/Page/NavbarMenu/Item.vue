<script setup lang="ts">
import type { AwesomeLayoutPageNavbarMenu, AwesomeLayoutPageNavbarMenuDropdownItem } from '~/types'

const { parseMenuRoute, parseMenuTitle } = useNavbarParser()
const notificationStore = useNotificationStore()

const props = defineProps({
  menu: {
    type: Object as () =>
      | AwesomeLayoutPageNavbarMenu
      | AwesomeLayoutPageNavbarMenuDropdownItem,
    required: true,
  },
  isDropdown: {
    type: Boolean,
    default: false,
  },
})

// 检查是否为通知图标
const isNotificationIcon = computed(() => {
  return props.menu.type === 'icon' &&
    props.menu.icon?.includes('notification') &&
    typeof parseMenuRoute(props.menu.to) === 'object' &&
    parseMenuRoute(props.menu.to).name === 'notifications'
})
</script>

<template>
  <template v-if="menu?.type === 'link' && isDropdown">
    <NuxtLink :to="parseMenuRoute(menu?.to)" #="{ isActive }">
      <div :class="[
        'transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded-lg w-full',
        isActive
          ? 'text-gray-900 dark:text-gray-100 font-bold'
          : 'text-gray-700 dark:text-gray-300',
      ]">
        {{ parseMenuTitle(menu?.title) }}
      </div>
    </NuxtLink>
  </template>
  <template v-else-if="menu?.type === 'link'">
    <NuxtLink :to="parseMenuRoute(menu?.to)" #="{ isActive }">
      <span :class="{
        'text-gray-900 dark:text-gray-100 font-bold': isActive,
        'text-gray-700 dark:text-gray-300': !isActive,
      }">{{ parseMenuTitle(menu?.title) }}</span>
    </NuxtLink>
  </template>
  <template v-else-if="menu?.type === 'button'">
    <AwesomeButton :text="parseMenuTitle(menu?.title)" size="xs" :to="parseMenuRoute(menu.to)" />
  </template>
  <template v-else-if="menu?.type === 'icon'">
    <NuxtLink :to="parseMenuRoute(menu.to)" #="{ isActive }"
      class="relative inline-flex items-center py-2 text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
      :class="{
        'text-gray-900 dark:text-gray-100': isActive,
      }" :title="parseMenuTitle(menu.title)">
      <UIcon :name="menu.icon" class="text-xl" />
      <!-- 通知徽标 -->
      <span v-if="isNotificationIcon && notificationStore.unreadCount > 0"
        class="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-xs text-white bg-red-500 rounded-full px-1">
        {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
      </span>
    </NuxtLink>
  </template>
</template>
