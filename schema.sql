-- 封禁表
CREATE TABLE IF NOT EXISTS bans (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname        TEXT NOT NULL,
  steam_id        TEXT NOT NULL,
  ip_address      TEXT NOT NULL DEFAULT '',
  reason          TEXT NOT NULL DEFAULT '',
  ban_time        TEXT NOT NULL DEFAULT (datetime('now')),
  ban_duration    TEXT NOT NULL,
  violation_level TEXT NOT NULL,
  notes           TEXT NOT NULL DEFAULT '',
  handled_by      INTEGER,
  is_archived     INTEGER NOT NULL DEFAULT 0,
  archive_action  TEXT,
  archived_at     TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (handled_by) REFERENCES admins(id)
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  steam_id         TEXT NOT NULL UNIQUE,
  username         TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  permission_group TEXT NOT NULL DEFAULT 'T1',
  game_name        TEXT NOT NULL DEFAULT '',
  qq_name          TEXT NOT NULL DEFAULT '',
  position         TEXT NOT NULL DEFAULT '',
  supervisor       TEXT NOT NULL DEFAULT '',
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 黑名单总表
CREATE TABLE IF NOT EXISTS blacklist (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  steam_id        TEXT NOT NULL UNIQUE,
  nickname        TEXT NOT NULL,
  ip_address      TEXT NOT NULL DEFAULT '',
  ban_count       INTEGER NOT NULL DEFAULT 1,
  first_ban_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_ban_at     TEXT NOT NULL DEFAULT (datetime('now')),
  latest_violation_level TEXT NOT NULL DEFAULT 'warning',
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 归档摘要表
CREATE TABLE IF NOT EXISTS archives (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_date     TEXT NOT NULL UNIQUE,
  total_processed  INTEGER NOT NULL DEFAULT 0,
  l3_deleted       INTEGER NOT NULL DEFAULT 0,
  l2_downgraded    INTEGER NOT NULL DEFAULT 0,
  l1_ignored       INTEGER NOT NULL DEFAULT 0,
  l4_ignored       INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 归档明细表
CREATE TABLE IF NOT EXISTS archive_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_id       INTEGER NOT NULL,
  ban_id           INTEGER NOT NULL,
  nickname         TEXT NOT NULL,
  steam_id         TEXT NOT NULL,
  original_level   TEXT NOT NULL,
  new_level        TEXT,
  action           TEXT NOT NULL,
  original_status  TEXT NOT NULL,
  original_duration TEXT NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (archive_id) REFERENCES archives(id),
  FOREIGN KEY (ban_id) REFERENCES bans(id)
);

-- Session 表
CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   INTEGER NOT NULL,
  token_jti  TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bans_steam_id ON bans(steam_id);
CREATE INDEX IF NOT EXISTS idx_bans_violation_level ON bans(violation_level);
CREATE INDEX IF NOT EXISTS idx_bans_handled_by ON bans(handled_by);
CREATE INDEX IF NOT EXISTS idx_bans_is_archived ON bans(is_archived);
CREATE INDEX IF NOT EXISTS idx_admins_permission_group ON admins(permission_group);
CREATE INDEX IF NOT EXISTS idx_blacklist_steam_id ON blacklist(steam_id);
CREATE INDEX IF NOT EXISTS idx_archive_items_archive_id ON archive_items(archive_id);
