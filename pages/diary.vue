<script lang="ts" setup>
definePageMeta({ layout: 'page' })
useHead({ title: '朋友圈' })

const isUploading = ref(false)
const content = ref('')
const images = ref<string[]>([])
const previewImages = ref<string[]>([])
const commentContent = ref('')
const activeCommentId = ref<number | null>(null)

const { fetchApi } = useApi()

interface Comment {
  _id: number
  authorName: string
  content: string
  replyTo?: string
  createdAt: string
}

interface Diary {
  id: number
  content: string
  images: string[]
  likes: number
  isLiked?: boolean
  comments: Array<Comment>
  createdAt: string
}

// 示例数据：已发布的日记列表
const diaries = ref<Diary[]>([])

let showInput = ref(false)
let activeComment = ref<Comment | null>(null)
function toggleInput(comment?: Comment){
  if(showInput.value){
    commentContent.value = ''
  }else{
    activeComment.value = comment?._id ? comment : null
  }
  showInput.value = !showInput.value
}

// 移除预览图片
const removeImage = (index: number) => {
  previewImages.value.splice(index, 1)
  images.value.splice(index, 1)
}

// 点赞功能
const toggleLike = async (diary: Diary) => {
  try {
    await fetchApi(`/diaries/${diary._id}/like`, {
      method: 'POST'
    })
    diary.isLiked = !diary.isLiked
    diary.likes += diary.isLiked ? 1 : -1
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

// 提交评论
const submitComment = async (diaryId: number) => {
  if (!commentContent.value.trim()) return

  const diary = diaries.value.find(d => d._id === diaryId)
  if (!diary) return

  await fetchApi('/comments', {
    method: 'POST',
    body: {
      content: commentContent.value,
      diaryId,
      parentCommentId: activeComment.value?._id
    }
  })

  diary.comments = await fetchComments(diaryId)
  console.log(diary.comments)
  commentContent.value = ''
  activeComment.value = null
}

// 加载状态
const loading = ref(true)

// 获取日记列表
const fetchDiaries = async () => {
  try {
    loading.value = true
    const res = await fetchApi('/diaries')
    diaries.value = res.data.diaries
  } catch (error) {
    console.error('获取日记列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取帖子的评论列表
const fetchComments = async (diaryId: number) => {
  const { data } = await fetchApi(`/comments/diary/${diaryId}`)
  return data
}

// 初始化
onMounted(() => {
  fetchDiaries()
})

const cancelComment = () => {
  activeComment.value = null
  commentContent.value = ''
}
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageSection>
      <div class="diary-page">

        <!-- 日记列表 -->
        <div class="diary-list">
          <!-- 骨架屏 -->
          <template v-if="loading">
            <div v-for="n in 3" :key="n" class="diary-item animate-pulse">
              <div class="diary-header">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div class="flex-1">
                    <div class="h-5 bg-gray-200 rounded w-24 mb-1"></div>
                    <div class="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
              <div class="diary-content">
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <!-- 图片占位 -->
                <div class="grid grid-cols-3 gap-2 mb-4">
                  <div class="aspect-square bg-gray-200 rounded"></div>
                  <div class="aspect-square bg-gray-200 rounded"></div>
                  <div class="aspect-square bg-gray-200 rounded"></div>
                </div>
                <!-- 操作按钮占位 -->
                <div class="flex items-center gap-4">
                  <div class="h-8 bg-gray-200 rounded w-20"></div>
                  <div class="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          </template>

          <!-- 日记内容 -->
          <template v-else>
            <div v-for="diary in diaries" :key="diary._id" class="diary-item">
              <!-- 日记内容 -->
              <div class="diary-content">
                <p class="text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap">
                  {{ diary.content }}
                </p>

                <!-- 图片网格 -->
                <div v-if="diary.images?.length" class="image-grid" :class="{
                  'grid-1': diary.images?.length === 1,
                  'grid-2': diary.images?.length === 2,
                  'grid-3': diary.images?.length === 3,
                  'grid-4': diary.images?.length >= 4
                }">
                  <div v-for="(img, index) in diary.images" :key="index" class="diary-image-container">
                    <img :src="img" :alt="`图片 ${index + 1}`" class="diary-image">
                  </div>
                </div>
              </div>

              <!-- 日记底部 -->
              <div class="diary-footer dark:border-gray-700">
                <span class="text-gray-500 dark:text-gray-400 text-sm">{{ diary.date }}</span>

                <div class="diary-actions">
                  <button
                    @click="toggleLike(diary)"
                    class="action-btn"
                    :class="{ 'is-active': diary.isLiked }"
                  >
                    <Icon :name="diary.isLiked ? 'heroicons:heart-solid' : 'heroicons:heart'" />
                    <span>{{ diary.likes }}</span>
                  </button>
                  <button
                    class="action-btn"
                    :class="{ 'is-active': showInput }"
                    @click="toggleInput()"
                  >
                    <Icon :name="showInput ? 'heroicons:chat-bubble-left-right-solid' : 'heroicons:chat-bubble-left-right'" />
                    <span>{{ diary.comments?.length }}</span>
                  </button>
                </div>
              </div>
              <!-- 评论列表 -->
              <div v-if="diary.comments?.length" class="diary-comments">
                <div v-for="comment in diary.comments" :key="comment._id" class="comment-item" @click="toggleInput(comment)">
                  <div><span class="text-blue">@{{ comment.author.username }}</span>：{{ comment.content }}</div>
                  <div v-for="reply in comment.replies" :key="reply._id">
                    <span class="text-blue">@{{ reply.author.username }}</span> 回复 <span class="text-blue">@{{
                      reply.replyTo.author.username }}</span>：{{ reply.content }}
                  </div>
                </div>
              </div>

              <!-- 评论输入框 -->
              <div v-if="showInput" class="comment-input">
                <textarea v-model="commentContent" type="text" :placeholder="activeComment?._id ? `回复 @${activeComment.author.username}` : '写下你的评论...' "
                  rows="2" class="comment-textarea"></textarea>
                <div class="comment-actions">
                  <button class="cancel-btn" @click="toggleInput()">
                    取消
                  </button>
                  <AwesomeButton size="xs" @click="submitComment(diary._id)" :disabled="!commentContent.trim()">
                    发布
                  </AwesomeButton>
                </div>
              </div>

            </div>
          </template>

          <!-- 无内容提示 -->
          <div v-if="!loading && diaries.length === 0" class="empty-tip">
            暂无动态，快去发布一条吧~
          </div>
        </div>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template>

<style scoped>
.diary-page {
  min-height: 100vh;
  padding: 1rem;
  background-color: var(--c-bg);
}

.diary-container {
  max-width: 800px;
  margin: 0 auto;
  background: var(--c-bg-secondary);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

.editor-section {
  padding: 1rem;
}

.content-editor {
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border: none;
  resize: vertical;
  outline: none;
  font-size: 1rem;
  line-height: 1.5;
}

.content-editor:focus {
  outline: none;
}

.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  padding: 0.5rem;
}

.image-preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.25rem;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-image-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-top: 1px solid #eee;
}

.left-tools {
  display: flex;
  gap: 1rem;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  color: #666;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.tool-btn:hover {
  background-color: #f5f5f5;
}

.tool-text {
  font-size: 0.875rem;
}

.publish-btn {
  background-color: var(--primary-600);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.publish-btn:hover:not(:disabled) {
  background-color: var(--primary-700);
}

.publish-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-mask {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-600);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .diary-page {
    padding: 0;
  }

  .diary-container {
    border-radius: 0;
    box-shadow: none;
  }

  .image-preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .tool-text {
    display: none;
  }

  .publish-btn {
    padding: 0.5rem 1rem;
  }
}

/* 添加日记列表样式 */
.diary-list {
  max-width: 800px;
  margin: 0 auto;
}

.diary-item {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.diary-content {
  margin-bottom: 1rem;
}

.image-grid {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.grid-1 {
  grid-template-columns: 1fr;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3,
.grid-4 {
  grid-template-columns: repeat(3, 1fr);
}

.diary-image-container {
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 0.25rem;
}

.diary-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.diary-image:hover {
  transform: scale(1.05);
}

.diary-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--c-border);
}

.diary-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--c-text-lighter);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: var(--c-bg-hover);
  color: var(--c-primary);
}

.action-btn.is-active {
  color: var(--c-primary);
}

.action-btn.is-active:hover {
  opacity: 0.8;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .diary-page {
    padding: 0;
  }

  .diary-container {
    border-radius: 0;
    box-shadow: none;
  }

  .diary-item {
    border-radius: 0;
    margin-bottom: 0.5rem;
  }

  .image-grid {
    gap: 0.25rem;
  }
}

/* 评论样式 */
.diary-comments {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--c-border);
}

.comment-item {
  padding: 0.1rem 0;
  color: var(--c-text);
  font-size: 0.875rem;
  cursor: pointer;
}

.comment-input {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--c-bg-secondary);
  border-radius: 0.5rem;
  width: 100%;
}

.comment-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--c-border);
  border-radius: 0.375rem;
  background: var(--c-bg);
  color: var(--c-text);
  outline: none;
  resize: vertical;
  min-height: 20px;
  max-height: 120px;
  line-height: 1.5;
  font-size: 0.875rem;
}

.comment-textarea:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.cancel-btn,
.submit-btn {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  min-width: 64px;
}

.cancel-btn {
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-text-light);
  padding: 0.375rem 1rem;
}

.submit-btn {
  background: var(--c-primary);
  border: none;
  padding: 0.375rem 1.25rem;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
