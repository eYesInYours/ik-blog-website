<script lang="ts" setup>
const { awesome } = useAppConfig()

useHead({
  title: awesome.name,
  titleTemplate: `%s - ${awesome.name}`,
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
    <UNotifications />
  </div>
</template>

<style>
html {
  @apply scroll-smooth;
}

body {
  @apply bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200;
}

::selection {
  @apply bg-primary-500/20;
}
</style>
