export default {
  async scheduled(event, env, ctx) {
    const pagesUrl = env.PAGES_URL || 'https://jdcf-ban-list.pages.dev'

    // Archive expired bans
    const archiveSecret = env.CRON_ARCHIVE_SECRET
    if (archiveSecret) {
      const resp = await fetch(`${pagesUrl}/api/cron/archive`, {
        method: 'POST',
        headers: { 'X-Cron-Secret': archiveSecret },
      })
      const result = await resp.json()
      console.log('Archive result:', JSON.stringify(result))
    }

    // Publish scheduled announcements
    const publishSecret = env.CRON_PUBLISH_SECRET
    if (publishSecret) {
      const resp = await fetch(`${pagesUrl}/api/cron/publish-announcements`, {
        headers: { 'X-Cron-Secret': publishSecret },
      })
      const result = await resp.json()
      console.log('Publish result:', JSON.stringify(result))
    }
  },
}
