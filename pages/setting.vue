<script lang="ts" setup>
import { useUserStore } from '~/stores/user'
import { useNotificationStore } from '~/stores/notification'
import { compressImage } from '~/utils/image'
import { useRouter } from 'vue-router'

definePageMeta({ layout: 'page' })
useHead({ title: 'Settings' })

const { successToast, errorToast } = useToastMsg()

const { $request } = useNuxtApp()
const userStore = useUserStore()
const router = useRouter()
const showLogoutModal = ref(false)

// 上传状态
const uploading = ref(false)
const saving = ref(false)

// 默认选择 profile 标签页
const currentTab = ref('profile')

// 收藏文章列表数据
const favoriteArticles = ref<Article[]>([])
const favoritePagination = ref({
  total: 0,
  totalPages: 0,
  currentPage: 1,
  limit: 10
})

// 加载状态
const loadingStates = reactive({
  articles: false,
  profile: false
})

// 错误状态
const errors = reactive({
  articles: null as string | null,
  profile: null as string | null
})

// 评论历史数据
const commentHistory = ref([])
const commentLoading = ref(false)
const commentError = ref(null)

// 获取评论历史
const fetchCommentHistory = async () => {
  try {
    commentLoading.value = true
    commentError.value = null
    const { data } = await $request.get('/comments', {
      history: true
    })
    commentHistory.value = data.value
  } catch (error) {
    console.error('获取评论历史失败:', error)
    commentError.value = error.message || '获取评论历史失败'
  } finally {
    commentLoading.value = false
  }
}

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

      const { data } = await $request.post('/files/upload', formData)
      avatarUrl = data.value.file.url
    }

    // 调用更新接口
    const { data } = await $request.put('/users/update', {
      avatar: avatarUrl,
      username: userInfo.value.username,
      intro: userInfo.value.intro
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
    successToast('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    errorToast('保存失败，请稍后重试')
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

// 获取收藏文章列表
const fetchFavoriteArticles = async (page = 1) => {
  try {
    loadingStates.articles = true
    errors.articles = null
    const { data } = await $request.get('/articles', {
      page,
      limit: favoritePagination.value.limit,
      type: 'collected'
    })
    favoriteArticles.value = data.value.articles
    favoritePagination.value = data.value.pagination
  } catch (error) {
    console.error('获取收藏文章列表失败:', error)
    errors.articles = error.message || '获取收藏文章列表失败'
  } finally {
    loadingStates.articles = false
  }
}

// 监听标签页变化
watch(currentTab, (newTab) => {
  if (newTab === 'favorite') {
    fetchFavoriteArticles()
  } else if (newTab === 'comments') {
    // fetchCommentHistory()
  }
})

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 前往文章详情页面
function handleClick(id: string) {
  navigateTo(`/articles/${id}`)
}

// 退出登录
const handleLogout = () => {
  showLogoutModal.value = true
}

// 确认退出
const confirmLogout = () => {
  userStore.clearLoginState()
  showLogoutModal.value = false
  successToast('已退出登录')
  router.push('/')
}

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
        <div class="flex items-center space-x-8">
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
          <div class="border-l pl-8 dark:border-gray-700">
            <UButton color="gray" variant="soft" icon="i-carbon-logout" @click="handleLogout">
              退出登录
            </UButton>
          </div>
        </div>
      </div>

      <!-- 退出确认对话框 -->
      <UModal v-model="showLogoutModal">
        <UCard :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
          body: 'p-0'
        }">
          <div class="flex items-center p-4">
            <div class="flex-1">
              <div class="flex items-center">
                <Icon name="i-carbon-logout" class="text-gray-400 mr-2 text-xl" />
                <span class="text-base font-medium">确认退出</span>
              </div>
              <div class="mt-1 text-sm text-gray-500">
                退出后需要重新登录才能访问账号
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
            <UButton color="gray" variant="soft" size="sm" @click="showLogoutModal = false">
              取消
            </UButton>
            <UButton color="red" variant="solid" size="sm" @click="confirmLogout">
              确认退出
            </UButton>
          </div>
        </UCard>
      </UModal>
    </LayoutPageSection>
    <!-- 其他设置内容 -->
    <LayoutPageSection>
      <div class="mb-6">
        <HeadlessTabGroup v-model="currentTab" class="flex space-x-1 mb-8 border-b dark:border-gray-700">
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
              // comments: '评论历史',
              // history: '阅读历史',
              // stats: '阅读统计'
            }[tab] }}
          </button>
        </HeadlessTabGroup>
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
          <!-- 加载状态 -->
          <div v-if="loadingStates.articles" class="py-8">
            <div class="flex justify-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-else-if="errors.articles" class="py-8 text-center text-red-500">
            {{ errors.articles }}
          </div>

          <!-- 空状态 -->
          <div v-else-if="!favoriteArticles.length" class="py-8 text-center text-gray-500 dark:text-gray-400">
            还没有收藏任何文章
          </div>

          <!-- 文章列表 -->
          <div v-else v-for="article in favoriteArticles" :key="article._id"
            class="bg-white dark:bg-dark-500 rounded-lg p-4 shadow-sm">
            <div class="flex gap-4">
              <!-- 文章封面图 -->
              <div class="flex-shrink-0">
                <img :src="article.cover || '/images/default-cover.jpg'" :alt="article.title"
                  class="w-32 h-24 object-cover rounded-lg" @error="e => e.target.src = '/images/default-cover.jpg'">
              </div>

              <!-- 文章内容 -->
              <div>
                <h3 class="text-lg font-semibold mb-2">
                  <NuxtLink :to="`/articles/${article._id}`" class="hover:text-primary-600 dark:hover:text-primary-400">
                    {{ article.title }}
                  </NuxtLink>
                </h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  {{ article.content }}
                </p>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(article.createdAt) }} · {{ article.likes }} 点赞 · {{ article.comments }} 评论
                </div>

              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="favoritePagination.total > favoritePagination.limit" class="flex justify-center mt-6">
            <UPagination v-model="favoritePagination.currentPage" :total="favoritePagination.total"
              :page-size="favoritePagination.limit" :page-count="favoritePagination.totalPages"
              @change="fetchFavoriteArticles" />
          </div>
        </div>

        <!-- 评论历史 -->
        <div v-if="currentTab === 'comments'" class="space-y-4">
          <!-- 加载状态 -->
          <div v-if="commentLoading" class="py-8">
            <div class="flex justify-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-else-if="commentError" class="py-8 text-center text-red-500">
            {{ commentError }}
          </div>

          <!-- 空状态 -->
          <div v-else-if="!commentHistory.length" class="py-8 text-center text-gray-500 dark:text-gray-400">
            还没有发表过评论
          </div>

          <div v-for="comment in commentHistory" :key="comment._id"
            class="bg-white dark:bg-dark-500 rounded-lg p-4 shadow-sm">
            <div class="flex justify-between">
              <div>
                <NuxtLink :to="`/articles/${comment.articleId}`"
                  class="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                  {{ comment.articleTitle }}
                </NuxtLink>
                <p class="mt-2">{{ comment.content }}</p>
                <div class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {{ formatDate(comment.createdAt) }} · {{ comment.likes }} 点赞
                </div>
              </div>
              <button @click="deleteComment(comment._id)" class="text-gray-400 hover:text-red-500">
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
