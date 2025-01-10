import { ref } from 'vue'

export const useNotification = () => {
  const notificationRef = ref()

  const show = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    notificationRef.value?.show(message, type)
  }

  const success = (message: string) => {
    notificationRef.value?.success(message)
  }

  const error = (message: string) => {
    notificationRef.value?.error(message)
  }

  const warning = (message: string) => {
    notificationRef.value?.warning(message)
  }

  const info = (message: string) => {
    notificationRef.value?.info(message)
  }

  return {
    notificationRef,
    show,
    success,
    error,
    warning,
    info
  }
} 