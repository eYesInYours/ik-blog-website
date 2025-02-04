<script setup lang="ts">
import type { AwesomeLayoutPageNavbarMenu, AwesomeLayoutPageNavbarMenuDropdownItem } from '~/types'
const { $request } = useNuxtApp()

const { parseMenuRoute, parseMenuTitle } = useNavbarParser()
const notificationStore = useNotificationStore()
const userStore = useUserStore()

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

// 检查是否应该显示通知功能
const shouldShowNotification = computed(() => {
  return isNotificationIcon.value && !!userStore.getAccessToken.value
})

// 获取未读通知数
const fetchUnreadCount = async () => {
  // 只在用户已登录且有token时获取未读数
  if (!shouldShowNotification.value) {
    return
  }

  try {
    const { data, error } = await $request.get('/notifications/unread-count')
    if (error.value) throw error.value
    console.log('data',data)
    notificationStore.setUnreadCount(data.value?.count)
  } catch (err) {
    console.error('获取未读通知数失败:', err)
  }
}

// 监听登录状态变化
watch(() => userStore.getAccessToken.value, (newVal) => {
  if (newVal) {
    fetchUnreadCount()
  } else {
    // 用户登出时清空未读数
    notificationStore.clearUnreadCount()
  }
})

// 定时刷新未读数（每分钟）
let refreshInterval: NodeJS.Timer
onMounted(() => {
  if (shouldShowNotification.value) {
    fetchUnreadCount()
    refreshInterval = setInterval(fetchUnreadCount, 60000)
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
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
      :title="parseMenuTitle(menu.title)">
      <UIcon :name="menu.icon" class="text-xl" />
      <!-- 通知徽标 -->
      <span
        v-if="shouldShowNotification && !!notificationStore.unreadCount"
        class="notification-badge"
      >
        {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
      </span>
    </NuxtLink>
  </template>
</template>

<style lang="scss" scoped>
.notification-badge {
  @apply absolute top-0 -right-1
         min-w-[14px] h-[14px]
         flex items-center justify-center
         text-[10px] font-medium leading-none
         text-white bg-red-500
         rounded-full px-1;

  /* 添加动画效果 */
  animation: badge-pulse 2s infinite;

  /* 超出省略号 */
  &:has(> span) {
    @apply truncate;
    max-width: 26px;
  }
}

@keyframes badge-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* 暗色模式 */
:root[class~="dark"] {
  .notification-badge {
    @apply bg-red-600;
  }
}
</style>
