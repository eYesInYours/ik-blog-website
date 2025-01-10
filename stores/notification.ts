import { defineStore } from 'pinia'

export interface Notification {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as Notification[],
    counter: 0
  }),

  actions: {
    add(notification: Omit<Notification, 'id'>) {
      const id = ++this.counter
      const duration = notification.duration ?? 3000 // 默认3秒

      this.notifications.push({
        ...notification,
        id
      })

      if (duration > 0) {
        setTimeout(() => {
          this.remove(id)
        }, duration)
      }

      return id
    },

    remove(id: number) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
    },

    // 快捷方法
    success(message: string, duration?: number) {
      return this.add({ type: 'success', message, duration })
    },

    error(message: string, duration?: number) {
      return this.add({ type: 'error', message, duration })
    },

    info(message: string, duration?: number) {
      return this.add({ type: 'info', message, duration })
    },

    warning(message: string, duration?: number) {
      return this.add({ type: 'warning', message, duration })
    }
  }
}) 