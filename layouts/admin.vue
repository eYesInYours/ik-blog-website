<template>
  <div class="h-screen flex bg-gray-100 dark:bg-dark-800">
    <!-- 侧边栏 -->
    <div
      :class="[
        'transition-all duration-500 bg-white dark:bg-dark-700 border-r dark:border-dark-600',
        isCollapsed ? 'w-20' : 'w-64'
      ]"
    >
      <!-- Logo区域 -->
      <div class="h-16 flex items-center justify-center border-b dark:border-dark-600 relative">
        <div class="absolute inset-0 flex items-center justify-center">
          <span v-show="isCollapsed" class="text-xl font-bold">{{ config.awesome.name?.slice(0, 1) }}</span>
        </div>
        <HeadlessTransition
          enter="transition-all duration-500"
          enter-from="opacity-0 translate-x-4"
          enter-to="opacity-100 translate-x-0"
          leave="transition-all duration-500"
          leave-from="opacity-100 translate-x-0"
          leave-to="opacity-0 translate-x-4"
        >
          <span v-show="!isCollapsed" class="text-xl font-bold ml-2">{{ config.awesome.name }}</span>
        </HeadlessTransition>
      </div>

      <!-- 导航菜单 -->
      <nav class="mt-4">
        <div v-for="item in sideMenus" :key="item.key">
          <!-- 一级菜单 -->
          <div
            class="group flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-600 cursor-pointer relative"
            :class="[
              { 'justify-center': isCollapsed },
              isActiveRoute(item) ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : ''
            ]"
            @click="toggleSubMenu(item)"
          >
            <!-- 激活指示器 -->
            <div
              v-if="isActiveRoute(item)"
              class="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 dark:bg-primary-400"
            />
            
            <div class="relative flex items-center">
              <Icon :name="getIconName(item.icon)" class="w-5 h-5" :class="{ 'text-primary-600 dark:text-primary-400': isActiveRoute(item) }" />
              <HeadlessTransition
                enter="transition-all duration-500"
                enter-from="opacity-0 -translate-x-4"
                enter-to="opacity-100 translate-x-0"
                leave="transition-all duration-500"
                leave-from="opacity-100 translate-x-0"
                leave-to="opacity-0 -translate-x-4"
              >
                <span v-show="!isCollapsed" class="ml-3 whitespace-nowrap">{{ item.title }}</span>
              </HeadlessTransition>
            </div>

            <HeadlessTransition
              enter="transition-all duration-500"
              enter-from="opacity-0"
              enter-to="opacity-100"
              leave="transition-all duration-500"
              leave-from="opacity-100"
              leave-to="opacity-0"
            >
              <Icon
                v-if="!isCollapsed && item.children"
                :name="item.isOpen ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
                class="w-4 h-4 ml-auto transition-transform duration-500"
                :class="{ 'rotate-180': item.isOpen }"
              />
            </HeadlessTransition>

            <!-- 悬浮提示 -->
            <div
              v-if="isCollapsed"
              class="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
            >
              {{ item.title }}
            </div>
          </div>

          <!-- 二级菜单 -->
          <HeadlessTransition
            enter="transition-all duration-500 ease-out"
            enter-from="transform scale-y-95 opacity-0"
            enter-to="transform scale-y-100 opacity-100"
            leave="transition-all duration-500 ease-in"
            leave-from="transform scale-y-100 opacity-100"
            leave-to="transform scale-y-95 opacity-0"
          >
            <div
              v-if="item.children && item.isOpen && !isCollapsed"
              class="bg-gray-50 dark:bg-dark-600 overflow-hidden"
            >
              <NuxtLink
                v-for="subItem in item.children"
                :key="subItem.key"
                :to="subItem.to"
                class="flex items-center pl-12 pr-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-500 group"
                :class="{ 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': isActiveRoute(subItem) }"
              >
                <span class="ml-2">{{ subItem.title }}</span>
              </NuxtLink>
            </div>
          </HeadlessTransition>
        </div>
      </nav>
    </div>

    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶部导航栏 -->
      <header class="h-16 bg-white dark:bg-dark-700 border-b dark:border-dark-600 flex items-center px-4">
        <button
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
          @click="toggleSidebar"
        >
          <Icon 
            name="heroicons:chevron-double-left"
            class="w-6 h-6 transition-transform duration-500"
            :class="{ 'rotate-180': isCollapsed }"
          />
        </button>

        <div class="flex-1" />

        <!-- 右侧操作按钮 -->
        <div class="flex items-center space-x-4">
          <!-- 主题切换 -->
          <button
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600"
            @click="toggleColorMode"
          >
            <Icon
              :name="colorMode.value === 'dark' ? 'heroicons:moon' : 'heroicons:sun'"
              class="w-6 h-6"
            />
          </button>

          <!-- 退出登录 -->
          <button
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600"
            @click="handleLogout"
          >
            <Icon name="heroicons:arrow-right-on-rectangle" class="w-6 h-6" />
          </button>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useAppConfig()
const colorMode = useColorMode()
const isCollapsed = ref(false)

// 使用配置文件中的菜单数据
const sideMenus = reactive(config.admin?.menus?.side || [])

// 转换图标名称（从 i-heroicons-home 转为 heroicons:home）
const getIconName = (icon: string = '') => {
  return icon.replace('i-heroicons-', 'heroicons:')
}

// 判断路由是否激活
const route = useRoute()
const isActiveRoute = (item: any) => {
  if (item.to === route.path) return true
  if (item.children) {
    return item.children.some((child: any) => child.to === route.path)
  }
  return false
}

// 切换子菜单
const toggleSubMenu = (item: any) => {
  if (item.children) {
    // 关闭其他打开的菜单
    sideMenus.forEach((menuItem: any) => {
      if (menuItem !== item && menuItem.isOpen) {
        menuItem.isOpen = false
      }
    })
    item.isOpen = !item.isOpen
  } else if (item.to) {
    navigateTo(item.to)
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  // 收起时关闭所有展开的子菜单
  if (isCollapsed.value) {
    sideMenus.forEach((item: any) => {
      if (item.isOpen) item.isOpen = false
    })
  }
}

// 切换主题
const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// 退出登录
const handleLogout = () => {
  // TODO: 实现退出登录逻辑
  navigateTo('/login')
}
</script>

<style scoped>
.router-link-active {
  @apply bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400;
}
</style> 