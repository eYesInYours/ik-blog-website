<script lang="ts" setup>
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
const activeTab = ref<'time' | 'tag' | 'category'>('time')
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

// 添加模拟数据
const mockArchiveData: ArchiveData = {
  years: {
    '2024': {
      months: {
        '03': [
          {
            _id: '1',
            title: '如何使用 Vue 3 Composition API',
            content: '这是一篇关于 Vue 3 Composition API 的详细教程...',
            createdAt: '2024-03-15T08:00:00.000Z',
            views: 156,
            comments: new Array(5),
            category: '前端开发',
            cover: 'https://picsum.photos/800/400',
            status: 'published',
            tags: ['Vue', 'JavaScript'],
            author: {
              _id: 'author1',
              username: '小书斋',
              avatar: 'https://picsum.photos/50/50'
            },
            authorAvatar: 'https://picsum.photos/50/50',
            updatedAt: '2024-03-15T08:00:00.000Z'
          },
          {
            _id: '2',
            title: 'TypeScript 高级特性详解',
            content: 'TypeScript 提供了许多高级特性，本文将详细介绍...',
            createdAt: '2024-03-10T08:00:00.000Z',
            views: 234,
            comments: new Array(8),
            category: '前端开发',
            cover: 'https://picsum.photos/800/400',
            status: 'published',
            tags: ['TypeScript', 'JavaScript'],
            author: {
              _id: 'author1',
              username: '小书斋',
              avatar: 'https://picsum.photos/50/50'
            },
            authorAvatar: 'https://picsum.photos/50/50',
            updatedAt: '2024-03-10T08:00:00.000Z'
          }
        ],
        '02': [
          {
            _id: '3',
            title: 'Node.js 性能优化实践',
            content: '本文将分享一些 Node.js 性能优化的实践经验...',
            createdAt: '2024-02-28T08:00:00.000Z',
            views: 189,
            comments: new Array(6),
            category: '后端开发',
            cover: 'https://picsum.photos/800/400',
            status: 'published',
            tags: ['Node.js', 'Performance'],
            author: {
              _id: 'author1',
              username: '小书斋',
              avatar: 'https://picsum.photos/50/50'
            },
            authorAvatar: 'https://picsum.photos/50/50',
            updatedAt: '2024-02-28T08:00:00.000Z'
          }
        ]
      },
      count: 3
    },
    '2023': {
      months: {
        '12': [
          {
            _id: '4',
            title: '深入理解 React Hooks',
            content: 'React Hooks 的原理与最佳实践...',
            createdAt: '2023-12-25T08:00:00.000Z',
            views: 345,
            comments: new Array(12),
            category: '前端开发',
            cover: 'https://picsum.photos/800/400',
            status: 'published',
            tags: ['React', 'JavaScript'],
            author: {
              _id: 'author1',
              username: '小书斋',
              avatar: 'https://picsum.photos/50/50'
            },
            authorAvatar: 'https://picsum.photos/50/50',
            updatedAt: '2023-12-25T08:00:00.000Z'
          }
        ]
      },
      count: 1
    }
  },
  tags: {
    'Vue': [/* 相关文章 */],
    'React': [/* 相关文章 */],
    'TypeScript': [/* 相关文章 */],
    'Node.js': [/* 相关文章 */],
    'JavaScript': [/* 相关文章 */]
  },
  categories: {
    '前端开发': {
      'Vue': [/* 相关文章 */],
      'React': [/* 相关文章 */]
    },
    '后端开发': {
      'Node.js': [/* 相关文章 */]
    }
  },
  totalCount: 4
}

// 修改获取归档数据的函数
const fetchArchiveData = async () => {
  loading.value = true
  try {
    // 模拟 API 调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    archiveData.value = mockArchiveData
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
        <p>文章总数：{{ archiveData.totalCount }}</p>
      </div>

      <!-- 归档导航 -->
      <div class="nav-card">
        <div class="tabs">
          <button 
            :class="['tab', { active: activeTab === 'time' }]"
            @click="activeTab = 'time'"
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
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="animate-pulse space-y-4">
          <div v-for="i in 5" :key="i">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- 时间归档 -->
      <template v-else-if="activeTab === 'time'">
        <div v-for="(yearData, year) in archiveData.years" :key="year" class="year-section">
          <div 
            class="year-header"
            @click="toggleYear(year)"
          >
            <h3>{{ year }} 年 ({{ yearData.count }})</h3>
            <span class="toggle-icon">{{ expandedYears.has(year) ? '−' : '+' }}</span>
          </div>

          <div v-if="expandedYears.has(year)" class="year-content">
            <div 
              v-for="(monthArticles, month) in yearData.months" 
              :key="`${year}-${month}`"
              class="month-section"
            >
              <div 
                class="month-header"
                @click="toggleMonth(`${year}-${month}`)"
              >
                <h4>{{ month }} 月 ({{ monthArticles.length }})</h4>
                <span class="toggle-icon">
                  {{ expandedMonths.has(`${year}-${month}`) ? '−' : '+' }}
                </span>
              </div>

              <ul v-if="expandedMonths.has(`${year}-${month}`)" class="article-list">
                <li v-for="article in monthArticles" :key="article._id" class="article-item">
                  <NuxtLink :to="`/articles/${article._id}`" class="article-link">
                    <span class="article-date">{{ formatDate(article.createdAt) }}</span>
                    <span class="article-title">{{ article.title }}</span>
                    <span class="article-meta">
                      <span>{{ article.views || 0 }} 阅读</span>
                      <span>{{ article.comments?.length || 0 }} 评论</span>
                    </span>
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </template>

      <!-- 标签归档 -->
      <template v-else-if="activeTab === 'tag'">
        <div class="tags-container">
          <div v-for="(articles, tag) in archiveData.tags" :key="tag" class="tag-section">
            <h3 class="tag-header">{{ tag }} ({{ articles.length }})</h3>
            <ul class="article-list">
              <li v-for="article in articles" :key="article._id" class="article-item">
                <NuxtLink :to="`/articles/${article._id}`" class="article-link">
                  <span class="article-date">{{ formatDate(article.createdAt) }}</span>
                  <span class="article-title">{{ article.title }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </template>

      <!-- 分类归档 -->
      <template v-else>
        <div class="categories-container">
          <div 
            v-for="(subCategories, category) in archiveData.categories" 
            :key="category"
            class="category-section"
          >
            <div 
              class="category-header"
              @click="toggleCategory(category)"
            >
              <h3>{{ category }}</h3>
              <span class="toggle-icon">
                {{ expandedCategories.has(category) ? '−' : '+' }}
              </span>
            </div>

            <div v-if="expandedCategories.has(category)" class="category-content">
              <div 
                v-for="(articles, subCategory) in subCategories" 
                :key="subCategory"
                class="subcategory-section"
              >
                <h4 class="subcategory-header">{{ subCategory }} ({{ articles.length }})</h4>
                <ul class="article-list">
                  <li v-for="article in articles" :key="article._id" class="article-item">
                    <NuxtLink :to="`/articles/${article._id}`" class="article-link">
                      <span class="article-date">{{ formatDate(article.createdAt) }}</span>
                      <span class="article-title">{{ article.title }}</span>
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </template>
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
}

.archive-sidebar {
  position: sticky;
  top: 1rem;
  height: fit-content;
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
  min-height: 500px;
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

@media (max-width: 768px) {
  .archive-layout {
    grid-template-columns: 1fr;
  }

  .archive-sidebar {
    position: static;
    margin-bottom: 1rem;
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