export function formatDate(date: string | Date): string {
  const now = new Date()
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const diff = now.getTime() - targetDate.getTime()

  // 转换为秒、分钟、小时、天数
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  // 1分钟内显示"刚刚"
  if (seconds < 60) {
    return '刚刚'
  }

  // 1小时内显示"x分钟前"
  if (minutes < 60) {
    return `${minutes}分钟前`
  }

  // 24小时内显示"x小时前"
  if (hours < 24) {
    return `${hours}小时前`
  }

  // 7天内显示"x天前"
  if (days < 7) {
    return `${days}天前`
  }

  // 超过7天显示具体日期
  return targetDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 保留原有的格式化函数，重命名为 formatFullDate
export function formatFullDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('日期格式化错误:', error)
    return '日期无效'
  }
}

export function formatDateTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    console.error('日期格式化错误:', error)
    return '日期无效'
  }
}

export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = now.getTime() - dateObj.getTime()

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (years > 0) return `${years}年前`
    if (months > 0) return `${months}个月前`
    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    if (seconds > 0) return `${seconds}秒前`
    return '刚刚'
  } catch (error) {
    console.error('日期格式化错误:', error)
    return '日期无效'
  }
}
