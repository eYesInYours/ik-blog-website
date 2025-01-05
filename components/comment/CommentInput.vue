<template>
  <div v-if="show" class="comment-input-container">
    <div v-if="showHeader" class="input-header">
      <UAvatar
        :src="user?.avatar ? getAssetUrl(user.avatar) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`"
        :alt="user?.username"
        size="sm"
        class="user-avatar"
      />
      <span class="username">{{ user?.username }}</span>
    </div>

    <div class="input-body">
      <UTextarea
        v-model="content"
        :placeholder="placeholder"
        class="comment-textarea"
        @keydown.esc="handleCancel"
      />
      
      <div class="input-actions">
        <div class="action-buttons">
          <!-- 表情选择器 -->
          <UPopover :popper="{ placement: 'top-start' }">
            <UButton
              variant="ghost"
              size="xs"
              icon="i-heroicons-face-smile"
              class="action-btn"
            />
            <template #content>
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
            </template>
          </UPopover>

          <!-- 图片上传 -->
          <UButton
            variant="ghost"
            size="xs"
            icon="i-heroicons-photo"
            class="action-btn"
            @click="triggerImageUpload"
          />
          <input
            ref="imageInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleImageUpload"
          >
        </div>

        <div class="button-group">
          <UButton
            v-if="showCancelButton"
            variant="ghost"
            size="sm"
            @click="handleCancel"
          >
            取消
          </UButton>
          <UButton
            size="sm"
            :disabled="!content.trim() && !images.length"
            :loading="submitting"
            @click="handleSubmit"
          >
            {{ submitText }}
          </UButton>
        </div>
      </div>

      <!-- 图片预览区 -->
      <div v-if="images.length" class="image-preview">
        <div v-for="(img, index) in images" :key="index" class="preview-item">
          <img :src="getAssetUrl(img)" alt="预览图片">
          <UButton
            variant="ghost"
            size="xs"
            icon="i-heroicons-x-mark"
            class="remove-btn"
            @click="removeImage(index)"
          />
        </div>
      </div>
    </div>

    <div v-if="submitting" class="loading-overlay">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
      <span>发送中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { getAssetUrl } from '~/utils/asset'
import { useAuth } from '~/composables/useAuth'
import { useArticleStore } from '~/stores/articleStore'
import { useRoute } from 'vue-router'

const articleStore = useArticleStore()
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
    await articleStore.postComment({
      content: content.value,
      articleId: route.params.id as string,
      parentCommentId: props.parentCommentId,
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
</script>

<style scoped>
.comment-input-container {
  background: white;
  border-radius: 8px;
  padding: 1rem;
}

.input-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.username {
  font-weight: 500;
  color: #374151;
}

.comment-textarea {
  width: 100%;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
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
</style>
