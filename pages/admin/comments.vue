<template>
  <div>
    <!-- 顶部筛选区域 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-4">
        <a-select
          v-model:value="selectedArticle"
          show-search
          placeholder="选择文章"
          :options="articles"
          style="width: 300px"
          :filter-option="filterArticleOption"
          @change="handleArticleChange"
        />
        <a-select
          v-model:value="commentStatus"
          style="width: 120px"
          placeholder="评论状态"
        >
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="pending">待审核</a-select-option>
          <a-select-option value="approved">已通过</a-select-option>
          <a-select-option value="spam">垃圾评论</a-select-option>
        </a-select>
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索评论内容"
          style="width: 200px"
          @search="onSearch"
        />
      </div>
      <a-button type="primary" @click="handleBatchApprove" :disabled="!selectedRowKeys.length">
        批量通过
      </a-button>
    </div>

    <!-- 评论列表 -->
    <a-table 
      :columns="columns" 
      :data-source="comments"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
      :loading="loading"
    >
      <template #bodyCell="{ column, record }">
        <!-- 评论内容列 -->
        <template v-if="column.key === 'content'">
          <div class="flex items-start">
            <a-avatar :src="record.author.avatar" class="mr-2" />
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-medium">{{ record.author.name }}</span>
                <a-tag v-if="record.author.isAdmin" color="blue">管理员</a-tag>
                <span class="text-gray-500 text-sm">{{ record.createTime }}</span>
              </div>
              <div class="mt-1">{{ record.content }}</div>
              <div v-if="record.replyTo" class="mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <span class="text-gray-500">回复 @{{ record.replyTo.author.name }}:</span>
                <span class="ml-1">{{ record.replyTo.content }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 文章列 -->
        <template v-if="column.key === 'article'">
          <a @click="$router.push(`/admin/articles/${record.articleId}`)">
            {{ record.articleTitle }}
          </a>
        </template>

        <!-- 状态列 -->
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>

        <!-- 操作列 -->
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button 
              v-if="record.status === 'pending'"
              type="link" 
              @click="handleApprove(record)"
            >
              通过
            </a-button>
            <a-button 
              v-if="record.status === 'pending'"
              type="link" 
              danger
              @click="handleMarkSpam(record)"
            >
              标记垃圾
            </a-button>
            <a-button type="link" @click="handleReply(record)">回复</a-button>
            <a-popconfirm
              title="确定要删除这条评论吗？"
              @confirm="handleDelete(record)"
            >
              <a-button type="link" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 回复弹窗 -->
    <a-modal
      v-model:visible="replyModalVisible"
      title="回复评论"
      @ok="handleReplySubmit"
    >
      <a-form :model="replyForm">
        <a-form-item label="回复内容">
          <a-textarea
            v-model:value="replyForm.content"
            :rows="4"
            placeholder="请输入回复内容"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue'

definePageMeta({ layout: 'admin' })
useHead({ title: '评论管理' })

// 表格列定义
const columns: TableColumnsType = [
  {
    title: '评论内容',
    dataIndex: 'content',
    key: 'content',
    width: '40%'
  },
  {
    title: '所属文章',
    dataIndex: 'article',
    key: 'article',
    width: '20%'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: '100px'
  },
  {
    title: '发布时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: '150px'
  },
  {
    title: '操作',
    key: 'action',
    width: '200px'
  }
]

// 状态和数据
const loading = ref(false)
const searchText = ref('')
const commentStatus = ref('')
const selectedArticle = ref<string>()
const selectedRowKeys = ref<string[]>([])
const replyModalVisible = ref(false)
const replyForm = ref({
  content: '',
  commentId: null as number | null
})

// 示例文章数据
const articles = ref([
  { value: '1', label: '使用 Nuxt 3 构建现代化博客' },
  { value: '2', label: 'Vue 3 组合式 API 最佳实践' }
])

// 示例评论数据
const comments = ref([
  {
    id: '1',
    articleId: '1',
    articleTitle: '使用 Nuxt 3 构建现代化博客',
    content: '这篇文章写得很好，对我帮助很大！',
    createTime: '2024-03-21 14:30',
    status: 'pending',
    author: {
      name: 'John Doe',
      avatar: '/avatar.jpg',
      isAdmin: false
    }
  },
  {
    id: '2',
    articleId: '1',
    articleTitle: '使用 Nuxt 3 构建现代化博客',
    content: '感谢分享，写得非常详细',
    createTime: '2024-03-21 15:00',
    status: 'approved',
    author: {
      name: 'Jane Smith',
      avatar: '/avatar.jpg',
      isAdmin: false
    },
    replyTo: {
      content: '这篇文章写得很好，对我帮助很大！',
      author: {
        name: 'John Doe'
      }
    }
  }
])

// 文章筛选
const filterArticleOption = (input: string, option: any) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 状态颜色和文本
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    spam: 'red'
  }
  return colors[status]
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    spam: '垃圾评论'
  }
  return texts[status]
}

// 事件处理
const handleArticleChange = (value: string) => {
  // TODO: 根据文章ID加载评论
  console.log('选择文章:', value)
}

const onSearch = (value: string) => {
  // TODO: 搜索评论
  console.log('搜索:', value)
}

const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys
}

const handleApprove = (record: any) => {
  // TODO: 通过评论
  console.log('通过评论:', record)
}

const handleMarkSpam = (record: any) => {
  // TODO: 标记垃圾评论
  console.log('标记垃圾评论:', record)
}

const handleBatchApprove = () => {
  // TODO: 批量通过评论
  console.log('批量通过:', selectedRowKeys.value)
}

const handleReply = (record: any) => {
  replyForm.value.commentId = record.id
  replyModalVisible.value = true
}

const handleReplySubmit = () => {
  // TODO: 提交回复
  console.log('提交回复:', replyForm.value)
  replyModalVisible.value = false
  replyForm.value = { content: '', commentId: null }
}

const handleDelete = (record: any) => {
  // TODO: 删除评论
  console.log('删除评论:', record)
}
</script>
