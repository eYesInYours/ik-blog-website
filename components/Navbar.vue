<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
// ... 其他导入和代码
</script>

<template>
  <Disclosure as="nav" class="navbar" v-slot="{ open }">
    <!-- ... 其他内容 -->
    <DisclosurePanel class="mobile-menu">
      <!-- 移动端菜单内容 -->
    </DisclosurePanel>
  </Disclosure>
</template> 