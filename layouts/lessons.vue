<template>
  <div class="min-h-screen flex flex-col">
    <!-- 主要内容区域 -->
    <main class="flex-1 pb-16">
      <slot />
    </main>

    <!-- 底部标签栏 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div class="max-w-screen-xl mx-auto px-4">
        <div class="flex justify-around">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex flex-col items-center py-2 px-3"
            active-class="text-primary-500 dark:text-primary-400"
          >
            <UIcon
              :name="item.icon"
              class="w-6 h-6 mb-1"
            />
            <span class="text-xs">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
const navItems = [
  {
    label: '课时管理',
    icon: 'i-heroicons-clock',
    path: '/lessons'
  },
  {
    label: '使用记录',
    icon: 'i-heroicons-document-text',
    path: '/lessons/history'
  },
  {
    label: '个人中心',
    icon: 'i-heroicons-user',
    path: '/lessons/profile'
  }
]
</script> 