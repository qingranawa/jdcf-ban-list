export function fmtDate(t: string): string {
  if (!t) return '—'
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function lvBadge(lv: string): string {
  const m: Record<string, string> = { warning: 'cyber-badge-amber', level3: 'cyber-badge-cyan', level2: 'cyber-badge-magenta', level1: 'cyber-badge-red' }
  return m[lv] || 'cyber-badge-neutral'
}

export function stBadge(s: string): string {
  const m: Record<string, string> = { banned: 'cyber-badge-magenta', unbanned: 'cyber-badge-green', permanent: 'cyber-badge-red', muted: 'cyber-badge-amber', warning: 'cyber-badge-neutral', cfba: 'cyber-badge-neutral' }
  return m[s] || 'cyber-badge-neutral'
}

export function fmtDuration(d: string): string {
  if (!d) return '—'
  const m: Record<string, string> = { m: '分钟', h: '小时', d: '天', y: '年', permanent: '永久', warning: '警告', cfba: 'CFBA', mute: '禁言' }
  if (d.startsWith('mute-')) return '禁言' + d.replace('mute-', '')
  if (m[d]) return m[d]
  const parts = d.match(/^(\d+)([dhmy])$/i)
  if (parts) return parts[1] + (m[parts[2].toLowerCase()] || '')
  return d
}

export function categorizeDuration(d: string): string {
  if (/^(permanent|50[Yy])$/.test(d)) return '永久'
  if (d === 'warning') return '警告'
  if (d.startsWith('mute-')) return '禁言'
  if (d === 'cfba') return 'CFBA'
  const m = d.match(/^(\d+)([dhmy])$/i)
  if (!m) return '其他'
  const n = parseInt(m[1]), u = m[2].toLowerCase()
  if (u === 'm') return '分钟'
  if (u === 'h') return '小时'
  if (u === 'd') { if (n <= 7) return '1-7天'; if (n <= 30) return '8-30天'; return '30天以上' }
  if (u === 'y') return '1年以上'
  return '其他'
}

export const durCatColors: Record<string, string> = {
  '永久': '#ff3355', '警告': '#66ffcc', '禁言': '#ffb000', 'CFBA': '#ff00aa',
  '1-7天': '#00f0ff', '8-30天': '#00aaff', '30天以上': '#0066ff',
  '小时': '#8866ff', '分钟': '#cc66ff', '1年以上': '#ff66aa', '其他': '#888888',
}

const TYPE_LABELS: Record<string, string> = {
  server: '服务器公告', penalty: '处罚公告', event: '活动通知',
  urgent: '紧急通知', changelog: '更新日志', internal: '内部通知',
}
const TYPE_ICONS: Record<string, string> = {
  server: 'server', penalty: 'gavel', event: 'party-popper',
  urgent: 'bolt', changelog: 'file-text', internal: 'lock',
}
export function announcementTypeLabel(t: string): string { return TYPE_LABELS[t] || t }
export function announcementTypeIcon(t: string): string { return TYPE_ICONS[t] || 'server' }

export function fmtHandlers(name: string | null, co: string): string {
  const parts: string[] = []
  if (name) parts.push(name)
  if (co) co.split(',').map(s => s.trim()).filter(Boolean).forEach(s => parts.push(s))
  return parts.length ? parts.join(', ') : (name === null ? '系统' : '—')
}
