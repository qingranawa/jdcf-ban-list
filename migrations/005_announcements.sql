-- Announcements system: notices, scheduled publishing, read tracking
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subtitle TEXT,
  body TEXT NOT NULL,
  citation TEXT,
  type TEXT NOT NULL DEFAULT 'server',
  is_pinned INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0,
  publish_at TEXT,
  created_by INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES admins(id)
);
CREATE INDEX IF NOT EXISTS idx_ann_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_ann_published ON announcements(is_published);

CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id INTEGER NOT NULL,
  admin_id INTEGER NOT NULL,
  read_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (announcement_id, admin_id),
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);
