<template>
  <Transition name="fade">
    <div v-if="visible" class="image-preview-overlay" @click="close">
      <div class="image-preview-content" @click.stop>
        <img 
          :src="imageSrc" 
          :alt="imageAlt" 
          class="preview-image" 
          :style="imageStyle"
          @wheel.prevent="handleWheel"
        />
        
        <!-- 工具栏 -->
        <div class="toolbar">
          <button class="tool-btn" @click="rotate(-90)" title="向左旋转">
            <UIcon name="i-carbon-rotate-counterclockwise" class="text-xl" />
          </button>
          <button class="tool-btn" @click="rotate(90)" title="向右旋转">
            <UIcon name="i-carbon-rotate-clockwise" class="text-xl" />
          </button>
          <button class="tool-btn" @click="zoom(0.1)" title="放大">
            <UIcon name="i-carbon-zoom-in" class="text-xl" />
          </button>
          <button class="tool-btn" @click="zoom(-0.1)" title="缩小">
            <UIcon name="i-carbon-zoom-out" class="text-xl" />
          </button>
          <button class="tool-btn" @click="resetTransform" title="重置">
            <UIcon name="i-carbon-reset" class="text-xl" />
          </button>
          <button class="tool-btn" @click="downloadImage" title="下载">
            <UIcon name="i-carbon-download" class="text-xl" />
          </button>
          <button class="tool-btn close-btn" @click="close" title="关闭">
            <UIcon name="i-carbon-close" class="text-xl" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  visible: boolean
  imageSrc: string
  imageAlt?: string
}>()

const emit = defineEmits<{
  close: []
}>()

// 图片变换状态
const scale = ref(1)
const rotation = ref(0)

// 计算图片样式
const imageStyle = computed(() => ({
  transform: `rotate(${rotation.value}deg) scale(${scale.value})`
}))

// 关闭预览
const close = () => {
  emit('close')
  resetTransform()
}

// 旋转图片
const rotate = (deg: number) => {
  rotation.value = (rotation.value + deg) % 360
}

// 缩放图片
const zoom = (delta: number) => {
  const newScale = scale.value + delta
  if (newScale >= 0.1 && newScale <= 3) {
    scale.value = newScale
  }
}

// 鼠标滚轮缩放
const handleWheel = (e: WheelEvent) => {
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  zoom(delta)
}

// 重置变换
const resetTransform = () => {
  scale.value = 1
  rotation.value = 0
}

// 下载图片
const downloadImage = async () => {
  try {
    const response = await fetch(props.imageSrc)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.imageAlt || 'image'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载图片失败:', error)
  }
}
</script>

<style lang="scss" scoped>
.image-preview-overlay {
  @apply fixed inset-0 z-50 
         flex items-center justify-center 
         bg-black/80 backdrop-blur-sm;
}

.image-preview-content {
  @apply relative max-w-[90vw] max-h-[90vh];
}

.preview-image {
  @apply max-w-full max-h-[90vh] 
         object-contain rounded-lg;
  transition: transform 0.3s ease;
}

.toolbar {
  @apply absolute bottom-4 left-1/2 -translate-x-1/2
         flex items-center gap-2 px-4 py-2
         bg-black/50 backdrop-blur-sm rounded-full;
}

.tool-btn {
  @apply w-10 h-10 rounded-full
         flex items-center justify-center
         text-white/80 hover:text-white
         hover:bg-white/10 transition-colors;

  &.close-btn {
    @apply hover:bg-red-500/30;
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .toolbar {
    @apply bottom-8 px-2 py-1 gap-1;
  }

  .tool-btn {
    @apply w-8 h-8;
  }
}
</style> 