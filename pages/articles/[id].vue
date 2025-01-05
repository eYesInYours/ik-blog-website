<template>
  <div class="article-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <span>加载中...</span>
    </div>

    <!-- 文章内容 -->
    <template v-else-if="article">
      <!-- 文章头部 -->
      <header class="article-header">
        <h1 class="article-title">{{ article.title }}</h1>

        <div class="article-meta">
          <div class="author-info">
            <img
              :src="article.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${article.author.username}`"
              :alt="article.author.username"
              class="author-avatar"
            />
            <span class="author-name">{{ article.author.username }}</span>
          </div>
          <time :datetime="article.createdAt" class="publish-date">
            {{ formatDate(article.createdAt) }}
          </time>
        </div>

        <!-- 文章封面 -->
        <div v-if="article.cover" class="article-cover">
          <img :src="article.cover" :alt="article.title" />
        </div>
      </header>

      <!-- 文章内容 -->
      <article class="article-content markdown-body" v-html="sanitizedContent" />

      <!-- 文章底部 -->
      <footer class="article-footer">
        <div class="tags">
          <span v-for="tag in article.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </footer>

      <!-- 评论区 -->
      <section class="comments-section">
        <h2 class="section-title">评论 ({{ article.comments.length }})</h2>

        <!-- 评论列表 -->
        <div class="comments-list">
          <template v-if="article.comments.length > 0">
            <CommentIndex
              v-for="comment in article.comments"
              :key="comment._id"
              :comment="comment"
              :submitting="submitting"
            />
          </template>
          <div v-else class="no-comments">
            暂无评论，来发表第一条评论吧！
          </div>
        </div>

        <!-- 评论输入框 -->
        <CommentInput
          :show="true"
          placeholder="写下你的评论..."
          submit-text="发表评论"
          :submitting="submitting"
          @submit="handleCommentSubmit"
        />
      </section>
    </template>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="retry-button" @click="fetchArticle">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import DOMPurify from 'isomorphic-dompurify'

interface Author {
  _id: string
  username: string
  avatar: string
}

interface Comment {
  _id: string
  content: string
  author: Author
  createdAt: string
  likes: number
  replies?: Comment[]
}

interface Article {
  _id: string
  title: string
  content: string
  cover: string
  author: Author
  tags: string[]
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

const route = useRoute()
const { fetchApi } = useApi()
const { user } = useAuth()

// 状态管理
const article = ref<Article | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const submitting = ref(false)

// 配置 marked
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true
})

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 处理文章内容
const sanitizedContent = computed(() => {
  if (!article.value?.content) return ''

  const rendered = marked(article.value.content)
  return DOMPurify.sanitize(rendered)
})

// 获取文章数据
const fetchArticle = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await fetchApi<{
      code: number
      data: Article
      message: string
    }>(`/articles/${route.params.id}`)

    if (response.code === 200) {
      article.value = response.data
    } else {
      throw new Error(response.message)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取文章失败'
  } finally {
    loading.value = false
  }
}

// 提交评论
const handleCommentSubmit = async (content: string) => {
  if (!user.value) {
    navigateTo('/login')
    return
  }

  if (!content.trim()) {
    return
  }

  submitting.value = true
  try {
    await fetchApi('/comments', {
      method: 'POST',
      body: {
        articleId: article.value?._id,
        content
      }
    })
    // 重新获取文章数据以更新评论
    await fetchArticle()
  } catch (err) {
    console.error('提交评论失败:', err)
  } finally {
    submitting.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchArticle()
})

// 监听路由变化
watch(() => route.params.id, () => {
  fetchArticle()
})
</script>

<style scoped>
.article-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.article-header {
  margin-bottom: 2rem;
}

.article-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.3;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-weight: 500;
}

.publish-date {
  color: #666;
}

.article-cover {
  margin-bottom: 2rem;
  border-radius: 8px;
  overflow: hidden;
}

.article-cover img {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
}

.article-content {
  line-height: 1.8;
  color: #333;
}

.article-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #f3f4f6;
  border-radius: 9999px;
  font-size: 0.875rem;
  color: #374151;
}

.comments-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-button {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.375rem;
  font-weight: 500;
}

.no-comments {
  text-align: center;
  padding: 2rem;
  color: #666;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .article-container {
    padding: 1rem;
  }

  .article-title {
    font-size: 2rem;
  }
}
</style>
