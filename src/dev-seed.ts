import type { D1Database } from '@cloudflare/workers-types'

const PW = '$2a$10$5zWP3EY4BBN4PlVabzEmAeAe3qxpQbIEwfbej.oJO0BPsaNGs4T9O'

const DROP_SQL = [
  'DROP TABLE IF EXISTS archive_items',
  'DROP TABLE IF EXISTS archives',
  'DROP TABLE IF EXISTS announcement_reads',
  'DROP TABLE IF EXISTS sessions',
  'DROP TABLE IF EXISTS audit_log',
  'DROP TABLE IF EXISTS bans',
  'DROP TABLE IF EXISTS watchlist',
  'DROP TABLE IF EXISTS announcements',
  'DROP TABLE IF EXISTS login_attempts',
  'DROP TABLE IF EXISTS admins',
]

const CREATE_SQL = [
  `CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT, steam_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
    permission_group TEXT NOT NULL DEFAULT 'T1', game_name TEXT NOT NULL DEFAULT '',
    qq_name TEXT NOT NULL DEFAULT '', position TEXT NOT NULL DEFAULT '',
    supervisor TEXT NOT NULL DEFAULT '', is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS bans (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT NOT NULL,
    steam_id TEXT NOT NULL, ip_address TEXT NOT NULL DEFAULT '',
    reason TEXT NOT NULL DEFAULT '', ban_time TEXT NOT NULL DEFAULT (datetime('now')),
    ban_duration TEXT NOT NULL, violation_level TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '', handled_by INTEGER,
    co_handlers TEXT NOT NULL DEFAULT '', is_archived INTEGER NOT NULL DEFAULT 0,
    archive_action TEXT, archived_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT, steam_id TEXT NOT NULL,
    nickname TEXT NOT NULL DEFAULT '', reason TEXT NOT NULL DEFAULT '',
    added_by INTEGER, notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS archives (
    id INTEGER PRIMARY KEY AUTOINCREMENT, archive_date TEXT NOT NULL UNIQUE,
    total_processed INTEGER NOT NULL DEFAULT 0, l3_deleted INTEGER NOT NULL DEFAULT 0,
    l2_downgraded INTEGER NOT NULL DEFAULT 0, l1_ignored INTEGER NOT NULL DEFAULT 0,
    l4_ignored INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS archive_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, archive_id INTEGER NOT NULL,
    ban_id INTEGER NOT NULL, nickname TEXT NOT NULL, steam_id TEXT NOT NULL,
    original_level TEXT NOT NULL, new_level TEXT, action TEXT NOT NULL,
    original_status TEXT NOT NULL, original_duration TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id INTEGER NOT NULL,
    token_jti TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS login_attempts (
    ip TEXT NOT NULL, attempted_at INTEGER NOT NULL,
    PRIMARY KEY (ip, attempted_at))`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id INTEGER NOT NULL,
    action TEXT NOT NULL, target_type TEXT NOT NULL, target_id INTEGER,
    detail TEXT, created_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, subtitle TEXT,
    body TEXT NOT NULL, citation TEXT, type TEXT NOT NULL DEFAULT 'server',
    is_pinned INTEGER DEFAULT 0, is_published INTEGER DEFAULT 0,
    publish_at TEXT, created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS announcement_reads (
    announcement_id INTEGER NOT NULL, admin_id INTEGER NOT NULL,
    read_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (announcement_id, admin_id))`,
]

const INDEX_SQL = [
  'CREATE INDEX IF NOT EXISTS idx_bans_steam_id ON bans(steam_id)',
  'CREATE INDEX IF NOT EXISTS idx_bans_violation_level ON bans(violation_level)',
  'CREATE INDEX IF NOT EXISTS idx_bans_handled_by ON bans(handled_by)',
  'CREATE INDEX IF NOT EXISTS idx_bans_is_archived ON bans(is_archived)',
  'CREATE INDEX IF NOT EXISTS idx_admins_permission_group ON admins(permission_group)',
  'CREATE INDEX IF NOT EXISTS idx_archive_items_archive_id ON archive_items(archive_id)',
  'CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip)',
  'CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON audit_log(admin_id)',
  'CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action)',
  'CREATE INDEX IF NOT EXISTS idx_ann_type ON announcements(type)',
  'CREATE INDEX IF NOT EXISTS idx_ann_published ON announcements(is_published)',
]

function ago(offset: string): string {
  const m = offset.match(/^(-?\d+) (hour|day|minute)s?$/)
  if (!m) return new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
  const n = parseInt(m[1])
  const ms: Record<string, number> = { hour: 3600000, day: 86400000, minute: 60000 }
  return new Date(Date.now() + n * ms[m[2]]).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
}

export async function seedDatabase(db: D1Database): Promise<void> {
  for (const sql of DROP_SQL) await db.prepare(sql).run()
  for (const sql of CREATE_SQL) await db.prepare(sql).run()
  for (const sql of INDEX_SQL) await db.prepare(sql).run()

  const ADMINS: [number, string, string, string, string, string, string, string][] = [
    [1, '76561198000000001', 'admin', PW, 'OWNER', '开发者', '系统管理员', ''],
    [2, '76561198000000002', 'mod1', PW, 'T1', '封禁管理员', '高级管理', 'admin'],
    [3, '76561198000000003', 'junior1', PW, 'T4', '初级管理', '初级管理', 'mod1'],
  ]
  for (const [id, sid, un, pw, pg, gn, pos, sup] of ADMINS) {
    await db.prepare(
      'INSERT INTO admins (id, steam_id, username, password_hash, permission_group, game_name, position, supervisor) VALUES (?,?,?,?,?,?,?,?)'
    ).bind(id, sid, un, pw, pg, gn, pos, sup).run()
  }

  interface BanSeed {
    n: string; s: string; i: string; r: string; t: string; d: string; l: string; h: number;
    c?: string; a?: number; aa?: string; note?: string
  }
  const BANS: BanSeed[] = [
    { n: 'CheaterPro',     s: '76561198000000011', i: '192.168.1.1', r: '使用透视自瞄外挂，经多次警告无效',           t: '-2 hours',   d: 'permanent', l: 'level1', h: 1 },
    { n: 'WallHack_99',    s: '76561198000000012', i: '10.0.0.1',    r: '透视违规',                                     t: '-7 days',    d: '30d',       l: 'level2', h: 1, c: '开发者' },
    { n: 'ToxicPlayer',    s: '76561198000000013', i: '172.16.0.1',  r: '辱骂管理/队友/对方，持续恶意行为',               t: '-3 days',    d: '7d',        l: 'level3', h: 2 },
    { n: 'VoiceAbuse',     s: '76561198000000014', i: '',            r: '语音频道持续骚扰其他玩家',                     t: '-1 day',     d: 'mute-7d',   l: 'level3', h: 2 },
    { n: 'NewPlayer',      s: '76561198000000015', i: '',            r: '首次违规，给予警告',                           t: '-15 days',   d: 'warning',   l: 'warning', h: 3 },
    { n: 'SpinBot_22',     s: '76561198000000016', i: '',            r: '自瞄锁头，异常旋转行为',                       t: '-6 hours',   d: 'cfba',      l: 'level1', h: 1 },
    { n: 'OldToxic',       s: '76561198000000017', i: '',            r: '历史违规记录',                                 t: '-30 days',   d: '7d',        l: 'level3', h: 2 },
    { n: 'Evader_X',       s: '76561198000000018', i: '',            r: '使用代理绕过已有封禁',                         t: '-5 days',    d: 'permanent', l: 'level4', h: 1 },
    { n: 'DeletedPlayer',  s: '76561198000000019', i: '',            r: '已处理归档的违规',                             t: '-60 days',   d: '30d',       l: 'level2', h: 1, a: 1, aa: 'deleted' },
    { n: 'ExtraArc1',      s: '76561198000000021', i: '',            r: '归档测试',                                     t: '-50 days',   d: '7d',        l: 'level3', h: 2, a: 1, aa: 'deleted' },
    { n: 'ExtraArc2',      s: '76561198000000022', i: '',            r: '归档测试2',                                    t: '-45 days',   d: '14d',       l: 'level3', h: 2, a: 1, aa: 'deleted' },
    { n: 'ExtraArc3',      s: '76561198000000023', i: '',            r: '二级过期归档',                                 t: '-40 days',   d: '7d',        l: 'level3', h: 2, a: 1, aa: 'deleted' },
    { n: 'DowngradedPlayer', s: '76561198000000024', i: '',          r: '曾被降级处理',                                 t: '-25 days',   d: '30d',       l: 'level3', h: 1 },
  ]
  for (const b of BANS) {
    await db.prepare(
      `INSERT INTO bans (nickname, steam_id, ip_address, reason, ban_time, ban_duration, violation_level, handled_by, co_handlers, is_archived, archive_action, archived_at, notes)
       VALUES (?,?,?,?, ?,?,?,?,?,?,?,?,?)`
    ).bind(
      b.n, b.s, b.i, b.r, ago(b.t), b.d, b.l, b.h, b.c || '',
      b.a || 0, b.aa || null,
      b.aa ? ago('-1 hour') : null,
      b.note || ''
    ).run()
  }

  const ANN: { id: number; title: string; sub: string; body: string; cite: string; type: string; pin: number; pub: number; by: number; pa: string | null }[] = [
    { id: 1, title: '服务器维护通知', sub: '7月10日停机维护', body: '服务器将于7月10日凌晨2:00-6:00进行例行维护。', cite: '', type: 'server', pin: 1, pub: 1, by: 1, pa: ago('-1 day') },
    { id: 2, title: '封禁标准更新公告', sub: 'v2.1 封禁标准细则', body: '即日起，一级违规最低封禁时长调整为永久封禁。', cite: '管理组全体通过', type: 'penalty', pin: 1, pub: 1, by: 1, pa: ago('-3 days') },
    { id: 3, title: '社区杯赛报名通知', sub: '2026年夏季赛', body: '社区杯赛现已开放报名，请各战队队长在7月20日前提交参赛名单。', cite: '', type: 'event', pin: 0, pub: 1, by: 1, pa: ago('-5 days') },
    { id: 4, title: '紧急安全公告', sub: 'Steam API 变更影响', body: 'Steam API 版本更新，部分查询功能可能暂时不可用。技术团队正在紧急修复。', cite: '', type: 'urgent', pin: 0, pub: 1, by: 1, pa: ago('-12 hours') },
    { id: 5, title: '更新日志 v3.2', sub: '新增批量操作功能', body: 'v3.2 更新内容：\n1. 新增批量处理过期违规\n2. 优化归档检索性能\n3. 修复搜索分页问题', cite: 'CHANGELOG', type: 'changelog', pin: 0, pub: 1, by: 1, pa: ago('-10 days') },
    { id: 6, title: '内部通知：排班调整', sub: '', body: '下月起值班安排有调整，请所有管理查看新排班表。', cite: '', type: 'internal', pin: 0, pub: 1, by: 1, pa: ago('-2 days') },
    { id: 7, title: '草稿公告', sub: '尚未发布', body: '这是一条尚未发布的草稿公告。', cite: '', type: 'server', pin: 0, pub: 0, by: 1, pa: null },
  ]
  for (const a of ANN) {
    await db.prepare(
      'INSERT INTO announcements (id, title, subtitle, body, citation, type, is_pinned, is_published, publish_at, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).bind(a.id, a.title, a.sub, a.body, a.cite, a.type, a.pin, a.pub, a.pa, a.by).run()
  }

  await db.prepare("INSERT INTO announcement_reads (announcement_id, admin_id, read_at) VALUES (?, 1, datetime('now'))").bind(ANN[0].id).run()
  await db.prepare("INSERT INTO announcement_reads (announcement_id, admin_id, read_at) VALUES (?, 2, datetime('now'))").bind(ANN[0].id).run()

  const WL: { sid: string; n: string; r: string; by: number; note: string }[] = [
    { sid: '76561198000000101', n: '可疑玩家_A', r: '疑似使用微自瞄', by: 1, note: '多次进入不同服务器，K/D 异常偏高，建议观察' },
    { sid: '76561198000000102', n: '惯犯_B', r: '多次被举报语言攻击', by: 2, note: '已有三次违规记录' },
  ]
  for (const w of WL) {
    await db.prepare('INSERT INTO watchlist (steam_id, nickname, reason, added_by, notes) VALUES (?,?,?,?,?)').bind(w.sid, w.n, w.r, w.by, w.note).run()
  }

  await db.prepare("INSERT INTO archives (id, archive_date, total_processed, l3_deleted, l2_downgraded) VALUES (1, datetime('now', '-14 days'), 4, 4, 0)").run()
  await db.prepare("INSERT INTO archives (id, archive_date, total_processed, l3_deleted, l2_downgraded) VALUES (2, datetime('now', '-7 days'), 2, 1, 1)").run()

  const AI: { aid: number; bid: number; n: string; s: string; ol: string; nl: string | null; act: string; os: string; od: string }[] = [
    { aid: 1, bid: 9,  n: 'DeletedPlayer',  s: '76561198000000019', ol: 'level2', nl: null,    act: 'deleted',    os: 'unbanned', od: '30d' },
    { aid: 1, bid: 10, n: 'ExtraArc1',      s: '76561198000000021', ol: 'level3', nl: null,    act: 'deleted',    os: 'unbanned', od: '7d' },
    { aid: 1, bid: 11, n: 'ExtraArc2',      s: '76561198000000022', ol: 'level3', nl: null,    act: 'deleted',    os: 'unbanned', od: '14d' },
    { aid: 1, bid: 12, n: 'ExtraArc3',      s: '76561198000000023', ol: 'level3', nl: null,    act: 'restored',   os: 'unbanned', od: '7d' },
    { aid: 2, bid: 12, n: 'ExtraArc3',      s: '76561198000000023', ol: 'level3', nl: null,    act: 'deleted',    os: 'unbanned', od: '7d' },
    { aid: 2, bid: 13, n: 'DowngradedPlayer', s: '76561198000000024', ol: 'level2', nl: 'level3', act: 'downgraded', os: 'unbanned', od: '30d' },
  ]
  for (const ai of AI) {
    await db.prepare(
      'INSERT INTO archive_items (archive_id, ban_id, nickname, steam_id, original_level, new_level, action, original_status, original_duration) VALUES (?,?,?,?,?,?,?,?,?)'
    ).bind(ai.aid, ai.bid, ai.n, ai.s, ai.ol, ai.nl, ai.act, ai.os, ai.od).run()
  }

  const LOG: { aid: number; act: string; tgt: string; tid: number | null; det: string }[] = [
    { aid: 1, act: 'create_ban', tgt: 'ban', tid: 1, det: '昵称: CheaterPro, Steam: 76561198000000011' },
    { aid: 1, act: 'admin_create', tgt: 'admin', tid: 2, det: '用户名: mod1' },
    { aid: 1, act: 'create_ban', tgt: 'ban', tid: 8, det: '昵称: Evader_X, Steam: 76561198000000018' },
  ]
  for (const l of LOG) {
    await db.prepare('INSERT INTO audit_log (admin_id, action, target_type, target_id, detail) VALUES (?,?,?,?,?)').bind(l.aid, l.act, l.tgt, l.tid, l.det).run()
  }
}
