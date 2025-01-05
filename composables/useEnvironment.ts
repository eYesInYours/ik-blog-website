export const useEnvironment = () => {
  const config = useRuntimeConfig()

  const isDev = computed(() => config.public.env === 'development')
  const isProd = computed(() => config.public.env === 'production')

  const apiBaseUrl = computed(() => config.public.apiBase)

  return {
    isDev,
    isProd,
    apiBaseUrl,
  }
}
