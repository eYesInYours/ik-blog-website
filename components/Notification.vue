<script setup lang="ts">
import { useNotificationStore } from '~/stores/notification'
import { TransitionGroup } from 'vue'

const store = useNotificationStore()

// 获取图标
const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return 'i-carbon-checkmark-filled'
    case 'error':
      return 'i-carbon-error-filled'
    case 'warning':
      return 'i-carbon-warning-filled'
    case 'info':
      return 'i-carbon-information-filled'
    default:
      return 'i-carbon-information'
  }
}

// 获取颜色类
const getColorClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 text-green-500 dark:bg-green-900/20 dark:text-green-400'
    case 'error':
      return 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400'
    case 'warning':
      return 'bg-yellow-50 text-yellow-500 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'info':
      return 'bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400'
    default:
      return 'bg-gray-50 text-gray-500 dark:bg-gray-900/20 dark:text-gray-400'
  }
}
</script>

<template>
  <TransitionGroup 
    tag="div"
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-y-2 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-2 opacity-0"
    class="fixed top-4 right-4 z-50 flex flex-col gap-2"
  >
    <div
      v-for="notification in store.notifications"
      :key="notification.id"
      :class="[
        'flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg max-w-sm',
        getColorClass(notification.type)
      ]"
    >
      <i :class="getIcon(notification.type)" class="text-xl flex-shrink-0" />
      <span class="text-sm">{{ notification.message }}</span>
      <button
        @click="store.remove(notification.id)"
        class="ml-2 p-1 hover:opacity-70 transition-opacity"
      >
        <i class="i-carbon-close text-sm" />
      </button>
    </div>
  </TransitionGroup>
</template> 