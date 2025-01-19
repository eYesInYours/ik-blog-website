<script setup lang="ts">
definePageMeta({ 
  layout: 'lessons',
})

interface RechargeOption {
  id: string
  title: string
  minutes: number
  price: number
  popular?: boolean
}

const options = ref<RechargeOption[]>([
  {
    id: '1',
    title: '基础套餐',
    minutes: 60,
    price: 199
  },
  {
    id: '2',
    title: '标准套餐',
    minutes: 180,
    price: 499,
    popular: true
  },
  {
    id: '3',
    title: '高级套餐',
    minutes: 360,
    price: 899
  }
])

const selectedOption = ref<string>()

const handleRecharge = () => {
  if (!selectedOption.value) return
  // TODO: 处理充值逻辑
}
</script>

<template>
  <LayoutPageWrapper>
    <LayoutPageHeader>
      <LayoutPageTitle text="课时充值" />
    </LayoutPageHeader>

    <LayoutPageSection>
      <div class="grid gap-4 md:grid-cols-3">
        <div
          v-for="option in options"
          :key="option.id"
          :class="[
            'relative p-6 rounded-xl border-2 cursor-pointer transition-all',
            selectedOption === option.id
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
              : 'border-gray-200 dark:border-gray-700 hover:border-primary-200'
          ]"
          @click="selectedOption = option.id"
        >
          <!-- 热门标签 -->
          <div
            v-if="option.popular"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500 text-white text-sm rounded-full"
          >
            热门
          </div>

          <h3 class="text-lg font-semibold mb-4">{{ option.title }}</h3>
          <div class="space-y-2 mb-4">
            <div class="text-2xl font-bold">
              ¥{{ option.price }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ option.minutes }}分钟
            </div>
          </div>
        </div>
      </div>

      <!-- 充值按钮 -->
      <div class="mt-8 flex justify-center">
        <UButton
          size="lg"
          color="primary"
          :disabled="!selectedOption"
          @click="handleRecharge"
        >
          立即充值
        </UButton>
      </div>
    </LayoutPageSection>
  </LayoutPageWrapper>
</template> 