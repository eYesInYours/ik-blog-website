<template>
  <Transition name="fade">
    <div v-if="visible" class="image-preview-overlay" @click="close">
      <div class="image-preview-content" @click.stop>
        <img 
          :src="image" 
          :alt="alt" 
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

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'close'])

// 图片变换状态
const scale = ref(1)
const rotation = ref(0)

// 计算图片样式
const imageStyle = computed(() => ({
  transform: `rotate(${rotation.value}deg) scale(${scale.value})`
}))

// 关闭预览
const close = () => {
  emit('update:visible', false)
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
    const response = await fetch(props.image)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.alt || 'image'
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
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(2px);
}

.image-preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;

  .preview-image {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
    transition: transform 0.3s ease;
  }

  .toolbar {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    border-radius: 9999px;
  }

  .tool-btn {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    border: none;
    background: transparent;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    i {
      font-size: 1.25rem;
    }

    &.close-btn:hover {
      background-color: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
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
  .image-preview-content {
    .toolbar {
      bottom: 4rem;
      padding: 0.25rem;
      gap: 0.25rem;
    }

    .tool-btn {
      width: 2rem;
      height: 2rem;

      i {
        font-size: 1rem;
      }
    }
  }
}
</style> 