<template>
  <div>
    <!-- 顶部操作栏 -->
    <div class="flex justify-between mb-6">
      <div class="flex items-center gap-4">
        <UInput
          v-model="searchText"
          icon="i-heroicons-magnifying-glass"
          placeholder="搜索文章"
          size="sm"
        />
        <USelect
          v-model="filterStatus"
          :options="[
            { label: '全部', value: '' },
            { label: '已发布', value: 'published' },
            { label: '草稿', value: 'draft' }
          ]"
          placeholder="文章状态"
          size="sm"
        />
      </div>
      <UButton
        icon="i-heroicons-plus"
        @click="router.push('/admin/articles/new')"
      >
        写文章
      </UButton>
    </div>

    <!-- 文章列表 -->
    <UTable
      :rows="articles"
      :columns="columns"
      :loading="loading"
    >
      <template #title-data="{ row }">
        <NuxtLink 
          :to="`/admin/articles/${row.id}/edit`"
          class="text-primary-500 hover:text-primary-600"
        >
          {{ row.title }}
        </NuxtLink>
      </template>

      <template #status-data="{ row }">
        <UBadge
          :color="row.status === 'published' ? 'green' : 'orange'"
          :label="row.status === 'published' ? '已发布' : '草稿'"
          variant="subtle"
          size="sm"
        />
      </template>

      <template #actions-data="{ row }">
        <div class="flex items-center gap-2">
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-pencil"
            size="xs"
            @click="router.push(`/admin/articles/${row.id}/edit`)"
          >
            编辑
          </UButton>
          <UPopover>
            <UButton
              color="red"
              variant="ghost"
              icon="i-heroicons-trash"
              size="xs"
            >
              删除
            </UButton>
            <template #panel>
              <div class="p-4">
                <p class="mb-2">确定要删除这篇文章吗？</p>
                <div class="flex justify-end gap-2">
                  <UButton
                    color="gray"
                    variant="soft"
                    size="sm"
                    @click="closePopover"
                  >
                    取消
                  </UButton>
                  <UButton
                    color="red"
                    variant="soft"
                    size="sm"
                    @click="handleDelete(row.id)"
                  >
                    确定
                  </UButton>
                </div>
              </div>
            </template>
          </UPopover>
        </div>
      </template>
    </UTable>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'admin' })
useHead({ title: '文章管理' })

const router = useRouter()

// 表格列定义
const columns = [
  {
    key: 'title',
    label: '标题',
  },
  {
    key: 'category',
    label: '分类'
  },
  {
    key: 'status',
    label: '状态'
  },
  {
    key: 'publishTime',
    label: '发布时间'
  },
  {
    key: 'actions',
    label: '操作'
  }
]

// 状态
const searchText = ref('')
const filterStatus = ref('')
const loading = ref(false)

// 示例数据
const articles = ref([
  {
    id: 1,
    title: '使用 Nuxt 3 构建现代化博客',
    category: '技术',
    status: 'published',
    publishTime: '2024-03-20 12:00:00'
  },
  {
    id: 2,
    title: 'Vue 3 组合式 API 最佳实践',
    category: '编程',
    status: 'draft',
    publishTime: '-'
  }
])

// 删除文章
const handleDelete = (id: number) => {
  console.log('delete:', id)
}
</script>
