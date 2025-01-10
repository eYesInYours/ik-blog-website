<script lang="ts" setup>
import { useApi } from '~/composables/useApi'
import { useUserStore } from '~/stores/user'
import { useNotificationStore } from '~/stores/notification'
import { compressImage } from '~/utils/image'

definePageMeta({ layout: 'page' })
useHead({ title: '个人中心' })

const { fetchApi } = useApi()
const userStore = useUserStore()
const notification = useNotificationStore()

// 上传状态
const uploading = ref(false)
const saving = ref(false)

// 默认选择 profile 标签页
const currentTab = ref('profile')

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

// 用户信息
const userInfo = ref({
  username: '',
  avatar: '',
  intro: '',
  email: ''
})

// 从 store 同步用户信息
const syncUserInfo = () => {
  userInfo.value = {
    username: userStore.userInfo?.username || '',
    avatar: userStore.userInfo?.avatar || '',
    intro: userStore.userInfo?.intro || '',
    email: userStore.userInfo?.email || ''
  }
}

// 监听 store 中的用户信息变化
watch(() => userStore.userInfo, syncUserInfo, { immediate: true })

// 组件挂载时同步用户信息
onMounted(() => {
  syncUserInfo()
})

// 表单验证状态
const formErrors = ref({
  username: '',
  intro: ''
})

// 头像上传
const avatarFile = ref(null)
const tempAvatar = ref('')
const handleAvatarUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  // 创建临时预览URL
  tempAvatar.value = URL.createObjectURL(file)
  avatarFile.value = file
}

// 保存用户信息
const saveUserInfo = async () => {
  // 表单验证
  formErrors.value.username = ''
  formErrors.value.intro = ''

  if (!userInfo.value.username?.trim()) {
    formErrors.value.username = '昵称不能为空'
    return
  }

  try {
    saving.value = true
    let avatarUrl = userInfo.value.avatar
    // 如果有临时头像，先上传图片
    if (avatarFile.value) {
      const formData = new FormData()
      if (avatarFile.value.size > 1024 * 1024 * 2) {
        const compressedImage = await compressImage(avatarFile.value)
        formData.append('file', compressedImage)
      } else {
        formData.append('file', avatarFile.value)
      }
      
      const { data } = await fetchApi('/files/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      avatarUrl = data.file.url
    }

    // 调用更新接口
    const response = await fetchApi('/users/update', {
      method: 'PUT',
      body: {
        avatar: avatarUrl,
        nickname: userInfo.value.username,
        intro: userInfo.value.intro
      }
    })

    // 更新 store
    userStore.updateUserInfo({
      avatar: avatarUrl,
      username: userInfo.value.username,
      intro: userInfo.value.intro
    })
    
    // 清除临时数据
    tempAvatar.value = ''
    avatarFile.value = null
    
    notification.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    notification.error(error.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 在组件卸载时清理临时URL
onUnmounted(() => {
  if (tempAvatar.value) {
    URL.revokeObjectURL(tempAvatar.value)
  }
})

// 在客户端初始化时处理 localStorage
onMounted(() => {
  // 从 localStorage 获取上次选择的标签页
  const savedTab = localStorage.getItem('setting-tab')
  if (savedTab) {
    currentTab.value = savedTab
  }
  
  // 监听标签页变化并保存到 localStorage
  watch(currentTab, (newTab) => {
    localStorage.setItem('setting-tab', newTab)
  })
})

</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageSection>
      <!-- 页面标题 -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">个人中心</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">管理你的个人信息和偏好设置</p>
        </div>
        <div class="flex items-center space-x-6">
          <div class="text-center">
            <div class="text-xl font-semibold text-primary-600 dark:text-primary-400">{{ statistics.totalRead }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">阅读量</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-semibold text-primary-600 dark:text-primary-400">{{ statistics.totalComments }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">评论</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-semibold text-primary-600 dark:text-primary-400">{{ statistics.totalLikes }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">获赞</div>
          </div>
        </div>
      </div>

      <!-- 标签页导航 -->
      <div class="flex space-x-1 mb-8 border-b dark:border-gray-700">
        <button v-for="tab in ['profile', 'favorite', 'comments', 'history', 'stats']" :key="tab"
          @click="currentTab = tab" :class="[
            'px-6 py-3 -mb-px font-medium transition-colors duration-200',
            currentTab === tab
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
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
        <div v-if="currentTab === 'profile'" class="max-w-2xl mx-auto">
          <div class="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <!-- 头像上传 -->
            <div class="flex items-center space-x-6 mb-8">
              <div class="relative">
                <img :src="tempAvatar || userInfo.avatar" :alt="userInfo.username"
                  class="w-28 h-28 rounded-full object-cover ring-4 ring-gray-50 dark:ring-gray-800 cursor-pointer">
                <label
                  class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-40 rounded-full cursor-pointer transition-all duration-200"
                  :class="{ 'opacity-50 cursor-not-allowed': saving }">
                  <input type="file" accept="image/*" class="hidden" :disabled="saving" @change="handleAvatarUpload">
                  <div class="opacity-0 hover:opacity-100 text-white transition-opacity duration-200">
                    <i :class="[
                      'text-white text-2xl',
                      uploading ? 'i-carbon-circle-dash animate-spin' : 'i-carbon-camera'
                    ]"></i>
                    <div class="text-sm mt-1">更换头像</div>
                  </div>
                </label>
              </div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ userInfo.nickname }}</h3>
                <p class="text-gray-500 dark:text-gray-400 mt-1">@{{ userInfo.username }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-2">{{ userInfo.bio || '这个人很懒，还没有写简介' }}</p>
              </div>
            </div>

            <!-- 基本信息表单 -->
            <form @submit.prevent="saveUserInfo" class="space-y-6">
              <!-- 分隔线和表单标题 -->
              <div class="border-b dark:border-gray-700 pb-4">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white">基本信息</h4>
                <p class="mt-1 text-sm text-gray-500">更新你的个人资料和联系方式</p>
              </div>

              <!-- 昵称 -->
              <div>
                <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">昵称</label>
                <input v-model="userInfo.username" type="text"
                  class="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 transition-colors duration-200">
                <p v-if="formErrors.username" class="mt-1 text-sm text-red-500">
                  {{ formErrors.username }}
                </p>
              </div>

              <!-- 邮箱 -->
              <div>
                <label class="block text-sm font-medium mb-1">邮箱</label>
                <input v-model="userInfo.email" type="email"
                  class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600"
                  :disabled="!isEditing">
                <p v-if="formErrors.email" class="mt-1 text-sm text-red-500">
                  {{ formErrors.email }}
                </p>
              </div>

              <!-- 个人简介 -->
              <div>
                <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">个人简介</label>
                <textarea v-model="userInfo.intro" rows="3"
                  class="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 transition-colors duration-200"
                  placeholder="写点什么来介绍一下自己吧..."></textarea>
              </div>

              <!-- 操作按钮 -->
              <div class="flex justify-end space-x-4 pt-6 border-t dark:border-gray-700">
                <button type="submit" :disabled="saving"
                  class="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
                  :class="{ 'opacity-50 cursor-not-allowed': saving }">
                  <span v-if="saving">保存中...</span>
                  <span v-else>保存</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- 收藏文章 -->
        <div v-if="currentTab === 'favorite'" class="space-y-4">
          <div v-for="article in favoriteArticles" :key="article.id"
            class="bg-white dark:bg-dark-500 rounded-lg p-4 shadow-sm">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-semibold mb-2">
                  <NuxtLink :to="`/posts/${article.id}`" class="hover:text-primary-600 dark:hover:text-primary-400">
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
              <button @click="removeFavorite(article.id)" class="text-red-500 hover:text-red-600">
                <i class="i-carbon-favorite-filled text-xl"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 评论历史 -->
        <div v-if="currentTab === 'comments'" class="space-y-4">
          <div v-for="comment in commentHistory" :key="comment.id"
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
              <button @click="deleteComment(comment.id)" class="text-gray-400 hover:text-red-500">
                <i class="i-carbon-trash-can text-xl"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 阅读历史 -->
        <div v-if="currentTab === 'history'" class="space-y-4">
          <div v-for="article in readingHistory" :key="article.id"
            class="bg-white dark:bg-dark-500 rounded-lg p-4 shadow-sm flex gap-4">
            <img :src="article.coverImage" :alt="article.title" class="w-24 h-24 object-cover rounded">
            <div class="flex-1">
              <h3 class="text-lg font-semibold mb-2">{{ article.title }}</h3>
              <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>最后阅读: {{ article.lastRead }}</span>
                <span>阅读时长: {{ article.timeSpent }}</span>
              </div>
              <div class="mt-2">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div class="bg-primary-500 h-2 rounded-full" :style="{ width: `${article.progress * 100}%` }"></div>
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
              <span v-for="tag in statistics.mostReadTags" :key="tag"
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

/* 添加输入框焦点动画 */
input:focus,
textarea:focus {
  @apply outline-none ring-2 ring-blue-500 ring-opacity-50;
  transition: all 0.2s ease-in-out;
}

/* 添加暗色模式过渡效果 */
.dark input,
.dark textarea {
  @apply bg-gray-700 border-gray-600;
  transition: all 0.2s ease-in-out;
}

/* 添加头像悬停效果 */
.avatar-wrapper img {
  transition: transform 0.3s ease-in-out;
}

.avatar-wrapper:hover img {
  transform: scale(1.05);
}
</style>
