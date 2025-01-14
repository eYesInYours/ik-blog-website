<script lang="ts" setup>
definePageMeta({ layout: false })
useHead({ title: '登录' })

const { login } = useAuth()
const router = useRouter()
const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const rememberMe = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    await login({
      email: form.value.email,
      password: form.value.password
    })

    router.push('/')
  } catch (e: any) {
    console.log(e)
    error.value = e.message || '登录时发生错误'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-wrapper">
    <div class="auth-card">
      <!-- 左侧背景图 -->
      <div class="auth-background">
        <img src="/login-bg.jpg" alt="背景" class="w-full h-full object-cover">
      </div>

      <!-- 右侧登录表单 -->
      <div class="auth-form-container">
        <div class="auth-form">
          <h1 class="text-2xl font-bold mb-8">精灵学院</h1>
          <h2 class="text-xl font-semibold mb-6">登入账户 🔑</h2>

          <form @submit.prevent="handleLogin" class="space-y-6">
            <!-- 邮箱输入框 -->
            <div>
              <label class="block text-sm font-medium mb-1">邮箱</label>
              <input v-model="form.email"
                     type="email"
                     required
                     placeholder="请输入你的邮箱"
                     class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600">
            </div>

            <!-- 密码输入框 -->
            <div>
              <label class="block text-sm font-medium mb-1">密码</label>
              <input v-model="form.password"
                     type="password"
                     required
                     placeholder="请输入你的密码"
                     class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600">
            </div>

            <!-- 记住我和忘记密码 -->
            <div class="flex items-center justify-between">
              <label class="flex items-center">
                <input type="checkbox"
                       v-model="rememberMe"
                       class="rounded border-gray-300 text-primary-600 focus:ring-primary-500">
                <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">自动登录</span>
              </label>
              <NuxtLink to="/forgot-password"
                        class="text-sm text-primary-600 hover:text-primary-500">
                忘记密码?
              </NuxtLink>
            </div>

            <!-- 登录按钮 -->
            <button type="submit"
                    :disabled="loading"
                    class="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50">
              {{ loading ? '登录中...' : '登录账户' }}
            </button>

            <!-- 注册链接 -->
            <div class="text-center text-sm text-gray-600 dark:text-gray-400">
              还没有账户?
              <NuxtLink to="/register"
                        class="text-primary-600 hover:text-primary-500">
                注册账户
              </NuxtLink>
            </div>
          </form>

          <!-- 区域选择 -->
          <div class="mt-6">
            <select class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600">
              <option value="cn">中国 (简体)</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 添加错误提示 -->
  <div v-if="error" class="text-red-500 text-sm mt-2">
    {{ error }}
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(243 244 246);
  padding: 1rem;
}

.auth-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  display: flex;
  width: 900px;
  overflow: hidden;
  max-width: 100%;
}

.auth-background {
  width: 55%;
  position: relative;
  @media (max-width: 640px) {
    display: none;
  }
}

.auth-form-container {
  width: 45%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  @media (max-width: 640px) {
    width: 100%;
    padding: 1.5rem;
  }
}

.auth-form {
  width: 100%;
  max-width: 28rem;
  @media (max-width: 640px) {
    max-width: 100%;
  }
}
</style>
