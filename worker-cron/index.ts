export default {
  async scheduled(event, env, ctx) {
    const pagesUrl = env.PAGES_URL || 'https://jdcf-ban-list.pages.dev'
    const secret = env.CRON_ARCHIVE_SECRET
    const resp = await fetch(`${pagesUrl}/api/cron/archive`, {
      method: 'POST',
      headers: { 'X-Cron-Secret': secret },
    })
    const result = await resp.json()
    console.log('Archive result:', JSON.stringify(result))
  },
}
