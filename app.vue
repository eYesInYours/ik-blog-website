<script lang="ts" setup>
const { awesome } = useAppConfig()

useHead({
  title: awesome.name,
  titleTemplate: `%s - ${awesome.name}`,
})

import { useNotification } from '~/composables/useNotification'

const { notificationRef } = useNotification()
provide('notification', notificationRef)
</script>

<template>
  <Body
    class="antialiased duration-300 transition-colors text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-950"
  >
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
    <CommonNotification ref="notification" />
  </Body>
</template>
