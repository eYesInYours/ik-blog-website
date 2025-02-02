import { SitemapStream, streamToPromise } from 'sitemap'
import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const hostname = process.env.NODE_ENV === 'production'
      ? 'http://ikchen.top'
      : `http://localhost:${process.env.PORT || 5500}`

    // API 基础路径
    const apiBase = process.env.NODE_ENV === 'production'
      ? 'http://ikchen.top:5000'  // 生产环境 API 地址
      : 'http://localhost:5000'    // 开发环境 API 地址

    // 初始化 sitemap stream
    const sitemap = new SitemapStream({
      hostname
    })

    // 添加静态路由
    sitemap.write({
      url: '/',
      changefreq: 'daily',
      priority: 1
    })

    try {
      // 获取所有文章
      const response = await fetch(`${apiBase}/api/articles?limit=1000&page=1`)
      const { data } = await response.json()

      // 添加文章路由
      if (data && data.articles) {
        data.articles.forEach((article: any) => {
          sitemap.write({
            url: `/articles/${article._id}`,
            lastmod: article.updatedAt,
            changefreq: 'weekly',
            priority: 0.8
          })
        })
      }
    } catch (error) {
      console.error('获取文章列表失败:', error)
      // 即使获取文章失败，也继续生成其他页面的站点地图
    }

    // 添加其他页面
    sitemap.write({
      url: '/about',
      changefreq: 'monthly',
      priority: 0.5
    })

    sitemap.end()

    // 生成 xml
    const xml = await streamToPromise(sitemap)

    // 设置响应头
    event.node.res.setHeader('Content-Type', 'application/xml')
    return xml.toString()
  } catch (error) {
    console.error('生成站点地图时出错:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : '生成站点地图失败'
    })
  }
}) 