<script setup lang="ts">
const { fetchApi } = useApi()
const loading = ref(false)
const notifications = ref([])
const filterUnread = ref(false)

definePageMeta({ layout: 'page' })
useHead({ title: '我的通知' })

// 获取通知列表
const fetchNotifications = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res = await fetchApi('/notifications', {
      params: {
        isRead: filterUnread.value ? false : undefined
      }
    })
    notifications.value = res.data.notifications
  } catch (err) {
    console.error('获取通知失败:', err)
  } finally {
    loading.value = false
  }
}

// 标记通知为已读
const markAsRead = async (id: string) => {
  try {
    await fetchApi(`/notifications/${id}/mark-read`, {
      method: 'POST'
    })
    // 更新本地状态
    const notification = notifications.value.find(n => n._id === id)
    if (notification) {
      notification.isRead = true
    }
  } catch (err) {
    console.error('标记已读失败:', err)
  }
}

// 标记所有为已读
const markAllAsRead = async () => {
  try {
    await fetchApi('/notifications/mark-all-read', {
      method: 'POST'
    })
    // 更新本地状态
    notifications.value.forEach(n => n.isRead = true)
  } catch (err) {
    console.error('标记全部已读失败:', err)
  }
}

// 监听筛选变化
watch(filterUnread, fetchNotifications)

// 格式化时间
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化
fetchNotifications()
</script>

<template>
  <div class="notifications-container">
    <!-- 侧边栏 -->
    <aside class="notifications-sidebar">
      <div class="sidebar-header">
        <h1 class="text-xl font-bold">通知中心</h1>
      </div>
      
      <nav class="sidebar-nav">
        <UButton
          block
          :variant="!filterUnread ? 'solid' : 'ghost'"
          color="primary"
          class="justify-start"
          @click="filterUnread = false"
        >
          <template #leading>
            <UIcon name="i-carbon-notification" />
          </template>
          全部通知
        </UButton>

        <UButton
          block
          :variant="filterUnread ? 'solid' : 'ghost'"
          color="primary"
          class="justify-start"
          @click="filterUnread = true"
        >
          <template #leading>
            <UIcon name="i-carbon-notification-new" />
          </template>
          未读通知
        </UButton>
      </nav>

      <div class="sidebar-footer">
        <UButton
          block
          variant="ghost"
          color="gray"
          @click="markAllAsRead"
          :disabled="!notifications.some(n => !n.isRead)"
        >
          全部标为已读
        </UButton>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="notifications-main">
      <!-- 加载状态 -->
      <div v-if="loading && !notifications.length" class="empty-state">
        <UIcon name="i-carbon-circle-dash" class="animate-spin text-3xl" />
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!notifications.length" class="empty-state">
        <UIcon name="i-carbon-notification" class="text-4xl text-gray-400" />
        <p>暂无{{ filterUnread ? '未读' : '' }}通知</p>
      </div>

      <!-- 通知列表 -->
      <template v-else>
        <div class="notifications-list">
          <UCard
            v-for="notification in notifications"
            :key="notification._id"
            :ui="{
              base: 'transition-all duration-200 hover:shadow-md w-full',
              body: { padding: 'p-4' }
            }"
            :class="[
              'notification-card',
              !notification.isRead && 'unread'
            ]"
            @click="!notification.isRead && markAsRead(notification._id)"
          >
            <div class="notification-content">
              <UAvatar
                :src="notification.sender.avatar"
                :alt="notification.sender.username"
                size="lg"
              />
              <div class="notification-body">
                <div class="notification-header">
                  <span class="username">{{ notification.sender.username }}</span>
                  <time class="timestamp">{{ formatDate(notification.createdAt) }}</time>
                </div>
                <p class="message">{{ notification.action }}</p>

                <template v-if="notification.type === 'comment_reply'">
                  <div class="comment-context">
                    <!-- 原始评论 -->
                    <div class="original-comment">
                      <div class="comment-header">
                        <UAvatar
                          :src="notification.target.parentComment.author.avatar"
                          :alt="notification.target.parentComment.author.username"
                          size="sm"
                        />
                        <span class="username">{{ notification.target.parentComment.author.username }}</span>
                      </div>
                      <p class="comment-content">{{ notification.target.parentComment.content }}</p>
                    </div>

                    <!-- 回复评论 -->
                    <div class="reply-comment">
                      <div class="reply-indicator">
                        <div class="reply-line"></div>
                        <UIcon name="i-carbon-arrow-right" class="reply-arrow" />
                      </div>
                      <div class="current-comment">
                        <div class="comment-header">
                          <UAvatar
                            :src="notification.target.author.avatar"
                            :alt="notification.target.author.username"
                            size="sm"
                          />
                          <span class="username">{{ notification.target.author.username }}</span>
                        </div>
                        <p class="comment-content">{{ notification.target.content }}</p>
                      </div>
                    </div>
                  </div>
                </template>

                <template v-else-if="notification.type === 'article_like' && notification.target">
                  <div class="article-context">
                    <h4 class="article-title">{{ notification.target.title }}</h4>
                  </div>
                </template>
              </div>
            </div>
          </UCard>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.notifications-container {
  @apply grid grid-cols-[280px_1fr] min-h-[calc(100vh-4rem)];
  width: 100%;
}

.notifications-sidebar {
  @apply flex flex-col border-r dark:border-gray-800 bg-gray-50 dark:bg-gray-900;
  @apply sticky top-0 h-[calc(100vh-4rem)];
}

.sidebar-header {
  @apply p-6 border-b dark:border-gray-800;
}

.sidebar-nav {
  @apply flex-1 p-4 space-y-2;
}

.sidebar-footer {
  @apply p-4 border-t dark:border-gray-800;
}

.notifications-main {
  @apply p-6 bg-white dark:bg-gray-900 w-full;
  @apply overflow-y-auto h-[calc(100vh-4rem)];
}

.empty-state {
  @apply flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-gray-500 space-y-4;
}

.notifications-list {
  @apply space-y-4 w-full;
}

.notification-card {
  @apply cursor-pointer w-full;
}

.notification-card.unread {
  @apply bg-primary-50 dark:bg-primary-950;
}

.notification-content {
  @apply flex items-start gap-4;
}

.notification-body {
  @apply flex-1 min-w-0;
}

.notification-header {
  @apply flex justify-between items-center mb-1;
}

.username {
  @apply font-medium text-gray-900 dark:text-gray-100;
}

.timestamp {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.message {
  @apply text-gray-600 dark:text-gray-300;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notifications-container {
    @apply grid-cols-1;
  }

  .notifications-sidebar {
    @apply fixed bottom-0 left-0 right-0 z-50 flex-row items-center justify-between border-t bg-white dark:bg-gray-900;
    height: auto;
  }

  .sidebar-header {
    @apply hidden;
  }

  .sidebar-nav {
    @apply flex-row p-2 space-y-0 space-x-2;
  }

  .sidebar-footer {
    @apply border-t-0 p-2;
  }

  .notifications-main {
    @apply h-[calc(100vh-4rem-60px)];
  }
}

.comment-context {
  @apply mt-3 space-y-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4;
}

.original-comment {
  @apply p-3 rounded-lg bg-white dark:bg-gray-800;
}

.reply-comment {
  @apply flex gap-2;
}

.reply-indicator {
  @apply flex flex-col items-center pt-4;
}

.reply-line {
  @apply w-0.5 h-6 bg-primary-500 dark:bg-primary-400;
}

.reply-arrow {
  @apply text-primary-500 dark:text-primary-400;
}

.current-comment {
  @apply flex-1 p-3 rounded-lg bg-white dark:bg-gray-800 border-l-2 border-primary-500 dark:border-primary-400;
}

.comment-header {
  @apply flex items-center gap-2 mb-2;
}

.comment-content {
  @apply text-sm text-gray-600 dark:text-gray-300 break-all;
}

.article-context {
  @apply mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50;
}

.article-title {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100;
}
</style>
