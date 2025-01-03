<script lang="ts" setup>
definePageMeta({ layout: 'page' })
useHead({ title: '评论管理' })

// 评论数据
interface Comment {
  id: number
  articleId: number
  articleTitle: string
  content: string
  date: string
  likes: number
  author: {
    id: number
    name: string
    avatar: string
    isAdmin: boolean
  }
  replies: Reply[]
  isReported: boolean
}

interface Reply {
  id: number
  content: string
  date: string
  author: {
    id: number
    name: string
    avatar: string
    isAdmin: boolean
  }
  likes: number
}

// 示例数据
const comments = ref<Comment[]>([
  {
    id: 1,
    articleId: 1,
    articleTitle: '使用 Nuxt 3 构建现代化博客',
    content: '这篇文章写得很好，对我帮助很大！',
    date: '2024-03-21 14:30',
    likes: 5,
    author: {
      id: 1,
      name: 'John Doe',
      avatar: '/images/avatar-1.jpg',
      isAdmin: false
    },
    replies: [
      {
        id: 1,
        content: '感谢支持，后续会有更多相关内容',
        date: '2024-03-21 15:00',
        author: {
          id: 2,
          name: 'Admin',
          avatar: '/images/admin-avatar.jpg',
          isAdmin: true
        },
        likes: 2
      }
    ],
    isReported: false
  },
  // 更多评论...
])

// 排序选项
const sortOptions = [
  { label: '最新', value: 'newest' },
  { label: '最热', value: 'hottest' },
  { label: '点赞最多', value: 'most_liked' }
]
const currentSort = ref('newest')

// 搜索
const searchQuery = ref('')
const filteredComments = computed(() => {
  let result = [...comments.value]
  
  // 搜索过滤
  if (searchQuery.value) {
    result = result.filter(comment => 
      comment.content.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      comment.articleTitle.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  // 排序
  switch (currentSort.value) {
    case 'hottest':
      result.sort((a, b) => (b.replies.length + b.likes) - (a.replies.length + a.likes))
      break
    case 'most_liked':
      result.sort((a, b) => b.likes - a.likes)
      break
    default:
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
  
  return result
})

// 回复相关
const replyContent = ref('')
const replyingTo = ref<number | null>(null)

const submitReply = (commentId: number) => {
  if (!replyContent.value.trim()) return
  
  const comment = comments.value.find(c => c.id === commentId)
  if (comment) {
    comment.replies.push({
      id: Date.now(),
      content: replyContent.value,
      date: new Date().toLocaleString(),
      author: {
        id: 1,
        name: 'John Doe',
        avatar: '/images/avatar-1.jpg',
        isAdmin: false
      },
      likes: 0
    })
    replyContent.value = ''
    replyingTo.value = null
  }
}

// 删除评论
const deleteComment = (commentId: number) => {
  if (confirm('确定要删除这条评论吗？')) {
    comments.value = comments.value.filter(c => c.id !== commentId)
  }
}

// 举报评论
const reportComment = (comment: Comment) => {
  comment.isReported = true
  // TODO: 发送举报到服务器
  alert('举报已提交，我们会尽快处理')
}

// 点赞
const likeComment = (comment: Comment) => {
  comment.likes++
}
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageSection>
      <!-- 页面标题和工具栏 -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">评论管理</h1>
        <div class="flex items-center space-x-4">
          <!-- 搜索框 -->
          <div class="relative">
            <input v-model="searchQuery"
                   type="search"
                   placeholder="搜索评论..."
                   class="w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600">
            <i class="i-carbon-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
          
          <!-- 排序选择 -->
          <select v-model="currentSort"
                  class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600">
            <option v-for="option in sortOptions" 
                    :key="option.value" 
                    :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- 评论列表 -->
      <div class="space-y-6">
        <div v-for="comment in filteredComments" 
             :key="comment.id"
             class="bg-white dark:bg-dark-500 rounded-lg p-6 shadow-sm">
          <!-- 评论头部 -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center space-x-3">
              <img :src="comment.author.avatar" 
                   :alt="comment.author.name"
                   class="w-10 h-10 rounded-full">
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-semibold">{{ comment.author.name }}</span>
                  <span v-if="comment.author.isAdmin"
                        class="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full">
                    博主
                  </span>
                </div>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ comment.date }}</span>
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex items-center space-x-2">
              <button @click="likeComment(comment)"
                      class="flex items-center space-x-1 text-gray-500 hover:text-primary-600">
                <i class="i-carbon-favorite"></i>
                <span>{{ comment.likes }}</span>
              </button>
              <button @click="reportComment(comment)"
                      :disabled="comment.isReported"
                      class="text-gray-500 hover:text-red-500 disabled:opacity-50">
                <i class="i-carbon-warning"></i>
              </button>
              <button @click="deleteComment(comment.id)"
                      class="text-gray-500 hover:text-red-500">
                <i class="i-carbon-trash-can"></i>
              </button>
            </div>
          </div>

          <!-- 评论内容 -->
          <div class="mb-4">
            <NuxtLink :to="`/posts/${comment.articleId}`"
                     class="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 mb-2 block">
              {{ comment.articleTitle }}
            </NuxtLink>
            <p class="text-gray-800 dark:text-gray-200">{{ comment.content }}</p>
          </div>

          <!-- 回复区域 -->
          <div class="space-y-4">
            <!-- 回复列表 -->
            <div v-for="reply in comment.replies"
                 :key="reply.id"
                 class="ml-8 p-4 bg-gray-50 dark:bg-dark-400 rounded-lg">
              <div class="flex items-center space-x-3 mb-2">
                <img :src="reply.author.avatar"
                     :alt="reply.author.name"
                     class="w-8 h-8 rounded-full">
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="font-semibold">{{ reply.author.name }}</span>
                    <span v-if="reply.author.isAdmin"
                          class="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full">
                      博主
                    </span>
                  </div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ reply.date }}</span>
                </div>
              </div>
              <p class="text-gray-800 dark:text-gray-200">{{ reply.content }}</p>
            </div>

            <!-- 回复输入框 -->
            <div v-if="replyingTo === comment.id" class="ml-8">
              <textarea v-model="replyContent"
                        rows="3"
                        placeholder="写下你的回复..."
                        class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-dark-400 dark:border-gray-600"></textarea>
              <div class="flex justify-end space-x-2 mt-2">
                <button @click="replyingTo = null"
                        class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-300 rounded-lg">
                  取消
                </button>
                <button @click="submitReply(comment.id)"
                        class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                  回复
                </button>
              </div>
            </div>
            
            <!-- 回复按钮 -->
            <button v-else
                    @click="replyingTo = comment.id"
                    class="ml-8 text-primary-600 dark:text-primary-400 hover:underline">
              回复
            </button>
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
</style> 