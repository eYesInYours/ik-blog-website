<template>
  <div class="page-layout">
    <!-- 固定导航栏 -->
    <LayoutPageNavbar 
      class="navbar fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-transform duration-300" 
      :class="{ '-translate-y-full': hideNavbar }"
    />

    <!-- 主要内容区域 -->
    <LayoutPageContent class="page-main pt-16">
      <slot />
    </LayoutPageContent>

    <!-- 页脚 -->
    <LayoutPageFooter class="h-[52px] md:h-[42px]" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const hideNavbar = ref(false)
let lastScrollY = 0

const handleScroll = () => {
  const currentScrollY = window.scrollY
  
  // 向下滚动超过50px时隐藏导航栏
  if (currentScrollY > lastScrollY && currentScrollY > 50) {
    hideNavbar.value = true
  } 
  // 向上滚动或回到顶部时显示导航栏
  else {
    hideNavbar.value = false
  }
  
  lastScrollY = currentScrollY
}

// 使用节流函数优化滚动事件处理
const throttle = (fn, delay) => {
  let timer = null
  return function(...args) {
    if (!timer) {
      timer = setTimeout(() => {
        fn.apply(this, args)
        timer = null
      }, delay)
    }
  }
}

const throttledScroll = throttle(handleScroll, 100)

onMounted(() => {
  window.addEventListener('scroll', throttledScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', throttledScroll)
})
</script>

<style lang="scss">
.page-layout {
  min-height: 100vh;
  
  .navbar {
    height: 64px;
    will-change: transform;
  }

  .page-main {
    min-height: calc(100vh - 64px - 52px); /* 减去导航栏和页脚的高度 */
  }
}
</style>
