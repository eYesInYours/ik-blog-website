<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const colorMode = useColorMode()
const isOpen = ref(false)
const dropdownRef = ref(null)

const availableThemes = [
  {
    key: 'light',
    text: '浅色',
    icon: 'i-ph-sun-duotone'
  },
  {
    key: 'dark',
    text: '深色',
    icon: 'i-ph-moon-duotone'
  },
  {
    key: 'system',
    text: '系统',
    icon: 'i-ph-desktop-duotone'
  }
]

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

// 点击外部时关闭下拉菜单
onClickOutside(dropdownRef, () => {
  isOpen.value = false
})
</script>

<template>
  <div ref="dropdownRef" class="relative flex items-center">
    <!-- 触发按钮 -->
    <button
      class="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      @click="toggleDropdown"
    >
      <Icon
        :name="colorMode.preference === 'dark' ? 'i-ph-moon-duotone' : 'i-ph-sun-duotone'"
        class="w-5 h-5 text-gray-700 dark:text-gray-200"
      />
    </button>

    <!-- 下拉菜单 -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-40 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 z-50"
      >
        <div
          v-for="theme in availableThemes"
          :key="theme.key"
          class="flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
          :class="{
            'bg-gray-50 dark:bg-gray-700/50': colorMode.preference === theme.key
          }"
          @click="() => {
            colorMode.preference = theme.key
            isOpen = false
          }"
        >
          <div class="flex items-center gap-2">
            <Icon
              :name="theme.icon"
              class="w-5 h-5"
              :class="colorMode.preference === theme.key ? 'text-primary-500 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'"
            />
            <span
              class="text-sm"
              :class="colorMode.preference === theme.key ? 'text-primary-500 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-200'"
            >{{ theme.text }}</span>
          </div>
          <Icon
            v-if="colorMode.preference === theme.key"
            name="i-ph-check-bold"
            class="w-4 h-4 text-primary-500 dark:text-primary-400"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dark .dark\:bg-gray-800 {
  --tw-bg-opacity: 1;
  background-color: rgb(31 41 55 / var(--tw-bg-opacity));
}

.dark .dark\:hover\:bg-gray-700\/50:hover {
  background-color: rgb(55 65 81 / 0.5);
}
</style>