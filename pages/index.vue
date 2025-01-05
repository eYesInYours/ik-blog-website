<script lang="ts" setup>
const { awesome } = useAppConfig()
definePageMeta({ layout: 'page' })
useHead({ titleTemplate: '', title: awesome?.name || '我的技术博客' })

const { fetchApi } = useApi()

interface Author {
  _id: string
  username: string
  avatar: string
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

// 获取文章列表
const fetchArticles = async (page = 1) => {
  try {
    const response = await fetchApi<ArticleResponse>('/articles', {
      params: {
        page,
        limit: pagination.value.limit,
      },
    })

    if (response.code === 200) {
      articles.value = response.data.articles
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
  }
}

// 初始加载
onMounted(() => {
  fetchArticles()
})

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
</script>

<template>
  <div class="blog-layout">
    <!-- 主内容区 -->
    <main class="main-content">
      <section class="posts-list">
        <h2 class="text-2xl font-bold mb-6">最新文章</h2>

        <!-- <NuxtLink :to="`/articles/${article._id}`"> -->
        <article
          v-for="article in filteredArticles"
          :key="article._id"
          class="post-card mb-8 bg-white rounded-lg shadow-sm overflow-hidden"
          @click="handleClick(article._id)"
        >
          <!-- 文章封面图 -->
          <div class="post-cover h-48 overflow-hidden">
            <img
              :src="article.cover"
              :alt="article.title"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div class="p-6">
            <h3 class="text-xl font-semibold mb-2">
              <!-- <NuxtLink
                :to="`/posts/${article._id}`"
                class="hover:text-primary-600"
              >
                {{ article.title }}
              </NuxtLink> -->
            </h3>

            <p class="text-gray-600 mb-4">
              {{ article.content.replace(/<[^>]+>/g, '').slice(0, 200) }}...
            </p>

            <div class="flex items-center text-sm text-gray-500">
              <span>{{ formatDate(article.createdAt) }}</span>
              <span class="mx-2">·</span>
              <span>{{ article.author.username }}</span>

              <div class="ml-4 flex gap-2">
                <span
                  v-for="tag in article.tags"
                  :key="tag"
                  class="px-2 py-1 bg-gray-100 rounded-full text-xs"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </article>
        <!-- </NuxtLink> -->
      </section>

      <!-- 分页控件 -->
      <div class="flex justify-center gap-2 mt-8">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
        >
          上一页
        </button>
        <button
          @click="currentPage++"
          :disabled="currentPage >= pagination.totalPages"
          class="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </main>

    <!-- 侧边栏 -->
    <aside class="sidebar">
      <!-- 搜索框 -->
      <div class="sidebar-widget">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="搜索文章..."
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <!-- 标签云 -->
      <div class="sidebar-widget">
        <h3 class="widget-title">标签</h3>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="tag in tags"
            :key="tag"
            :to="`/tags/${tag}`"
            class="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-primary-100"
          >
            {{ tag }}
          </NuxtLink>
        </div>
      </div>

      <!-- 最新文章 -->
      <div class="sidebar-widget">
        <h3 class="widget-title">最新文章</h3>
        <ul class="space-y-4">
          <li v-for="article in articles.slice(0, 5)" :key="article._id">
            <NuxtLink
              :to="`/posts/${article._id}`"
              class="text-sm hover:text-primary-600"
            >
              {{ article.title }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.blog-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
}

@media (max-width: 768px) {
  .blog-layout {
    grid-template-columns: 1fr;
  }
}

.main-content {
  min-width: 0;
}

.sidebar {
  position: sticky;
  top: 2rem;
  height: fit-content;
}

.sidebar-widget {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
  transition: transform 0.2s;
}

.post-card:hover {
  transform: translateY(-2px);
}
</style>
