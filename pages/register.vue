<script lang="ts" setup>
definePageMeta({ layout: false })
useHead({ title: '注册' })
const { awesome } = useAppConfig()
const { register } = useAuth()
const router = useRouter()
const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  username: ''
})

const loading = ref(false)
const agreeToTerms = ref(false)
const error = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''

  try {
    if (form.value.password !== form.value.confirmPassword) {
      error.value = '两次输入的密码不一致'
      return
    }

    const success = await register({
      email: form.value.email,
      password: form.value.password,
      username: form.value.username
    })

    router.push('/')
  } catch (e: any) {
    error.value = e.message || '注册时发生错误'
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
        <img src="/register-bg.jpg" alt="背景" class="w-full h-full object-cover">
      </div>

      <!-- 右侧注册表单 -->
      <div class="auth-form-container">
        <div class="auth-form">
          <h1 class="text-2xl font-bold mb-8">{{ awesome.name }}</h1>
          <h2 class="text-xl font-semibold mb-6">注册账户 ✨</h2>

          <form @submit.prevent="handleRegister" class="space-y-6">
            <!-- 邮箱输入框 -->
            <div>
              <label class="block text-sm font-medium mb-1">邮箱</label>
              <input v-model="form.email" type="email" required placeholder="请输入你的邮箱"
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600">
            </div>

            <!-- 昵称输入框 -->
            <div>
              <label class="block text-sm font-medium mb-1">昵称</label>
              <input v-model="form.username" type="text" required placeholder="请输入你的昵称"
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600">
            </div>

            <!-- 密码输入框 -->
            <div>
              <label class="block text-sm font-medium mb-1">密码</label>
              <input v-model="form.password" type="password" required placeholder="请输入你的密码"
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600">
            </div>

            <!-- 确认密码输入框 -->
            <div>
              <label class="block text-sm font-medium mb-1">确认密码</label>
              <input v-model="form.confirmPassword" type="password" required placeholder="请再次输入密码"
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600">
            </div>

            <!-- 同意条款 -->
            <div class="flex items-center">
              <input type="checkbox" v-model="agreeToTerms" required
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500">
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
                我同意
                <NuxtLink to="/terms" class="text-primary-600 hover:text-primary-500">
                  服务条款
                </NuxtLink>
                和
                <NuxtLink to="/privacy" class="text-primary-600 hover:text-primary-500">
                  隐私政策
                </NuxtLink>
              </span>
            </div>

            <!-- 注册按钮 -->
            <button type="submit" :disabled="loading || !agreeToTerms"
              class="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50">
              {{ loading ? '注册中...' : '注册账户' }}
            </button>

            <!-- 登录链接 -->
            <div class="text-center text-sm text-gray-600 dark:text-gray-400">
              已有账户?
              <NuxtLink to="/login" class="text-primary-600 hover:text-primary-500">
                登录账户
              </NuxtLink>
            </div>

            <!-- 错误提示 -->
            <div v-if="error" class="text-red-500 text-sm mt-2">
              {{ error }}
            </div>
          </form>

          <!-- 区域选择 -->
          <div class="mt-6">
            <select
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600">
              <option value="cn">中国 (简体)</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>
    </div>
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
