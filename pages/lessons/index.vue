<script setup lang="ts">
import type { Lesson } from '~/types/lesson'

definePageMeta({ 
  layout: 'lessons',
})

const lessons = ref<Lesson[]>([])
const loading = ref(false)
const { $request } = useNuxtApp()

// 获取课时列表
const fetchLessons = async () => {
  try {
    loading.value = true
    const { data } = await $request.get('/lessons')
    lessons.value = data.data
  } catch (error) {
    console.error('获取课时列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchLessons()
})
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageHeader>
      <LayoutPageTitle text="我的课时" />
    </LayoutPageHeader>

    <LayoutPageSection>
      <!-- 空状态 -->
      <div 
        v-if="!loading && !lessons?.length"
        class="text-center py-12"
      >
        <div class="text-gray-400 dark:text-gray-600 mb-4">
          <UIcon name="i-heroicons-clock" class="w-12 h-12" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          暂无课时
        </h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          您还没有购买任何课时，点击上方按钮进行充值
        </p>
      </div>

      <!-- 课时列表 -->
      <div 
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <!-- 课时卡片 -->
        <div
          v-for="lesson in lessons"
          :key="lesson._id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
        >
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-semibold">{{ lesson.title }}</h3>
            <span 
              :class="[
                'px-2 py-1 text-sm rounded-full',
                lesson.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              ]"
            >
              {{ lesson.status === 'active' ? '可用' : '已用完' }}
            </span>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">总时长</span>
              <span>{{ lesson.duration }}分钟</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">剩余时长</span>
              <span>{{ lesson.remainingTime }}分钟</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">创建时间</span>
              <span>{{ lesson.createdAt }}</span>
            </div>

            <!-- 进度条 -->
            <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
              <div
                class="bg-primary-600 h-2.5 rounded-full"
                :style="`width: ${(lesson.remainingTime / lesson.duration) * 100}%`"
              />
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="col-span-full flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8" />
        </div>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 