export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig()
    console.log('config', config)
    const userStore = useUserStore()
    const defaultOptions = {
        baseURL: config.public.apiBase,
        headers: {
            Authorization: `Bearer ${userStore.token}`,
        }
    }

    return {
        provide: {
            useFetch: (url: string, options: any) => {
                const finalOptions = Object.assign({}, defaultOptions, options)
                console.log('url', config.public.apiBase + url)
                return useFetch(url, {
                    baseURL: config.public.apiBase + url,
                    ...finalOptions,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
            }
        }
    }
})
