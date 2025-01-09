<script lang="ts" setup>
definePageMeta({ layout: 'page' })
useHead({ title: '评论管理' })

// 评论数据类型定义
interface Author {
  _id: string
  username: string
  avatar: string
}

interface Article {
  _id: string
  title: string
}

interface Comment {
  _id: string
  author: Author
  content: string
  article: Article
  parentComment: Comment | null
  createdAt: string
}

interface Pagination {
  total: number
  totalPages: number
  currentPage: number
  limit: number
}

// 状态
const comments = ref<Comment[]>([])
const pagination = ref<Pagination>({
  total: 0,
  totalPages: 0,
  currentPage: 1,
  limit: 10
})
const selectedArticleId = ref('')
const articles = ref<Article[]>([])
const loading = ref(false)

// 获取文章列表
const fetchArticles = async () => {
  try {
    const { data } = await useFetch('/api/articles')
    articles.value = data.value?.data?.articles || []
  } catch (error) {
    console.error('获取文章列表失败:', error)
  }
}

// 获取评论列表
const fetchComments = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.currentPage,
      limit: pagination.value.limit,
      ...(selectedArticleId.value && { articleId: selectedArticleId.value })
    }

    const { data } = await useFetch('/api/comments', {
      params
    })

    if (data.value) {
      comments.value = data.value.comments
      pagination.value = data.value.pagination
    }
  } catch (error) {
    console.error('获取评论列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听文章选择变化
watch(selectedArticleId, () => {
  pagination.value.currentPage = 1
  fetchComments()
})

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 删除评论
const deleteComment = async (commentId: string) => {
  if (!confirm('确定要删除这条评论吗？')) return

  try {
    await useFetch(`/api/comments/${commentId}`, {
      method: 'DELETE'
    })
    await fetchComments()
  } catch (error) {
    console.error('删除评论失败:', error)
  }
}

// 初始化
onMounted(() => {
  fetchArticles()
  fetchComments()
})
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageSection>
      <div class="comments-page">
        <!-- 页面标题和工具栏 -->
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold">评论管理</h1>

          <!-- 文章选择 -->
          <select
            v-model="selectedArticleId"
            class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600"
          >
            <option value="">全部文章</option>
            <option
              v-for="article in articles"
              :key="article._id"
              :value="article._id"
            >
              {{ article.title }}
            </option>
          </select>
        </div>

        <!-- 评论列表 -->
        <div v-if="!loading" class="space-y-4">
          <div
            v-for="comment in comments"
            :key="comment._id"
            class="bg-white dark:bg-dark-500 rounded-lg p-4 shadow-sm"
          >
            <!-- 评论头部 -->
            <div class="flex justify-between items-start mb-2">
              <div class="flex items-center space-x-3">
                <img
                  :src="comment.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.username}`"
                  :alt="comment.author.username"
                  class="w-8 h-8 rounded-full"
                >
                <div>
                  <span class="font-medium">{{ comment.author.username }}</span>
                  <span class="text-sm text-gray-500 ml-2">
                    {{ formatDate(comment.createdAt) }}
                  </span>
                </div>
              </div>

              <button
                @click="deleteComment(comment._id)"
                class="text-red-500 hover:text-red-600"
              >
                删除
              </button>
            </div>

            <!-- 文章信息 -->
            <div class="text-sm text-gray-500 mb-2">
              文章：{{ comment.article.title }}
            </div>

            <!-- 评论内容 -->
            <div class="text-gray-700 dark:text-gray-300">
              <template v-if="comment.parentComment">
                <div class="text-sm text-gray-500 mb-1">
                  回复 @{{ comment.parentComment.author.username }}：
                  <span class="text-gray-400">{{ comment.parentComment.content }}</span>
                </div>
              </template>
              {{ comment.content }}
            </div>
          </div>
        </div>

        <!-- 加载中 -->
        <div v-else class="flex justify-center py-8">
          <div class="loading-spinner"></div>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.total > 0" class="flex justify-center mt-6">
          <button
            v-for="page in pagination.totalPages"
            :key="page"
            @click="pagination.currentPage = page; fetchComments()"
            :class="[
              'mx-1 px-3 py-1 rounded',
              page === pagination.currentPage
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>

<style scoped>
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
