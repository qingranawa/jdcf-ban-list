export function fmtDate(t: string): string {
  if (!t) return '—'
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function typeBadge(t: string): string {
  const typeBadgeClass: Record<string, string> = {
    server: 'cyber-badge-cyan',
    penalty: 'cyber-badge-magenta',
    event: 'cyber-badge-green',
    urgent: 'cyber-badge-red',
    changelog: 'cyber-badge-amber',
    internal: 'cyber-badge-neutral',
  }
  return typeBadgeClass[t] || 'cyber-badge-cyan'
}

export function lvBadge(lv: string): string {
  const m: Record<string, string> = { warning: 'cyber-badge-amber', level3: 'cyber-badge-cyan', level2: 'cyber-badge-magenta', level1: 'cyber-badge-red', admin_discipline: 'cyber-badge-amber' }
  return m[lv] || 'cyber-badge-neutral'
}

export function lvLabel(lv: string): string {
  const m: Record<string, string> = {
    level1: '1级违规', level2: '2级违规', level3: '3级违规',
    level4: '4级违规', warning: '警告',
    admin_discipline: '违纪处罚',
  }
  return m[lv] || lv
}

export function stBadge(s: string): string {
  const m: Record<string, string> = { banned: 'cyber-badge-magenta', unbanned: 'cyber-badge-green', permanent: 'cyber-badge-red', muted: 'cyber-badge-amber', warning: 'cyber-badge-neutral', cfba: 'cyber-badge-neutral', admin_discipline: 'cyber-badge-amber' }
  return m[s] || 'cyber-badge-neutral'
}

export function fmtDuration(d: string): string {
  if (!d) return '—'
  const m: Record<string, string> = { m: '分钟', h: '小时', d: '天', y: '年', permanent: '永久', warning: '警告', cfba: 'CFBA', mute: '禁言' }
  if (d.startsWith('mute-')) return '禁言' + d.replace('mute-', '')
  if (m[d]) return m[d]
  const parts = d.match(/^(\d+)([dhmy])$/i)
  if (parts) return parts[1] + (m[parts[2].toLowerCase()] || '')
  // 违纪处罚类型
  if (d.startsWith('discipline_')) return disciplineLabel(d)
  return d
}

// 管理员违纪处罚 13 种类型
export const DISCIPLINE_TYPES: Record<string, string> = {
  discipline_demerit1: '记过',
  discipline_demerit2: '记大过（两次记过 = 一次记大过）',
  discipline_suspend1d: '停权1天',
  discipline_suspend3d: '停权3天',
  discipline_suspend7d: '停权7天',
  discipline_suspend30d: '停权30天',
  discipline_dismissal: '免除职务',
  discipline_review7d: '停权7天后经酌考究予以复职',
  discipline_review14d: '停权14天后经考究予以复职',
  discipline_review30d: '停权30天后经考究予以复职',
  discipline_perm_dismissal_lv2x3: '累计三次2级违规者，永久免职',
  discipline_perm_dismissal_lv1: '单次1级违规者，永久免职（申诉成功并经考究后可复职）',
  discipline_public_apology: '须对受影响的玩家及人员公开道歉',
}

export function disciplineLabel(code: string): string {
  return DISCIPLINE_TYPES[code] || code
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
