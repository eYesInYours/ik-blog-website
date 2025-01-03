<script lang="ts" setup>
definePageMeta({ layout: 'page' })
useHead({ title: '朋友圈' })

const isUploading = ref(false)
const content = ref('')
const images = ref<string[]>([])
const previewImages = ref<string[]>([])

// 示例数据：已发布的日记列表
const diaries = ref([
    {
        id: 1,
        content: '今天学习了 Nuxt 3 的新特性，感觉很棒！分享一些学习笔记和代码片段。',
        images: [
            'https://picsum.photos/400/300?random=1',
            'https://picsum.photos/400/300?random=2',
            'https://picsum.photos/400/300?random=3'
        ],
        date: '2024-03-20 14:30',
        likes: 12,
        comments: 5
    },
    {
        id: 2,
        content: '周末去爬山拍到的美景，分享给大家！🏔️ #摄影 #户外',
        images: [
            'https://picsum.photos/400/300?random=4',
            'https://picsum.photos/400/300?random=5'
        ],
        date: '2024-03-19 18:20',
        likes: 45,
        comments: 8
    },
    {
        id: 3,
        content: '新入手的开发工具，准备开始新的项目！💻 期待接下来的开发之旅。',
        images: [
            'https://picsum.photos/400/300?random=6'
        ],
        date: '2024-03-18 10:15',
        likes: 28,
        comments: 12
    }
])

// 图片上传处理
const handleImageUpload = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return

    isUploading.value = true
    const files = Array.from(input.files)

    files.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
            if (typeof e.target?.result === 'string') {
                previewImages.value.push(e.target.result)
            }
        }
        reader.readAsDataURL(file)
    })

    setTimeout(() => {
        isUploading.value = false
        images.value.push(...files.map((_, index) => `/uploads/image-${Date.now()}-${index}.jpg`))
    }, 1000)
}

// 发布日记
const publishDiary = async () => {
    if (!content.value && images.value.length === 0) {
        return
    }

    try {
        // 模拟发布
        const newDiary = {
            id: diaries.value.length + 1,
            content: content.value,
            images: previewImages.value,
            date: new Date().toLocaleString(),
            likes: 0,
            comments: 0
        }

        diaries.value.unshift(newDiary)

        // 清空表单
        content.value = ''
        images.value = []
        previewImages.value = []
    } catch (error) {
        console.error('发布失败:', error)
    }
}

// 移除预览图片
const removeImage = (index: number) => {
    previewImages.value.splice(index, 1)
    images.value.splice(index, 1)
}

// 点赞功能
const toggleLike = (diary: any) => {
    diary.likes += 1
}
</script>

<template>
    <LayoutPageWrapper>
        <LayoutPageSection>
            <div class="diary-page">
                <!-- 发布区域 -->
                <div class="diary-container mb-4">
                    <!-- 加载中遮罩 -->
                    <div v-if="isUploading" class="upload-mask">
                        <div class="upload-spinner">
                            <i class="i-carbon-circle-dash animate-spin text-2xl"></i>
                            <span>上传中...</span>
                        </div>
                    </div>
                </div>

                <!-- 日记列表 -->
                <div class="diary-list">
                    <div v-for="diary in diaries" :key="diary.id" class="diary-item dark:bg-dark-500">
                        <!-- 日记内容 -->
                        <div class="diary-content">
                            <p class="text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap">
                                {{ diary.content }}
                            </p>

                            <!-- 图片网格 -->
                            <div v-if="diary.images.length" class="image-grid" :class="{
                                'grid-1': diary.images.length === 1,
                                'grid-2': diary.images.length === 2,
                                'grid-3': diary.images.length === 3,
                                'grid-4': diary.images.length >= 4
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
                                <button @click="toggleLike(diary)"
                                    class="action-btn dark:text-gray-400 dark:hover:bg-dark-400">
                                    <i class="i-carbon-favorite"></i>
                                    <span>{{ diary.likes }}</span>
                                </button>
                                <button class="action-btn dark:text-gray-400 dark:hover:bg-dark-400">
                                    <i class="i-carbon-chat"></i>
                                    <span>{{ diary.comments }}</span>
                                </button>
                            </div>
                        </div>
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
    background: var(--c-bg-secondary);
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
</style>
