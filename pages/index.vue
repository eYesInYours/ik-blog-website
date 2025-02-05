<script lang="ts" setup>
import WeatherCard from '~/components/WeatherCard.vue'
const { awesome } = useAppConfig()
const { $request } = useNuxtApp()
definePageMeta({ layout: 'page' })
useHead({ titleTemplate: '', title: awesome?.name || '我的技术博客' })

const notificationStore = useNotificationStore()
const route = useRoute()

interface Author {
  _id: string
  username: string
  avatar: string
  intro: string
  joinTime: string
  stats: {
    articles: number
    tags: number
    views: number
  }
}

interface Article {
  _id: string
  title: string
  content: string
  category: string
  cover: string
  status: string
  author: Author
  authorAvatar: string
  tags: string[]
  comments: any[]
  createdAt: string
  updatedAt: string
  categoryName?: string
}

interface ArticleResponse {
  code: number
  message: string
  data: {
    articles: Article[]
    pagination: {
      total: number
      totalPages: number
      currentPage: number
      limit: number
    }
  }
}

// 文章列表数据
const articles = ref<Article[]>([])
const pagination = ref({
  total: 0,
  totalPages: 0,
  currentPage: 1,
  limit: 10
})

// 统一的加载状态管理
const loadingStates = reactive({
  articles: true,
  author: true,
  weather: true
})

// 统一的错误状态管理
const errors = reactive({
  articles: null as string | null,
  author: null as string | null,
})

// 计算总体加载状态
const isLoading = computed(() => {
  return Object.values(loadingStates).some(state => state)
})

// 作者信息
const author = ref<Author | null>(null)
const config = useRuntimeConfig()

// 获取作者信息
const fetchAuthor = async () => {
  try {
    loadingStates.author = true
    errors.author = null
    const { data, error } = await $request.get('/users/author')
    if (error.value) throw error.value
    author.value = data.value
  } catch (error) {
    console.error('获取作者信息失败:', error)
    errors.author = error.message || '获取作者信息失败'
  } finally {
    loadingStates.author = false
  }
}

// 获取文章列表
const fetchArticles = async (page = 1) => {
  try {
    loadingStates.articles = true
    errors.articles = null
    const { data, error } = await $request.get('/articles', {
      page,
      limit: pagination.value.limit
    })
    if (error.value) throw error.value
    articles.value = data.value.articles
    pagination.value = data.value.pagination
  } catch (error) {
    console.error('获取文章列表失败:', error)
    errors.articles = error.message || '获取文章列表失败'
  } finally {
    loadingStates.articles = false
  }
}

// 侧边栏数据
const tags = computed(() => {
  const allTags = articles.value.flatMap(article => article.tags)
  return [...new Set(allTags)]
})

// 搜索功能
const searchQuery = ref('')
const filteredArticles = computed(() => {
  if (!searchQuery.value) return articles.value
  const query = searchQuery.value.toLowerCase()
  return articles.value.filter(article =>
    article.title.toLowerCase().includes(query)
  )
})

// 分页相关
const currentPage = computed({
  get: () => pagination.value.currentPage,
  set: (value) => {
    fetchArticles(value)
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

const userStore = useUserStore()

// 初始化
fetchAuthor()
fetchArticles()

</script>

<template>
  <div class="blog-layout">
    <!-- 主内容区 -->
    <main class="main-content">
      <section class="posts-list">
        <h2 class="text-2xl font-bold mb-6">最新文章</h2>

        <!-- 骨架屏 -->
        <template v-if="loadingStates.articles">
          <div v-for="n in 5" :key="n"
            class="post-card mb-3 bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
            <div class="flex p-3 gap-3">
              <div class="flex-1">
                <div class="h-7 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div class="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div class="flex items-center gap-2">
                  <div class="h-4 bg-gray-200 rounded w-20"></div>
                  <div class="h-4 bg-gray-200 rounded w-4"></div>
                  <div class="h-4 bg-gray-200 rounded w-20"></div>
                  <div class="ml-4 flex gap-2">
                    <div class="h-5 bg-gray-200 rounded-full w-12"></div>
                    <div class="h-5 bg-gray-200 rounded-full w-12"></div>
                  </div>
                </div>
              </div>
              <div class="w-32 h-24 bg-gray-200 rounded flex-shrink-0"></div>
            </div>
          </div>
        </template>

        <!-- 错误提示 -->
        <template v-else-if="errors.articles">
          <div class="text-center py-8 text-gray-500">
            <Icon name="carbon:warning" class="text-4xl mb-2" />
            <p>{{ errors.articles }}</p>
            <button @click="fetchArticles"
              class="mt-4 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg">
              重试
            </button>
          </div>
        </template>

        <!-- 文章列表 -->
        <template v-else>
          <!-- 无文章时的空状态 -->
          <template v-if="!articles.length">
            <div class="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Icon name="carbon:document-blank" class="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
              <h3 class="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">暂无文章</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                作者正在创作中，敬请期待...
              </p>
            </div>
          </template>

          <!-- 有文章时显示列表 -->
          <template v-else>
            <article v-for="article in filteredArticles" :key="article._id"
              class="post-card bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              @click="handleClick(article._id)">
              <div class="flex p-4 gap-4">
                <!-- 文章内容区 -->
                <div class="flex-1 min-w-0">
                  <h3 class="text-gray-900 dark:text-gray-100 font-medium text-lg mb-2 line-clamp-2">
                    {{ article.title }}
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {{ article.content.replace(/<[^>]+>/g, '').slice(0, 200) }}...
                  </p>
                  <div class="flex items-center flex-wrap gap-2 text-sm">
                    <span class="text-gray-500 dark:text-gray-400">
                      {{ formatDate(article.createdAt) }}
                    </span>
                    <span class="text-gray-300 dark:text-gray-600">·</span>
                    <span class="text-gray-500 dark:text-gray-400">
                      {{ article.author.username }}
                    </span>
                    <span v-if="article.categoryName" class="text-gray-300 dark:text-gray-600">·</span>
                    <span v-if="article.categoryName"
                      class="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300">
                      {{ article.categoryName }}
                    </span>
                    <div class="flex flex-wrap gap-2 ml-auto">
                      <span v-for="tag in article.tags" :key="tag"
                        class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300">
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 右侧封面图 -->
                <div v-if="article.cover" class="w-32 h-24 flex-shrink-0 rounded overflow-hidden">
                  <img :src="article.cover" :alt="article.title"
                    class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              </div>
            </article>
          </template>
        </template>
      </section>

      <!-- 分页控件 -->
      <div v-if="!loadingStates.articles && articles.length" class="flex justify-center gap-2 mt-8">
        <button @click="currentPage--" :disabled="currentPage === 1"
          class="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50">
          上一页
        </button>
        <button @click="currentPage++" :disabled="currentPage >= pagination.totalPages"
          class="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50">
          下一页
        </button>
      </div>
    </main>

    <!-- 侧边栏 -->
    <aside class="sidebar">
      <!-- 个人信息卡片骨架屏 -->
      <template v-if="loadingStates.author">
        <div class="sidebar-widget profile-card animate-pulse">
          <div class="profile-header">
            <div class="w-[100px] h-[100px] rounded-full bg-gray-200"></div>
            <div class="flex flex-col items-center gap-2">
              <div class="skeleton-text w-40 h-[28px]"></div>
              <!-- <div class="skeleton-text w-32 h-[20px]"></div> -->
              <div class="skeleton-text w-64 h-[20px]"></div>
            </div>
          </div>
          <div class="skeleton-stats">
            <div v-for="i in 3" :key="i" class="skeleton-stat-item">
              <div class="skeleton-text w-12 h-[28px]"></div>
              <div class="skeleton-text w-16 h-[20px]"></div>
            </div>
          </div>
        </div>
      </template>

      <!-- 错误提示 -->
      <template v-else-if="errors.author">
        <div class="sidebar-widget profile-card">
          <div class="text-center py-4 text-gray-500">
            <Icon name="carbon:warning" class="text-4xl mb-2" />
            <p>{{ errors.author }}</p>
            <button @click="fetchAuthor" class="mt-4 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg">
              重试
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="sidebar-widget profile-card">
          <div class="profile-header">
            <img :src="author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'"
              :alt="author?.username" class="w-[100px] h-[100px] rounded-full object-cover" />
            <div class="flex flex-col items-center gap-2">
              <h3 class="text-xl font-medium h-[28px] leading-[28px]">{{ author?.username || '未登录' }}</h3>
              <!-- <p class="text-sm text-gray-600 h-[20px] leading-[20px]">全栈开发者</p> -->
              <p class="text-sm text-gray-500 text-center leading-[20px] line-clamp-2">
                {{ author?.intro || '"代码如诗，编织数字世界的梦想"' }}
              </p>
            </div>
          </div>

          <div class="profile-stats">
            <div class="stat-item">
              <span class="text-xl font-medium h-[28px] leading-[28px]">{{ author?.stats.articles || 0 }}</span>
              <span class="text-sm text-gray-500 h-[20px] leading-[20px]">文章</span>
            </div>
            <div class="stat-item">
              <span class="text-xl font-medium h-[28px] leading-[28px]">{{ author?.stats.tags || 0 }}</span>
              <span class="text-sm text-gray-500 h-[20px] leading-[20px]">标签</span>
            </div>
            <div class="stat-item">
              <span class="text-xl font-medium h-[28px] leading-[28px]">{{ author?.stats.views || 0 }}</span>
              <span class="text-sm text-gray-500 h-[20px] leading-[20px]">访问</span>
            </div>
          </div>
        </div>
      </template>

      <WeatherCard></WeatherCard>
    </aside>
  </div>
</template>

<style scoped>
.blog-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: minmax(800px, 1fr) 300px;
  gap: 2rem;
}

@media (max-width: 768px) {
  .blog-layout {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .main-content {
    min-width: 100%;
  }
}

.main-content {
  min-width: 0;
  width: 100%;
  max-width: 900px;
}

.sidebar {
  position: sticky;
  top: 2rem;
  height: fit-content;
  width: 300px;
}

.sidebar-widget {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.widget-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f1f1f1;
}

.social-link {
  color: #666;
  transition: color 0.2s;
}

.social-link:hover {
  color: var(--primary-600);
}

.post-card {
  @apply mb-4 w-full;
}

.article-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  line-height: 1.5;
  min-height: 1.875rem;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-summary {
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  line-height: 1.5;
  min-height: 1.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: .5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.profile-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6;
  min-height: 360px;
  display: flex;
  flex-direction: column;
}

.profile-card .skeleton-avatar,
.profile-card img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto;
}

.profile-header,
.profile-card.animate-pulse {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 0;
}

.profile-stats,
.skeleton-stats {
  width: 100%;
  padding-top: 1.5rem;
  margin-top: auto;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-around;
}

.stat-item,
.skeleton-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 60px;
}

.username,
.skeleton-text {
  @apply font-medium;
}





/* 深色主题支持 */
:root[class~="dark"] {
  --card-bg: #1a1a1a;
  --card-border: #2a2a2a;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .sidebar {
    position: relative;
    top: 0;
    width: 100%;
  }

  .weather-card {
    margin-top: 1rem;
  }

  .profile-stats {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .stat-item {
    flex: 1;
    min-width: 80px;
  }
}

/* 骨架屏样式 */
.skeleton-avatar {
  width: 100px;
  height: 100px;
  background-color: #e5e7eb;
  border-radius: 50%;
  margin: 0 auto;
}

.skeleton-text {
  background-color: #e5e7eb;
  border-radius: 0.375rem;
}

.skeleton-circle {
  background-color: #e5e7eb;
  border-radius: 50%;
}

.skeleton-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 1.5rem;
  margin-top: auto;
  border-top: 1px solid #e5e7eb;
}

.skeleton-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* 骨架屏动画 */
@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* 响应式调整 */
@media (max-width: 768px) {
  /* ... 其他响应式样式保持不变 ... */

  .skeleton-avatar {
    width: 80px;
    height: 80px;
  }
}



/* 修改骨架屏样式 */
.avatar-wrapper {
  width: 100px;
  height: 100px;
  margin: 0 auto;
}

.skeleton-avatar {
  width: 100%;
  height: 100%;
  background-color: #e5e7eb;
  border-radius: 50%;
}

.profile-card {
  padding: 2rem 1.5rem;
  min-height: 360px;
}

.skeleton-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.skeleton-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .avatar-wrapper {
    width: 80px;
    height: 80px;
  }

  .profile-card {
    min-height: 320px;
  }
}

/* 统一卡片基础样式 */
.sidebar-widget.profile-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6;
  min-height: 360px;
  display: flex;
  flex-direction: column;
}

/* 统一头像样式 */
.profile-card .skeleton-avatar,
.profile-card img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto;
}

/* 统一内容布局 */
.profile-header,
.profile-card.animate-pulse {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 0;
}

/* 统一底部统计样式 */
.profile-stats,
.skeleton-stats {
  width: 100%;
  padding-top: 1.5rem;
  margin-top: auto;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-around;
}

.stat-item,
.skeleton-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 60px;
}

/* 统一文本样式 */
.username,
.skeleton-text {
  @apply font-medium;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .sidebar-widget.profile-card {
    min-height: 320px;
    padding: 1rem;
  }

  .profile-card .skeleton-avatar,
  .profile-card img {
    width: 80px;
    height: 80px;
  }
}

/* 城市选择面板样式 */
.city-select-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.city-list {
  padding: 0.5rem;
}

.city-item {
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0.25rem;
}

.city-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.location {
  position: relative;
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 确保标签在移动端正确换行 */
@media (max-width: 640px) {
  .post-card .flex {
    @apply gap-3;
  }

  .post-card h3 {
    @apply text-base mb-1;
  }

  .post-card p {
    @apply mb-2;
  }

  .post-card .flex-wrap {
    @apply gap-1;
  }
}
</style>
