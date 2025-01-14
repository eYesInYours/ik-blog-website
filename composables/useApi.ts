import type { UseFetchOptions } from 'nuxt/app'

export const useApi = () => {
  const nuxtApp = useNuxtApp()
  
  return {
    fetchApi: nuxtApp.$useFetch
  }
}
