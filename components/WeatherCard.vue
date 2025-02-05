<template>
    <!-- 天气卡片 -->
    <template v-if="weatherLoading">
        <!-- 天气卡片骨架屏 -->
        <div class="sidebar-widget weather-card weather-loading animate-pulse">
            <!-- 天气头部 -->
            <div class="weather-header">
                <div class="weather-icon">
                    <div class="skeleton-circle"></div>
                </div>
                <div class="weather-info">
                    <div class="skeleton-text temperature-skeleton"></div>
                    <div class="skeleton-text location-skeleton"></div>
                </div>
            </div>
            
            <!-- 天气详情 -->
            <div class="weather-details">
                <div class="detail-item">
                    <div class="skeleton-text detail-skeleton"></div>
                </div>
                <div class="detail-item">
                    <div class="skeleton-text detail-skeleton"></div>
                </div>
            </div>
            
            <!-- 时间显示 -->
            <div class="time-display">
                <div class="skeleton-text time-skeleton"></div>
                <div class="skeleton-text greeting-skeleton"></div>
            </div>
        </div>
    </template>

    <!-- 错误提示 -->
    <template v-else-if="weatherErrors">
        <div class="sidebar-widget weather-card">
            <div class="text-center py-4 flex flex-col items-center gap-4">
                <Icon name="carbon:warning" class="text-4xl mb-2" />
                <div class="flex flex-col gap-2">
                    <p class="text-sm">{{ weatherErrors }}</p>
                    <p class="text-xs opacity-80">
                        {{ weatherErrors.includes('需要位置权限') ? '请允许访问您的位置以获取天气信息' : '' }}
                    </p>
                </div>
                <button @click="requestLocationPermission"
                    class="px-4 py-2 text-sm bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2">
                    <Icon name="carbon:location" />
                    {{ weatherErrors.includes('需要位置权限') ? '授予位置权限' : '重试' }}
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
                            <UButton @click="openCitySelect" variant="ghost" color="white" icon="i-carbon-location"
                                size="xs" :ui="{ rounded: 'rounded-full' }" class="!text-white hover:!bg-white/10" />
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
                                        <div v-if="currentProvince || currentCity"
                                            class="text-sm text-gray-500 flex items-center gap-1">
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
                                    <UButton color="gray" variant="ghost" icon="i-carbon-close" size="xs"
                                        class="!text-gray-500 hover:!bg-gray-100 mr-6"
                                        @click="citySelectModal = false" />
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
                                        class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 auto-rows-fr">
                                        <UButton v-for="province in provinces" :key="province.adcode" variant="soft"
                                            size="sm" color="gray"
                                            class="min-h-[36px] px-2 py-1.5 text-center flex items-center justify-center hover:bg-gray-100"
                                            @click="handleProvinceSelect(province)">
                                            <span class="truncate">{{ province.name }}</span>
                                        </UButton>
                                    </div>
                                    <!-- 城市选择 -->
                                    <div v-else-if="!currentCity">
                                        <div class="flex items-center gap-2 mb-4">
                                            <UButton variant="link" @click="currentProvince = null"
                                                icon="i-carbon-arrow-left"
                                                class="text-gray-500 hover:text-gray-700 text-sm">
                                                返回省份选择
                                            </UButton>
                                        </div>
                                        <div
                                            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 auto-rows-fr">
                                            <UButton v-for="city in cities" :key="city.adcode" variant="soft" size="sm"
                                                color="gray"
                                                class="min-h-[36px] px-2 py-1.5 text-center flex items-center justify-center hover:bg-gray-100"
                                                @click="handleCitySelect(city)">
                                                <span class="truncate">{{ city.name }}</span>
                                            </UButton>
                                        </div>
                                    </div>
                                    <!-- 辖区选择 -->
                                    <div v-else>
                                        <div class="flex items-center gap-2 mb-4">
                                            <UButton variant="link" @click="currentCity = null"
                                                icon="i-carbon-arrow-left"
                                                class="text-gray-500 hover:text-gray-700 text-sm">
                                                返回城市选择
                                            </UButton>
                                        </div>
                                        <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                            <UButton v-for="district in districts" :key="district.adcode" variant="soft"
                                                size="sm" color="gray"
                                                class="h-9 px-3 text-center whitespace-nowrap overflow-hidden text-ellipsis hover:bg-gray-100"
                                                @click="handleDistrictSelect(district)">
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
</template>

<script lang="ts" setup>

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

let weatherLoading = ref(true)
let weatherErrors = ref('')
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
        weatherLoading.value = true
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
        weatherErrors.value = '获取天气数据失败'
    } finally {
        weatherLoading.value = false
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
                weatherLoading.value = false
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
        weatherErrors.value = '您的浏览器不支持地理位置功能'
        return
    }

    // 先重置错误状态
    weatherErrors.value = null
    weatherLoading.value = true

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
            weatherLoading.value = false
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    weatherErrors.value = '获取地理位置失败：请在浏览器设置中允许访问位置信息'
                    break
                case error.POSITION_UNAVAILABLE:
                    weatherErrors.value = '获取地理位置失败：位置信息不可用'
                    break
                case error.TIMEOUT:
                    weatherErrors.value = '获取地理位置失败：请求超时'
                    break
                default:
                    weatherErrors.value = '获取地理位置失败'
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
        weatherErrors.value = '获取天气数据失败'
    } finally {
        weatherLoading.value = false
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
            weatherLoading.value = false
            return
        }
    }

    // 无缓存或缓存已过期，设置加载状态并获取新数据
    weatherLoading.value = true
    try {
        weatherErrors.value = null
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
        weatherErrors.value = '获取天气数据失败'
    } finally {
        weatherLoading.value = false
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

<style>
.sidebar-widget {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  background: linear-gradient(to right bottom, #4facfe 0%, #00f2fe 100%);
  min-height: 240px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem;
  border-radius: 0.5rem;
  opacity: 0.8;
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

  .skeleton-circle {
    width: 2.5rem;
    height: 2.5rem;
  }

  .temperature-skeleton {
    height: 1.75rem;
    width: 4rem;
  }

  .time-skeleton {
    height: 2rem;
    width: 7rem;
  }

  .greeting-skeleton {
    width: 8rem;
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

/* 骨架屏中的文本和图标颜色 */
.weather-loading .skeleton-text,
.weather-loading .skeleton-circle {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 添加过渡效果 */
.weather-card:not(.weather-loading) {
  transition: background 0.5s ease-in-out;
}

/* 骨架屏样式优化 */
.skeleton-text,
.skeleton-circle {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  position: relative;
  overflow: hidden;
}

/* 骨架屏闪光动画 */
.skeleton-text::after,
.skeleton-circle::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 具体元素尺寸 */
.skeleton-circle {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
}

.temperature-skeleton {
  height: 2rem;
  width: 5rem;
  margin-bottom: 0.5rem;
}

.location-skeleton {
  height: 1.25rem;
  width: 6rem;
}

.detail-skeleton {
  height: 1.25rem;
  width: 5rem;
}

.time-skeleton {
  height: 2.25rem;
  width: 8rem;
  margin: 0 auto 0.5rem;
}

.greeting-skeleton {
  height: 1.25rem;
  width: 10rem;
  margin: 0 auto;
}
</style>