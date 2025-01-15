<script lang="ts" setup>
definePageMeta({ layout: false })
useHead({ title: '登录' })

const { awesome } = useAppConfig()

const { login } = useAuth()
const router = useRouter()
const form = ref({
  email: '',
  password: '',
  remember: false,
  autoLogin: false
})

const savedAccounts = ref<{email: string, password: string}[]>([])
const showAccountList = ref(false)
const error = ref('')
const loading = ref(false)

onMounted(() => {
  const accounts = localStorage.getItem('savedAccounts')
  if (accounts) {
    savedAccounts.value = JSON.parse(accounts)
    if (savedAccounts.value.length > 0) {
      const lastAccount = savedAccounts.value[savedAccounts.value.length - 1]
      form.value.email = lastAccount.email
    }
  }
})

const selectAccount = (account: {email: string, password: string}) => {
  form.value.email = account.email
  form.value.password = account.password
  showAccountList.value = false
}

const saveAccount = () => {
  if (!form.value.remember) return

  const account = {
    email: form.value.email,
    password: form.value.password
  }

  const index = savedAccounts.value.findIndex(a => a.email === account.email)
  if (index > -1) {
    savedAccounts.value[index] = account
  } else {
    savedAccounts.value.push(account)
  }

  localStorage.setItem('savedAccounts', JSON.stringify(savedAccounts.value))
}

watch(() => form.value.autoLogin, async (newVal) => {
  if (newVal && form.value.email && form.value.password) {
    await handleSubmit()
  }
})

const handleSubmit = async () => {
  if (loading.value) return
  if (!form.value.email || !form.value.password) {
    error.value = '请输入邮箱和密码'
    return
  }

  loading.value = true
  try {
    await login({
      email: form.value.email,
      password: form.value.password
    })

    saveAccount()

    router.push('/')
  } catch (e: any) {
    error.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-wrapper">
    <div class="auth-card">
      <!-- 左侧背景图 -->
      <div class="auth-background hidden lg:block">
        <img src="/login-bg.jpg" alt="背景" class="w-full h-full object-cover rounded-l-2xl">
      </div>

      <!-- 右侧登录表单 -->
      <div class="auth-form-container">
        <div class="auth-form">
          <h1 class="text-2xl font-bold mb-8">{{ awesome.name }}</h1>
          <h2 class="text-xl font-semibold mb-6">登入账户 🔑</h2>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- 邮箱输入框 -->
            <div class="rounded-md shadow-sm -space-y-px">
              <div class="relative">
                <input v-model="form.email"
                  type="email"
                  required
                  autocomplete="off"
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 focus:z-10 sm:text-sm"
                  placeholder="邮箱地址"
                  @focus="showAccountList = true">

                <!-- 账号下拉列表 -->
                <div v-if="showAccountList && savedAccounts.length > 0"
                     class="absolute w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                  <ul class="py-1">
                    <li v-for="account in savedAccounts" :key="account.email"
                        class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        @click="selectAccount(account)">
                      {{ account.email }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- 密码输入框 -->
            <div>
              <label class="block text-sm font-medium mb-1">密码</label>
              <input v-model="form.password"
                     type="password"
                     required
                     autocomplete="off"
                     placeholder="请输入你的密码"
                     class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600">
            </div>

            <!-- 记住账号和自动登录 -->
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input v-model="form.remember" type="checkbox"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                <label class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  记住账号
                </label>
              </div>

              <div class="flex items-center">
                <input v-model="form.autoLogin" type="checkbox"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                <label class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  自动登录
                </label>
              </div>
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
  @apply min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900;
}

.auth-card {
  @apply w-full max-w-6xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex;
}

.auth-background {
  @apply w-1/2 bg-gray-100 dark:bg-gray-700;
}

.auth-form-container {
  @apply w-full lg:w-1/2 py-8 px-12;
}

.auth-form {
  @apply max-w-md mx-auto;
}
</style>
