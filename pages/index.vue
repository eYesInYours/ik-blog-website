<script lang="ts" setup>
const { awesome } = useAppConfig()
definePageMeta({ layout: 'page' })
useHead({ titleTemplate: '', title: awesome?.name || '我的技术博客' })

const { fetchApi } = useApi()

interface Author {
  _id: string
  username: string
  avatar: string
}

interface Article {
  _id: string
  title: string
  content: string
  category: string
  cover: string
  status: string
  author: Author
  authorAvatar: string
  tags: string[]
  comments: any[]
  createdAt: string
  updatedAt: string
}

interface ArticleResponse {
  code: number
  message: string
  data: {
    articles: Article[]
    pagination: {
      total: number
      totalPages: number
      currentPage: number
      limit: number
    }
  }
}

// 文章列表数据
const articles = ref<Article[]>([])
const pagination = ref({
  total: 0,
  totalPages: 0,
  currentPage: 1,
  limit: 10
})

// 加载状态
const loading = ref(true)

// 获取文章列表
const fetchArticles = async (page = 1) => {
  try {
    loading.value = true
    const response = await fetchApi<ArticleResponse>('/articles', {
      params: {
        page,
        limit: pagination.value.limit,
      },
    })

    if (response.code === 200) {
      articles.value = response.data.articles
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 初始加载
onMounted(() => {
  fetchArticles()
})

// 侧边栏数据
const tags = computed(() => {
  const allTags = articles.value.flatMap(article => article.tags)
  return [...new Set(allTags)]
})

// 搜索功能
const searchQuery = ref('')
const filteredArticles = computed(() => {
  if (!searchQuery.value) return articles.value
  const query = searchQuery.value.toLowerCase()
  return articles.value.filter(article =>
    article.title.toLowerCase().includes(query)
  )
})

// 分页相关
const currentPage = computed({
  get: () => pagination.value.currentPage,
  set: (value) => {
    fetchArticles(value)
  }
})

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 前往文章详情页面
function handleClick(id: string) {
  navigateTo(`/articles/${id}`)
}

const userStore = useUserStore()

// 天气数据类型
interface WeatherData {
  temperature: number
  city: string
  condition: string
  humidity: number
  windSpeed: number
}

// 天气状态映射
const weatherConditionMap: Record<string, string> = {
  '晴': 'sunny',
  '多云': 'cloudy',
  '阴': 'overcast',
  '小雨': 'light-rain',
  '中雨': 'rain',
  '大雨': 'heavy-rain',
  '雪': 'snow',
  '雾': 'fog'
}

// 天气数据
const weather = ref<WeatherData>({
  temperature: 0,
  city: '正在定位...',
  condition: 'sunny',
  humidity: 0,
  windSpeed: 0
})

// 当前时间和问候语
const currentTime = ref('')
const greeting = ref('')

// 更新时间和问候语
const updateTimeAndGreeting = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const hour = now.getHours()
  if (hour < 6) greeting.value = '夜深了，注意休息哦'
  else if (hour < 9) greeting.value = '早安，开始美好的一天'
  else if (hour < 12) greeting.value = '上午好，写点代码吧'
  else if (hour < 14) greeting.value = '午安，休息一下吧'
  else if (hour < 18) greeting.value = '下午好，来杯咖啡？'
  else if (hour < 22) greeting.value = '晚上好，今天过得如何'
  else greeting.value = '夜深了，注意休息哦'
}

// 获取天气图标
const getWeatherIcon = () => {
  const icons: Record<string, string> = {
    sunny: 'heroicons:sun-solid',
    cloudy: 'heroicons:cloud',
    overcast: 'heroicons:cloud-solid',
    'light-rain': 'heroicons:cloud',
    rain: 'heroicons:cloud',
    'heavy-rain': 'heroicons:cloud',
    snow: 'heroicons:cloud',
    fog: 'heroicons:cloud-solid'
  }
  return icons[weather.value.condition] || icons.sunny
}

// 获取标签样式
const getTagStyle = (tag: string) => {
  const hue = Math.random() * 360
  return {
    backgroundColor: `hsl(${hue}, 70%, 95%)`,
    color: `hsl(${hue}, 70%, 40%)`
  }
}

// 获取天气数据
const fetchWeather = async () => {
  try {
    // 1. 先获取地理位置
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject)
    })

    const { latitude, longitude } = position.coords
    const config = useRuntimeConfig()

    // 2. 先通过经纬度获取地理编码
    const geocodeResponse = await fetch(
      `https://restapi.amap.com/v3/geocode/regeo?key=${config.public.weatherApiKey}&location=${longitude},${latitude}`
    )
    const geocodeData = await geocodeResponse.json()

    if (geocodeData.status !== '1') {
      throw new Error('获取地理编码失败')
    }

    const adcode = geocodeData.regeocode?.addressComponent?.adcode
    if (!adcode) {
      throw new Error('无法获取城市编码')
    }

    // 3. 调用高德地图天气 API
    const response = await fetch(
      `https://restapi.amap.com/v3/weather/weatherInfo?key=${config.public.weatherApiKey}&city=${adcode}&extensions=base`
    )
    const data = await response.json()

    if (data.status === '1' && data.lives?.[0]) {
      const weatherInfo = data.lives[0]
      weather.value = {
        temperature: Number(weatherInfo.temperature),
        city: weatherInfo.city,
        condition: weatherConditionMap[weatherInfo.weather] || 'sunny',
        humidity: Number(weatherInfo.humidity),
        windSpeed: Number(weatherInfo.windpower)
      }
    }
  } catch (error) {
    console.error('获取天气信息失败:', error)
    // 设置默认值
    weather.value = {
      temperature: 25,
      city: '定位失败',
      condition: 'sunny',
      humidity: 50,
      windSpeed: 3
    }
  }
}

// 定时更新时间和天气
let timeInterval: NodeJS.Timer
onMounted(() => {
  updateTimeAndGreeting()
  timeInterval = setInterval(updateTimeAndGreeting, 60000)

  // 获取并定时更新天气
  fetchWeather()
  setInterval(fetchWeather, 1800000) // 每30分钟更新一次天气
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})

// 特殊日期检查
const isSpecialDate = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const date = now.getDate()

  // 程序员节
  if (month === 10 && date === 24) return true
  // 元旦
  if (month === 1 && date === 1) return true
  // 春节
  // ... 添加更多特殊日期

  return false
})

// 特殊日期消息
const specialDateMessage = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const date = now.getDate()

  if (month === 10 && date === 24) return '🎉 程序员节快乐！'
  if (month === 1 && date === 1) return '🎊 新年快乐！'
  return ''
})

// 获取天气动画类名
const getWeatherClass = computed(() => {
  return {
    'weather-sunny': weather.value.condition === 'sunny',
    'weather-cloudy': weather.value.condition === 'cloudy',
    'weather-overcast': weather.value.condition === 'overcast',
    'weather-rain': ['light-rain', 'rain', 'heavy-rain'].includes(weather.value.condition),
    'weather-snow': weather.value.condition === 'snow',
    'weather-fog': weather.value.condition === 'fog'
  }
})

// 处理风速显示
const formatWindSpeed = computed(() => {
  const speed = weather.value.windSpeed
  if (!speed || isNaN(speed)) return '微风'
  return `${speed}级`
})
</script>

<template>
  <div class="blog-layout">
    <!-- 主内容区 -->
    <main class="main-content">
      <section class="posts-list">
        <h2 class="text-2xl font-bold mb-6">最新文章</h2>

        <!-- 骨架屏 -->
        <template v-if="loading">
          <div v-for="n in 5" :key="n" class="post-card mb-3 bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
            <div class="flex p-3 gap-3">
              <div class="flex-1">
                <div class="h-7 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div class="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div class="flex items-center gap-2">
                  <div class="h-4 bg-gray-200 rounded w-20"></div>
                  <div class="h-4 bg-gray-200 rounded w-4"></div>
                  <div class="h-4 bg-gray-200 rounded w-20"></div>
                  <div class="ml-4 flex gap-2">
                    <div class="h-5 bg-gray-200 rounded-full w-12"></div>
                    <div class="h-5 bg-gray-200 rounded-full w-12"></div>
                  </div>
                </div>
              </div>
              <div class="w-32 h-24 bg-gray-200 rounded flex-shrink-0"></div>
            </div>
          </div>
        </template>

        <!-- 文章列表 -->
        <template v-else>
          <article
            v-for="article in filteredArticles"
            :key="article._id"
            class="post-card mb-3 bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            @click="handleClick(article._id)"
          >
            <div class="flex p-3 gap-3">
              <div class="flex-1">
                <h3 class="article-title">
                  {{ article.title }}
                </h3>
                <p class="article-summary line-clamp-1">
                  {{ article.content.replace(/<[^>]+>/g, '').slice(0, 200) }}...
                </p>
                <div class="flex items-center text-sm text-gray-500">
                  <span>{{ formatDate(article.createdAt) }}</span>
                  <span class="mx-2">·</span>
                  <span>{{ article.author.username }}</span>
                  <div class="ml-4 flex gap-2">
                    <span
                      v-for="tag in article.tags"
                      :key="tag"
                      class="px-2 py-0.5 bg-gray-100 rounded-full text-xs"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 右侧封面图 -->
              <div
                v-if="article.cover"
                class="w-32 h-24 flex-shrink-0 overflow-hidden rounded"
              >
                <img
                  :src="article.cover"
                  :alt="article.title"
                  class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </article>
        </template>
      </section>

      <!-- 分页控件 -->
      <div v-if="!loading" class="flex justify-center gap-2 mt-8">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
        >
          上一页
        </button>
        <button
          @click="currentPage++"
          :disabled="currentPage >= pagination.totalPages"
          class="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </main>

    <!-- 侧边栏 -->
    <aside class="sidebar">
      <!-- 骨架屏 -->
      <template v-if="loading">
        <!-- 个人信息卡片骨架屏 -->
        <div class="sidebar-widget profile-card animate-pulse">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-text w-32 h-6 mx-auto mb-2"></div>
          <div class="skeleton-text w-24 h-4 mx-auto mb-2"></div>
          <div class="skeleton-text w-48 h-4 mx-auto mb-4"></div>
          <div class="skeleton-stats">
            <div v-for="i in 3" :key="i" class="skeleton-stat-item">
              <div class="skeleton-text w-8 h-6 mb-1"></div>
              <div class="skeleton-text w-12 h-4"></div>
            </div>
          </div>
        </div>

        <!-- 天气卡片骨架屏 -->
        <div class="sidebar-widget weather-card weather-loading animate-pulse">
          <div class="flex items-center gap-4 mb-4">
            <div class="skeleton-circle w-12 h-12"></div>
            <div class="flex-1">
              <div class="skeleton-text w-20 h-8 mb-2"></div>
              <div class="skeleton-text w-24 h-4"></div>
            </div>
          </div>
          <div class="flex justify-around mb-4">
            <div class="skeleton-text w-20 h-5"></div>
            <div class="skeleton-text w-20 h-5"></div>
          </div>
          <div class="skeleton-text w-32 h-8 mx-auto mb-2"></div>
          <div class="skeleton-text w-40 h-4 mx-auto"></div>
        </div>
      </template>

      <!-- 实际内容 -->
      <template v-else>
        <!-- 个人信息卡片 -->
        <div class="sidebar-widget profile-card">
          <div class="profile-header">
            <div class="avatar-wrapper">
              <img
                :src="userStore.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'"
                :alt="userStore.username"
                class="avatar"
              />
              <div class="avatar-ring"></div>
            </div>
            <h3 class="username">{{ userStore.username || '未登录' }}</h3>
            <p class="role">全栈开发者</p>
            <p class="motto">"代码如诗，编织数字世界的梦想"</p>
          </div>

          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-value">{{ articles.length }}</span>
              <span class="stat-label">文章</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ tags.length }}</span>
              <span class="stat-label">标签</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ totalViews }}</span>
              <span class="stat-label">访问</span>
            </div>
          </div>
        </div>

        <!-- 天气时间卡片 -->
        <div class="sidebar-widget weather-card" :class="getWeatherClass">
          <div class="weather-header">
            <div class="weather-icon">
              <Icon :name="getWeatherIcon()" class="weather-icon-inner" />
              <!-- 天气动画元素 -->
              <div v-if="weather.condition === 'rain'" class="rain-drops"></div>
              <div v-if="weather.condition === 'snow'" class="snow-flakes"></div>
              <div v-if="weather.condition === 'fog'" class="fog-waves"></div>
            </div>
            <div class="weather-info">
              <div class="temperature">{{ weather.temperature }}°C</div>
              <div class="location">{{ weather.city }}</div>
            </div>
          </div>
          <div class="weather-details">
            <div class="detail-item">
              <Icon name="heroicons:beaker" />
              <span>湿度 {{ weather.humidity }}%</span>
            </div>
            <div class="detail-item">
              <Icon name="heroicons:arrow-path" />
              <span>风速 {{ formatWindSpeed }}</span>
            </div>
          </div>
          <div class="time-display">
            <div class="current-time">{{ currentTime }}</div>
            <div class="time-greeting">{{ greeting }}</div>
          </div>

          <!-- 特殊日期彩蛋 -->
          <div v-if="isSpecialDate" class="special-date-banner">
            {{ specialDateMessage }}
            <div class="special-effects"></div>
          </div>
        </div>
      </template>
    </aside>
  </div>
</template>

<style scoped>
.blog-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: minmax(800px, 1fr) 300px;
  gap: 2rem;
}

@media (max-width: 768px) {
  .blog-layout {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .main-content {
    min-width: 100%;
  }
}

.main-content {
  min-width: 0;
  width: 100%;
  max-width: 900px;
}

.sidebar {
  position: sticky;
  top: 2rem;
  height: fit-content;
  width: 300px;
}

.sidebar-widget {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.widget-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f1f1f1;
}

.social-link {
  color: #666;
  transition: color 0.2s;
}

.social-link:hover {
  color: var(--primary-600);
}

.post-card {
  border: 1px solid #eee;
  min-height: 90px;
}

.article-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  line-height: 1.5;
  min-height: 1.875rem;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-summary {
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  line-height: 1.5;
  min-height: 1.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.profile-card {
  position: relative;
  overflow: hidden;
  padding: 2rem 1.5rem;
  text-align: center;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 1rem;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  transition: transform 0.3s;
}

.avatar-ring {
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border: 2px solid var(--c-primary);
  border-radius: 50%;
  animation: rotate 10s linear infinite;
}

.username {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.role {
  color: var(--c-text-light);
  margin-bottom: 0.5rem;
}

.motto {
  font-style: italic;
  color: var(--c-text-lighter);
  margin-bottom: 1.5rem;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 1rem;
  border-top: 1px solid var(--c-border);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--c-primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--c-text-light);
}

.weather-card {
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
  background: linear-gradient(135deg, #7f8c8d 0%, #576574 100%);
  color: white;
  transition: all 0.5s ease;
}

/* 加载状态的天气卡片样式 */
.weather-loading {
  background: linear-gradient(135deg, #7f8c8d 0%, #576574 100%);
  opacity: 0.7;
}

/* 天气主题 - 只在数据加载完成后应用 */
.weather-sunny {
  background: linear-gradient(135deg, #ff9a3c 0%, #ff5f2e 100%);
}

.weather-cloudy {
  background: linear-gradient(135deg, #6b8afd 0%, #4466f2 100%);
}

.weather-overcast {
  background: linear-gradient(135deg, #7f8c8d 0%, #576574 100%);
}

.weather-rain {
  background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
}

.weather-snow {
  background: linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%);
  color: #2c3e50;
}

.weather-fog {
  background: linear-gradient(135deg, #606c88 0%, #3f4c6b 100%);
}

/* 天气动画 */
.rain-drops {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background:
    repeating-linear-gradient(
      transparent 0%,
      rgba(255, 255, 255, 0.3) 90%,
      transparent 100%
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 90%,
      transparent 100%
    );
  background-size: 200% 200%;
  animation: rain 1s linear infinite;
}

.snow-flakes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 50% 50%, white 0%, transparent 10%),
    radial-gradient(circle at 30% 30%, white 0%, transparent 10%),
    radial-gradient(circle at 70% 70%, white 0%, transparent 10%);
  background-size: 20px 20px;
  animation: snow 3s linear infinite;
}

.fog-waves {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  animation: fog 8s linear infinite;
}

@keyframes rain {
  0% { background-position: 0 0; }
  100% { background-position: 20px 20px; }
}

@keyframes snow {
  0% { transform: translateY(0); }
  100% { transform: translateY(20px); }
}

@keyframes fog {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.weather-icon {
  position: relative;
  font-size: 2.5rem;
  transition: transform 0.3s ease;
}

.weather-icon:hover {
  transform: scale(1.1);
}

.weather-icon-inner {
  position: relative;
  z-index: 1;
}

.weather-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.weather-info {
  text-align: center;
}

.temperature {
  font-size: 1.5rem;
  font-weight: 600;
}

.location {
  font-size: 0.875rem;
  opacity: 0.9;
}

.time-display {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.current-time {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.time-greeting {
  font-size: 0.875rem;
  opacity: 0.9;
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-item {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  transition: all 0.3s;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .profile-card {
    padding: 1.5rem 1rem;
  }

  .avatar-wrapper {
    width: 80px;
    height: 80px;
  }

  .weather-card {
    padding: 1rem;
  }
}

.weather-details {
  display: flex;
  justify-content: space-around;
  padding: 1rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.9;
}

.special-date-banner {
  position: relative;
  margin-top: 1rem;
  padding: 0.5rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  overflow: hidden;
  animation: pulse 2s infinite;
}

.special-effects {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    45deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}

/* 深色主题支持 */
:root[class~="dark"] {
  --card-bg: #1a1a1a;
  --card-border: #2a2a2a;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .sidebar {
    position: relative;
    top: 0;
    width: 100%;
  }

  .weather-card {
    margin-top: 1rem;
  }

  .profile-stats {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .stat-item {
    flex: 1;
    min-width: 80px;
  }
}

/* 骨架屏样式 */
.skeleton-avatar {
  width: 100px;
  height: 100px;
  background-color: #e5e7eb;
  border-radius: 50%;
  margin: 0 auto 1rem;
}

.skeleton-text {
  background-color: #e5e7eb;
  border-radius: 0.375rem;
}

.skeleton-circle {
  background-color: #e5e7eb;
  border-radius: 50%;
}

.skeleton-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.skeleton-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 骨架屏动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* 响应式调整 */
@media (max-width: 768px) {
  /* ... 其他响应式样式保持不变 ... */

  .skeleton-avatar {
    width: 80px;
    height: 80px;
  }
}

/* 骨架屏中的文本和图标颜色 */
.weather-loading .skeleton-text,
.weather-loading .skeleton-circle {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 添加过渡效果 */
.weather-card:not(.weather-loading) {
  transition: background 0.5s ease-in-out;
}
</style>
