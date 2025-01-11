<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: ['guest']
})

const { fetchApi } = useApi()
const { successToast, errorToast } = useToastMsg()
const email = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  if (!email.value) {
    errorToast('请输入邮箱')
    return
  }

  try {
    loading.value = true
    const response = await fetchApi('/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value }
    })

    if (response.code === 200) {
      successToast('重置密码链接已发送到您的邮箱')
      email.value = ''
    }
  } catch (err) {
    console.error('忘记密码请求失败:', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">忘记密码</h1>
      <p class="auth-subtitle">
        请输入您的邮箱，我们将发送重置密码链接到您的邮箱。
      </p>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email" class="form-label">邮箱</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="请输入邮箱"
            required
          />
        </div>

        <UButton
          type="submit"
          :loading="loading"
          :disabled="loading"
          block
          color="primary"
        >
          发送重置链接
        </UButton>

        <div class="auth-links">
          <NuxtLink to="/login" class="text-link">
            返回登录
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  @apply min-h-screen flex items-center justify-center p-4;
}

.auth-card {
  @apply w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8;
}

.auth-title {
  @apply text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white;
}

.auth-subtitle {
  @apply text-sm text-center text-gray-600 dark:text-gray-400 mb-6;
}

.auth-form {
  @apply space-y-6;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white;
}

.auth-links {
  @apply mt-4 text-center text-sm;
}

.text-link {
  @apply text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300;
}
</style> 