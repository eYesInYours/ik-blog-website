export interface UserInfo {
  id: number
  email: string
  username: string
  avatar?: string
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface AuthResponse {
  token: string
  user: UserInfo
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  username: string
} 