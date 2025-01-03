<script lang="ts" setup>
definePageMeta({ layout: 'page' })
useHead({ title: '个人中心' })

// 示例数据
const favoriteArticles = ref([
  {
    id: 1,
    title: '使用 Nuxt 3 构建现代化博客',
    summary: '本文介绍如何使用 Nuxt 3、Vue 3 和 TypeScript 构建一个现代化的技术博客...',
    date: '2024-03-20',
    likes: 45,
    comments: 12,
    isLiked: true
  },
  // ... 更多收藏文章
])

const commentHistory = ref([
  {
    id: 1,
    articleId: 1,
    articleTitle: '使用 Nuxt 3 构建现代化博客',
    content: '这篇文章写得很好，对我帮助很大！',
    date: '2024-03-21 14:30',
    likes: 5
  },
  // ... 更多评论历史
])

const readingHistory = ref([
  {
    id: 1,
    title: 'Vue 3 组合式 API 最佳实践',
    lastRead: '2024-03-22',
    progress: 0.7, // 70% 阅读进度
    timeSpent: '15分钟',
    coverImage: '/images/article-1.jpg'
  },
  // ... 更多阅读历史
])

const statistics = ref({
  totalRead: 156,
  totalComments: 45,
  totalLikes: 89,
  mostReadTags: ['Vue', 'React', 'TypeScript'],
  readingTime: '23小时',
  averageCommentsPerWeek: 3.5
})

// 当前选中的标签页
const currentTab = ref('favorite')

// 移除收藏
const removeFavorite = (articleId: number) => {
  favoriteArticles.value = favoriteArticles.value.filter(article => article.id !== articleId)
}

// 删除评论
const deleteComment = (commentId: number) => {
  commentHistory.value = commentHistory.value.filter(comment => comment.id !== commentId)
}

// 继续阅读
const continueReading = (articleId: number) => {
  // 实现继续阅读逻辑
  navigateTo(`/posts/${articleId}`)
}

// 用户信息
const userInfo = ref({
  username: 'johndoe',
  nickname: 'John Doe',
  avatar: '/images/avatar.jpg',
  email: 'john@example.com',
  bio: '前端开发工程师，热爱技术分享',
  github: 'johndoe',
  twitter: 'johndoe',
  website: 'https://johndoe.com'
})

// 表单验证状态
const isEditing = ref(false)
const formErrors = ref({
  email: '',
  nickname: ''
})

// 头像上传
const handleAvatarUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    if (typeof e.target?.result === 'string') {
      userInfo.value.avatar = e.target.result
    }
  }
  reader.readAsDataURL(file)
}

// 保存用户信息
const saveUserInfo = async () => {
  try {
    // TODO: 实际保存到服务器
    await new Promise(resolve => setTimeout(resolve, 1000))
    isEditing.value = false
    // 显示成功提示
  } catch (error) {
    console.error('保存失败:', error)
  }
}
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageSection>
      <!-- 页面标题 -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">个人中心</h1>
        <div class="stats-summary text-sm text-gray-500 dark:text-gray-400">
          总阅读: {{ statistics.totalRead }} | 评论: {{ statistics.totalComments }} | 点赞: {{ statistics.totalLikes }}
        </div>
      </div>

      <!-- 标签页导航 -->
      <div class="flex space-x-4 mb-6 border-b dark:border-gray-700">
        <button v-for="tab in ['profile', 'favorite', 'comments', 'history', 'stats']" 
                :key="tab"
                @click="currentTab = tab"
                :class="[
                  'px-4 py-2 -mb-px',
                  currentTab === tab 
                    ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400'
                ]">
          {{ {
            profile: '个人信息',
            favorite: '收藏文章',
            comments: '评论历史',
            history: '阅读历史',
            stats: '阅读统计'
          }[tab] }}
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- 个人信息设置 -->
        <div v-if="currentTab === 'profile'" class="max-w-2xl">
          <div class="bg-white dark:bg-dark-500 rounded-lg p-6 shadow-sm">
            <!-- 头像上传 -->
            <div class="flex items-center space-x-4 mb-6">
              <div class="relative">
                <img :src="userInfo.avatar" 
                     :alt="userInfo.nickname"
                     class="w-24 h-24 rounded-full object-cover">
                <label class="absolute bottom-0 right-0 bg-primary-500 rounded-full p-2 cursor-pointer hover:bg-primary-600">
                  <input type="file" 
                         accept="image/*" 
                         class="hidden" 
                         @change="handleAvatarUpload">
                  <i class="i-carbon-camera text-white"></i>
                </label>
              </div>
              <div>
                <h3 class="text-lg font-semibold">{{ userInfo.nickname }}</h3>
                <p class="text-gray-500 dark:text-gray-400">@{{ userInfo.username }}</p>
              </div>
            </div>

            <!-- 基本信息表单 -->
            <form @submit.prevent="saveUserInfo" class="space-y-4">
              <!-- 昵称 -->
              <div>
                <label class="block text-sm font-medium mb-1">昵称</label>
                <input v-model="userInfo.nickname"
                       type="text"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600"
                       :disabled="!isEditing">
                <p v-if="formErrors.nickname" class="mt-1 text-sm text-red-500">
                  {{ formErrors.nickname }}
                </p>
              </div>

              <!-- 邮箱 -->
              <div>
                <label class="block text-sm font-medium mb-1">邮箱</label>
                <input v-model="userInfo.email"
                       type="email"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600"
                       :disabled="!isEditing">
                <p v-if="formErrors.email" class="mt-1 text-sm text-red-500">
                  {{ formErrors.email }}
                </p>
              </div>

              <!-- 个人简介 -->
              <div>
                <label class="block text-sm font-medium mb-1">个人简介</label>
                <textarea v-model="userInfo.bio"
                          rows="3"
                          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600"
                          :disabled="!isEditing"></textarea>
              </div>

              <!-- 社交链接 -->
              <div class="space-y-3">
                <label class="block text-sm font-medium">社交链接</label>
                
                <div class="flex items-center space-x-2">
                  <i class="i-carbon-logo-github text-xl"></i>
                  <input v-model="userInfo.github"
                         type="text"
                         placeholder="GitHub 用户名"
                         class="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600"
                         :disabled="!isEditing">
                </div>

                <div class="flex items-center space-x-2">
                  <i class="i-carbon-logo-twitter text-xl"></i>
                  <input v-model="userInfo.twitter"
                         type="text"
                         placeholder="Twitter 用户名"
                         class="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600"
                         :disabled="!isEditing">
                </div>

                <div class="flex items-center space-x-2">
                  <i class="i-carbon-link text-xl"></i>
                  <input v-model="userInfo.website"
                         type="url"
                         placeholder="个人网站"
                         class="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600"
                         :disabled="!isEditing">
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                <button v-if="!isEditing"
                        type="button"
                        @click="isEditing = true"
                        class="px-4 py-2 text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-dark-400 rounded-lg">
                  编辑资料
                </button>
                <template v-else>
                  <button type="button"
                          @click="isEditing = false"
                          class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-400 rounded-lg">
                    取消
                  </button>
                  <button type="submit"
                          class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                    保存
                  </button>
                </template>
              </div>
            </form>
          </div>
        </div>

        <!-- 收藏文章 -->
        <div v-if="currentTab === 'favorite'" class="space-y-4">
          <div v-for="article in favoriteArticles" 
               :key="article.id"
               class="bg-white dark:bg-dark-500 rounded-lg p-4 shadow-sm">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-semibold mb-2">
                  <NuxtLink :to="`/posts/${article.id}`" 
                           class="hover:text-primary-600 dark:hover:text-primary-400">
                    {{ article.title }}
                  </NuxtLink>
                </h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  {{ article.summary }}
                </p>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ article.date }} · {{ article.likes }} 点赞 · {{ article.comments }} 评论
                </div>
              </div>
              <button @click="removeFavorite(article.id)" 
                      class="text-red-500 hover:text-red-600">
                <i class="i-carbon-favorite-filled text-xl"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 评论历史 -->
        <div v-if="currentTab === 'comments'" class="space-y-4">
          <div v-for="comment in commentHistory" 
               :key="comment.id"
               class="bg-white dark:bg-dark-500 rounded-lg p-4 shadow-sm">
            <div class="flex justify-between">
              <div>
                <NuxtLink :to="`/posts/${comment.articleId}`" 
                         class="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                  {{ comment.articleTitle }}
                </NuxtLink>
                <p class="mt-2">{{ comment.content }}</p>
                <div class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {{ comment.date }} · {{ comment.likes }} 点赞
                </div>
              </div>
              <button @click="deleteComment(comment.id)" 
                      class="text-gray-400 hover:text-red-500">
                <i class="i-carbon-trash-can text-xl"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 阅读历史 -->
        <div v-if="currentTab === 'history'" class="space-y-4">
          <div v-for="article in readingHistory" 
               :key="article.id"
               class="bg-white dark:bg-dark-500 rounded-lg p-4 shadow-sm flex gap-4">
            <img :src="article.coverImage" 
                 :alt="article.title"
                 class="w-24 h-24 object-cover rounded">
            <div class="flex-1">
              <h3 class="text-lg font-semibold mb-2">{{ article.title }}</h3>
              <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>最后阅读: {{ article.lastRead }}</span>
                <span>阅读时长: {{ article.timeSpent }}</span>
              </div>
              <div class="mt-2">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div class="bg-primary-500 h-2 rounded-full" 
                       :style="{ width: `${article.progress * 100}%` }"></div>
                </div>
                <div class="flex justify-between items-center mt-2">
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    阅读进度: {{ Math.round(article.progress * 100) }}%
                  </span>
                  <button @click="continueReading(article.id)"
                          class="text-primary-600 dark:text-primary-400 text-sm hover:underline">
                    继续阅读
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 阅读统计 -->
        <div v-if="currentTab === 'stats'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white dark:bg-dark-500 rounded-lg p-4 shadow-sm">
            <h3 class="text-lg font-semibold mb-4">阅读习惯</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span>总阅读时长</span>
                <span class="text-primary-600 dark:text-primary-400">
                  {{ statistics.readingTime }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>平均每周评论</span>
                <span class="text-primary-600 dark:text-primary-400">
                  {{ statistics.averageCommentsPerWeek }}
                </span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-dark-500 rounded-lg p-4 shadow-sm">
            <h3 class="text-lg font-semibold mb-4">常读标签</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in statistics.mostReadTags" 
                    :key="tag"
                    class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>

<style scoped>
.content-area {
  min-height: 400px;
}
</style>
