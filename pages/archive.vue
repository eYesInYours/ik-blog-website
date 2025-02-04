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

const { $request } = useNuxtApp()

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
    const { data, error } = await $request.get('/articles/archives', {
      type: activeTab.value
    })
    archiveData.value = data.value
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
fetchArchiveData()

const navItems = [
  { type: 'date', label: '时间归档', icon: 'i-carbon-calendar' },
  { type: 'tag', label: '标签归档', icon: 'i-carbon-tag' },
  { type: 'category', label: '分类归档', icon: 'i-carbon-folder' }
]
</script>

<template>
  <div class="archive-layout">
    <!-- 侧边栏 -->
    <aside class="archive-sidebar">
      <!-- 侧边栏导航 -->
      <div class="sidebar-menu">
        <!-- 统计信息 -->
        <div class="stats-card">
          <div class="stats-header">
            <i class="i-carbon-analytics text-lg" />
            <span>统计信息</span>
          </div>
          <div class="stats-content">
            <div class="stats-item">
              <i class="i-carbon-document text-lg" />
              <span>文章总数：</span>
              <span class="stats-number">{{ archiveData?.total || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 归档导航 -->
        <div class="archive-nav">
          <button 
            v-for="(item, index) in navItems" 
            :key="index"
            class="nav-btn"
            :class="{ active: activeTab === item.type }"
            @click="activeTab = item.type"
          >
            <div class="btn-content">
              <i :class="item.icon" />
              <span>{{ item.label }}</span>
            </div>
            <div class="btn-indicator" />
          </button>
        </div>
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
            <div class="parent-category">
              <h3 class="parent-title">
                <i class="i-carbon-tag text-xl" />
                {{ archive.tag }}
                <span class="count">({{ archive.count }})</span>
              </h3>
            </div>
            <div class="article-list">
              <div v-for="article in archive.articles" :key="article._id" class="article-item">
                <NuxtLink :to="`/articles/${article._id}`" class="article-link">
                  <time class="article-date">{{ formatDate(article.createdAt) }}</time>
                  <h5 class="article-title">{{ article.title }}</h5>
                  <div class="article-meta">
                    <span class="meta-item" :title="`${article.likes} 人点赞`">
                      <i class="i-carbon-favorite text-sm" />
                      {{ article.likes }} 赞
                    </span>
                    <span class="meta-item" :title="`${article.comments} 条评论`">
                      <i class="i-carbon-chat text-sm" />
                      {{ article.comments }} 评论
                    </span>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </div>
        </template>

        <!-- 时间归档视图 -->
        <template v-else-if="activeTab === 'date'">
          <div v-for="year in archiveData.archives" :key="year.year" class="archive-section">
            <div class="parent-category">
              <h3 class="parent-title">
                <i class="i-carbon-calendar text-xl" />
                {{ year.year }}年
                <span class="count">({{ year.count }})</span>
              </h3>
            </div>
            <div class="children-categories">
              <div v-for="month in year.months" :key="`${year.year}-${month.month}`" class="child-category">
                <div class="child-header">
                  <h4 class="child-title">
                    <i class="i-carbon-calendar-heat-map text-lg" />
                    {{ month.month }}月
                    <span class="count">({{ month.count }})</span>
                  </h4>
                </div>
                <div class="article-list">
                  <div v-for="article in month.articles" :key="article._id" class="article-item">
                    <NuxtLink :to="`/articles/${article._id}`" class="article-link">
                      <time class="article-date">{{ formatDate(article.createdAt) }}</time>
                      <h5 class="article-title">{{ article.title }}</h5>
                      <div class="article-meta">
                        <span class="meta-item" :title="`${article.likes} 人点赞`">
                          <i class="i-carbon-favorite text-sm" />
                          {{ article.likes }} 赞
                        </span>
                        <span class="meta-item" :title="`${article.comments} 条评论`">
                          <i class="i-carbon-chat text-sm" />
                          {{ article.comments }} 评论
                        </span>
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
            <!-- 父分类 -->
            <div class="parent-category">
              <h3 class="parent-title">
                <i class="i-carbon-folder text-xl" />
                {{ archive.categoryName }}
                <span class="count">({{ archive.count }})</span>
              </h3>
            </div>
            
            <!-- 子分类列表 -->
            <div class="children-categories">
              <div v-for="childCategory in archive.children" :key="childCategory.category" class="child-category">
                <div class="child-header">
                  <h4 class="child-title">
                    <i class="i-carbon-folder-details text-lg" />
                    {{ childCategory.categoryName }}
                    <span class="count">({{ childCategory.count }})</span>
                  </h4>
                </div>
                
                <!-- 文章列表 -->
                <div class="article-list">
                  <div v-for="article in childCategory.articles" :key="article._id" class="article-item">
                    <NuxtLink :to="`/articles/${article._id}`" class="article-link">
                      <time class="article-date">{{ formatDate(article.createdAt) }}</time>
                      <h5 class="article-title">{{ article.title }}</h5>
                      <div class="article-meta">
                        <span class="meta-item" :title="`${article.likes} 人点赞`">
                          <i class="i-carbon-favorite text-sm" />
                          {{ article.likes }} 赞
                        </span>
                        <span class="meta-item" :title="`${article.comments} 条评论`">
                          <i class="i-carbon-chat text-sm" />
                          {{ article.comments }} 评论
                        </span>
                      </div>
                    </NuxtLink>
                  </div>
                </div>
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

<style lang="scss" scoped>
.archive-layout {
  @apply max-w-7xl mx-auto px-4 py-8 grid gap-6;
  grid-template-columns: 280px 800px; // 固定两列宽度
}

.archive-content {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm;
  width: 800px; // 固定宽度
}

.article-list {
  @apply divide-y divide-gray-100 dark:divide-gray-700;
  width: 100%;

  .article-item {
    @apply transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50;

    .article-link {
      @apply p-3 flex items-center gap-4 text-sm;
      
      .article-date {
        width: 100px; // 固定日期宽度
        @apply text-gray-500 dark:text-gray-400 shrink-0 font-medium;
      }
      
      .article-title {
        width: 400px; // 固定标题宽度
        @apply text-gray-700 dark:text-gray-300 
               hover:text-primary-500 dark:hover:text-primary-400 
               transition-colors font-medium truncate;
      }
      
      .article-meta {
        width: 200px; // 固定统计区域宽度
        @apply flex items-center gap-4;
        
        .meta-item {
          width: 90px; // 固定每个统计项宽度
          @apply flex items-center gap-1.5 text-gray-500 dark:text-gray-400 
                 hover:text-primary-500 dark:hover:text-primary-400 transition-colors;
        }
      }
    }
  }
}

@media (max-width: 1200px) {
  .archive-layout {
    grid-template-columns: 240px 800px; // 较小屏幕时只减小侧边栏宽度
  }
}

@media (max-width: 1080px) {
  .archive-layout {
    @apply grid-cols-1 items-start; // 单列布局
  }

  .archive-content {
    width: 100%; // 移动端占满宽度
    max-width: 800px; // 但不超过最大宽度
    margin: 0 auto;
  }

  .article-link {
    @apply flex-col items-start;
    
    .article-title {
      width: 100% !important; // 移动端标题占满宽度
    }
    
    .article-meta {
      width: 100% !important; // 移动端统计信息占满宽度
      @apply justify-start;
    }
  }
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
  @apply bg-white dark:bg-gray-800 p-5 rounded-lg mb-4 shadow-sm;
}

.stats-card h3 {
  @apply text-gray-900 dark:text-gray-100;
}

.stats-card p {
  @apply text-gray-600 dark:text-gray-400;
}

.tab {
  @apply w-full px-4 py-2 rounded-lg text-left transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent;
}

.tab.active {
  @apply bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 border-primary-500 dark:border-primary-400;
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

.year-header,
.month-header,
.category-header {
  @apply text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg;
}

.year-header span,
.month-header span,
.category-header span {
  @apply text-gray-500 dark:text-gray-400;
}

.article-list {
  margin: 0.75rem 0;
  padding-left: 2rem;
  min-width: 280px;
}

.article-item {
  @apply hover:bg-gray-50 dark:hover:bg-gray-700/50;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.article-link {
  @apply text-gray-700 dark:text-gray-300;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.article-date {
  @apply text-gray-500 dark:text-gray-400;
  font-size: 0.875rem;
  min-width: 90px;
}

.article-title {
  @apply text-gray-900 dark:text-gray-100;
  flex: 1;
  font-weight: 500;
}

.article-meta {
  @apply text-gray-500 dark:text-gray-400;
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
  @apply bg-gray-300 dark:bg-gray-600;
  border-radius: 3px;
}

.archive-sidebar::-webkit-scrollbar-track,
.archive-content::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

.loading-state {
  min-height: calc(100vh - 5rem);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 2rem;
  min-width: 280px;
}

.loading-spinner {
  @apply text-gray-400 dark:text-gray-500;
}

.archive-section {
  @apply mb-8 last:mb-0;

  .parent-category {
    @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4;

    .parent-title {
      @apply flex items-center gap-2 text-xl font-medium text-gray-900 dark:text-gray-100;
      
      i {
        @apply text-primary-500 dark:text-primary-400;
      }
      
      .count {
        @apply text-sm font-normal text-gray-500 dark:text-gray-400;
      }
    }
  }

  .children-categories {
    @apply space-y-4 pl-6;

    .child-category {
      @apply bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm;

      .child-header {
        @apply p-3 border-b border-gray-100 dark:border-gray-700;

        .child-title {
          @apply flex items-center gap-2 text-base font-medium text-gray-800 dark:text-gray-200;
          
          i {
            @apply text-gray-400 dark:text-gray-500;
          }
          
          .count {
            @apply text-sm font-normal text-gray-500 dark:text-gray-400;
          }
        }
      }
    }
  }
}

.count {
  @apply ml-2;
}

.sidebar-menu {
  @apply flex flex-col gap-4;
}

.stats-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden
         border border-gray-100 dark:border-gray-700;

  .stats-header {
    @apply flex items-center gap-2.5 px-5 py-3.5 
           border-b border-gray-100 dark:border-gray-700
           bg-gray-50 dark:bg-gray-700/50;

    i {
      @apply text-primary-500 dark:text-primary-400;
    }

    span {
      @apply text-base font-medium text-gray-900 dark:text-gray-100;
    }
  }

  .stats-content {
    @apply p-5;

    .stats-item {
      @apply flex items-center gap-2;

      i {
        @apply text-gray-400 dark:text-gray-500;
      }

      span {
        @apply text-gray-600 dark:text-gray-400;
      }

      .stats-number {
        @apply text-primary-500 dark:text-primary-400 font-medium;
      }
    }
  }
}

.archive-nav {
  @apply bg-white dark:bg-gray-800 rounded-xl p-2.5 shadow-sm
         border border-gray-100 dark:border-gray-700 space-y-1;

  .nav-btn {
    @apply relative w-full px-4 py-3 rounded-lg transition-all
           text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50;

    .btn-content {
      @apply flex items-center gap-3;

      i {
        @apply text-lg text-gray-400 dark:text-gray-500 transition-colors;
      }

      span {
        @apply font-medium;
      }
    }

    &:hover {
      @apply text-primary-500 dark:text-primary-400;

      i {
        @apply text-primary-500 dark:text-primary-400;
      }
    }

    &.active {
      @apply bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400;

      i {
        @apply text-primary-500 dark:text-primary-400;
      }

      &::after {
        content: '';
        @apply absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5
               bg-primary-500 dark:bg-primary-400 rounded-full;
      }
    }
  }
}

@media (max-width: 768px) {
  .archive-nav {
    @apply flex flex-row gap-2 p-2;

    .nav-btn {
      @apply flex-1 min-w-[100px];

      .btn-content {
        @apply justify-center;
      }

      &.active::after {
        @apply hidden;
      }
    }
  }
}
</style>
