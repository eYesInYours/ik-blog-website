/* eslint-disable */
<script lang="ts" setup>
// 添加必要的类型导入
import type { Article } from '~/types'

// 声明 Nuxt 的组合式 API 类型
declare module '#app' {
  interface PageMeta {
    layout?: string
  }
}

// 如果 Article 类型未在其他地方定义，可以在这里定义
interface Article {
  _id: string
  title: string
  content: string
  createdAt: string
  views?: number
  comments?: any[]
  category: string
  cover: string
  status: string
  tags: string[]
  author: {
    _id: string
    username: string
    avatar: string
  }
  authorAvatar: string
  updatedAt: string
}

definePageMeta({ layout: 'page' })
useHead({ title: '文章归档' })

const { fetchApi } = useApi()

// 类型定义
interface ArchiveData {
  years: {
    [key: string]: {
      months: {
        [key: string]: Article[]
      }
      count: number
    }
  }
  tags: {
    [key: string]: Article[]
  }
  categories: {
    [key: string]: {
      [key: string]: Article[]
    }
  }
  totalCount: number
}

// 状态管理
const activeTab = ref<'date' | 'tag' | 'category'>('date')
const expandedYears = ref<Set<string>>(new Set())
const expandedMonths = ref<Set<string>>(new Set())
const expandedCategories = ref<Set<string>>(new Set())
const searchQuery = ref('')
const sortBy = ref<'date' | 'views' | 'comments'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')
const loading = ref(true)

// 归档数据
const archiveData = ref<ArchiveData>({
  years: {},
  tags: {},
  categories: {},
  totalCount: 0
})

// 修改获取归档数据的函数
const fetchArchiveData = async () => {
  loading.value = true
  try {
    // 模拟 API 调用延迟
    const res = await fetchApi('/articles/archives', {
      params: {
        type: activeTab.value
      }
    })
    archiveData.value = res.data

  } catch (error) {
    console.error('获取归档数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 添加格式化日期的函数
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 切换展开状态
const toggleYear = (year: string) => {
  if (expandedYears.value.has(year)) {
    expandedYears.value.delete(year)
  } else {
    expandedYears.value.add(year)
  }
}

const toggleMonth = (monthKey: string) => {
  if (expandedMonths.value.has(monthKey)) {
    expandedMonths.value.delete(monthKey)
  } else {
    expandedMonths.value.add(monthKey)
  }
}

const toggleCategory = (category: string) => {
  if (expandedCategories.value.has(category)) {
    expandedCategories.value.delete(category)
  } else {
    expandedCategories.value.add(category)
  }
}

// 搜索和过滤
const filteredArticles = computed(() => {
  let articles: Article[] = []

  if (activeTab.value === 'time') {
    Object.values(archiveData.value.years).forEach(year => {
      Object.values(year.months).forEach(monthArticles => {
        articles = articles.concat(monthArticles)
      })
    })
  } else if (activeTab.value === 'tag') {
    Object.values(archiveData.value.tags).forEach(tagArticles => {
      articles = articles.concat(tagArticles)
    })
  } else {
    Object.values(archiveData.value.categories).forEach(category => {
      Object.values(category).forEach(categoryArticles => {
        articles = articles.concat(categoryArticles)
      })
    })
  }

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    articles = articles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query)
    )
  }

  // 排序
  articles.sort((a, b) => {
    let compareValue: number
    if (sortBy.value === 'date') {
      compareValue = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else if (sortBy.value === 'views') {
      compareValue = (b.views || 0) - (a.views || 0)
    } else {
      compareValue = (b.comments?.length || 0) - (a.comments?.length || 0)
    }
    return sortOrder.value === 'desc' ? compareValue : -compareValue
  })

  return articles
})

watch(activeTab, () => {
  fetchArchiveData()
})

// 初始化
onMounted(() => {
  fetchArchiveData()
})
</script>

<template>
  <div class="archive-layout">
    <!-- 侧边栏 -->
    <aside class="archive-sidebar">
      <!-- 统计信息 -->
      <div class="stats-card">
        <h3 class="text-lg font-semibold mb-2">统计信息</h3>
        <p>文章总数：{{ archiveData?.total || 0 }}</p>
      </div>

      <!-- 归档导航 -->
      <div class="nav-card">
        <div class="tabs">
          <button
            :class="['tab', { active: activeTab === 'date' }]"
            @click="activeTab = 'date'"
          >
            时间归档
          </button>
          <button
            :class="['tab', { active: activeTab === 'tag' }]"
            @click="activeTab = 'tag'"
          >
            标签归档
          </button>
          <button
            :class="['tab', { active: activeTab === 'category' }]"
            @click="activeTab = 'category'"
          >
            分类归档
          </button>
        </div>
      </div>

      <!-- 搜索和排序 -->
      <div class="filter-card">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="搜索文章..."
          class="search-input"
        />
        <select v-model="sortBy" class="sort-select">
          <option value="date">按日期</option>
          <option value="views">按阅读量</option>
          <option value="comments">按评论数</option>
        </select>
        <button @click="sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'">
          {{ sortOrder === 'desc' ? '降序' : '升序' }}
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="archive-content">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">加载中...</div>
      </div>

      <template v-else-if="archiveData?.archives">
        <!-- 标签归档视图 -->
        <template v-if="activeTab === 'tag'">
          <div v-for="archive in archiveData.archives" :key="archive.tag" class="archive-section">
            <div class="tag-header">
              <h3 class="text-lg font-medium">
                {{ archive.tag }}
                <span class="text-sm text-gray-500">({{ archive.count }})</span>
              </h3>
            </div>
            <div class="article-list">
              <div v-for="article in archive.articles" :key="article._id" class="article-item">
                <NuxtLink :to="`/articles/${article._id}`" class="article-link">
                  <span class="article-date">{{ formatDate(article.createdAt) }}</span>
                  <span class="article-title">{{ article.title }}</span>
                  <div class="article-meta">
                    <span>{{ article.likes }} 赞</span>
                    <span>{{ article.comments }} 评论</span>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </div>
        </template>

        <!-- 时间归档视图 -->
        <template v-else-if="activeTab === 'date'">
          <div v-for="year in archiveData.archives" :key="year.year" class="archive-section">
            <div class="year-header" @click="toggleYear(year.year.toString())">
              <h3 class="text-lg font-medium">
                {{ year.year }}年
                <span class="text-sm text-gray-500">({{ year.count }})</span>
              </h3>
            </div>
            <div v-if="expandedYears.has(year.year.toString())" class="year-content">
              <div v-for="month in year.months" :key="`${year.year}-${month.month}`" class="month-section">
                <div class="month-header">
                  {{ month.month }}月 ({{ month.count }})
                </div>
                <div class="article-list">
                  <div v-for="article in month.articles" :key="article._id" class="article-item">
                    <NuxtLink :to="`/articles/${article._id}`" class="article-link">
                      <span class="article-date">{{ formatDate(article.createdAt) }}</span>
                      <span class="article-title">{{ article.title }}</span>
                      <div class="article-meta">
                        <span>{{ article.likes }} 赞</span>
                        <span>{{ article.comments }} 评论</span>
                      </div>
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 分类归档视图 -->
        <template v-else>
          <div v-for="archive in archiveData.archives" :key="archive.category" class="archive-section">
            <div class="category-header">
              <h3 class="text-lg font-medium">
                {{ archive.category }}
                <span class="text-sm text-gray-500">({{ archive.count }})</span>
              </h3>
            </div>
            <div class="article-list">
              <div v-for="article in archive.articles" :key="article._id" class="article-item">
                <NuxtLink :to="`/articles/${article._id}`" class="article-link">
                  <span class="article-date">{{ formatDate(article.createdAt) }}</span>
                  <span class="article-title">{{ article.title }}</span>
                  <div class="article-meta">
                    <span>{{ article.likes }} 赞</span>
                    <span>{{ article.comments }} 评论</span>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </div>
        </template>
      </template>

      <div v-if="!loading && (!archiveData?.archives || archiveData.archives.length === 0)" class="empty-state">
        暂无文章
      </div>
    </main>
  </div>
</template>

<style scoped>
.archive-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  min-height: calc(100vh - 4rem);
  min-width: 320px;
}

.archive-sidebar {
  position: sticky;
  top: 1rem;
  height: calc(100vh - 2rem);
  overflow-y: auto;
}

.stats-card,
.nav-card,
.filter-card {
  background: white;
  padding: 1.25rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.tab {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  text-align: left;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.tab:hover {
  background-color: #f3f4f6;
}

.tab.active {
  background-color: #ecfdf5;
  color: #059669;
  border-color: #059669;
}

.search-input,
.sort-select {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.search-input:focus,
.sort-select:focus {
  outline: none;
  border-color: #059669;
  ring: 2px solid #059669;
}

.archive-content {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  min-height: calc(100vh - 2rem);
  overflow-y: auto;
  min-width: 0;
  width: 100%;
  min-width: 600px;
}

.year-header,
.month-header,
.category-header {
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.year-header:hover,
.month-header:hover,
.category-header:hover {
  background-color: #f9fafb;
}

.article-list {
  margin: 0.75rem 0;
  padding-left: 2rem;
  min-width: 280px;
}

.article-item {
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.article-item:hover {
  background-color: #f9fafb;
}

.article-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #374151;
}

.article-date {
  color: #6b7280;
  font-size: 0.875rem;
  min-width: 90px;
}

.article-title {
  flex: 1;
  font-weight: 500;
}

.article-meta {
  color: #6b7280;
  font-size: 0.75rem;
  display: flex;
  gap: 1rem;
}

.archive-sidebar::-webkit-scrollbar,
.archive-content::-webkit-scrollbar {
  width: 6px;
}

.archive-sidebar::-webkit-scrollbar-thumb,
.archive-content::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}

.archive-sidebar::-webkit-scrollbar-track,
.archive-content::-webkit-scrollbar-track {
  background-color: #f3f4f6;
}

.loading-state {
  min-height: calc(100vh - 5rem);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 2rem;
  min-width: 280px;
}

@media (max-width: 768px) {
  .archive-layout {
    grid-template-columns: 1fr;
  }

  .archive-sidebar {
    position: static;
    height: auto;
    min-height: auto;
    margin-bottom: 1.5rem;
  }

  .archive-content {
    min-height: calc(100vh - 20rem);
    min-width: 300px;
  }

  .tabs {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .tab {
    flex: 1;
    min-width: 120px;
    text-align: center;
  }
}
</style>
