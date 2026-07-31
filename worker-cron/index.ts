export default {
  async scheduled(event, env, ctx) {
    const pagesUrl = env.PAGES_URL || 'https://xn--ket899d.xn--c5w01e.vip'

    // TODO: 当前 Pages 未提供 /api/cron/archive；恢复自动归档前需补回接口或移除此请求。
    // * 归档已过期的封禁记录
    const archiveSecret = env.CRON_ARCHIVE_SECRET
    if (archiveSecret) {
      const resp = await fetch(`${pagesUrl}/api/cron/archive`, {
        method: 'POST',
        headers: { 'X-Cron-Secret': archiveSecret },
      })
      const result = await resp.json()
      console.log('Archive result:', JSON.stringify(result))
    }

    // * 发布到达预定时间的公告
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
