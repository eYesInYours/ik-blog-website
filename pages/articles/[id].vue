<template>
  <div class="article-container max-w-7xl mx-auto px-4 py-8">
    <div class="flex gap-8">
      <!-- 文章内容区 -->
      <div class="flex-1">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner" />
          <span>加载中...</span>
        </div>

        <!-- 文章内容 -->
        <template v-else-if="article">
          <!-- 文章头部 -->
          <header class="article-header mb-8">
            <h1 class="text-3xl font-bold mb-4">{{ article.title }}</h1>
            <div class="article-meta flex items-center gap-4 text-gray-500">
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
            <div class="article-tags" v-if="article.tags.length">
              <i class="i-carbon-tag text-gray-400 mr-2" />
              <div class="tags-list">
                <span v-for="tag in article.tags" :key="tag" class="tag" :style="getTagStyle(tag)">
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- 文章封面 -->
            <!-- <div v-if="article.cover" class="article-cover">
              <img :src="article.cover" :alt="article.title" />
            </div> -->
          </header>

          <!-- 文章内容 -->
          <article ref="articleContent"
            class="markdown-body article-content prose prose-lg dark:prose-invert max-w-none [&>h1]:scroll-mt-24 [&>h2]:scroll-mt-24 [&>h3]:scroll-mt-24"
            v-html="safeContent" />

          <!-- 文章操作区 -->
          <div class="article-actions-wrapper">
            <div class="article-actions">
              <button class="action-btn" :class="{ 'liked': article.isLiked }" @click="handleLikeArticle"
                :disabled="!userStore.getAccessToken">
                <i :class="article.isLiked ? 'i-carbon-favorite-filled' : 'i-carbon-favorite'" />
                <span>{{ article.likes || 0 }}</span>
                <span class="action-label">点赞</span>
              </button>
              <button class="action-btn" :class="{ 'collected': article.isCollected }" @click="handleCollectArticle"
                :disabled="!userStore.getAccessToken">
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
                            <UIcon
                              :name="reply.isLiked ? 'i-heroicons-hand-thumb-up-solid' : 'i-heroicons-hand-thumb-up'"
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

      <!-- 目录导航 -->
      <div class="w-72 hidden lg:block">
        <div class="sticky top-24">
          <div class="toc-container bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <i class="i-carbon-list text-lg" />
                目录
              </h3>
              <UButton v-if="headings.length > 0" icon="i-carbon-chevron-up" variant="ghost" size="xs"
                class="hover:bg-gray-100 dark:hover:bg-gray-700" @click="scrollToHeading(headings[0].id)" />
            </div>

            <nav class="toc-nav">
              <ul class="space-y-1">
                <li v-for="heading in headings" 
                    :key="heading.id" 
                    :class="[
                      'toc-item',
                      `heading-level-${heading.level}`,
                      { 'active': activeHeading === heading.id }
                    ]"
                >
                  <a @click="scrollToHeading(heading.id)"
                     class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 cursor-pointer transition-colors py-2 px-2 rounded-md block hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    {{ heading.text }}
                  </a>
                </li>
              </ul>

              <!-- 无目录时的提示 -->
              <div v-if="headings.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                暂无目录
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加图片预览组件 -->
    <ImagePreview 
      v-model:visible="previewVisible"
      :image="previewImage.src"
      :alt="previewImage.alt"
      @close="closePreview"
    />
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { markedHighlight } from "marked-highlight"
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import DOMPurify from 'isomorphic-dompurify'
import { useUserStore } from '~/stores/user'
import { storeToRefs } from 'pinia'
import type { MarkedOptions } from 'marked'
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import toc from 'markdown-it-toc-done-right'
import ImagePreview from '~/components/ImagePreview.vue'

const { $request } = useNuxtApp()
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
const userStore = useUserStore()
const { userInfo: user, token } = storeToRefs(userStore)

// 状态管理
const article = ref<Article | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const submitting = ref(false)
const activeHeading = ref('')
const headings = ref<Array<{ id: string; text: string; level: number }>>([])

// 配置 DOMPurify 允许的标签和属性
const purifyConfig = {
  ALLOWED_TAGS: [
    // 基础文本标签
    'p', 'div', 'span', 'br', 'hr',
    // 标题标签
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // 格式化标签
    'strong', 'em', 'del', 'ins', 'mark', 'sub', 'sup',
    // 列表标签
    'ul', 'ol', 'li',
    // 代码标签
    'pre', 'code',
    // 引用标签
    'blockquote',
    // 链接和图片
    'a', 'img',
    // 表格标签
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 
    'width', 'height', 'target', 'rel',
    'style'  // 允许基本样式
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|data|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_TAGS: ['iframe'],  // 允许 iframe，用于嵌入视频等
  ADD_ATTR: ['allowfullscreen', 'frameborder', 'sandbox'],  // iframe 相关属性
  FORBID_TAGS: ['script', 'style', 'form', 'input', 'textarea', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick']
}

// 图片预览状态
const previewVisible = ref(false)
const previewImage = ref({
  src: '',
  alt: ''
})

// 打开预览
const openPreview = (src: string, alt: string) => {
  previewImage.value = { src, alt }
  previewVisible.value = true
}

// 关闭预览
const closePreview = () => {
  previewVisible.value = false
}

// 安全过滤文章内容
const safeContent = computed(() => {
  if (!article.value?.content) return ''
  
  try {
    const cleanHtml = DOMPurify.sanitize(article.value.content, purifyConfig)
    
    if (!import.meta.client) {
      return cleanHtml
    }
    
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = cleanHtml
    
    // 处理图片点击预览
    tempDiv.querySelectorAll('img').forEach(img => {
      // 添加样式类和属性
      img.classList.add('preview-image')
      img.style.cursor = 'zoom-in'
      // 使用 data 属性存储原始图片信息
      img.dataset.src = img.src
      img.dataset.alt = img.alt || ''
      
      // 移除可能存在的旧事件监听器
      img.replaceWith(img.cloneNode(true))
    })
    
    // 处理外部链接
    tempDiv.querySelectorAll('a').forEach(link => {
      if (link.host !== window.location.host) {
        link.setAttribute('target', '_blank')
        link.setAttribute('rel', 'noopener noreferrer')
      }
    })
    
    return tempDiv.innerHTML
  } catch (error) {
    console.error('内容清理错误:', error)
    return ''
  }
})

// 获取文章数据
const fetchArticle = async () => {
  try {
    loading.value = true
    const { data, error } = await $request.get(`/articles/${route.params.id}`)
    if (error.value) throw error.value
    article.value = data.value
    
    // 只在客户端执行代码高亮
    if (import.meta.client) {
      nextTick(() => {
        hljs.highlightAll()
      })
    }
  } catch (err) {
    console.error('获取文章详情失败:', err)
    error.value = '获取文章详情失败'
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
  if (!userStore.getAccessToken.value || !commentContent.value.trim() || submitting.value) return

  submitting.value = true
  try {
    await $request.post('/comments', {
      articleId: article.value?._id,
      content: commentContent.value
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
  const { data } = await $request.get(`/comments/article/${route.params.id}`)
  if (data.value && article.value) {
    article.value.comments = data.value
  }
}

// 提交回复
async function submitReply(comment: Comment, replyTo?: Comment) {
  if (!token.value || !replyContent.value.trim() || submitting.value) return

  submitting.value = true
  try {
    await $request.post('/comments', {
      articleId: article.value?._id,
      parentCommentId: comment._id,
      content: replyContent.value,
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
    const { data } = await $request.put(`/comments/${commentId}/like`)

    // 如果请求失败，回滚状态
    if (data.value.code !== 200) {
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
  if (!userStore.getAccessToken.value) {
    warningToast('请先登录')
    navigateTo('/login')
    return
  }

  try {
    // 乐观更新
    article.value!.isLiked = !article.value!.isLiked
    article.value!.likes = article.value!.likes + (article.value!.isLiked ? 1 : -1)

    const {data, error} = await $request.post(`/articles/${article.value?._id}/like`)

    // 使用服务器返回的实际数据更新
    article.value!.likes = data.value.likes
    article.value!.isLiked = data.value.isLiked
    successToast(data.value.message)
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
  if (!userStore.getAccessToken.value) {
    warningToast('请先登录')
    navigateTo('/login')
    return
  }

  try {
    // 乐观更新
    article.value!.isCollected = !article.value!.isCollected
    article.value!.collections = article.value!.collections + (article.value!.isCollected ? 1 : -1)

    const { data, error } = await $request.post<CollectResponse>(`/articles/${article.value?._id}/collect`)
    console.log(data, error)
    // 使用服务器返回的实际数据更新
    article.value!.collections = data.value.collections
    article.value!.isCollected = data.value.isCollected
    successToast(data.value.message)

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

const articleContent = ref<HTMLElement | null>(null)

// 从富文本内容中提取标题
const extractHeadings = () => {
  if (!articleContent.value || !import.meta.client) return

  const headingElements = articleContent.value.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headings.value = Array.from(headingElements).map((el, index) => {
    if (!el.id) {
      el.id = `heading-${index}`
    }
    return {
      id: el.id,
      text: el.textContent || '',
      level: parseInt(el.tagName[1])
    }
  })
}

// 监听滚动，更新当前活动标题
const updateActiveHeading = () => {
  if (!articleContent.value) return

  const headingElements = articleContent.value.querySelectorAll('h1, h2, h3')
  const scrollPosition = window.scrollY

  for (let i = headingElements.length - 1; i >= 0; i--) {
    const heading = headingElements[i]
    const topOffset = heading.getBoundingClientRect().top + window.scrollY - 100

    if (scrollPosition >= topOffset) {
      activeHeading.value = heading.id
      break
    }
  }
}

// 点击目录项滚动到对应位置
const scrollToHeading = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - 80,
      behavior: 'smooth'
    })
  }
}

// 监听内容变化
watch(() => article.value?.content, () => {
  if (import.meta.client) {
    nextTick(() => {
      extractHeadings()
      hljs.highlightAll()
    })
  }
})

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('scroll', updateActiveHeading)
    nextTick(() => {
      extractHeadings()
      hljs.highlightAll()
    })
    // 使用事件委托处理图片点击
    document.querySelector('.article-content')?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement
        openPreview(img.dataset.src || img.src, img.dataset.alt || img.alt || '')
      }
    })
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', updateActiveHeading)
    document.querySelector('.article-content')?.removeEventListener('click', () => {})
  }
})

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

<style lang="scss" scoped>
.article-container {
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}

.article-header {
  margin-bottom: 2rem;
}

:deep(.article-title) {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.3;
}

:deep(.article-meta) {
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
  @apply p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm;
  max-width: 100%;
  overflow-x: auto;
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

/* Markdown 样式覆盖 */
.article-content.markdown-body {
  background-color: transparent;
  font-size: 16px;
  line-height: 1.8;
  font-family: system-ui, -apple-system, sans-serif;
  @apply text-gray-800 dark:text-gray-200;

  /* 标题样式 */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply font-bold text-gray-900 dark:text-gray-100 mt-6 mb-4;
  }

  h1 {
    @apply text-3xl border-b pb-2;
  }

  h2 {
    @apply text-2xl border-b pb-2;
  }

  h3 {
    @apply text-xl;
  }

  h4 {
    @apply text-lg;
  }

  h5 {
    @apply text-base;
  }

  h6 {
    @apply text-sm;
  }

  pre {
    background-color: #ffffff !important;
    border-radius: 0.375rem;
    padding: 16px;
    margin: 16px 0;
    overflow: auto;
    @apply dark:bg-gray-800;
  }

  img {
    @apply max-w-full rounded-lg mx-auto my-4 !important;
    height: 260px !important;
    width: 100% !important;
    object-fit: cover !important;
    cursor: zoom-in !important;
    transition: transform 0.2s ease !important;

    &:hover {
      transform: scale(1.01);
    }

    @media (max-width: 768px) {
      height: 200px !important;
    }
  }

  /* 图片容器样式 */
  p:has(> img) {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  // 链接样式
  a {
    color: var(--el-color-primary);
    text-decoration: none;
    position: relative;
    font-weight: 500;
    padding: 0.1em 0.2em;
    margin: 0 0.1em;
    border-radius: 0.2em;
    background-image: linear-gradient(
      transparent 0%,
      transparent 90%,
      var(--el-color-primary-light-8) 90%,
      var(--el-color-primary-light-8) 100%
    );
    background-repeat: no-repeat;
    background-size: 0% 100%;
    transition: all 0.3s ease;

    &:hover {
      background-size: 100% 100%;
      color: var(--el-color-primary-dark-2);

      &[target="_blank"]::after {
        transform: translate(2px, -2px);
      }
    }

    // 外部链接的箭头标记
    &[target="_blank"]::after {
      content: "↗";
      display: inline-block;
      margin-left: 0.2em;
      font-size: 0.9em;
      transition: transform 0.3s ease;
      vertical-align: text-top;
    }
  }

  // 暗色模式下的链接样式
  :root[class~="dark"] & {
    a {
      background-image: linear-gradient(
        transparent 0%,
        transparent 90%,
        var(--el-color-primary-light-9) 90%,
        var(--el-color-primary-light-9) 100%
      );

      &:hover {
        color: var(--el-color-primary-light-3);
        background-color: rgba(var(--el-color-primary-rgb), 0.1);
      }
    }
  }

  // 代码块内的链接样式重置
  pre, code {
    a {
      color: inherit;
      background-image: none;
      padding: 0;
      margin: 0;
      font-weight: inherit;

      &:hover {
        background-size: 0;
        color: inherit;
      }

      &[target="_blank"]::after {
        content: none;
      }
    }
  }
}

:deep(.markdown-body code) {
  background-color: #f6f8fa;
  border-radius: 0.25rem;
  padding: 0.2em 0.4em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  @apply dark:bg-gray-800;
}

:deep(.markdown-body pre code) {
  background-color: transparent;
  padding: 0;
  color: #24292e;
  @apply dark:text-gray-200;
}

/* 表格样式 */
:deep(.markdown-body table) {
  display: block;
  overflow-x: auto;
  margin: 1rem 0;
}

.toc-container {
  @apply border border-gray-100 dark:border-gray-700;

  .toc-nav {
    max-height: calc(100vh - 250px);
    overflow-y: auto;
    overflow-x: hidden;

    /* 自定义滚动条样式 */
    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      @apply bg-gray-200 dark:bg-gray-700;
      border-radius: 4px;
    }

    /* Firefox 滚动条样式 */
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) transparent;

    // 目录项容器
    ul {
      width: 100%;
    }

    // 目录项
    .toc-item {
      a {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        display: block;
      }

      &.heading-level-1 {
        padding-left: 0.5rem;
        font-size: 1.1rem;
        font-weight: 600;
      }
      
      &.heading-level-2 {
        padding-left: 1.5rem;
        font-size: 1rem;
        font-weight: 500;
      }
      
      &.heading-level-3 {
        padding-left: 2.5rem;
        font-size: 0.95rem;
        font-weight: 400;
      }
      
      &.heading-level-4 {
        padding-left: 3.5rem;
        font-size: 0.9rem;
        font-weight: 400;
        opacity: 0.9;
      }
      
      &.heading-level-5 {
        padding-left: 4.5rem;
        font-size: 0.85rem;
        font-weight: 400;
        opacity: 0.85;
      }
      
      &.heading-level-6 {
        padding-left: 5.5rem;
        font-size: 0.8rem;
        font-weight: 400;
        opacity: 0.8;
      }

      &.active > a {
        @apply text-primary-500 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-500/10;
      }
    }
  }
}

/* 暗色模式适配 */
:root[class~="dark"] {
  .toc-container {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  }
}

/* 移动端适配 */
@media (max-width: 1024px) {
  .toc-container {
    display: none;
  }
}

/* 隐藏文章内容中自动生成的目录 */
.article-content .toc-list {
  display: none;
}

/* 文章内容样式 */
.article-content {

  h1,
  h2,
  h3 {
    scroll-margin-top: 6rem;
  }
}

/* 定义CSS变量 */
:root {
  --scrollbar-thumb: rgb(229 231 235);
  /* gray-200 */
}

:root[class~="dark"] {
  --scrollbar-thumb: rgb(55 65 81);
  /* gray-700 */
}

/* 禁用 prose 的默认图片样式 */
.prose {
  img {
    margin: 0 !important;
  }
}

:deep(.markdown-body) {
  // 代码块样式
  pre {
    margin: 1rem 0;
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: #f6f8fa !important; // 浅灰色背景
    overflow-x: auto;
    border: 1px solid #e5e7eb;

    code {
      background-color: transparent;
      padding: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9em;
      line-height: 1.5;
      color: #24292e;
    }
  }

  // 内联代码样式
  code:not(pre code) {
    background-color: #f6f8fa;
    border-radius: 0.25rem;
    padding: 0.2em 0.4em;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
    color: #24292e;
    border: 1px solid #e5e7eb;
  }

  // 暗色模式
  :root[class~="dark"] & {
    pre {
      background-color: #1e1e1e !important; // 深色但不是纯黑
      border-color: #374151;

      code {
        color: #e5e7eb;
      }
    }

    code:not(pre code) {
      background-color: #374151;
      border-color: #4b5563;
      color: #e5e7eb;
    }
  }

  // 图片样式
  img {
    cursor: zoom-in;
    transition: transform 0.2s ease;
    border-radius: 0.5rem;
    
    &:hover {
      transform: scale(1.01);
    }
  }
}
</style>
