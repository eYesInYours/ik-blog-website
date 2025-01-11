export const useToastMsg = () => {
  const toast = useToast()

  const successToast = (message: string, timeout?: number) => {
    toast.add({
      title: '成功',
      description: message,
      color: 'green',
      icon: 'i-heroicons-check-circle',
      timeout: timeout || 3000
    })
  }

  const errorToast = (message: string, timeout?: number) => {
    toast.add({
      title: '错误提示',
      description: message,
      color: 'red',
      icon: 'i-heroicons-exclamation-circle',
      timeout: timeout || 5000
    })
  }

  const warningToast     = (message: string, timeout?: number) => {
    toast.add({
      title: '警告',
      description: message,
      color: 'yellow',
      icon: 'i-heroicons-exclamation-triangle',
      timeout: timeout || 4000
    })
  }

  const infoToast    = (message: string, timeout?: number) => {
    toast.add({
      title: '提示',
      description: message,
      color: 'blue',
      icon: 'i-heroicons-information-circle',
      timeout: timeout || 3000
    })
  }

  return {
    successToast,
    errorToast,
    warningToast,
    infoToast
  }
} 