<script setup lang="ts">
import { ref } from 'vue'

interface NotificationItem {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

const notifications = ref<NotificationItem[]>([])
let notificationId = 0

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

// 显示通知
const show = (message: string, type: NotificationItem['type'] = 'info', duration = 3000) => {
  const id = ++notificationId
  notifications.value.push({ id, message, type })

  if (duration > 0) {
    setTimeout(() => {
      remove(id)
    }, duration)
  }
}

// 移除通知
const remove = (id: number) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// 快捷方法
const success = (message: string, duration?: number) => show(message, 'success', duration)
const error = (message: string, duration?: number) => show(message, 'error', duration)
const warning = (message: string, duration?: number) => show(message, 'warning', duration)
const info = (message: string, duration?: number) => show(message, 'info', duration)

// 暴露方法给外部使用
defineExpose({
  show,
  success,
  error,
  warning,
  info
})
</script>

<template>
  <ClientOnly>
    <TransitionGroup 
      tag="div"
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform -translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in absolute"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-2 opacity-0"
      class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none w-auto min-w-[320px] max-w-[420px]"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg pointer-events-auto w-full',
          'transform transition-all duration-300',
          getColorClass(notification.type)
        ]"
      >
        <i :class="[getIcon(notification.type), 'text-xl flex-shrink-0']" />
        <span class="text-sm flex-1 break-words">{{ notification.message }}</span>
        <button
          @click="remove(notification.id)"
          class="ml-2 p-1 hover:opacity-70 transition-opacity rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex-shrink-0"
        >
          <i class="i-carbon-close text-sm" />
        </button>
      </div>
    </TransitionGroup>
  </ClientOnly>
</template>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 确保通知显示在最顶层 */
:deep(.notification) {
  position: relative;
  z-index: 9999;
}

/* 适配移动端 */
@media (max-width: 640px) {
  :deep(.notification) {
    width: calc(100vw - 2rem);
    min-width: auto;
    margin: 0 1rem;
  }
}
</style> 