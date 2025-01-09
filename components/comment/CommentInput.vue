<template>
  <div v-if="show" class="comment-input-container">
    <div v-if="showHeader" class="input-header">
      <img
        :src="user?.avatar ? getAssetUrl(user.avatar) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`"
        :alt="user?.username"
        class="user-avatar"
      />
      <span class="username">{{ user?.username }}</span>
    </div>

    <div class="input-body">
      <textarea
        v-model="content"
        :placeholder="placeholder"
        class="comment-textarea"
        @keydown.esc="handleCancel"
      ></textarea>

      <div class="input-actions">
        <div class="action-buttons">
          <!-- 表情选择器 -->
          <div
            ref="emojiPopoverRef"
            class="emoji-popover"
          >
            <button
              class="action-btn"
              @click="showEmojiPicker = !showEmojiPicker"
            >
              <i class="i-heroicons-face-smile"></i>
            </button>
            <div v-if="showEmojiPicker" class="emoji-content">
              <div class="emoji-picker">
                <button
                  v-for="emoji in emojis"
                  :key="emoji"
                  class="emoji-btn"
                  @click="insertEmoji(emoji)"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>
          </div>

          <!-- 图片上传 -->
          <button
            class="action-btn"
            @click="triggerImageUpload"
          >
            <i class="i-heroicons-photo"></i>
          </button>
          <input
            ref="imageInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleImageUpload"
          >
        </div>

        <div class="button-group">
          <button
            v-if="showCancelButton"
            class="btn btn-ghost"
            @click="handleCancel"
          >
            取消
          </button>
          <button
            class="btn btn-primary"
            :disabled="!content.trim() && !images.length"
            @click="handleSubmit"
          >
            <i v-if="submitting" class="i-heroicons-arrow-path animate-spin"></i>
            {{ submitText }}
          </button>
        </div>
      </div>

      <!-- 图片预览区 -->
      <div v-if="images.length" class="image-preview">
        <div v-for="(img, index) in images" :key="index" class="preview-item">
          <img :src="getAssetUrl(img)" alt="预览图片">
          <button
            class="remove-btn"
            @click="removeImage(index)"
          >
            <i class="i-heroicons-x-mark"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="submitting" class="loading-overlay">
      <i class="i-heroicons-arrow-path animate-spin"></i>
      <span>发送中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useRoute } from 'vue-router'
import { fetchApi } from '~/utils/fetchApi'

const route = useRoute()

const { user } = useAuth()
const props = withDefaults(defineProps<{
  placeholder?: string
  submitText?: string
  submitting?: boolean
  show?: boolean
  showHeader?: boolean
  parentCommentId?: string
  showCancelButton?: boolean
}>(), {
  placeholder: '写下你的评论...',
  submitText: '发送',
  submitting: false,
  show: true,
  showHeader: true,
  showCancelButton: true
})

const emit = defineEmits<{
  submit: [{ content: string, images: string[] }]
  cancel: []
}>()

// 状态管理
const content = ref('')
const images = ref<string[]>([])
const imageInput = ref<HTMLInputElement | null>(null)

// 表情列表
const emojis = ['😊', '😂', '🤔', '👍', '❤️', '🎉', '🌟', '😅', '🤣', '😍']

// 插入表情
function insertEmoji(emoji: string) {
  content.value += emoji
  showEmojiPicker.value = false
}

// 触发图片上传
function triggerImageUpload() {
  imageInput.value?.click()
}

// 处理片上传
async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetchApi('/upload', {
      method: 'POST',
      body: formData
    })

    if (response.url) {
      images.value.push(response.url)
    }
  } catch (error) {
    console.error('图片上传失败:', error)
  }

  // 重置 input
  if (target) target.value = ''
}

// 移除图片
function removeImage(index: number) {
  images.value.splice(index, 1)
}

const toast = useToast()
// 重置状态
function resetState() {
  content.value = ''
  images.value = []
}

// 处理取消
function handleCancel() {
  resetState()
  // emit('cancel')
}

// 处理提交
async function handleSubmit() {
  if (!content.value.trim() && !images.value.length) return

  try {
    await fetchApi('/comment', {
      method: 'POST',
      body: {
        content: content.value,
        articleId: route.params.id as string,
        parentCommentId: props.parentCommentId,
      }
    })

    emit('submit', {
      content: content.value,
      images: images.value,
    })
    resetState()
  } catch (error) {
    console.error('提交失败:', error)
    // 使用 toast 显示错误信息
    toast.error('评论发布失败，请重试')
  }
}

const showEmojiPicker = ref(false)
const emojiPopoverRef = ref<HTMLElement | null>(null)

// 处理点击事件
function handleClickOutside(event: MouseEvent) {
  if (
    showEmojiPicker.value &&
    emojiPopoverRef.value &&
    !emojiPopoverRef.value.contains(event.target as Node)
  ) {
    showEmojiPicker.value = false
  }
}

// 添加和移除事件监听器
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.comment-input-container {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  position: relative;
}

.input-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-weight: 500;
  color: #374151;
}

.comment-textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  resize: vertical;
  outline: none;
}

.comment-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-ghost {
  background: transparent;
  border: 1px solid #e5e7eb;
  color: #374151;
}

.btn-ghost:hover {
  background: #f3f4f6;
}

.btn-primary {
  background: #3b82f6;
  border: 1px solid #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 0.375rem;
  color: #374151;
}

.action-btn:hover {
  background: #f3f4f6;
}

.emoji-popover {
  position: relative;
}

.emoji-content {
  position: absolute;
  bottom: 100%;
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 10;
  margin-bottom: 0.5rem;
}

.image-preview {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preview-item {
  position: relative;
  width: 80px;
  height: 80px;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.25rem;
}

.remove-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: rgba(0, 0, 0, 0.5);
  color: white;
}

.hidden {
  display: none;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  z-index: 10;
}

.emoji-picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.25rem;
  padding: 0.5rem;
}

.emoji-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.emoji-btn:hover {
  background-color: #f3f4f6;
}
</style>
