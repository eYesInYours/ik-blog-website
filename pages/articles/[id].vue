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
              :alt="article.author.username" class="author-avatar" />
            <span class="author-name">{{ article.author.username }}</span>
          </div>
          <time :datetime="article.createdAt" class="publish-date">
            {{ formatDate(article.createdAt) }}
          </time>
        </div>

        <!-- 标签 -->
        <div class="article-tags">
          <i class="i-carbon-tag text-gray-400 mr-2" />
          <div class="tags-list">
            <span v-for="tag in article.tags" :key="tag" class="tag" :style="getTagStyle(tag)">
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- 文章封面 -->
        <div v-if="article.cover" class="article-cover">
          <img :src="article.cover" :alt="article.title" />
        </div>
      </header>

      <!-- 文章内容 -->
      <article class="article-content markdown-body" v-html="sanitizedContent" />

      <!-- 文章操作区 -->
      <div class="article-actions-wrapper">
        <div class="article-actions">
          <button class="action-btn" :class="{ 'liked': article.isLiked }" @click="handleLikeArticle" :disabled="!user">
            <i :class="article.isLiked ? 'i-carbon-favorite-filled' : 'i-carbon-favorite'" />
            <span>{{ article.likes || 0 }}</span>
            <span class="action-label">点赞</span>
          </button>
          <button class="action-btn" :class="{ 'collected': article.isCollected }" @click="handleCollectArticle"
            :disabled="!user">
            <i :class="article.isCollected ? 'i-carbon-bookmark-filled' : 'i-carbon-bookmark'" />
            <span>{{ article.collections || 0 }}</span>
            <span class="action-label">收藏</span>
          </button>
          <button class="action-btn" :class="{ 'active': showCommentEditor }" @click="toggleCommentEditor">
            <i class="i-carbon-chat" />
            <span>{{ article.comments.length }}</span>
            <span class="action-label">评论</span>
          </button>
        </div>
      </div>

      <!-- 评论区 -->
      <section ref="commentsSection" class="comments-section">
        <div class="comments-header">
          <h2 class="section-title">评论 ({{ article.comments.length }})</h2>
          <div class="comments-sort">
            <button class="sort-btn" :class="{ active: sortBy === 'newest' }" @click="sortBy = 'newest'">
              最新
            </button>
            <button class="sort-btn" :class="{ active: sortBy === 'hottest' }" @click="sortBy = 'hottest'">
              最热
            </button>
          </div>
        </div>

        <!-- 评论输入区域 -->
        <div v-show="showCommentEditor" class="comment-editor" :class="{ 'focused': isEditorFocused }">
          <div class="editor-header" v-if="user?.username">
            <img :src="user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`"
              :alt="user.username" class="user-avatar" />
            <span class="username">{{ user.username }}</span>
          </div>
          <div class="editor-body">
            <textarea v-model="commentContent" placeholder="写下你的评论..." @focus="isEditorFocused = true"
              @blur="isEditorFocused = false" :disabled="!user?.username"
              @keydown.ctrl.enter="submitComment"></textarea>
            <div class="editor-footer" v-if="isEditorFocused || commentContent">
              <div class="editor-tools">
                <button class="tool-btn" @click="showEmoji = !showEmoji">
                  😊
                </button>
                <div v-if="showEmoji" class="emoji-picker">
                  <button v-for="emoji in emojis" :key="emoji" class="emoji-btn" @click="insertEmoji(emoji)">
                    {{ emoji }}
                  </button>
                </div>
              </div>
              <div class="editor-actions">
                <button class="cancel-btn" @click="resetEditor" v-if="commentContent">
                  取消
                </button>
                <button class="submit-btn" :disabled="!commentContent.trim() || submitting" @click="submitComment">
                  {{ submitting ? '发送中...' : '发送' }}
                </button>
              </div>
            </div>
            <div class="login-tip" v-if="!user?.username">
              <a @click="navigateTo('/login')">登录</a> 后参与评论
            </div>
          </div>
        </div>

        <!-- 评论列表 -->
        <div class="comments-list">
          <div v-if="sortedComments.length > 0" class="comments-container">
            <div v-for="comment in sortedComments" :key="comment._id" class="comment-item">
              <div class="comment-main">
                <div class="comment-header">
                  <img
                    :src="comment.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.username}`"
                    :alt="comment.author.username" class="comment-avatar" />
                  <div class="comment-info">
                    <span class="comment-author">{{ comment.author.username }}</span>
                    <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                  </div>
                </div>
                <div class="comment-content">{{ comment.content }}</div>
                <div class="comment-actions">
                  <button class="comment-action-btn" :class="{ 'liked': comment.isLiked }"
                    @click="handleLike(comment._id)" :disabled="!user">
                    <UIcon :name="comment.isLiked ? 'i-heroicons-hand-thumb-up-solid' : 'i-heroicons-hand-thumb-up'"
                      class="w-5 h-5" />
                    <span>{{ comment.likes || 0 }}</span>
                  </button>
                  <button class="action-btn" @click="replyTo(comment._id)">
                    💬 回复
                  </button>
                </div>

                <!-- 回复输入框 -->
                <div v-if="activeReplyKey === comment._id" class="reply-editor">
                  <textarea v-model="replyContent" :placeholder="`回复 @${comment.author.username}`"
                    class="reply-textarea" @keydown.ctrl.enter="submitReply(comment)"></textarea>
                  <div class="reply-actions">
                    <button class="cancel-btn" @click="cancelReply">取消</button>
                    <button class="submit-btn" :disabled="!replyContent.trim() || submitting"
                      @click="submitReply(comment)">
                      {{ submitting ? '发送中...' : '发送' }}
                    </button>
                  </div>
                </div>

                <!-- 回复列表 -->
                <div v-if="comment.replies?.length" class="replies-list">
                  <div v-for="reply in comment.replies" :key="reply._id" class="reply-item">
                    <div class="reply-header">
                      <img
                        :src="reply.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author.username}`"
                        :alt="reply.author.username" class="reply-avatar" />
                      <div class="reply-info">
                        <div class="reply-meta">
                          <span class="reply-author">{{ reply.author.username }}</span>
                          <template v-if="reply.replyTo">
                            <span class="reply-to">回复</span>
                            <span class="reply-to-author">@{{ reply.replyTo.author.username }}</span>
                          </template>
                        </div>
                        <span class="reply-time">{{ formatDate(reply.createdAt) }}</span>
                      </div>
                    </div>
                    <div class="reply-content">{{ reply.content }}</div>
                    <div class="reply-actions">
                      <button class="comment-action-btn" :class="{ 'liked': reply.isLiked }"
                        @click="handleLike(reply._id)" :disabled="!user">
                        <UIcon :name="reply.isLiked ? 'i-heroicons-hand-thumb-up-solid' : 'i-heroicons-hand-thumb-up'"
                          class="w-5 h-5" />
                        <span>{{ reply.likes || 0 }}</span>
                      </button>
                      <button class="action-btn" @click="replyTo(comment._id, reply)">
                        💬 回复
                      </button>
                    </div>
                    <!-- 子评论的回复输入框 -->
                    <div v-if="activeReplyKey === `${comment._id}:${reply._id}`" class="reply-editor">
                      <textarea v-model="replyContent" :placeholder="`回复 @${comment.author.username}`"
                        class="reply-textarea" @keydown.ctrl.enter="submitReply(comment, reply)"></textarea>
                      <div class="reply-actions">
                        <button class="cancel-btn" @click="cancelReply">取消</button>
                        <button class="submit-btn" :disabled="!replyContent.trim() || submitting"
                          @click="submitReply(comment, reply)">
                          {{ submitting ? '发送中...' : '发送' }}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="!loading" class="no-comments">
            暂无评论，来发表第一条评论吧！
          </div>
          <div v-else class="comments-loading">
            <div class="loading-spinner"></div>
            <span>加载评论中...</span>
          </div>
        </div>
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
import { useUserStore } from '~/stores/user'
import { storeToRefs } from 'pinia'

const { successToast, warningToast, infoToast, errorToast } = useToastMsg()
definePageMeta({ layout: 'page' })
useHead({ title: '文章详情' })
const toast = useToast()

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
  likes: number
  collections: number
  isLiked: boolean
  isCollected: boolean
}

interface LikeResponse {
  code: number
  data: {
    likes: number
    isLiked: boolean
  }
  message: string
}

interface CollectResponse {
  code: number
  data: {
    collections: number
    isCollected: boolean
  }
  message: string
}

const route = useRoute()
const { fetchApi } = useApi()
const userStore = useUserStore()
const { userInfo: user, token } = storeToRefs(userStore)

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

    article.value = response?.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取文章失败'
    console.log(err)
  } finally {
    loading.value = false
  }
}

// 评论相关状态
const showCommentEditor = ref(false)
const isEditorFocused = ref(false)
const commentContent = ref('')
const showEmoji = ref(false)

// 表情列表
const emojis = ['😊', '😂', '🤔', '👍', '❤️', '🎉', '🌟', '😅', '🤣', '😍']

// 插入表情
function insertEmoji(emoji: string) {
  commentContent.value += emoji
  showEmoji.value = false
}

// 重置编辑器
function resetEditor() {
  commentContent.value = ''
  isEditorFocused.value = false
  showEmoji.value = false
}

// 提交评论
async function submitComment() {
  if (!token.value || !commentContent.value.trim() || submitting.value) return

  submitting.value = true
  try {
    await fetchApi('/comments', {
      method: 'POST',
      body: {
        articleId: article.value?._id,
        content: commentContent.value
      }
    })
    await fetchComments()
    resetEditor()
  } catch (err) {
    console.error('评论发送失败:', err)
  } finally {
    submitting.value = false
  }
}

// 回复相关状态
const activeReplyKey = ref<string | null>(null)
const replyContent = ref('')

// 修改 replyTo 函数，支持回复某条回复
function replyTo(commentId: string, reply?: Comment) {
  if (!token.value) {
    navigateTo('/login')
    return
  }
  activeReplyKey.value = reply ? `${commentId}:${reply._id}` : commentId
  replyContent.value = ''
}

// 取消回复
function cancelReply() {
  activeReplyKey.value = null
  replyContent.value = ''
}

async function fetchComments() {
  const response = await fetchApi<{
    code: number
    data: Comment[]
    message: string
  }>(`/comments/article/${route.params.id}`)
  if (response.code === 200 && article.value) {
    article.value.comments = response.data
  }
}

// 提交回复
async function submitReply(comment: Comment, replyTo?: Comment) {
  if (!token.value || !replyContent.value.trim() || submitting.value) return

  submitting.value = true
  try {
    await fetchApi('/comments', {
      method: 'POST',
      body: {
        articleId: article.value?._id,
        parentCommentId: comment._id,
        content: replyContent.value,
      }
    })
    // 只获取评论列表
    await fetchComments()
    cancelReply()
  } catch (err) {
    console.error('回复发送失败:', err)
  } finally {
    submitting.value = false
  }
}

// 添加评论排序相关
const sortBy = ref<'newest' | 'hottest'>('newest')

// 排序后的评论列表
const sortedComments = computed(() => {
  if (!article.value?.comments) return []

  const comments = [...article.value.comments]

  if (sortBy.value === 'newest') {
    return comments.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } else {
    return comments.sort((a, b) => (b.likes || 0) - (a.likes || 0))
  }
})

// 处理评论点赞
const handleLike = async (commentId: string) => {
  if (!user.value) {
    navigateTo('/login')
    return
  }

  try {
    // 找到要点赞的评论
    const findComment = (comments: any[]) => {
      for (const comment of comments) {
        if (comment._id === commentId) return comment
        if (comment.replies) {
          const reply = comment.replies.find((r: any) => r._id === commentId)
          if (reply) return reply
        }
      }
      return null
    }

    const comment = findComment(article.value?.comments || [])
    if (!comment) return

    // 乐观更新
    comment.isLiked = !comment.isLiked
    comment.likes = comment.likes + (comment.isLiked ? 1 : -1)

    // 发送请求
    const response = await fetchApi(`/comments/${commentId}/like`, {
      method: 'PUT'
    })

    // 如果请求失败，回滚状态
    if (response.code !== 200) {
      comment.isLiked = !comment.isLiked
      comment.likes = comment.likes + (comment.isLiked ? 1 : -1)
    }
  } catch (err) {
    console.error('点赞失败:', err)
    errorToast('点赞失败')
  }
}

// 处理文章点赞
const handleLikeArticle = async () => {
  if (!user.value) {
    warningToast('请先登录')
    navigateTo('/login')
    return
  }

  try {
    // 乐观更新
    article.value!.isLiked = !article.value!.isLiked
    article.value!.likes = article.value!.likes + (article.value!.isLiked ? 1 : -1)

    const response = await fetchApi<LikeResponse>(`/articles/${article.value?._id}/like`, {
      method: 'POST'
    })

    if (response.code === 200) {
      // 使用服务器返回的实际数据更新
      article.value!.likes = response.data.likes
      article.value!.isLiked = response.data.isLiked
      successToast(response.message)
    } else {
      // 如果请求失败，回滚本地状态
      article.value!.isLiked = !article.value!.isLiked
      article.value!.likes = article.value!.likes + (article.value!.isLiked ? 1 : -1)
      errorToast(response.message)
    }
  } catch (err) {
    // 发生错误时回滚本地状态
    article.value!.isLiked = !article.value!.isLiked
    article.value!.likes = article.value!.likes + (article.value!.isLiked ? 1 : -1)
    console.error('点赞失败:', err)
    errorToast(err instanceof Error ? err.message : '点赞失败')
  }
}

// 处理文章收藏
const handleCollectArticle = async () => {
  if (!user.value) {
    warningToast('请先登录')
    navigateTo('/login')
    return
  }

  try {
    // 乐观更新
    article.value!.isCollected = !article.value!.isCollected
    article.value!.collections = article.value!.collections + (article.value!.isCollected ? 1 : -1)

    const response = await fetchApi<CollectResponse>(`/articles/${article.value?._id}/collect`, {
      method: 'POST'
    })

    if (response.code === 200) {
      // 使用服务器返回的实际数据更新
      article.value!.collections = response.data.collections
      article.value!.isCollected = response.data.isCollected
      successToast(response.message)
    } else {
      // 如果请求失败，回滚本地状态
      article.value!.isCollected = !article.value!.isCollected
      article.value!.collections = article.value!.collections + (article.value!.isCollected ? 1 : -1)
      errorToast(response.message)
    }
  } catch (err) {
    // 发生错误时回滚本地状态
    article.value!.isCollected = !article.value!.isCollected
    article.value!.collections = article.value!.collections + (article.value!.isCollected ? 1 : -1)
    console.error('收藏失败:', err)
    errorToast(err instanceof Error ? err.message : '收藏失败')
  }
}

// 切换评论编辑器显示状态
const toggleCommentEditor = () => {
  showCommentEditor.value = !showCommentEditor.value
  if (showCommentEditor.value) {
    // 滚动到评论区
    commentsSection.value?.scrollIntoView({ behavior: 'smooth' })
    // 如果未登录，提示登录
    if (!user.value) {
      warningToast('请先登录')
      navigateTo('/login')
      return
    }
  }
}

fetchArticle()

// 监听路由变化
watch(() => route.params.id, () => {
  fetchArticle()
})

// 评论区域引用
const commentsSection = ref<HTMLElement | null>(null)

// 生成标签颜色
const getTagStyle = (tag: string) => {
  // 使用字符串哈希生成一个稳定的色相值
  const hashCode = tag.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  const hue = Math.abs(hashCode % 360) // 0-360 的色相值

  return {
    backgroundColor: `hsl(${hue}, 85%, 96%)`,
    color: `hsl(${hue}, 70%, 40%)`,
    borderColor: `hsl(${hue}, 70%, 90%)`
  }
}
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

.article-tags {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
}

.tags-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  border: 1px solid;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 适配暗色模式 */
:root[class~="dark"] .article-tags {
  background: #1f2937;
}

:root[class~="dark"] .tag {
  opacity: 0.9;
}

:root[class~="dark"] .tag:hover {
  opacity: 1;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .article-tags {
    padding: 0.5rem;
    margin: 1rem 0;
  }

  .tag {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
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
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
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

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.comments-sort {
  display: flex;
  gap: 1rem;
}

.sort-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.sort-btn:hover {
  background: #f3f4f6;
}

.sort-btn.active {
  color: #3b82f6;
  font-weight: 500;
}

.comments-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comments-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: #6b7280;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.no-comments {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 0.5rem;
}

/* 评论编辑器样式 */
.comment-editor {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  transition: all 0.3s;
}

.comment-editor.focused {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.editor-body {
  padding: 1rem;
}

.editor-body textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.5rem;
  border: none;
  resize: vertical;
  outline: none;
  font-size: 0.875rem;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.editor-tools {
  position: relative;
}

.tool-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: #f3f4f6;
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.5rem;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.emoji-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.emoji-btn:hover {
  background: #f3f4f6;
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
}

.cancel-btn,
.submit-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: transparent;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.cancel-btn:hover {
  background: #f3f4f6;
}

.submit-btn {
  background: #3b82f6;
  border: 1px solid #2563eb;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #2563eb;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-tip {
  text-align: center;
  color: #6b7280;
  padding: 1rem;
}

.login-tip a {
  color: #3b82f6;
  cursor: pointer;
}

/* 评论列表样式 */
.comment-item {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-info {
  display: flex;
  flex-direction: column;
}

.comment-author {
  font-weight: 500;
  color: #374151;
}

.comment-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.comment-content {
  margin-bottom: 1rem;
  line-height: 1.5;
  color: #374151;
}

.comment-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
}

.action-btn.liked {
  color: #ef4444;
}

.reply-editor {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.reply-textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  resize: vertical;
  outline: none;
  background: white;
  font-size: 0.875rem;
}

.reply-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.replies-list {
  margin-top: 1rem;
  margin-left: 2rem;
  padding-left: 1rem;
  border-left: 2px solid #e5e7eb;
}

.reply-item {
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.reply-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.reply-info {
  flex: 1;
}

.reply-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.reply-author {
  font-weight: 500;
  color: #374151;
}

.reply-to {
  color: #6b7280;
  font-size: 0.875rem;
}

.reply-to-author {
  color: #3b82f6;
  font-size: 0.875rem;
}

.reply-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.reply-content {
  margin-bottom: 0.75rem;
  padding-left: calc(24px + 0.75rem);
  color: #374151;
  line-height: 1.5;
}

/* 文章操作按钮样式 */
.article-actions-wrapper {
  margin: 2rem 0;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  text-align: center;
}

.article-actions {
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6b7280;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  justify-content: center;
}

.action-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.liked {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

.action-btn.collected {
  border-color: #f59e0b;
  color: #f59e0b;
  background: #fffbeb;
}

/* 适配暗色模式 */
:root[class~="dark"] .action-btn {
  background: #1f2937;
  border-color: #374151;
  color: #9ca3af;
}

:root[class~="dark"] .action-btn:hover:not(:disabled) {
  border-color: #60a5fa;
  color: #60a5fa;
}

:root[class~="dark"] .action-btn.liked {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

:root[class~="dark"] .action-btn.collected {
  border-color: #f59e0b;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.article-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  padding: 0.25rem 0.75rem;
  background-color: #e5e7eb;
  color: #374151;
  border-radius: 9999px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.tag:hover {
  background-color: #d1d5db;
}

.article-actions {
  display: flex;
  gap: 1rem;
  margin-left: auto;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6b7280;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  justify-content: center;
}

.action-label {
  display: inline-block;
  margin-left: 0.25rem;
  font-size: 0.875rem;
}

/* 适配暗色模式 */
:root[class~="dark"] .article-info {
  background: #1f2937;
}

:root[class~="dark"] .tag {
  background-color: #374151;
  color: #d1d5db;
}

:root[class~="dark"] .tag:hover {
  background-color: #4b5563;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .article-info {
    flex-direction: column;
    gap: 1rem;
  }

  .article-actions {
    width: 100%;
    justify-content: space-around;
  }

  .action-btn {
    min-width: auto;
    padding: 0.5rem;
  }

  .action-label {
    display: none;
  }
}

.article-actions-wrapper {
  margin: 2rem 0;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  text-align: center;
}

.article-actions {
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.action-btn.active {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

:root[class~="dark"] .article-actions-wrapper {
  background: #1f2937;
}

/* 评论操作按钮样式 */
.comment-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.comment-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6b7280;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.comment-action-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.comment-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comment-action-btn.liked {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

/* 暗色模式适配 */
:root[class~="dark"] .comment-action-btn {
  background: #1f2937;
  border-color: #374151;
  color: #9ca3af;
}

:root[class~="dark"] .comment-action-btn:hover:not(:disabled) {
  border-color: #60a5fa;
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
}

:root[class~="dark"] .comment-action-btn.liked {
  border-color: #60a5fa;
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.15);
}

/* 图标基础样式 */
.icon {
  display: inline-flex;
  width: 1.25em;
  height: 1.25em;
  vertical-align: middle;
}

.comment-action-btn {
  @apply inline-flex items-center gap-2 px-3 py-1 text-sm border rounded-md transition-all duration-200 hover:border-primary-500 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.comment-action-btn.liked {
  @apply border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-950;
}

/* 暗色模式 */
:root[class~="dark"] .comment-action-btn {
  @apply bg-gray-800 border-gray-700 text-gray-400;
}

:root[class~="dark"] .comment-action-btn:hover:not(:disabled) {
  @apply border-primary-400 text-primary-400;
}

:root[class~="dark"] .comment-action-btn.liked {
  @apply border-primary-400 text-primary-400;
}
</style>
