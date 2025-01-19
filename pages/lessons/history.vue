<script setup lang="ts">
import type { LessonRecord } from '~/types/lesson'

definePageMeta({ 
  layout: 'lessons',
})

const records = ref<LessonRecord[]>([])
const loading = ref(false)
const { $request } = useNuxtApp()

// 获取课时记录
const fetchRecords = async () => {
  try {
    loading.value = true
    const { data } = await $request.get('/lessons/records')
    records.value = data.data
  } catch (error) {
    console.error('获取课时记录失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRecords()
})
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageHeader>
      <LayoutPageTitle text="课时记录" />
    </LayoutPageHeader>

    <LayoutPageSection>
      <!-- 空状态 -->
      <div 
        v-if="!loading && records.length === 0"
        class="text-center py-12"
      >
        <div class="text-gray-400 dark:text-gray-600 mb-4">
          <UIcon name="i-heroicons-document-text" class="w-12 h-12" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          暂无使用记录
        </h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          您还没有任何课时使用记录
        </p>
      </div>

      <!-- 记录列表 -->
      <div v-else class="space-y-4">
        <div
          v-for="record in records"
          :key="record.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
        >
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-lg font-semibold">{{ record.lessonTitle }}</h3>
              <div class="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <div>上课时间: {{ record.date }}</div>
                <div>授课教师: {{ record.teacherName }}</div>
                <div>使用时长: {{ record.duration }}分钟</div>
              </div>
            </div>
            <span 
              :class="[
                'px-2 py-1 text-sm rounded-full',
                record.status === 'completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              ]"
            >
              {{ record.status === 'completed' ? '已完成' : '已取消' }}
            </span>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8" />
        </div>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template> 