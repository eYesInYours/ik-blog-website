export const logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, ...args)
    }
  },
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error)
    }
    // 在生产环境可以集成错误追踪服务
    if (process.env.NODE_ENV === 'production') {
      // TODO: 发送错误到监控服务
    }
  }
} 