import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  const hostname = process.env.NODE_ENV === 'production'
    ? 'http://ikchen.top'
    : `http://localhost:${process.env.PORT || 5500}`

  const robotsTxt = `
User-agent: *
Allow: /
Sitemap: ${hostname}/sitemap.xml

Disallow: /admin
Disallow: /api
`.trim()

  event.node.res.setHeader('Content-Type', 'text/plain')
  return robotsTxt
}) 