<script setup lang="ts">
import type { LessonStats } from '~/types/lesson'

definePageMeta({ 
  layout: 'lessons',
})

const { userInfo, logout } = useAuth()
const router = useRouter()
const { $request } = useNuxtApp()

const stats = ref<LessonStats>()

// 获取统计数据
const fetchStats = async () => {
  try {
    const { data } = await $request.get('/lessons/stats')
    stats.value = data.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const handleLogout = async () => {
  await logout()
  router.push('/login')
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageHeader>
      <LayoutPageTitle text="个人中心" />
    </LayoutPageHeader>

    <LayoutPageSection>
      <!-- 用户信息卡片 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div class="flex items-center space-x-4">
          <UAvatar
            :src="userInfo?.avatar"
            :alt="userInfo?.username"
            size="lg"
          />
          <div>
            <h3 class="text-lg font-semibold">{{ userInfo?.username }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ userInfo?.email }}
            </p>
          </div>
        </div>
      </div>

      <!-- 统计数据 -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">总课时</div>
          <div class="text-2xl font-bold">{{ stats?.totalMinutes }}分钟</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">剩余课时</div>
          <div class="text-2xl font-bold">{{ stats?.remainingMinutes }}分钟</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">已完成课程</div>
          <div class="text-2xl font-bold">{{ stats?.completedLessons }}节</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">总消费</div>
          <div class="text-2xl font-bold">¥{{ stats?.totalSpent }}</div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="space-y-4">
        <UButton
          block
          color="primary"
          to="/lessons/recharge"
          icon="i-heroicons-plus-circle"
        >
          充值课时
        </UButton>
        <UButton
          block
          color="gray"
          variant="ghost"
          icon="i-heroicons-cog-6-tooth"
          to="/settings"
        >
          账号设置
        </UButton>
        <UButton
          block
          color="red"
          variant="ghost"
          icon="i-heroicons-arrow-right-on-rectangle"
          @click="handleLogout"
        >
          退出登录
        </UButton>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template> 