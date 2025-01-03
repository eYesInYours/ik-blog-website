<template>
  <div>
    <!-- 左侧分类列表 -->
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="分类列表">
          <template #extra>
            <a-button type="primary" size="small" @click="showModal">
              <template #icon><PlusOutlined /></template>
              新增
            </a-button>
          </template>
          <a-tree
            v-model:selectedKeys="selectedKeys"
            v-model:expandedKeys="expandedKeys"
            :tree-data="categories"
            :replaceFields="{ title: 'name', key: 'id' }"
          >
            <template #title="{ name, id }">
              <div class="flex items-center justify-between w-full pr-2">
                <span>{{ name }}</span>
                <a-dropdown>
                  <EllipsisOutlined />
                  <template #overlay>
                    <a-menu>
                      <a-menu-item @click="handleEdit(id)">编辑</a-menu-item>
                      <a-menu-item danger @click="handleDelete(id)">删除</a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>
            </template>
          </a-tree>
        </a-card>
      </a-col>

      <!-- 右侧分类详情 -->
      <a-col :span="16">
        <a-card v-if="selectedKeys.length" title="分类详情">
          <a-descriptions :column="1">
            <a-descriptions-item label="分类名称">
              {{ currentCategory?.name }}
            </a-descriptions-item>
            <a-descriptions-item label="文章数量">
              {{ currentCategory?.articleCount }}
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">
              {{ currentCategory?.createTime }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>

    <!-- 新增/编辑分类弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalType === 'add' ? '新增分类' : '编辑分类'"
      @ok="handleModalOk"
    >
      <a-form :model="formState" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="名称" required>
          <a-input v-model:value="formState.name" />
        </a-form-item>
        <a-form-item label="父分类">
          <a-tree-select
            v-model:value="formState.parentId"
            :tree-data="categories"
            :replaceFields="{ title: 'name', key: 'id', value: 'id' }"
            allow-clear
            placeholder="请选择父分类"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'admin' })
useHead({ title: '分类管理' })

// 状态
const selectedKeys = ref<string[]>([])
const expandedKeys = ref<string[]>([])
const modalVisible = ref(false)
const modalType = ref<'add' | 'edit'>('add')
const formState = ref({
  name: '',
  parentId: undefined
})

// 示例数据
const categories = ref([
  {
    id: '1',
    name: '技术',
    articleCount: 10,
    createTime: '2024-03-20',
    children: [
      {
        id: '1-1',
        name: '前端',
        articleCount: 5,
        createTime: '2024-03-20'
      },
      {
        id: '1-2',
        name: '后端',
        articleCount: 5,
        createTime: '2024-03-20'
      }
    ]
  },
  {
    id: '2',
    name: '生活',
    articleCount: 5,
    createTime: '2024-03-20'
  }
])

// 获取当前选中的分类
const currentCategory = computed(() => {
  if (!selectedKeys.value.length) return null
  const findCategory = (items: any[], id: string): any => {
    for (const item of items) {
      if (item.id === id) return item
      if (item.children) {
        const found = findCategory(item.children, id)
        if (found) return found
      }
    }
    return null
  }
  return findCategory(categories.value, selectedKeys.value[0])
})

// 显示新增弹窗
const showModal = () => {
  modalType.value = 'add'
  formState.value = { name: '', parentId: undefined }
  modalVisible.value = true
}

// 编辑分类
const handleEdit = (id: string) => {
  modalType.value = 'edit'
  const category = currentCategory.value
  formState.value = {
    name: category.name,
    parentId: category.parentId
  }
  modalVisible.value = true
}

// 删除分类
const handleDelete = (id: string) => {
  console.log('delete:', id)
}

// 提交表单
const handleModalOk = () => {
  console.log('submit:', formState.value)
  modalVisible.value = false
}
</script>
