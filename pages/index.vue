<script lang="ts" setup>
const { awesome } = useAppConfig()
definePageMeta({ layout: 'page' })
useHead({ titleTemplate: '', title: awesome?.name || '我的技术博客' })

// 文章列表数据
const posts = ref([
  {
    id: 1,
    title: '使用 Nuxt 3 构建现代化博客',
    summary: '本文介绍如何使用 Nuxt 3、Vue 3 和 TypeScript 构建一个现代化的技术博客...',
    date: '2024-03-20',
    author: 'John Doe',
    cover: '/images/blog-1.jpg',
    tags: ['Nuxt', 'Vue', 'TypeScript']
  },
  // 更多文章...
])

// 侧边栏数据
const tags = ref(['Vue', 'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python'])
const categories = ref(['前端开发', '后端开发', '开发工具', '学习笔记'])
const recentPosts = computed(() => posts.value.slice(0, 5))

// 搜索功能
const searchQuery = ref('')
const filteredPosts = computed(() => {
  if (!searchQuery.value) return posts.value
  return posts.value.filter(post => 
    post.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 分页相关
const currentPage = ref(1)
const postsPerPage = 5
const currentPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage
  return filteredPosts.value.slice(start, start + postsPerPage)
})
</script>

<template>
  <div class="blog-layout">
    <!-- 主内容区 -->
    <main class="main-content">
      <section class="posts-list">
        <h2 class="text-2xl font-bold mb-6">最新文章</h2>
        
        <article v-for="post in currentPosts" :key="post.id" 
                class="post-card mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
          <!-- 文章封面图 -->
          <div class="post-cover h-48 overflow-hidden">
            <img :src="post.cover" :alt="post.title" 
                 class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
          </div>
          
          <div class="p-6">
            <h3 class="text-xl font-semibold mb-2">
              <NuxtLink :to="`/posts/${post.id}`" class="hover:text-primary-600">
                {{ post.title }}
              </NuxtLink>
            </h3>
            
            <p class="text-gray-600 mb-4">{{ post.summary }}</p>
            
            <div class="flex items-center text-sm text-gray-500">
              <span>{{ post.date }}</span>
              <span class="mx-2">·</span>
              <span>{{ post.author }}</span>
              
              <div class="ml-4 flex gap-2">
                <span v-for="tag in post.tags" :key="tag" 
                      class="px-2 py-1 bg-gray-100 rounded-full text-xs">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <!-- 分页控件 -->
      <div class="flex justify-center gap-2 mt-8">
        <button @click="currentPage--" 
                :disabled="currentPage === 1"
                class="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50">
          上一页
        </button>
        <button @click="currentPage++" 
                :disabled="currentPage * postsPerPage >= filteredPosts.length"
                class="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50">
          下一页
        </button>
      </div>
    </main>

    <!-- 侧边栏 -->
    <aside class="sidebar">
      <!-- 搜索框 -->
      <div class="sidebar-widget">
        <input v-model="searchQuery"
               type="search"
               placeholder="搜索文章..."
               class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
      </div>

      <!-- 个人简介 -->
      <div class="sidebar-widget">
        <h3 class="widget-title">关于我</h3>
        <div class="text-center">
          <img src="/login-bg.jpg" alt="头像" class="w-24 h-24 rounded-full mx-auto mb-4">
          <p class="text-gray-600">前端开发工程师，热爱技术分享</p>
        </div>
      </div>

      <!-- 社交媒体链接 -->
      <div class="sidebar-widget">
        <h3 class="widget-title">关注我</h3>
        <div class="flex justify-center gap-4">
          <a href="https://github.com" target="_blank" class="social-link">
            <i class="i-carbon-logo-github text-2xl"></i>
          </a>
          <a href="https://twitter.com" target="_blank" class="social-link">
            <i class="i-carbon-logo-twitter text-2xl"></i>
          </a>
          <a href="https://linkedin.com" target="_blank" class="social-link">
            <i class="i-carbon-logo-linkedin text-2xl"></i>
          </a>
        </div>
      </div>

      <!-- 分类 -->
      <div class="sidebar-widget">
        <h3 class="widget-title">分类</h3>
        <ul class="space-y-2">
          <li v-for="category in categories" :key="category">
            <NuxtLink :to="`/category/${category}`" 
                      class="text-gray-600 hover:text-primary-600">
              {{ category }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- 标签云 -->
      <div class="sidebar-widget">
        <h3 class="widget-title">标签</h3>
        <div class="flex flex-wrap gap-2">
          <NuxtLink v-for="tag in tags" 
                    :key="tag" 
                    :to="`/tags/${tag}`"
                    class="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-primary-100">
            {{ tag }}
          </NuxtLink>
        </div>
      </div>

      <!-- 最新文章 -->
      <div class="sidebar-widget">
        <h3 class="widget-title">最新文章</h3>
        <ul class="space-y-4">
          <li v-for="post in recentPosts" :key="post.id">
            <NuxtLink :to="`/posts/${post.id}`" 
                      class="text-sm hover:text-primary-600">
              {{ post.title }}
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
