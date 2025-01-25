<script lang="ts" setup>
const { awesome } = useAppConfig()
const { $request } = useNuxtApp()
definePageMeta({ layout: 'page' })
useHead({ titleTemplate: '', title: awesome?.name || '我的技术博客' })

const notificationStore = useNotificationStore()
const route = useRoute()

interface Author {
  _id: string
  username: string
  avatar: string
  intro: string
  joinTime: string
  stats: {
    articles: number
    tags: number
    views: number
  }
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

// 统一的加载状态管理
const loadingStates = reactive({
  articles: true,
  author: true,
  weather: true
})

// 统一的错误状态管理
const errors = reactive({
  articles: null as string | null,
  author: null as string | null,
  weather: null as string | null
})

// 计算总体加载状态
const isLoading = computed(() => {
  return Object.values(loadingStates).some(state => state)
})

// 作者信息
const author = ref<Author | null>(null)
const config = useRuntimeConfig()

// 获取作者信息
const fetchAuthor = async () => {
  try {
    loadingStates.author = true
    errors.author = null
    const { data, error } = await $request.get('/users/author')
    if (error.value) throw error.value
    author.value = data.value
  } catch (error) {
    console.error('获取作者信息失败:', error)
    errors.author = error.message || '获取作者信息失败'
  } finally {
    loadingStates.author = false
  }
}

// 获取文章列表
const fetchArticles = async (page = 1) => {
  try {
    loadingStates.articles = true
    errors.articles = null
    const { data, error } = await $request.get('/articles', {
        page,
      limit: pagination.value.limit
    })
    if (error.value) throw error.value
    articles.value = data.value.articles
    pagination.value = data.value.pagination
  } catch (error) {
    console.error('获取文章列表失败:', error)
    errors.articles = error.message || '获取文章列表失败'
  } finally {
    loadingStates.articles = false
  }
}

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

// 城市选择相关
interface District {
  name: string
  adcode: string
  level: string
  districts?: District[]
}

const showCitySelect = ref(false)
const selectedCity = ref<District | null>(null)
const provinces = ref<District[]>([])
const cities = ref<District[]>([])
const districts = ref<District[]>([])
const currentProvince = ref<District | null>(null)
const currentCity = ref<District | null>(null)
const loadingCities = ref(false)
const citySelectModal = ref(false)

// 打开城市选择弹窗
const openCitySelect = () => {
  citySelectModal.value = true
  // 重置选择状态
  currentProvince.value = null
  currentCity.value = null
  cities.value = []
  districts.value = []
  // 获取省份列表
  if (!provinces.value.length) {
    fetchProvinces()
  }
}

// 获取省份列表
const fetchProvinces = async () => {
  try {
    loadingCities.value = true
    const config = useRuntimeConfig()
    const response = await fetch(
      `https://restapi.amap.com/v3/config/district?keywords=中国&subdistrict=1&key=${config.public.weatherApiKey}`
    )
    const data = await response.json()
    if (data.status === '1' && data.districts?.[0]?.districts) {
      provinces.value = data.districts[0].districts
    }
  } catch (error) {
    console.error('获取城市列表失败:', error)
  } finally {
    loadingCities.value = false
  }
}

// 获取城市列表
const fetchCities = async (provinceCode: string) => {
  try {
    loadingCities.value = true
    const config = useRuntimeConfig()
    const response = await fetch(
      `https://restapi.amap.com/v3/config/district?keywords=${provinceCode}&subdistrict=1&key=${config.public.weatherApiKey}`
    )
    const data = await response.json()
    if (data.status === '1' && data.districts?.[0]?.districts) {
      cities.value = data.districts[0].districts
    }
  } catch (error) {
    console.error('获取城市列表失败:', error)
  } finally {
    loadingCities.value = false
  }
}

// 获取辖区列表
const fetchDistricts = async (cityCode: string) => {
  try {
    loadingCities.value = true
    const config = useRuntimeConfig()
    const response = await fetch(
      `https://restapi.amap.com/v3/config/district?keywords=${cityCode}&subdistrict=1&key=${config.public.weatherApiKey}`
    )
    const data = await response.json()
    if (data.status === '1' && data.districts?.[0]?.districts) {
      districts.value = data.districts[0].districts
    }
  } catch (error) {
    console.error('获取辖区列表失败:', error)
  } finally {
    loadingCities.value = false
  }
}

// 处理省份选择
const handleProvinceSelect = async (province: District) => {
  currentProvince.value = province
  currentCity.value = null
  cities.value = []
  districts.value = []
  await fetchCities(province.adcode)
}

// 处理城市选择
const handleCitySelect = async (city: District) => {
  currentCity.value = city
  districts.value = []
  await fetchDistricts(city.adcode)
}

// 处理辖区选择
const handleDistrictSelect = async (district: District) => {
  citySelectModal.value = false
  try {
    loadingStates.weather = true
    const config = useRuntimeConfig()
    const response = await fetch(
      `https://restapi.amap.com/v3/weather/weatherInfo?key=${config.public.weatherApiKey}&city=${district.adcode}&extensions=base`
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
      localStorage.setItem('weather-data', JSON.stringify(weather.value))
      localStorage.setItem('weather-cache-time', String(Date.now()))
    }
  } catch (error) {
    console.error('获取天气数据失败:', error)
    errors.weather = '获取天气数据失败'
  } finally {
    loadingStates.weather = false
  }
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

// 天气背景图片映射
const weatherBgMap: Record<string, string> = {
  sunny: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?q=80&w=1000',
  cloudy: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1000',
  overcast: 'https://images.unsplash.com/photo-1483977399921-6cf94f6fdc3a?q=80&w=1000',
  'light-rain': 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?q=80&w=1000',
  rain: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?q=80&w=1000',
  'heavy-rain': 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?q=80&w=1000',
  snow: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?q=80&w=1000',
  fog: 'https://images.unsplash.com/photo-1487621167305-5d248087c724?q=80&w=1000'
}

// 天气数据
const weather = ref<WeatherData>({
  temperature: 0,
  city: '正在定位...',
  condition: 'sunny',
  humidity: 0,
  windSpeed: 0
})

// 切换城市选择器
const toggleCitySelect = () => {
  showCitySelect.value = !showCitySelect.value
  if (showCitySelect.value && !provinces.value.length) {
    fetchProvinces()
  }
}

// 从缓存加载天气数据
const loadCachedWeather = () => {
  const cached = localStorage.getItem('weather-data')
  if (cached) {
    try {
      const data = JSON.parse(cached)
      const cacheTime = localStorage.getItem('weather-cache-time')
      // 如果缓存时间小于30分钟,使用缓存数据
      if (cacheTime && Date.now() - Number(cacheTime) < 30 * 60 * 1000) {
        weather.value = data
        loadingStates.weather = false
        return true
      }
    } catch (e) {
      console.error('解析缓存天气数据失败:', e)
    }
  }
  return false
}

// 获取天气数据
// 检查地理位置权限
const checkLocationPermission = async () => {
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state
  } catch (error) {
    console.error('检查地理位置权限失败:', error)
    return 'denied'
  }
}

// 请求地理位置权限
const requestLocationPermission = () => {
  if (!navigator.geolocation) {
    errors.weather = '您的浏览器不支持地理位置功能'
    return
  }

  // 先重置错误状态
  errors.weather = null
  loadingStates.weather = true

  // 使用 getCurrentPosition 会触发浏览器的权限请求
  navigator.geolocation.getCurrentPosition(
    (position) => {
      // 用户同意后，直接使用获取到的位置信息
    const { latitude, longitude } = position.coords
      // 调用天气 API
      getWeatherByLocation(latitude, longitude)
    },
    (error) => {
      console.error('获取地理位置失败:', error)
      loadingStates.weather = false
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errors.weather = '获取地理位置失败：请在浏览器设置中允许访问位置信息'
          break
        case error.POSITION_UNAVAILABLE:
          errors.weather = '获取地理位置失败：位置信息不可用'
          break
        case error.TIMEOUT:
          errors.weather = '获取地理位置失败：请求超时'
          break
        default:
          errors.weather = '获取地理位置失败'
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}

// 根据位置获取天气信息
const getWeatherByLocation = async (latitude: number, longitude: number) => {
  try {
    const config = useRuntimeConfig()

    // 获取地理编码
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

    // 获取天气数据
    const weatherResponse = await fetch(
      `https://restapi.amap.com/v3/weather/weatherInfo?key=${config.public.weatherApiKey}&city=${adcode}&extensions=base`
    )
    const weatherData = await weatherResponse.json()

    if (weatherData.status === '1' && weatherData.lives?.[0]) {
      const weatherInfo = weatherData.lives[0]
      weather.value = {
        temperature: Number(weatherInfo.temperature),
        city: weatherInfo.city,
        condition: weatherConditionMap[weatherInfo.weather] || 'sunny',
        humidity: Number(weatherInfo.humidity),
        windSpeed: Number(weatherInfo.windpower)
      }
      // 更新缓存
      localStorage.setItem('weather-data', JSON.stringify(weather.value))
      localStorage.setItem('weather-cache-time', String(Date.now()))
    }
  } catch (error) {
    console.error('获取天气数据失败:', error)
    errors.weather = '获取天气数据失败'
  } finally {
    loadingStates.weather = false
  }
}

// 获取天气数据
const fetchWeather = async () => {
  // 先检查缓存
  const cachedData = localStorage.getItem('weather-data')
  const cacheTime = localStorage.getItem('weather-cache-time')

  // 如果有缓存且未过期（30分钟内），直接使用缓存数据
  if (cachedData && cacheTime) {
    const now = Date.now()
    const cacheAge = now - Number(cacheTime)
    if (cacheAge < 30 * 60 * 1000) { // 30分钟
      weather.value = JSON.parse(cachedData)
      loadingStates.weather = false
      return
    }
  }

  // 无缓存或缓存已过期，设置加载状态并获取新数据
  loadingStates.weather = true
  try {
    errors.weather = null
    const config = useRuntimeConfig()
    const response = await fetch(
      `https://restapi.amap.com/v3/weather/weatherInfo?key=${config.public.weatherApiKey}&city=430100&extensions=base`
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
      // 更新缓存
      localStorage.setItem('weather-data', JSON.stringify(weather.value))
      localStorage.setItem('weather-cache-time', String(Date.now()))
    }
  } catch (error) {
    console.error('获取天气数据失败:', error)
    errors.weather = '获取天气数据失败'
  } finally {
    loadingStates.weather = false
  }
}

// 定时更新时间和天气
let timeInterval: NodeJS.Timer
onMounted(() => {
  updateTimeAndGreeting()
  timeInterval = setInterval(updateTimeAndGreeting, 60000)

  // 获取并定时更新天气
  // 先尝试加载缓存数据
  if (!loadCachedWeather()) {
  fetchWeather()
  }
  setInterval(fetchWeather, 1800000) // 每30分钟更新一次天气
})

// 初始化
fetchAuthor()
fetchArticles()


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
  const condition = weather.value.condition
  return {
    'weather-bg': true,
    [`weather-${condition}`]: true
  }
})

// 获取图标颜色
const getIconColor = computed(() => {
  return 'white'  // 使用白色图标，因为背景都是深色的
})

// 处理风速显示
const formatWindSpeed = computed(() => {
  const speed = weather.value.windSpeed
  if (!speed || isNaN(speed)) return '微风'
  return `${speed}级`
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
</script>

<template>
  <div class="blog-layout">
    <!-- 主内容区 -->
    <main class="main-content">
      <section class="posts-list">
        <h2 class="text-2xl font-bold mb-6">最新文章</h2>

        <!-- 骨架屏 -->
        <template v-if="loadingStates.articles">
          <div v-for="n in 5" :key="n"
            class="post-card mb-3 bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
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

        <!-- 错误提示 -->
        <template v-else-if="errors.articles">
          <div class="text-center py-8 text-gray-500">
            <Icon name="carbon:warning" class="text-4xl mb-2" />
            <p>{{ errors.articles }}</p>
            <button @click="fetchArticles"
              class="mt-4 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg">
              重试
            </button>
          </div>
        </template>

        <!-- 文章列表 -->
        <template v-else>
          <!-- 无文章时的空状态 -->
          <template v-if="articles.length === 0">
            <div class="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Icon name="carbon:document-blank" class="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
              <h3 class="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">暂无文章</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                作者正在创作中，敬请期待...
              </p>
            </div>
          </template>

          <!-- 有文章时显示列表 -->
          <template v-else>
            <article v-for="article in filteredArticles" :key="article._id"
            class="post-card mb-3 bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              @click="handleClick(article._id)">
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
                      <span v-for="tag in article.tags" :key="tag" class="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 右侧封面图 -->
                <div v-if="article.cover" class="w-32 h-24 flex-shrink-0 overflow-hidden rounded">
                  <img :src="article.cover" :alt="article.title"
                    class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            </div>
          </article>
          </template>
        </template>
      </section>

      <!-- 分页控件 -->
      <div v-if="!loadingStates.articles && articles.length" class="flex justify-center gap-2 mt-8">
        <button @click="currentPage--" :disabled="currentPage === 1"
          class="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50">
          上一页
        </button>
        <button @click="currentPage++" :disabled="currentPage >= pagination.totalPages"
          class="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50">
          下一页
        </button>
      </div>
    </main>

    <!-- 侧边栏 -->
    <aside class="sidebar">
        <!-- 个人信息卡片骨架屏 -->
      <template v-if="loadingStates.author">
        <div class="sidebar-widget profile-card animate-pulse">
          <div class="profile-header">
            <div class="w-[100px] h-[100px] rounded-full bg-gray-200"></div>
            <div class="flex flex-col items-center gap-2">
              <div class="skeleton-text w-40 h-[28px]"></div>
              <!-- <div class="skeleton-text w-32 h-[20px]"></div> -->
              <div class="skeleton-text w-64 h-[20px]"></div>
            </div>
          </div>
          <div class="skeleton-stats">
            <div v-for="i in 3" :key="i" class="skeleton-stat-item">
              <div class="skeleton-text w-12 h-[28px]"></div>
              <div class="skeleton-text w-16 h-[20px]"></div>
            </div>
          </div>
        </div>
      </template>

      <!-- 错误提示 -->
      <template v-else-if="errors.author">
        <div class="sidebar-widget profile-card">
          <div class="text-center py-4 text-gray-500">
            <Icon name="carbon:warning" class="text-4xl mb-2" />
            <p>{{ errors.author }}</p>
            <button @click="fetchAuthor" class="mt-4 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg">
              重试
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="sidebar-widget profile-card">
          <div class="profile-header">
            <img :src="author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'"
              :alt="author?.username" class="w-[100px] h-[100px] rounded-full object-cover" />
            <div class="flex flex-col items-center gap-2">
              <h3 class="text-xl font-medium h-[28px] leading-[28px]">{{ author?.username || '未登录' }}</h3>
              <!-- <p class="text-sm text-gray-600 h-[20px] leading-[20px]">全栈开发者</p> -->
              <p class="text-sm text-gray-500 text-center leading-[20px] line-clamp-2">
                {{ author?.intro || '"代码如诗，编织数字世界的梦想"' }}
              </p>
            </div>
          </div>

          <div class="profile-stats">
            <div class="stat-item">
              <span class="text-xl font-medium h-[28px] leading-[28px]">{{ author?.stats.articles || 0 }}</span>
              <span class="text-sm text-gray-500 h-[20px] leading-[20px]">文章</span>
            </div>
            <div class="stat-item">
              <span class="text-xl font-medium h-[28px] leading-[28px]">{{ author?.stats.tags || 0 }}</span>
              <span class="text-sm text-gray-500 h-[20px] leading-[20px]">标签</span>
            </div>
            <div class="stat-item">
              <span class="text-xl font-medium h-[28px] leading-[28px]">{{ author?.stats.views || 0 }}</span>
              <span class="text-sm text-gray-500 h-[20px] leading-[20px]">访问</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 天气卡片 -->
      <template v-if="loadingStates.weather">
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

      <!-- 错误提示 -->
      <template v-else-if="errors.weather">
        <div class="sidebar-widget weather-card">
          <div class="text-center py-4 flex flex-col items-center gap-4">
            <Icon name="carbon:warning" class="text-4xl mb-2" />
            <div class="flex flex-col gap-2">
              <p class="text-sm">{{ errors.weather }}</p>
              <p class="text-xs opacity-80">
                {{ errors.weather.includes('需要位置权限') ? '请允许访问您的位置以获取天气信息' : '' }}
              </p>
            </div>
            <button
              @click="requestLocationPermission"
              class="px-4 py-2 text-sm bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2"
            >
              <Icon name="carbon:location" />
              {{ errors.weather.includes('需要位置权限') ? '授予位置权限' : '重试' }}
            </button>
          </div>
            </div>
      </template>

      <template v-else>
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
              <div class="location flex items-center gap-2">
                <span>{{ weather.city }}</span>
                <UPopover :popper="{ placement: 'right' }">
                  <UButton
                    @click="openCitySelect"
                    variant="ghost"
                    color="white"
                    icon="i-carbon-location"
                    size="xs"
                    :ui="{ rounded: 'rounded-full' }"
                    class="!text-white hover:!bg-white/10"
                  />
                  <template #content>
                    <div class="text-sm p-2 text-gray-700">
                      点击切换城市
                    </div>
                  </template>
                </UPopover>
              </div>

              <!-- 城市选择弹窗 -->
              <UModal v-model="citySelectModal">
                <UCard :ui="{
                  base: 'w-[90vw] max-w-[800px]',
                  body: 'p-0',
                  header: 'px-6 py-4 border-b bg-gray-50'
                }">
                  <template #header>
                    <div class="flex items-center justify-between h-[50px]">
                      <div class="flex items-center gap-2">
                        <h3 class="text-base font-medium text-gray-700 ml-6">选择地区</h3>
                        <div v-if="currentProvince || currentCity" class="text-sm text-gray-500 flex items-center gap-1">
                          <Icon name="i-carbon-chevron-right" class="w-4 h-4" />
                          <template v-if="currentProvince">
                            {{ currentProvince.name }}
                            <template v-if="currentCity">
                              <Icon name="i-carbon-chevron-right" class="w-4 h-4" />
                              {{ currentCity.name }}
                            </template>
                          </template>
                        </div>
                      </div>
                      <UButton
                        color="gray"
                        variant="ghost"
                        icon="i-carbon-close"
                        size="xs"
                        class="!text-gray-500 hover:!bg-gray-100 mr-6"
                        @click="citySelectModal = false"
                      />
                    </div>
                  </template>

                  <div class="min-h-[400px] p-6 bg-gray-50/50">
                    <template v-if="loadingCities">
                      <div class="flex items-center justify-center h-[200px]">
                        <ULoading />
                      </div>
                    </template>
                    <template v-else>
                      <!-- 省份选择 -->
                      <div v-if="!currentProvince"
                        class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 auto-rows-fr"
                      >
                        <UButton
                          v-for="province in provinces"
                          :key="province.adcode"
                          variant="soft"
                          size="sm"
                          color="gray"
                          class="min-h-[36px] px-2 py-1.5 text-center flex items-center justify-center hover:bg-gray-100"
                          @click="handleProvinceSelect(province)"
                        >
                          <span class="truncate">{{ province.name }}</span>
                        </UButton>
                      </div>
                      <!-- 城市选择 -->
                      <div v-else-if="!currentCity">
                        <div class="flex items-center gap-2 mb-4">
                          <UButton
                            variant="link"
                            @click="currentProvince = null"
                            icon="i-carbon-arrow-left"
                            class="text-gray-500 hover:text-gray-700 text-sm"
                          >
                            返回省份选择
                          </UButton>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 auto-rows-fr">
                          <UButton
                            v-for="city in cities"
                            :key="city.adcode"
                            variant="soft"
                            size="sm"
                            color="gray"
                            class="min-h-[36px] px-2 py-1.5 text-center flex items-center justify-center hover:bg-gray-100"
                            @click="handleCitySelect(city)"
                          >
                            <span class="truncate">{{ city.name }}</span>
                          </UButton>
                        </div>
                      </div>
                      <!-- 辖区选择 -->
                      <div v-else>
                        <div class="flex items-center gap-2 mb-4">
                          <UButton
                            variant="link"
                            @click="currentCity = null"
                            icon="i-carbon-arrow-left"
                            class="text-gray-500 hover:text-gray-700 text-sm"
                          >
                            返回城市选择
                          </UButton>
                        </div>
                        <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                          <UButton
                            v-for="district in districts"
                            :key="district.adcode"
                            variant="soft"
                            size="sm"
                            color="gray"
                            class="h-9 px-3 text-center whitespace-nowrap overflow-hidden text-ellipsis hover:bg-gray-100"
                            @click="handleDistrictSelect(district)"
                          >
                            {{ district.name }}
                          </UButton>
                        </div>
                      </div>
                    </template>
                  </div>
                </UCard>
              </UModal>
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

  0%,
  100% {
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
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6;
  min-height: 360px;
  display: flex;
  flex-direction: column;
}

.profile-card .skeleton-avatar,
.profile-card img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto;
}

.profile-header,
.profile-card.animate-pulse {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 0;
}

.profile-stats,
.skeleton-stats {
  width: 100%;
  padding-top: 1.5rem;
  margin-top: auto;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-around;
}

.stat-item,
.skeleton-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 60px;
}

.username,
.skeleton-text {
  @apply font-medium;
}

.weather-card {
  position: relative;
  overflow: hidden;
  padding: 1.5rem;
  color: white;
  transition: all 0.5s ease;
}

/* 天气背景基础样式 */
.weather-bg {
  position: relative;
  z-index: 1;
}

.weather-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.8;
  z-index: -1;
  transition: opacity 0.3s ease;
}

/* 天气背景图片 */
.weather-sunny::before {
  background-image: url('https://images.unsplash.com/photo-1592210454359-9043f067919b?q=80&w=1000');
  background-color: rgba(255, 154, 60, 0.8);
}

.weather-cloudy::before {
  background-image: url('https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1000');
  background-color: rgba(107, 138, 253, 0.8);
}

.weather-overcast::before {
  background-image: url('https://images.unsplash.com/photo-1483977399921-6cf94f6fdc3a?q=80&w=1000');
  background-color: rgba(127, 140, 141, 0.8);
}

.weather-light-rain::before,
.weather-rain::before,
.weather-heavy-rain::before {
  background-image: url('https://images.unsplash.com/photo-1519692933481-e162a57d6721?q=80&w=1000');
  background-color: rgba(75, 108, 183, 0.8);
}

.weather-snow::before {
  background-image: url('https://images.unsplash.com/photo-1491002052546-bf38f186af56?q=80&w=1000');
  background-color: rgba(142, 158, 171, 0.8);
}

.weather-fog::before {
  background-image: url('https://images.unsplash.com/photo-1487621167305-5d248087c724?q=80&w=1000');
  background-color: rgba(96, 108, 136, 0.8);
}

/* 添加暗色叠加层，确保文字可读性 */
.weather-bg::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4));
  z-index: -1;
}

/* 鼠标悬停时减少暗色叠加效果 */
.weather-bg:hover::after {
  background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2));
}

/* 加载状态的天气卡片样式 */
.weather-loading {
  background: linear-gradient(135deg, #7f8c8d 0%, #576574 100%);
  opacity: 0.7;
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
    repeating-linear-gradient(transparent 0%,
      rgba(255, 255, 255, 0.3) 90%,
      transparent 100%),
    repeating-linear-gradient(90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 90%,
      transparent 100%);
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
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
      transparent 100%);
  animation: fog 8s linear infinite;
}

@keyframes rain {
  0% {
    background-position: 0 0;
  }

  100% {
    background-position: 20px 20px;
  }
}

@keyframes snow {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(20px);
  }
}

@keyframes fog {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
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
    min-height: 320px;
    padding: 1rem;
  }

  .profile-card .skeleton-avatar,
  .profile-card img {
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
  background: linear-gradient(45deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
      transparent 100%);
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
  margin: 0 auto;
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
  padding-top: 1.5rem;
  margin-top: auto;
  border-top: 1px solid #e5e7eb;
}

.skeleton-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* 骨架屏动画 */
@keyframes pulse {

  0%,
  100% {
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

/* 修改骨架屏样式 */
.avatar-wrapper {
  width: 100px;
  height: 100px;
  margin: 0 auto;
}

.skeleton-avatar {
  width: 100%;
  height: 100%;
  background-color: #e5e7eb;
  border-radius: 50%;
}

.profile-card {
  padding: 2rem 1.5rem;
  min-height: 360px;
}

.skeleton-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.skeleton-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .avatar-wrapper {
    width: 80px;
    height: 80px;
  }

  .profile-card {
    min-height: 320px;
  }
}

/* 统一卡片基础样式 */
.sidebar-widget.profile-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6;
  min-height: 360px;
  display: flex;
  flex-direction: column;
}

/* 统一头像样式 */
.profile-card .skeleton-avatar,
.profile-card img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto;
}

/* 统一内容布局 */
.profile-header,
.profile-card.animate-pulse {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 0;
}

/* 统一底部统计样式 */
.profile-stats,
.skeleton-stats {
  width: 100%;
  padding-top: 1.5rem;
  margin-top: auto;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-around;
}

.stat-item,
.skeleton-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 60px;
}

/* 统一文本样式 */
.username,
.skeleton-text {
  @apply font-medium;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .sidebar-widget.profile-card {
    min-height: 320px;
    padding: 1rem;
  }

  .profile-card .skeleton-avatar,
  .profile-card img {
    width: 80px;
    height: 80px;
  }
}

/* 城市选择面板样式 */
.city-select-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.city-list {
  padding: 0.5rem;
}

.city-item {
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0.25rem;
}

.city-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.location {
  position: relative;
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
