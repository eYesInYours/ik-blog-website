<template>
  <div class="comments-section">
    <!-- 评论列表 -->
    <div class="comments-list">
      <div class="comment-item">
        <!-- 主评论 -->
        <div class="comment-main">
          <div class="comment-header">
            <img
              :src="comment?.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment?.author.username}`"
              :alt="comment?.author.username"
              class="comment-avatar"
            />
            <div class="comment-info">
              <span class="author-name">{{ comment?.author.username }}</span>
              <span class="comment-time">{{ formatDate(comment?.createdAt) }}</span>
            </div>
          </div>

          <div class="comment-content">
            <p>{{ comment?.content }}</p>
          </div>

          <div class="comment-actions">
            <button
              class="action-btn"
              :class="{ 'liked': comment?.isLiked }"
              @click="toggleLike(comment)"
            >
              <span class="icon">{{ comment?.isLiked ? '❤️' : '🤍' }}</span>
              <span>{{ comment?.likes }}</span>
            </button>
            <button
              class="action-btn"
              @click="toggleMainReply"
            >
              <span class="icon">💬</span>
              <span>{{ showMainReplyInput ? '取消回复' : '回复' }}</span>
            </button>
          </div>

          <!-- 主评论的回复输入框 -->
          <CommentInput
            :show="showMainReplyInput"
            :show-header="false"
            :parent-comment-id="comment?._id"
            placeholder="写下你的回复..."
            submit-text="发送"
            :submitting="submitting"
            @submit="finishCommentInput"
            @cancel="finishCommentInput"
          />

          <!-- 回复列表 -->
          <div v-if="comment?.replies?.length" class="replies-list">
            <div v-for="reply in comment.replies" :key="reply._id" class="reply-item">
              <div class="reply-header">
                <img
                  :src="reply.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author.username}`"
                  :alt="reply.author.username"
                  class="reply-avatar"
                />
                <div class="reply-info">
                  <span class="author-name">{{ reply.author.username }}</span>
                  <span v-if="reply?.replyTo._id" class="reply-reference">
                    回复 <span class="reference-name">@{{ reply.replyTo.author.username }}</span>
                  </span>
                  <span class="reply-time">{{ formatDate(reply.createdAt) }}</span>
                </div>
              </div>

              <div class="reply-content">
                <p>{{ reply.content }}</p>
              </div>

              <!-- 二级评论的操作按钮 -->
              <div class="reply-actions">
                <button
                  class="action-btn"
                  :class="{ 'liked': reply.isLiked }"
                  @click="toggleLike(reply)"
                >
                  <span class="icon">{{ reply.isLiked ? '❤️' : '🤍' }}</span>
                  <span>{{ reply.likes || 0 }}</span>
                </button>
                <button
                  class="action-btn"
                  @click="toggleSubReply(reply)"
                >
                  <span class="icon">💬</span>
                  <span>{{ activeReplyId === reply._id ? '取消回复' : '回复' }}</span>
                </button>
              </div>

              <!-- 二级回复的输入框 -->
              <CommentInput
                :show="activeReplyId === reply._id"
                :show-header="false"
                :parent-comment-id="comment?._id"
                :placeholder="`回复 @${reply.author.username}`"
                submit-text="发送"
                :submitting="submitting"
                @submit="finishCommentInput"
                @cancel="finishCommentInput"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Author {
  _id: string
  username: string
  avatar: string
}

interface ReplyTo {
  _id: string
  author: Author
}

interface Comment {
  _id: string
  content: string
  author: Author
  createdAt: string
  likes: number
  isLiked?: boolean
  replyTo?: ReplyTo
  replies?: Comment[]
}

const props = defineProps<{
  comment?: Comment | null
  submitting?: boolean
}>()

// 控制主评论回复框的显示
const showMainReplyInput = ref(false)

// 控制二级回复的显示（存储当前正在回复的评论ID）
const activeReplyId = ref<string | null>(null)

// 切换主评论回复框
function toggleMainReply() {
  showMainReplyInput.value = !showMainReplyInput.value
  // 关闭所有二级回复框
  activeReplyId.value = null
}

// 切换二级回复框
function toggleSubReply(reply: Comment) {
  // 如果点击的是当前已打开的回复框，则关闭
  if (activeReplyId.value === reply._id) {
    activeReplyId.value = null
  } else {
    activeReplyId.value = reply._id
    // 关闭主评论回复框
    showMainReplyInput.value = false
  }
}

// 处理评论提交完成
function finishCommentInput() {
  // 关闭主评论输入框
  showMainReplyInput.value = false
  // 关闭二级评论输入框
  activeReplyId.value = null
}

// 点赞功能
function toggleLike(comment: Comment) {
  comment.isLiked = !comment.isLiked
  comment.likes += comment.isLiked ? 1 : -1
}

// 格式化日期
function formatDate(dateString?: string) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.comment-avatar,
.reply-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: #f3f4f6;
}

.action-btn.liked {
  color: #ef4444;
}

.icon {
  font-size: 1.125rem;
}

/* 保持其他原有样式不变 */
.comments-section {
  /* margin-top: 2rem; */
}

.comment-item {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

/* ... 其他样式保持不变 ... */
</style>
