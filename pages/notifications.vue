<script setup lang="ts">
definePageMeta({ layout: 'page' })
useHead({ title: '我的通知' })

interface Sender {
  _id: string
  username: string
  avatar: string
}

interface Target {
  _id: string
  title?: string
  content?: string
}

interface Notification {
  _id: string
  sender: Sender
  type: 'comment' | 'reply' | 'like'
  target: Target
  targetType: 'Article' | 'Comment' | 'Diary'
  content: string
  isRead: boolean
  createdAt: string
}

interface Pagination {
  total: number
  page: number
  limit: number
}

// 状态
const notifications = ref<Notification[]>([])
const pagination = ref<Pagination>({
  total: 0,
  page: 1,
  limit: 20
})
const loading = ref(false)
const filter = ref<'all' | 'unread'>('all')

// 获取通知列表
const fetchNotifications = async () => {
  loading.value = true
  try {
    const { data: response } = await useFetch<{
      code: number
      data: {
        notifications: Notification[]
        pagination: Pagination
      }
    }>('/api/notifications', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.limit,
        isRead: filter.value === 'unread' ? false : undefined
      }
    })

    if (response.value?.data) {
      notifications.value = response.value.data.notifications
      pagination.value = response.value.data.pagination
    }
  } catch (error) {
    console.error('获取通知列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 标记单个通知为已读
const markAsRead = async (notificationId: string) => {
  try {
    await useFetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT'
    })
    // 更新本地状态
    const notification = notifications.value.find(n => n._id === notificationId)
    if (notification) {
      notification.isRead = true
    }
  } catch (error) {
    console.error('标记通知已读失败:', error)
  }
}

// 标记所有通知为已读
const markAllAsRead = async () => {
  try {
    await useFetch('/api/notifications/read-all', {
      method: 'PUT'
    })
    // 更新本地状态
    notifications.value.forEach(notification => {
      notification.isRead = true
    })
  } catch (error) {
    console.error('标记所有通知已读失败:', error)
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取通知图标
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'comment':
      return 'i-carbon-chat'
    case 'reply':
      return 'i-carbon-reply'
    case 'like':
      return 'i-carbon-favorite'
    default:
      return 'i-carbon-notification'
  }
}

// 监听筛选变化
watch(filter, () => {
  pagination.value.page = 1
  fetchNotifications()
})

// 初始化
onMounted(() => {
  fetchNotifications()
})
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageSection>
      <div class="notifications-page">
        <!-- 页面标题和工具栏 -->
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold">我的通知</h1>

          <div class="flex items-center space-x-4">
            <!-- 筛选按钮 -->
            <div class="flex rounded-lg overflow-hidden border dark:border-gray-700">
              <button
                v-for="(label, value) in { all: '全部', unread: '未读' }"
                :key="value"
                @click="filter = value as 'all' | 'unread'"
                :class="[
                  'px-4 py-2 text-sm',
                  filter === value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-dark-500 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-400'
                ]"
              >
                {{ label }}
              </button>
            </div>

            <!-- 全部标记为已读 -->
            <button
              v-if="notifications.some(n => !n.isRead)"
              @click="markAllAsRead"
              class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500"
            >
              全部标记为已读
            </button>
          </div>
        </div>

        <!-- 通知列表 -->
        <div v-if="!loading" class="space-y-4">
          <div
            v-for="notification in notifications"
            :key="notification._id"
            :class="[
              'bg-white dark:bg-dark-500 rounded-lg p-4 shadow-sm transition-colors',
              !notification.isRead && 'bg-blue-50 dark:bg-dark-400'
            ]"
          >
            <!-- 通知内容 -->
            <div class="flex items-start space-x-4">
              <!-- 发送者头像 -->
              <img
                :src="notification.sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.sender.username}`"
                :alt="notification.sender.username"
                class="w-10 h-10 rounded-full flex-shrink-0"
              >

              <div class="flex-grow">
                <!-- 通知内容 -->
                <div class="flex items-center space-x-2 mb-1">
                  <Icon :name="getNotificationIcon(notification.type)" class="text-gray-400" />
                  <span class="text-gray-900 dark:text-gray-100">
                    {{ notification.content }}
                  </span>
                </div>

                <!-- 时间和操作 -->
                <div class="flex items-center justify-between text-sm text-gray-500">
                  <time>{{ formatDate(notification.createdAt) }}</time>
                  <button
                    v-if="!notification.isRead"
                    @click="markAsRead(notification._id)"
                    class="text-primary-500 hover:text-primary-600"
                  >
                    标记已读
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载中 -->
        <div v-else class="flex justify-center py-8">
          <ULoadingIcon />
        </div>

        <!-- 空状态 -->
        <div
          v-if="!loading && notifications.length === 0"
          class="text-center py-12 text-gray-500 dark:text-gray-400"
        >
          暂无通知
        </div>

        <!-- 分页 -->
        <UPagination
          v-if="pagination.total > pagination.limit"
          v-model="pagination.page"
          :total="pagination.total"
          :page-size="pagination.limit"
          :on-change="fetchNotifications"
          class="mt-6"
        />
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>

<style scoped>
.notifications-page {
  @apply max-w-4xl mx-auto;
}
</style>
