export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  nickname: string
}

export interface UserInfo {
  id: number
  email: string
  nickname: string
  avatar?: string
}

export interface AuthResponse {
  code: number
  message: string
  data: {
    token: string
    user: UserInfo
  }
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
} 